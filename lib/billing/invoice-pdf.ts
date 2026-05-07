import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// ─── Types ──────────────────────────────────────────────────────────────────

type LineItem = {
  label: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type PaymentRecord = {
  receiptNumber: string;
  amount: number;
  method: string;
  receivedAt: string;
};

type InvoicePdfData = {
  invoiceNumber: string;
  status: string;
  clientName: string;
  clientEmail: string;
  orderNumber?: string | null;
  currency: string;
  dueDate: string;
  issueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes: string | null;
  payments: PaymentRecord[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BLACK = rgb(0.1, 0.1, 0.1);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.85, 0.85, 0.85);
const ACCENT = rgb(0.06, 0.4, 0.85);

function fmt(n: number, currency: string): string {
  return `${currency} ${n.toFixed(2)}`;
}

function drawHr(page: ReturnType<PDFDocument["addPage"]>, y: number, width: number) {
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 0.5,
    color: LIGHT_GRAY,
  });
}

// ─── Invoice PDF ─────────────────────────────────────────────────────────────

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]); // A4
  const w = page.getWidth();
  let y = 800;

  // ── Header ──
  page.drawText("GenX Digitizing", { x: 50, y, size: 20, font: bold, color: ACCENT });
  y -= 22;
  page.drawText("Professional Embroidery Digitizing", { x: 50, y, size: 9, font, color: GRAY });
  y -= 28;

  // ── Invoice title + number ──
  page.drawText("INVOICE", { x: 50, y, size: 16, font: bold, color: BLACK });
  page.drawText(data.invoiceNumber, { x: w - 50 - 120, y: y + 2, size: 10, font: bold, color: GRAY, });
  y -= 22;
  page.drawText(`Status: ${data.status.replace(/_/g, " ")}`, { x: 50, y, size: 10, font: bold, color: ACCENT });
  y -= 10;
  page.drawText(`Issued: ${data.issueDate}`, { x: 50, y, size: 9, font, color: GRAY });
  page.drawText(`Due: ${data.dueDate}`, { x: w - 50 - 100, y, size: 9, font, color: GRAY });
  y -= 24;

  drawHr(page, y, w);
  y -= 20;

  // ── Client info ──
  page.drawText("Bill To:", { x: 50, y, size: 9, font: bold, color: BLACK });
  y -= 14;
  page.drawText(data.clientName, { x: 50, y, size: 10, font, color: BLACK });
  y -= 13;
  page.drawText(data.clientEmail, { x: 50, y, size: 9, font, color: GRAY });
  y -= 20;

  if (data.orderNumber) {
    page.drawText(`Order: ${data.orderNumber}`, { x: 50, y, size: 9, font, color: GRAY });
    y -= 16;
  }

  y -= 10;
  drawHr(page, y, w);
  y -= 18;

  // ── Line items header ──
  const colDesc = 50;
  const colQty = 360;
  const colPrice = 410;
  const colTotal = 490;
  page.drawText("Description", { x: colDesc, y, size: 8, font: bold, color: GRAY });
  page.drawText("Qty", { x: colQty, y, size: 8, font: bold, color: GRAY });
  page.drawText("Price", { x: colPrice, y, size: 8, font: bold, color: GRAY });
  page.drawText("Total", { x: colTotal, y, size: 8, font: bold, color: GRAY });
  y -= 4;
  drawHr(page, y, w);
  y -= 14;

  // ── Line items ──
  for (const item of data.lineItems) {
    page.drawText(item.label, { x: colDesc, y, size: 9, font, color: BLACK });
    page.drawText(String(item.quantity), { x: colQty, y, size: 9, font, color: BLACK });
    page.drawText(fmt(item.unitPrice, data.currency), { x: colPrice, y, size: 9, font, color: BLACK });
    page.drawText(fmt(item.lineTotal, data.currency), { x: colTotal, y, size: 9, font, color: BLACK });
    y -= 13;
    if (item.description) {
      page.drawText(item.description, { x: colDesc + 8, y, size: 7, font, color: GRAY });
      y -= 12;
    }
    y -= 4;
  }

  y -= 6;
  drawHr(page, y, w);
  y -= 16;

  // ── Totals ──
  const rightX = colTotal;
  page.drawText("Subtotal:", { x: colPrice, y, size: 9, font, color: GRAY });
  page.drawText(fmt(data.subtotal, data.currency), { x: rightX, y, size: 9, font, color: BLACK });
  y -= 15;

  if (data.discountAmount > 0) {
    page.drawText("Discount:", { x: colPrice, y, size: 9, font, color: GRAY });
    page.drawText(`-${fmt(data.discountAmount, data.currency)}`, { x: rightX, y, size: 9, font, color: BLACK });
    y -= 15;
  }

  page.drawText("Total:", { x: colPrice, y, size: 10, font: bold, color: BLACK });
  page.drawText(fmt(data.totalAmount, data.currency), { x: rightX, y, size: 10, font: bold, color: BLACK });
  y -= 15;
  page.drawText("Paid:", { x: colPrice, y, size: 9, font, color: GRAY });
  page.drawText(fmt(data.paidAmount, data.currency), { x: rightX, y, size: 9, font, color: BLACK });
  y -= 15;
  page.drawText("Balance Due:", { x: colPrice, y, size: 10, font: bold, color: data.balanceDue > 0 ? BLACK : rgb(0, 0.6, 0) });
  page.drawText(fmt(data.balanceDue, data.currency), { x: rightX, y, size: 10, font: bold, color: data.balanceDue > 0 ? BLACK : rgb(0, 0.6, 0) });
  y -= 30;

  // ── Notes ──
  if (data.notes) {
    page.drawText("Notes:", { x: 50, y, size: 8, font: bold, color: GRAY });
    y -= 12;
    page.drawText(data.notes, { x: 50, y, size: 8, font, color: GRAY, maxWidth: w - 100 });
    y -= 20;
  }

  // ── Footer ──
  const footerY = 50;
  drawHr(page, footerY + 20, w);
  page.drawText("Thank you for choosing GenX Digitizing.", { x: 50, y: footerY + 8, size: 8, font, color: GRAY });
  page.drawText(`Generated ${new Date().toISOString().slice(0, 10)}`, { x: w - 50 - 100, y: footerY + 8, size: 7, font, color: GRAY });

  return doc.save();
}

// ─── Receipt PDF ─────────────────────────────────────────────────────────────

export async function generateReceiptPdf(data: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]);
  const w = page.getWidth();
  let y = 800;

  // ── Header ──
  page.drawText("GenX Digitizing", { x: 50, y, size: 20, font: bold, color: ACCENT });
  y -= 22;
  page.drawText("Professional Embroidery Digitizing", { x: 50, y, size: 9, font, color: GRAY });
  y -= 30;

  // ── Receipt title ──
  page.drawText("PAYMENT RECEIPT", { x: 50, y, size: 16, font: bold, color: BLACK });
  y -= 24;
  page.drawText(`Invoice: ${data.invoiceNumber}`, { x: 50, y, size: 10, font, color: BLACK });
  y -= 14;
  page.drawText(`Issued: ${new Date().toISOString().slice(0, 10)}`, { x: 50, y, size: 9, font, color: GRAY });
  y -= 24;

  drawHr(page, y, w);
  y -= 20;

  // ── Client ──
  page.drawText("Received From:", { x: 50, y, size: 9, font: bold, color: BLACK });
  y -= 14;
  page.drawText(data.clientName, { x: 50, y, size: 10, font, color: BLACK });
  y -= 13;
  page.drawText(data.clientEmail, { x: 50, y, size: 9, font, color: GRAY });
  y -= 22;

  if (data.orderNumber) {
    page.drawText(`Order: ${data.orderNumber}`, { x: 50, y, size: 9, font, color: GRAY });
    y -= 16;
  }

  drawHr(page, y, w);
  y -= 20;

  // ── Payment summary ──
  page.drawText("Amount Paid:", { x: 50, y, size: 11, font: bold, color: BLACK });
  page.drawText(fmt(data.paidAmount, data.currency), { x: 200, y, size: 12, font: bold, color: ACCENT });
  y -= 22;

  page.drawText("Invoice Total:", { x: 50, y, size: 9, font, color: GRAY });
  page.drawText(fmt(data.totalAmount, data.currency), { x: 200, y, size: 9, font, color: BLACK });
  y -= 15;

  page.drawText("Balance Remaining:", { x: 50, y, size: 9, font, color: GRAY });
  page.drawText(fmt(data.balanceDue, data.currency), { x: 200, y, size: 9, font, color: data.balanceDue <= 0 ? rgb(0, 0.6, 0) : BLACK });
  y -= 24;

  // ── Payment history ──
  if (data.payments.length > 0) {
    page.drawText("Payment History:", { x: 50, y, size: 9, font: bold, color: GRAY });
    y -= 14;
    for (const p of data.payments) {
      const methodLabel = p.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      page.drawText(`${p.receiptNumber} — ${fmt(p.amount, data.currency)} via ${methodLabel} — ${p.receivedAt}`, {
        x: 50, y, size: 8, font, color: GRAY,
      });
      y -= 12;
    }
  }

  y -= 10;
  drawHr(page, y, w);

  // ── Footer ──
  const footerY = 50;
  drawHr(page, footerY + 20, w);
  page.drawText("Payment received. Final files are available if unlocked.", { x: 50, y: footerY + 8, size: 8, font, color: GRAY });
  page.drawText(`Generated ${new Date().toISOString().slice(0, 10)}`, { x: w - 50 - 100, y: footerY + 8, size: 7, font, color: GRAY });

  return doc.save();
}
