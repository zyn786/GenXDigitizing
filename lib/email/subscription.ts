// @ts-nocheck
/**
 * Subscription email triggers via Resend.
 * Called from API routes — fire-and-forget (non-blocking).
 */
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { bareAddress, composeFrom, composeReplyTo } from "@/lib/email/address";
import { logEmailFailure } from "@/lib/email/log";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _resend = new Resend(key);
  }
  return _resend;
}
// Composed through lib/email/address so the header can never nest brackets, and
// so this file and lib/email/index.ts share one fallback instead of disagreeing
// on both the display name and the mailbox.
const FROM = composeFrom();
// Previously unset, so replies went to the sending address. Point them at a
// monitored mailbox instead.
const REPLY = composeReplyTo();

function send(options: { to: string; subject: string; html: string }) {
  return getResend()
    .emails.send({ from: FROM, reply_to: REPLY, ...options })
    .then(async (result) => {
      // Resend reports API-level rejections in the resolved value rather than by
      // throwing — check it, or a rejected send gets logged as a success.
      const apiError = (result as any)?.error;
      if (apiError) {
        console.error(`[email/subscription] Resend rejected "${options.subject}":`, apiError);
        await logEmailFailure({
          to: options.to,
          from: FROM,
          subject: options.subject,
          error: apiError,
        });
        return result;
      }

      // Log to sent_emails so the admin /email page shows full send history
      try {
        await createAdminClient()
          .from("sent_emails")
          .insert({
            to_email: options.to,
            from_email: bareAddress(FROM),
            subject: options.subject,
            body: options.html
              .replace(/<[^>]*>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 2000),
            resend_id: result?.data?.id || null,
          });
      } catch (logErr) {
        console.error("[email/subscription] sent_emails log error:", logErr);
      }
      return result;
    })
    .catch(async (e) => {
      console.error(`[email/subscription] Failed to send "${options.subject}":`, e);
      await logEmailFailure({ to: options.to, from: FROM, subject: options.subject, error: e });
    });
}

export function emailSubscriptionRequested(
  to: string,
  planLabel: string,
  price: number,
  designs: number
) {
  return send({
    to,
    subject: `Plan Requested — ${planLabel} Plan`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#2563EB">Plan Request Received 🎉</h2>
      <p>You requested the <strong>${planLabel} Plan</strong> — ${designs} designs/month at $${price}/mo.</p>
      <p>Our team will send you a payment link shortly. Once payment is confirmed, your plan will be activated.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/subscribe" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:12px;text-decoration:none;font-weight:600">View Subscription</a>
      <p style="color:#6B7280;font-size:12px;margin-top:24px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}

export function emailSubscriptionApproved(
  to: string,
  planLabel: string,
  price: number,
  designs: number,
  paymentLink?: string,
  features?: string[]
) {
  const featuresHtml = features?.length
    ? `<div style="margin:16px 0;padding:16px;background:#F0FDF4;border-radius:12px;border:1px solid rgba(22,163,74,0.2)">
        <p style="font-weight:700;color:#16A34A;margin:0 0 8px">🎁 Your ${planLabel} Benefits:</p>
        <ul style="margin:0;padding-left:20px">${features.map((f) => `<li style="color:#166534;font-size:13px;margin-bottom:4px">${f}</li>`).join("")}</ul>
       </div>`
    : "";

  return send({
    to,
    subject: `Subscription Activated — ${planLabel} Plan`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="text-align:center;margin-bottom:20px">
        <h2 style="color:#16A34A;margin:0">Subscription Activated ✅</h2>
        <p style="color:#6B7280;font-size:14px;margin:4px 0 0">Welcome to ${planLabel} — you're all set!</p>
      </div>

      <div style="background:#F8FAFC;border-radius:16px;padding:20px;margin-bottom:16px">
        <p style="margin:0 0 12px;font-size:15px"><strong>${planLabel} Plan</strong></p>
        <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#16A34A">$${price}<span style="font-size:14px;color:#6B7280;font-weight:400">/month</span></p>
        <p style="margin:0;color:#6B7280;font-size:13px">${designs} basic designs per month</p>
      </div>

      ${featuresHtml}

      <div style="margin:16px 0;padding:16px;background:#EFF6FF;border-radius:12px;border:1px solid rgba(37,99,235,0.2)">
        <p style="font-weight:700;color:#2563EB;margin:0 0 6px">📋 What's Next?</p>
        <p style="color:#1E40AF;font-size:13px;margin:0 0 4px">• Place your first order from your dashboard</p>
        <p style="color:#1E40AF;font-size:13px;margin:0 0 4px">• Designs reset each month — use them!</p>
        <p style="color:#1E40AF;font-size:13px;margin:0">• Unused designs roll over for 30 days</p>
      </div>

      <div style="text-align:center;margin:20px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/new-order" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Place Your First Order</a>
      </div>

      ${paymentLink ? `<p style="text-align:center;font-size:12px;color:#6B7280">Payment link: <a href="${paymentLink}" style="color:#2563EB">${paymentLink}</a></p>` : ""}

      <p style="color:#9CA3AF;font-size:11px;margin-top:24px;text-align:center;border-top:1px solid #E5E7EB;padding-top:16px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}

export function emailSubscriptionReceipt(
  to: string,
  planLabel: string,
  invoiceNumber: string,
  amount: number,
  designs: number,
  features?: string[]
) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const featuresHtml = features?.length
    ? `<ul style="margin:8px 0 0;padding-left:20px">${features.map((f) => `<li style="color:#374151;font-size:13px;margin-bottom:3px">${f}</li>`).join("")}</ul>`
    : "";

  return send({
    to,
    subject: `Subscription Receipt — ${planLabel} Plan`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="text-align:center;margin-bottom:20px">
        <h2 style="color:#16A34A;margin:0">Payment Confirmed 🧾</h2>
        <p style="color:#6B7280;font-size:14px;margin:4px 0 0">Your subscription receipt</p>
      </div>

      <div style="background:#F8FAFC;border-radius:16px;padding:20px;margin-bottom:16px;border:1px solid #E5E7EB">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr><td style="padding:6px 0;color:#6B7280">Invoice</td><td style="text-align:right;font-weight:600;color:#111827">${invoiceNumber || "N/A"}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Date</td><td style="text-align:right;font-weight:600;color:#111827">${today}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Plan</td><td style="text-align:right;font-weight:600;color:#111827">${planLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#6B7280">Designs</td><td style="text-align:right;font-weight:600;color:#111827">${designs}/month</td></tr>
          <tr style="border-top:2px solid #E5E7EB"><td style="padding:8px 0;font-weight:700;font-size:15px;color:#111827">Total Paid</td><td style="text-align:right;font-weight:800;font-size:18px;color:#16A34A">$${amount}</td></tr>
        </table>
      </div>

      ${featuresHtml ? `<div style="margin:16px 0;padding:16px;background:#F0FDF4;border-radius:12px;border:1px solid rgba(22,163,74,0.2)"><p style="font-weight:700;color:#16A34A;margin:0 0 6px">🎁 Your Benefits:</p>${featuresHtml}</div>` : ""}

      <div style="text-align:center;margin:20px 0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/new-order" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Start Ordering</a>
      </div>

      <p style="color:#9CA3AF;font-size:11px;margin-top:24px;text-align:center;border-top:1px solid #E5E7EB;padding-top:16px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}

export function emailPaymentLinkSent(
  to: string,
  planLabel: string,
  price: number,
  designs: number,
  paymentLink: string
) {
  return send({
    to,
    subject: `Payment Link Ready — ${planLabel} Plan`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="text-align:center;margin-bottom:20px">
        <h2 style="color:#2563EB;margin:0">Payment Link Ready 💳</h2>
        <p style="color:#6B7280;font-size:14px;margin:4px 0 0">Complete your payment to activate your plan</p>
      </div>

      <div style="background:#F8FAFC;border-radius:16px;padding:20px;margin-bottom:16px;text-align:center">
        <p style="margin:0 0 4px;font-size:15px;font-weight:600">${planLabel} Plan</p>
        <p style="margin:0 0 8px;font-size:28px;font-weight:800;color:#2563EB">$${price}<span style="font-size:14px;color:#6B7280;font-weight:400">/month</span></p>
        <p style="margin:0;color:#6B7280;font-size:13px">${designs} basic designs per month</p>
      </div>

      <div style="text-align:center;margin:24px 0">
        <a href="${paymentLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#fff;border-radius:14px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 16px rgba(37,99,235,0.3)">Pay Now — $${price}/mo</a>
      </div>

      <p style="text-align:center;color:#6B7280;font-size:12px">After payment, your plan will be activated within 1 business hour.</p>
      <p style="text-align:center;color:#9CA3AF;font-size:12px">Having trouble? Reply to this email or contact support.</p>

      <p style="color:#9CA3AF;font-size:11px;margin-top:24px;text-align:center;border-top:1px solid #E5E7EB;padding-top:16px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}

export function emailCancelRequested(
  to: string,
  planLabel: string,
  reason?: string,
  notes?: string | null
) {
  const reasonLabelMap: Record<string, string> = {
    too_expensive: "Too expensive",
    not_enough_designs: "Not enough designs",
    found_alternative: "Found an alternative",
    not_using_enough: "Not using it enough",
    poor_quality: "Quality concerns",
    other: "Other",
  };
  const reasonLabel = reason ? reasonLabelMap[reason] || reason : "Not specified";

  return send({
    to,
    subject: `Cancellation Request Received — ${planLabel} Plan`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#F59E0B">Cancellation Request Received ⏳</h2>
      <p>Your request to cancel the <strong>${planLabel} Plan</strong> has been received and is under review.</p>
      <p><strong>Reason:</strong> ${reasonLabel}${notes ? ` — "${notes}"` : ""}</p>
      <p>Our team will review your request and confirm the cancellation within 1 business day. Your plan remains active until then.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/subscribe" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;margin-top:16px">View Subscription</a>
      <p style="color:#6B7280;font-size:12px;margin-top:24px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}

export function emailSubscriptionCancelled(
  to: string,
  planLabel: string,
  reason?: string,
  notes?: string | null
) {
  const reasonLabelMap: Record<string, string> = {
    too_expensive: "Too expensive",
    not_enough_designs: "Not enough designs",
    found_alternative: "Found an alternative",
    not_using_enough: "Not using it enough",
    poor_quality: "Quality concerns",
    cancelled_by_admin: "Cancelled by admin",
    rejected_by_admin: "Rejected by admin",
    plan_change: "Changed to a different plan",
    other: "Other",
  };
  const reasonLabel = reason ? reasonLabelMap[reason] || reason : "Not specified";

  return send({
    to,
    subject: `Subscription Cancelled — ${planLabel} Plan`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#DC2626">Subscription Cancelled</h2>
      <p>Your <strong>${planLabel} Plan</strong> has been cancelled.</p>
      <p><strong>Reason:</strong> ${reasonLabel}${notes ? ` — "${notes}"` : ""}</p>
      <p>You can re-subscribe at any time from your dashboard.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/subscribe" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:12px;text-decoration:none;font-weight:600">View Plans</a>
      <p style="color:#6B7280;font-size:12px;margin-top:24px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}

export function emailSubscriptionExpiring(
  to: string,
  planLabel: string,
  daysLeft: number,
  designsRemaining: number
) {
  return send({
    to,
    subject: `Subscription Expiring Soon — ${daysLeft} Days Left`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#F59E0B">Subscription Expiring in ${daysLeft} Days ⏰</h2>
      <p>Your <strong>${planLabel} Plan</strong> will expire soon.</p>
      <p><strong>${designsRemaining} designs</strong> remaining — use them before they expire!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/new-order" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:12px;text-decoration:none;font-weight:600">Place Order Now</a>
      <p style="color:#6B7280;font-size:12px;margin-top:24px">GenXdigitizing — Professional Embroidery Digitizing</p>
    </div>`,
  });
}
