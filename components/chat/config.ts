// Static UI configuration — not mock data

import type { QuickReply, SavedResponse } from "./types";

export const QUICK_REPLIES: QuickReply[] = [
  { id: "qr-1", label: "Order Received", content: "We've received your order and it's being processed. You'll receive your digitized file within the turnaround time.", category: "order" },
  { id: "qr-2", label: "File Ready", content: "Your digitized file is ready for review! Please check the attached file and let us know if any revisions are needed.", category: "order" },
  { id: "qr-3", label: "Need More Info", content: "We need some additional information to proceed with your order. Could you please clarify the placement details?", category: "order" },
  { id: "qr-4", label: "Revision Done", content: "We've completed the requested revisions. Please review the updated file and let us know if it meets your requirements.", category: "revision" },
  { id: "qr-5", label: "Turnaround Time", content: "Standard turnaround is 12–24 hours. Rush (6h) and Urgent (3h) options are available at no extra charge.", category: "general" },
  { id: "qr-6", label: "Format Help", content: "We can deliver in any format you need — DST, PES, EMB, JEF, XXX, VIP, HUS, EXP, and more. All format conversions are free!", category: "general" },
  { id: "qr-7", label: "Pricing Info", content: "Pricing starts at $7 for small designs. Medium designs are $18, large designs $25. All include free revisions and format conversion.", category: "general" },
  { id: "qr-8", label: "File Requirements", content: "For best results, please send your artwork as a high-resolution PNG or vector file (AI, SVG, EPS). We can work with JPG too!", category: "general" },
];

export const SAVED_RESPONSES: SavedResponse[] = [
  {
    id: "sr-1",
    title: "Welcome Message",
    content: "Welcome to genxdigitizing! 👋 I'm here to help with your embroidery digitizing needs. Feel free to ask any questions about your order, turnaround times, or file requirements.",
  },
  {
    id: "sr-2",
    title: "Order Confirmation",
    content: "Thank you for your order! 🧵 Here's what happens next:\n\n1. We'll review your artwork\n2. Our digitizer will hand-craft your file\n3. You'll receive it within the turnaround time\n4. Free revisions if needed\n\nYour order number is attached above.",
  },
  {
    id: "sr-3",
    title: "Delivery Notice",
    content: "Great news! 🎉 Your digitized files are ready. Please check the attachment and verify:\n\n✓ Stitch density\n✓ Color sequence\n✓ Size and placement\n\nIf anything needs adjustment, just reply here — revisions are free!",
  },
];
