// @ts-nocheck
import type { MetadataRoute } from "next";

export const revalidate = 86400; // regenerate daily for fresh lastModified dates

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://genxdigitizing.com";

type F = MetadataRoute.Sitemap[number]["changeFrequency"];

function u(path: string, opts: { freq?: F; pri?: number } = {}) {
  const { freq = "monthly", pri = 0.8 } = opts;
  return { url: `${BASE}${path}`, lastModified: new Date(), changeFrequency: freq, priority: pri };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Core ────────────────────────────────────────────
    u("/",              { freq: "weekly",  pri: 1.0 }),

    // ── Marketing ───────────────────────────────────────
    u("/about",         { freq: "monthly", pri: 0.9 }),
    u("/services",      { freq: "weekly",  pri: 0.95 }),
    u("/portfolio",     { freq: "weekly",  pri: 0.9 }),
    u("/pricing",       { freq: "weekly",  pri: 0.95 }),
    u("/blog",          { freq: "weekly",  pri: 0.9 }),
    u("/free-designs",  { freq: "weekly",  pri: 0.85 }),
    u("/upload",        { freq: "monthly", pri: 0.9 }),
    u("/contact",       { freq: "monthly", pri: 0.85 }),
    u("/subscribe",     { freq: "monthly", pri: 0.85 }),

    // ── Blog posts ──────────────────────────────────────
    u("/blog/what-is-embroidery-digitizing",     { freq: "monthly", pri: 0.8 }),
    u("/blog/manual-vs-auto-digitizing",         { freq: "monthly", pri: 0.8 }),
    u("/blog/embroidery-file-formats-explained", { freq: "monthly", pri: 0.8 }),
    u("/blog/how-to-convert-jpg-to-vector",      { freq: "monthly", pri: 0.8 }),

    // ── Service pages ───────────────────────────────────
    u("/services/3d-puff-digitizing",              { freq: "monthly", pri: 0.8 }),
    u("/services/bags-digitizing",                 { freq: "monthly", pri: 0.8 }),
    u("/services/beanies-digitizing",              { freq: "monthly", pri: 0.8 }),
    u("/services/cap-digitizing",                  { freq: "monthly", pri: 0.85 }),
    u("/services/corporate-apparel-digitizing",    { freq: "monthly", pri: 0.85 }),
    u("/services/custom-patches",                  { freq: "monthly", pri: 0.85 }),
    u("/services/embroidery-digitizing",           { freq: "monthly", pri: 0.85 }),
    u("/services/jacket-back-digitizing",          { freq: "monthly", pri: 0.8 }),
    u("/services/left-chest-digitizing",           { freq: "monthly", pri: 0.85 }),
    u("/services/logo-digitizing",                 { freq: "monthly", pri: 0.85 }),
    u("/services/sportswear-digitizing",           { freq: "monthly", pri: 0.85 }),
    u("/services/towels-digitizing",               { freq: "monthly", pri: 0.8 }),
    u("/services/uniforms-digitizing",             { freq: "monthly", pri: 0.85 }),
    u("/services/vector-art-conversion",           { freq: "monthly", pri: 0.85 }),

    // ── Legal ───────────────────────────────────────────
    u("/privacy-policy",        { freq: "yearly", pri: 0.3 }),
    u("/terms-and-conditions",  { freq: "yearly", pri: 0.3 }),
    u("/refund-policy",         { freq: "yearly", pri: 0.3 }),
  ];
}
