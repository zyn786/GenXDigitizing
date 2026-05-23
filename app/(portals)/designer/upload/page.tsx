// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }           from "@/lib/supabase/get-user";
import { getDesignerActiveTasks } from "@/lib/supabase/client-queries";
import { Topbar }                 from "@/components/portals/Topbar";
import { DesignerUploadUI }       from "./DesignerUploadUI";
import { RealtimeRefresher }      from "@/components/RealtimeRefresher";
import { redirect }               from "next/navigation";

export default async function DesignerUploadPage() {
  const user = await getAdminUser();
  if (!user.designer_id) { redirect("/designer"); }

  const tasks = await getDesignerActiveTasks(user.designer_id);
  const inProgress = tasks.filter(t => ["assigned","in_progress","revision"].includes(t.status));

  return (
    <>
      <Topbar title="Upload Files" subtitle="Submit completed digitizing files for QA" user={user} />
      <DesignerUploadUI tasks={inProgress} userId={user.id} designerId={user.designer_id} designerName={user.full_name ?? "Designer"} designerAvatar={user.avatar_url} />
      <RealtimeRefresher configs={[
        { table: "orders", filter: `designer_id=eq.${user.designer_id}`, events: ["INSERT", "UPDATE"] },
      ]} />
    </>
  );
}
