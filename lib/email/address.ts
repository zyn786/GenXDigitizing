/**
 * Address normalisation for outbound mail — the single source of truth.
 *
 * `RESEND_FROM_EMAIL` may hold either a bare address (`order@x.com`) or a full
 * pair (`GenX Digitizing <order@x.com>`) depending on how it was configured.
 * The previous composition interpolated that raw value *inside* angle brackets:
 *
 *     `genxdigitizing <GenX Digitizing <order@genxdigitizing.com>>`
 *
 * Nested angle brackets — not a valid RFC 5322 From header. Resend's parser has
 * to guess, and the logged `from_email` never matched what went on the wire.
 *
 * Every send path now composes through here. Do not build a From header by
 * string interpolation anywhere else.
 *
 * Pure functions, no Supabase import — keep this module dependency-free so the
 * rules stay trivially testable.
 */

/** Used when neither RESEND_FROM_EMAIL nor a caller-supplied address is present. */
export const DEFAULT_FROM_ADDRESS = "order@genxdigitizing.com";

/** Used when neither RESEND_FROM_NAME nor a display name is present. */
export const DEFAULT_FROM_NAME = "GenX Digitizing";

/** Where replies go when RESEND_REPLY_TO is unset. Must be a monitored mailbox. */
export const DEFAULT_REPLY_TO = "support@genxdigitizing.com";

/** Last-resort domain check — mirrors RESEND_FROM_DOMAIN in the composer route. */
export function senderDomain(): string {
  return (process.env.RESEND_FROM_DOMAIN || "genxdigitizing.com").toLowerCase();
}

/** Pull the bare address out of `Name <addr@x.com>` or `addr@x.com`. */
export function bareAddress(value: string | null | undefined): string {
  const m = /<([^>]+)>/.exec(value || "");
  return (m ? m[1] : value || "").trim().toLowerCase();
}

/** Pull the display name out of `Name <addr@x.com>`; empty when there isn't one. */
export function displayName(value: string | null | undefined): string {
  const raw = (value || "").trim();
  if (!raw.includes("<")) return "";
  const m = /^\s*"?([^"<]*?)"?\s*</.exec(raw);
  return m ? m[1].trim() : "";
}

/** True when `value` is a syntactically usable address on our sending domain. */
export function isAllowedSender(value: string | null | undefined): boolean {
  const email = bareAddress(value);
  const at = email.lastIndexOf("@");
  if (at <= 0) return false;
  return email.slice(at + 1) === senderDomain();
}

/**
 * Build a valid `Name <addr>` From header from an env-style value.
 *
 * Accepts `Name <addr>`, `<addr>` or a bare address, and never nests brackets.
 * Falls back to the module defaults when the input is empty or unusable, so a
 * misconfigured env var degrades to a working sender instead of a broken header.
 */
export function composeFrom(value?: string | null, fallbackName?: string | null): string {
  const raw = (value ?? process.env.RESEND_FROM_EMAIL ?? "").trim();
  const address = bareAddress(raw) || DEFAULT_FROM_ADDRESS;
  const name =
    displayName(raw) ||
    (fallbackName ?? "").trim() ||
    (process.env.RESEND_FROM_NAME ?? "").trim() ||
    DEFAULT_FROM_NAME;
  return `${name} <${address}>`;
}

/** Resolve the Reply-To address, falling back to the monitored support mailbox. */
export function composeReplyTo(value?: string | null): string {
  return bareAddress(value ?? process.env.RESEND_REPLY_TO ?? "") || DEFAULT_REPLY_TO;
}
