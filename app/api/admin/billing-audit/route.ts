import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { verifyAuditToken } from "@/lib/admin/audit-token";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ ok: false }, { status: 403 });

  const url = new URL(request.url);
  const token = url.searchParams.get("t") ?? "";
  if (!verifyAuditToken(token, session.user.id!)) {
    return NextResponse.json({ ok: false, message: "Audit session expired. Please re-authenticate." }, { status: 401 });
  }

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const invoiceId = url.searchParams.get("invoiceId") ?? undefined;

  const where = {
    ...(entityType ? { entityType: entityType as "INVOICE" | "PAYMENT" | "DISCOUNT" | "TAX" | "RECEIPT" } : {}),
    ...(invoiceId ? { invoiceId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.billingAuditLog.count({ where }),
    prisma.billingAuditLog.findMany({
      where,
      include: {
        actorUser: { select: { name: true, email: true } },
        invoice: { select: { invoiceNumber: true } },
        payment: { select: { receiptNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    ok: true,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    rows: rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      reason: r.reason,
      actorEmail: r.actorEmail ?? r.actorUser?.email ?? null,
      actorName: r.actorUser?.name ?? null,
      actorRole: r.actorRole,
      keyUnlockUsed: r.keyUnlockUsed,
      beforeJson: r.beforeJson,
      afterJson: r.afterJson,
      invoiceNumber: r.invoice?.invoiceNumber ?? null,
      receiptNumber: r.payment?.receiptNumber ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
