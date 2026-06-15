// @ts-nocheck
/**
 * Cron job monitoring — logs success/failure + alerts admins on failure.
 * Alerts include push notifications via notifyRole("admin", ...).
 *
 * Usage in cron routes:
 *   const monitor = createCronMonitor("subscription-renewal");
 *   // ... do work ...
 *   return monitor.success({ renewed: 5 });
 */

export function createCronMonitor(jobName: string) {
  const startTime = Date.now();
  let succeeded = false;

  async function alertAdmins(message: string) {
    try {
      const { notifyRole } = await import("@/lib/notify-helpers");
      await notifyRole("admin", {
        type: "system",
        title: `Cron Alert: ${jobName}`,
        body: message,
        action_url: "/admin/subscriptions",
      });
    } catch (e) {
      console.error(`[cron-monitor] Failed to alert admins:`, e);
    }
  }

  return {
    success(data: Record<string, unknown>) {
      succeeded = true;
      const ms = Date.now() - startTime;
      console.log(`[cron] ${jobName}: OK in ${ms}ms`, data);
      return Response.json({ ok: true, job: jobName, ...data, ms }, { status: 200 });
    },

    error(err: unknown) {
      const ms = Date.now() - startTime;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[cron] ${jobName}: FAILED in ${ms}ms:`, msg);
      alertAdmins(`Cron "${jobName}" failed after ${ms}ms: ${msg}`).catch(() => {});
      return Response.json({ ok: false, job: jobName, error: msg, ms }, { status: 500 });
    },
  };
}
