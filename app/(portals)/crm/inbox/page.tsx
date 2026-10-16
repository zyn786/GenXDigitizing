// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { InboxClient } from "./InboxClient";

/**
 * The unified channel inbox: WhatsApp, Instagram, Facebook and email threads in
 * one list.
 *
 * Lives under /crm rather than /admin on purpose. PortalLayout admits a role
 * when `role === requiredRole || role === "admin"`, so /admin/* is admin-only
 * while /crm/* admits both crm and admin — which is exactly the audience
 * migration 057 grants on the conversations tables (`my_role() in ('admin',
 * 'crm')`). Putting it under /admin would lock out the people the database
 * expects to be reading it.
 */
export default async function InboxPage() {
  const user = await getAdminUser();

  return (
    <>
      <Topbar title="Inbox" subtitle="Customer messages from every channel" user={user} />
      <InboxClient currentUserId={user.id} />
    </>
  );
}
