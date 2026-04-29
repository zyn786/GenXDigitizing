export type NotificationChannel = "EMAIL" | "WEB_CHAT";

export type NotificationAudience =
  | "CLIENT"
  | "ASSIGNED_USER"
  | "SHARED_OPERATIONS";

export type NotificationEventType =
  | "ORDER_RECEIVED"
  | "PROOF_READY"
  | "REVISION_REQUESTED"
  | "REVISION_PENDING_REMINDER"
  | "FILES_DELIVERED"
  | "INVOICE_SENT"
  | "PAYMENT_RECEIPT"
  | "PAYMENT_PENDING_REMINDER"
  | "INVOICE_OVERDUE"
  | "STATUS_DELAY_UPDATE"
  | "UNASSIGNED_ORDER_ALERT"
  | "STALLED_WORKFLOW_ALERT";

export type ReminderTimingRule = {
  eventType: NotificationEventType;
  offsetMinutes: number;
  audience: NotificationAudience;
  channels: NotificationChannel[];
  enabled: boolean;
};

export type NotificationLogRecord = {
  id: string;
  eventType: NotificationEventType;
  audience: NotificationAudience;
  channel: NotificationChannel;
  recipient: string;
  relatedOrderId?: string | null;
  relatedInvoiceId?: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
};
