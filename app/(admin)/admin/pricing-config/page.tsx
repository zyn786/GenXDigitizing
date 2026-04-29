import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PricingConfigEditor } from "@/components/admin/pricing-config-editor";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = { title: buildTitle("Pricing Config") };

const ALLOWED_ROLES = new Set(["SUPER_ADMIN", "MANAGER"]);

export default async function PricingConfigPage() {
  const session = await auth();
  if (!session?.user || !ALLOWED_ROLES.has(String(session.user.role))) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing Configuration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control stitch-plan pricing rates, bulk discounts, free-first-design rules, and special service pricing.
        </p>
      </div>
      <PricingConfigEditor />
    </div>
  );
}
