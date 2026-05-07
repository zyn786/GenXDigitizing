import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function makeClient() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

const BUCKET =
  process.env.S3_BUCKET ??
  process.env.ORDER_IMAGES_BUCKET ??
  process.env.CHAT_ATTACHMENTS_BUCKET ??
  "genxdigitizing";

type AccessRole =
  | "SUPER_ADMIN"
  | "MANAGER"
  | "ADMIN"
  | "DESIGNER"
  | "CHAT_SUPPORT"
  | "MARKETING"
  | "CLIENT"
  | string;

function isFullAdmin(role: AccessRole): boolean {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "ADMIN";
}

/**
 * Authorize access to an S3 object key by looking it up across the file-bearing
 * Prisma models and applying role-aware ownership rules.
 *
 * Returns:
 *   - { decision: "not_found" } when the key isn't owned by any tracked record
 *   - { decision: "deny" } when the key is found but the caller can't see it
 *   - { decision: "allow" } when access is permitted
 */
async function authorizeAssetAccess(
  objectKey: string,
  userId: string,
  role: AccessRole
): Promise<{ decision: "allow" | "deny" | "not_found" }> {
  // 1) OrderFile (designer-uploaded proofs and final files)
  const orderFile = await prisma.orderFile.findUnique({
    where: { objectKey },
    select: {
      fileType: true,
      uploadedByUserId: true,
      order: {
        select: {
          clientUserId: true,
          assignedToUserId: true,
          invoice: { select: { filesUnlocked: true } },
        },
      },
    },
  });

  if (orderFile) {
    if (isFullAdmin(role)) return { decision: "allow" };

    if (role === "DESIGNER") {
      return orderFile.order.assignedToUserId === userId
        ? { decision: "allow" }
        : { decision: "deny" };
    }

    if (role === "CLIENT") {
      const isOwner = orderFile.order.clientUserId === userId;
      if (!isOwner) return { decision: "deny" };

      // Final files locked until payment is approved.
      if (orderFile.fileType === "FINAL_FILE") {
        const unlocked = orderFile.order.invoice?.filesUnlocked ?? false;
        return unlocked ? { decision: "allow" } : { decision: "deny" };
      }

      return { decision: "allow" };
    }

    // CHAT_SUPPORT / MARKETING / other: not allowed for OrderFile.
    return { decision: "deny" };
  }

  // 2) ClientReferenceFile (reference images uploaded with quotes/orders)
  const referenceFile = await prisma.clientReferenceFile.findUnique({
    where: { objectKey },
    select: {
      uploaderUserId: true,
      order: { select: { clientUserId: true, assignedToUserId: true } },
    },
  });

  if (referenceFile) {
    if (isFullAdmin(role)) return { decision: "allow" };

    if (role === "DESIGNER") {
      return referenceFile.order.assignedToUserId === userId
        ? { decision: "allow" }
        : { decision: "deny" };
    }

    if (role === "CLIENT") {
      const isOwner = referenceFile.order.clientUserId === userId;
      const isUploader = referenceFile.uploaderUserId === userId;
      return isOwner || isUploader ? { decision: "allow" } : { decision: "deny" };
    }

    // CHAT_SUPPORT / MARKETING: not allowed for reference files.
    return { decision: "deny" };
  }

  // 3) PaymentProofSubmission (client-uploaded payment screenshots)
  // proofImageKey is not @unique in the schema, so use findFirst.
  const paymentProof = await prisma.paymentProofSubmission.findFirst({
    where: { proofImageKey: objectKey },
    select: {
      clientUserId: true,
      invoice: { select: { order: { select: { clientUserId: true } } } },
    },
  });

  if (paymentProof) {
    if (isFullAdmin(role)) return { decision: "allow" };

    if (role === "CLIENT") {
      const isSubmitter = paymentProof.clientUserId === userId;
      const isOrderClient =
        paymentProof.invoice.order.clientUserId === userId;
      return isSubmitter || isOrderClient
        ? { decision: "allow" }
        : { decision: "deny" };
    }

    // DESIGNER, CHAT_SUPPORT, MARKETING: not allowed for payment proofs.
    return { decision: "deny" };
  }

  // NOTE (Phase 11A.0): ChatAttachment authorization intentionally deferred.
  // ChatAttachment is keyed by objectKey and joins through ChatMessage →
  // ChatThread → ChatParticipant. A safe single-pass check requires reading
  // participant rows for the requesting user; that is left for a follow-up
  // phase. Until then, ChatAttachment object keys will fall through to 404.

  return { decision: "not_found" };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    // Do not 404 — that would confirm whether the key exists.
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { key: keyParts } = await params;
  const objectKey = keyParts.join("/");

  const { decision } = await authorizeAssetAccess(
    objectKey,
    session.user.id,
    String(session.user.role ?? "")
  );

  if (decision === "not_found") {
    return new NextResponse("Asset not found", { status: 404 });
  }
  if (decision === "deny") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const range = request.headers.get("range") ?? undefined;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Range: range,
    });
    const s3res = await makeClient().send(command);

    const headers = new Headers();
    if (s3res.ContentType)   headers.set("Content-Type",   s3res.ContentType);
    if (s3res.ContentLength) headers.set("Content-Length", String(s3res.ContentLength));
    if (s3res.ContentRange)  headers.set("Content-Range",  s3res.ContentRange);
    if (s3res.AcceptRanges)  headers.set("Accept-Ranges",  s3res.AcceptRanges);
    headers.set("Cache-Control", "private, max-age=86400, stale-while-revalidate=604800");

    const status = range ? 206 : 200;
    return new NextResponse(s3res.Body as ReadableStream, { status, headers });
  } catch {
    return new NextResponse("Asset not found", { status: 404 });
  }
}
