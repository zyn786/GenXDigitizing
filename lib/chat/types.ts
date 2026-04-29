import type { Role } from "@prisma/client";

export const CHAT_UPLOAD_LIMIT_BYTES = 200 * 1024 * 1024;

export const ALLOWED_CHAT_FILE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "psd",
  "ai",
  "eps",
  "svg",
  "dst",
  "emb",
  "exp",
  "vp3",
  "pes",
  "jef",
  "zip",
  "rar",
  "7z",
  "mp4",
  "mov",
  "avi",
  "mkv",
] as const;

export type CurrentChatActor = {
  id: string;
  role: Role;
  email?: string | null;
  name?: string | null;
};

export type ChatParticipantSummary = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  role: Role;
  participantRole: "CLIENT" | "STAFF" | "SYSTEM";
  unreadCount: number;
  lastReadAt: string | null;
  lastSeenAt: string | null;
};

export type ChatAttachmentRecord = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  objectKey: string;
  createdAt: string;
};

export type UploadedChatAttachmentInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bucket: string;
  objectKey: string;
};

export type PendingChatAttachment = UploadedChatAttachmentInput & {
  tempId: string;
};

export type ChatMessageRecord = {
  id: string;
  senderUserId: string | null;
  senderName: string;
  senderRole: Role | null;
  visibility: "CLIENT_VISIBLE" | "INTERNAL_ONLY";
  type: "TEXT" | "FILE" | "SYSTEM";
  body: string | null;
  replyToMessageId: string | null;
  editedAt: string | null;
  editCount: number;
  clientEditableUntil: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: ChatAttachmentRecord[];
  receipt: {
    deliveredAt: string | null;
    seenAt: string | null;
  } | null;
};

export type ChatThreadListItem = {
  id: string;
  type: "SUPPORT" | "ORDER" | "INVOICE";
  subject: string;
  queueKey: string | null;
  clientUserId: string | null;
  orderId: string | null;
  invoiceId: string | null;
  assignedToUserId: string | null;
  isOpen: boolean;
  unreadCount: number;
  lastMessageAt: string | null;
  updatedAt: string;
  clientName: string | null;
  assignedToName: string | null;
  lastMessagePreview: string | null;
};

export type ChatThreadDetail = {
  thread: ChatThreadListItem;
  participants: ChatParticipantSummary[];
  messages: ChatMessageRecord[];
};

export type ChatThreadRecord = ChatThreadDetail;

export type ChatPresenceRecord = {
  userId: string;
  name: string;
  status: "ONLINE" | "AWAY" | "OFFLINE";
  isTyping: boolean;
  typingThreadId: string | null;
  lastHeartbeatAt: string | null;
  updatedAt: string;
};

export type ChatThreadPresencePayload = {
  threadId: string;
  presences: ChatPresenceRecord[];
  typingNames: string[];
};

export type ListThreadsFilters = {
  type?: "SUPPORT" | "ORDER" | "INVOICE";
  search?: string;
  limit?: number;
};

export type CreateThreadInput = {
  type: "SUPPORT" | "ORDER" | "INVOICE";
  subject?: string;
  queueKey?: string;
  clientUserId?: string;
  orderId?: string;
  invoiceId?: string;
};

export type PostMessageInput = {
  body?: string;
  visibility?: "CLIENT_VISIBLE" | "INTERNAL_ONLY";
  replyToMessageId?: string;
  attachments?: UploadedChatAttachmentInput[];
};

export type EditMessageInput = {
  body: string;
};

export type PresenceUpdateInput = {
  status?: "ONLINE" | "AWAY" | "OFFLINE";
  isTyping?: boolean;
  threadId?: string | null;
};

export type AttachmentUploadIntent = {
  uploadUrl: string;
  attachment: UploadedChatAttachmentInput;
};