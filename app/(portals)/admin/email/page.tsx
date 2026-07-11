// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/portals/Topbar";
import { EmailComposer } from "./EmailComposer";

async function getEmailHistory() {
  const supabase = createClient();
  const [{ data: sent }, { data: received }] = await Promise.all([
    supabase
      .from("sent_emails")
      .select("id, to_email, from_email, subject, body, sent_at, resend_id")
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("received_emails")
      .select("id, from_email, to_email, cc_emails, subject, body_html, body_text, received_at, attachments_meta")
      .order("received_at", { ascending: false })
      .limit(50),
  ]);
  return { sent: sent ?? [], received: received ?? [] };
}

export default async function AdminEmailPage() {
  const user = await getAdminUser();
  const history = await getEmailHistory();

  return (
    <>
      <Topbar title="Send Email" subtitle="Compose, sent history, and inbox" user={user} />
      <EmailComposer userId={user.id} sentEmails={history.sent} receivedEmails={history.received} />
    </>
  );
}
