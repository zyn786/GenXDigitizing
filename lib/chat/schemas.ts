import {
  ChatMessageVisibility,
  ChatThreadType,
  PresenceStatus,
} from "@prisma/client";
import { z } from "zod";

const MAX_CHAT_ATTACHMENT_BYTES = 200 * 1024 * 1024;

export const uploadedAttachmentSchema = z.object({
  bucket: z.string().trim().min(1).max(120),
  objectKey: z.string().trim().min(1).max(500),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_CHAT_ATTACHMENT_BYTES),
});

export const listThreadsQuerySchema = z.object({
  type: z.nativeEnum(ChatThreadType).optional(),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createThreadInputSchema = z.object({
  type: z.nativeEnum(ChatThreadType),
  subject: z.string().trim().min(1).max(200).optional(),
  queueKey: z.string().trim().min(1).max(100).optional(),
  clientUserId: z.string().trim().min(1).optional(),
  orderId: z.string().trim().min(1).optional(),
  invoiceId: z.string().trim().min(1).optional(),
});

export const postMessageInputSchema = z
  .object({
    body: z.string().trim().max(5000).optional(),
    visibility: z.nativeEnum(ChatMessageVisibility).optional(),
    replyToMessageId: z.string().trim().min(1).optional(),
    attachments: z.array(uploadedAttachmentSchema).max(10).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.body && data.body.trim().length > 0) ||
      Boolean(data.attachments && data.attachments.length > 0),
    {
      message: "Message body or at least one attachment is required.",
      path: ["body"],
    }
  );

export const editMessageInputSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const presenceUpdateSchema = z.object({
  status: z.nativeEnum(PresenceStatus).optional(),
  isTyping: z.boolean().optional(),
  threadId: z.string().trim().min(1).nullable().optional(),
});

export const attachmentUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_CHAT_ATTACHMENT_BYTES),
});