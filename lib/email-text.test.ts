import { describe, it, expect } from "vitest";
import { stripTags, bodyTextOf, buildQuote } from "./email-text";

/*
  This suite runs in vitest's "node" environment, where `document` does not
  exist — the same conditions as server-side rendering. A DOM-based
  stripTags() throws "ReferenceError: document is not defined" here, which is
  exactly the bug this guards against.
*/
describe("stripTags", () => {
  it("does not require a DOM", () => {
    expect(typeof document).toBe("undefined");
    expect(() => stripTags("<p>hello</p>")).not.toThrow();
  });

  it("strips tags and collapses whitespace", () => {
    expect(stripTags("<p>Hello   <b>world</b></p>")).toBe("Hello world");
    expect(stripTags("<div>a</div><div>b</div>")).toBe("a b");
    expect(stripTags("<p>line<br>break</p>")).toBe("line break");
  });

  it("drops script and style contents rather than leaking them as text", () => {
    expect(stripTags("<style>.a{color:red}</style>Real text")).toBe("Real text");
    expect(stripTags("<script>alert('x')</script>Real")).toBe("Real");
  });

  it("drops comments", () => {
    expect(stripTags("before<!-- hidden -->after")).toBe("before after");
  });

  it("decodes common entities", () => {
    expect(stripTags("Tom&nbsp;&amp;&nbsp;Jerry")).toBe("Tom & Jerry");
    expect(stripTags("&lt;tag&gt; &quot;quoted&quot; &#39;s&#39;")).toBe(`<tag> "quoted" 's'`);
  });

  it("handles empty input", () => {
    expect(stripTags("")).toBe("");
    expect(stripTags(null)).toBe("");
    expect(stripTags(undefined)).toBe("");
  });
});

describe("bodyTextOf", () => {
  it("prefers body_text for inbound mail", () => {
    expect(bodyTextOf({ direction: "in", body_text: "plain", body_html: "<p>html</p>" })).toBe("plain");
  });

  it("falls back to stripped html for inbound mail", () => {
    expect(bodyTextOf({ direction: "in", body_html: "<p>html <b>only</b></p>" })).toBe("html only");
  });

  it("uses the raw body for outbound mail", () => {
    expect(bodyTextOf({ direction: "out", body: "sent text" })).toBe("sent text");
  });

  it("returns empty for a missing message", () => {
    expect(bodyTextOf(null)).toBe("");
  });
});

describe("buildQuote", () => {
  const msg = {
    direction: "in",
    at: "2026-09-28T09:30:00.000Z",
    from_email: "wk@example.com",
    sender_name: "WK Customs",
    body_text: "I need the attached for applique.\nSecond line.",
  };

  it("attributes the original and prefixes each line with >", () => {
    const quote = buildQuote(msg);
    expect(quote).toContain("WK Customs <wk@example.com> wrote:");
    expect(quote).toContain("> I need the attached for applique.");
    expect(quote).toContain("> Second line.");
    expect(quote.startsWith("\n\n\nOn ")).toBe(true);
  });

  it("falls back to the bare address when there is no display name", () => {
    const quote = buildQuote({ ...msg, sender_name: null });
    expect(quote).toContain("On");
    expect(quote).toContain("wk@example.com wrote:");
  });

  it("trims the original's own quoted history", () => {
    const long = { ...msg, body_text: "Fresh reply.\nOn Mon, someone wrote:\n> ancient history" };
    const quote = buildQuote(long);
    expect(quote).toContain("> Fresh reply.");
    expect(quote).not.toContain("ancient history");
  });

  it("caps very long originals", () => {
    const huge = { ...msg, body_text: "x".repeat(9000) };
    const quote = buildQuote(huge, 100);
    expect(quote.length).toBeLessThan(400);
  });

  it("returns nothing when the original has no text", () => {
    expect(buildQuote({ ...msg, body_text: "", body_html: "" })).toBe("");
    expect(buildQuote(null)).toBe("");
  });
});
