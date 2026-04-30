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
}) {
  const portalUrl = `${appUrl()}/client/orders/${opts.orderId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const priceNote = opts.estimatedPrice
    ? `Estimated price: <strong>$${opts.estimatedPrice.toFixed(2)}</strong>`
    : "Pricing will be confirmed by our team shortly.";

  const subject = `Order received — ${opts.orderNumber}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `We've received your order ${opts.orderNumber} (${opts.serviceType}).`,
    priceNote.replace(/<[^>]+>/g, ""),
    "",
    `Track your order: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Order received</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      We've received your order <strong>${esc(opts.orderNumber)}</strong> (${esc(opts.serviceType)}).
      Our team will review it shortly and get to work.
    </p>
    <p style="margin:10px 0 0;">${priceNote}</p>
    ${btn(portalUrl, "Track your order")}
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

export async function sendRevisionRequestedAdminEmail(opts: {
  orderId: string;
  orderNumber: string;
  clientName: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const portalUrl = `${appUrl()}/admin/orders/${opts.orderId}`;
  const subject = `Revision requested — ${opts.orderNumber}`;
  const text = [
    `${opts.clientName} requested a revision for order ${opts.orderNumber}.`,
    "",
    `Review request: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Client requested revision</h1>
    <p style="margin:16px 0 0;">
      <strong>${esc(opts.clientName)}</strong> requested a revision for order
      <strong>${esc(opts.orderNumber)}</strong>.
    </p>
    ${btn(portalUrl, "Review revision")}
  `);

  await send(adminEmail, subject, html, text);
}

export async function sendRevisionAssignedDesignerEmail(opts: {
  to: string;
  designerName: string;
  orderId: string;
  orderNumber: string;
  revisionNumber: number;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/admin/designer/${opts.orderId}`;
  const firstName = opts.designerName.split(" ")[0] || "there";
  const subject = `Revision assigned — ${opts.orderNumber} (R${opts.revisionNumber})`;
  const text = [
    `Hi ${firstName},`,
    "",
    `You have been assigned revision #${opts.revisionNumber} for order ${opts.orderNumber}.`,
    `Open your job: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Revision assigned</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      You have been assigned revision <strong>#${opts.revisionNumber}</strong> for order
      <strong>${esc(opts.orderNumber)}</strong>.
    </p>
    ${btn(portalUrl, "Open assigned job")}
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

export async function sendQuotePricedEmail(opts: {
  to: string;
  clientName: string;
  quoteNumber: string;
  quoteId: string;
  quotedAmount: number;
  currency: string;
  clientMessage?: string | null;
  recipientUserId?: string | null;
}) {
  const portalUrl = `${appUrl()}/client/quotes/${opts.quoteId}`;
  const firstName = opts.clientName.split(" ")[0] || "there";
  const subject = `Your quote is ready — ${opts.quoteNumber}`;
  const amountLabel = `${opts.currency} ${opts.quotedAmount.toFixed(2)}`;
  const text = [
    `Hi ${firstName},`,
    "",
    `We've reviewed your request ${opts.quoteNumber} and have a price ready for you.`,
    `Quoted amount: ${amountLabel}`,
    opts.clientMessage ? `\nMessage from our team:\n${opts.clientMessage}` : "",
    "",
    `Review and accept your quote: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">Your quote is ready</h1>
    <p style="margin:16px 0 0;">Hi ${esc(firstName)},</p>
    <p style="margin:10px 0 0;">
      We've reviewed your request <strong>${esc(opts.quoteNumber)}</strong>.
      Here is your quoted price:
    </p>
    <p style="margin:16px 0;font-size:22px;font-weight:700;">${esc(amountLabel)}</p>
    ${opts.clientMessage
      ? `<div style="margin:12px 0;padding:14px 16px;border-left:3px solid #c4952a;background:#fefce8;">
          <p style="margin:0;font-size:14px;color:#374151;">${esc(opts.clientMessage)}</p>
        </div>`
      : ""}
    <p style="margin:10px 0 0;font-size:14px;color:#6b7280;">
      Please log in to your client portal to accept or decline this quote.
    </p>
    ${btn(portalUrl, "Review quote")}
  `);

  await send(opts.to, subject, html, text);
  await writeNotificationLog({
    eventType: "QUOTE_PRICED",
    audience: "CLIENT",
    channel: "EMAIL",
    recipientUserId: opts.recipientUserId ?? null,
    recipientAddress: opts.to,
    orderId: opts.quoteId,
    status: "SENT",
  });
}

export async function sendQuoteResponseEmail(opts: {
  quoteNumber: string;
  quoteId: string;
  clientName: string;
  action: "accept" | "reject";
  reason?: string | null;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const portalUrl = `${appUrl()}/admin/orders/${opts.quoteId}`;
  const isAccept = opts.action === "accept";
  const subject = isAccept
    ? `Quote accepted — ${opts.quoteNumber}`
    : `Quote declined — ${opts.quoteNumber}`;

  const text = [
    isAccept
      ? `${opts.clientName} accepted quote ${opts.quoteNumber}. It is ready to convert to an active order.`
      : `${opts.clientName} declined quote ${opts.quoteNumber}.`,
    opts.reason ? `Reason: ${opts.reason}` : "",
    "",
    `View quote: ${portalUrl}`,
  ].join("\n");

  const html = wrap(`
    <h1 style="margin:12px 0 0;font-size:26px;">
      Quote ${isAccept ? "accepted" : "declined"}
    </h1>
    <p style="margin:16px 0 0;">
      <strong>${esc(opts.clientName)}</strong> has
      ${isAccept ? "accepted" : "declined"} quote
      <strong>${esc(opts.quoteNumber)}</strong>.
    </p>
    ${opts.reason
      ? `<p style="margin:10px 0 0;">Reason: <em>${esc(opts.reason)}</em></p>`
      : ""}
    ${isAccept
      ? `<p style="margin:10px 0 0;color:#059669;font-weight:600;">
           Ready to convert to an active order.
         </p>`
      : ""}
    ${btn(portalUrl, "Open in admin panel")}
  `);

  await send(adminEmail, subject, html, text).catch(() => {});
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
