import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGetSignedUrl } from "@/lib/s3";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ orderId: string }> };

const REVIEWABLE_PROOF_STATUSES = new Set([
  "SENT_TO_CLIENT",
  "CLIENT_REVIEWING",
  "CLIENT_APPROVED",
  "REVISION_REQUESTED",
]);

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "application/pdf"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "pdf"]);
const BLOCKED_EXTENSIONS = new Set([
  "dst",
  "pes",
  "emb",
  "exp",
  "jef",
  "vp3",
  "xxx",
  "hus",
  "sew",
  "dxt",
  "zip",
]);

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx < 0 || idx === fileName.length - 1) return "";
  return fileName.slice(idx + 1).toLowerCase();
}

function isAllowedProofFile(fileName: string, mimeType: string): boolean {
  const ext = getExtension(fileName);
  const mime = mimeType.toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) return false;
  if (!ALLOWED_MIME_TYPES.has(mime)) return false;
  if (!ALLOWED_EXTENSIONS.has(ext)) return false;
  return true;
}

export async function GET(_req: Request, { params }: RouteProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ ok: false, error: "Proof previews are only available to the order owner." }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findFirst({
    where: { id: orderId, clientUserId: session.user.id },
    select: { id: true, status: true, proofStatus: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  // Allow proof access when proofStatus is reviewable OR order is in PROOF_READY.
  // PROOF_READY status means proof has been sent — covers paths where proofStatus
  // may not have been explicitly set (e.g. admin workflow PATCH).
  const canView =
    REVIEWABLE_PROOF_STATUSES.has(order.proofStatus) ||
    order.status === "PROOF_READY";

  if (!canView) {
    if (process.env.NODE_ENV === "development") {
      console.log("[proof-files] proof not viewable", {
        orderId,
        proofStatus: order.proofStatus,
        orderStatus: order.status,
      });
    }
    return NextResponse.json({ ok: true, files: [] });
  }

  const rows = await prisma.orderFile.findMany({
    where: { orderId, fileType: "PROOF_PREVIEW" },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      bucket: true,
      objectKey: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const files: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    previewUrl: string;
  }> = [];

  for (const row of rows) {
    if (!isAllowedProofFile(row.fileName, row.mimeType)) continue;
    try {
      const previewUrl = await createGetSignedUrl(row.bucket, row.objectKey, 300);
      files.push({
        id: row.id,
        fileName: row.fileName,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        createdAt: row.createdAt.toISOString(),
        previewUrl,
      });
    } catch {
      // Skip files we can't generate signed URLs for — never leak objectKey or bucket.
      continue;
    }
  }

  return NextResponse.json({ ok: true, files });
}
