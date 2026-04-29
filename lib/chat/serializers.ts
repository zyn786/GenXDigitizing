import type {
  ChatAttachmentRecord,
  ChatMessageRecord,
  ChatParticipantSummary,
  ChatThreadDetail,
  ChatThreadListItem,
  CurrentChatActor,
} from "@/lib/chat/types";

type UserLite = {
  id: string;
  name: string | null;
  email: string | null;
  role: import("@prisma/client").Role;
};

type ParticipantLite = {
  id: string;
  userId: string;
  role: import("@prisma/client").ChatParticipantRole;
  unreadCount: number;
  lastReadAt: Date | null;
  lastSeenAt: Date | null;
  user: UserLite;
};

type ReceiptLite = {
  deliveredAt: Date | null;
  seenAt: Date | null;
  participant: {
    userId: string;
  };
};

type AttachmentLite = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  objectKey: string;
  createdAt: Date;
};

type MessageLite = {
  id: string;
  senderUserId: string | null;
  visibility: import("@prisma/client").ChatMessageVisibility;
  type: import("@prisma/client").ChatMessageType;
  body: string | null;
  replyToMessageId: string | null;
  editedAt: Date | null;
  editCount: number;
  clientEditableUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sender: UserLite | null;
  attachments: AttachmentLite[];
  receipts?: ReceiptLite[];
};

type ThreadLite = {
  id: string;
  type: import("@prisma/client").ChatThreadType;
  subject: string;
  queueKey: string | null;
  clientUserId: string | null;
  orderId: string | null;
  invoiceId: string | null;
  assignedToUserId: string | null;
  isOpen: boolean;
  lastMessageAt: Date | null;
  updatedAt: Date;
  clientUser: UserLite | null;
  assignedTo: UserLite | null;
  participants: ParticipantLite[];
  messages: MessageLite[];
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function mapAttachment(item: AttachmentLite): ChatAttachmentRecord {
  return {
    id: item.id,
    fileName: item.fileName,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    bucket: item.bucket,
    objectKey: item.objectKey,
    createdAt: item.createdAt.toISOString(),
  };
}

export function mapParticipant(item: ParticipantLite): ChatParticipantSummary {
  return {
    id: item.id,
    userId: item.userId,
    name: item.user.name ?? "Unknown user",
    email: item.user.email,
    role: item.user.role,
    participantRole: item.role,
    unreadCount: item.unreadCount,
    lastReadAt: toIso(item.lastReadAt),
    lastSeenAt: toIso(item.lastSeenAt),
  };
}

export function mapMessage(
  actor: CurrentChatActor,
  item: MessageLite
): ChatMessageRecord {
  const actorReceipt =
    item.receipts?.find((receipt) => receipt.participant.userId === actor.id) ?? null;

  return {
    id: item.id,
    senderUserId: item.senderUserId,
    senderName: item.sender?.name ?? item.sender?.email ?? "System",
    senderRole: item.sender?.role ?? null,
    visibility: item.visibility,
    type: item.type,
    body: item.body,
    replyToMessageId: item.replyToMessageId,
    editedAt: toIso(item.editedAt),
    editCount: item.editCount,
    clientEditableUntil: toIso(item.clientEditableUntil),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    attachments: item.attachments.map(mapAttachment),
    receipt: actorReceipt
      ? {
          deliveredAt: toIso(actorReceipt.deliveredAt),
          seenAt: toIso(actorReceipt.seenAt),
        }
      : null,
  };
}

export function mapThreadListItem(
  actor: CurrentChatActor,
  item: ThreadLite
): ChatThreadListItem {
  const participant = item.participants.find((entry) => entry.userId === actor.id) ?? null;
  const lastMessage = item.messages[0] ?? null;

  return {
    id: item.id,
    type: item.type,
    subject: item.subject,
    queueKey: item.queueKey,
    clientUserId: item.clientUserId,
    orderId: item.orderId,
    invoiceId: item.invoiceId,
    assignedToUserId: item.assignedToUserId,
    isOpen: item.isOpen,
    unreadCount: participant?.unreadCount ?? 0,
    lastMessageAt: toIso(item.lastMessageAt),
    updatedAt: item.updatedAt.toISOString(),
    clientName: item.clientUser?.name ?? item.clientUser?.email ?? null,
    assignedToName: item.assignedTo?.name ?? item.assignedTo?.email ?? null,
    lastMessagePreview: lastMessage?.body ?? null,
  };
}

export function mapThreadDetail(
  actor: CurrentChatActor,
  item: ThreadLite
): ChatThreadDetail {
  return {
    thread: mapThreadListItem(actor, item),
    participants: item.participants.map(mapParticipant),
    messages: item.messages.map((message) => mapMessage(actor, message)),
  };
}