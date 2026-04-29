"use client";

import { useState, useCallback } from "react";
import { Lock, ShieldAlert, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type AuditRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorEmail: string | null;
  actorName: string | null;
  actorRole: string | null;
  keyUnlockUsed: boolean;
  beforeJson: unknown;
  afterJson: unknown;
  invoiceNumber: string | null;
  receiptNumber: string | null;
  createdAt: string;
};

type PageData = {
  total: number;
  page: number;
  totalPages: number;
  rows: AuditRow[];
};

const ENTITY_COLORS: Record<string, string> = {
  INVOICE: "text-blue-400 bg-blue-500/10",
  PAYMENT: "text-emerald-400 bg-emerald-500/10",
  DISCOUNT: "text-amber-400 bg-amber-500/10",
  RECEIPT: "text-purple-400 bg-purple-500/10",
  TAX: "text-rose-400 bg-rose-500/10",
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

function JsonCell({ value }: { value: unknown }) {
  if (value == null || value === "JsonNull") return <span className="text-muted-foreground">—</span>;
  return (
    <pre className="max-w-xs overflow-x-auto rounded bg-muted p-1.5 text-xs leading-4">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

// ─── Unlock form ──────────────────────────────────────────────────────────────

function UnlockForm({ onUnlocked }: { onUnlocked: (token: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billing-audit-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.message ?? "Invalid code.");
      } else {
        onUnlocked(json.token as string);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <CardTitle>Authenticator required</CardTitle>
            <CardDescription>Enter your 6-digit TOTP code to unlock audit records for this session.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-md border bg-background px-3 py-2 text-center text-xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            autoComplete="one-time-code"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading ? "Verifying…" : "Unlock audit records"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted-foreground">
          Access expires after 5 minutes. Audit records are immutable and cannot be modified.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Audit table ──────────────────────────────────────────────────────────────

function AuditTable({ token, onExpired }: { token: string; onExpired: () => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/billing-audit?t=${encodeURIComponent(token)}&page=${p}`);
        const json = await res.json();
        if (res.status === 401) {
          onExpired();
          return;
        }
        if (!json.ok) {
          setError(json.message ?? "Failed to load audit records.");
        } else {
          setData(json as PageData);
          setPage(p);
        }
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    },
    [token, onExpired]
  );

  // Load on mount
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    setLoaded(true);
    load(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total.toLocaleString()} records — page ${data.page} of ${data.totalPages}` : "Loading…"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {data && data.rows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">No audit records found.</CardContent>
        </Card>
      )}

      {data && data.rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-left">Actor</th>
                <th className="px-4 py-3 text-left">Before</th>
                <th className="px-4 py-3 text-left">After</th>
                <th className="px-4 py-3 text-left">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={row.entityType} colorClass={ENTITY_COLORS[row.entityType] ?? "text-muted-foreground bg-muted"} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3">
                    {row.invoiceNumber && <div className="text-xs text-muted-foreground">INV {row.invoiceNumber}</div>}
                    {row.receiptNumber && <div className="text-xs text-muted-foreground">RCT {row.receiptNumber}</div>}
                    {row.reason && <div className="mt-0.5 max-w-[200px] truncate text-xs" title={row.reason}>{row.reason}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {row.actorName && <div className="font-medium">{row.actorName}</div>}
                    {row.actorEmail && <div className="text-xs text-muted-foreground">{row.actorEmail}</div>}
                    {row.actorRole && <div className="text-xs text-muted-foreground">{row.actorRole}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <JsonCell value={row.beforeJson} />
                  </td>
                  <td className="px-4 py-3">
                    <JsonCell value={row.afterJson} />
                  </td>
                  <td className="px-4 py-3">
                    {row.keyUnlockUsed && (
                      <Badge label="Key unlock" colorClass="text-amber-400 bg-amber-500/10" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages || loading}
            onClick={() => load(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function BillingAuditViewer() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Billing audit records are immutable and gated behind a one-time authenticator verification.
          Access expires after 5 minutes.
        </p>
      </div>

      {!token ? (
        <UnlockForm onUnlocked={setToken} />
      ) : (
        <AuditTable token={token} onExpired={() => setToken(null)} />
      )}
    </div>
  );
}
