import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const COMPANY_DOMAIN = "genxdigitizing.com";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  emailPrefix: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9._-]+$/i, "Only letters, numbers, dots, hyphens, and underscores"),
  role: z.enum(["MANAGER", "DESIGNER", "CHAT_SUPPORT", "MARKETING"]),
  department: z.string().max(80).optional(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const { name, emailPrefix, role, department, password } = parsed.data;

  const email = `${emailPrefix.toLowerCase()}@${COMPANY_DOMAIN}`;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { ok: false, message: `${email} is already in use.` },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      emailVerified: new Date(),
      isActive: true,
      staffProfile: {
        create: {
          displayName: name,
          department: department ?? null,
        },
      },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, user }, { status: 201 });
}
