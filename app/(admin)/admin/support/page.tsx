import type { Metadata } from "next";

import { ChatSupportShell } from "@/components/support/chat-support-shell";
import {
  getInitialThreadsForActor,
  requireAdminChatActor,
} from "@/lib/chat/server";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Admin Support"),
};

export default async function AdminSupportPage() {
  const actor = await requireAdminChatActor();
  const threads = await getInitialThreadsForActor(actor);

  return (
    <main className="px-4 pb-6 pt-6 md:px-8">
      <ChatSupportShell
        mode="admin"
        actorId={actor.id}
        actorName={actor.name ?? actor.email ?? "Staff"}
        initialThreads={threads}
        initialSelectedThread={null}
      />
    </main>
  );
}
