import { describe, it, expect } from "vitest";
import { formatLeadArtworkLines, parseLeadArtwork } from "./lead-artwork";

// The three consumers of this format: app/api/contact/route.ts,
// app/api/upload/guest-order/route.ts (writers) and
// app/api/crm/convert-to-order/route.ts (reader).

describe("formatLeadArtworkLines", () => {
  it("emits one Artwork/Download pair per file", () => {
    const lines = formatLeadArtworkLines([
      { name: "logo.png", key: "requests/1-logo.png", size: 2 * 1024 * 1024 },
      { name: "back.ai", key: "guest-uploads/2-back.ai", size: 512 * 1024 },
    ]);
    expect(lines).toEqual([
      "Artwork: logo.png (2.0MB)",
      "Download: /api/chat/upload?key=requests%2F1-logo.png",
      "Artwork: back.ai (512KB)",
      "Download: /api/chat/upload?key=guest-uploads%2F2-back.ai",
    ]);
  });

  it("keeps sub-megabyte files legible instead of rounding them to 0.0MB", () => {
    const lines = formatLeadArtworkLines([{ name: "cap.dst", key: "chat/cap.dst", size: 4096 }]);
    expect(lines[0]).toBe("Artwork: cap.dst (4KB)");
  });

  it("omits the size parenthetical when size is unknown or zero", () => {
    const lines = formatLeadArtworkLines([{ name: "a.png", key: "requests/a.png" }]);
    expect(lines).toEqual([
      "Artwork: a.png",
      "Download: /api/chat/upload?key=requests%2Fa.png",
    ]);
  });

  it("round-trips through the parser", () => {
    const files = [
      { name: "cap front.dst", key: "guest-uploads/9-cap.dst", size: 1024 * 1024 },
      { name: "left chest.pes", key: "guest-uploads/9-lc.pes", size: 2048 },
    ];
    const notes = formatLeadArtworkLines(files).join("\n");
    expect(parseLeadArtwork(notes)).toEqual([
      { name: "cap front.dst", key: "guest-uploads/9-cap.dst", sizeKb: 1024 },
      { name: "left chest.pes", key: "guest-uploads/9-lc.pes", sizeKb: 2 },
    ]);
  });
});

describe("parseLeadArtwork — canonical format", () => {
  it("reads a contact-form lead", () => {
    const notes = [
      "Service: Embroidery Digitizing",
      "Artwork: jaguar.png (1.4MB)",
      "Download: /api/chat/upload?key=requests%2F1699-jaguar.png",
      "",
      "Need this on a left chest",
    ].join("\n");
    expect(parseLeadArtwork(notes)).toEqual([
      { name: "jaguar.png", key: "requests/1699-jaguar.png", sizeKb: 1434 },
    ]);
  });

  it("reads every file, not just the first", () => {
    const notes = [
      "Artwork: a.png (1.0MB)",
      "Download: /api/chat/upload?key=requests%2Fa.png",
      "Artwork: b.png (1.0MB)",
      "Download: /api/chat/upload?key=requests%2Fb.png",
      "Artwork: c.png (1.0MB)",
      "Download: /api/chat/upload?key=requests%2Fc.png",
    ].join("\n");
    expect(parseLeadArtwork(notes).map((f) => f.name)).toEqual(["a.png", "b.png", "c.png"]);
  });

  it("keeps a filename containing parentheses intact", () => {
    const notes = [
      "Artwork: logo (final) v2.png (2.0MB)",
      "Download: /api/chat/upload?key=requests%2Flogo-v2.png",
    ].join("\n");
    expect(parseLeadArtwork(notes)[0].name).toBe("logo (final) v2.png");
  });
});

describe("parseLeadArtwork — legacy guest-upload format", () => {
  // Leads created before the writer was unified are still in the table. If we
  // stop reading this shape, every one of those still converts to an order
  // with no artwork.
  const notes = [
    "Design: Jaguar Head",
    "Placement: Left Chest",
    "",
    "Uploaded Files:",
    "- jaguar.png (1.2MB) — /api/chat/upload?key=guest-uploads%2F1699-jaguar.png",
    "- front.ai (3.4MB) — /api/chat/upload?key=guest-uploads%2F1699-front.ai",
  ].join("\n");

  it("reads every legacy file line", () => {
    expect(parseLeadArtwork(notes)).toEqual([
      { name: "jaguar.png", key: "guest-uploads/1699-jaguar.png", sizeKb: 1229 },
      { name: "front.ai", key: "guest-uploads/1699-front.ai", sizeKb: 3482 },
    ]);
  });

  it("still reads the old single-file legacy line without an em dash", () => {
    const one = "- cap.dst (900KB) - /api/chat/upload?key=guest-uploads%2Fcap.dst";
    expect(parseLeadArtwork(one)).toEqual([
      { name: "cap.dst", key: "guest-uploads/cap.dst", sizeKb: 900 },
    ]);
  });
});

describe("parseLeadArtwork — refusals", () => {
  it("returns nothing for empty, null or artwork-free notes", () => {
    expect(parseLeadArtwork(null)).toEqual([]);
    expect(parseLeadArtwork("")).toEqual([]);
    expect(parseLeadArtwork("Design: X\nPlacement: Cap")).toEqual([]);
  });

  it("rejects traversal, absolute and backslash keys", () => {
    const bad = [
      "Download: /api/chat/upload?key=..%2F..%2Fetc%2Fpasswd",
      "Download: /api/chat/upload?key=%2Fetc%2Fpasswd",
      "Download: /api/chat/upload?key=a%5Cb",
    ].join("\n");
    expect(parseLeadArtwork(bad)).toEqual([]);
  });

  it("attaches one object only once even if the notes repeat it", () => {
    const notes = [
      "Artwork: a.png (1.0MB)",
      "Download: /api/chat/upload?key=requests%2Fa.png",
      "Artwork: a.png (1.0MB)",
      "Download: /api/chat/upload?key=requests%2Fa.png",
    ].join("\n");
    expect(parseLeadArtwork(notes)).toHaveLength(1);
  });

  it("does not pair an Artwork header with a download line from another record", () => {
    const notes = [
      "Artwork: orphan.png (1.0MB)",
      "Notes: no download line followed this one",
      "Download: /api/chat/upload?key=requests%2Freal.png",
    ].join("\n");
    // The header is abandoned; the bare Download line still yields its file.
    expect(parseLeadArtwork(notes)).toEqual([
      { name: "artwork-from-lead", key: "requests/real.png", sizeKb: null },
    ]);
  });

  it("tolerates a trailing markdown bracket after the key", () => {
    const notes = "Download: /api/chat/upload?key=requests%2Fa.png)";
    expect(parseLeadArtwork(notes)[0].key).toBe("requests/a.png");
  });
});
