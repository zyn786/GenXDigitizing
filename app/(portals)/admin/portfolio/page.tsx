// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { PortfolioAdminClient } from "./PortfolioAdminClient";

export default async function AdminPortfolioPage() {
  const user = await getAdminUser();

  return (
    <>
      <Topbar
        title="Portfolio"
        subtitle="Manage showcase projects, images, and categories"
        user={user}
      />
      <PortfolioAdminClient />
    </>
  );
}
