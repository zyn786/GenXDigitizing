import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { buildTitle } from "@/lib/site";
import { AdminProofReviewToggle } from "@/components/admin/admin-proof-review-toggle";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Settings") };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/admin/dashboard");

  const [clientCount, staffCount, orderCount, proofReviewConfig] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: { not: "CLIENT" } } }),
    prisma.workflowOrder.count({ where: { status: { notIn: ["DRAFT"] } } }),
    prisma.pricingConfig.findUnique({ where: { key: "admin_proof_review_enabled" }, select: { value: true } }),
  ]);

  const adminProofReviewEnabled = proofReviewConfig?.value !== "false";

  return (
    <div className="grid gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section>
        <p className="section-eyebrow">Super admin only</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          System-wide configuration, roles, and platform settings. Only accessible to Super Admins.
        </p>
      </section>

      {/* Platform overview */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Platform overview</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="divide-y divide-border/60">
            {[
              { label: "Total clients", value: clientCount },
              { label: "Total staff", value: staffCount },
              { label: "Total orders", value: orderCount },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-5 py-4 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between px-5 py-4 text-sm">
              <div>
                <p className="font-medium">Manual payment accounts</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Bank accounts, Cash App, PayPal, Venmo, and other payment methods</p>
              </div>
              <Button asChild variant="default" shape="pill" size="sm"><Link href="/admin/payment-accounts">Manage</Link></Button>
            </div>
            <div className="flex items-center justify-between px-5 py-4 text-sm">
              <div>
                <p className="font-medium">Payment proof review</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Review and approve client payment screenshots</p>
              </div>
              <Button asChild variant="outline" shape="pill" size="sm"><Link href="/admin/payment-proofs">Review</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow settings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Workflow settings</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70">
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="font-medium">Admin review before proof sent</p>
              <p className="mt-1 max-w-lg text-xs text-muted-foreground">
                When ON, designer proofs must be reviewed by an Admin before clients receive them. When OFF, designers can send proofs directly.
              </p>
            </div>
            <AdminProofReviewToggle enabled={adminProofReviewEnabled} />
          </div>
        </div>
      </section>

      {/* Placeholders */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Pricing configuration</h2>
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">Editable service pricing, tier rates, and add-on fees coming soon.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Role permissions</h2>
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">Fine-grained role permission editor coming soon.</p>
        </div>
      </section>
    </div>
  );
}
