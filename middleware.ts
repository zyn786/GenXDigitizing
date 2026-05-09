import { NextResponse } from "next/server";

import { auth } from "@/auth";

const ADMIN_PATHS = ["/admin"];
const CLIENT_PATHS = ["/client"];
const ADMIN_API_PATHS = ["/api/admin", "/api/designer"];
const CLIENT_API_PATHS = ["/api/client"];

const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "MANAGER",
  "DESIGNER",
  "CHAT_SUPPORT",
  "MARKETING",
]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role as string | undefined;

  // Protect admin UI routes
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!ADMIN_ROLES.has(role ?? "")) {
      const url = req.nextUrl.clone();
      url.pathname = "/client/orders";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Protect client UI routes
  if (CLIENT_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect admin API routes — return 401/403 at edge
  if (ADMIN_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }
    if (!ADMIN_ROLES.has(role ?? "")) {
      return NextResponse.json(
        { ok: false, message: "Forbidden." },
        { status: 403 }
      );
    }
  }

  // Protect client API routes — return 401 at edge
  if (CLIENT_API_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/client/:path*",
    "/api/admin/:path*",
    "/api/client/:path*",
    "/api/designer/:path*",
  ],
};
