import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createGetSignedUrl } from "@/lib/s3";
import { prisma } from "@/lib/db";

type RouteProps = { params: Promise<{ orderId: string }> };

const ALLOWED_ADMIN_ROLES = new Set(["SUPER_ADMIN", "MANAGER", "DESIGNER"]);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]);
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

  const role = String(session.user.role ?? "");
  if (!ALLOWED_ADMIN_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: { id: true, assignedToUserId: true },
  });

  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  // Designers may only see proof files for orders assigned to them.
  if (role === "DESIGNER" && order.assignedToUserId !== session.user.id) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
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
      uploadedByUserId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const files: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    uploadedByUserId: string | null;
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
        uploadedByUserId: row.uploadedByUserId,
        previewUrl,
      });
    } catch {
      // Skip files we can't generate signed URLs for — never leak objectKey or bucket.
      continue;
    }
  }

  return NextResponse.json({ ok: true, files });
}
