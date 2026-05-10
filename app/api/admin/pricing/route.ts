import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity/logger";

const tierSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  basePrice: z.number().min(0),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const categorySchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  tiers: z.array(tierSchema),
});

const bodySchema = z.object({
  categories: z.array(categorySchema),
  addons: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    price: z.number().min(0),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
  delivery: z.array(z.object({
    key: z.string().min(1),
    label: z.string().min(1),
    subLabel: z.string().optional(),
    extraPrice: z.number().min(0),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })).optional(),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") return NextResponse.json({ ok: false }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid data." }, { status: 400 });
  }

  const { categories, addons, delivery } = parsed.data;

  // Capture before-state for audit trail.
  const beforeCategories = await prisma.serviceCategory.findMany({
    include: { tiers: true },
    orderBy: { sortOrder: "asc" },
  });
  const beforeSnapshot = beforeCategories.map((c) => ({
    key: c.key,
    label: c.label,
    tiers: c.tiers.map((t) => ({ key: t.key, label: t.label, basePrice: Number(t.basePrice) })),
  }));

  // Upsert categories and tiers
  for (const cat of categories) {
    const dbCat = await prisma.serviceCategory.upsert({
      where: { key: cat.key },
      create: {
        key: cat.key,
        label: cat.label,
        emoji: cat.emoji ?? null,
        description: cat.description ?? null,
        isActive: cat.isActive ?? true,
        sortOrder: cat.sortOrder ?? 0,
      },
      update: {
        label: cat.label,
        emoji: cat.emoji ?? null,
        description: cat.description ?? null,
        isActive: cat.isActive ?? true,
        sortOrder: cat.sortOrder ?? 0,
      },
    });

    for (const tier of cat.tiers) {
      await prisma.serviceTier.upsert({
        where: { categoryId_key: { categoryId: dbCat.id, key: tier.key } },
        create: {
          categoryId: dbCat.id,
          key: tier.key,
          label: tier.label,
          basePrice: tier.basePrice,
          isActive: tier.isActive ?? true,
          sortOrder: tier.sortOrder ?? 0,
        },
        update: {
          label: tier.label,
          basePrice: tier.basePrice,
          isActive: tier.isActive ?? true,
          sortOrder: tier.sortOrder ?? 0,
        },
      });
    }
  }

  if (addons) {
    for (const addon of addons) {
      await prisma.serviceAddon.upsert({
        where: { key: addon.key },
        create: { key: addon.key, label: addon.label, price: addon.price, isActive: addon.isActive ?? true, sortOrder: addon.sortOrder ?? 0 },
        update: { label: addon.label, price: addon.price, isActive: addon.isActive ?? true, sortOrder: addon.sortOrder ?? 0 },
      });
    }
  }

  if (delivery) {
    for (const opt of delivery) {
      await prisma.deliveryOption.upsert({
        where: { key: opt.key },
        create: { key: opt.key, label: opt.label, subLabel: opt.subLabel ?? null, extraPrice: opt.extraPrice, isActive: opt.isActive ?? true, sortOrder: opt.sortOrder ?? 0 },
        update: { label: opt.label, subLabel: opt.subLabel ?? null, extraPrice: opt.extraPrice, isActive: opt.isActive ?? true, sortOrder: opt.sortOrder ?? 0 },
      });
    }
  }

  const afterSnapshot = categories.map((c) => ({
    key: c.key,
    label: c.label,
    tiers: c.tiers.map((t) => ({ key: t.key, label: t.label, basePrice: t.basePrice })),
  }));

  await logActivity({
    actor: { id: session.user.id, email: session.user.email, role: session.user.role },
    action: "pricing.updated",
    entityType: "Pricing",
    metadata: {
      categoriesCount: categories.length,
      before: beforeSnapshot,
      after: afterSnapshot,
    },
  });

  return NextResponse.json({ ok: true });
}
