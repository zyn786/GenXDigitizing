// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }         from "@/lib/supabase/get-user";
import { getDesignerProfile }   from "@/lib/supabase/client-queries";
import { Topbar }               from "@/components/portals/Topbar";
import { DesignerSettingsUI }   from "./DesignerSettingsUI";

export default async function DesignerSettingsPage() {
  const user    = await getAdminUser();
  const profile = user.designer_id ? await getDesignerProfile(user.id) : null;

  return (
    <>
      <Topbar title="Settings" subtitle="Profile & preferences" user={user} />
      <DesignerSettingsUI user={user} profile={profile} />
    </>
  );
}
