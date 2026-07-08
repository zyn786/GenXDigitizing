// @ts-nocheck
/**
 * Transactional email via Resend.
 * All email triggers defined here with modern branded templates.
 * Logo, responsive design, attachment support for invoice PDFs.
 */

import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}

const FROM    = `${process.env.RESEND_FROM_NAME ?? "genxdigitizing"} <${process.env.RESEND_FROM_EMAIL || "support@genxdigitizing.com"}>`;
const REPLY   = process.env.RESEND_REPLY_TO || "support@genxdigitizing.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.genxdigitizing.com";
const LOGO_URL = `${APP_URL}/images/black_logo.png`;
const TRUSTPILOT_BCC = "genxdigitizing.com+a5c28d839b@invite.trustpilot.com";

// ── Types ──────────────────────────────────────────────────────

interface Attachment {
  filename: string;
  content: Buffer | string;
  content_type?: string;
}

interface SendParams {
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: Attachment[];
  bcc?: string | string[];
}

// ── Send helper ────────────────────────────────────────────────

async function sendEmail(params: SendParams) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      reply_to: params.reply_to ?? REPLY,
      bcc: params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : undefined,
      attachments: params.attachments?.map(a => ({
        filename: a.filename,
        content: a.content instanceof Buffer
          ? a.content.toString("base64")
          : Buffer.from(a.content).toString("base64"),
      })),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[email] Unexpected error:", err);
    return { success: false, error: err };
  }
}

// ── Base layout with logo ──────────────────────────────────────

export function baseLayout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Arial, sans-serif;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #FFFFFF;
    }

    /* ── Header ─────────────────────────────── */
    .header {
      padding: 36px 32px 0;
      text-align: left;
    }
    .header img {
      height: 28px;
      width: auto;
    }
    .header-line {
      height: 1px;
      background: #E2E8F0;
      margin: 20px 0 0;
    }

    /* ── Body ────────────────────────────────── */
    .body {
      padding: 24px 32px 20px;
      color: #1E293B;
      font-size: 15px;
      line-height: 1.8;
    }
    .body p { margin: 0 0 16px; }
    .body p:last-child { margin-bottom: 0; }
    .body strong { color: #0F172A; }

    .greeting {
      font-size: 20px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 10px !important;
      line-height: 1.3;
    }

    /* ── Detail card ──────────────────────────── */
    .detail-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 18px 20px;
      margin: 18px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #F1F5F9;
      font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748B; font-size: 13px; font-weight: 600; }
    .detail-value { font-weight: 700; color: #0F172A; font-size: 14px; }
    .order-num {
      color: #1D4ED8;
      font-family: 'SF Mono', 'Courier New', monospace;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.5px;
      background: #DBEAFE;
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* ── Status / info cards ──────────────────── */
    .info-card {
      border-radius: 10px;
      padding: 16px 20px;
      margin: 16px 0;
      font-size: 14px;
      line-height: 1.8;
      font-weight: 500;
    }
    .info-card-green  { background: #F0FDF4; border: 1px solid #BBF7D0; color: #14532D; }
    .info-card-amber  { background: #FFFBEB; border: 1px solid #FDE68A; color: #78350F; }
    .info-card-blue   { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E3A8A; }
    .info-card-red    { background: #FEF2F2; border: 1px solid #FECACA; color: #7F1D1D; }
    .info-card-purple { background: #F5F3FF; border: 1px solid #DDD6FE; color: #4C1D95; }

    /* ── Badges ───────────────────────────────── */
    .badge-free {
      display: inline-block;
      background: #16A34A;
      color: #FFFFFF;
      padding: 3px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
    }
    .badge-highlight {
      display: inline-block;
      background: #2563EB;
      color: #FFFFFF;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
    }

    /* ── CTA button ───────────────────────────── */
    .cta-wrap { text-align: center; margin: 24px 0 8px; }
    .cta {
      display: inline-block;
      background: #2563EB;
      color: #FFFFFF !important;
      padding: 14px 36px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
    }

    /* ── Feature grid ─────────────────────────── */
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 18px 0;
    }
    .feature-item {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 14px;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      color: #1E40AF;
    }
    .feature-item .icon { font-size: 20px; display: block; margin-bottom: 4px; }

    /* ── Footer ───────────────────────────────── */
    .footer {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 28px 32px 22px;
      text-align: center;
      font-size: 11px;
      color: #94A3B8;
      line-height: 2;
    }
    .footer img {
      height: 20px;
      width: auto;
      margin-bottom: 8px;
    }
    .footer-tagline {
      margin: 0;
      font-size: 11px;
      color: #94A3B8;
      font-weight: 500;
    }
    .footer-divider {
      width: 24px;
      height: 1px;
      background: #E2E8F0;
      margin: 14px auto;
    }
    .footer a {
      color: #475569;
      text-decoration: none;
      font-weight: 500;
      font-size: 11px;
    }
    .footer-copy {
      font-size: 10px;
      color: #CBD5E1;
      margin-top: 10px;
    }

    /* ── Mobile ───────────────────────────────── */
    @media (max-width: 540px) {
      .header { padding: 24px 18px 0; }
      .header img { height: 24px; }
      .body { padding: 18px 18px 16px; font-size: 14px; }
      .footer { padding: 18px 18px; }
      .detail-row { flex-direction: column; align-items: flex-start; gap: 3px; }
      .cta { padding: 12px 24px; font-size: 14px; display: block; }
      .feature-grid { grid-template-columns: 1fr; }
      .greeting { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="genxdigitizing" width="150" height="26" />
      <div class="header-line"></div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <img src="${LOGO_URL}" alt="genxdigitizing" width="130" height="20" />
      <p class="footer-tagline">Professional Embroidery Digitizing</p>
      <div class="footer-divider"></div>
      <p style="margin:0;">
        <a href="mailto:support@genxdigitizing.com">support@genxdigitizing.com</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}">genxdigitizing.com</a>
      </p>
      <p style="margin:2px 0 0;">
        <a href="${APP_URL}/client">Client Portal</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}/pricing">Pricing</a>
        &nbsp;·&nbsp;
        <a href="${APP_URL}">Website</a>
      </p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} GenXdigitizing. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
//  1. Order submitted
// ═══════════════════════════════════════════════════════════════

export async function emailOrderSubmitted(params: {
  to: string;
  clientName: string;
  orderNumber: string;
  serviceName: string;
  price: number;
  turnaround: string;
  estimatedDelivery: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.clientName},</p>
    <p>Your digitizing order has been <strong>received</strong> and is now being processed by our team.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Order Number</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${params.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Price</span><span class="detail-value" style="color:#16A34A;font-size:16px;font-weight:700;">$${params.price}</span></div>
      <div class="detail-row"><span class="detail-label">Turnaround</span><span class="detail-value">${params.turnaround} <span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">Est. Delivery</span><span class="detail-value">${params.estimatedDelivery}</span></div>
      <div class="detail-row"><span class="detail-label">Revisions</span><span class="detail-value">Unlimited <span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">Formats</span><span class="detail-value">All formats <span class="badge-free">FREE</span></span></div>
    </div>

    <div class="feature-grid">
      <div class="feature-item"><span class="icon">🔄</span> Unlimited Revisions</div>
      <div class="feature-item"><span class="icon">⚡</span> Fast Turnaround</div>
      <div class="feature-item"><span class="icon">📁</span> All File Formats</div>
      <div class="feature-item"><span class="icon">💳</span> Pay When Satisfied</div>
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/client/my-orders" class="cta">Track Your Order →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;text-align:center;">Our team will begin work shortly. You'll receive updates at each step.</p>
  `, "Order Confirmed");

  return sendEmail({ to: params.to, subject: `Order Confirmed — ${params.orderNumber} | genxdigitizing`, html, bcc: TRUSTPILOT_BCC });
}

// ═══════════════════════════════════════════════════════════════
//  2. Designer assigned
// ═══════════════════════════════════════════════════════════════

export async function emailDesignerAssigned(params: {
  to: string;
  clientName: string;
  orderNumber: string;
  designerName: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.clientName},</p>
    <p>Great news — your order <span class="order-num">${params.orderNumber}</span> has been assigned to <strong>${params.designerName}</strong> and work has begun.</p>

    <div class="info-card info-card-blue">
      <strong>${params.designerName}</strong> is now working on your design. They'll ensure every stitch path, density setting, and underlay is optimized for your specific requirements.
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/client/my-orders" class="cta">View Order Status →</a>
    </div>
  `, "Designer Assigned");

  return sendEmail({ to: params.to, subject: `${params.designerName} is working on ${params.orderNumber}`, html });
}

// ═══════════════════════════════════════════════════════════════
//  3. Order delivered
// ═══════════════════════════════════════════════════════════════

export async function emailOrderDelivered(params: {
  to: string;
  clientName: string;
  orderNumber: string;
  serviceName: string;
  stitchCount?: number;
  downloadUrl: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.clientName},</p>
    <p>Your order is <strong>ready</strong>! Your digitized file for <strong>${params.serviceName}</strong> has passed our quality review and is available for download.</p>

    <div class="info-card info-card-green">
      <div style="font-size:20px;margin-bottom:6px;">✅</div>
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      ${params.stitchCount ? `<div class="detail-row"><span class="detail-label">Stitch Count</span><span class="detail-value">${params.stitchCount.toLocaleString()}</span></div>` : ""}
      <div class="detail-row"><span class="detail-label">Revisions</span><span class="detail-value">Unlimited <span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">Format Conversion</span><span class="detail-value">Any format <span class="badge-free">FREE</span></span></div>
    </div>

    <div class="cta-wrap">
      <a href="${params.downloadUrl}" class="cta">Download Your Files →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;text-align:center;">Need adjustments? Request a revision in your portal — <strong>always free</strong>.</p>
    <p style="color:#64748B;font-size:13px;text-align:center;">Happy with the result? Leave a quick review ⭐ — it means a lot to our team.</p>
  `, "Your Order is Ready");

  return sendEmail({ to: params.to, subject: `✅ ${params.orderNumber} is ready for download!`, html, bcc: TRUSTPILOT_BCC });
}

// ═══════════════════════════════════════════════════════════════
//  3b. Payment required
// ═══════════════════════════════════════════════════════════════

export async function emailPaymentRequired(params: {
  to: string;
  clientName: string;
  orderNumber: string;
  serviceName: string;
  amount: number;
  portalUrl: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.clientName},</p>
    <p>Your <strong>${params.serviceName}</strong> for order <span class="order-num">${params.orderNumber}</span> is complete and ready for download.</p>

    <div class="info-card info-card-amber">
      <div style="font-size:20px;margin-bottom:6px;">💳</div>
      <strong>Payment Required</strong> — <span style="font-size:18px;font-weight:700;">$${params.amount}</span><br/>
      Files available immediately after payment. Download instantly.
    </div>

    <div class="cta-wrap">
      <a href="${params.portalUrl}" class="cta">Pay Now & Download →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;text-align:center;">Unlimited free revisions are always included after download.</p>
  `, "Payment Required");

  return sendEmail({ to: params.to, subject: `Payment required — ${params.orderNumber}`, html });
}

// ═══════════════════════════════════════════════════════════════
//  4. Payment confirmed (with invoice PDF attachment support)
// ═══════════════════════════════════════════════════════════════

export async function emailPaymentConfirmed(params: {
  to: string;
  clientName: string;
  orderNumber: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  payoneerRef: string;
  pdfUrl?: string;
  pdfAttachment?: { filename: string; content: Buffer };
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.clientName},</p>
    <p>Your payment of <strong style="color:#16A34A;">$${params.amount} ${params.currency}</strong> has been received for order <span class="order-num">${params.orderNumber}</span>.</p>

    <div class="info-card info-card-green">
      <div style="font-size:20px;margin-bottom:6px;">✅</div>
      <div class="detail-row"><span class="detail-label">Invoice</span><span class="detail-value" style="font-family:monospace;font-size:13px;">${params.invoiceNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Amount Paid</span><span class="detail-value" style="color:#16A34A;font-weight:700;font-size:16px;">$${params.amount} ${params.currency}</span></div>
      <div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value" style="font-family:monospace;font-size:12px;">${params.payoneerRef}</span></div>
    </div>

    ${params.pdfUrl ? `
    <div class="cta-wrap">
      <a href="${params.pdfUrl}" class="cta">Download Invoice PDF →</a>
    </div>` : ""}

    <p style="margin-top:16px;color:#64748B;font-size:13px;text-align:center;">A copy of your invoice is attached to this email for your records.</p>
  `, "Payment Confirmed");

  return sendEmail({
    to: params.to,
    subject: `Payment received — Invoice ${params.invoiceNumber}`,
    html,
    attachments: params.pdfAttachment ? [{
      filename: params.pdfAttachment.filename,
      content: params.pdfAttachment.content,
    }] : undefined,
  });
}

// ═══════════════════════════════════════════════════════════════
//  5. Revision requested
// ═══════════════════════════════════════════════════════════════

export async function emailRevisionRequested(params: {
  to: string | string[];
  clientName: string;
  orderNumber: string;
  revisionNotes: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Revision Requested</p>
    <p>A revision has been requested for order <span class="order-num">${params.orderNumber}</span> by <strong>${params.clientName}</strong>.</p>

    <div class="info-card info-card-amber">
      <strong>Client Notes:</strong><br/>${params.revisionNotes}
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/admin/orders" class="cta">View Order in Admin →</a>
    </div>
  `, "Revision Requested");

  return sendEmail({ to: params.to, subject: `Revision requested — ${params.orderNumber}`, html });
}

// ═══════════════════════════════════════════════════════════════
//  6. New order alert (admin)
// ═══════════════════════════════════════════════════════════════

export async function emailNewOrderAlert(params: {
  to: string | string[];
  orderNumber: string;
  clientName: string;
  serviceName: string;
  price: number;
  turnaround: string;
}) {
  const html = baseLayout(`
    <p class="greeting">New Order Received</p>
    <p>A <strong>new order</strong> has been placed and needs a designer assigned.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${params.clientName}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${params.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Price</span><span class="detail-value" style="color:#16A34A;font-weight:700;font-size:15px;">$${params.price}</span></div>
      <div class="detail-row"><span class="detail-label">Turnaround</span><span class="detail-value"><span class="badge-highlight">${params.turnaround}</span></span></div>
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/admin/orders" class="cta">Assign Designer →</a>
    </div>
  `, "New Order Alert");

  return sendEmail({ to: params.to, subject: `New order — ${params.orderNumber} (${params.turnaround})`, html });
}

// ═══════════════════════════════════════════════════════════════
//  7. Welcome email — professional onboarding
// ═══════════════════════════════════════════════════════════════

export async function emailWelcome(params: {
  to: string;
  clientName: string;
  companyName: string;
}) {
  var firstName = params.clientName.split(" ")[0] || params.clientName;
  var html = baseLayout(`
    <p class="greeting">Welcome to the family, ${firstName}! 👋</p>

    <p>Thanks for creating your account with <strong>GenXdigitizing</strong>. You've just joined <strong>2,500+ businesses</strong> who trust us for professional embroidery digitizing — backed by the industry's strongest guarantees.</p>

    <div class="info-card info-card-green">
      <div style="font-size:18px;margin-bottom:8px;font-weight:700;">✅ Your Account is Ready</div>
      <strong>${params.companyName}</strong> now has full access to:<br/>
      • Professional digitizing starting at just <strong>$7</strong><br/>
      • <strong>Unlimited free revisions</strong> on every order<br/>
      • <strong>Free file format conversion</strong> to any machine format<br/>
      • <strong>Free rush turnaround</strong> — 6-hour delivery available<br/>
      • <strong>Pay when satisfied</strong> — no upfront payment required
    </div>

    <!-- How it works -->
    <p style="font-size:16px;font-weight:700;color:#0F172A;margin:24px 0 12px;">🚀 How to Place Your First Order</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0;">
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#2563EB;margin-bottom:4px;">1</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;">Upload Your Artwork</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;">JPG, PNG, PDF, or any format — we handle it all</div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#2563EB;margin-bottom:4px;">2</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;">Choose Your Options</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;">Select turnaround, size, placement & special instructions</div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#2563EB;margin-bottom:4px;">3</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;">We Digitize It</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;">Expert designers optimize every stitch path for perfection</div>
      </div>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:#2563EB;margin-bottom:4px;">4</div>
        <div style="font-size:13px;font-weight:700;color:#0F172A;">Download & Stitch</div>
        <div style="font-size:11px;color:#64748B;margin-top:4px;">Get your ready-to-stitch file — pay only when satisfied</div>
      </div>
    </div>

    <!-- Pricing at a glance -->
    <p style="font-size:16px;font-weight:700;color:#0F172A;margin:24px 0 4px;">💎 Services You Can Order Today</p>
    <p style="font-size:12px;color:#64748B;margin:0 0 12px;">All prices include free revisions, free format conversion & free standard turnaround</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">🧵 Embroidery Digitizing</span><span class="detail-value" style="color:#16A34A;">from $7</span></div>
      <div class="detail-row"><span class="detail-label">✏️ Vector Art Redraw</span><span class="detail-value" style="color:#16A34A;">from $8</span></div>
      <div class="detail-row"><span class="detail-label">🏷️ Custom Patch Design</span><span class="detail-value" style="color:#16A34A;">from $5</span></div>
      <div class="detail-row"><span class="detail-label">⚡ Rush Delivery (6h)</span><span class="detail-value"><span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">📁 Format Conversion</span><span class="detail-value"><span class="badge-free">FREE</span></span></div>
    </div>

    <!-- Trust badges -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:18px 0;">
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:#16A34A;">4.9/5</div>
        <div style="font-size:11px;color:#047857;font-weight:600;">Average Rating</div>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:#16A34A;">2,500+</div>
        <div style="font-size:11px;color:#047857;font-weight:600;">Happy Clients</div>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:#16A34A;">10k+</div>
        <div style="font-size:11px;color:#047857;font-weight:600;">Designs Delivered</div>
      </div>
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:18px;font-weight:800;color:#16A34A;">100%</div>
        <div style="font-size:11px;color:#047857;font-weight:600;">Satisfaction Guarantee</div>
      </div>
    </div>

    <!-- Guarantee -->
    <div class="info-card info-card-purple">
      <div style="font-size:16px;font-weight:700;margin-bottom:4px;">🛡️ The GenX Guarantee</div>
      Not 100% satisfied with your digitized file? We'll revise it until you are — unlimited revisions, <strong>completely free</strong>. No questions, no deadlines, no extra charges. Your satisfaction is the foundation of our reputation.
    </div>

    <!-- CTA -->
    <div class="cta-wrap">
      <a href="${APP_URL}/client" class="cta">Place Your First Order →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;text-align:center;">
      Questions? Reply to this email or reach us at <a href="mailto:support@genxdigitizing.com" style="color:#2563EB;">support@genxdigitizing.com</a> — we respond within minutes during business hours.
    </p>
  `, "Welcome to GenXdigitizing");

  return sendEmail({ to: params.to, subject: `Welcome to GenXdigitizing, ${firstName}! Here's how to get started 🎉`, html, bcc: TRUSTPILOT_BCC });
}

// ═══════════════════════════════════════════════════════════════
//  8. SLA warning
// ═══════════════════════════════════════════════════════════════

export async function emailSLAWarning(params: {
  to: string | string[];
  orderNumber: string;
  clientName: string;
  designerName: string;
  hoursLeft: number;
}) {
  const html = baseLayout(`
    <p class="greeting">⚠️ SLA Deadline Approaching</p>
    <div class="info-card info-card-red">
      <strong>Order <span class="order-num" style="color:#991B1B;">${params.orderNumber}</span></strong> for <strong>${params.clientName}</strong><br/>
      <span style="font-size:16px;font-weight:700;">${params.hoursLeft} hour${params.hoursLeft === 1 ? "" : "s"} remaining</span> until SLA deadline.<br/>
      Designer: ${params.designerName}
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/admin/orders" class="cta">View Order →</a>
    </div>
  `, "SLA Warning");

  return sendEmail({ to: params.to, subject: `SLA warning — ${params.orderNumber} due in ${params.hoursLeft}h`, html });
}

// ═══════════════════════════════════════════════════════════════
//  9. Designer task assigned
// ═══════════════════════════════════════════════════════════════

export async function emailDesignerTaskAssigned(params: {
  to: string;
  designerName: string;
  orderNumber: string;
  serviceName: string;
  turnaround: string;
  deadline: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.designerName},</p>
    <p>A new order has been <strong>assigned</strong> to you. Please review the details and begin work.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${params.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Turnaround</span><span class="detail-value"><span class="badge-highlight">${params.turnaround}</span></span></div>
      <div class="detail-row"><span class="detail-label">Deadline</span><span class="detail-value" style="color:#DC2626;font-weight:700;">${params.deadline}</span></div>
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/designer/tasks" class="cta">Open Designer Portal →</a>
    </div>
  `, "New Task Assigned");

  return sendEmail({ to: params.to, subject: `New task assigned — ${params.orderNumber} (${params.turnaround})`, html });
}

// ═══════════════════════════════════════════════════════════════
//  10. Review request
// ═══════════════════════════════════════════════════════════════

export async function emailReviewRequest(params: {
  to: string;
  clientName: string;
  orderNumber: string;
  serviceName: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Hi ${params.clientName},</p>
    <p>We hope you're happy with your <strong>${params.serviceName}</strong> for order <span class="order-num">${params.orderNumber}</span>!</p>
    <p>Would you take <strong>30 seconds</strong> to rate your experience? Your feedback helps our team improve and guides future clients.</p>

    <div style="text-align:center;margin:20px 0;">
      <div style="font-size:32px;letter-spacing:4px;margin-bottom:8px;">⭐⭐⭐⭐⭐</div>
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/client/my-orders" class="cta">Leave a Review →</a>
    </div>

    <p style="margin-top:14px;color:#64748B;font-size:13px;text-align:center;">Remember — free revisions and format conversions are <strong>always</strong> available.</p>
  `, "How was your order?");

  return sendEmail({ to: params.to, subject: `How was your genxdigitizing order? ⭐ (${params.orderNumber})`, html, bcc: TRUSTPILOT_BCC });
}
