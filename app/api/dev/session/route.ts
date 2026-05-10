import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, type DemoCookieRole } from "@/lib/auth/session";

// This endpoint only exists in development. Requires explicit opt-in via env var.
const isDev = process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_SESSION === "true";

export async function POST(request: Request) {
  if (!isDev) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = (await request.json()) as { role?: DemoCookieRole };
  const role = body.role;

  if (role !== "client" && role !== "admin") {
    return NextResponse.json({ error: "Invalid demo role" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });

  return NextResponse.json({ ok: true, role });
}

export async function DELETE() {
  if (!isDev) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  return NextResponse.json({ ok: true });
}