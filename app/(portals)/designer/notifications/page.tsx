// @ts-nocheck
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { NotificationsPage } from "@/components/portals/NotificationsPage";

export const dynamic = "force-dynamic";

export default async function DesignerNotificationsPage() {
  const user = await getAdminUser();
  return (
    <>
      <Topbar title="Notifications" subtitle="Task alerts and updates" user={user} />
      <NotificationsPage userName={user.full_name ?? undefined} userAvatar={user.avatar_url} userRole={user.role} />
    </>
  );
}
