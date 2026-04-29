export type ServiceSummary = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  lead: string;
  bullets: string[];
  niches: string[];
  process: { step: string; title: string; text: string }[];
  faqs: { q: string; a: string }[];
};

export type NicheSummary = {
  slug: string;
  serviceSlug: string;
  title: string;
  serviceTitle: string;
  summary: string;
  useCases: string[];
  specs: string[];
  benefit: string;
};

export type PortfolioItem = {
  slug: string;
  title: string;
  tag: string;
  before: string;
  after: string;
};

export const trustBadges = [
  "Rush-ready turnaround logic",
  "Private/public file separation",
  "Proof and revision visibility",
  "App Router public architecture",
  "Role-ready operations model",
  "SEO and CMS expansion ready",
];

export const serviceSummaries: ServiceSummary[] = [
  {
    slug: "embroidery-digitizing",
    title: "Embroidery Digitizing",
    eyebrow: "Embroidery",
    summary:
      "Luxury-quality stitch programming for left chest logos, cap fronts, puff work, sleeves, jacket backs, appliqué, and fine-detail production.",
    lead:
      "Built for apparel decorators who need predictable stitch quality, clear turnaround expectations, and a premium client-facing experience.",
    bullets: [
      "Left chest and sleeve logos",
      "Cap and structured hat digitizing",
      "3D puff and foam depth handling",
      "Appliqué, towel, fleece, and patch files",
      "Small text optimization guidance",
      "Proof-ready workflow for revisions",
    ],
    niches: ["left-chest-logo", "cap-hat-logo", "3d-puff"],
    process: [
      {
        step: "01",
        title: "Share your artwork",
        text: "Upload any format — JPG, PNG, AI, PDF. Tell us garment type, placement, size, and your required machine format.",
      },
      {
        step: "02",
        title: "We plan the stitch path",
        text: "Our digitizers map underlay, stitch density, and path direction for your exact garment and placement requirements.",
      },
      {
        step: "03",
        title: "Receive your proof",
        text: "A visual stitch simulation lands within 24 hours with production notes. We flag any concerns before the file is finalised.",
      },
      {
        step: "04",
        title: "Approve and download",
        text: "Request revisions or approve the first proof. Download in DST, PES, EMB, or any required machine format.",
      },
    ],
    faqs: [
      {
        q: "What garment types do you digitize for?",
        a: "Polos, dress shirts, jackets, fleece, caps, hats, bags, and towels. We adjust underlay and density for the specific fabric weight you specify.",
      },
      {
        q: "What machine formats do you deliver?",
        a: "DST, PES, EMB, EXP, JEF, VP3, HUS, and most major commercial formats. Tell us your machine brand and model and we'll match it.",
      },
      {
        q: "How do you handle small text?",
        a: "We optimize lettering at 3 mm height and above. Below that threshold we'll advise on what's achievable and suggest simplified forms or alternative techniques.",
      },
      {
        q: "What counts as a revision?",
        a: "Any stitch path change, density adjustment, size modification, or element repositioning. Everything is included until you approve — no hidden revision fees.",
      },
      {
        q: "Can you rush an order?",
        a: "Yes. Same-day (4-hour) and overnight rush options are available for most job types. Mention your deadline when submitting and we'll prioritize.",
      },
    ],
  },
  {
    slug: "vector-art",
    title: "Vector Art Conversion",
    eyebrow: "Vector",
    summary:
      "Raster-to-vector cleanup, redraws, layered production files, print-ready artwork, and separations for DTF, DTG, and screen workflows.",
    lead:
      "Positioned for print shops and brand teams that need clean source files, editable paths, and presentation quality that feels premium from first contact.",
    bullets: [
      "JPG to vector conversion",
      "Logo redraw and cleanup",
      "Print-ready artwork packaging",
      "DTF and DTG preparation",
      "Color separation support",
      "Editable layered delivery",
    ],
    niches: ["jpg-to-vector", "print-ready-artwork"],
    process: [
      {
        step: "01",
        title: "Send your source file",
        text: "Any format works — JPG, PNG, PDF, AI, EPS, or even a photo of printed artwork. We don't require a high-resolution original.",
      },
      {
        step: "02",
        title: "We redraw clean paths",
        text: "Every element is manually rebuilt as scalable vector geometry with correctly layered color groups — no auto-trace shortcuts.",
      },
      {
        step: "03",
        title: "Review the layered proof",
        text: "You receive an editable AI or PDF showing path structure, named color layers, and output suitability for your workflow.",
      },
      {
        step: "04",
        title: "Export and deploy",
        text: "Once approved, we deliver in AI, SVG, EPS, PDF, and any raster exports your print or decoration vendor requires.",
      },
    ],
    faqs: [
      {
        q: "What's the difference between auto-trace and a manual redraw?",
        a: "Auto-trace copies pixel shapes and adds noise at every corner. A manual redraw rebuilds geometry from scratch — cleaner paths, correct anchor points, scalable at any size without artifacts.",
      },
      {
        q: "Will I receive editable source files?",
        a: "Yes. Deliverables include a layered AI or EPS with properly named layers and organized color groups you can open in Illustrator or send directly to vendors.",
      },
      {
        q: "Can you match Pantone or brand colors exactly?",
        a: "Yes. Provide your Pantone, CMYK, or hex references and we'll assign them in the vector file with a swatch reference sheet included.",
      },
      {
        q: "What if I only have a very low-quality JPG?",
        a: "That's the most common starting point. A manual redraw doesn't depend on source resolution — we rebuild from the visual form, not the pixels.",
      },
      {
        q: "Do you handle color separation for screen printing?",
        a: "Yes. Spot color separation into individual layers for screen printing is available as part of the print-ready artwork service.",
      },
    ],
  },
  {
    slug: "custom-patches",
    title: "Custom Patches",
    eyebrow: "Patches",
    summary:
      "Premium patch service presentation for embroidered, chenille, woven, PVC, and leather patch orders with structured specification paths.",
    lead:
      "Designed to help the brand look established before the full ordering engine lands, while still giving prospects clear options and production confidence.",
    bullets: [
      "Embroidered patch positioning",
      "Chenille patch presentations",
      "Woven, PVC, and leather options",
      "Backing and border configuration",
      "Quantity-aware quoting",
      "Future shipping workflow compatibility",
    ],
    niches: ["embroidered-patches", "chenille-patches"],
    process: [
      {
        step: "01",
        title: "Describe your patch concept",
        text: "Tell us patch type (embroidered, chenille, PVC), size, backing preference, border style, and quantity range.",
      },
      {
        step: "02",
        title: "We spec the design",
        text: "Our team maps stitch density, fill areas, border type, and production flow for your patch program from the ground up.",
      },
      {
        step: "03",
        title: "Review your patch proof",
        text: "You receive a detailed production proof showing layout, colors, edge finish, and backing confirmation for approval.",
      },
      {
        step: "04",
        title: "Approve and order",
        text: "Once approved, we coordinate production and handle all file deliverables for your manufacturer or in-house machine.",
      },
    ],
    faqs: [
      {
        q: "What patch types do you produce?",
        a: "Embroidered, chenille, woven, PVC, and leather patches — all with multiple backing and border options available per type.",
      },
      {
        q: "What sizes are available?",
        a: "Most programs start at 2\" and go up to 12\"+. We'll advise on minimum stitch density and coverage requirements for your selected size.",
      },
      {
        q: "What backing options exist?",
        a: "Iron-on heat seal, sew-on, velcro (hook side), pressure-sensitive adhesive, and combination options. Backing is specified during the proof stage.",
      },
      {
        q: "Is there a minimum order quantity?",
        a: "Minimum quantities vary by patch type. Embroidered patches typically start at 50 pieces. We'll quote based on your program's specific scale.",
      },
      {
        q: "Can you match an existing patch I already have?",
        a: "Yes. Send us a photo or physical sample and we'll spec to match the stitch density, colors, border type, and size as closely as production allows.",
      },
    ],
  },
];

export const nicheSummaries: NicheSummary[] = [
  {
    slug: "left-chest-logo",
    serviceSlug: "embroidery-digitizing",
    serviceTitle: "Embroidery Digitizing",
    title: "Left Chest Logo Digitizing",
    summary:
      "Optimized for compact branding zones where stitch density, legibility, and garment compatibility matter most.",
    useCases: [
      "Corporate polos",
      "Uniform shirts",
      "Hospitality apparel",
      "Lightweight garments",
    ],
    specs: [
      "3–4 inch stitch width, optimized for density",
      "Compact satin-stitch borders for sharp edges",
      "Underlay mapped to garment weight and weave",
      "Proof includes garment placement overlay",
    ],
    benefit:
      "Clean, tight logos that hold up across uniforms, polos, and lightweight apparel without thread pulls or puckering — across hundreds of wash cycles.",
  },
  {
    slug: "cap-hat-logo",
    serviceSlug: "embroidery-digitizing",
    serviceTitle: "Embroidery Digitizing",
    title: "Cap / Hat Logo Digitizing",
    summary:
      "Structured for front-panel embroidery where distortion control, underlay planning, and edge crispness are critical.",
    useCases: [
      "Structured caps",
      "Snapbacks",
      "Dad hats",
      "Promotional headwear",
    ],
    specs: [
      "Front panel distortion compensation built in",
      "Underlay mapped to cap curvature and stiffness",
      "Hard and soft cap construction options",
      "Stitch direction follows panel seams",
    ],
    benefit:
      "Cap logos that sit flat, hold their shape after washing, and work across structured and unstructured headwear without puckering at the crown.",
  },
  {
    slug: "3d-puff",
    serviceSlug: "embroidery-digitizing",
    serviceTitle: "Embroidery Digitizing",
    title: "3D Puff Digitizing",
    summary:
      "Presented as a specialty premium service for bold raised logos with depth-aware sequencing and cleaner foam coverage.",
    useCases: [
      "Streetwear hats",
      "Brand drops",
      "Team caps",
      "Merchandise collections",
    ],
    specs: [
      "Foam height 3 mm–6 mm, spec'd per design",
      "Coverage mapping per letter and shape element",
      "Sequential stitching prevents foam shift",
      "Border reinforcement for clean raised edges",
    ],
    benefit:
      "Bold, raised logos with depth that holds its form over time — no bubbling, no edge fraying, clean crisp profiles that read clearly from a distance.",
  },
  {
    slug: "jpg-to-vector",
    serviceSlug: "vector-art",
    serviceTitle: "Vector Art Conversion",
    title: "JPG to Vector Conversion",
    summary:
      "Ideal for rebuilding rough source graphics into clean, scalable, production-ready artwork without losing brand character.",
    useCases: [
      "Legacy logos",
      "Low-resolution brand files",
      "Print vendor submissions",
      "Promotional products",
    ],
    specs: [
      "Manual path rebuild — no auto-trace",
      "Correct color layer separation and naming",
      "Output in AI, SVG, EPS, and print-ready PDF",
      "Pantone or hex color matching available",
    ],
    benefit:
      "A clean, scalable vector you can send to any vendor, scale to any size, and use across print, embroidery, and signage without quality loss.",
  },
  {
    slug: "print-ready-artwork",
    serviceSlug: "vector-art",
    serviceTitle: "Vector Art Conversion",
    title: "Print-Ready Artwork Prep",
    summary:
      "Focused on tidy geometry, output planning, and clean file packaging for downstream decoration and print production.",
    useCases: [
      "DTF preparation",
      "DTG graphics",
      "Screen printing",
      "Packaging assets",
    ],
    specs: [
      "CMYK and spot color mode separation",
      "Bleed and safe zone mapped to print spec",
      "Export-ready for offset, digital, and screen",
      "Layered AI + print-ready PDF included",
    ],
    benefit:
      "Artwork packaged exactly to your printer's specification — correct color mode, file format, and dimensions, ready to run without back-and-forth.",
  },
  {
    slug: "embroidered-patches",
    serviceSlug: "custom-patches",
    serviceTitle: "Custom Patches",
    title: "Embroidered Patches",
    summary:
      "Built for brands that need patch-first storytelling with clear positioning around edge finish, backing options, and production consistency.",
    useCases: [
      "Uniform patches",
      "Brand tags",
      "Club insignia",
      "Retail accessories",
    ],
    specs: [
      "Merrowed or hot-cut border options",
      "Iron-on, sew-on, or velcro backing",
      "Minimum 2\" up to 12\" diameter",
      "Stitch count mapped for full coverage density",
    ],
    benefit:
      "A polished finished patch with crisp stitching, a clean edge finish, and the right backing for your application — ready for uniform, retail, or merch programs.",
  },
  {
    slug: "chenille-patches",
    serviceSlug: "custom-patches",
    serviceTitle: "Custom Patches",
    title: "Chenille Patches",
    summary:
      "Presented as a statement product for varsity, streetwear, and collectible patch programs with a richer tactile look.",
    useCases: [
      "Varsity products",
      "Streetwear collections",
      "Collector items",
      "Premium merch drops",
    ],
    specs: [
      "Cut chenille yarn fill planning per zone",
      "Felt base specification and colour matching",
      "Raised and dimensional lettering options",
      "Chain-stitch outline for crisp definition",
    ],
    benefit:
      "A premium, tactile patch with varsity character and a raised chenille fill that reads as high-quality craftsmanship at any size.",
  },
];

export const portfolioItems: PortfolioItem[] = [
  {
    slug: "luxury-cap-puff-digitizing",
    title: "Luxury Cap Puff Digitizing",
    tag: "3D Puff",
    before: "Flat logo source with weak contrast and no stitch depth planning.",
    after: "Raised cap-ready file concept with clearer geometry, stronger depth cues, and premium presentation.",
  },
  {
    slug: "restaurant-chest-logo-cleanup",
    title: "Restaurant Chest Logo Cleanup",
    tag: "Left Chest",
    before: "Busy raster logo with small details at risk in embroidery.",
    after: "Production-aware chest logo concept focused on legibility and clean garment placement.",
  },
  {
    slug: "streetwear-chenille-patch-system",
    title: "Streetwear Chenille Patch System",
    tag: "Patch",
    before: "Loose concept art without patch production framing.",
    after: "Premium patch presentation showing hierarchy, tactile storytelling, and finished product direction.",
  },
];

export const testimonials = [
  {
    name: "Avery Chen",
    company: "Northline Uniforms",
    text: "The site immediately feels more premium than the usual digitizing vendors, and the service paths are much easier for clients to understand.",
  },
  {
    name: "Mason Ortiz",
    company: "Heritage Stitch Co.",
    text: "This gives us a serious public presence before the full backend lands. It already feels like a real product company, not a basic service site.",
  },
  {
    name: "Layla Brooks",
    company: "Patch District",
    text: "The patch and embroidery positioning is clearer, and the before/after storytelling makes the offer easier to trust.",
  },
];

export const faqItems = [
  {
    question: "How fast is your standard turnaround?",
    answer:
      "Standard orders are delivered within 24 hours. Rush (4-hour) and same-day options are available for most job types — just mention it when you submit.",
  },
  {
    question: "What file formats do you deliver?",
    answer:
      "We deliver in DST, PES, EMB, EXP, JEF, and most major machine-readable formats. Let us know your embroidery machine and we'll match the format.",
  },
  {
    question: "What if I need changes after seeing the proof?",
    answer:
      "Revisions are part of the process. Starter orders include one revision. Production-tier orders include unlimited revisions until the file is approved.",
  },
  {
    question: "Do you work with any garment or fabric type?",
    answer:
      "Yes — polo shirts, jackets, fleece, caps, towels, bags, and most commercial fabrics. Tell us the material and we adjust underlay and density accordingly.",
  },
  {
    question: "Is a client portal included?",
    answer:
      "Yes. Every client gets a secure portal to track orders, download files, request revisions, view invoices, and message support — all in one place.",
  },
  {
    question: "Can I order without signing up?",
    answer:
      "You can submit a quote or inquiry through the contact form without an account. We'll create your portal access once we confirm the first order.",
  },
];
