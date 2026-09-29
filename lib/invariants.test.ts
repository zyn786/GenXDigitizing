import { describe, it, expect } from "vitest";
import { runInvariantChecks, summarise } from "./invariants";

/**
 * Minimal stand-in for the Supabase query builder: chainable, awaitable, and
 * able to return a per-table error so the "migration not applied" path can be
 * exercised without a database.
 */
function fakeDb(tables: Record<string, any[]>, errors: Record<string, any> = {}) {
  return {
    from(table: string) {
      const rows = tables[table] ?? [];
      const error = errors[table] ?? null;
      const builder: any = {};
      for (const m of ["select", "gte", "lte", "in", "eq", "not", "order", "limit"]) {
        builder[m] = () => builder;
      }
      builder.then = (resolve: any) =>
        resolve({ data: error ? null : rows, error, count: rows.length });
      return builder;
    },
  };
}

const HOUR = 3_600_000;
const iso = (offsetHours: number) => new Date(Date.now() + offsetHours * HOUR).toISOString();

/** A healthy world: one recent order, notified, with artwork and email flowing. */
function healthy(over: Record<string, any[]> = {}) {
  return {
    orders: [
      {
        id: "o1",
        order_number: "GX1001",
        status: "in_progress",
        price: 18,
        sla_deadline: iso(10),
        created_at: iso(-2),
        designer_id: "d1",
        design_name: "Logo",
      },
    ],
    notifications: [{ title: "New order — GX1001", created_at: iso(-2), user_id: "a1" }],
    order_files: [{ order_id: "o1", file_type: "artwork" }],
    audit_logs: [],
    email_failures: [],
    sent_emails: [
      { id: "e1", from_email: "order@genxdigitizing.com", sent_by: null, sent_at: iso(-2) },
    ],
    email_events: [{ id: "ev1" }],
    ...over,
  };
}

const get = (report: any, id: string) => report.checks.find((c: any) => c.id === id);

describe("runInvariantChecks — healthy state", () => {
  it("passes when the chain is intact", async () => {
    const report = await runInvariantChecks(fakeDb(healthy()));
    expect(report.ok).toBe(true);
    expect(report.failed).toBe(0);
    expect(report.critical).toBe(0);
  });

  it("summarises as OK", async () => {
    const report = await runInvariantChecks(fakeDb(healthy()));
    expect(summarise(report)).toMatch(/^OK/);
  });
});

describe("orders_not_notified", () => {
  it("fails when an order has no notification naming it", async () => {
    const report = await runInvariantChecks(
      fakeDb(healthy({ notifications: [] })) // nobody was told
    );
    const c = get(report, "orders_not_notified");
    expect(c.ok).toBe(false);
    expect(c.severity).toBe("critical");
    expect(c.samples[0]).toContain("GX1001");
    expect(report.ok).toBe(false);
  });

  it("treats any notification naming the order as notified", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          notifications: [{ title: "SLA OVERDUE — GX1001", created_at: iso(-1), user_id: "a1" }],
        })
      )
    );
    expect(get(report, "orders_not_notified").ok).toBe(true);
  });
});

describe("overdue_unescalated", () => {
  const overdueOrder = {
    id: "o2",
    order_number: "GX2002",
    status: "in_progress",
    price: 7,
    sla_deadline: iso(-3),
    created_at: iso(-30),
    designer_id: "d1",
    design_name: "Cap",
  };

  it("fails for an order past deadline with no recent escalation", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          orders: [overdueOrder],
          notifications: [{ title: "New order — GX2002", created_at: iso(-30), user_id: "a1" }],
        })
      )
    );
    const c = get(report, "overdue_unescalated");
    expect(c.ok).toBe(false);
    expect(c.detail).toContain("1 open order(s) past deadline");
    expect(c.samples[0]).toMatch(/overdue/);
  });

  it("passes when a recent escalation names the order", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          orders: [overdueOrder],
          notifications: [{ title: "SLA OVERDUE — GX2002", created_at: iso(-1), user_id: "a1" }],
        })
      )
    );
    expect(get(report, "overdue_unescalated").ok).toBe(true);
  });

  it("does not accept a stale escalation", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          orders: [overdueOrder],
          notifications: [{ title: "SLA OVERDUE — GX2002", created_at: iso(-20), user_id: "a1" }],
        })
      ),
      { escalationRepeatHours: 6 }
    );
    expect(get(report, "overdue_unescalated").ok).toBe(false);
  });

  it("ignores orders that still have time", async () => {
    const report = await runInvariantChecks(fakeDb(healthy()));
    expect(get(report, "overdue_unescalated").ok).toBe(true);
  });
});

describe("orders_stuck_submitted", () => {
  it("fails for an old unassigned order", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          orders: [
            {
              id: "o3",
              order_number: "GX3003",
              status: "submitted",
              price: 7,
              sla_deadline: iso(20),
              created_at: iso(-10),
              designer_id: null,
              design_name: "Patch",
            },
          ],
          notifications: [{ title: "New order — GX3003", created_at: iso(-10), user_id: "a1" }],
        })
      ),
      { staleSubmittedHours: 4 }
    );
    const c = get(report, "orders_stuck_submitted");
    expect(c.ok).toBe(false);
    expect(c.samples[0]).toContain("GX3003");
  });

  it("does not flag a freshly submitted order", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          orders: [
            {
              id: "o4",
              order_number: "GX4004",
              status: "submitted",
              price: 7,
              sla_deadline: iso(20),
              created_at: iso(-0.5),
              designer_id: null,
              design_name: "Patch",
            },
          ],
          notifications: [{ title: "New order — GX4004", created_at: iso(-0.5), user_id: "a1" }],
        })
      ),
      { staleSubmittedHours: 4 }
    );
    expect(get(report, "orders_stuck_submitted").ok).toBe(true);
  });
});

describe("null_sla_deadline", () => {
  it("fails for an open order with no deadline", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          orders: [
            {
              id: "o5",
              order_number: "GX5005",
              status: "assigned",
              price: 7,
              sla_deadline: null,
              created_at: iso(-2),
              designer_id: "d1",
              design_name: "X",
            },
          ],
        })
      )
    );
    const c = get(report, "null_sla_deadline");
    expect(c.ok).toBe(false);
    expect(c.samples[0]).toContain("GX5005");
  });
});

describe("missing_artwork", () => {
  it("fails when artwork is absent and no failure was recorded", async () => {
    const report = await runInvariantChecks(fakeDb(healthy({ order_files: [] })));
    const c = get(report, "missing_artwork");
    expect(c.ok).toBe(false);
    expect(c.samples[0]).toContain("GX1001");
  });

  it("passes when the upload failure was recorded — the team already has an alert", async () => {
    const report = await runInvariantChecks(
      fakeDb(healthy({ order_files: [], audit_logs: [{ entity_id: "o1" }] }))
    );
    expect(get(report, "missing_artwork").ok).toBe(true);
  });
});

describe("transactional_email_flowing", () => {
  it("fails when orders exist but no transactional send was logged", async () => {
    // The exact state found in production: every logged send carries sent_by.
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          sent_emails: [
            {
              id: "e1",
              from_email: "orders@genxdigitizing.com",
              sent_by: "admin-1",
              sent_at: iso(-2),
            },
          ],
        })
      )
    );
    const c = get(report, "transactional_email_flowing");
    expect(c.ok).toBe(false);
    expect(c.severity).toBe("critical");
    expect(c.detail).toContain("0 transactional send");
  });

  it("passes when a send carries no sent_by", async () => {
    const report = await runInvariantChecks(fakeDb(healthy()));
    expect(get(report, "transactional_email_flowing").ok).toBe(true);
  });

  it("does not false-alarm on a quiet day with no orders", async () => {
    const report = await runInvariantChecks(
      fakeDb(healthy({ orders: [], notifications: [], order_files: [], sent_emails: [] }))
    );
    const c = get(report, "transactional_email_flowing");
    expect(c.ok).toBe(true);
    expect(c.detail).toContain("nothing expected");
  });
});

describe("unapplied migrations are skipped, never passed silently", () => {
  const missing = {
    message: "Could not find the table 'public.email_failures' in the schema cache",
  };

  it("marks email_failures skipped and counts it separately", async () => {
    const report = await runInvariantChecks(fakeDb(healthy(), { email_failures: missing }));
    const c = get(report, "email_failures_unresolved");
    expect(c.skipped).toBeTruthy();
    expect(c.ok).toBe(true); // not a failure…
    expect(report.skipped).toBeGreaterThan(0); // …but not silently healthy either
  });

  it("keeps the overall report ok when only skipped checks exist", async () => {
    const report = await runInvariantChecks(
      fakeDb(healthy(), { email_failures: missing, email_events: missing })
    );
    expect(report.ok).toBe(true);
    expect(report.skipped).toBe(2);
    expect(summarise(report)).toContain("skipped=2");
  });
});

describe("cron_alerts", () => {
  it("fails when a cron reported a failure", async () => {
    const report = await runInvariantChecks(
      fakeDb(
        healthy({
          notifications: [
            { title: "New order — GX1001", created_at: iso(-2), user_id: "a1" },
            { title: "Cron Alert: sla-check", created_at: iso(-1), user_id: "a1" },
          ],
        })
      )
    );
    const c = get(report, "cron_alerts");
    expect(c.ok).toBe(false);
    expect(c.samples[0]).toContain("sla-check");
  });
});

describe("report shape", () => {
  it("counts failures and criticals separately", async () => {
    const report = await runInvariantChecks(
      fakeDb(healthy({ notifications: [], order_files: [] }))
    );
    expect(report.ok).toBe(false);
    expect(report.failed).toBeGreaterThan(0);
    expect(report.critical).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
    expect(report.windowHours).toBe(24);
  });
});
