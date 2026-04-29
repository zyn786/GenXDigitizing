import { AdminOrderQueue } from "@/components/workflow/admin-order-queue";
import { getAdminOrders } from "@/lib/workflow/repository";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="grid gap-6">
      <section>
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Operations queue
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Order queue
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          Active orders across all stages — proof, revision, in-progress, and ready
          for delivery. Use each row to view details, open the linked invoice, or
          start a conversation with the client.
        </p>
      </section>

      <AdminOrderQueue orders={orders} />
    </div>
  );
}