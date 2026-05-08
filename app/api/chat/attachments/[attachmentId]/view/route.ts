import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { requireChatActor } from "@/lib/chat/api-auth";
import { createGetSignedUrl } from "@/lib/s3";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

const FULL_INTERNAL_ACCESS = new Set<Role>(["SUPER_ADMIN", "MANAGER", "CHAT_SUPPORT"] as Role[]);

type RouteProps = { params: Promise<{ attachmentId: string }> };

export async function GET(_req: Request, { params }: RouteProps) {
  try {
    const session = await auth();
    const actor = requireChatActor(session);
    const { attachmentId } = await params;

    const attachment = await prisma.chatAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: {
          select: {
            threadId: true,
            thread: {
              select: {
                clientUserId: true,
                participants: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    }

    const thread = attachment.message.thread;

    // Verify access — same logic as buildThreadAccessWhere
    if (actor.role === "CLIENT" && thread.clientUserId !== actor.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      actor.role !== "CLIENT" &&
      !FULL_INTERNAL_ACCESS.has(actor.role)
    ) {
      // DESIGNER / MARKETING: must be a thread participant or assigned
      const isParticipant = thread.participants.some(
        (p) => p.userId === actor.id,
      );
      if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const viewUrl = await createGetSignedUrl(
      attachment.bucket,
      attachment.objectKey,
      300,
    );

    return NextResponse.json({
      ok: true,
      viewUrl,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to generate view link." },
      { status: 500 },
    );
  }
}
