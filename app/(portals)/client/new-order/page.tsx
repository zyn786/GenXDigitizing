// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }    from "@/lib/supabase/get-user";
import { getServiceTiers } from "@/lib/supabase/client-queries";
import { Topbar }          from "@/components/portals/Topbar";
import { NewOrderWizard }  from "./NewOrderWizard";
import { redirect }        from "next/navigation";

export default async function NewOrderPage() {
  const user = await getAdminUser();
  if (!user.client_id) { redirect("/client?error=no_profile"); }

  const tiers = await getServiceTiers();

  return (
    <>
      <Topbar title="New Order" subtitle="Starts from $5 · All turnaround speeds free" user={user} />
      <NewOrderWizard tiers={tiers} clientId={user.client_id} userId={user.id} />
    </>
  );
}
