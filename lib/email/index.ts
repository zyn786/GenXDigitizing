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

const FROM    = `${process.env.RESEND_FROM_NAME ?? "GenX Digitizing"} <${process.env.RESEND_FROM_EMAIL || "support@genxdigitizing.com"}>`;
const REPLY   = process.env.RESEND_REPLY_TO || "support@genxdigitizing.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.genxdigitizing.com";
const LOGO_URL = `${APP_URL}/images/black_logo.png`;

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

function baseLayout(content: string, title: string): string {
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
      background: #F3F4F6;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { padding: 32px 16px; }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    }
    .header {
      background: linear-gradient(135deg, #1E293B 0%, #334155 50%, #1E293B 100%);
      padding: 28px 28px 22px;
      text-align: center;
      border-bottom: 3px solid #E76F2E;
    }
    .header img {
      height: 36px;
      width: auto;
      margin-bottom: 6px;
    }
    .header .tagline {
      color: rgba(255,255,255,0.55);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .body {
      padding: 28px 28px 24px;
      color: #1F2937;
      font-size: 15px;
      line-height: 1.7;
    }
    .body p { margin: 0 0 14px; }
    .body p:last-child { margin-bottom: 0; }

    /* Detail card */
    .detail-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px 18px;
      margin: 16px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 7px 0;
      border-bottom: 1px solid #E2E8F0;
      font-size: 13px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748B; }
    .detail-value { font-weight: 600; color: #1E293B; }
    .order-num { color: #2FA4D7; font-family: 'Courier New', monospace; font-weight: 700; }

    /* Status cards */
    .info-card {
      border-radius: 10px;
      padding: 14px 16px;
      margin: 14px 0;
      font-size: 13px;
      line-height: 1.6;
    }
    .info-card-green  { background: #F0FDF4; border: 1px solid #BBF7D0; color: #166534; }
    .info-card-amber  { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }
    .info-card-blue   { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; }
    .info-card-red    { background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-green { background: #DCFCE7; color: #166534; }
    .badge-free  { background: #DCFCE7; color: #166534; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }

    /* CTA */
    .cta {
      display: inline-block;
      background: linear-gradient(135deg, #2FA4D7, #E76F2E);
      color: #FFFFFF !important;
      padding: 13px 28px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      margin: 8px 0;
    }

    /* Footer */
    .footer {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      padding: 18px 28px;
      font-size: 12px;
      color: #94A3B8;
      text-align: center;
      line-height: 1.8;
    }
    .footer a { color: #2FA4D7; text-decoration: none; }

    /* Mobile */
    @media (max-width: 540px) {
      .wrapper { padding: 16px 8px; }
      .header { padding: 22px 16px 18px; }
      .header img { height: 28px; }
      .body { padding: 20px 16px 18px; font-size: 14px; }
      .footer { padding: 14px 16px; }
      .detail-row { flex-direction: column; align-items: flex-start; gap: 2px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="${LOGO_URL}" alt="GenXdigitizing" />
        <p class="tagline">Professional Embroidery Digitizing</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>GenXdigitizing · support@genxdigitizing.com</p>
        <p>
          <a href="${APP_URL}/client">Client Portal</a>
          &nbsp;·&nbsp;
          <a href="${APP_URL}">Website</a>
        </p>
      </div>
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
    <p>Hi ${params.clientName},</p>
    <p>Your digitizing order has been <strong>received</strong> and is being processed.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${params.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Price</span><span class="detail-value" style="color:#16A34A;font-size:15px;">$${params.price}</span></div>
      <div class="detail-row"><span class="detail-label">Turnaround</span><span class="detail-value">${params.turnaround} <span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">Est. delivery</span><span class="detail-value">${params.estimatedDelivery}</span></div>
      <div class="detail-row"><span class="detail-label">Revisions</span><span class="detail-value">Unlimited <span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">Format conversion</span><span class="detail-value">All formats <span class="badge-free">FREE</span></span></div>
    </div>

    <div style="text-align:center;">
      <a href="${APP_URL}/client/my-orders" class="cta">Track Your Order →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;">Our team will begin work shortly. You'll receive updates at each step.</p>
  `, "Order Confirmed");

  return sendEmail({ to: params.to, subject: `Order Confirmed — ${params.orderNumber} | GenXdigitizing`, html });
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
    <p>Hi ${params.clientName},</p>
    <p>Great news! Your order <span class="order-num">${params.orderNumber}</span> has been assigned to <strong>${params.designerName}</strong> and work has begun.</p>

    <div style="text-align:center;">
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
    <p>Hi ${params.clientName},</p>
    <p>Your order is <strong>ready</strong>! Your digitized file for <strong>${params.serviceName}</strong> has passed QA and is available for download.</p>

    <div class="info-card info-card-green">
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      ${params.stitchCount ? `<div class="detail-row"><span class="detail-label">Stitch count</span><span class="detail-value">${params.stitchCount.toLocaleString()}</span></div>` : ""}
      <div class="detail-row"><span class="detail-label">Revisions</span><span class="detail-value">Unlimited <span class="badge-free">FREE</span></span></div>
      <div class="detail-row"><span class="detail-label">Format conversion</span><span class="detail-value">Any format <span class="badge-free">FREE</span></span></div>
    </div>

    <div style="text-align:center;">
      <a href="${params.downloadUrl}" class="cta">Download Your Files →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;">Need adjustments? Click "Request Revision" in your portal — it's always free.</p>
    <p style="color:#64748B;font-size:13px;">Loved the result? Leave a quick review ⭐ — it means a lot to our team.</p>
  `, "Your Order is Ready");

  return sendEmail({ to: params.to, subject: `✅ ${params.orderNumber} is ready for download!`, html });
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
    <p>Hi ${params.clientName},</p>
    <p>Your <strong>${params.serviceName}</strong> for order <span class="order-num">${params.orderNumber}</span> is ready!</p>

    <div class="info-card info-card-amber">
      <strong>Payment pending</strong> — $${params.amount} required to download your files. Files available immediately after payment.
    </div>

    <div style="text-align:center;">
      <a href="${params.portalUrl}" class="cta">Pay Now & Download →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;">Unlimited free revisions are always included after download.</p>
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
    <p>Hi ${params.clientName},</p>
    <p>Your payment of <strong style="color:#16A34A;">$${params.amount} ${params.currency}</strong> has been received for order <span class="order-num">${params.orderNumber}</span>.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Invoice</span><span class="detail-value" style="font-family:monospace;">${params.invoiceNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Amount paid</span><span class="detail-value" style="color:#16A34A;font-weight:700;font-size:15px;">$${params.amount} ${params.currency}</span></div>
      <div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value" style="font-family:monospace;font-size:11px;">${params.payoneerRef}</span></div>
    </div>

    ${params.pdfUrl ? `
    <div style="text-align:center;">
      <a href="${params.pdfUrl}" class="cta">Download Invoice PDF →</a>
    </div>` : ""}

    <p style="margin-top:16px;color:#64748B;font-size:13px;">A copy of your invoice is attached to this email for your records.</p>
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
    <p>A revision has been requested for order <span class="order-num">${params.orderNumber}</span> by <strong>${params.clientName}</strong>.</p>

    <div class="info-card info-card-amber">
      <strong>Client notes:</strong><br/>${params.revisionNotes}
    </div>

    <div style="text-align:center;">
      <a href="${APP_URL}/admin/orders" class="cta">View Order →</a>
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
    <p>A <strong>new order</strong> has been placed and needs a designer assigned.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Client</span><span class="detail-value">${params.clientName}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${params.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Price</span><span class="detail-value" style="color:#16A34A;font-weight:700;">$${params.price}</span></div>
      <div class="detail-row"><span class="detail-label">Turnaround</span><span class="detail-value">${params.turnaround}</span></div>
    </div>

    <div style="text-align:center;">
      <a href="${APP_URL}/admin/orders" class="cta">Assign Designer →</a>
    </div>
  `, "New Order Alert");

  return sendEmail({ to: params.to, subject: `New order — ${params.orderNumber} (${params.turnaround})`, html });
}

// ═══════════════════════════════════════════════════════════════
//  7. Welcome email
// ═══════════════════════════════════════════════════════════════

export async function emailWelcome(params: {
  to: string;
  clientName: string;
  companyName: string;
}) {
  const html = baseLayout(`
    <p>Hi ${params.clientName},</p>
    <p>Welcome to <strong>GenXdigitizing</strong>! Your account for <strong>${params.companyName}</strong> is ready.</p>

    <p style="font-weight:600;">What's included on every order:</p>
    <ul style="color:#374151;font-size:14px;line-height:2;padding-left:20px;margin:8px 0 16px;">
      <li>All file format conversion — <strong>FREE</strong></li>
      <li>Unlimited revisions — <strong>FREE</strong></li>
      <li>Rush (6h) and urgent (3h) turnaround — <strong>FREE</strong></li>
      <li>Stitch-perfect accuracy on every file</li>
    </ul>

    <div style="text-align:center;">
      <a href="${APP_URL}/client" class="cta">Go to Your Portal →</a>
    </div>

    <p style="margin-top:16px;color:#64748B;font-size:13px;">Starting prices: Digitizing from $7 · Vector from $8 · Patches from $5</p>
  `, "Welcome to GenXdigitizing");

  return sendEmail({ to: params.to, subject: `Welcome to GenXdigitizing, ${params.clientName}!`, html });
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
    <div class="info-card info-card-red">
      <strong>Order <span class="order-num" style="color:#991B1B;">${params.orderNumber}</span> for ${params.clientName} has ${params.hoursLeft} hour${params.hoursLeft === 1 ? "" : "s"} until its SLA deadline.</strong><br/>
      Designer: ${params.designerName}
    </div>

    <div style="text-align:center;">
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
    <p>Hi ${params.designerName},</p>
    <p>A new order has been <strong>assigned</strong> to you.</p>

    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Order</span><span class="detail-value order-num">${params.orderNumber}</span></div>
      <div class="detail-row"><span class="detail-label">Service</span><span class="detail-value">${params.serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Turnaround</span><span class="detail-value">${params.turnaround}</span></div>
      <div class="detail-row"><span class="detail-label">Deadline</span><span class="detail-value" style="color:#DC2626;font-weight:700;">${params.deadline}</span></div>
    </div>

    <div style="text-align:center;">
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
    <p>Hi ${params.clientName},</p>
    <p>We hope you're happy with your <strong>${params.serviceName}</strong> for order <span class="order-num">${params.orderNumber}</span>!</p>
    <p>Would you take 30 seconds to rate your experience? It helps our team and future clients.</p>

    <div style="text-align:center;">
      <a href="${APP_URL}/client/my-orders" class="cta">Leave a Review ⭐ →</a>
    </div>

    <p style="margin-top:14px;color:#64748B;font-size:13px;">Remember — free revisions and format conversions are always available.</p>
  `, "How was your order?");

  return sendEmail({ to: params.to, subject: `How was your GenXdigitizing order? ⭐ (${params.orderNumber})`, html });
}
