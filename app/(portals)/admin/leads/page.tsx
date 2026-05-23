// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { getCRMLeads }  from "@/lib/supabase/crm-queries";
import { Topbar }       from "@/components/portals/Topbar";
import { CRMLeadsUI }   from "@/app/(portals)/crm/leads/LeadsUI";

export default async function AdminLeadsPage() {
  const user = await getAdminUser();
  let leads: any[] = [];
  let fetchError = "";

  try {
    leads = await getCRMLeads();
  } catch (e: any) {
    fetchError = e.message || "Failed to load leads";
  }

  return (
    <>
      <Topbar title="Leads" subtitle={fetchError ? "Error loading leads" : `${leads.length} leads in pipeline`} user={user} />
      <CRMLeadsUI leads={leads} userId={user.id} fetchError={fetchError} />
    </>
  );
}
