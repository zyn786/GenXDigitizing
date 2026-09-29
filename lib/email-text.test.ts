import { describe, it, expect } from "vitest";
import {
  stripTags,
  bodyTextOf,
  buildQuote,
  buildQuoteHtml,
  toHtmlBody,
  looksLikeHtml,
} from "./email-text";

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
    expect(bodyTextOf({ direction: "in", body_text: "plain", body_html: "<p>html</p>" })).toBe(
      "plain"
    );
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

describe("toHtmlBody", () => {
  it("converts newlines so they survive the HTML layout", () => {
    // baseLayout has no white-space: pre-wrap — raw newlines collapse.
    expect(toHtmlBody("line one\nline two")).toBe("line one<br>line two");
    expect(toHtmlBody("a\r\nb\rc")).toBe("a<br>b<br>c");
  });

  it("escapes angle brackets so a quoted address is not eaten as a tag", () => {
    expect(toHtmlBody("On Mon, Diane <diane@x.com> wrote:")).toBe(
      "On Mon, Diane &lt;diane@x.com&gt; wrote:"
    );
  });

  it("escapes ampersands and quotes", () => {
    expect(toHtmlBody('Tom & Jerry said "hi"')).toBe("Tom &amp; Jerry said &quot;hi&quot;");
  });

  it("leaves real markup alone", () => {
    const html = "<p>Hello <strong>there</strong></p>";
    expect(toHtmlBody(html)).toBe(html);
  });

  it("treats a bare address in angle brackets as plain text, not a tag", () => {
    // `<diane@x.com>` superficially looks like a tag — it is not one.
    expect(looksLikeHtml("Diane <diane@x.com> wrote:")).toBe(false);
    expect(toHtmlBody("Diane <diane@x.com> wrote:")).toBe("Diane &lt;diane@x.com&gt; wrote:");
  });

  it("handles empty input", () => {
    expect(toHtmlBody("")).toBe("");
    expect(toHtmlBody(null)).toBe("");
  });
});

describe("looksLikeHtml", () => {
  it("recognises real tags, including attributes and self-closing", () => {
    expect(looksLikeHtml("<p>hi</p>")).toBe(true);
    expect(looksLikeHtml('See <a href="https://x.com">this</a>')).toBe(true);
    expect(looksLikeHtml("line<br/>break")).toBe(true);
    expect(looksLikeHtml("<!DOCTYPE html><html>")).toBe(true);
  });

  it("does not mistake plain text for markup", () => {
    expect(looksLikeHtml("plain text, no tags")).toBe(false);
    expect(looksLikeHtml("2 < 3 and 5 > 4")).toBe(false);
    expect(looksLikeHtml("me@example.com")).toBe(false);
  });
});

describe("buildQuoteHtml", () => {
  const msg = {
    direction: "in",
    at: "2026-09-25T02:58:00.000Z",
    from_email: "kleinsembroidery@yahoo.com",
    sender_name: "Diane Klein",
    body_text:
      "Even though this is 1 color, can you change stitch direction?\nDiane Klein\n540-212-1183",
  };

  it("renders an attribution line and a blockquote", () => {
    const html = buildQuoteHtml(msg);
    expect(html).toContain("Diane Klein");
    expect(html).toContain("&lt;kleinsembroidery@yahoo.com&gt;");
    expect(html).toContain("wrote:");
    expect(html).toContain("<blockquote");
    expect(html).toContain("border-left:2px solid");
  });

  it("drops the literal '> ' markers in favour of the visual indent", () => {
    const html = buildQuoteHtml(msg);
    expect(html).not.toContain("&gt; Even though");
    expect(html).toContain("Even though this is 1 color");
  });

  it("keeps the quoted lines separate", () => {
    const html = buildQuoteHtml(msg);
    expect(html).toContain("Diane Klein<br>540-212-1183");
  });

  it("returns nothing when there is nothing to quote", () => {
    expect(buildQuoteHtml({ ...msg, body_text: "", body_html: "" })).toBe("");
    expect(buildQuoteHtml(null)).toBe("");
  });
});
