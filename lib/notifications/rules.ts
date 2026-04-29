import type {
  NotificationAudience,
  NotificationChannel,
  NotificationEventType,
  ReminderTimingRule,
} from "@/lib/notifications/types";

const clientChannels: NotificationChannel[] = ["EMAIL", "WEB_CHAT"];
const internalChannels: NotificationChannel[] = ["EMAIL", "WEB_CHAT"];

export const defaultReminderRules: ReminderTimingRule[] = [
  {
    eventType: "PROOF_READY",
    offsetMinutes: 0,
    audience: "CLIENT",
    channels: clientChannels,
    enabled: true,
  },
  {
    eventType: "INVOICE_SENT",
    offsetMinutes: 0,
    audience: "CLIENT",
    channels: clientChannels,
    enabled: true,
  },
  {
    eventType: "INVOICE_OVERDUE",
    offsetMinutes: 60,
    audience: "CLIENT",
    channels: clientChannels,
    enabled: true,
  },
  {
    eventType: "PAYMENT_PENDING_REMINDER",
    offsetMinutes: 120,
    audience: "CLIENT",
    channels: clientChannels,
    enabled: true,
  },
  {
    eventType: "UNASSIGNED_ORDER_ALERT",
    offsetMinutes: 15,
    audience: "ASSIGNED_USER",
    channels: internalChannels,
    enabled: true,
  },
  {
    eventType: "STALLED_WORKFLOW_ALERT",
    offsetMinutes: 90,
    audience: "SHARED_OPERATIONS",
    channels: internalChannels,
    enabled: true,
  },
];

export function getRulesForEvent(eventType: NotificationEventType) {
  return defaultReminderRules.filter((rule) => rule.eventType === eventType);
}

export function getAudiencesForEvent(eventType: NotificationEventType) {
  const audiences = new Set<NotificationAudience>();

  for (const rule of getRulesForEvent(eventType)) {
    if (rule.enabled) audiences.add(rule.audience);
  }

  return [...audiences];
}
