import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ClientOrdersTable } from "@/components/workflow/client-orders-table";
import { getClientOrders } from "@/lib/workflow/repository";

export default async function ClientOrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/client/orders");
  const orders = await getClientOrders(session.user.id);

  return (
    <div className="grid gap-6">
      <section>
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
      </section>

      <ClientOrdersTable orders={orders} />
    </div>
  );
}