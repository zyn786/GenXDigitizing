// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/portals/Topbar";
import { EmailComposer } from "./EmailComposer";

const PAGE_SIZE = 15;

async function getEmailHistory(sentPage: number, inboxPage: number) {
  const supabase = createClient();
  const sentFrom = (sentPage - 1) * PAGE_SIZE;
  const sentTo = sentFrom + PAGE_SIZE - 1;
  const inboxFrom = (inboxPage - 1) * PAGE_SIZE;
  const inboxTo = inboxFrom + PAGE_SIZE - 1;

  const [
    { data: sent, count: sentCount },
    { data: received, count: receivedCount },
  ] = await Promise.all([
    supabase
      .from("sent_emails")
      .select("id, to_email, from_email, subject, body, sent_at, resend_id", { count: "exact", head: false })
      .order("sent_at", { ascending: false })
      .range(sentFrom, sentTo),
    supabase
      .from("received_emails")
      .select("id, from_email, to_email, cc_emails, subject, body_html, body_text, received_at, attachments_meta", { count: "exact", head: false })
      .order("received_at", { ascending: false })
      .range(inboxFrom, inboxTo),
  ]);

  return {
    sent: sent ?? [],
    received: received ?? [],
    sentTotal: sentCount ?? 0,
    receivedTotal: receivedCount ?? 0,
    sentPage,
    inboxPage,
    pageSize: PAGE_SIZE,
  };
}

export default async function AdminEmailPage({ searchParams }: { searchParams: { sentPage?: string; inboxPage?: string } }) {
  const user = await getAdminUser();
  const sp = searchParams.sentPage ? parseInt(searchParams.sentPage, 10) : 1;
  const ip = searchParams.inboxPage ? parseInt(searchParams.inboxPage, 10) : 1;
  const history = await getEmailHistory(Math.max(1, sp), Math.max(1, ip));

  return (
    <>
      <Topbar title="Send Email" subtitle="Compose, sent history, and inbox" user={user} />
      <EmailComposer
        userId={user.id}
        sentEmails={history.sent}
        receivedEmails={history.received}
        sentTotal={history.sentTotal}
        receivedTotal={history.receivedTotal}
        sentPage={history.sentPage}
        inboxPage={history.inboxPage}
        pageSize={history.pageSize}
      />
    </>
  );
}
