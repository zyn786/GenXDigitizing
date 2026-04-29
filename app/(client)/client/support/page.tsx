import type { Metadata } from "next";

import { ChatSupportShell } from "@/components/support/chat-support-shell";
import {
  getInitialThreadsForActor,
  requireClientChatActor,
} from "@/lib/chat/server";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Client Support"),
};

export default async function ClientSupportPage() {
  const actor = await requireClientChatActor();
  const threads = await getInitialThreadsForActor(actor);

  return (
    <main className="px-4 pb-6 pt-6 md:px-8">
      <ChatSupportShell
        mode="client"
        actorId={actor.id}
        actorName={actor.name ?? actor.email ?? "Client"}
        initialThreads={threads}
        initialSelectedThread={null}
      />
    </main>
  );
}
