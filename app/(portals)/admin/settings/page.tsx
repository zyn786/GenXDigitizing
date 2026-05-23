// @ts-nocheck
import { createClient }    from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }           from "@/components/portals/Topbar";
import { AdminSettingsUI }  from "./SettingsUI";

export const dynamic = "force-dynamic";


export default async function AdminSettingsPage() {
  const user = await getAdminUser();

  return (
    <>
      <Topbar title="Settings" subtitle="Platform configuration" user={user} />
      <AdminSettingsUI user={user} />
    </>
  );
}
