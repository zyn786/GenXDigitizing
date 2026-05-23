// @ts-nocheck
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { FreeDesignsAdminClient } from "./FreeDesignsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminFreeDesignsPage() {
  const user = await getAdminUser();
  return (
    <>
      <Topbar title="Free Designs" subtitle="Manage free downloadable design samples" user={user} />
      <FreeDesignsAdminClient />
    </>
  );
}
