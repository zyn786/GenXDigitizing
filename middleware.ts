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

  // ── Auth check only for portal + auth routes ───────────────
  const isPortalRoute = PORTAL_PREFIXES.some(p => pathname.startsWith(p));
  const isAuthPage    = AUTH_PAGES.some(p => pathname.startsWith(p));

  // Public page — skip auth entirely, respond immediately
  if (!isPortalRoute && !isAuthPage) {
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
  const { data: { user } } = await supabase.auth.getUser();

  // ── Not logged in → protect portal routes ────────────────
  if (!user && isPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── Logged in ────────────────────────────────────────────
  if (user) {
    // Fetch role (only when needed)
    if (isPortalRoute || isAuthPage) {
      const { data: profile } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      const role = profile?.role as string | undefined;

      // Deactivated account → boot to login
      if (profile && !profile.is_active && isPortalRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "account_disabled");
        return NextResponse.redirect(url);
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
