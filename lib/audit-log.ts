// @ts-nocheck
/**
 * Client-side audit log helper.
 * POSTs to /api/admin/audit which is protected by middleware.
 */
export interface AuditParams {
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}

export async function logAuditEvent(params: AuditParams) {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.error("[audit-log] Failed:", e);
  }
}
