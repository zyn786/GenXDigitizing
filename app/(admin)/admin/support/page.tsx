import type { Metadata } from "next";
import type { Route } from "next";

import { ChatSupportShell } from "@/components/support/chat-support-shell";
import { getInitialThreadsForActor, requireAdminChatActor } from "@/lib/chat/server";
import { buildTitle } from "@/lib/site";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: buildTitle("Admin Support") };

export default async function AdminSupportPage() {
  const actor = await requireAdminChatActor();
  const threads = await getInitialThreadsForActor(actor);

  return (
    <main className="px-4 pb-6 pt-6 md:px-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href={"/admin/dashboard" as Route}>Admin</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Support</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <ChatSupportShell mode="admin" actorId={actor.id} actorName={actor.name ?? actor.email ?? "Staff"} initialThreads={threads} initialSelectedThread={null} />
    </main>
  );
}
