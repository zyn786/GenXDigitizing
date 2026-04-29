export type PricingTier = {
  key: string;
  label: string;
  price: number;
  isActive: boolean;
};

export type PricingCategory = {
  key: string;
  label: string;
  emoji: string;
  description: string;
  isActive: boolean;
  tiers: PricingTier[];
};

export type PricingAddon = {
  key: string;
  label: string;
  price: number;
  isActive: boolean;
};

export type PricingDelivery = {
  key: string;
  label: string;
  subLabel: string;
  extraPrice: number;
  isActive: boolean;
};

export type PricingCatalog = {
  categories: PricingCategory[];
  addons: PricingAddon[];
  delivery: PricingDelivery[];
};

export async function getPricingCatalog(): Promise<PricingCatalog> {
  const { prisma } = await import("@/lib/db");
  try {
    const [categories, addons, delivery] = await Promise.all([
      prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { tiers: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      }),
      prisma.serviceAddon.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.deliveryOption.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);

    if (categories.length === 0) return DEFAULT_PRICING_CATALOG;

    return {
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
          ? addons.map((a) => ({ key: a.key, label: a.label, price: Number(a.price), isActive: a.isActive }))
          : DEFAULT_PRICING_CATALOG.addons,
      delivery:
        delivery.length > 0
          ? delivery.map((d) => ({ key: d.key, label: d.label, subLabel: d.subLabel ?? "", extraPrice: Number(d.extraPrice), isActive: d.isActive }))
          : DEFAULT_PRICING_CATALOG.delivery,
    };
  } catch {
    return DEFAULT_PRICING_CATALOG;
  }
}

export const DEFAULT_PRICING_CATALOG: PricingCatalog = {
  categories: [
    {
      key: "EMBROIDERY_DIGITIZING",
      label: "Embroidery Digitizing",
      emoji: "🧵",
      description: "Machine-ready embroidery files",
      isActive: true,
      tiers: [
        { key: "left-chest", label: 'Left Chest / Small (up to 4")', price: 15, isActive: true },
        { key: "standard", label: 'Standard Design (4"–8")', price: 25, isActive: true },
        { key: "large", label: 'Large Design (8"–12")', price: 40, isActive: true },
        { key: "jumbo", label: 'Jumbo / Full Back (12"+)', price: 65, isActive: true },
        { key: "patches", label: "Patches & Custom Shapes", price: 35, isActive: true },
        { key: "3d-puff", label: "3D Puff Digitizing", price: 45, isActive: true },
      ],
    },
    {
      key: "VECTOR_REDRAW",
      label: "Vector Redraw",
      emoji: "✏️",
      description: "Crisp scalable vector artwork",
      isActive: true,
      tiers: [
        { key: "basic", label: "Basic Logo (up to 2 colors)", price: 15, isActive: true },
        { key: "standard", label: "Standard (up to 5 colors)", price: 25, isActive: true },
        { key: "complex", label: "Complex Illustration", price: 45, isActive: true },
        { key: "gradient", label: "Multi-color with Gradients", price: 65, isActive: true },
      ],
    },
    {
      key: "COLOR_SEPARATION",
      label: "Color Separation",
      emoji: "🎨",
      description: "Separated layers for screen printing",
      isActive: true,
      tiers: [
        { key: "simple", label: "Simple (up to 4 colors)", price: 20, isActive: true },
        { key: "standard", label: "Standard (5–8 colors)", price: 35, isActive: true },
        { key: "complex", label: "Complex / Simulated Process", price: 60, isActive: true },
      ],
    },
    {
      key: "DTF_SCREEN_PRINT",
      label: "DTF / Screen Print Setup",
      emoji: "🖨️",
      description: "Film & screen printing artwork",
      isActive: true,
      tiers: [
        { key: "single-color", label: "Single Color Artwork", price: 15, isActive: true },
        { key: "spot-color", label: "Spot Color Film (up to 6 colors)", price: 35, isActive: true },
        { key: "full-process", label: "Full Process / Simulated", price: 55, isActive: true },
      ],
    },
  ],
  addons: [
    { key: "MAJOR_REVISION", label: "Major Revision", price: 15, isActive: true },
    { key: "FORMAT_CONVERSION", label: "Format Conversion", price: 10, isActive: true },
    { key: "SIZE_CHANGE", label: "Size Change", price: 8, isActive: true },
    { key: "SOURCE_FILE", label: "Source / Editable File", price: 20, isActive: true },
  ],
  delivery: [
    { key: "STANDARD", label: "Standard Delivery", subLabel: "3–5 business days", extraPrice: 0, isActive: true },
    { key: "RUSH_SAME_DAY", label: "Rush Same Day", subLabel: "Delivered within 24 hours", extraPrice: 25, isActive: true },
    { key: "RUSH_12_HOUR", label: "Rush 12-Hour", subLabel: "Delivered within 12 hours", extraPrice: 45, isActive: true },
  ],
};
