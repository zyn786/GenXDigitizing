// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/*
  RULES:
  1. /admin, /crm, /client, /designer  → must be authenticated + correct role
  2. /login, /register, /forgot-password → redirect to portal if already logged in
  3. /api/webhooks/* → always allow (Payoneer, etc.)
  4. Everything else → allow
*/

const PORTAL_HOME: Record<string, string> = {
  admin:    "/admin",
  crm:      "/crm",
  client:   "/client",
  designer: "/designer",
};

const PORTAL_PREFIXES = ["/admin", "/crm", "/client", "/designer"];
const AUTH_PAGES      = ["/login", "/register", "/forgot-password"];

// ── Stale session cookie cleanup ───────────────────────────
// Project ref of the configured Supabase instance. @supabase/ssr stores its
// session as `sb-<ref>-auth-token` (+ .0/.1 chunks, -code-verifier), so any
// other `sb-*` cookie is a leftover from a different Supabase project.
// localhost accumulates those across projects.
const SUPABASE_REF = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
})();

const isAuthCookie = (name: string) => name.startsWith("sb-");

function isForeignAuthCookie(name: string) {
  if (!SUPABASE_REF) return false; // env missing — never guess, never wipe
  return isAuthCookie(name) && !name.startsWith(`sb-${SUPABASE_REF}-`);
}

function authCookieNames(request: NextRequest) {
  return request.cookies.getAll().map(c => c.name).filter(isAuthCookie);
}

function dropCookies(response: NextResponse, names: string[]) {
  names.forEach(name => response.cookies.set(name, "", { path: "/", maxAge: 0 }));
  return response;
}

/**
 * Only a definitive auth rejection may clear a session. Network failures
 * (status 0) and 5xx are retryable — clearing on those would sign users out
 * during a Supabase blip.
 */
function isDefinitiveAuthFailure(error: any) {
  if (!error) return false; // no session stored at all — nothing to clear
  const status = typeof error.status === "number" ? error.status : 0;
  if (status === 400 || status === 401 || status === 403) return true;
  return error.name === "AuthSessionMissingError"; // cookie present but unreadable
}

export async function middleware(request: NextRequest) {
  const response = await handleRequest(request);

  // Drop foreign-project cookies on every route (public ones included) — cheap,
  // no network call. Without this a dead `sb-*` cookie from another project
  // survives forever on localhost.
  const foreign = request.cookies.getAll().map(c => c.name).filter(isForeignAuthCookie);
  return foreign.length ? dropCookies(response, foreign) : response;
}

async function handleRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Always allow ─────────────────────────────────────────
  if (
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron")     ||  // cron endpoints secured by x-cron-secret
    pathname.startsWith("/api/admin/email-inbound") || // Resend webhook — unauthenticated
    pathname.startsWith("/_next")        ||
    pathname.startsWith("/favicon")      ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|map)$/)
  ) {
    return NextResponse.next();
  }

  // ── Block /debug in production ────────────────────────────
  if (pathname === "/debug" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // ── API route protection ──────────────────────────────────
  const isApiRoute = pathname.startsWith("/api/");
  const isAdminApiRoute = pathname.startsWith("/api/admin/");
  const isCrmApiRoute = pathname.startsWith("/api/crm/");
  // Auth/chat endpoints that need at minimum authentication
  const isProtectedApi = pathname.startsWith("/api/auth/auto-confirm") ||
                         pathname.startsWith("/api/auth/send-welcome") ||
                         pathname.startsWith("/api/chat/upload") ||
                         pathname.startsWith("/api/review-notify") ||
                         pathname.startsWith("/api/message-notify") ||
                         pathname.startsWith("/api/chat/notify");

  // ── Auth check only for portal + auth routes ───────────────
  const isPortalRoute = PORTAL_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage    = AUTH_PAGES.some(p => pathname.startsWith(p));

  // Root page: rewrite to /home for anonymous users (saves one redirect round-trip).
  // Logged-in users still hit app/page.tsx for role-based portal redirect.
  if (pathname === "/") {
    const hasSession = request.cookies.getAll()
      .some(c => isAuthCookie(c.name) && !isForeignAuthCookie(c.name));
    if (!hasSession) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }
    // Let app/page.tsx handle the role-based redirect for logged-in users
    return NextResponse.next();
  }

  // Public page — skip auth entirely, respond immediately
  // BUT: admin/crm API routes and protected endpoints still need auth
  if (!isPortalRoute && !isAuthPage && !isAdminApiRoute && !isCrmApiRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  // ── Build response + Supabase client for protected routes ──
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — MUST call getUser() not getSession()
  // Catch stale/invalid refresh tokens to prevent unhandled errors
  let user = null;
  let authFailedHard = false;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    if (!user) authFailedHard = isDefinitiveAuthFailure(error);
  } catch {
    // session cookie invalid or refresh token expired — treat as logged out.
    // Thrown errors are network/parse failures, so never definitive.
  }

  // ── Not logged in → protect portal routes and API routes ──
  if (!user) {
    // Dead session (refresh token rejected) → clear the cookies so the browser
    // stops replaying them on every subsequent request.
    const dead = authFailedHard ? authCookieNames(request) : [];

    if (isPortalRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return dropCookies(NextResponse.redirect(url), dead);
    }
    if (isAdminApiRoute || isCrmApiRoute || isProtectedApi) {
      return dropCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), dead);
    }
    return dropCookies(response, dead);
  }

  // ── Logged in ────────────────────────────────────────────
  if (user) {
    // Fetch role when needed (portal, auth, or protected API routes)
    if (isPortalRoute || isAuthPage || isAdminApiRoute || isCrmApiRoute || isProtectedApi) {
      const { data: profile } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      const role = profile?.role as string | undefined;

      // Deactivated account → boot to login (portals) or 403 (API)
      if (profile && !profile.is_active) {
        if (isPortalRoute) {
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          url.searchParams.set("error", "account_disabled");
          return NextResponse.redirect(url);
        }
        if (isAdminApiRoute || isCrmApiRoute || isProtectedApi) {
          return NextResponse.json({ error: "Account disabled" }, { status: 403 });
        }
      }

      // ── API route role enforcement ──────────────────────
      if (isAdminApiRoute) {
        if (role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return response; // admin authorized, let route handler run
      }

      if (isCrmApiRoute) {
        if (role !== "admin" && role !== "crm") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return response; // crm/admin authorized
      }

      if (isProtectedApi) {
        // Any authenticated user with a valid role is allowed
        if (!role) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return response;
      }

      // On auth page while logged in → redirect to portal
      if (isAuthPage && role) {
        const dest = PORTAL_HOME[role] ?? "/client";
        return NextResponse.redirect(new URL(dest, request.url));
      }

      // On wrong portal → redirect to correct one (admin can access all)
      if (isPortalRoute && role && role !== "admin") {
        const correctPortal = PORTAL_HOME[role];
        if (correctPortal && !pathname.startsWith(correctPortal)) {
          return NextResponse.redirect(new URL(correctPortal, request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  // Run on all routes EXCEPT Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
