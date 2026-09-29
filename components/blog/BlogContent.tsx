"use client";

import Link from "next/link";
import { ArrowRight, Clock, Calendar, ArrowLeft } from "lucide-react";
import type { BlogPost } from "@/lib/blog-data";
import { GradientOrb } from "@/components/shared/GradientOrb";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

function renderInline(text: string) {
  const parts = text.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("***") && part.endsWith("***")) {
      return (
        <strong key={i} className="text-[var(--txt)]">
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[var(--txt)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function SectionBlock({ block }: { block: string }) {
  // Tables
  if (block.startsWith("| ")) {
    const lines = block.split("\n").filter((r) => r.includes("|"));
    if (lines.length < 2) return null;
    const headerRow = lines[0];
    const dataRows = lines.slice(1).filter((r) => !r.match(/^\|[\s\-:]+\|[\s\-:]+/));
    if (dataRows.length === 0) return null;
    const headers = headerRow
      .split("|")
      .filter(Boolean)
      .map((h) => h.trim());
    return (
      <div className="my-5 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--elevated)]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[var(--txt2)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => {
              const cells = row
                .split("|")
                .filter(Boolean)
                .map((c) => c.trim());
              return (
                <tr key={ri} className="border-t border-[var(--border)] even:bg-[var(--surface)]">
                  {cells.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-[13px] leading-relaxed text-[var(--txt2)] sm:text-sm"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
  // Bullet lists
  if (block.match(/^[-•]\s/m)) {
    const items = block.split("\n").filter((l) => l.match(/^[-•]\s/));
    if (items.length === 0)
      return (
        <p className="text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base">
          {renderInline(block)}
        </p>
      );
    return (
      <ul className="list-none space-y-2 pl-0">
        {items.map((item, k) => {
          const clean = item.replace(/^[-•]\s*/, "");
          return (
            <li
              key={k}
              className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base"
            >
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2563EB]/40" />
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
    if (items.length === 0)
      return (
        <p className="text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base">
          {renderInline(block)}
        </p>
      );
    return (
      <ol className="list-none space-y-2 pl-0">
        {items.map((item, k) => {
          const clean = item.replace(/^\d+\.\s*/, "");
          return (
            <li
              key={k}
              className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base"
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB]/10 text-xs font-bold text-[#2563EB]">
                {k + 1}
              </span>
              <span>{renderInline(clean)}</span>
            </li>
          );
        })}
      </ol>
    );
  }
  // Bold-definition pattern
  if (
    block.includes("**") &&
    block.split("\n").length > 1 &&
    block.split("\n").every((l) => l.trim().startsWith("**") || l.trim() === "")
  ) {
    const items = block.split("\n").filter((l) => l.trim().startsWith("**"));
    return (
      <div className="space-y-2">
        {items.map((item, k) => (
          <p
            key={k}
            className="flex items-start gap-2 text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base"
          >
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#2563EB]/30" />
            <span>{renderInline(item.trim())}</span>
          </p>
        ))}
      </div>
    );
  }
  // Regular paragraph
  const lines = block.split("\n").filter(Boolean);
  if (lines.length > 1 && !block.startsWith("|") && !block.match(/^[-•\d]+\s/m)) {
    return (
      <p className="text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base">
        {lines.map((line, li) => (
          <span key={li}>
            {li > 0 && (
              <>
                <br />
              </>
            )}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
  }
  return (
    <p className="text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base">
      {renderInline(block)}
    </p>
  );
}

export default function BlogContent({
  post,
  showBack = true,
  children,
}: {
  post: BlogPost;
  showBack?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="overflow-x-hidden bg-[var(--bg)] text-[var(--txt)]">
      {/* Hero */}
      <section className="relative px-4 pb-8 pt-12 text-center sm:px-6 sm:pb-10 sm:pt-16">
        <GradientOrb
          color={post.hero.color}
          size={260}
          className="left-1/2 top-[-80px] -translate-x-1/2 opacity-10"
        />
        <div className="mb-5 flex items-center justify-center gap-2">
          {showBack && (
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--elevated)] px-3.5 py-2 text-xs font-medium text-[var(--txt2)] no-underline transition-all duration-200 hover:-translate-y-px hover:border-[var(--border3)] hover:text-[var(--txt)]"
            >
              <ArrowLeft size={13} />
              All Posts
            </Link>
          )}
          <span
            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
            style={{
              background: `${post.hero.color}15`,
              color: post.hero.color,
              border: `1px solid ${post.hero.color}25`,
            }}
          >
            {post.hero.emoji} {post.category}
          </span>
        </div>
        <h1 className="mb-3 font-syne text-[clamp(28px,6vw,48px)] font-bold leading-[1.08]">
          {post.title}
        </h1>
        <p className="mx-auto mb-4 max-w-2xl text-sm text-[var(--txt2)] sm:text-base">
          {post.description}
        </p>
        <div className="mb-6 flex items-center justify-center gap-4 text-xs text-[var(--txt3)]">
          <span className="flex items-center gap-1">
            <Calendar size={12} /> {post.date || new Date().toISOString().split("T")[0]}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {post.readTime || "6 min read"}
          </span>
        </div>
        {post.hero.image && (
          <div className="relative mx-auto aspect-[16/9] max-w-[760px] overflow-hidden rounded-2xl border border-[var(--border)]">
            <Image
              fill
              src={post.hero.image}
              alt={post.title}
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}
      </section>

      {/* Content */}
      <section className="pb-12 sm:pb-16">
        <article className="mx-auto max-w-[720px] px-4 sm:px-6">
          <AnimatedSection>
            <div className="space-y-12 sm:space-y-16">
              {post.sections.map((section, i) => (
                <div key={i}>
                  {/* Heading with left accent bar */}
                  <div className="mb-4 flex items-start gap-3 sm:mb-5 sm:gap-4">
                    <div
                      className="mt-1.5 h-6 w-1 flex-shrink-0 rounded-full sm:mt-2 sm:h-8 sm:w-1.5"
                      style={{
                        background: `linear-gradient(180deg, ${post.hero.color}, ${post.hero.color}40)`,
                      }}
                    />
                    <h2 className="font-syne text-xl font-bold leading-snug text-[var(--txt)] sm:text-2xl md:text-3xl">
                      {section.heading}
                    </h2>
                  </div>

                  {/* Layout: image-top (single full-width image) */}
                  {(section.layout === "image-top" || (!section.layout && section.image)) &&
                    section.image && (
                      <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl border border-[var(--border)]">
                        <Image
                          fill
                          src={section.image}
                          alt={section.heading}
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 800px"
                        />
                      </div>
                    )}

                  {/* Layout: image-left — image beside text */}
                  {section.layout === "image-left" && section.image && (
                    <div className="mb-5 grid items-start gap-4 sm:grid-cols-2 sm:gap-5">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)]">
                        <Image
                          fill
                          src={section.image}
                          alt={section.heading}
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 800px"
                        />
                      </div>
                      <div className="text-[15px] leading-relaxed text-[var(--txt2)] sm:text-base">
                        {section.body.split(/\n{2,}/).map((block, j) => (
                          <SectionBlock key={j} block={block} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Layout: image-right — text beside image */}
                  {section.layout === "image-right" && section.image && (
                    <div className="mb-5 grid items-start gap-4 sm:grid-cols-2 sm:gap-5">
                      <div className="order-2 text-[15px] leading-relaxed text-[var(--txt2)] sm:order-1 sm:text-base">
                        {section.body.split(/\n{2,}/).map((block, j) => (
                          <SectionBlock key={j} block={block} />
                        ))}
                      </div>
                      <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] sm:order-2">
                        <Image
                          fill
                          src={section.image}
                          alt={section.heading}
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 800px"
                        />
                      </div>
                    </div>
                  )}

                  {/* Layout: comparison — before/after */}
                  {section.layout === "comparison" && (section.images || []).length >= 2 && (
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="border-b border-[var(--border)] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--txt2)]">
                          Before
                        </div>
                        <div className="relative aspect-[4/3]">
                          <Image
                            fill
                            src={(section.images || [])[0]}
                            alt="Before"
                            className="object-cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="border-b border-[var(--border)] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--txt2)]">
                          After
                        </div>
                        <div className="relative aspect-[4/3]">
                          <Image
                            fill
                            src={(section.images || [])[1]}
                            alt="After"
                            className="object-cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layout: image-grid-2 */}
                  {section.layout === "image-grid-2" && (section.images || []).length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      {(section.images || []).map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)]"
                        >
                          <Image
                            fill
                            src={url}
                            alt={`${section.heading} — image ${imgIdx + 1}`}
                            className="object-cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Layout: image-grid-3 */}
                  {section.layout === "image-grid-3" && (section.images || []).length > 0 && (
                    <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
                      {(section.images || []).map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
                        >
                          <Image
                            fill
                            src={url}
                            alt={`${section.heading} — image ${imgIdx + 1}`}
                            className="object-cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Layout: image-grid-4 */}
                  {section.layout === "image-grid-4" && (section.images || []).length > 0 && (
                    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                      {(section.images || []).map((url, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border)]"
                        >
                          <Image
                            fill
                            src={url}
                            alt={`${section.heading} — image ${imgIdx + 1}`}
                            className="object-cover"
                            loading="lazy"
                            sizes="(max-width: 768px) 100vw, 800px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Only render body here for layouts that don't already render it */}
                  {section.layout !== "image-left" && section.layout !== "image-right" && (
                    <div className="space-y-3 sm:space-y-4">
                      {section.body.split(/\n{2,}/).map((block, j) => (
                        <SectionBlock key={j} block={block} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Internal Links */}
            {post.internalLinks.length > 0 && (
              <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h3 className="mb-3 font-syne text-sm font-bold text-[var(--txt)]">
                  Continue Reading
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.internalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-full border border-[#2563EB]/15 bg-[#2563EB]/5 px-3 py-1.5 text-xs font-medium text-[#2563EB] transition-colors hover:bg-[#2563EB]/10 hover:underline"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Slot: comments, related posts, etc. */}
            {children}

            {/* CTA */}
            <div className="mt-12 rounded-2xl border border-[var(--border)] bg-white/90 p-6 text-center sm:p-8">
              <h3 className="mb-2 font-syne text-lg font-bold sm:text-xl">Ready to Get Started?</h3>
              <p className="mx-auto mb-5 max-w-md text-sm leading-relaxed text-[var(--txt2)]">
                {post.cta.text}
              </p>
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
  );
}
