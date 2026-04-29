import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { buildTitle } from "@/lib/site";
import { CreateStaffForm } from "@/components/staff/create-staff-form";

export const metadata: Metadata = { title: buildTitle("Add Staff") };

export default async function NewStaffPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "MANAGER") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="grid gap-6">
      <section>
        <Link
          href={"/admin/staff" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Staff
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Add staff member</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
          All staff accounts use a company email address in the format{" "}
          <code className="rounded bg-secondary/80 px-1 py-0.5 text-xs">name@genxdigitizing.com</code>.
          Designer accounts use the designer&apos;s name as the prefix.
        </p>
      </section>

      <div className="max-w-xl">
        <CreateStaffForm currentRole={role as string} />
      </div>
    </div>
  );
}
