import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PublicPageHero } from "@/components/marketing/public-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serviceSummaries } from "@/lib/marketing-data";
import { buildTitle } from "@/lib/site";

type ServiceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return serviceSummaries.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceSummaries.find((item) => item.slug === slug);
  if (!service) return { title: buildTitle("Service") };
  return { title: buildTitle(service.title), description: service.summary };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { slug } = await params;
  const service = serviceSummaries.find((item) => item.slug === slug);
  if (!service) notFound();

  return (
    <>
      <PublicPageHero
        eyebrow={service.eyebrow}
        title={service.title}
        description={service.summary}
      />

      <section className="px-4 pb-16 md:px-8">
        <div className="page-shell grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
            <CardHeader>
              <CardTitle className="text-2xl">What&apos;s included</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{service.lead}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {service.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="flex items-start gap-2.5 rounded-[1.5rem] border border-border/80 bg-secondary/60 p-4 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {bullet}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
            <CardHeader>
              <div className="section-eyebrow">Available niches</div>
              <CardTitle className="mt-1 text-2xl">Service-specific specializations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {service.niches.map((niche) => (
                  <Badge
                    key={niche}
                    className="rounded-full border-border/80 bg-secondary text-muted-foreground capitalize"
                  >
                    {niche.replaceAll("-", " ")}
                  </Badge>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Each niche has its own production requirements. Tell us which applies when you submit
                your artwork — we&apos;ll tailor the digitizing approach accordingly.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="btn-primary text-sm"
                >
                  Discuss a project
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to services
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
