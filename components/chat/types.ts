// Chat system types

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "document" | "vector" | "embroidery" | "archive";
  size: number;
  url: string;
  thumbnail?: string;
}

export interface VoiceNote {
  id: string;
  duration: number;
  url: string;
  played: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "client" | "admin" | "crm" | "designer";
  content: string;
  timestamp: Date;
  status: MessageStatus;
  orderId?: string;
  linkedOrder?: LinkedOrder;
  attachments?: Attachment[];
  voiceNote?: VoiceNote;
  replyTo?: { id: string; content: string; senderName: string };
  edited?: boolean;
}

export type OrderStatus =
  | "pending"
  | "assigned"
  | "in_progress"
  | "review"
  | "revision"
  | "approved"
  | "delivered"
  | "cancelled";

export interface LinkedOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  service: string;
  designName?: string;
  turnaround: string;
}

export type ConversationCategory = "order" | "revision" | "general" | "urgent";
export type ConversationPriority = "normal" | "high" | "urgent";

export interface Conversation {
  id: string;
  orderId?: string;
  linkedOrder?: LinkedOrder;
  clientName: string;
  clientEmail: string;
  clientAvatar?: string | null;
  companyName: string;
  recipientId: string;
  recipientRole: "client" | "admin" | "crm" | "designer";
  sectionLabel?: string;
  category: ConversationCategory;
  priority: ConversationPriority;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isTyping: boolean;
  messages: Message[];
  isPinned: boolean;
}

export interface QuickReply {
  id: string;
  label: string;
  content: string;
  category: string;
}

export interface SavedResponse {
  id: string;
  title: string;
  content: string;
}

export type ChatView = "sidebar" | "chat";
