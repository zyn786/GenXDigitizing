import { Resend } from "resend";
import { prisma } from "@/lib/db";
import type { NotificationDeliveryStatus, NotificationEventType, NotificationAudience, NotificationChannel } from "@prisma/client";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured.");
  return new Resend(apiKey);
}

function from() {
  return process.env.EMAIL_FROM ?? "GenX Digitizing <noreply@genxdigitizing.com>";
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function esc(v: string) {
  return v
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

async function send(to: string, subject: string, html: string, text: string) {
  const { error } = await getResend().emails.send({ from: from(), to, subject, html, text });
  if (error) throw new Error(error.message || "Email send failed.");
}

function wrap(body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:0 auto;padding:24px;">
    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;margin-bottom:4px;">GenX Digitizing</div>
    ${body}
    <p style="margin-top:32px;color:#6b7280;font-size:13px;">Questions? Reply to this email or visit <a href="${appUrl()}" style="color:#374151;">${appUrl()}</a>.</p>
  </div>`;
}

function btn(href: string, label: string) {
  return `<p style="margin:24px 0;"><a href="${esc(href)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;">${esc(label)}</a></p>`;
}

// ─── Notification log helper ──────────────────────────────────────────────────

export async function writeNotificationLog(opts: {
  eventType: NotificationEventType;
  audience: NotificationAudience;
  channel: NotificationChannel;
  recipientUserId?: string | null;
  recipientAddress?: string | null;
  orderId?: string | null;
  invoiceId?: string | null;
  status: NotificationDeliveryStatus;
  errorMessage?: string | null;
}) {
  try {
    await prisma.notificationLog.create({ data: opts });
  } catch {
    // non-fatal — log but don't break the primary action
  }
}

// ─── Email senders ────────────────────────────────────────────────────────────

export async function sendOrderCreatedEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  serviceType: string;
  estimatedPrice?: number | null;
  recipientUserId?: string | null;
  isGuest?: boolean;
}) {
  const firstName = opts.clientName.split(" ")[0] || "there";
  const priceNote = opts.estimatedPrice
    ? `Estimated price: <strong>$${opts.estimatedPrice.toFixed(2)}</strong>`
    : "Pricing will be confirmed by our team shortly.";

  // Guests get the public tracking page; logged-in clients get the portal
  const trackingUrl = opts.isGuest
    ? `${appUrl()}/order-status?number=${encodeURIComponent(opts.orderNumber)}&email=${encodeURIComponent(opts.to)}`
    : `${appUrl()}/client/orders/${opts.orderId}`;

  const subject = `Order received — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `We've received your order ${opts.orderNumber} (${opts.serviceType}).`,
    priceNote.replace(/<[^>]+>/g, ""),
    "",
    `Track your order: ${trackingUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Order received</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      We've received your order <strong>${esc(opts.orderNumber)}</strong> (${esc(opts.serviceType)}).
      Our team will review it shortly and get to work.
    </p>
    <p style="margin:10px 0 0;">${priceNote}</p>
    ${btn(trackingUrl, "Track your order")}
    ${opts.isGuest ? `<p style="margin:14px 0 0;font-size:13px;color:#94a3b8;">
      No account needed — this link is unique to your order and email.<br/>
      Want full portal access?
      <a href="${appUrl()}/register" style="color:#818cf8;">Create a free account</a>.
    </p>` : ""}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "ORDER_CREATED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendProofReadyEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Your proof is ready — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Great news! The proof for your order ${opts.orderNumber} is ready for your review.`,
    "Please log in to your client portal to approve or request a revision.",
    "",
    `Review proof: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Your proof is ready</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      The proof for order <strong>${esc(opts.orderNumber)}</strong> is ready for your review.
      Please log in to approve it or request a revision.
    </p>
    ${btn(portalUrl, "Review proof")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_READY",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendRevisionPendingEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Revision request received — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `We've received your revision request for order ${opts.orderNumber} and our designer is on it.`,
    `Check the latest update: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Revision request received</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      We've received your revision request for order <strong>${esc(opts.orderNumber)}</strong>.
      Our designer will update the proof and notify you when it's ready.
    </p>
    ${btn(portalUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "REVISION_PENDING",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendFilesDeliveredEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Your files are delivered — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Your embroidery files for order ${opts.orderNumber} have been delivered.`,
    "Log in to download them from your client portal.",
    "",
    `Download files: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Files delivered</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Your embroidery files for order <strong>${esc(opts.orderNumber)}</strong> are ready.
      Log in to your client portal to download them.
    </p>
    ${btn(portalUrl, "Download files")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "FILE_DELIVERED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendInvoiceSentEmail(opts: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  invoiceId: string;
  orderId: string;
  totalAmount: number;
  currency: string;
  dueDate: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/invoices/${opts.invoiceId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Invoice ${opts.invoiceNumber} — ${opts.currency} ${opts.totalAmount.toFixed(2)} due`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Invoice ${opts.invoiceNumber} for ${opts.currency} ${opts.totalAmount.toFixed(2)} is now available.`,
    `Due: ${opts.dueDate}`,
    "",
    `View & pay: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">New invoice</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Invoice <strong>${esc(opts.invoiceNumber)}</strong> for
      <strong>${esc(opts.currency)} ${opts.totalAmount.toFixed(2)}</strong> is ready.
      Due date: <strong>${esc(opts.dueDate)}</strong>.
    </p>
    ${btn(portalUrl, "View & pay invoice")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "INVOICE_SENT",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    invoiceId: opts.invoiceId,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendPaymentReceivedEmail(opts: {
  to: string;
  clientName: string;
  invoiceNumber: string;
  invoiceId: string;
  orderId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  balanceDue: number;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/invoices/${opts.invoiceId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const isPaidInFull = opts.balanceDue <= 0;
  const subject = `Payment received — ${opts.receiptNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `We've received your payment of ${opts.currency} ${opts.amount.toFixed(2)} for invoice ${opts.invoiceNumber}.`,
    isPaidInFull ? "Your invoice is paid in full." : `Remaining balance: ${opts.currency} ${opts.balanceDue.toFixed(2)}`,
    "",
    `View receipt: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Payment received</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      We've received your payment of <strong>${esc(opts.currency)} ${opts.amount.toFixed(2)}</strong>
      for invoice <strong>${esc(opts.invoiceNumber)}</strong>. Receipt: ${esc(opts.receiptNumber)}.
    </p>
    <p style="margin:10px 0 0;">
      ${isPaidInFull
        ? `<strong style="color:#059669;">Your invoice is paid in full. Thank you!</strong>`
        : `Remaining balance: <strong>${esc(opts.currency)} ${opts.balanceDue.toFixed(2)}</strong>`
      }
    </p>
    ${btn(portalUrl, "View invoice")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PAYMENT_RECORDED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    invoiceId: opts.invoiceId,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendQuoteSentEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  quotedPrice: number;
  serviceType: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/quotes/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Your quote is ready — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Great news! We've reviewed your quote request for ${opts.serviceType}.`,
    `Your quoted price is $${opts.quotedPrice.toFixed(2)}.`,
    "",
    `Please log in to review and accept or decline: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Your quote is ready</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      We've reviewed your quote request for <strong>${esc(opts.serviceType)}</strong>.
      Your quoted price is <strong>$${opts.quotedPrice.toFixed(2)}</strong>.
    </p>
    <p style="margin:10px 0 0;">
      Please review and accept or decline this quote from your client portal.
    </p>
    ${btn(portalUrl, "Review quote")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "QUOTE_SENT",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendQuoteAcceptedEmail(opts: {
  to: string;
  adminName: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  quotedPrice: number;
  recipientUserId?: string | null;
}) {
  const adminUrl = `${appUrl()}/admin/orders/${opts.orderId}`;
  const firstName = opts.adminName.split(" ")[0] || "Admin";
  const subject = `Quote accepted — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `${opts.clientName} has accepted quote ${opts.orderNumber} at $${opts.quotedPrice.toFixed(2)}.`,
    `View the order: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Quote accepted</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      <strong>${esc(opts.clientName)}</strong> has accepted quote
      <strong>${esc(opts.orderNumber)}</strong> at <strong>$${opts.quotedPrice.toFixed(2)}</strong>.
      The order is now active in the production queue.
    </p>
    ${btn(adminUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "QUOTE_ACCEPTED",
    audience: "OPS_QUEUE",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendProofSentEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Proof ready for your review — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Your proof for order ${opts.orderNumber} is ready.`,
    "Please log in to approve it or request a revision.",
    "",
    `Review proof: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Your proof is ready</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      The proof for order <strong>${esc(opts.orderNumber)}</strong> is ready for your review.
      Please approve it or request a revision from your client portal.
    </p>
    ${btn(portalUrl, "Review proof")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_SENT",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendProofApprovedPaymentRequiredEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = opts.invoiceId
    ? `${appUrl()}/client/invoices/${opts.invoiceId}`
    : `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Proof approved — payment required — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `You approved the proof for order ${opts.orderNumber}. Your final files will be available once payment is confirmed.`,
    `Amount due: ${opts.currency} ${opts.amount.toFixed(2)}`,
    "",
    `Submit payment: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Proof approved — payment required</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      You've approved the proof for order <strong>${esc(opts.orderNumber)}</strong>.
      Your final embroidery files will be unlocked once payment is confirmed.
    </p>
    <p style="margin:10px 0 0;">
      Amount due: <strong>${esc(opts.currency)} ${opts.amount.toFixed(2)}</strong>
    </p>
    ${btn(portalUrl, "Submit payment")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PAYMENT_REQUIRED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendRevisionAssignedEmail(opts: {
  to: string;
  designerName: string;
  orderNumber: string;
  orderId: string;
  clientNotes?: string | null;
  recipientUserId?: string | null;
}) {
  const adminUrl = `${appUrl()}/admin/designer/${opts.orderId}`;
  const firstName = opts.designerName.split(" ")[0] || "Designer";
  const subject = `Revision assigned — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `A revision has been assigned to you for order ${opts.orderNumber}.`,
    opts.clientNotes ? `Client notes: ${opts.clientNotes}` : "",
    "",
    `View order: ${adminUrl}`,
  ].filter(Boolean).join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Revision assigned to you</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      A revision has been assigned to you for order <strong>${esc(opts.orderNumber)}</strong>.
    </p>
    ${opts.clientNotes ? `<p style="margin:10px 0 0;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:13px;">${esc(opts.clientNotes)}</p>` : ""}
    ${btn(adminUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "REVISION_ASSIGNED",
    audience: "ASSIGNED_USER",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendPaymentSubmittedEmail(opts: {
  to: string;
  adminName: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  amount: number;
  currency: string;
  recipientUserId?: string | null;
}) {
  const adminUrl = `${appUrl()}/admin/payment-proofs`;
  const firstName = opts.adminName.split(" ")[0] || "Admin";
  const subject = `Payment submitted — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `${opts.clientName} submitted payment of ${opts.currency} ${opts.amount.toFixed(2)} for order ${opts.orderNumber}.`,
    `Review: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Payment submitted</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      <strong>${esc(opts.clientName)}</strong> submitted payment of
      <strong>${esc(opts.currency)} ${opts.amount.toFixed(2)}</strong>
      for order <strong>${esc(opts.orderNumber)}</strong>.
    </p>
    ${btn(adminUrl, "Review payment")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PAYMENT_SUBMITTED",
    audience: "OPS_QUEUE",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendNewOrderOpsEmail(opts: {
  to: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  isGuest?: boolean;
}) {
  const adminUrl = `${appUrl()}/admin/orders/${opts.orderId}`;
  const subject = `New order received — ${opts.orderNumber}`;
  const guestNote = opts.isGuest ? " (guest checkout)" : "";
  const text = [
    `New order ${opts.orderNumber} received${guestNote}.`,
    `Client: ${opts.clientName} <${opts.clientEmail}>`,
    `Service: ${opts.serviceType}`,
    `View order: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">New order received</h1>
    <p style="margin:16px 0 0;">
      Order <strong>${esc(opts.orderNumber)}</strong>${esc(guestNote)} requires your attention.
    </p>
    <p style="margin:10px 0 0;">
      <strong>Client:</strong> ${esc(opts.clientName)} &lt;${esc(opts.clientEmail)}&gt;<br/>
      <strong>Service:</strong> ${esc(opts.serviceType)}
    </p>
    ${btn(adminUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "ORDER_CREATED",
    audience: "OPS_QUEUE",
    channel: "EMAIL",
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendNewQuoteOpsEmail(opts: {
  to: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  clientEmail: string;
  serviceType: string;
  isGuest?: boolean;
}) {
  const adminUrl = `${appUrl()}/admin/quotes/${opts.orderId}`;
  const subject = `New quote request — ${opts.orderNumber}`;
  const guestNote = opts.isGuest ? " (guest)" : "";
  const text = [
    `New quote request ${opts.orderNumber}${guestNote}.`,
    `Client: ${opts.clientName} <${opts.clientEmail}>`,
    `Service: ${opts.serviceType}`,
    `Review: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">New quote request</h1>
    <p style="margin:16px 0 0;">
      Quote <strong>${esc(opts.orderNumber)}</strong>${esc(guestNote)} is waiting for pricing.
    </p>
    <p style="margin:10px 0 0;">
      <strong>Client:</strong> ${esc(opts.clientName)} &lt;${esc(opts.clientEmail)}&gt;<br/>
      <strong>Service:</strong> ${esc(opts.serviceType)}
    </p>
    ${btn(adminUrl, "Price this quote")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "QUOTE_SENT",
    audience: "OPS_QUEUE",
    channel: "EMAIL",
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendFilesUnlockedEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  invoiceNumber: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Files unlocked — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Your payment for invoice ${opts.invoiceNumber} has been verified.`,
    `Your embroidery files for order ${opts.orderNumber} are now available to download.`,
    "",
    `Download files: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Files are now available</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Your payment for invoice <strong>${esc(opts.invoiceNumber)}</strong> has been verified.
      Your embroidery files for order <strong>${esc(opts.orderNumber)}</strong> are now available to download.
    </p>
    ${btn(portalUrl, "Download files")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "FILE_DELIVERED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendWorkStartedEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  designerName: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Work started on your order — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Our designer ${opts.designerName} has been assigned to order ${opts.orderNumber} and work has begun.`,
    "You'll be notified when your proof is ready for review.",
    "",
    `Track your order: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Work has started</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Our designer <strong>${esc(opts.designerName)}</strong> has been assigned to your order
      <strong>${esc(opts.orderNumber)}</strong> and work has begun.
      You'll be notified when your proof is ready for review.
    </p>
    ${btn(portalUrl, "Track your order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "WORK_STARTED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendProofPendingAdminReviewEmail(opts: {
  to: string;
  adminName: string;
  orderNumber: string;
  orderId: string;
  designerName: string;
  recipientUserId?: string | null;
}) {
  const adminUrl = `${appUrl()}/admin/orders/${opts.orderId}`;
  const firstName = opts.adminName.split(" ")[0] || "Admin";
  const subject = `Proof ready for admin review — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Designer ${opts.designerName} has uploaded a proof for order ${opts.orderNumber}.`,
    "The proof is waiting for your review before being sent to the client.",
    "",
    `Review proof: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Proof pending your review</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Designer <strong>${esc(opts.designerName)}</strong> has uploaded a proof for order
      <strong>${esc(opts.orderNumber)}</strong>.
      Please review and approve (sends to client) or reject with feedback.
    </p>
    ${btn(adminUrl, "Review proof")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_ADMIN_REVIEW_PENDING",
    audience: "OPS_QUEUE",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendProofApprovedByAdminEmail(opts: {
  to: string;
  designerName: string;
  orderNumber: string;
  orderId: string;
  recipientUserId?: string | null;
}) {
  const adminUrl = `${appUrl()}/admin/designer/${opts.orderId}`;
  const firstName = opts.designerName.split(" ")[0] || "Designer";
  const subject = `Proof approved — sent to client — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Your proof for order ${opts.orderNumber} has been approved by admin and sent to the client.`,
    `View order: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Proof approved &amp; sent to client</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Your proof for order <strong>${esc(opts.orderNumber)}</strong> has been approved by admin
      and sent to the client for review. You'll be notified of the client's decision.
    </p>
    ${btn(adminUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_ADMIN_APPROVED",
    audience: "ASSIGNED_USER",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendPaymentRejectedEmail(opts: {
  to: string;
  clientName: string;
  orderNumber: string;
  orderId: string;
  invoiceNumber: string;
  rejectionReason?: string | null;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/invoices/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Payment proof needs attention — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Your payment proof for invoice ${opts.invoiceNumber} (order ${opts.orderNumber}) requires attention.`,
    opts.rejectionReason ? `Reason: ${opts.rejectionReason}` : "",
    "",
    `Please review and resubmit: ${portalUrl}`,
  ].filter(Boolean).join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Payment proof needs attention</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Your payment proof for invoice <strong>${esc(opts.invoiceNumber)}</strong>
      (order <strong>${esc(opts.orderNumber)}</strong>) has been reviewed and requires attention.
    </p>
    ${opts.rejectionReason ? `<p style="margin:10px 0 0;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:13px;"><strong>Reviewer note:</strong><br/>${esc(opts.rejectionReason)}</p>` : ""}
    ${btn(portalUrl, "Resubmit payment proof")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PAYMENT_PENDING",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

export async function sendProofRejectedByAdminEmail(opts: {
  to: string;
  designerName: string;
  orderNumber: string;
  orderId: string;
  reviewNote: string;
  recipientUserId?: string | null;
}) {
  const adminUrl = `${appUrl()}/admin/designer/${opts.orderId}`;
  const firstName = opts.designerName.split(" ")[0] || "Designer";
  const subject = `Proof needs revision (admin review) — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `Your proof for order ${opts.orderNumber} requires changes before it can be sent to the client.`,
    `Admin feedback: ${opts.reviewNote}`,
    "",
    `Update proof: ${adminUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Proof needs revision</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      Your proof for order <strong>${esc(opts.orderNumber)}</strong> requires changes before
      it can be sent to the client.
    </p>
    <p style="margin:10px 0 0;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:13px;">
      <strong>Admin feedback:</strong><br/>${esc(opts.reviewNote)}
    </p>
    ${btn(adminUrl, "Update proof")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_ADMIN_REJECTED",
    audience: "ASSIGNED_USER",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

// ─── Client revision request → ops/designer ──────────────────────────────────

export async function sendClientRevisionRequestedEmail(opts: {
  to: string;
  recipientName: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  clientNotes?: string | null;
  revisionCount?: number | null;
  role: "ops" | "designer";
  recipientUserId?: string | null;
}) {
  const portalUrl =
    opts.role === "designer"
      ? `${appUrl()}/admin/designer/${opts.orderId}`
      : `${appUrl()}/admin/orders/${opts.orderId}`;
  const firstName = opts.recipientName.split(" ")[0] || "there";
  const revLabel = opts.revisionCount ? ` (revision #${opts.revisionCount})` : "";
  const subject = `Client requested revision${revLabel} — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `${opts.clientName} requested a revision for order ${opts.orderNumber}${revLabel}.`,
    opts.clientNotes ? `Client notes: ${opts.clientNotes}` : "",
    "",
    `View order: ${portalUrl}`,
  ].filter(Boolean).join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Revision requested by client</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      <strong>${esc(opts.clientName)}</strong> requested a revision for order
      <strong>${esc(opts.orderNumber)}</strong>${esc(revLabel)}.
    </p>
    ${opts.clientNotes ? `<p style="margin:10px 0 0;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:13px;">${esc(opts.clientNotes)}</p>` : ""}
    ${btn(portalUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "REVISION_REQUESTED",
    audience: opts.role === "designer" ? "ASSIGNED_USER" : "OPS_QUEUE",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

// ─── Client proof rejection → ops/designer ───────────────────────────────────

export async function sendClientProofRejectedEmail(opts: {
  to: string;
  recipientName: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  rejectionReason?: string | null;
  role: "ops" | "designer";
  recipientUserId?: string | null;
}) {
  const portalUrl =
    opts.role === "designer"
      ? `${appUrl()}/admin/designer/${opts.orderId}`
      : `${appUrl()}/admin/orders/${opts.orderId}`;
  const firstName = opts.recipientName.split(" ")[0] || "there";
  const subject = `Client rejected proof — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `${opts.clientName} rejected the proof for order ${opts.orderNumber}.`,
    opts.rejectionReason ? `Reason: ${opts.rejectionReason}` : "",
    "",
    `View order: ${portalUrl}`,
  ].filter(Boolean).join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Proof rejected by client</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      <strong>${esc(opts.clientName)}</strong> rejected the proof for order
      <strong>${esc(opts.orderNumber)}</strong>.
    </p>
    ${opts.rejectionReason ? `<p style="margin:10px 0 0;padding:12px;background:rgba(255,255,255,0.05);border-radius:8px;font-size:13px;">${esc(opts.rejectionReason)}</p>` : ""}
    ${btn(portalUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_ADMIN_REJECTED",
    audience: opts.role === "designer" ? "ASSIGNED_USER" : "OPS_QUEUE",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}

// ─── Client proof approved → assigned designer ──────────────────────────────

export async function sendClientProofApprovedDesignerEmail(opts: {
  to: string;
  designerName: string;
  orderNumber: string;
  orderId: string;
  clientName: string;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/admin/designer/${opts.orderId}`;
  const firstName = opts.designerName.split(" ")[0] || "Designer";
  const subject = `Client approved proof — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `${opts.clientName} approved the proof for order ${opts.orderNumber}.`,
    "Final files will be available once payment is confirmed.",
    "",
    `View order: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Proof approved by client</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      <strong>${esc(opts.clientName)}</strong> approved the proof for order
      <strong>${esc(opts.orderNumber)}</strong>.
      Final files will be available once payment is confirmed by the billing team.
    </p>
    ${btn(portalUrl, "View order")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "PROOF_APPROVED",
    audience: "ASSIGNED_USER",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.orderId,
    status: "SENT",
  });
}
