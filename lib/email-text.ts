// @ts-nocheck
/**
 * Text helpers for the email panel.
 *
 * These run during render, which means they also run on the **server** for the
 * initial HTML of the client component. Anything touching `document` here will
 * throw "ReferenceError: document is not defined" during SSR, so `stripTags`
 * is deliberately regex-based rather than using a detached DOM node.
 */

/** Convert an HTML body to plain text. Safe on the server — no DOM access. */
export function stripTags(html: string | null | undefined): string {
  if (!html) return "";
  return (
    String(html)
      // Drop the contents of script/style entirely rather than leaving the code
      // behind as text.
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      // Block-level tags become a space so words don't run together.
      .replace(/<\/?(p|div|br|tr|li|h[1-6]|table|blockquote)[^>]*>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Does this text contain HTML markup, or is it plain text?
 *
 * Deliberately stricter than a naive `<[a-z]…>` test: that also matches a bare
 * address in angle brackets (`<diane@x.com>`), which would classify a plain
 * reply as HTML and leave the address unescaped — the very thing toHtmlBody
 * exists to prevent. A real tag has a name followed by `>`, whitespace or `/`.
 */
export function looksLikeHtml(text: string | null | undefined): boolean {
  if (!text) return false;
  return /<!doctype|<\/?[a-z][a-z0-9]*(\s[^<>]*)?\/?>/i.test(text);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Prepare a message body for the HTML email shell.
 *
 * `baseLayout` injects the body raw into `<div class="body">` and the stylesheet
 * has no `white-space: pre-wrap`, so a plain-text body loses every line break —
 * and any `<` in it (an email address in a quote, say) is swallowed as a tag.
 * Body text is therefore escaped with newlines turned into `<br>`.
 *
 * Anything that already contains markup is passed through untouched.
 */
export function toHtmlBody(text: string | null | undefined): string {
  if (!text) return "";
  if (looksLikeHtml(text)) return text;
  return escapeHtml(text).replace(/\r\n|\r|\n/g, "<br>");
}

/** Plain-text body of a message, inbound or outbound. */
export function bodyTextOf(m: any): string {
  if (!m) return "";
  return m.direction === "out" ? m.body || "" : m.body_text || stripTags(m.body_html) || "";
}

/**
 * Gmail-style quoted reply: the original message, prefixed with `>` per line,
 * under an attribution line.
 */
export function buildQuote(m: any, maxChars: number = 4000): string {
  if (!m) return "";
  var text = bodyTextOf(m).trim();
  if (!text) return "";

  // Don't re-quote the original's own quoted history. Match a real attribution
  // line (Gmail's "On … wrote:", Outlook's "-----Original Message-----" or its
  // underscore divider) rather than any line starting with "On ", so a message
  // that merely begins with the word "On" isn't truncated.
  var markers = [
    /\n\s*On .{5,300}?wrote:\s*\n/,
    /\n-{2,}\s*Original Message\s*-{2,}\s*\n/i,
    /\n_{10,}\s*\n/,
  ];
  var cut = -1;
  for (var i = 0; i < markers.length; i++) {
    var match = markers[i].exec(text);
    if (match && (cut === -1 || match.index < cut)) cut = match.index;
  }
  if (cut > 0) text = text.slice(0, cut).trim();

  if (text.length > maxChars) text = text.slice(0, maxChars) + "…";

  var quoted = text
    .split("\n")
    .map(function (line) {
      return "> " + line;
    })
    .join("\n");
  return "\n\n\n" + attribution(m) + "\n" + quoted;
}

/** `On Fri, Sep 25, 2026 at 2:58 AM Diane Klein <d@x.com> wrote:` */
function attribution(m: any): string {
  var when = new Date(m.at).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  var who = m.sender_name ? m.sender_name + " <" + (m.from_email || "") + ">" : m.from_email || "";
  return "On " + when + " " + who + " wrote:";
}

/**
 * The quoted original as HTML, the way Gmail renders it: an attribution line,
 * then the text indented behind a grey rule.
 *
 * Inline styles rather than CSS classes — email clients strip <style> blocks.
 */
export function buildQuoteHtml(m: any, maxChars: number = 4000): string {
  if (!m) return "";
  var plain = bodyTextOf(m).trim();
  if (!plain) return "";

  // Reuse buildQuote's trimming by quoting the plain form, then splitting the
  // attribution back off so it can be styled separately.
  var full = buildQuote(m, maxChars);
  if (!full) return "";

  var marker = "\n" + attribution(m) + "\n";
  var at = full.indexOf(marker);
  var quotedText = at === -1 ? "" : full.slice(at + marker.length);

  // Drop the leading "> " from each quoted line — the visual indent replaces it.
  var body = quotedText
    .split("\n")
    .map(function (line) {
      return line.replace(/^>\s?/, "");
    })
    .join("\n");

  return (
    '<div style="margin-top:24px">' +
    '<div style="font-size:13px;color:#64748B;margin-bottom:10px">' +
    escapeHtml(attribution(m)) +
    "</div>" +
    '<blockquote style="margin:0;padding:0 0 0 14px;border-left:2px solid #E2E8F0;color:#64748B;font-size:14px;line-height:1.7">' +
    toHtmlBody(body) +
    "</blockquote>" +
    "</div>"
  );
}
