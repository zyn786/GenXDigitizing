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
const LOGO_URL = `${APP_URL}/images/white_logo.png`;
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
      background: #E2E8F0;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    .wrapper { padding: 40px 20px; }

    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
    }

    /* ── Header ─────────────────────────────── */
    .header {
      background: linear-gradient(160deg, #020617 0%, #0F172A 40%, #1E3A5F 75%, #1E40AF 100%);
      padding: 40px 32px 36px;
      text-align: center;
    }
    .header .logo-wrap {
      display: inline-block;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 16px;
      padding: 18px 32px;
      margin-bottom: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }
    .header img {
      height: 36px;
      width: auto;
      display: block;
    }
    .header .accent-line {
      width: 60px;
      height: 4px;
      background: linear-gradient(90deg, #3B82F6, #F97316);
      border-radius: 2px;
      margin: 16px auto 0;
    }
    .header .tagline {
      color: rgba(255,255,255,0.60);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin: 12px 0 0;
    }

    /* ── Body ────────────────────────────────── */
    .body {
      padding: 32px 32px 28px;
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
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-radius: 14px;
      padding: 20px 22px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #E2E8F0;
      font-size: 14px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #475569; font-size: 13px; font-weight: 600; }
    .detail-value { font-weight: 700; color: #0F172A; font-size: 14px; }
    .order-num {
      color: #1D4ED8;
      font-family: 'SF Mono', 'Courier New', monospace;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 0.5px;
      background: #DBEAFE;
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* ── Status / info cards ──────────────────── */
    .info-card {
      border-radius: 14px;
      padding: 18px 22px;
      margin: 18px 0;
      font-size: 14px;
      line-height: 1.8;
      font-weight: 500;
    }
    .info-card-green  { background: #DCFCE7; border: 2px solid #86EFAC; color: #14532D; }
    .info-card-amber  { background: #FEF3C7; border: 2px solid #FCD34D; color: #78350F; }
    .info-card-blue   { background: #DBEAFE; border: 2px solid #93C5FD; color: #1E3A8A; }
    .info-card-red    { background: #FEE2E2; border: 2px solid #FCA5A5; color: #7F1D1D; }
    .info-card-purple { background: #EDE9FE; border: 2px solid #C4B5FD; color: #4C1D95; }

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
    .cta-wrap { text-align: center; margin: 28px 0 8px; }
    .cta {
      display: inline-block;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: #FFFFFF !important;
      padding: 16px 40px;
      border-radius: 14px;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      box-shadow: 0 6px 20px rgba(37,99,235,0.35);
      letter-spacing: 0.2px;
    }

    /* ── Feature grid ─────────────────────────── */
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 20px 0;
    }
    .feature-item {
      background: #EFF6FF;
      border: 2px solid #BFDBFE;
      border-radius: 12px;
      padding: 14px 16px;
      text-align: center;
      font-size: 14px;
      font-weight: 700;
      color: #1E40AF;
    }
    .feature-item .icon { font-size: 22px; display: block; margin-bottom: 6px; }

    /* ── Footer ───────────────────────────────── */
    .footer {
      background: #1E293B;
      padding: 24px 32px;
      font-size: 12px;
      color: #94A3B8;
      text-align: center;
      line-height: 2.2;
    }
    .footer a { color: #60A5FA; text-decoration: none; font-weight: 600; }
    .footer .brand { font-weight: 800; color: #E2E8F0; font-size: 14px; }

    /* ── Mobile ───────────────────────────────── */
    @media (max-width: 540px) {
      .wrapper { padding: 16px 8px; }
      .header { padding: 30px 20px 26px; }
      .header .logo-wrap { padding: 14px 22px; }
      .header img { height: 28px; }
      .body { padding: 24px 18px 22px; font-size: 14px; }
      .footer { padding: 18px 18px; }
      .detail-row { flex-direction: column; align-items: flex-start; gap: 3px; }
      .cta { padding: 14px 28px; font-size: 15px; display: block; }
      .feature-grid { grid-template-columns: 1fr; }
      .greeting { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-wrap">
          <img src="${LOGO_URL}" alt="genxdigitizing" width="180" height="34" />
        </div>
        <div class="accent-line"></div>
        <p class="tagline">Professional Embroidery Digitizing</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p class="brand">genxdigitizing</p>
        <p>support@genxdigitizing.com</p>
        <p>
          <a href="${APP_URL}/client">Client Portal</a>
          &nbsp;·&nbsp;
          <a href="${APP_URL}/pricing">Pricing</a>
          &nbsp;·&nbsp;
          <a href="${APP_URL}">Website</a>
        </p>
        <p style="margin-top:8px;font-size:11px;color:#CBD5E1;">Production-ready embroidery digitizing. Free revisions, always.</p>
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
//  7. Welcome email
// ═══════════════════════════════════════════════════════════════

export async function emailWelcome(params: {
  to: string;
  clientName: string;
  companyName: string;
}) {
  const html = baseLayout(`
    <p class="greeting">Welcome, ${params.clientName}!</p>
    <p>Your account for <strong>${params.companyName}</strong> is ready. You now have access to professional embroidery digitizing services backed by real guarantees.</p>

    <div class="feature-grid">
      <div class="feature-item"><span class="icon">🔄</span> Free Format Conversion</div>
      <div class="feature-item"><span class="icon">♾️</span> Unlimited Revisions</div>
      <div class="feature-item"><span class="icon">⚡</span> Rush 6h Delivery</div>
      <div class="feature-item"><span class="icon">🧵</span> Stitch-Perfect Files</div>
    </div>

    <div class="info-card info-card-blue">
      <strong>Starting Prices:</strong> Digitizing from $7 · Vector Redraw from $8 · Custom Patches from $5<br/>
      <span style="font-size:12px;opacity:0.8;">All turnaround speeds included free. Pay when satisfied.</span>
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/client" class="cta">Go to Your Portal →</a>
    </div>
  `, "Welcome to genxdigitizing");

  return sendEmail({ to: params.to, subject: `Welcome to genxdigitizing, ${params.clientName}!`, html });
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
