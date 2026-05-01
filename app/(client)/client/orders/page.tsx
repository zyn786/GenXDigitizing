import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { auth } from "@/auth";
import { ClientOrdersTable } from "@/components/workflow/client-orders-table";
import { getClientOrders } from "@/lib/workflow/repository";
import { QuickOrderModal } from "@/components/client/quick-order-modal";

export default async function ClientOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/orders");
  const orders = await getClientOrders(session.user.id);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
            My orders
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Your orders
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Track order progress, review proofs, download delivery files, and
            communicate with our team — all from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <QuickOrderModal
            mode="order"
            userName={session.user.name ?? ""}
            userEmail={session.user.email ?? ""}
            triggerLabel="Order Now"
          />
          <Link
            href={"/client/dashboard" as Route}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border/80 bg-secondary/60 px-5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </section>

      <ClientOrdersTable orders={orders} />
    </div>
  );
}