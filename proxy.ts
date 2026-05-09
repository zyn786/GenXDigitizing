import { NextResponse } from "next/server";
import { auth } from "@/auth";

/* ── Role-based route protection ────────────────────────────── */

const CHAT_SUPPORT_ALLOWED = new Set([
  "/admin/support",
  "/admin/notifications",
]);

const MARKETING_ALLOWED = new Set([
  "/admin/marketing",
  "/admin/marketing/campaigns",
  "/admin/portfolio",
  "/admin/notifications",
]);

function isDesignerAllowed(pathname: string): boolean {
  if (pathname.startsWith("/admin/designer")) return true;
  if (pathname.startsWith("/admin/notifications")) return true;
  if (pathname.startsWith("/admin/support")) return true;
  return false;
}

function isChatSupportAllowed(pathname: string): boolean {
  for (const allowed of CHAT_SUPPORT_ALLOWED) {
    if (pathname.startsWith(allowed)) return true;
  }
  return false;
}

function isMarketingAllowed(pathname: string): boolean {
  for (const allowed of MARKETING_ALLOWED) {
    if (pathname.startsWith(allowed)) return true;
  }
  return false;
}

const ADMIN_API_PATHS = ["/api/admin", "/api/designer"];
const CLIENT_API_PATHS = ["/api/client"];

const FULL_ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "MANAGER",
  "DESIGNER",
  "CHAT_SUPPORT",
  "MARKETING",
]);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;
  const role = session?.user?.role;

  // Protect admin API routes at edge
  if (ADMIN_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }
    if (!FULL_ADMIN_ROLES.has(role ?? "")) {
      return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
    }
  }

  // Protect client API routes at edge
  if (CLIENT_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }
  }

  const isClientRoute = pathname.startsWith("/client");
  const isAdminRoute = pathname.startsWith("/admin");

  // Unauthenticated — redirect to login
  if ((isClientRoute || isAdminRoute) && !session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Client trying to access admin
  if (isAdminRoute && role === "CLIENT") {
    return NextResponse.redirect(new URL("/client/dashboard", req.url));
  }

  // DESIGNER restrictions
  if (role === "DESIGNER" && isAdminRoute) {
    if (!isDesignerAllowed(pathname)) {
      return NextResponse.redirect(new URL("/admin/designer", req.url));
    }
  }

  // CHAT_SUPPORT restrictions
  if (role === "CHAT_SUPPORT" && isAdminRoute) {
    if (!isChatSupportAllowed(pathname)) {
      return NextResponse.redirect(new URL("/admin/support", req.url));
    }
  }

  // MARKETING restrictions
  if (role === "MARKETING" && isAdminRoute) {
    if (!isMarketingAllowed(pathname)) {
      return NextResponse.redirect(new URL("/admin/marketing", req.url));
    }
  }

  // Inject pathname as request header so server components can read it
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/client/:path*",
    "/admin/:path*",
    "/portal/:path*",
    "/designer/:path*",
    "/manager/:path*",
    "/marketing/:path*",
    "/chat-support/:path*",
    "/api/admin/:path*",
    "/api/client/:path*",
    "/api/designer/:path*",
  ],
};
