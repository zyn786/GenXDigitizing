import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

type Actor = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
};

type LogParams = {
  actor?: Actor | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logActivity({
  actor,
  action,
  entityType,
  entityId,
  metadata,
}: LogParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorUserId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        actorRole: (actor?.role ?? null) as Role | null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata as never,
      },
    });
  } catch {
    // Non-fatal — never let logging break the main operation
  }
}
