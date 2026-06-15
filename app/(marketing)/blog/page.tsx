// @ts-nocheck
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { fetchBlogPosts } from "@/lib/blog-data";
import { BreadcrumbSchema } from "@/components/shared/StructuredData";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Blog — Embroidery Digitizing Guides, Tips & Tutorials",
  description: "Expert guides on embroidery digitizing, vector art conversion, file formats, and industry best practices. Free educational content for embroidery professionals.",
  keywords: ["embroidery digitizing blog", "digitizing guides", "embroidery tutorials", "vector art guides", "embroidery tips"],
};

export default async function BlogPage() {
  const BLOG_POSTS = await fetchBlogPosts(true);
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }]} />
      <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
        {/* Hero */}
        <section className="relative text-center pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-10 px-4 sm:px-6">
          <GradientOrb color="#2563EB" size={300} className="top-[-100px] left-1/2 -translate-x-1/2 opacity-10" />
          <span className="inline-flex px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 mb-4">
            Blog
          </span>
          <h1 className="font-syne font-bold text-[clamp(32px,7vw,56px)] leading-[1.08] mb-3">
            Embroidery
            <span className="block bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
              Guides & Tutorials
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-lg mx-auto">
            Expert guides on digitizing, vector art, file formats, and industry best practices — free for the embroidery community.
          </p>
        </section>

        {/* Posts grid */}
        <section className="pb-16 sm:pb-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-12">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              {BLOG_POSTS.map((post) => (
                <AnimatedSection key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="group block no-underline">
                    <div
                      className="h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border3)] hover:-translate-y-1 transition-all duration-200 flex flex-col"
                    >
                      {post.hero.image ? (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img src={post.hero.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        </div>
                      ) : (
                        <div
                          className="aspect-[16/9] flex items-center justify-center text-5xl"
                          style={{ background: `linear-gradient(135deg, ${post.hero.color}15, ${post.hero.color}08)` }}
                        >
                          {post.hero.emoji}
                        </div>
                      )}
                      <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider mb-2"
                        style={{ color: post.hero.color }}
                      >
                        {post.category}
                      </span>
                      <h2 className="font-syne font-bold text-lg sm:text-xl mb-2 leading-snug group-hover:text-[#2563EB] transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-[var(--txt2)] leading-relaxed mb-3 flex-1">
                        {post.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[var(--txt3)]">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {post.readTime}
                        </span>
                        <span className="text-[#2563EB] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="text-center mt-10 sm:mt-12">
              <p className="text-sm text-[var(--txt2)] mb-4">Want a custom guide? Let us know what topic you'd like covered.</p>
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
