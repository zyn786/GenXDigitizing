"use client";

import { useState } from "react";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  type: "DISCOUNT" | "REFERRAL" | "FOLLOW_UP" | "SEASONAL";
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ACTIVE" | "REJECTED" | "COMPLETED";
  targetAudience: string | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  createdBy: { name: string | null } | null;
  approvedBy: { name: string | null } | null;
};

const STATUS_LABELS: Record<Campaign["status"], string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const STATUS_COLORS: Record<Campaign["status"], string> = {
  DRAFT: "bg-secondary/60 text-muted-foreground",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-400",
  ACTIVE: "bg-primary/10 text-primary",
  REJECTED: "bg-red-500/10 text-red-400",
  COMPLETED: "bg-secondary/60 text-muted-foreground",
};

const TYPE_LABELS: Record<Campaign["type"], string> = {
  DISCOUNT: "Discount",
  REFERRAL: "Referral",
  FOLLOW_UP: "Follow-up",
  SEASONAL: "Seasonal",
};

export function CampaignsManager({
  initialCampaigns,
  userRole,
}: {
  initialCampaigns: Campaign[];
  userRole: string;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [showForm, setShowForm] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "MANAGER";

  async function act(
    campaignId: string,
    action: "approve" | "reject" | "activate" | "complete" | "delete",
    reason?: string
  ) {
    setActingId(campaignId);
    setError(null);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/campaigns/${campaignId}`, { method: "DELETE" });
        const json = await res.json() as { ok: boolean; message?: string };
        if (!json.ok) { setError(json.message ?? "Failed."); return; }
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      } else {
        const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        });
        const json = await res.json() as { ok: boolean; campaign?: Campaign; message?: string };
        if (!json.ok) { setError(json.message ?? "Failed."); return; }
        if (json.campaign) {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === campaignId ? json.campaign! : c))
          );
        }
      }
    } catch {
      setError("Network error.");
    } finally {
      setActingId(null);
    }
  }

  function onCreated(campaign: Campaign) {
    setCampaigns((prev) => [campaign, ...prev]);
    setShowForm(false);
  }

  const pending = campaigns.filter((c) => c.status === "PENDING_APPROVAL");
  const rest = campaigns.filter((c) => c.status !== "PENDING_APPROVAL");

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
              {pending.length} pending approval
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {showForm ? "Cancel" : "+ New campaign"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <CreateCampaignForm
          isAdmin={isAdmin}
          onCreated={onCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isAdmin && pending.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
            Awaiting approval
          </h2>
          <div className="grid gap-3">
            {pending.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                isAdmin={isAdmin}
                actingId={actingId}
                onAct={act}
              />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">All campaigns</h2>
          <div className="grid gap-3">
            {rest.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                isAdmin={isAdmin}
                actingId={actingId}
                onAct={act}
              />
            ))}
          </div>
        </section>
      )}

      {campaigns.length === 0 && !showForm && (
        <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-16 text-center text-sm text-muted-foreground">
          No campaigns yet.
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign: c,
  isAdmin,
  actingId,
  onAct,
}: {
  campaign: Campaign;
  isAdmin: boolean;
  actingId: string | null;
  onAct: (id: string, action: "approve" | "reject" | "activate" | "complete" | "delete", reason?: string) => void;
}) {
  const busy = actingId === c.id;

  return (
    <div className="rounded-[2rem] border border-border/80 bg-card/70 px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{c.title}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
              {STATUS_LABELS[c.status]}
            </span>
            <span className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs text-muted-foreground">
              {TYPE_LABELS[c.type]}
            </span>
          </div>
          {c.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{c.description}</p>
          )}
          {c.targetAudience && (
            <p className="mt-1 text-xs text-muted-foreground">Target: {c.targetAudience}</p>
          )}
          {(c.startDate || c.endDate) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}
              {" → "}
              {c.endDate ? new Date(c.endDate).toLocaleDateString() : "ongoing"}
            </p>
          )}
          {c.rejectionReason && (
            <p className="mt-1.5 text-xs text-red-400">Rejected: {c.rejectionReason}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground opacity-60">
            by {c.createdBy?.name ?? "—"} · {new Date(c.createdAt).toLocaleDateString()}
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {c.status === "PENDING_APPROVAL" && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onAct(c.id, "approve")}
                  className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {busy ? "…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const reason = window.prompt("Rejection reason (optional):");
                    onAct(c.id, "reject", reason ?? undefined);
                  }}
                  className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {c.status === "APPROVED" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAct(c.id, "activate")}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
              >
                {busy ? "…" : "Activate"}
              </button>
            )}
            {c.status === "ACTIVE" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onAct(c.id, "complete")}
                className="rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50"
              >
                {busy ? "…" : "Complete"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onAct(c.id, "delete")}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateCampaignForm({
  isAdmin,
  onCreated,
  onCancel,
}: {
  isAdmin: boolean;
  onCreated: (c: Campaign) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const startRaw = fd.get("startDate") as string;
    const endRaw = fd.get("endDate") as string;
    const body = {
      title: fd.get("title") as string,
      type: fd.get("type") as string,
      description: (fd.get("description") as string).trim() || undefined,
      targetAudience: (fd.get("targetAudience") as string).trim() || undefined,
      startDate: startRaw ? new Date(startRaw).toISOString() : undefined,
      endDate: endRaw ? new Date(endRaw).toISOString() : undefined,
      notes: (fd.get("notes") as string).trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { ok: boolean; campaign?: Campaign; message?: string };
      if (!json.ok || !json.campaign) {
        setError(json.message ?? "Failed to create campaign.");
      } else {
        onCreated(json.campaign);
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[2rem] border border-border/80 bg-card/70 p-6"
    >
      <h2 className="text-base font-semibold">New campaign</h2>

      {!isAdmin && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          This campaign will require admin approval before it can be activated.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <label className="text-sm font-medium">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            name="title"
            required
            placeholder="Summer discount campaign"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Type <span className="text-red-400">*</span>
          </label>
          <select
            name="type"
            required
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm"
          >
            <option value="DISCOUNT">Discount</option>
            <option value="REFERRAL">Referral</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="SEASONAL">Seasonal</option>
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Target audience</label>
          <input
            name="targetAudience"
            placeholder="New clients, returning clients…"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">Start date</label>
          <input
            name="startDate"
            type="date"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">End date</label>
          <input
            name="endDate"
            type="date"
            className="h-11 rounded-2xl border border-border/80 bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          rows={2}
          placeholder="What is this campaign about?"
          className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">Internal notes</label>
        <textarea
          name="notes"
          rows={2}
          placeholder="Strategy, talking points, links…"
          className="rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create campaign"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border/80 px-6 text-sm text-muted-foreground transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
