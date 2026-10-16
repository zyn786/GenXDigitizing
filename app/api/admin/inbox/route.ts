// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import {
  assertInboxStaff,
  listThreads,
  unreadByChannel,
  inboxCapabilities,
  listStaff,
  NotInboxStaffError,
} from "@/lib/inbox/queries";

export const dynamic = "force-dynamic";

/** 403 for a signed-in non-staff user; anything else is a real fault. */
function deny(error: any) {
  if (error instanceof NotInboxStaffError) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  console.error("[inbox] list failed:", error?.message ?? error);
  return NextResponse.json({ error: "Failed to load the inbox" }, { status: 500 });
}

// GET /api/admin/inbox?channel=&status=&unread=&q=
export async function GET(req: NextRequest) {
  try {
    await assertInboxStaff();

    const { searchParams } = new URL(req.url);

    // Probed first: whether the assignee list is even worth fetching depends on
    // it, and on a database without migration 063 the answer is no.
    const capabilities = await inboxCapabilities();

    const [threads, unread, staff] = await Promise.all([
      listThreads({
        channel: searchParams.get("channel") || undefined,
        status: searchParams.get("status") || undefined,
        unreadOnly: searchParams.get("unread") === "true",
        search: searchParams.get("q") || undefined,
        limit: Number(searchParams.get("limit")) || undefined,
      }),
      unreadByChannel(),
      capabilities.assignment ? listStaff() : Promise.resolve([]),
    ]);

    return NextResponse.json({ threads, unread, capabilities, staff });
  } catch (error: any) {
    return deny(error);
  }
}
