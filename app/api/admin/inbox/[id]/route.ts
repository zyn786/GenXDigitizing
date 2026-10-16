// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import {
  assertInboxStaff,
  getThread,
  markThreadRead,
  setThreadStatus,
  assignThread,
  listNotes,
  addNote,
  listStaff,
  inboxCapabilities,
  getReplyTarget,
  NotInboxStaffError,
} from "@/lib/inbox/queries";
import { replyContext } from "@/lib/inbox/reply";

export const dynamic = "force-dynamic";

const STATUSES = ["open", "snoozed", "closed"];

function deny(error: any) {
  if (error instanceof NotInboxStaffError) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.error("[inbox] thread failed:", error?.message ?? error);
  return NextResponse.json({ error: "Failed to load the conversation" }, { status: 500 });
}

// GET /api/admin/inbox/[id] — one thread and its messages
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertInboxStaff();
    const { id } = await params;

    const detail = await getThread(id);
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const capabilities = await inboxCapabilities();

    // The reply decision travels with the thread so the UI can offer a reply box
    // exactly where a send would land, and explain itself where it would not.
    // Decided here, not in the browser: the same rule is enforced again in the
    // reply route, which is the one that actually reaches a customer.
    const [notes, target] = await Promise.all([
      capabilities.notes ? listNotes(id) : Promise.resolve([]),
      getReplyTarget(id),
    ]);

    const reply = replyContext({
      channel: target?.channel ?? detail.thread.channel,
      lastInboundAt: target?.lastInboundAt ?? null,
    });

    return NextResponse.json({ ...detail, notes, capabilities, reply });
  } catch (error: any) {
    return deny(error);
  }
}

/**
 * PATCH /api/admin/inbox/[id] — { read?: true } | { status } | { assignedTo }
 *
 * Triage only, and deliberately not the reply path: sending has its own
 * provider-specific authorisation and delivery accounting and lives in
 * ./reply/route.ts. Keeping them apart means nothing here can reach a customer.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertInboxStaff();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json(
          { error: `status must be one of ${STATUSES.join(", ")}` },
          { status: 400 }
        );
      }
      await setThreadStatus(id, body.status);
    }

    if (body.read === true) await markThreadRead(id);

    if (body.assignedTo !== undefined) {
      // null clears the assignment; a string must be a real staff member, not
      // whatever id the client felt like sending.
      if (body.assignedTo !== null && typeof body.assignedTo !== "string") {
        return NextResponse.json(
          { error: "assignedTo must be a user id or null" },
          { status: 400 }
        );
      }
      if (body.assignedTo !== null) {
        const { assignment } = await inboxCapabilities();
        if (!assignment) {
          return NextResponse.json(
            { error: "Assignment is not available yet (migration 063)" },
            { status: 409 }
          );
        }
        const staff = await listStaff();
        if (!staff.some((s) => s.id === body.assignedTo)) {
          return NextResponse.json(
            { error: "assignedTo must be an active admin or crm user" },
            { status: 400 }
          );
        }
      }
      await assignThread(id, body.assignedTo);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return deny(error);
  }
}

/**
 * POST /api/admin/inbox/[id] — { body } adds an internal note.
 *
 * A note is staff-only: it goes to `conversation_notes`, never to
 * `conversation_messages`, so it can never be mistaken for something the
 * customer was told. The author is taken from the session, not the request.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await assertInboxStaff();
    const { id } = await params;

    const { notes } = await inboxCapabilities();
    if (!notes) {
      return NextResponse.json(
        { error: "Internal notes are not available yet (migration 063)" },
        { status: 409 }
      );
    }

    const payload = await req.json().catch(() => ({}));
    const body = typeof payload.body === "string" ? payload.body : "";
    if (!body.trim()) {
      return NextResponse.json({ error: "A note cannot be empty" }, { status: 400 });
    }

    const note = await addNote(id, body, user.id);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "A note cannot be empty") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return deny(error);
  }
}
