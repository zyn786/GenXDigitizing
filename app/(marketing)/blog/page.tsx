// @ts-nocheck
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { fetchBlogPosts } from "@/lib/blog-data";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog — Embroidery Digitizing Guides, Tips & Tutorials",
  description:
    "Expert guides on embroidery digitizing, vector art conversion, file formats, and industry best practices. Free educational content for embroidery professionals.",
  keywords: [
    "embroidery digitizing blog",
    "digitizing guides",
    "embroidery tutorials",
    "vector art guides",
    "embroidery tips",
  ],
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const BLOG_POSTS = await fetchBlogPosts(true);
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
        ]}
      />
      <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
        {/* Hero */}
        <section className="relative px-4 pb-8 pt-12 text-center sm:px-6 sm:pb-10 sm:pt-16 md:pt-20">
          <GradientOrb
            color="#2563EB"
            size={300}
            className="left-1/2 top-[-100px] -translate-x-1/2 opacity-10"
          />
          <span className="mb-4 inline-flex rounded-full border border-[#2563EB]/20 bg-[#2563EB]/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563EB]">
            Blog
          </span>
          <h1 className="mb-3 font-syne text-[clamp(32px,7vw,56px)] font-bold leading-[1.08]">
            Embroidery
            <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
              Guides & Tutorials
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-sm text-[var(--txt2)] sm:text-base">
            Expert guides on digitizing, vector art, file formats, and industry best practices —
            free for the embroidery community.
          </p>
        </section>

        {/* Posts grid */}
        <section className="pb-16 sm:pb-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 md:px-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {BLOG_POSTS.map((post) => (
                <AnimatedSection key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="group block no-underline">
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--border3)]">
                      {post.hero.image ? (
                        <div className="relative aspect-[16/9] w-full flex-shrink-0 overflow-hidden">
                          <Image
                            fill
                            src={post.hero.image}
                            alt={post.title}
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex aspect-[16/9] w-full flex-shrink-0 items-center justify-center text-5xl text-[var(--txt)]"
                          style={{
                            background: `linear-gradient(135deg, ${post.hero.color}22, ${post.hero.color}0d)`,
                          }}
                        >
                          {post.hero.emoji}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <span
                          className="mb-2 text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: post.hero.color }}
                        >
                          {post.category}
                        </span>
                        <h2 className="mb-2 font-syne text-lg font-bold leading-snug transition-colors group-hover:text-[#2563EB] sm:text-xl">
                          {post.title}
                        </h2>
                        <p className="mb-3 flex-1 text-sm leading-relaxed text-[var(--txt2)]">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-[var(--txt3)]">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {post.readTime}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-[#2563EB] opacity-0 transition-opacity group-hover:opacity-100">
                            Read More <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 text-center sm:mt-12">
              <p className="mb-4 text-sm text-[var(--txt2)]">
                Want a custom guide? Let us know what topic you'd like covered.
              </p>
              <Link href="/contact">
                <Button variant="grad" size="md" rightIcon={<ArrowRight size={14} />}>
                  Suggest a Topic
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
