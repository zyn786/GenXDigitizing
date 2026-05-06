import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, LayoutDashboard, Package } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientOrdersTable } from "@/components/workflow/client-orders-table";
import { getClientOrders } from "@/lib/workflow/repository";
import { QuickOrderModal } from "@/components/client/quick-order-modal";

export default async function ClientOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/orders");
  const orders = await getClientOrders(session.user.id);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <p className="section-eyebrow">My orders</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl lg:text-4xl">Your Orders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track progress, review proofs, download delivery files, and communicate with our team.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" shape="pill" size="sm">
            <Link href={"/client/dashboard" as Route}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <QuickOrderModal
            mode="order"
            userName={session.user.name ?? ""}
            userEmail={session.user.email ?? ""}
            triggerLabel="New Order"
          />
        </div>
      </section>

      {orders.length > 0 ? (
        <ClientOrdersTable orders={orders} />
      ) : (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No orders yet"
          description="Ready to get started? Place your first order and we'll digitize it within 24 hours."
          action={
            <div className="flex gap-3">
              <Button asChild variant="premium" shape="pill" size="sm">
                <Link href="/client/order">
                  Place Your First Order
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
}
