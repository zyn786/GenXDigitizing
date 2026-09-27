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
  return String(html)
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
    .trim();
}

/** Plain-text body of a message, inbound or outbound. */
export function bodyTextOf(m: any): string {
  if (!m) return "";
  return m.direction === "out"
    ? (m.body || "")
    : (m.body_text || stripTags(m.body_html) || "");
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

  var when = new Date(m.at).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
  var who = m.sender_name ? m.sender_name + " <" + m.from_email + ">" : m.from_email;

  var quoted = text.split("\n").map(function (line) { return "> " + line; }).join("\n");
  return "\n\n\nOn " + when + ", " + who + " wrote:\n" + quoted;
}
