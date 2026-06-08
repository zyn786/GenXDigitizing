// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import AdminBlogClient from "./AdminBlogClient";

export default async function AdminBlogPage() {
  const user = await getAdminUser();

  return (
    <>
      <Topbar
        title="Blog"
        subtitle="Manage blog posts — create, edit, publish content"
        user={user}
      />
      <AdminBlogClient />
    </>
  );
}
