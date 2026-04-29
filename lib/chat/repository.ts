import {
  ChatMessageVisibility,
  ChatParticipantRole,
  ChatThreadType,
  PresenceStatus,
  Prisma,
  Role,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  mapMessage,
  mapThreadDetail,
  mapThreadListItem,
} from "@/lib/chat/serializers";
import type {
  ChatMessageRecord,
  ChatThreadDetail,
  ChatThreadListItem,
  ChatThreadPresencePayload,
  CreateThreadInput,
  CurrentChatActor,
  EditMessageInput,
  ListThreadsFilters,
  PostMessageInput,
  PresenceUpdateInput,
} from "@/lib/chat/types";

const FULL_INTERNAL_ACCESS = new Set<Role>([
  Role.SUPER_ADMIN,
  Role.MANAGER,
  Role.CHAT_SUPPORT,
]);

function isInternal(role: Role) {
  return role !== Role.CLIENT;
}

function buildThreadAccessWhere(actor: CurrentChatActor): Prisma.ChatThreadWhereInput {
  if (actor.role === Role.CLIENT) {
    return {
      clientUserId: actor.id,
    };
  }

  if (FULL_INTERNAL_ACCESS.has(actor.role)) {
    return {};
  }

  if (actor.role === Role.DESIGNER) {
    return {
      OR: [
        { assignedToUserId: actor.id },
        { participants: { some: { userId: actor.id } } },
      ],
    };
  }

  if (actor.role === Role.MARKETING) {
    return {
      participants: { some: { userId: actor.id } },
    };
  }

  return {
    id: "__forbidden__",
  };
}

function buildThreadListInclude(actor: CurrentChatActor) {
  return {
    clientUser: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    assignedTo: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    participants: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    },
    messages: {
      ...(actor.role === Role.CLIENT
        ? { where: { visibility: ChatMessageVisibility.CLIENT_VISIBLE } }
        : {}),
      orderBy: {
        createdAt: "desc" as const,
      },
      take: 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        attachments: true,
      },
    },
  };
}

function buildThreadDetailInclude(actor: CurrentChatActor) {
  return {
    clientUser: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    assignedTo: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    participants: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    },
    messages: {
      ...(actor.role === Role.CLIENT
        ? { where: { visibility: ChatMessageVisibility.CLIENT_VISIBLE } }
        : {}),
      orderBy: {
        createdAt: "asc" as const,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        attachments: true,
        receipts: {
          include: {
            participant: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    },
  };
}

async function ensureParticipant(threadId: string, actor: CurrentChatActor) {
  return prisma.chatParticipant.upsert({
    where: {
      threadId_userId: {
        threadId,
        userId: actor.id,
      },
    },
    update: {},
    create: {
      threadId,
      userId: actor.id,
      role: actor.role === Role.CLIENT ? ChatParticipantRole.CLIENT : ChatParticipantRole.STAFF,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

async function getAccessibleThreadOrNull(
  actor: CurrentChatActor,
  threadId: string
) {
  return prisma.chatThread.findFirst({
    where: {
      AND: [{ id: threadId }, buildThreadAccessWhere(actor)],
    },
    include: buildThreadDetailInclude(actor),
  });
}

async function getAccessibleMessageOrNull(
  actor: CurrentChatActor,
  messageId: string
) {
  return prisma.chatMessage.findFirst({
    where: {
      id: messageId,
      thread: buildThreadAccessWhere(actor),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      attachments: true,
      receipts: {
        include: {
          participant: {
            select: {
              userId: true,
            },
          },
        },
      },
      thread: true,
    },
  });
}

function sanitizeSearch(search?: string) {
  const value = search?.trim();
  return value && value.length > 0 ? value : undefined;
}

export async function listThreadsForActor(
  actor: CurrentChatActor,
  filters: ListThreadsFilters = {}
): Promise<ChatThreadListItem[]> {
  const search = sanitizeSearch(filters.search);

  const threads = await prisma.chatThread.findMany({
    where: {
      AND: [
        buildThreadAccessWhere(actor),
        filters.type ? { type: filters.type } : {},
        search
          ? {
              OR: [
                { subject: { contains: search, mode: "insensitive" } },
                { queueKey: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: buildThreadListInclude(actor),
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: filters.limit ?? 50,
  });

  return threads.map((thread) => mapThreadListItem(actor, thread));
}

export async function getThreadDetailForActor(
  actor: CurrentChatActor,
  threadId: string
): Promise<ChatThreadDetail | null> {
  const thread = await getAccessibleThreadOrNull(actor, threadId);

  if (!thread) {
    return null;
  }

  if (isInternal(actor.role)) {
    await ensureParticipant(threadId, actor);
  }

  return mapThreadDetail(actor, thread);
}

async function assertActorCanOpenOrderThread(
  actor: CurrentChatActor,
  orderId: string
) {
  const order = await prisma.workflowOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      title: true,
      clientUserId: true,
      assignedToUserId: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (actor.role === Role.CLIENT && order.clientUserId !== actor.id) {
    throw new Error("You do not have access to this order.");
  }

  if (actor.role === Role.DESIGNER && order.assignedToUserId !== actor.id) {
    throw new Error("You do not have access to this order.");
  }

  if (actor.role === Role.MARKETING) {
    throw new Error("Marketing cannot create order-linked threads by default.");
  }

  return order;
}

async function assertActorCanOpenInvoiceThread(
  actor: CurrentChatActor,
  invoiceId: string
) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      invoiceNumber: true,
      createdByUserId: true,
      order: {
        select: {
          id: true,
          title: true,
          clientUserId: true,
          assignedToUserId: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (actor.role === Role.CLIENT && invoice.order.clientUserId !== actor.id) {
    throw new Error("You do not have access to this invoice.");
  }

  if (actor.role === Role.DESIGNER && invoice.order.assignedToUserId !== actor.id) {
    throw new Error("You do not have access to this invoice.");
  }

  if (actor.role === Role.MARKETING) {
    throw new Error("Marketing cannot create invoice-linked threads by default.");
  }

  return invoice;
}

export async function createOrGetThreadForActor(
  actor: CurrentChatActor,
  input: CreateThreadInput
): Promise<ChatThreadDetail> {
  if (input.type === ChatThreadType.ORDER) {
    if (!input.orderId) {
      throw new Error("orderId is required for order threads.");
    }

    const existing = await prisma.chatThread.findUnique({
      where: { orderId: input.orderId },
      include: buildThreadDetailInclude(actor),
    });

    if (existing) {
      const accessible = await getAccessibleThreadOrNull(actor, existing.id);
      if (!accessible) {
        throw new Error("You do not have access to this order thread.");
      }
      return mapThreadDetail(actor, accessible);
    }

    const order = await assertActorCanOpenOrderThread(actor, input.orderId);

    const created = await prisma.$transaction(async (tx) => {
      const thread = await tx.chatThread.create({
        data: {
          type: ChatThreadType.ORDER,
          subject: input.subject?.trim() || order.title,
          queueKey: input.queueKey?.trim() || "ops-orders",
          clientUserId: order.clientUserId,
          orderId: order.id,
          createdByUserId: actor.id,
          assignedToUserId: order.assignedToUserId ?? null,
          isOpen: true,
        },
      });

      const participantUserIds = new Set<string>([
        order.clientUserId,
        actor.id,
        ...(order.assignedToUserId ? [order.assignedToUserId] : []),
      ]);

      for (const userId of participantUserIds) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (!user) continue;

        await tx.chatParticipant.create({
          data: {
            threadId: thread.id,
            userId,
            role:
              user.role === Role.CLIENT
                ? ChatParticipantRole.CLIENT
                : ChatParticipantRole.STAFF,
          },
        });
      }

      return tx.chatThread.findUniqueOrThrow({
        where: { id: thread.id },
        include: buildThreadDetailInclude(actor),
      });
    });

    return mapThreadDetail(actor, created);
  }

  if (input.type === ChatThreadType.INVOICE) {
    if (!input.invoiceId) {
      throw new Error("invoiceId is required for invoice threads.");
    }

    const existing = await prisma.chatThread.findUnique({
      where: { invoiceId: input.invoiceId },
      include: buildThreadDetailInclude(actor),
    });

    if (existing) {
      const accessible = await getAccessibleThreadOrNull(actor, existing.id);
      if (!accessible) {
        throw new Error("You do not have access to this invoice thread.");
      }
      return mapThreadDetail(actor, accessible);
    }

    const invoice = await assertActorCanOpenInvoiceThread(actor, input.invoiceId);

    const created = await prisma.$transaction(async (tx) => {
      const thread = await tx.chatThread.create({
        data: {
          type: ChatThreadType.INVOICE,
          subject:
            input.subject?.trim() ||
            `Invoice discussion for ${invoice.invoiceNumber}`,
          queueKey: input.queueKey?.trim() || "ops-billing",
          clientUserId: invoice.order.clientUserId,
          invoiceId: invoice.id,
          createdByUserId: actor.id,
          assignedToUserId:
            invoice.order.assignedToUserId ?? invoice.createdByUserId ?? null,
          isOpen: true,
        },
      });

      const participantUserIds = new Set<string>([
        invoice.order.clientUserId,
        actor.id,
        ...(invoice.order.assignedToUserId
          ? [invoice.order.assignedToUserId]
          : []),
        ...(invoice.createdByUserId ? [invoice.createdByUserId] : []),
      ]);

      for (const userId of participantUserIds) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });

        if (!user) continue;

        await tx.chatParticipant.create({
          data: {
            threadId: thread.id,
            userId,
            role:
              user.role === Role.CLIENT
                ? ChatParticipantRole.CLIENT
                : ChatParticipantRole.STAFF,
          },
        });
      }

      return tx.chatThread.findUniqueOrThrow({
        where: { id: thread.id },
        include: buildThreadDetailInclude(actor),
      });
    });

    return mapThreadDetail(actor, created);
  }

  const clientUserId =
    actor.role === Role.CLIENT ? actor.id : input.clientUserId ?? null;

  if (!clientUserId) {
    throw new Error("clientUserId is required when staff creates a support thread.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const thread = await tx.chatThread.create({
      data: {
        type: ChatThreadType.SUPPORT,
        subject: input.subject?.trim() || "General support",
        queueKey: input.queueKey?.trim() || "ops-support",
        clientUserId,
        createdByUserId: actor.id,
        assignedToUserId: actor.role === Role.CLIENT ? null : actor.id,
        isOpen: true,
      },
    });

    const participantUserIds = new Set<string>([clientUserId, actor.id]);

    for (const userId of participantUserIds) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) continue;

      await tx.chatParticipant.create({
        data: {
          threadId: thread.id,
          userId,
          role:
            user.role === Role.CLIENT
              ? ChatParticipantRole.CLIENT
              : ChatParticipantRole.STAFF,
        },
      });
    }

    return tx.chatThread.findUniqueOrThrow({
      where: { id: thread.id },
      include: buildThreadDetailInclude(actor),
    });
  });

  return mapThreadDetail(actor, created);
}

export async function postMessageForActor(
  actor: CurrentChatActor,
  threadId: string,
  input: PostMessageInput
): Promise<ChatMessageRecord> {
  const thread = await getAccessibleThreadOrNull(actor, threadId);

  if (!thread) {
    throw new Error("Thread not found or access denied.");
  }

  const now = new Date();
  const visibility =
    actor.role === Role.CLIENT
      ? ChatMessageVisibility.CLIENT_VISIBLE
      : input.visibility ?? ChatMessageVisibility.CLIENT_VISIBLE;

  let messageId = "";

  await prisma.$transaction(
    async (tx) => {
      await tx.chatParticipant.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: actor.id,
          },
        },
        update: {
          lastReadAt: now,
          lastSeenAt: now,
          unreadCount: 0,
        },
        create: {
          threadId,
          userId: actor.id,
          role:
            actor.role === Role.CLIENT
              ? ChatParticipantRole.CLIENT
              : ChatParticipantRole.STAFF,
          lastReadAt: now,
          lastSeenAt: now,
          unreadCount: 0,
        },
      });

      const message = await tx.chatMessage.create({
        data: {
          threadId,
          senderUserId: actor.id,
          visibility,
          body: input.body?.trim() ?? null,
          replyToMessageId: input.replyToMessageId ?? null,
          clientEditableUntil:
            actor.role === Role.CLIENT
              ? new Date(now.getTime() + 60 * 1000)
              : null,
        },
        select: {
          id: true,
        },
      });

      messageId = message.id;

      if (input.attachments?.length) {
        await tx.chatAttachment.createMany({
          data: input.attachments.map((attachment) => ({
            messageId: message.id,
            bucket: attachment.bucket,
            objectKey: attachment.objectKey,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          })),
        });
      }

      const participants = await tx.chatParticipant.findMany({
        where: { threadId },
        select: {
          id: true,
          userId: true,
        },
      });

      if (participants.length > 0) {
        await tx.chatMessageReceipt.createMany({
          data: participants.map((participant) => ({
            messageId: message.id,
            participantId: participant.id,
            deliveredAt: now,
            seenAt: participant.userId === actor.id ? now : null,
          })),
        });

        const recipientParticipantIds = participants
          .filter((participant) => participant.userId !== actor.id)
          .map((participant) => participant.id);

        if (recipientParticipantIds.length > 0) {
          await tx.chatParticipant.updateMany({
            where: {
              id: {
                in: recipientParticipantIds,
              },
            },
            data: {
              unreadCount: {
                increment: 1,
              },
            },
          });
        }
      }

      await tx.chatThread.update({
        where: { id: threadId },
        data: {
          lastMessageAt: now,
        },
      });

      await tx.userPresence.upsert({
        where: { userId: actor.id },
        update: {
          status: PresenceStatus.ONLINE,
          isTyping: false,
          typingThreadId: null,
          lastHeartbeatAt: now,
        },
        create: {
          userId: actor.id,
          status: PresenceStatus.ONLINE,
          isTyping: false,
          typingThreadId: null,
          lastHeartbeatAt: now,
        },
      });
    },
    {
      maxWait: 15_000,
      timeout: 15_000,
    }
  );

  const result = await prisma.chatMessage.findUniqueOrThrow({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      attachments: true,
      receipts: {
        include: {
          participant: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  return mapMessage(actor, result);
}

export async function editMessageForActor(
  actor: CurrentChatActor,
  messageId: string,
  input: EditMessageInput
): Promise<ChatMessageRecord> {
  const message = await getAccessibleMessageOrNull(actor, messageId);

  if (!message) {
    throw new Error("Message not found or access denied.");
  }

  if (message.senderUserId !== actor.id) {
    throw new Error("You can only edit your own messages.");
  }

  if (actor.role === Role.CLIENT) {
    const deadline = message.clientEditableUntil;
    if (!deadline || deadline.getTime() < Date.now()) {
      throw new Error("Client edit window has expired.");
    }
  }

  const updated = await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      body: input.body.trim(),
      editedAt: new Date(),
      editCount: {
        increment: 1,
      },
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      attachments: true,
      receipts: {
        include: {
          participant: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  return mapMessage(actor, updated);
}

export async function markThreadReadForActor(
  actor: CurrentChatActor,
  threadId: string
): Promise<{ ok: true }> {
  const thread = await getAccessibleThreadOrNull(actor, threadId);

  if (!thread) {
    throw new Error("Thread not found or access denied.");
  }

  const now = new Date();

  await prisma.$transaction(
    async (tx) => {
      const participant = await tx.chatParticipant.upsert({
        where: {
          threadId_userId: {
            threadId,
            userId: actor.id,
          },
        },
        update: {
          unreadCount: 0,
          lastReadAt: now,
          lastSeenAt: now,
        },
        create: {
          threadId,
          userId: actor.id,
          role:
            actor.role === Role.CLIENT
              ? ChatParticipantRole.CLIENT
              : ChatParticipantRole.STAFF,
          unreadCount: 0,
          lastReadAt: now,
          lastSeenAt: now,
        },
        select: {
          id: true,
        },
      });

      await tx.chatMessageReceipt.updateMany({
        where: {
          participantId: participant.id,
          seenAt: null,
          message: {
            threadId,
          },
        },
        data: {
          seenAt: now,
        },
      });
    },
    {
      maxWait: 15_000,
      timeout: 15_000,
    }
  );

  return { ok: true };
}

const PRESENCE_STALE_MS = 45_000;

export async function updatePresenceForActor(
  actor: CurrentChatActor,
  input: PresenceUpdateInput
): Promise<{ ok: true }> {
  if (input.threadId) {
    const thread = await getAccessibleThreadOrNull(actor, input.threadId);
    if (!thread) {
      throw new Error("Thread not found or access denied.");
    }
  }

  const now = new Date();

  await prisma.userPresence.upsert({
    where: { userId: actor.id },
    update: {
      status: input.status ?? PresenceStatus.ONLINE,
      isTyping: input.isTyping ?? false,
      typingThreadId: input.isTyping ? input.threadId ?? null : null,
      lastHeartbeatAt: now,
    },
    create: {
      userId: actor.id,
      status: input.status ?? PresenceStatus.ONLINE,
      isTyping: input.isTyping ?? false,
      typingThreadId: input.isTyping ? input.threadId ?? null : null,
      lastHeartbeatAt: now,
    },
  });

  return { ok: true };
}

export async function getThreadPresenceForActor(
  actor: CurrentChatActor,
  threadId: string
): Promise<ChatThreadPresencePayload> {
  const thread = await prisma.chatThread.findFirst({
    where: {
      AND: [{ id: threadId }, buildThreadAccessWhere(actor)],
    },
    select: {
      id: true,
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!thread) {
    throw new Error("Thread not found or access denied.");
  }

  const userIds = thread.participants.map((participant) => participant.userId);

  const presenceRows = await prisma.userPresence.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const presenceMap = new Map(presenceRows.map((row) => [row.userId, row]));
  const now = Date.now();

  const presences = userIds.map((userId) => {
    const participant = thread.participants.find((item) => item.userId === userId)!;
    const row = presenceMap.get(userId);

    if (!row) {
      return {
        userId,
        name: participant.user.name ?? participant.user.email ?? "Unknown user",
        status: "OFFLINE" as const,
        isTyping: false,
        typingThreadId: null,
        lastHeartbeatAt: null,
        updatedAt: new Date(0).toISOString(),
      };
    }

    const stale =
      now - new Date(row.lastHeartbeatAt ?? row.updatedAt).getTime() >
      PRESENCE_STALE_MS;

    return {
      userId,
      name: row.user.name ?? row.user.email ?? "Unknown user",
      status: stale ? "OFFLINE" : row.status,
      isTyping:
        !stale &&
        row.isTyping &&
        row.typingThreadId === threadId &&
        row.userId !== actor.id,
      typingThreadId: stale ? null : row.typingThreadId,
      lastHeartbeatAt: row.lastHeartbeatAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return {
    threadId,
    presences,
    typingNames: presences.filter((item) => item.isTyping).map((item) => item.name),
  };
}

