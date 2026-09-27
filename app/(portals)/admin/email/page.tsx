// @ts-nocheck
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/supabase/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/portals/Topbar";
import { EmailComposer } from "./EmailComposer";

const PAGE_SIZE = 50;

/** Postgres "column does not exist" — a migration hasn't been applied. */
function isMissingColumn(error: any) {
  return !!error && /does not exist/i.test(error.message || "");
}

/** Columns added by migration 037 and 038, with the pre-migration fallbacks. */
const SENT_COLUMNS_FULL = "id, to_email, from_email, subject, body, sent_at, resend_id, attachments_meta, message_id, thread_id, in_reply_to, references";
const SENT_COLUMNS_LEGACY = "id, to_email, from_email, subject, body, sent_at, resend_id";
const INBOX_COLUMNS_FULL = "id, from_email, to_email, cc_emails, subject, body_html, body_text, received_at, attachments_meta, is_read, sender_name, message_id, resend_id, thread_id, in_reply_to, references";
const INBOX_COLUMNS_LEGACY = "id, from_email, to_email, cc_emails, subject, body_html, body_text, received_at, attachments_meta, resend_id";

/**
 * Reads use the service-role client: `email_thread_summary` is deliberately
 * revoked from `anon`/`authenticated` (it aggregates every conversation and
 * would otherwise leak other people's mail through a security-definer view).
 * Callers must therefore be verified admins — see the role check in the page.
 */
async function getEmailHistory(sentPage: number, inboxPage: number) {
  const supabase = createAdminClient();
  const sentFrom = (sentPage - 1) * PAGE_SIZE;
  const sentTo = sentFrom + PAGE_SIZE - 1;

  let migrationMissing = false;

  // ── Sent: still a flat log, paginated in SQL exactly as before ──
  const sentQuery = (columns: string) =>
    supabase
      .from("sent_emails")
      .select(columns, { count: "exact", head: false })
      .order("sent_at", { ascending: false })
      .range(sentFrom, sentTo);

  let sentRes = await sentQuery(SENT_COLUMNS_FULL);
  if (isMissingColumn(sentRes.error)) {
    migrationMissing = true;
    sentRes = await sentQuery(SENT_COLUMNS_LEGACY);
  }

  // ── Inbox: one row per conversation ──
  // Conversations come from email_thread_summary so the list can be paginated
  // in SQL; the messages for just the visible threads are fetched after.
  const threadsFrom = (inboxPage - 1) * PAGE_SIZE;
  const threadsTo = threadsFrom + PAGE_SIZE - 1;

  let threadsRes = await supabase
    .from("email_thread_summary")
    .select("thread_id, last_at, first_at, message_count, unread_count", { count: "exact", head: false })
    .order("last_at", { ascending: false })
    .range(threadsFrom, threadsTo);

  let threads = threadsRes.data ?? [];
  let threadTotal = threadsRes.count ?? 0;

  if (threadsRes.error) {
    // No view (migration 038 not applied, or the view was dropped) — fall back
    // to the flat inbox so the panel still works and reports the gap.
    migrationMissing = true;
    const flat = await supabase
      .from("received_emails")
      .select(INBOX_COLUMNS_LEGACY, { count: "exact", head: false })
      .order("received_at", { ascending: false })
      .range(threadsFrom, threadsTo);
    const flatRows = flat.data ?? [];
    return {
      sent: sentRes.data ?? [],
      received: flatRows,
      threads: [],
      messages: [],
      addresses: [],
      sentTotal: sentRes.count ?? 0,
      receivedTotal: flat.count ?? 0,
      unreadCount: 0,
      migrationMissing: true,
      error: sentRes.error?.message || null,
      sentPage,
      inboxPage,
      pageSize: PAGE_SIZE,
    };
  }

  // Messages belonging to the conversations on this page.
  const threadIds = threads.map((t: any) => t.thread_id).filter(Boolean);
  let messages: any[] = [];

  if (threadIds.length > 0) {
    const inboxMessages = await supabase
      .from("received_emails")
      .select(INBOX_COLUMNS_FULL)
      .in("thread_id", threadIds)
      .order("received_at", { ascending: true });

    if (isMissingColumn(inboxMessages.error)) {
      migrationMissing = true;
    } else {
      const sentMessages = await supabase
        .from("sent_emails")
        .select(SENT_COLUMNS_FULL)
        .in("thread_id", threadIds)
        .order("sent_at", { ascending: true });

      messages = [
        ...(inboxMessages.data ?? []).map((m: any) => ({ ...m, direction: "in", at: m.received_at })),
        ...(sentMessages.data ?? []).map((m: any) => ({ ...m, direction: "out", at: m.sent_at })),
      ].sort((a: any, b: any) => new Date(a.at).getTime() - new Date(b.at).getTime());
    }
  }

  // Which addresses actually receive mail. Derived from the data rather than a
  // hardcoded list, so an address added in the Resend dashboard shows up here
  // (and becomes replyable) with no code change.
  let addresses: string[] = [];
  const addrRes = await supabase
    .from("received_emails")
    .select("to_email")
    .order("received_at", { ascending: false })
    .limit(1000);

  if (!addrRes.error) {
    const seen = new Set<string>();
    for (const row of addrRes.data ?? []) {
      for (const part of String(row.to_email || "").split(",")) {
        const addr = part.trim().toLowerCase();
        if (addr && addr.includes("@")) seen.add(addr);
      }
    }
    addresses = Array.from(seen).sort();
  }

  // Unread badge — count of conversations with unread mail, not messages.
  let unreadCount = 0;
  if (!migrationMissing) {
    const unread = await supabase
      .from("email_thread_summary")
      .select("thread_id", { count: "exact", head: true })
      .gt("unread_count", 0);
    if (unread.error) migrationMissing = isMissingColumn(unread.error);
    unreadCount = unread.count ?? 0;
  }

  return {
    sent: sentRes.data ?? [],
    received: [],
    threads,
    messages,
    addresses,
    sentTotal: sentRes.count ?? 0,
    receivedTotal: threadTotal,
    unreadCount,
    migrationMissing,
    error: sentRes.error?.message || null,
    sentPage,
    inboxPage,
    pageSize: PAGE_SIZE,
  };
}

export default async function AdminEmailPage({ searchParams }: { searchParams: { sentPage?: string; inboxPage?: string } }) {
  const user = await getAdminUser();

  // Required: this page reads with the service-role client, which bypasses RLS
  // and would otherwise expose every conversation to any signed-in user.
  // getAdminUser() resolves a profile for every role, so check the role here.
  if (user.role !== "admin") redirect("/login");

  const sp = searchParams.sentPage ? parseInt(searchParams.sentPage, 10) : 1;
  const ip = searchParams.inboxPage ? parseInt(searchParams.inboxPage, 10) : 1;
  const history = await getEmailHistory(Math.max(1, sp), Math.max(1, ip));

  return (
    <>
      <Topbar title="Send Email" subtitle="Compose, sent history, and inbox" user={user} />
      <EmailComposer
        // key forces remount on page change — EmailComposer keeps lists in useState,
        // so without a remount it shows stale page-1 data after paginating
        key={`email-${history.sentPage}-${history.inboxPage}`}
        userId={user.id}
        sentEmails={history.sent}
        receivedEmails={history.received}
        threads={history.threads}
        threadMessages={history.messages}
        addresses={history.addresses}
        sentTotal={history.sentTotal}
        receivedTotal={history.receivedTotal}
        unreadCount={history.unreadCount}
        migrationMissing={history.migrationMissing}
        loadError={history.error}
        sentPage={history.sentPage}
        inboxPage={history.inboxPage}
        pageSize={history.pageSize}
      />
    </>
  );
}
