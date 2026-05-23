// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { getCRMLeads }  from "@/lib/supabase/crm-queries";
import { Topbar }       from "@/components/portals/Topbar";
import { CRMLeadsUI }   from "./LeadsUI";

export default async function CRMLeadsPage() {
  const user = await getAdminUser();
  let leads: any[] = [];
  let fetchError = "";

  try {
    leads = await getCRMLeads();
  } catch (e: any) {
    fetchError = e.message || "Failed to load leads";
    console.error("[CRMLeadsPage]", fetchError);
  }

  return (
    <>
      <Topbar title="Sales Pipeline" subtitle={fetchError ? "Error loading leads" : `${leads.length} leads across all stages`} user={user} />
      <CRMLeadsUI leads={leads} userId={user.id} fetchError={fetchError} />
    </>
  );
}
