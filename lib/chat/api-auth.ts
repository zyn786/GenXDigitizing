import type { Session } from "next-auth";
import { Role } from "@prisma/client";

import type { CurrentChatActor } from "@/lib/chat/types";

export function requireChatActor(session: Session | null): CurrentChatActor {
  if (!session?.user?.id || !session.user.role) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    role: session.user.role as Role,
    email: session.user.email,
    name: session.user.name,
  };
}