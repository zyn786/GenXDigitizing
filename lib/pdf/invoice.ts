// @ts-nocheck
/**
 * Professional invoice PDF generator using PDFKit.
 * Features: embedded logo, clean layout, proper typography.
 */

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber:   string;
  issuedAt:      string;
  dueAt:         string;
  paidAt?:       string;
  status:        string;

  clientName:    string;
  clientEmail:   string;
  clientCompany: string;
  clientCountry: string;

  serviceName:   string;
  serviceSize:   string;
  turnaround:    string;
  outputFormat:  string;

  amount:        number;
  currency:      string;

  companyName:   string;
  companyEmail:  string;
  companyWebsite: string;
}

// Brand colours
const DARK    = "#0F172A";
const SLATE   = "#334155";
const MUTED   = "#64748B";
const LIGHTER = "#94A3B8";
const BORDER  = "#E2E8F0";
const BG      = "#F8FAFC";
const CYAN    = "#2FA4D7";
const GREEN   = "#10B981";
const ORANGE  = "#E76F2E";
const WHITE   = "#FFFFFF";

const TURNAROUND_LABEL: Record<string, string> = {
  standard: "Standard (12-24h)",
  rush:     "Rush (6h)",
  urgent:   "Urgent (3h)",
};

function formatDateStr(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
}

async function loadLogo(): Promise<Buffer | null> {
  // Try filesystem first (local dev), then fetch from public URL (production)
  try {
    const logoPath = path.resolve(process.cwd(), "public", "images", "black_logo.png");
    return fs.readFileSync(logoPath);
  } catch {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/images/black_logo.png`);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {}
  }
  return null;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const logoBuffer = await loadLogo();

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margin: 0, // We handle margins ourselves for full control
      info: {
        Title:   `Invoice ${data.invoiceNumber}`,
        Author:  data.companyName,
        Subject: `Invoice for order ${data.orderNumber}`,
      },
    });

    doc.on("data",  (c: Buffer) => chunks.push(c));
    doc.on("end",   ()         => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 595.28 for A4
    const H = doc.page.height;  // 841.89 for A4
    const M = 48; // margin

    // ══════════════════════════════════════════════════════════
    //  HEADER BAR
    // ══════════════════════════════════════════════════════════
    const headerH = 100;
    doc.rect(0, 0, W, headerH).fill(DARK);

    // Logo on left
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, M, 20, { height: 32 });
      } catch {
        // Fallback to text logo
        doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(20)
           .text(data.companyName, M, 28);
      }
    } else {
      doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(20)
         .text(data.companyName, M, 28);
    }

    // Orange accent line below logo area
    doc.rect(0, headerH - 4, W, 4).fill(ORANGE);

    // "INVOICE" label on right
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(26)
       .text("INVOICE", W - M, 28, { align: "right", width: 200 });

    // Company contact line below header
    doc.fillColor("rgba(255,255,255,0.55)").font("Helvetica").fontSize(9)
       .text(`${data.companyEmail}  ·  ${data.companyWebsite}`, M, 64);

    // ══════════════════════════════════════════════════════════
    //  BILL TO + INVOICE META
    // ══════════════════════════════════════════════════════════
    let y = headerH + 28;

    // --- Left: Bill To ---
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
       .text("BILL TO", M, y, { characterSpacing: 1.5 });
    y += 14;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(13)
       .text(data.clientCompany || data.clientName, M, y);
    y += 18;
    doc.fillColor(SLATE).font("Helvetica").fontSize(10)
       .text(data.clientName, M, y);
    y += 15;
    doc.fillColor(MUTED).font("Helvetica").fontSize(9)
       .text(data.clientEmail, M, y);
    if (data.clientCountry) {
      y += 14;
      doc.text(data.clientCountry, M, y);
    }

    // --- Right: Invoice details ---
    y = headerH + 28;
    const rx = W / 2 + 24;
    const rw = W - rx - M;

    const metaRows: [string, string][] = [
      ["Invoice Number",   data.invoiceNumber],
      ["Order Number",     data.orderNumber],
      ["Date Issued",      formatDateStr(data.issuedAt)],
      ["Due Date",         formatDateStr(data.dueAt)],
      ...(data.paidAt ? [["Date Paid", formatDateStr(data.paidAt)] as [string, string]] : []),
    ];

    metaRows.forEach(([label, value]) => {
      doc.fillColor(MUTED).font("Helvetica").fontSize(9)
         .text(label, rx, y);
      doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10)
         .text(value, rx + 110, y);
      y += 18;
    });

    // Status pill
    y += 2;
    const statusLabel = data.status.toUpperCase();
    const statusColor = data.status === "paid" ? GREEN : data.status === "pending" ? ORANGE : MUTED;
    const statusBg    = data.status === "paid" ? "#F0FDF4" : data.status === "pending" ? "#FFF7ED" : BG;
    doc.roundedRect(rx + 110, y, 64, 20, 10).fill(statusColor);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(8)
       .text(statusLabel, rx + 110, y + 6, { width: 64, align: "center" });

    // ══════════════════════════════════════════════════════════
    //  DIVIDER
    // ══════════════════════════════════════════════════════════
    y = headerH + 28 + Math.max(metaRows.length * 18 + 30, 90) + 14;
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BORDER).lineWidth(1.5).stroke();
    y += 24;

    // ══════════════════════════════════════════════════════════
    //  SERVICE TABLE
    // ══════════════════════════════════════════════════════════
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
       .text("SERVICE DETAILS", M, y, { characterSpacing: 1.5 });
    y += 16;

    // Table header
    const colDesc   = M;
    const colQty    = 370;
    const colPrice  = 440;
    const colTotal  = W - M;
    const tableW    = W - M * 2;

    doc.rect(M, y, tableW, 24).fill(BG).strokeColor(BORDER).lineWidth(0.5).stroke();
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8);
    doc.text("DESCRIPTION", colDesc + 8, y + 8);
    doc.text("QTY",         colQty, y + 8);
    doc.text("UNIT PRICE",  colPrice, y + 8);
    doc.text("AMOUNT",      colTotal - 60, y + 8, { width: 60, align: "right" });
    y += 28;

    // Service row
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(11)
       .text(data.serviceName, colDesc + 8, y + 4);

    const detailParts = [
      data.serviceSize,
      TURNAROUND_LABEL[data.turnaround] ?? data.turnaround,
      `Format: ${data.outputFormat}`,
    ].filter(Boolean);

    doc.fillColor(MUTED).font("Helvetica").fontSize(8)
       .text(detailParts.join("  ·  "), colDesc + 8, y + 20);

    doc.fillColor(SLATE).font("Helvetica").fontSize(10)
       .text("1",       colQty,  y + 6)
       .text(`$${data.amount.toFixed(2)}`, colPrice, y + 6)
       .text(`$${data.amount.toFixed(2)}`, colTotal - 60, y + 6, { width: 60, align: "right" });

    // Bottom border of table
    y += 44;
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BORDER).lineWidth(0.5).stroke();
    y += 6;

    // Free services row
    doc.rect(M, y, tableW, 20).fill("#F0FDF4").strokeColor("#BBF7D0").lineWidth(0.5).stroke();
    doc.fillColor(GREEN).font("Helvetica").fontSize(8)
       .text("Unlimited revisions  ·  All format conversions  ·  All turnaround speeds  —  always FREE", M + 10, y + 6);
    y += 28;

    // ══════════════════════════════════════════════════════════
    //  TOTALS
    // ══════════════════════════════════════════════════════════
    const totX = W - M - 200; // right-aligned block

    const drawTotalRow = (label: string, value: string, bold: boolean, color: string) => {
      doc.fillColor(bold ? color : MUTED)
         .font(bold ? "Helvetica-Bold" : "Helvetica")
         .fontSize(bold ? 12 : 10)
         .text(label, totX, y, { width: 130, align: "right" })
         .text(value, totX + 140, y, { width: 60, align: "right" });
      y += bold ? 20 : 15;
    };

    drawTotalRow("Subtotal",          `$${data.amount.toFixed(2)}`, false, SLATE);
    drawTotalRow("Format Conversions", "FREE",                      false, GREEN);
    drawTotalRow("Unlimited Revisions","FREE",                      false, GREEN);
    drawTotalRow("Tax",                "Included",                  false, MUTED);

    y += 2;
    doc.moveTo(totX, y).lineTo(W - M, y).strokeColor(CYAN).lineWidth(2).stroke();
    y += 8;
    drawTotalRow("TOTAL DUE", `$${data.amount.toFixed(2)} ${data.currency}`, true, DARK);

    // ══════════════════════════════════════════════════════════
    //  PAYMENT INFO
    // ══════════════════════════════════════════════════════════
    y += 20;
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BORDER).lineWidth(1).stroke();
    y += 16;

    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8)
       .text("PAYMENT INFORMATION", M, y, { characterSpacing: 1.5 });
    y += 14;

    doc.fillColor(SLATE).font("Helvetica").fontSize(9)
       .text("Payment is processed securely via Payoneer. A checkout link will be sent to your registered email address.", M, y, { width: tableW });
    y += 14;
    doc.fillColor(MUTED).font("Helvetica").fontSize(9)
       .text(`For billing questions, contact ${data.companyEmail}`, M, y);

    // ══════════════════════════════════════════════════════════
    //  FOOTER
    // ══════════════════════════════════════════════════════════
    const footerY = H - 60;
    doc.rect(0, footerY, W, 60).fill(DARK);
    // Orange accent at top of footer
    doc.rect(0, footerY, W, 3).fill(ORANGE);

    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(10)
       .text(`Thank you for choosing ${data.companyName}`, M, footerY + 14);
    doc.fillColor("rgba(255,255,255,0.5)").font("Helvetica").fontSize(8)
       .text(`${data.companyEmail}  ·  ${data.companyWebsite}  ·  Professional Embroidery Digitizing`,
             M, footerY + 30);

    doc.end();
  });
}
