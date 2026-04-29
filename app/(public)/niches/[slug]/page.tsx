import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { PublicPageHero } from "@/components/marketing/public-page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nicheSummaries } from "@/lib/marketing-data";
import { buildTitle } from "@/lib/site";

type NicheDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return nicheSummaries.map((niche) => ({ slug: niche.slug }));
}

export async function generateMetadata({ params }: NicheDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const niche = nicheSummaries.find((item) => item.slug === slug);
  if (!niche) return { title: buildTitle("Niche") };
  return { title: buildTitle(niche.title), description: niche.summary };
}

export default async function NicheDetailPage({ params }: NicheDetailPageProps) {
  const { slug } = await params;
  const niche = nicheSummaries.find((item) => item.slug === slug);
  if (!niche) notFound();

  return (
    <>
      <PublicPageHero
        eyebrow={niche.serviceTitle}
        title={niche.title}
        description={niche.summary}
      />

      <section className="px-4 pb-16 md:px-8">
        <div className="page-shell grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
            <CardHeader>
              <div className="section-eyebrow">Who this is for</div>
              <CardTitle className="mt-1 text-2xl">Use cases this service covers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {niche.useCases.map((useCase) => (
                  <div
                    key={useCase}
                    className="flex items-start gap-2.5 rounded-[1.5rem] border border-border/80 bg-secondary/60 p-4 text-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {useCase}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel premium-shadow rounded-[2rem] border-border/80">
            <CardHeader>
              <div className="section-eyebrow">Get started</div>
              <CardTitle className="mt-1 text-2xl">Ready for a production-ready file?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Share your artwork and tell us about your garment, placement, and turnaround. We&apos;ll
                send a proof within 24 hours — revisions included until you approve.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/contact" className="btn-primary text-sm">
                  Request a quote
                </Link>
                <Link
                  href={`/services/${niche.serviceSlug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to service page
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
