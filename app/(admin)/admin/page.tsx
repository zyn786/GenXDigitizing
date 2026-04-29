import { redirect } from "next/navigation";
import type { Route } from "next";
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role === "DESIGNER") redirect("/admin/designer" as Route);
  if (role === "CHAT_SUPPORT") redirect("/admin/support" as Route);
  if (role === "MARKETING") redirect("/admin/marketing" as Route);

  redirect("/admin/dashboard" as Route);
}