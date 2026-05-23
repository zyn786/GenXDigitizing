// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }              from "@/lib/supabase/get-user";
import { getCRMContacts, getCRMStats } from "@/lib/supabase/crm-queries";
import { Topbar }                    from "@/components/portals/Topbar";
import { CRMContactsUI }             from "./ContactsUI";

export default async function CRMContactsPage() {
  const [user, contacts, stats] = await Promise.all([
    getAdminUser(),
    getCRMContacts(),
    getCRMStats(),
  ]);

  return (
    <>
      <Topbar
        title="Contacts"
        subtitle={`${stats.activeClients} active · ${stats.totalClients} total · $${(stats.totalRevenue/1000).toFixed(1)}k revenue`}
        user={user}
      />
      <CRMContactsUI contacts={contacts} userId={user.id} />
    </>
  );
}
