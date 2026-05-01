export const PLACEMENT_OPTIONS = [
  { value: "LEFT_CHEST",      label: "Left Chest",            maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "RIGHT_CHEST",     label: "Right Chest",           maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "HAT_FRONT",       label: "Hat / Cap Front",       maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "HAT_SIDE",        label: "Hat / Cap Side",        maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "HAT_BACK",        label: "Hat / Cap Back",        maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "LARGE_DESIGN",    label: "Large Design",          maxSizeIn: 12, is3DPuffJacketBack: false },
  { value: "JACKET_BACK",     label: "Jacket Back",           maxSizeIn: 12, is3DPuffJacketBack: false },
  { value: "JACKET_CHEST",    label: "Jacket Chest",          maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "SLEEVE_LEFT",     label: "Left Sleeve",           maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "SLEEVE_RIGHT",    label: "Right Sleeve",          maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "FULL_BACK",       label: "Full Back",             maxSizeIn: 14, is3DPuffJacketBack: false },
  { value: "FULL_FRONT",      label: "Full Front",            maxSizeIn: 14, is3DPuffJacketBack: false },
  { value: "POCKET",          label: "Pocket",                maxSizeIn: 3,  is3DPuffJacketBack: false },
  { value: "LEG",             label: "Leg / Pant",            maxSizeIn: 6,  is3DPuffJacketBack: false },
  { value: "PUFF_LEFT_CHEST", label: "3D Puff Left Chest",    maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "PUFF_HAT",        label: "3D Puff Hat / Cap",     maxSizeIn: 5,  is3DPuffJacketBack: false },
  { value: "PUFF_JACKET_BACK", label: "3D Puff Jacket Back",  maxSizeIn: 12, is3DPuffJacketBack: true  },
  { value: "OTHER",           label: "Other / Custom",        maxSizeIn: 14, is3DPuffJacketBack: false },
] as const;

export type PlacementValue = (typeof PLACEMENT_OPTIONS)[number]["value"];

export function getPlacementMeta(value: string) {
  return PLACEMENT_OPTIONS.find((p) => p.value === value) ?? PLACEMENT_OPTIONS[PLACEMENT_OPTIONS.length - 1];
}

export const FABRIC_TYPES = [
  "Cotton",
  "Polyester",
  "Nylon",
  "Canvas",
  "Fleece",
  "Leather / Faux Leather",
  "Denim",
  "Mesh / Performance",
  "Wool / Felt",
  "Twill",
  "Pique",
  "Other",
] as const;

export const FILE_FORMAT_OPTIONS = [
  { value: "DST",  label: "DST (Tajima)"    },
  { value: "PES",  label: "PES (Brother)"   },
  { value: "EMB",  label: "EMB (Wilcom)"    },
  { value: "EXP",  label: "EXP (Melco)"     },
  { value: "JEF",  label: "JEF (Janome)"    },
  { value: "VP3",  label: "VP3 (Pfaff/Husqvarna)" },
  { value: "XXX",  label: "XXX (Singer)"    },
  { value: "HUS",  label: "HUS (Husqvarna)" },
  { value: "SEW",  label: "SEW (Elna/Janome)" },
  { value: "PDF",  label: "PDF (Preview)"   },
  { value: "SVG",  label: "SVG (Vector)"    },
  { value: "AI",   label: "AI (Illustrator)" },
  { value: "PNG",  label: "PNG (Stitch Preview)" },
] as const;

export type FileFormatValue = (typeof FILE_FORMAT_OPTIONS)[number]["value"];

export const serviceCatalog = [
  {
    type: "EMBROIDERY_DIGITIZING",
    label: "Embroidery Digitizing",
    basePrice: 12,
    niches: [
      { slug: "cap",          label: "Cap"                    },
      { slug: "left-chest",   label: "Left Chest"             },
      { slug: "standard-4-6", label: "Standard (4\" – 6\")"   },
      { slug: "jacket-back",  label: "Jacket Back"            },
      { slug: "large-8-12",   label: "Large (8\" – 12\")"     },
    ],
    hints: [
      "Best for embroidery-ready stitch files.",
      "Cap & Left Chest: up to 5 inches. Jacket Back & Large: up to 12 inches.",
      "3D Puff available as an add-on for any placement.",
    ],
  },
  {
    type: "VECTOR_ART",
    label: "Vector Art Conversion",
    basePrice: 18,
    niches: [
      { slug: "jpg-to-vector",        label: "JPG to Vector"        },
      { slug: "print-ready-artwork",  label: "Print-Ready Artwork"  },
      { slug: "logo-redraw",          label: "Logo Redraw"          },
    ],
    hints: [
      "Best for redraws, print files, and clean scalable artwork.",
      "Great for DTF, DTG, and screen print preparation.",
    ],
  },
  {
    type: "COLOR_SEPARATION_DTF",
    label: "Color Separation / DTF Screen Setup",
    basePrice: 15,
    niches: [
      { slug: "color-separation", label: "Color Separation"   },
      { slug: "dtf-screen-setup", label: "DTF Screen Setup"   },
    ],
    hints: [
      "Best for color separation and DTF print file preparation.",
      "Supports screen print and direct-to-film setups.",
    ],
  },
  {
    type: "CUSTOM_PATCHES",
    label: "Custom Patches",
    basePrice: 24,
    niches: [
      { slug: "embroidered-patches", label: "Embroidered Patches" },
      { slug: "chenille-patches",    label: "Chenille Patches"    },
      { slug: "pvc-patches",         label: "PVC Patches"         },
      { slug: "woven-patches",       label: "Woven Patches"       },
      { slug: "leather-patches",     label: "Leather Patches"     },
    ],
    hints: [
      "Best for patch-ready concepts and production quoting.",
      "Supports quantity-aware pricing adjustments.",
    ],
  },
] as const;

export type ServiceType = (typeof serviceCatalog)[number]["type"];
export type TurnaroundType = "STANDARD" | "URGENT" | "SAME_DAY";

export function getServiceByType(type: ServiceType) {
  return serviceCatalog.find((entry) => entry.type === type) ?? serviceCatalog[0];
}

export function getNichesForService(type: ServiceType) {
  return getServiceByType(type).niches as ReadonlyArray<{ slug: string; label: string }>;
}

export function getDefaultNiche(type: ServiceType) {
  return getNichesForService(type)[0]?.slug ?? "";
}
