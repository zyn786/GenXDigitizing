import "dotenv/config";
import {
  BillingAuditEntityType,
  ChatMessageType,
  ChatMessageVisibility,
  ChatParticipantRole,
  ChatThreadType,
  DiscountSource,
  InvoiceStatus,
  NotificationAudience,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
  PaymentMethod,
  PresenceStatus,
  Prisma,
  PrismaClient,
  Role,
  WorkflowOrderStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

type SeedUser = {
  email: string;
  name: string;
  role: Role;
  companyName?: string;
  department?: string;
};

const seedUsers: SeedUser[] = [
  {
    email: "owner@genxdigitizing.com",
    name: "Super Admin",
    role: Role.SUPER_ADMIN,
    department: "Executive",
  },
  {
    email: "manager@genxdigitizing.com",
    name: "Operations Manager",
    role: Role.MANAGER,
    department: "Operations",
  },
  {
    email: "designer@genxdigitizing.com",
    name: "Lead Designer",
    role: Role.DESIGNER,
    department: "Design",
  },
  {
    email: "support@genxdigitizing.com",
    name: "Chat Support",
    role: Role.CHAT_SUPPORT,
    department: "Support",
  },
  {
    email: "marketing@genxdigitizing.com",
    name: "Marketing Manager",
    role: Role.MARKETING,
    department: "Marketing",
  },
  {
    email: "client@genxdigitizing.com",
    name: "Demo Client",
    role: Role.CLIENT,
    companyName: "Demo Client Co.",
  },
];

function must<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}

async function upsertUsers(passwordHash: string) {
  for (const entry of seedUsers) {
    await prisma.user.upsert({
      where: { email: entry.email },
      update: {
        name: entry.name,
        role: entry.role,
        passwordHash,
        isActive: true,
        onboardingComplete: entry.role !== Role.CLIENT,
        auditTotpEnabled: entry.role === Role.SUPER_ADMIN ? false : undefined,
        clientProfile:
          entry.role === Role.CLIENT
            ? {
                upsert: {
                  update: {
                    companyName: entry.companyName ?? null,
                  },
                  create: {
                    companyName: entry.companyName ?? null,
                  },
                },
              }
            : undefined,
        staffProfile:
          entry.role !== Role.CLIENT
            ? {
                upsert: {
                  update: {
                    displayName: entry.name,
                    department: entry.department ?? entry.role,
                  },
                  create: {
                    displayName: entry.name,
                    department: entry.department ?? entry.role,
                  },
                },
              }
            : undefined,
      },
      create: {
        name: entry.name,
        email: entry.email,
        role: entry.role,
        passwordHash,
        isActive: true,
        onboardingComplete: entry.role !== Role.CLIENT,
        auditTotpEnabled: false,
        ...(entry.role === Role.CLIENT
          ? {
              clientProfile: {
                create: {
                  companyName: entry.companyName ?? null,
                },
              },
            }
          : {
              staffProfile: {
                create: {
                  displayName: entry.name,
                  department: entry.department ?? entry.role,
                },
              },
            }),
      },
    });
  }
}

async function clearDomainData() {
  await prisma.notificationLog.deleteMany({});
  await prisma.notificationOverride.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.notificationRule.deleteMany({});
  await prisma.userPresence.deleteMany({});

  await prisma.chatMessageReceipt.deleteMany({});
  await prisma.chatAttachment.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatParticipant.deleteMany({});
  await prisma.chatThread.deleteMany({});

  await prisma.billingAuditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceDiscount.deleteMany({});
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.workflowOrder.deleteMany({});
}

async function seedWorkflowAndBilling() {
  const owner = must(
    await prisma.user.findUnique({
      where: { email: "owner@genxdigitizing.com" },
    }),
    "Missing super admin user"
  );

  const manager = must(
    await prisma.user.findUnique({
      where: { email: "manager@genxdigitizing.com" },
    }),
    "Missing manager user"
  );

  const designer = must(
    await prisma.user.findUnique({
      where: { email: "designer@genxdigitizing.com" },
    }),
    "Missing designer user"
  );

  const support = must(
    await prisma.user.findUnique({
      where: { email: "support@genxdigitizing.com" },
    }),
    "Missing support user"
  );

  const client = must(
    await prisma.user.findUnique({
      where: { email: "client@genxdigitizing.com" },
    }),
    "Missing client user"
  );

  const order1 = await prisma.workflowOrder.create({
    data: {
      id: "ord_cap_front_001",
      orderNumber: "ORD-2401",
      clientUserId: client.id,
      assignedToUserId: designer.id,
      title: "Cap front logo clean-up",
      serviceType: "EMBROIDERY_DIGITIZING",
      nicheSlug: "cap-fronts",
      status: WorkflowOrderStatus.PROOF_READY,
      proofStage: "Proof ready for client review",
      dueAt: new Date("2026-04-30T18:00:00.000Z"),
      revisionCount: 1,
      progressPercent: 72,
      notes:
        "Client requested stronger readability on the left arc and cleaner satin edges on the cap front version.",
    },
  });

  const order2 = await prisma.workflowOrder.create({
    data: {
      id: "ord_vector_002",
      orderNumber: "ORD-2402",
      clientUserId: client.id,
      assignedToUserId: manager.id,
      title: "Restaurant logo vector rebuild",
      serviceType: "VECTOR_ART",
      nicheSlug: "restaurant-branding",
      status: WorkflowOrderStatus.DELIVERED,
      proofStage: "Delivered package available",
      dueAt: new Date("2026-04-22T18:00:00.000Z"),
      deliveredAt: new Date("2026-04-21T15:30:00.000Z"),
      revisionCount: 0,
      progressPercent: 100,
      notes:
        "Vector package was delivered with AI, SVG, and PDF outputs for print-ready production.",
    },
  });

  const order3 = await prisma.workflowOrder.create({
    data: {
      id: "ord_patch_003",
      orderNumber: "ORD-2403",
      clientUserId: client.id,
      assignedToUserId: designer.id,
      title: "PVC morale patch setup",
      serviceType: "CUSTOM_PATCHES",
      nicheSlug: "morale-patches",
      status: WorkflowOrderStatus.IN_PROGRESS,
      proofStage: "Internal production review",
      dueAt: new Date("2026-05-02T18:00:00.000Z"),
      revisionCount: 0,
      progressPercent: 44,
      notes:
        "Patch sizing and border treatment are in review before proof release.",
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      id: "inv_cap_front_001",
      invoiceNumber: "INV-2401",
      orderId: order1.id,
      createdByUserId: manager.id,
      clientEmail: client.email ?? "client@genxdigitizing.com",
      backupEmail: "records@genxdigitizing.com",
      clientName: client.name ?? "Demo Client",
      currency: "USD",
      dueDate: new Date("2026-05-03T00:00:00.000Z"),
      status: InvoiceStatus.PARTIALLY_PAID,
      subtotalAmount: "180.00",
      taxLabel: "Sales Tax",
      taxPercent: "8.25",
      taxAmount: "13.37",
      discountAmount: "18.00",
      totalAmount: "175.37",
      paidAmount: "100.00",
      balanceDue: "75.37",
      sentAt: new Date("2026-04-25T14:00:00.000Z"),
      notes:
        "Rush turnaround retained. Referral and promo discounts were approved before send.",
    },
  });

  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        label: "Embroidery digitizing - cap front",
        description: "Primary production-ready digitizing service.",
        quantity: 1,
        unitPrice: "120.00",
        lineTotal: "120.00",
        position: 1,
      },
      {
        invoiceId: invoice1.id,
        label: "Rush handling",
        description: "Priority queue placement and faster proof cycle.",
        quantity: 1,
        unitPrice: "60.00",
        lineTotal: "60.00",
        position: 2,
      },
    ],
  });

  await prisma.invoiceDiscount.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        label: "Referral bonus",
        source: DiscountSource.REFERRAL_PERCENT,
        percentage: "5.00",
        appliedAmount: "9.00",
        approvalNote: "Approved by operations manager.",
      },
      {
        invoiceId: invoice1.id,
        label: "Marketing promo",
        source: DiscountSource.MARKETING_PERCENT,
        percentage: "5.00",
        appliedAmount: "9.00",
        approvalNote: "Spring campaign incentive.",
      },
    ],
  });

  const payment1 = await prisma.payment.create({
    data: {
      id: "pay_cap_front_001",
      invoiceId: invoice1.id,
      recordedByUserId: manager.id,
      receiptNumber: "RCT-2401-01",
      amount: "100.00",
      currency: "USD",
      method: PaymentMethod.PAYPAL,
      reference: "PAYPAL-2401-CLIENT",
      clientEmail: client.email ?? "client@genxdigitizing.com",
      backupEmail: "records@genxdigitizing.com",
      receiptSentAt: new Date("2026-04-25T14:30:00.000Z"),
      receivedAt: new Date("2026-04-25T14:20:00.000Z"),
      note: "Initial partial payment received from client.",
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      id: "inv_vector_002",
      invoiceNumber: "INV-2402",
      orderId: order2.id,
      createdByUserId: manager.id,
      clientEmail: client.email ?? "client@genxdigitizing.com",
      backupEmail: "records@genxdigitizing.com",
      clientName: client.name ?? "Demo Client",
      currency: "EUR",
      dueDate: new Date("2026-04-22T00:00:00.000Z"),
      status: InvoiceStatus.PAID,
      subtotalAmount: "140.00",
      taxLabel: null,
      taxPercent: null,
      taxAmount: "0.00",
      discountAmount: "14.00",
      totalAmount: "126.00",
      paidAmount: "126.00",
      balanceDue: "0.00",
      sentAt: new Date("2026-04-18T12:00:00.000Z"),
      closedAt: new Date("2026-04-21T16:00:00.000Z"),
      notes: "Invoice fully paid and order closed.",
    },
  });

  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoiceId: invoice2.id,
        label: "Vector rebuild package",
        description: "AI, SVG, and print-ready PDF package.",
        quantity: 1,
        unitPrice: "140.00",
        lineTotal: "140.00",
        position: 1,
      },
    ],
  });

  await prisma.invoiceDiscount.create({
    data: {
      invoiceId: invoice2.id,
      label: "Approved marketing promo",
      source: DiscountSource.MARKETING_PERCENT,
      percentage: "10.00",
      appliedAmount: "14.00",
      approvalNote: "Applied before invoice send.",
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      id: "pay_vector_002",
      invoiceId: invoice2.id,
      recordedByUserId: manager.id,
      receiptNumber: "RCT-2402-01",
      amount: "126.00",
      currency: "EUR",
      method: PaymentMethod.BANK_TRANSFER,
      reference: "BANK-2402-SETTLED",
      clientEmail: client.email ?? "client@genxdigitizing.com",
      backupEmail: "records@genxdigitizing.com",
      receiptSentAt: new Date("2026-04-21T16:05:00.000Z"),
      receivedAt: new Date("2026-04-21T15:50:00.000Z"),
      note: "Final settled payment received in full.",
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      id: "inv_patch_003",
      invoiceNumber: "INV-2403",
      orderId: order3.id,
      createdByUserId: manager.id,
      clientEmail: client.email ?? "client@genxdigitizing.com",
      backupEmail: "records@genxdigitizing.com",
      clientName: client.name ?? "Demo Client",
      currency: "GBP",
      dueDate: new Date("2026-05-06T00:00:00.000Z"),
      status: InvoiceStatus.SENT,
      subtotalAmount: "210.00",
      taxLabel: "VAT",
      taxPercent: "5.00",
      taxAmount: "10.50",
      discountAmount: "10.50",
      totalAmount: "210.00",
      paidAmount: "0.00",
      balanceDue: "210.00",
      sentAt: new Date("2026-04-27T11:00:00.000Z"),
      notes: "Awaiting first payment.",
    },
  });

  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoiceId: invoice3.id,
        label: "PVC patch setup",
        description: "Patch production setup and proof prep.",
        quantity: 1,
        unitPrice: "160.00",
        lineTotal: "160.00",
        position: 1,
      },
      {
        invoiceId: invoice3.id,
        label: "Colorway preparation",
        description: "Variant preparation for final patch approval.",
        quantity: 1,
        unitPrice: "50.00",
        lineTotal: "50.00",
        position: 2,
      },
    ],
  });

  await prisma.invoiceDiscount.create({
    data: {
      invoiceId: invoice3.id,
      label: "Referral bonus",
      source: DiscountSource.REFERRAL_PERCENT,
      percentage: "5.00",
      appliedAmount: "10.50",
      approvalNote: "Pending billing cycle referral approval completed.",
    },
  });

  await prisma.billingAuditLog.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        paymentId: null,
        entityType: BillingAuditEntityType.INVOICE,
        entityId: invoice1.id,
        actorUserId: manager.id,
        actorEmail: manager.email ?? "manager@genxdigitizing.com",
        actorRole: Role.MANAGER,
        action: "INVOICE_CREATED",
        reason: "Initial billing draft created for proof-ready order.",
        beforeJson: Prisma.JsonNull,
        afterJson: {
          invoiceNumber: invoice1.invoiceNumber,
          status: invoice1.status,
          totalAmount: invoice1.totalAmount.toString(),
        },
        keyUnlockUsed: false,
      },
      {
        invoiceId: invoice1.id,
        paymentId: payment1.id,
        entityType: BillingAuditEntityType.PAYMENT,
        entityId: payment1.id,
        actorUserId: manager.id,
        actorEmail: manager.email ?? "manager@genxdigitizing.com",
        actorRole: Role.MANAGER,
        action: "PAYMENT_RECORDED",
        reason: "Partial payment manually recorded.",
        beforeJson: Prisma.JsonNull,
        afterJson: {
          receiptNumber: payment1.receiptNumber,
          amount: payment1.amount.toString(),
          currency: payment1.currency,
        },
        keyUnlockUsed: false,
      },
      {
        invoiceId: invoice2.id,
        paymentId: payment2.id,
        entityType: BillingAuditEntityType.PAYMENT,
        entityId: payment2.id,
        actorUserId: manager.id,
        actorEmail: manager.email ?? "manager@genxdigitizing.com",
        actorRole: Role.MANAGER,
        action: "PAYMENT_RECORDED",
        reason: "Invoice paid in full.",
        beforeJson: Prisma.JsonNull,
        afterJson: {
          receiptNumber: payment2.receiptNumber,
          amount: payment2.amount.toString(),
          currency: payment2.currency,
        },
        keyUnlockUsed: false,
      },
      {
        invoiceId: invoice3.id,
        paymentId: null,
        entityType: BillingAuditEntityType.DISCOUNT,
        entityId: invoice3.id,
        actorUserId: owner.id,
        actorEmail: owner.email ?? "owner@genxdigitizing.com",
        actorRole: Role.SUPER_ADMIN,
        action: "DISCOUNT_APPROVED",
        reason: "Referral percentage approved by SUPER_ADMIN.",
        beforeJson: Prisma.JsonNull,
        afterJson: {
          invoiceNumber: invoice3.invoiceNumber,
          source: DiscountSource.REFERRAL_PERCENT,
          percentage: "5.00",
        },
        keyUnlockUsed: true,
      },
    ],
  });

  return { owner, manager, designer, support, client, order1, order2, order3, invoice1, invoice2, invoice3 };
}

async function seedNotificationRules() {
  await prisma.notificationRule.createMany({
    data: [
      {
        eventType: NotificationEventType.ORDER_CREATED,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.ORDER_CREATED,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.IN_APP,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.PROOF_READY,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.PROOF_READY,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.IN_APP,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.INVOICE_SENT,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.PAYMENT_PENDING,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.IN_APP,
        isEnabled: true,
        isTransactional: false,
        delayMinutes: 180,
      },
      {
        eventType: NotificationEventType.INVOICE_OVERDUE,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
        isTransactional: false,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.ORDER_CREATED,
        audience: NotificationAudience.ASSIGNED_USER,
        channel: NotificationChannel.IN_APP,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.THREAD_ASSIGNED,
        audience: NotificationAudience.ASSIGNED_USER,
        channel: NotificationChannel.BROWSER,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.SUPPORT_MESSAGE_POSTED,
        audience: NotificationAudience.OPS_QUEUE,
        channel: NotificationChannel.IN_APP,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.SUPPORT_MESSAGE_POSTED,
        audience: NotificationAudience.OPS_QUEUE,
        channel: NotificationChannel.BROWSER,
        isEnabled: true,
        isTransactional: true,
        delayMinutes: 0,
      },
      {
        eventType: NotificationEventType.INVOICE_OVERDUE,
        audience: NotificationAudience.OPS_QUEUE,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
        isTransactional: false,
        delayMinutes: 0,
      },
    ],
  });
}

async function seedChatAndNotifications(context: {
  owner: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  manager: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  designer: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  support: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  client: Awaited<ReturnType<typeof prisma.user.findUnique>>;
  order1: Awaited<ReturnType<typeof prisma.workflowOrder.create>>;
  order2: Awaited<ReturnType<typeof prisma.workflowOrder.create>>;
  invoice1: Awaited<ReturnType<typeof prisma.invoice.create>>;
  invoice2: Awaited<ReturnType<typeof prisma.invoice.create>>;
}) {
  const owner = must(context.owner, "Missing owner context");
  const manager = must(context.manager, "Missing manager context");
  const designer = must(context.designer, "Missing designer context");
  const support = must(context.support, "Missing support context");
  const client = must(context.client, "Missing client context");

  await prisma.notificationPreference.createMany({
    data: [
      {
        userId: client.id,
        eventType: NotificationEventType.PAYMENT_PENDING,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
      },
      {
        userId: client.id,
        eventType: NotificationEventType.ORDER_DELAYED,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
      },
      {
        userId: manager.id,
        eventType: NotificationEventType.THREAD_ASSIGNED,
        channel: NotificationChannel.BROWSER,
        isEnabled: true,
      },
    ],
  });

  await prisma.userPresence.createMany({
    data: [
      {
        userId: manager.id,
        status: PresenceStatus.ONLINE,
        isTyping: false,
      },
      {
        userId: support.id,
        status: PresenceStatus.ONLINE,
        isTyping: true,
      },
      {
        userId: designer.id,
        status: PresenceStatus.AWAY,
        isTyping: false,
      },
      {
        userId: client.id,
        status: PresenceStatus.ONLINE,
        isTyping: false,
      },
    ],
  });

  const supportThread = await prisma.chatThread.create({
    data: {
      id: "thr_support_general_001",
      type: ChatThreadType.SUPPORT,
      subject: "General support",
      queueKey: "ops-support",
      clientUserId: client.id,
      createdByUserId: client.id,
      assignedToUserId: support.id,
      isOpen: true,
      lastMessageAt: new Date("2026-04-28T09:25:00.000Z"),
    },
  });

  const orderThread = await prisma.chatThread.create({
    data: {
      id: "thr_order_cap_front_001",
      type: ChatThreadType.ORDER,
      subject: "Cap front logo clean-up discussion",
      queueKey: "ops-orders",
      clientUserId: client.id,
      orderId: context.order1.id,
      createdByUserId: client.id,
      assignedToUserId: designer.id,
      isOpen: true,
      lastMessageAt: new Date("2026-04-28T10:15:00.000Z"),
    },
  });

  const invoiceThread = await prisma.chatThread.create({
    data: {
      id: "thr_invoice_cap_front_001",
      type: ChatThreadType.INVOICE,
      subject: "Invoice discussion for INV-2401",
      queueKey: "ops-billing",
      clientUserId: client.id,
      invoiceId: context.invoice1.id,
      createdByUserId: manager.id,
      assignedToUserId: manager.id,
      isOpen: true,
      lastMessageAt: new Date("2026-04-28T11:00:00.000Z"),
    },
  });

  const supportParticipants = await Promise.all([
    prisma.chatParticipant.create({
      data: {
        threadId: supportThread.id,
        userId: client.id,
        role: ChatParticipantRole.CLIENT,
        unreadCount: 0,
      },
    }),
    prisma.chatParticipant.create({
      data: {
        threadId: supportThread.id,
        userId: support.id,
        role: ChatParticipantRole.STAFF,
        unreadCount: 1,
      },
    }),
    prisma.chatParticipant.create({
      data: {
        threadId: supportThread.id,
        userId: manager.id,
        role: ChatParticipantRole.STAFF,
        unreadCount: 1,
      },
    }),
  ]);

  const orderParticipants = await Promise.all([
    prisma.chatParticipant.create({
      data: {
        threadId: orderThread.id,
        userId: client.id,
        role: ChatParticipantRole.CLIENT,
        unreadCount: 0,
      },
    }),
    prisma.chatParticipant.create({
      data: {
        threadId: orderThread.id,
        userId: designer.id,
        role: ChatParticipantRole.STAFF,
        unreadCount: 0,
      },
    }),
    prisma.chatParticipant.create({
      data: {
        threadId: orderThread.id,
        userId: manager.id,
        role: ChatParticipantRole.STAFF,
        unreadCount: 0,
      },
    }),
  ]);

  const invoiceParticipants = await Promise.all([
    prisma.chatParticipant.create({
      data: {
        threadId: invoiceThread.id,
        userId: client.id,
        role: ChatParticipantRole.CLIENT,
        unreadCount: 0,
      },
    }),
    prisma.chatParticipant.create({
      data: {
        threadId: invoiceThread.id,
        userId: manager.id,
        role: ChatParticipantRole.STAFF,
        unreadCount: 0,
      },
    }),
  ]);

  const supportMessage1 = await prisma.chatMessage.create({
    data: {
      id: "msg_support_001",
      threadId: supportThread.id,
      senderUserId: client.id,
      visibility: ChatMessageVisibility.CLIENT_VISIBLE,
      type: ChatMessageType.TEXT,
      body: "Hi team, I need help understanding where I can track proof updates.",
      clientEditableUntil: new Date("2026-04-28T09:21:00.000Z"),
      createdAt: new Date("2026-04-28T09:20:00.000Z"),
      updatedAt: new Date("2026-04-28T09:20:00.000Z"),
    },
  });

  const supportMessage2 = await prisma.chatMessage.create({
    data: {
      id: "msg_support_002",
      threadId: supportThread.id,
      senderUserId: support.id,
      visibility: ChatMessageVisibility.CLIENT_VISIBLE,
      type: ChatMessageType.TEXT,
      body: "You can track proofs from your order page. I’ve also linked your active thread to the latest order below.",
      createdAt: new Date("2026-04-28T09:25:00.000Z"),
      updatedAt: new Date("2026-04-28T09:25:00.000Z"),
    },
  });

  const orderMessage1 = await prisma.chatMessage.create({
    data: {
      id: "msg_order_001",
      threadId: orderThread.id,
      senderUserId: designer.id,
      visibility: ChatMessageVisibility.CLIENT_VISIBLE,
      type: ChatMessageType.TEXT,
      body: "Proof is ready for your cap front clean-up. Please review the text sharpness on the left arc.",
      createdAt: new Date("2026-04-28T10:05:00.000Z"),
      updatedAt: new Date("2026-04-28T10:05:00.000Z"),
    },
  });

  const orderMessage2 = await prisma.chatMessage.create({
    data: {
      id: "msg_order_002",
      threadId: orderThread.id,
      senderUserId: manager.id,
      visibility: ChatMessageVisibility.INTERNAL_ONLY,
      type: ChatMessageType.TEXT,
      body: "Internal note: client may ask for one more revision on the arc spacing.",
      createdAt: new Date("2026-04-28T10:10:00.000Z"),
      updatedAt: new Date("2026-04-28T10:10:00.000Z"),
    },
  });

  const invoiceMessage1 = await prisma.chatMessage.create({
    data: {
      id: "msg_invoice_001",
      threadId: invoiceThread.id,
      senderUserId: manager.id,
      visibility: ChatMessageVisibility.CLIENT_VISIBLE,
      type: ChatMessageType.TEXT,
      body: "Your invoice has been sent. A partial payment has already been recorded and the remaining balance is visible in the billing view.",
      createdAt: new Date("2026-04-28T11:00:00.000Z"),
      updatedAt: new Date("2026-04-28T11:00:00.000Z"),
    },
  });

  await prisma.chatAttachment.create({
    data: {
      messageId: orderMessage1.id,
      bucket: "chat-attachments",
      objectKey: "threads/thr_order_cap_front_001/proof-cap-front-v1.pdf",
      fileName: "proof-cap-front-v1.pdf",
      mimeType: "application/pdf",
      sizeBytes: 482100,
    },
  });

  const supportClientParticipant = supportParticipants.find((p) => p.userId === client.id)!;
  const supportStaffParticipant = supportParticipants.find((p) => p.userId === support.id)!;
  const orderClientParticipant = orderParticipants.find((p) => p.userId === client.id)!;
  const orderDesignerParticipant = orderParticipants.find((p) => p.userId === designer.id)!;
  const invoiceClientParticipant = invoiceParticipants.find((p) => p.userId === client.id)!;
  const invoiceManagerParticipant = invoiceParticipants.find((p) => p.userId === manager.id)!;

  await prisma.chatMessageReceipt.createMany({
    data: [
      {
        messageId: supportMessage1.id,
        participantId: supportStaffParticipant.id,
        deliveredAt: new Date("2026-04-28T09:20:05.000Z"),
        seenAt: new Date("2026-04-28T09:22:00.000Z"),
      },
      {
        messageId: supportMessage2.id,
        participantId: supportClientParticipant.id,
        deliveredAt: new Date("2026-04-28T09:25:05.000Z"),
        seenAt: new Date("2026-04-28T09:25:30.000Z"),
      },
      {
        messageId: orderMessage1.id,
        participantId: orderClientParticipant.id,
        deliveredAt: new Date("2026-04-28T10:05:10.000Z"),
        seenAt: new Date("2026-04-28T10:08:00.000Z"),
      },
      {
        messageId: orderMessage1.id,
        participantId: orderDesignerParticipant.id,
        deliveredAt: new Date("2026-04-28T10:05:02.000Z"),
        seenAt: new Date("2026-04-28T10:05:02.000Z"),
      },
      {
        messageId: invoiceMessage1.id,
        participantId: invoiceClientParticipant.id,
        deliveredAt: new Date("2026-04-28T11:00:05.000Z"),
        seenAt: null,
      },
      {
        messageId: invoiceMessage1.id,
        participantId: invoiceManagerParticipant.id,
        deliveredAt: new Date("2026-04-28T11:00:01.000Z"),
        seenAt: new Date("2026-04-28T11:00:01.000Z"),
      },
    ],
  });

  await prisma.notificationOverride.createMany({
    data: [
      {
        orderId: context.order1.id,
        eventType: NotificationEventType.PROOF_READY,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        isEnabled: true,
        delayMinutes: 15,
      },
      {
        threadId: supportThread.id,
        eventType: NotificationEventType.SUPPORT_MESSAGE_POSTED,
        audience: NotificationAudience.OPS_QUEUE,
        channel: NotificationChannel.BROWSER,
        isEnabled: true,
        delayMinutes: 0,
      },
    ],
  });

  await prisma.notificationLog.createMany({
    data: [
      {
        eventType: NotificationEventType.PROOF_READY,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        status: NotificationDeliveryStatus.DELIVERED,
        orderId: context.order1.id,
        recipientUserId: client.id,
        recipientAddress: client.email ?? "client@genxdigitizing.com",
        providerMessageId: "email-proof-ready-2401",
        sentAt: new Date("2026-04-28T10:05:30.000Z"),
        deliveredAt: new Date("2026-04-28T10:05:35.000Z"),
      },
      {
        eventType: NotificationEventType.INVOICE_SENT,
        audience: NotificationAudience.CLIENT,
        channel: NotificationChannel.EMAIL,
        status: NotificationDeliveryStatus.DELIVERED,
        invoiceId: context.invoice1.id,
        recipientUserId: client.id,
        recipientAddress: client.email ?? "client@genxdigitizing.com",
        providerMessageId: "email-invoice-2401",
        sentAt: new Date("2026-04-28T11:00:30.000Z"),
        deliveredAt: new Date("2026-04-28T11:00:35.000Z"),
      },
      {
        eventType: NotificationEventType.SUPPORT_MESSAGE_POSTED,
        audience: NotificationAudience.OPS_QUEUE,
        channel: NotificationChannel.BROWSER,
        status: NotificationDeliveryStatus.SEEN,
        threadId: supportThread.id,
        queueKey: "ops-support",
        recipientUserId: support.id,
        sentAt: new Date("2026-04-28T09:20:05.000Z"),
        deliveredAt: new Date("2026-04-28T09:20:06.000Z"),
        seenAt: new Date("2026-04-28T09:22:00.000Z"),
      },
      {
        eventType: NotificationEventType.THREAD_ASSIGNED,
        audience: NotificationAudience.ASSIGNED_USER,
        channel: NotificationChannel.IN_APP,
        status: NotificationDeliveryStatus.DELIVERED,
        threadId: supportThread.id,
        recipientUserId: support.id,
        sentAt: new Date("2026-04-28T09:19:50.000Z"),
        deliveredAt: new Date("2026-04-28T09:19:51.000Z"),
      },
    ],
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await upsertUsers(passwordHash);
  await clearDomainData();

  const billingContext = await seedWorkflowAndBilling();
  await seedNotificationRules();
  await seedChatAndNotifications(billingContext);

  console.log("Seed complete.");
  console.log("SUPER_ADMIN: owner@genxdigitizing.com / ChangeMe123!");
  console.log("MANAGER: manager@genxdigitizing.com / ChangeMe123!");
  console.log("CLIENT: client@genxdigitizing.com / ChangeMe123!");
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });