// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  Eye,
  EyeOff,
  Settings,
  CreditCard,
  Mail,
  Clock,
  Shield,
  User,
  Palette,
} from "lucide-react";

const supabase = createClient();

const CARD_COLORS = [
  {
    bg: "#3B82F6",
    bgSoft: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    icon: "#2563EB",
    text: "#1D4ED8",
  },
  {
    bg: "#10B981",
    bgSoft: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    icon: "#059669",
    text: "#047857",
  },
  {
    bg: "#F97316",
    bgSoft: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    icon: "#EA580C",
    text: "#C2410C",
  },
  {
    bg: "#06B6D4",
    bgSoft: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    icon: "#0891B2",
    text: "#0E7490",
  },
  {
    bg: "#8B5CF6",
    bgSoft: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    icon: "#7C3AED",
    text: "#6D28D9",
  },
  {
    bg: "#EC4899",
    bgSoft: "rgba(236,72,153,0.08)",
    border: "rgba(236,72,153,0.25)",
    icon: "#DB2777",
    text: "#BE185D",
  },
];

const txt = "var(--txt)",
  txt2 = "var(--txt2)",
  txt3 = "var(--txt3)";
const clr = CARD_COLORS;

const TABS = [
  { key: "company", label: "Company", icon: <Settings size={15} />, ci: 0 },
  { key: "payoneer", label: "Payoneer", icon: <CreditCard size={15} />, ci: 3 },
  { key: "email", label: "Emails", icon: <Mail size={15} />, ci: 4 },
  { key: "sla", label: "SLA", icon: <Clock size={15} />, ci: 2 },
  { key: "access", label: "Access", icon: <Shield size={15} />, ci: 5 },
  { key: "account", label: "Account", icon: <User size={15} />, ci: 0 },
];

const EMAIL_TEMPLATES = [
  {
    key: "order_submitted",
    label: "Order Confirmed",
    icon: "📦",
    desc: "Sent when client places an order",
  },
  {
    key: "designer_assigned",
    label: "Designer Assigned",
    icon: "🎨",
    desc: "Sent when a designer is assigned",
  },
  {
    key: "in_progress",
    label: "Work Started",
    icon: "⚙️",
    desc: "Sent when designer starts the job",
  },
  {
    key: "delivered",
    label: "Order Delivered",
    icon: "✅",
    desc: "Sent with download link on delivery",
  },
  {
    key: "revision",
    label: "Revision Requested",
    icon: "🔄",
    desc: "Sent to designer when client requests revision",
  },
  {
    key: "payment_confirmed",
    label: "Payment Confirmed",
    icon: "💳",
    desc: "Sent with invoice PDF after payment",
  },
  { key: "welcome", label: "Welcome Email", icon: "👋", desc: "Sent to new client registrations" },
  {
    key: "sla_warning",
    label: "SLA Warning",
    icon: "⚠️",
    desc: "Internal alert 1h before deadline",
  },
  {
    key: "designer_task",
    label: "New Task (Designer)",
    icon: "📋",
    desc: "Sent to designer on assignment",
  },
  { key: "review_request", label: "Review Request", icon: "⭐", desc: "Sent 24h after delivery" },
];

const inpStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--elevated)",
  border: "1px solid var(--border2)",
  borderRadius: 10,
  padding: "10px 14px",
  color: txt,
  fontSize: 13,
  outline: "none",
  fontFamily: "Inter,sans-serif",
  boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label
        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.5px]"
        style={{ color: txt3 }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SaveBtn({ onClick }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border-none px-5 py-2.5 text-[13px] font-semibold text-white transition-all active:scale-95"
      style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}
    >
      <Save size={13} /> Save Changes
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative h-[26px] w-[42px] flex-shrink-0 cursor-pointer rounded-full border-none transition-colors sm:h-[26px] sm:w-[44px]"
      style={{ background: value ? clr[1].icon : "#D1D5DB" }}
    >
      <div
        className="absolute top-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-all sm:h-[20px] sm:w-[20px]"
        style={{ left: value ? 20 : 3 }}
      />
    </button>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-[13px] font-medium" style={{ color: txt }}>
        {label}
      </span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export function AdminSettingsUI({
  user,
  sender,
  payoneerEnv,
}: {
  user: any;
  sender?: any;
  payoneerEnv?: any;
}) {
  const [tab, setTab] = useState("company");
  const [showSecret, setShowSecret] = useState(false);
  const [company, setCompany] = useState({
    name: "genxdigitizing",
    email: "support@genxdigitizing.com",
    whatsapp: "",
    timezone: "Asia/Karachi (UTC+5)",
    country: "Pakistan",
  });
  const [payoneer, setPayoneer] = useState({
    client_id: "",
    secret_key: "",
    program_id: "",
    env: "sandbox",
  });
  const [resend, setResend] = useState({
    api_key: "",
    from_email: "orders@genxdigitizing.com",
    from_name: "genxdigitizing",
    reply_to: "support@genxdigitizing.com",
  });
  const [sla, setSla] = useState({ standard_h: 24, rush_h: 6, urgent_h: 3, big_design_h: 12 });
  const [account, setAccount] = useState({
    full_name: user.full_name ?? "",
    email: user.email ?? "",
  });

  // Access controls
  const [designerAccess, setDesignerAccess] = useState({
    view_orders: true,
    upload_files: true,
    manage_tasks: true,
    view_earnings: true,
    request_payout: false,
  });
  const [crmAccess, setCRMAccess] = useState({
    manage_leads: true,
    send_emails: true,
    view_reports: true,
    manage_contacts: true,
  });
  const [clientAccess, setClientAccess] = useState({
    place_orders: true,
    upload_artwork: true,
    view_invoices: true,
    download_files: true,
    request_revisions: true,
  });
  const [platformToggles, setPlatformToggles] = useState({
    accept_new_orders: true,
    client_registrations: true,
    maintenance_mode: false,
  });

  /**
   * Persist the non-secret sections.
   *
   * The previous version referenced `companyName`, `resendKey`, `slaStandard` and
   * five other identifiers that were never declared — every call threw
   * ReferenceError straight into the bare `catch`, so no section had ever saved
   * and the toast reported a failure with no cause.
   *
   * Secrets are deliberately NOT persisted here: platform_settings has a
   * `FOR SELECT USING (true)` policy, so writing an API key or a Payoneer secret
   * into it would publish it to anyone holding the anon key. Those values come
   * from the deployment environment.
   */
  async function save(section: string) {
    try {
      const settings: Record<string, string> = {};

      if (section === "Company") {
        settings["company_name"] = company.name;
        settings["company_email"] = company.email;
        settings["company_phone"] = company.whatsapp;
      }
      if (section === "SLA") {
        settings["sla_standard_hours"] = String(sla.standard_h);
        settings["sla_rush_hours"] = String(sla.rush_h);
        settings["sla_urgent_hours"] = String(sla.urgent_h);
        settings["sla_big_design_hours"] = String(sla.big_design_h);
      }
      if (section === "Access") {
        settings["access_controls"] = JSON.stringify({
          designerAccess,
          crmAccess,
          clientAccess,
          platformToggles,
        });
      }
      if (section === "Account") {
        /* handled by auth */
      }

      const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
      if (rows.length) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(rows, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success(`${section} settings saved`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save settings");
    }
  }

  // Load what is actually stored, so the form shows real values instead of the
  // hardcoded defaults it used to display regardless of the saved state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("platform_settings").select("key, value");
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      for (const row of data) map[row.key] = row.value;

      if (map.company_name || map.company_email || map.company_phone) {
        setCompany((p) => ({
          ...p,
          name: map.company_name ?? p.name,
          email: map.company_email ?? p.email,
          whatsapp: map.company_phone ?? p.whatsapp,
        }));
      }
      const num = (v: string | undefined, fallback: number) => {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : fallback;
      };
      if (
        map.sla_standard_hours ||
        map.sla_rush_hours ||
        map.sla_urgent_hours ||
        map.sla_big_design_hours
      ) {
        setSla((p) => ({
          standard_h: num(map.sla_standard_hours, p.standard_h),
          rush_h: num(map.sla_rush_hours, p.rush_h),
          urgent_h: num(map.sla_urgent_hours, p.urgent_h),
          big_design_h: num(map.sla_big_design_hours, p.big_design_h),
        }));
      }
      if (map.access_controls) {
        try {
          const a = JSON.parse(map.access_controls);
          if (a.designerAccess) setDesignerAccess(a.designerAccess);
          if (a.crmAccess) setCRMAccess(a.crmAccess);
          if (a.clientAccess) setClientAccess(a.clientAccess);
          if (a.platformToggles) setPlatformToggles(a.platformToggles);
        } catch {
          /* malformed row — keep defaults */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Password change — the button used to just toast "Password updated"
  //    without touching anything, leaving the admin believing it had changed.
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  async function changePassword() {
    if (pw.next.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) throw error;
      setPw({ next: "", confirm: "" });
      toast.success("Password updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update password");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2
          className="font-syne text-xl font-bold sm:text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Settings
        </h2>
        <p className="mt-1 text-[12px] sm:text-xs" style={{ color: txt3 }}>
          Platform configuration
        </p>
      </div>

      {/* Tabs — scroll pills on mobile, sidebar on desktop */}
      <div className="scrollbar-none mb-4 flex flex-nowrap gap-1.5 overflow-x-auto lg:hidden">
        {TABS.map((t) => {
          const c = clr[t.ci];
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all active:scale-95"
              style={{
                background: active ? c.bgSoft : "var(--surface)",
                color: active ? c.text : txt2,
                borderColor: active ? c.border : "var(--border)",
              }}
            >
              <span style={{ color: active ? c.icon : txt3 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <div
          className="hidden h-fit w-[190px] flex-shrink-0 flex-col gap-1 rounded-2xl border p-1.5 lg:flex"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          {TABS.map((t) => {
            const c = clr[t.ci];
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border-none px-3.5 py-2.5 text-left text-[13px] font-medium transition-all"
                style={{
                  background: active ? c.bgSoft : "transparent",
                  color: active ? c.text : txt2,
                }}
              >
                <span style={{ color: active ? c.icon : txt3 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* ── Company ─────────────────────────────── */}
          {tab === "company" && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <Settings size={15} style={{ color: clr[0].icon }} /> Company Info
                </h3>
                <Field label="Company Name">
                  <input
                    style={inpStyle}
                    value={company.name}
                    onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Support Email">
                  <input
                    style={inpStyle}
                    type="email"
                    value={company.email}
                    onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))}
                  />
                </Field>
                <Field label="WhatsApp">
                  <input
                    style={inpStyle}
                    placeholder="+92 300 0000000"
                    value={company.whatsapp}
                    onChange={(e) => setCompany((p) => ({ ...p, whatsapp: e.target.value }))}
                  />
                </Field>
                <Field label="Timezone">
                  <select
                    style={{ ...inpStyle, cursor: "pointer" }}
                    value={company.timezone}
                    onChange={(e) => setCompany((p) => ({ ...p, timezone: e.target.value }))}
                  >
                    {[
                      "Asia/Karachi (UTC+5)",
                      "Asia/Kolkata (UTC+5:30)",
                      "America/New_York (UTC-5)",
                      "Europe/London (UTC+0)",
                      "Asia/Dubai (UTC+4)",
                    ].map((tz) => (
                      <option key={tz}>{tz}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <input
                    style={inpStyle}
                    value={company.country}
                    onChange={(e) => setCompany((p) => ({ ...p, country: e.target.value }))}
                  />
                </Field>
                <div className="mt-2">
                  <SaveBtn onClick={() => save("Company")} />
                </div>
              </div>
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <Palette size={15} style={{ color: clr[4].icon }} /> Branding
                </h3>
                <Field label="Platform Logo">
                  <div
                    className="flex h-[120px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors"
                    style={{ background: "var(--elevated)", borderColor: "var(--border2)" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor = clr[4].icon)
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.borderColor = "var(--border2)")
                    }
                  >
                    <div className="text-center">
                      <div className="mb-1.5 text-2xl">🖼️</div>
                      <p className="text-xs" style={{ color: txt3 }}>
                        Click to upload
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: txt3 }}>
                        PNG · SVG · 200×60px
                      </p>
                    </div>
                  </div>
                </Field>
                <h3
                  className="mb-3 mt-5 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <Shield size={15} style={{ color: clr[0].icon }} /> Platform Status
                </h3>
                <div
                  className="rounded-xl border"
                  style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                >
                  {Object.entries(platformToggles).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 px-3 py-2.5"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <span className="text-[13px] font-medium capitalize" style={{ color: txt }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <Toggle
                        value={val}
                        onChange={(v) => setPlatformToggles((p) => ({ ...p, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Payoneer ────────────────────────────── */}
          {tab === "payoneer" && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <CreditCard size={15} style={{ color: clr[3].icon }} /> Payoneer API
                </h3>
                <div
                  className="mb-3 rounded-xl border p-3 text-[12px] leading-relaxed"
                  style={{
                    background: clr[3].bgSoft,
                    color: clr[3].text,
                    borderColor: clr[3].border,
                  }}
                >
                  Read-only. Credentials are read from the deployment environment by
                  <code className="font-mono"> lib/payoneer/client.ts</code> — the fields that used
                  to be here were never read by anything, and saving them would have written payment
                  secrets into a world-readable table.
                </div>
                <Field label="Environment">
                  <input
                    style={{
                      ...inpStyle,
                      opacity: 0.75,
                      cursor: "not-allowed",
                      fontFamily: "monospace",
                    }}
                    value={payoneerEnv?.env ?? "sandbox"}
                    disabled
                    readOnly
                  />
                </Field>
                {[
                  { label: "Client ID", set: payoneerEnv?.clientConfigured },
                  { label: "Secret Key", set: payoneerEnv?.secretConfigured },
                  { label: "Program ID", set: payoneerEnv?.programConfigured },
                ].map((row) => (
                  <Field key={row.label} label={row.label}>
                    <input
                      style={{
                        ...inpStyle,
                        opacity: 0.75,
                        cursor: "not-allowed",
                        fontFamily: "monospace",
                      }}
                      value={row.set ? "✓ configured" : "not set"}
                      disabled
                      readOnly
                    />
                  </Field>
                ))}
              </div>
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-3 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  🌐 Webhook
                </h3>
                <p className="mb-3 text-[13px] leading-relaxed" style={{ color: txt2 }}>
                  Register this URL in your Payoneer merchant dashboard to receive payment events.
                </p>
                <div
                  className="mb-3 rounded-xl border p-3 font-mono"
                  style={{ background: "var(--elevated)", borderColor: "var(--border2)" }}
                >
                  <code className="break-all text-xs" style={{ color: clr[3].text }}>
                    {process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}
                    /api/webhooks/payoneer
                  </code>
                </div>
                <div
                  className="rounded-xl border p-2.5 text-xs font-medium"
                  style={{
                    background: payoneer.env === "sandbox" ? clr[2].bgSoft : clr[1].bgSoft,
                    color: payoneer.env === "sandbox" ? clr[2].text : clr[1].text,
                    borderColor: payoneer.env === "sandbox" ? clr[2].border : clr[1].border,
                  }}
                >
                  {payoneer.env === "sandbox"
                    ? "⚠️ Sandbox mode — no real payments"
                    : "✓ Production mode — live payments enabled"}
                </div>
                <div className="mt-4">
                  <h4 className="mb-2.5 font-syne text-[13px] font-bold" style={{ color: txt }}>
                    Events handled
                  </h4>
                  {[
                    "PAYMENT_COMPLETED → marks invoice paid",
                    "PAYMENT_REFUNDED → marks order refunded",
                    "PAYMENT_FAILED → notifies admin",
                  ].map((e) => (
                    <div
                      key={e}
                      className="flex items-start gap-2 py-1.5 text-xs"
                      style={{ color: txt2, borderBottom: "1px solid var(--border)" }}
                    >
                      <span style={{ color: clr[1].text }}>✓</span> {e}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Email ───────────────────────────────── */}
          {tab === "email" && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <Mail size={15} style={{ color: clr[4].icon }} /> Resend Configuration
                </h3>
                <Field label="API Key">
                  <input
                    style={{
                      ...inpStyle,
                      opacity: 0.6,
                      cursor: "not-allowed",
                      fontFamily: "monospace",
                    }}
                    type="password"
                    value="configured via environment"
                    disabled
                    readOnly
                  />
                </Field>
                <div
                  className="mb-3 rounded-xl border p-3 text-[12px] leading-relaxed"
                  style={{
                    background: clr[4].bgSoft,
                    color: clr[4].text,
                    borderColor: clr[4].border,
                  }}
                >
                  Read-only. Sender identity comes from the deployment environment (
                  <code className="font-mono">RESEND_FROM_EMAIL</code>,{" "}
                  <code className="font-mono">RESEND_FROM_NAME</code>,{" "}
                  <code className="font-mono">RESEND_REPLY_TO</code>). It is not editable here —{" "}
                  <code className="font-mono">platform_settings</code> is world-readable, so secrets
                  must never be written to it.
                </div>
                {[
                  { label: "Sends as", value: sender?.from ?? "—" },
                  { label: "Replies go to", value: sender?.replyTo ?? "—" },
                  { label: "From Email (env)", value: sender?.fromEnv ?? "—" },
                  { label: "From Name (env)", value: sender?.nameEnv ?? "—" },
                  { label: "Reply-To (env)", value: sender?.replyEnv ?? "—" },
                ].map((row) => (
                  <Field key={row.label} label={row.label}>
                    <input
                      style={{
                        ...inpStyle,
                        opacity: 0.75,
                        cursor: "not-allowed",
                        fontFamily: "monospace",
                      }}
                      value={row.value}
                      disabled
                      readOnly
                    />
                  </Field>
                ))}
              </div>
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-3 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  📧 Notification Templates
                </h3>
                <p className="mb-3 text-xs" style={{ color: txt3 }}>
                  Templates in{" "}
                  <code
                    className="rounded px-1.5 py-0.5 font-mono text-[11px]"
                    style={{ color: clr[4].text, background: clr[4].bgSoft }}
                  >
                    lib/email/index.ts
                  </code>
                </p>
                <div className="flex flex-col gap-1.5">
                  {EMAIL_TEMPLATES.map((t) => (
                    <div
                      key={t.key}
                      className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                      style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                    >
                      <span className="flex-shrink-0 text-sm">{t.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium" style={{ color: txt }}>
                          {t.label}
                        </div>
                        <div className="mt-0.5 truncate text-[10px]" style={{ color: txt3 }}>
                          {t.desc}
                        </div>
                      </div>
                      <span
                        className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: clr[1].bgSoft,
                          color: clr[1].text,
                          borderColor: clr[1].border,
                        }}
                      >
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SLA ─────────────────────────────────── */}
          {tab === "sla" && (
            <div>
              <div
                className="mb-4 rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <Clock size={15} style={{ color: clr[2].icon }} /> Turnaround Rules
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "standard_h", label: "Standard", icon: "🕐", ci: 0 },
                    { key: "rush_h", label: "Rush", icon: "⚡", ci: 2 },
                    { key: "urgent_h", label: "Urgent", icon: "🔥", ci: 4 },
                    { key: "big_design_h", label: "Big Design", icon: "⚠️", ci: 5 },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 rounded-xl border p-3"
                      style={{ background: "var(--elevated)", borderColor: "var(--border)" }}
                    >
                      <span className="w-7 flex-shrink-0 text-center text-lg">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold" style={{ color: txt }}>
                          {item.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="48"
                          value={sla[item.key as keyof typeof sla]}
                          onChange={(e) =>
                            setSla((p) => ({ ...p, [item.key]: parseInt(e.target.value) || 1 }))
                          }
                          className="w-[55px] rounded-xl border py-2 text-center font-syne text-base font-bold outline-none"
                          style={{
                            background: "var(--surface)",
                            color: clr[item.ci].text,
                            borderColor: clr[item.ci].border,
                          }}
                        />
                        <span className="text-[11px] font-medium" style={{ color: txt3 }}>
                          hrs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <SaveBtn onClick={() => save("SLA")} />
                </div>
              </div>
              <div
                className="rounded-xl border p-3.5 text-[13px] leading-relaxed"
                style={{
                  background: clr[2].bgSoft,
                  color: clr[2].text,
                  borderColor: clr[2].border,
                }}
              >
                ⚠️ All turnaround speeds are free. Changing hours only affects SLA deadlines shown
                to designers.
              </div>
            </div>
          )}

          {/* ── Access ──────────────────────────────── */}
          {tab === "access" && (
            <div>
              <p className="mb-4 text-sm" style={{ color: txt2 }}>
                Control what each role can access and modify on the platform.
              </p>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
                {[
                  {
                    role: "Designer",
                    emoji: "✏️",
                    ci: 4,
                    perms: designerAccess,
                    setPerms: setDesignerAccess,
                  },
                  { role: "CRM", emoji: "📊", ci: 3, perms: crmAccess, setPerms: setCRMAccess },
                  {
                    role: "Client",
                    emoji: "👤",
                    ci: 0,
                    perms: clientAccess,
                    setPerms: setClientAccess,
                  },
                ].map((r) => {
                  const c = clr[r.ci];
                  return (
                    <div
                      key={r.role}
                      className="h-full rounded-2xl p-4 sm:p-5"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <div
                        className="mb-3 flex items-center gap-2.5 pb-3"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-xl text-base"
                          style={{ background: c.bgSoft }}
                        >
                          {r.emoji}
                        </div>
                        <h3
                          className="font-syne text-[13px] font-bold capitalize"
                          style={{ color: c.text }}
                        >
                          {r.role}
                        </h3>
                      </div>
                      {Object.entries(r.perms).map(([key, val]) => (
                        <ToggleRow
                          key={key}
                          label={key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          value={val}
                          onChange={(v) => r.setPerms((p: any) => ({ ...p, [key]: v }))}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
              <SaveBtn onClick={() => save("Access")} />
            </div>
          )}

          {/* ── Account ─────────────────────────────── */}
          {tab === "account" && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  <User size={15} style={{ color: clr[0].icon }} /> My Account
                </h3>
                <Field label="Full Name">
                  <input
                    style={inpStyle}
                    value={account.full_name}
                    onChange={(e) => setAccount((p) => ({ ...p, full_name: e.target.value }))}
                  />
                </Field>
                <Field label="Email">
                  <input
                    style={{ ...inpStyle, opacity: 0.6, cursor: "not-allowed" }}
                    value={account.email}
                    disabled
                  />
                </Field>
                <div className="mt-2">
                  <SaveBtn onClick={() => save("Account")} />
                </div>
              </div>
              <div
                className="rounded-2xl p-4 sm:p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3
                  className="mb-4 flex items-center gap-2 font-syne text-[13px] font-bold"
                  style={{ color: txt }}
                >
                  🔑 Change Password
                </h3>
                <Field label="New Password">
                  <input
                    style={inpStyle}
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={pw.next}
                    onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  />
                </Field>
                <Field label="Confirm Password">
                  <input
                    style={inpStyle}
                    type="password"
                    placeholder="Re-enter password"
                    value={pw.confirm}
                    onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  />
                </Field>
                <div className="mt-2">
                  {pwBusy ? (
                    <SaveBtn onClick={() => {}} loading />
                  ) : (
                    <SaveBtn onClick={changePassword} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
