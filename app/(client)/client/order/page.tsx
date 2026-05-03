import { redirect } from "next/navigation";

export default function ClientOrderPage() {
  redirect("/client/orders/new");
}
