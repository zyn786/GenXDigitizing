import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_PRICING_CATALOG } from "@/lib/pricing/catalog";
import type { PricingCatalog } from "@/lib/pricing/catalog";

export const revalidate = 3600;

export async function GET() {
  try {
    const [categories, addons, delivery] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          tiers: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      }),
      prisma.serviceAddon.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.deliveryOption.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    if (categories.length === 0) {
      return NextResponse.json({ ok: true, catalog: DEFAULT_PRICING_CATALOG });
    }

    const catalog: PricingCatalog = {
      categories: categories.map((c) => ({
        key: c.key,
        label: c.label,
        emoji: c.emoji ?? "",
        description: c.description ?? "",
        isActive: c.isActive,
        tiers: c.tiers.map((t) => ({
          key: t.key,
          label: t.label,
          price: Number(t.basePrice),
          isActive: t.isActive,
        })),
      })),
      addons:
        addons.length > 0
          ? addons.map((a) => ({
              key: a.key,
              label: a.label,
              price: Number(a.price),
              isActive: a.isActive,
            }))
          : DEFAULT_PRICING_CATALOG.addons,
      delivery:
        delivery.length > 0
          ? delivery.map((d) => ({
              key: d.key,
              label: d.label,
              subLabel: d.subLabel ?? "",
              extraPrice: Number(d.extraPrice),
              isActive: d.isActive,
            }))
          : DEFAULT_PRICING_CATALOG.delivery,
    };

    return NextResponse.json({ ok: true, catalog });
  } catch {
    return NextResponse.json({ ok: true, catalog: DEFAULT_PRICING_CATALOG });
  }
}
