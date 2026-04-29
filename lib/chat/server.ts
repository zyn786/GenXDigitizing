import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  getThreadDetailForActor,
  listThreadsForActor,
} from "@/lib/chat/repository";
import type {
  ChatThreadDetail,
  ChatThreadListItem,
  CurrentChatActor,
} from "@/lib/chat/types";

const ADMIN_ROLES = new Set<Role>([
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.DESIGNER,
  Role.CHAT_SUPPORT,
  Role.MARKETING,
]);

export async function requireCurrentChatActor(): Promise<CurrentChatActor> {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    role: session.user.role as Role,
    email: session.user.email,
    name: session.user.name,
  };
}

export async function requireClientChatActor() {
  const actor = await requireCurrentChatActor();

  if (actor.role !== Role.CLIENT) {
    redirect("/admin/support");
  }

  return actor;
}

export async function requireAdminChatActor() {
  const actor = await requireCurrentChatActor();

  if (!ADMIN_ROLES.has(actor.role)) {
    redirect("/client/support");
  }

  return actor;
}

export async function getInitialThreadsForActor(
  actor: CurrentChatActor
): Promise<ChatThreadListItem[]> {
  return listThreadsForActor(actor, { limit: 50 });
}

export async function getInitialThreadDetailOr404(
  actor: CurrentChatActor,
  threadId: string
): Promise<ChatThreadDetail> {
  const thread = await getThreadDetailForActor(actor, threadId);

  if (!thread) {
    notFound();
  }

  return thread;
}