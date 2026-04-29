import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LeadSourceDashboard } from "@/components/admin/lead-source-dashboard";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Lead Sources") };

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lead Source Tracking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See where your clients come from — website, social media, referrals, campaigns, and more.
        </p>
      </div>
      <LeadSourceDashboard />
    </div>
  );
}
