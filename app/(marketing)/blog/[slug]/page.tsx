// @ts-nocheck
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { BLOG_POSTS, type BlogPost } from "@/lib/blog-data";
import { BreadcrumbSchema, FAQSchema } from "@/components/shared/StructuredData";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Button } from "@/components/ui/Button";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return <strong key={i} className="text-[var(--txt)]"><em>{part.slice(3, -3)}</em></strong>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-[var(--txt)] font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function PostContent({ post }: { post: BlogPost }) {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }, { name: post.title, url: `/blog/${post.slug}` }]} />
      <FAQSchema faqs={post.faqs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            author: { "@type": "Organization", name: "genxdigitizing" },
          }),
        }}
      />

      <div className="bg-[var(--bg)] text-[var(--txt)] overflow-x-hidden">
        {/* Hero */}
        <section className="relative text-center pt-12 sm:pt-16 pb-8 sm:pb-10 px-4 sm:px-6">
          <GradientOrb color={post.hero.color} size={260} className="top-[-80px] left-1/2 -translate-x-1/2 opacity-10" />
          <div className="flex items-center justify-center gap-2 mb-5">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[var(--elevated)] border border-[var(--border)] text-[var(--txt2)] hover:text-[var(--txt)] hover:border-[var(--border3)] hover:-translate-y-px transition-all duration-200 no-underline"
            >
              <ArrowLeft size={13} />
              All Posts
            </Link>
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
              style={{ background: `${post.hero.color}15`, color: post.hero.color, border: `1px solid ${post.hero.color}25` }}
            >
              {post.hero.emoji} {post.category}
            </span>
          </div>
          <h1 className="font-syne font-bold text-[clamp(28px,6vw,48px)] leading-[1.08] mb-3">{post.title}</h1>
          <p className="text-sm sm:text-base text-[var(--txt2)] max-w-2xl mx-auto mb-4">{post.description}</p>
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--txt3)] mb-6">
            <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
          </div>
          {post.hero.image && (
            <div className="max-w-[760px] mx-auto rounded-2xl overflow-hidden aspect-[16/9] border border-[var(--border)]">
              <img src={post.hero.image} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
        </section>

        {/* Content */}
        <section className="pb-12 sm:pb-16">
          <article className="max-w-[720px] mx-auto px-4 sm:px-6">
            <AnimatedSection>
              <div className="space-y-10 sm:space-y-12">
                {post.sections.map((section, i) => (
                  <div key={i}>
                    <h2 className="font-syne font-bold text-xl sm:text-2xl md:text-3xl mb-4 sm:mb-5 text-[var(--txt)] leading-snug">{section.heading}</h2>
                    <div className="space-y-3 sm:space-y-4">
                      {section.body.split(/\n{2,}/).map((block, j) => {
                        // Tables
                        if (block.startsWith("| ")) {
                          const lines = block.split("\n").filter((r) => r.includes("|"));
                          if (lines.length < 2) return null;
                          const headerRow = lines[0];
                          const dataRows = lines.slice(1).filter((r) => !r.match(/^\|[\s\-:]+\|[\s\-:]+/));
                          if (dataRows.length === 0) return null;
                          const headers = headerRow.split("|").filter(Boolean).map((h) => h.trim());
                          return (
                            <div key={j} className="overflow-x-auto my-5 rounded-xl border border-[var(--border)]">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-[var(--elevated)]">
                                    {headers.map((h) => (
                                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--txt2)]">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {dataRows.map((row, ri) => {
                                    const cells = row.split("|").filter(Boolean).map((c) => c.trim());
                                    return (
                                      <tr key={ri} className="border-t border-[var(--border)] even:bg-[var(--surface)]">
                                        {cells.map((cell, ci) => (
                                          <td key={ci} className="px-4 py-3 text-[13px] sm:text-sm text-[var(--txt2)] leading-relaxed">{renderInline(cell)}</td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                        // Bullet lists (lines starting with - or •)
                        if (block.match(/^[-•]\s/m)) {
                          const items = block.split("\n").filter((l) => l.match(/^[-•]\s/));
                          if (items.length === 0) return <p key={j} className="text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed">{renderInline(block)}</p>;
                          return (
                            <ul key={j} className="space-y-2 pl-0 list-none">
                              {items.map((item, k) => {
                                const clean = item.replace(/^[-•]\s*/, "");
                                return (
                                  <li key={k} className="flex items-start gap-3 text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2563EB]/40 flex-shrink-0" />
                                    <span>{renderInline(clean)}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        }
                        // Numbered lists
                        if (block.match(/^\d+\.\s/m)) {
                          const items = block.split("\n").filter((l) => l.match(/^\d+\.\s/));
                          if (items.length === 0) return <p key={j} className="text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed">{renderInline(block)}</p>;
                          return (
                            <ol key={j} className="space-y-2 pl-0 list-none">
                              {items.map((item, k) => {
                                const clean = item.replace(/^\d+\.\s*/, "");
                                return (
                                  <li key={k} className="flex items-start gap-3 text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-bold flex items-center justify-center mt-0.5">{k + 1}</span>
                                    <span>{renderInline(clean)}</span>
                                  </li>
                                );
                              })}
                            </ol>
                          );
                        }
                        // Multi-line bold-definition pattern: "**Term** — definition" on multiple lines
                        if (block.includes("**") && block.split("\n").length > 1 && block.split("\n").every((l) => l.trim().startsWith("**") || l.trim() === "")) {
                          const items = block.split("\n").filter((l) => l.trim().startsWith("**"));
                          return (
                            <div key={j} className="space-y-2">
                              {items.map((item, k) => (
                                <p key={k} className="text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed flex items-start gap-2">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]/30 flex-shrink-0" />
                                  <span>{renderInline(item.trim())}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        // Regular paragraph
                        const lines = block.split("\n").filter(Boolean);
                        if (lines.length > 1 && !block.startsWith("|") && !block.match(/^[-•\d]+\s/m)) {
                          // Multiple lines without markdown — join with line breaks
                          return (
                            <p key={j} className="text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed">
                              {lines.map((line, li) => (
                                <span key={li}>{li > 0 && <><br /></>}{renderInline(line)}</span>
                              ))}
                            </p>
                          );
                        }
                        return (
                          <p key={j} className="text-[15px] sm:text-base text-[var(--txt2)] leading-relaxed">
                            {renderInline(block)}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Internal Links */}
              <div className="mt-10 p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <h3 className="font-syne font-bold text-sm mb-3 text-[var(--txt)]">Continue Reading</h3>
                <div className="flex flex-wrap gap-2">
                  {post.internalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs font-medium text-[#2563EB] hover:underline px-3 py-1.5 rounded-full bg-[#2563EB]/5 border border-[#2563EB]/15 transition-colors hover:bg-[#2563EB]/10"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#2563EB]/10 via-[#7C3AED]/5 to-[#F97316]/5 border border-[#2563EB]/15">
                <h3 className="font-syne font-bold text-lg sm:text-xl mb-2">Ready to Get Started?</h3>
                <p className="text-sm text-[var(--txt2)] mb-4 max-w-md mx-auto">Professional digitizing from $7. Free revisions. Free formats. 12-hour delivery.</p>
                <Link href={post.cta.href}>
                  <Button variant="grad" size="md" rightIcon={<ArrowRight size={14} />}>
                    {post.cta.label}
                  </Button>
                </Link>
              </div>
            </AnimatedSection>
          </article>
        </section>
      </div>
    </>
  );
}

export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) notFound();
  return <PostContent post={post} />;
}
