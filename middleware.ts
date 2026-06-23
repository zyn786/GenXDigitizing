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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Always allow ─────────────────────────────────────────
  if (
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron")     ||  // cron endpoints secured by x-cron-secret
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
    const hasSession = request.cookies.getAll().some(c => c.name.startsWith("sb-"));
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
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // session cookie invalid or refresh token expired — treat as logged out
  }

  // ── Not logged in → protect portal routes and API routes ──
  if (!user) {
    if (isPortalRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (isAdminApiRoute || isCrmApiRoute || isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
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
