import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DbItem = {
  id: string;
  title: string;
  serviceKey: string;
  description: string | null;
  tags: string[];
  isFeatured: boolean;
};

const SERVICE_LABELS: Record<string, string> = {
  EMBROIDERY_DIGITIZING: "Embroidery Digitizing",
  VECTOR_REDRAW: "Vector Art",
  COLOR_SEPARATION: "Color Separation",
  DTF_SCREEN_PRINT: "DTF / Screen Print",
};

const ACCENTS = [
  "from-indigo-500/10 to-violet-500/5",
  "from-emerald-500/10 to-teal-500/5",
  "from-amber-500/10 to-orange-500/5",
  "from-blue-500/10 to-cyan-500/5",
  "from-rose-500/10 to-pink-500/5",
  "from-purple-500/10 to-fuchsia-500/5",
];

const STATIC_ITEMS = [
  {
    title: "Cap Front Clean-Up",
    category: "Embroidery Digitizing",
    badge: "3D Puff",
    note: "Sharper lettering, cleaner satin direction, and proof-first communication.",
    accent: "from-indigo-500/10 to-violet-500/5",
  },
  {
    title: "Restaurant Brand Rebuild",
    category: "Vector Art",
    badge: "Logo Redraw",
    note: "Scalable logo conversion for apparel, signage, and print-ready production use.",
    accent: "from-emerald-500/10 to-teal-500/5",
  },
  {
    title: "Morale Patch Set",
    category: "Custom Patches",
    badge: "Embroidered",
    note: "Structured patch planning with approval-ready previews and production detail.",
    accent: "from-amber-500/10 to-orange-500/5",
  },
  {
    title: "Small Text Uniform Mark",
    category: "Embroidery Digitizing",
    badge: "Left Chest",
    note: "Precision digitizing for difficult readability constraints on smaller garment placements.",
    accent: "from-blue-500/10 to-cyan-500/5",
  },
  {
    title: "Print Artwork Cleanup",
    category: "Vector Art",
    badge: "Print-Ready",
    note: "Production-ready vector cleanup for apparel and promo print workflows.",
    accent: "from-rose-500/10 to-pink-500/5",
  },
  {
    title: "PVC Patch Concept",
    category: "Custom Patches",
    badge: "PVC",
    note: "Premium patch concept presentation ready for approval and production flow.",
    accent: "from-purple-500/10 to-fuchsia-500/5",
  },
];

export function PortfolioPreviewGrid({ dbItems }: { dbItems?: DbItem[] | null }) {
  if (dbItems && dbItems.length > 0) {
    return (
      <section className="px-4 py-8 md:px-8 md:py-10">
        <div className="page-shell">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dbItems.map((item, i) => (
              <Card
                key={item.id}
                className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="section-eyebrow text-[10px]">
                      {SERVICE_LABELS[item.serviceKey] ?? item.serviceKey}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.isFeatured && (
                        <Badge className="rounded-full border-amber-500/30 bg-amber-500/10 text-xs text-amber-400">
                          Featured
                        </Badge>
                      )}
                      {item.tags[0] && (
                        <Badge className="rounded-full border-border/80 bg-secondary text-xs text-muted-foreground">
                          {item.tags[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]} border border-border/60`}
                  />
                  {item.description && (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8 md:px-8 md:py-10">
      <div className="page-shell">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {STATIC_ITEMS.map((item) => (
            <Card
              key={item.title}
              className="glass-panel card-hover premium-shadow rounded-[2rem] border-border/80"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="section-eyebrow text-[10px]">{item.category}</div>
                  <Badge className="rounded-full border-border/80 bg-secondary text-xs text-muted-foreground">
                    {item.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br ${item.accent} border border-border/60`}
                />
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
