import type { Metadata } from "next";

import { ChatSupportShell } from "@/components/support/chat-support-shell";
import {
  getInitialThreadDetailOr404,
  getInitialThreadsForActor,
  requireAdminChatActor,
} from "@/lib/chat/server";
import { buildTitle } from "@/lib/site";

type Props = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { threadId } = await params;

  return {
    title: buildTitle(`Admin Support ${threadId}`),
  };
}

export default async function AdminSupportThreadPage({ params }: Props) {
  const actor = await requireAdminChatActor();
  const { threadId } = await params;

  const [threads, selectedThread] = await Promise.all([
    getInitialThreadsForActor(actor),
    getInitialThreadDetailOr404(actor, threadId),
  ]);

  return (
    <main className="px-4 pb-6 pt-6 md:px-8">
      <ChatSupportShell
        mode="admin"
        actorId={actor.id}
        actorName={actor.name ?? actor.email ?? "Staff"}
        initialThreads={threads}
        initialSelectedThread={selectedThread}
      />
    </main>
  );
}
