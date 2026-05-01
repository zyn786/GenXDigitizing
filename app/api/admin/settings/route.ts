import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const ALLOWED_KEYS = ["admin_proof_review_enabled"] as const;
type SettingKey = (typeof ALLOWED_KEYS)[number];

const updateSchema = z.object({
  key: z.enum(ALLOWED_KEYS),
  value: z.string(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const configs = await prisma.pricingConfig.findMany({
    where: { key: { in: ALLOWED_KEYS as unknown as string[] } },
    select: { key: true, value: true, label: true, description: true },
  });

  const defaults: Record<SettingKey, string> = {
    admin_proof_review_enabled: "true",
  };

  const settings = ALLOWED_KEYS.reduce((acc, key) => {
    const found = configs.find((c) => c.key === key);
    acc[key] = found?.value ?? defaults[key];
    return acc;
  }, {} as Record<SettingKey, string>);

  return NextResponse.json({ ok: true, settings });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ ok: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const { key, value } = parsed.data;

  const labelMap: Record<SettingKey, { label: string; description: string }> = {
    admin_proof_review_enabled: {
      label: "Admin review before proof sent",
      description:
        "When ON, designer proofs must be approved by an admin/manager before being sent to the client.",
    },
  };

  await prisma.pricingConfig.upsert({
    where: { key },
    create: {
      key,
      value,
      label: labelMap[key].label,
      description: labelMap[key].description,
      updatedByUserId: session.user.id,
    },
    update: {
      value,
      updatedByUserId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
