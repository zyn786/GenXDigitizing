import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { buildTitle } from "@/lib/site";
import { AdminProofReviewToggle } from "@/components/admin/admin-proof-review-toggle";

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
    prisma.pricingConfig.findUnique({
      where: { key: "admin_proof_review_enabled" },
      select: { value: true },
    }),
  ]);

  const adminProofReviewEnabled = proofReviewConfig?.value !== "false";

  const sections = [
    {
      title: "Platform overview",
      items: [
        { label: "Total clients", value: clientCount },
        { label: "Total staff", value: staffCount },
        { label: "Total orders", value: orderCount },
      ],
    },
  ];

  return (
    <div className="grid gap-8">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Super admin only
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          System-wide configuration, roles, pricing, and platform settings. Only accessible
          to Super Admins.
        </p>
      </section>

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-4 text-lg font-semibold">{section.title}</h2>
          <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
            <div className="divide-y divide-border/80">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-5 py-4 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Payment methods */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Payment methods</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="divide-y divide-border/80">
            <div className="flex items-center justify-between px-5 py-4 text-sm">
              <div>
                <div className="font-medium">Manual payment accounts</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Bank accounts, Cash App, PayPal, Venmo, and other payment methods shown to clients
                </div>
              </div>
              <a
                href="/admin/payment-accounts"
                className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground transition hover:opacity-90"
              >
                Manage →
              </a>
            </div>
            <div className="flex items-center justify-between px-5 py-4 text-sm">
              <div>
                <div className="font-medium">Payment proof review</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Review and approve client payment screenshots to unlock completed files
                </div>
              </div>
              <a
                href="/admin/payment-proofs"
                className="inline-flex h-9 items-center rounded-full border border-border/80 bg-card/70 px-4 text-xs font-medium transition hover:bg-card"
              >
                Review →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow settings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Workflow settings</h2>
        <div className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/70">
          <div className="divide-y divide-border/80">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
              <div className="flex-1">
                <div className="font-medium">Admin review before proof sent</div>
                <div className="mt-1 max-w-lg text-xs text-muted-foreground">
                  When ON, designer proofs must be reviewed and approved by an Admin or Manager before
                  the client receives them. When OFF, designers can send proofs directly to clients.
                </div>
              </div>
              <AdminProofReviewToggle enabled={adminProofReviewEnabled} />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing config placeholder */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Pricing configuration</h2>
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Editable service pricing, tier rates, and add-on fees coming soon.
          </p>
        </div>
      </section>

      {/* Roles placeholder */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Role permissions</h2>
        <div className="rounded-[2rem] border border-dashed border-border/60 bg-card/40 px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Fine-grained role permission editor coming soon.
          </p>
        </div>
      </section>
    </div>
  );
}
