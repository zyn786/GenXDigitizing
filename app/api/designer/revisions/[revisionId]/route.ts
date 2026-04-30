import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ revisionId: string } | Record<string, string | string[] | undefined>> };

const schema = z.object({
  action: z.enum(["start_progress", "mark_revised_proof_uploaded", "update_notes"]),
  designerNotes: z.string().trim().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const raw = await params;
  const revisionId = typeof raw.revisionId === "string" ? raw.revisionId : "";
  if (!revisionId) return NextResponse.json({ error: "Invalid revision id." }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "DESIGNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload.", issues: parsed.error.issues }, { status: 400 });
  }

  const revision = await prisma.orderRevision.findUnique({
    where: { id: revisionId },
    select: { id: true, assignedDesignerId: true, status: true },
  });
  if (!revision || revision.assignedDesignerId !== session.user.id) {
    return NextResponse.json({ error: "Revision not found." }, { status: 404 });
  }

  const { action } = parsed.data;
  const data: {
    status?: "IN_PROGRESS" | "REVISED_PROOF_UPLOADED";
    designerNotes?: string | null;
    completedAt?: Date | null;
  } = {};

  if (action === "start_progress" && revision.status === "ASSIGNED_TO_DESIGNER") {
    data.status = "IN_PROGRESS";
  }
  if (action === "mark_revised_proof_uploaded") {
    data.status = "REVISED_PROOF_UPLOADED";
    data.completedAt = new Date();
  }
  if (action === "update_notes") {
    data.designerNotes = parsed.data.designerNotes ?? null;
  }

  const updated = await prisma.orderRevision.update({
    where: { id: revisionId },
    data,
  });

  return NextResponse.json({ ok: true, revision: updated });
}
