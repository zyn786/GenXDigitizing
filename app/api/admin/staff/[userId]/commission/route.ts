import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ userId: string }> };

export async function GET(_req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { userId } = await params;
  const profile = await prisma.staffProfile.findUnique({
    where: { userId },
    select: { commissionType: true, commissionRate: true },
  });
  if (!profile) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  return NextResponse.json({
    ok: true,
    commissionType: profile.commissionType,
    commissionRate: Number(profile.commissionRate),
  });
}

const patchSchema = z.object({
  commissionType: z.enum(["PERCENTAGE", "FLAT_RATE"]),
  commissionRate: z.number().min(0).max(100000),
});

export async function PATCH(req: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });

  const profile = await prisma.staffProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ ok: false, message: "Staff profile not found." }, { status: 404 });

  await prisma.staffProfile.update({
    where: { userId },
    data: { commissionType: parsed.data.commissionType, commissionRate: parsed.data.commissionRate },
  });

  return NextResponse.json({ ok: true });
}
