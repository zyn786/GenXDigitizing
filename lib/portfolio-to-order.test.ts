import { describe, it, expect } from "vitest";
import {
  buildUploadPrefill,
  buildUploadHref,
  parseFormat,
  parseSize,
  parseSpeed,
  readUploadPrefill,
  type PrefillSource,
} from "./portfolio-to-order";

function item(over: Partial<PrefillSource> = {}): PrefillSource {
  return {
    title: "Cap Crest",
    slug: "cap-crest",
    tags: ["Cap"],
    designSize: '4"',
    colors: 6,
    outputFormat: "DST · PES",
    turnaround: "Standard",
    category: { slug: "digitizing", name: "Embroidery Digitizing" },
    ...over,
  };
}

describe("parseFormat", () => {
  it("takes the first offered format out of free text", () => {
    expect(parseFormat("DST · PES")).toBe("DST");
    expect(parseFormat("PES/EMB")).toBe("PES");
    expect(parseFormat("pes")).toBe("PES");
  });

  it("returns empty when nothing we offer is mentioned", () => {
    expect(parseFormat("SVG")).toBe("");
    expect(parseFormat("")).toBe("");
    expect(parseFormat(undefined)).toBe("");
  });
});

describe("parseSpeed", () => {
  it("maps the wording admins actually type", () => {
    expect(parseSpeed("Standard")).toBe("standard");
    expect(parseSpeed("Rush")).toBe("rush");
    expect(parseSpeed("Priority Queue")).toBe("rush");
    expect(parseSpeed("Urgent")).toBe("urgent");
    expect(parseSpeed("Emergency — 3h")).toBe("urgent");
  });

  it("returns empty for anything unrecognised", () => {
    expect(parseSpeed("Whenever")).toBe("");
    expect(parseSpeed(undefined)).toBe("");
  });
});

describe("parseSize", () => {
  it("reads a single measurement as a width", () => {
    expect(parseSize('4"')).toEqual({ width: "4", height: "" });
    expect(parseSize("3.5 in")).toEqual({ width: "3.5", height: "" });
  });

  it("reads two measurements as width and height", () => {
    expect(parseSize('10" x 4"')).toEqual({ width: "10", height: "4" });
    expect(parseSize("3.5x3.5")).toEqual({ width: "3.5", height: "3.5" });
  });

  it("does not mistake a range of widths for a width and a height", () => {
    // The whole point: 3.5-4.5 is a span of widths, not a 3.5x4.5 design.
    expect(parseSize('3.5"–4.5" wide')).toEqual({ width: "3.5", height: "" });
    expect(parseSize("10 to 14 inches")).toEqual({ width: "10", height: "" });
  });

  it("handles missing or numberless input", () => {
    expect(parseSize("")).toEqual({ width: "", height: "" });
    expect(parseSize(undefined)).toEqual({ width: "", height: "" });
    expect(parseSize("large")).toEqual({ width: "", height: "" });
  });
});

describe("buildUploadPrefill", () => {
  it("maps a cap item onto the wizard's vocabulary", () => {
    const p = buildUploadPrefill(item());
    expect(p.garment).toBe("cap");
    expect(p.placement).toBe("cap_front");
    expect(p.format).toBe("DST");
    expect(p.speed).toBe("standard");
    expect(p.width).toBe("4");
    expect(p.colors).toBe("6");
  });

  it("prefers the first matching tag", () => {
    const p = buildUploadPrefill(item({ tags: ["Sleeve", "Cap"] }));
    expect(p.placement).toBe("sleeve_left");
  });

  it("falls back to the category when no tag matches", () => {
    const p = buildUploadPrefill(
      item({ tags: ["Tactical"], category: { slug: "patches", name: "Patch Design" } })
    );
    expect(p.garment).toBe("patch");
    expect(p.placement).toBe("patch_standard");
  });

  it("leaves garment and placement empty for vector art", () => {
    // Vector work has no garment; a guess here would be worse than a blank.
    const p = buildUploadPrefill(
      item({ tags: ["Logo"], category: { slug: "vector", name: "Vector Art" } })
    );
    expect(p.garment).toBe("");
    expect(p.placement).toBe("");
    expect(p.format).toBe("DST");
  });

  it("omits colours when the count is zero or missing", () => {
    expect(buildUploadPrefill(item({ colors: 0 })).colors).toBe("");
    expect(buildUploadPrefill(item({ colors: undefined })).colors).toBe("");
  });

  it("names the source design in the notes", () => {
    expect(buildUploadPrefill(item()).notes).toContain("Cap Crest");
    expect(buildUploadPrefill(item()).notes).toContain("cap-crest");
  });
});

describe("buildUploadHref", () => {
  it("drops empty settings from the query string", () => {
    const href = buildUploadHref(item());
    expect(href.startsWith("/upload?")).toBe(true);
    expect(href).not.toContain("fabric=");
    expect(href).toContain("garment=cap");
    expect(href).toContain("placement=cap_front");
    expect(href).toContain("format=DST");
  });

  it("escapes the free-text note and survives the round trip", () => {
    const href = buildUploadHref(item({ title: 'Ben & Jerry"s' }));
    expect(href).not.toContain('"');
    expect(href).not.toContain(" ");
    const parsed = readUploadPrefill(href.slice(href.indexOf("?")));
    expect(parsed.notes).toContain('Ben & Jerry"s');
  });

  it("returns a bare /upload when nothing maps", () => {
    const href = buildUploadHref({
      title: "Plain",
      slug: "plain",
      tags: [],
      category: { slug: "vector" },
      outputFormat: "",
      turnaround: "",
    });
    // Only the note survives, so this is not bare — but it must still be a
    // valid single-param URL rather than "/upload?".
    expect(href.startsWith("/upload?")).toBe(true);
    expect(href).not.toBe("/upload?");
  });
});

describe("readUploadPrefill", () => {
  it("round-trips a built href", () => {
    const href = buildUploadHref(item());
    const parsed = readUploadPrefill(href.slice(href.indexOf("?")));
    expect(parsed.garment).toBe("cap");
    expect(parsed.placement).toBe("cap_front");
    expect(parsed.format).toBe("DST");
    expect(parsed.speed).toBe("standard");
    expect(parsed.width).toBe("4");
    expect(parsed.colors).toBe("6");
  });

  it("accepts a query string with or without the leading question mark", () => {
    expect(readUploadPrefill("garment=cap").garment).toBe("cap");
    expect(readUploadPrefill("?garment=cap").garment).toBe("cap");
  });

  it("ignores unknown keys and returns only present ones", () => {
    const parsed = readUploadPrefill("?garment=cap&evil=<script>&width=4");
    expect(parsed.garment).toBe("cap");
    expect(parsed.width).toBe("4");
    expect(Object.keys(parsed)).not.toContain("evil");
  });

  it("returns an empty object for an empty query", () => {
    expect(readUploadPrefill("")).toEqual({});
  });

  it("caps runaway values", () => {
    const parsed = readUploadPrefill(`?notes=${"x".repeat(5000)}`);
    expect(parsed.notes?.length).toBe(300);
  });
});
