// @ts-nocheck
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Eye, EyeOff, Settings, CreditCard, Mail, Clock, Shield, User, Palette } from "lucide-react";

const CARD_COLORS = [
  { bg: "#3B82F6", bgSoft: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", icon: "#2563EB", text: "#1D4ED8" },
  { bg: "#10B981", bgSoft: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", icon: "#059669", text: "#047857" },
  { bg: "#F97316", bgSoft: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: "#EA580C", text: "#C2410C" },
  { bg: "#06B6D4", bgSoft: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", icon: "#0891B2", text: "#0E7490" },
  { bg: "#8B5CF6", bgSoft: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", icon: "#7C3AED", text: "#6D28D9" },
  { bg: "#EC4899", bgSoft: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", icon: "#DB2777", text: "#BE185D" },
];

const txt = "var(--txt)", txt2 = "var(--txt2)", txt3 = "var(--txt3)";
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
  { key: "order_submitted", label: "Order Confirmed", icon: "📦", desc: "Sent when client places an order" },
  { key: "designer_assigned", label: "Designer Assigned", icon: "🎨", desc: "Sent when a designer is assigned" },
  { key: "in_progress", label: "Work Started", icon: "⚙️", desc: "Sent when designer starts the job" },
  { key: "delivered", label: "Order Delivered", icon: "✅", desc: "Sent with download link on delivery" },
  { key: "revision", label: "Revision Requested", icon: "🔄", desc: "Sent to designer when client requests revision" },
  { key: "payment_confirmed", label: "Payment Confirmed", icon: "💳", desc: "Sent with invoice PDF after payment" },
  { key: "welcome", label: "Welcome Email", icon: "👋", desc: "Sent to new client registrations" },
  { key: "sla_warning", label: "SLA Warning", icon: "⚠️", desc: "Internal alert 1h before deadline" },
  { key: "designer_task", label: "New Task (Designer)", icon: "📋", desc: "Sent to designer on assignment" },
  { key: "review_request", label: "Review Request", icon: "⭐", desc: "Sent 24h after delivery" },
];

const inpStyle: React.CSSProperties = {
  width: "100%", background: "var(--elevated)", border: "1px solid var(--border2)",
  borderRadius: 10, padding: "10px 14px", color: txt, fontSize: 13, outline: "none",
  fontFamily: "Inter,sans-serif", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5" style={{ color: txt3 }}>{label}</label>
      {children}
    </div>
  );
}

function SaveBtn({ onClick }: { onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
      style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}>
      <Save size={13} /> Save Changes
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className="relative w-[42px] h-[26px] sm:w-[44px] sm:h-[26px] rounded-full cursor-pointer border-none transition-colors flex-shrink-0"
      style={{ background: value ? clr[1].icon : "#D1D5DB" }}>
      <div className="absolute top-[3px] w-[20px] h-[20px] sm:w-[20px] sm:h-[20px] rounded-full bg-white shadow-sm transition-all"
        style={{ left: value ? 20 : 3 }} />
    </button>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-[13px] font-medium" style={{ color: txt }}>{label}</span>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export function AdminSettingsUI({ user }: { user: any }) {
  const [tab, setTab] = useState("company");
  const [showSecret, setShowSecret] = useState(false);
  const [company, setCompany] = useState({ name: "GenXdigitizing", email: "support@genxdigitizing.com", whatsapp: "", timezone: "Asia/Karachi (UTC+5)", country: "Pakistan" });
  const [payoneer, setPayoneer] = useState({ client_id: "", secret_key: "", program_id: "", env: "sandbox" });
  const [resend, setResend] = useState({ api_key: "", from_email: "orders@genxdigitizing.com", from_name: "GenXdigitizing", reply_to: "support@genxdigitizing.com" });
  const [sla, setSla] = useState({ standard_h: 24, rush_h: 6, urgent_h: 3, big_design_h: 12 });
  const [account, setAccount] = useState({ full_name: user.full_name ?? "", email: user.email ?? "" });

  // Access controls
  const [designerAccess, setDesignerAccess] = useState({ view_orders: true, upload_files: true, manage_tasks: true, view_earnings: true, request_payout: false });
  const [crmAccess, setCRMAccess] = useState({ manage_leads: true, send_emails: true, view_reports: true, manage_contacts: true });
  const [clientAccess, setClientAccess] = useState({ place_orders: true, upload_artwork: true, view_invoices: true, download_files: true, request_revisions: true });
  const [platformToggles, setPlatformToggles] = useState({ accept_new_orders: true, client_registrations: true, maintenance_mode: false });

  function save(s: string) { toast.success(`${s} settings saved`); }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-jakarta font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Settings
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>Platform configuration</p>
      </div>

      {/* Tabs — scroll pills on mobile, sidebar on desktop */}
      <div className="flex lg:hidden gap-1.5 mb-4 overflow-x-auto scrollbar-none flex-nowrap">
        {TABS.map(t => {
          const c = clr[t.ci];
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border transition-all active:scale-95"
              style={{ background: active ? c.bgSoft : "var(--surface)", color: active ? c.text : txt2, borderColor: active ? c.border : "var(--border)" }}>
              <span style={{ color: active ? c.icon : txt3 }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex flex-col gap-1 w-[190px] flex-shrink-0 h-fit rounded-2xl p-1.5 border"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          {TABS.map(t => {
            const c = clr[t.ci];
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer border-none transition-all text-left"
                style={{ background: active ? c.bgSoft : "transparent", color: active ? c.text : txt2 }}>
                <span style={{ color: active ? c.icon : txt3 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Company ─────────────────────────────── */}
          {tab === "company" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>
                  <Settings size={15} style={{ color: clr[0].icon }} /> Company Info
                </h3>
                <Field label="Company Name"><input style={inpStyle} value={company.name} onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} /></Field>
                <Field label="Support Email"><input style={inpStyle} type="email" value={company.email} onChange={e => setCompany(p => ({ ...p, email: e.target.value }))} /></Field>
                <Field label="WhatsApp"><input style={inpStyle} placeholder="+92 300 0000000" value={company.whatsapp} onChange={e => setCompany(p => ({ ...p, whatsapp: e.target.value }))} /></Field>
                <Field label="Timezone">
                  <select style={{ ...inpStyle, cursor: "pointer" }} value={company.timezone} onChange={e => setCompany(p => ({ ...p, timezone: e.target.value }))}>
                    {["Asia/Karachi (UTC+5)","Asia/Kolkata (UTC+5:30)","America/New_York (UTC-5)","Europe/London (UTC+0)","Asia/Dubai (UTC+4)"].map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </Field>
                <Field label="Country"><input style={inpStyle} value={company.country} onChange={e => setCompany(p => ({ ...p, country: e.target.value }))} /></Field>
                <div className="mt-2"><SaveBtn onClick={() => save("Company")} /></div>
              </div>
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>
                  <Palette size={15} style={{ color: clr[4].icon }} /> Branding
                </h3>
                <Field label="Platform Logo">
                  <div className="h-[120px] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors"
                    style={{ background: "var(--elevated)", borderColor: "var(--border2)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = clr[4].icon}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)"}>
                    <div className="text-center"><div className="text-2xl mb-1.5">🖼️</div><p className="text-xs" style={{ color: txt3 }}>Click to upload</p><p className="text-[11px] mt-1" style={{ color: txt3 }}>PNG · SVG · 200×60px</p></div>
                  </div>
                </Field>
                <h3 className="font-jakarta font-bold text-[13px] mb-3 mt-5 flex items-center gap-2" style={{ color: txt }}>
                  <Shield size={15} style={{ color: clr[0].icon }} /> Platform Status
                </h3>
                <div className="rounded-xl border" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                  {Object.entries(platformToggles).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-2.5 px-3 gap-4" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-[13px] font-medium capitalize" style={{ color: txt }}>{key.replace(/_/g, " ")}</span>
                      <Toggle value={val} onChange={(v) => setPlatformToggles(p => ({ ...p, [key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Payoneer ────────────────────────────── */}
          {tab === "payoneer" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>
                  <CreditCard size={15} style={{ color: clr[3].icon }} /> Payoneer API
                </h3>
                <Field label="Environment">
                  <select style={{ ...inpStyle, cursor: "pointer" }} value={payoneer.env} onChange={e => setPayoneer(p => ({ ...p, env: e.target.value }))}>
                    <option value="sandbox">Sandbox (testing)</option>
                    <option value="production">Production (live payments)</option>
                  </select>
                </Field>
                <Field label="Client ID"><input style={inpStyle} placeholder="pay_client_xxxxxxxx" value={payoneer.client_id} onChange={e => setPayoneer(p => ({ ...p, client_id: e.target.value }))} /></Field>
                <Field label="Secret Key">
                  <div className="relative">
                    <input style={{ ...inpStyle, paddingRight: 40, fontFamily: showSecret ? "monospace" : "Inter,sans-serif" }} type={showSecret ? "text" : "password"} placeholder="•••••••••••••••" value={payoneer.secret_key} onChange={e => setPayoneer(p => ({ ...p, secret_key: e.target.value }))} />
                    <button onClick={() => setShowSecret(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer" style={{ color: txt3 }}>
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </Field>
                <Field label="Program ID"><input style={inpStyle} placeholder="PRG-xxxxxxx" value={payoneer.program_id} onChange={e => setPayoneer(p => ({ ...p, program_id: e.target.value }))} /></Field>
                <div className="mt-2"><SaveBtn onClick={() => save("Payoneer")} /></div>
              </div>
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-3 flex items-center gap-2" style={{ color: txt }}>🌐 Webhook</h3>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: txt2 }}>Register this URL in your Payoneer merchant dashboard to receive payment events.</p>
                <div className="rounded-xl p-3 mb-3 border font-mono" style={{ background: "var(--elevated)", borderColor: "var(--border2)" }}>
                  <code className="text-xs break-all" style={{ color: clr[3].text }}>
                    {process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/api/webhooks/payoneer
                  </code>
                </div>
                <div className="p-2.5 rounded-xl text-xs font-medium border"
                  style={{ background: payoneer.env === "sandbox" ? clr[2].bgSoft : clr[1].bgSoft, color: payoneer.env === "sandbox" ? clr[2].text : clr[1].text, borderColor: payoneer.env === "sandbox" ? clr[2].border : clr[1].border }}>
                  {payoneer.env === "sandbox" ? "⚠️ Sandbox mode — no real payments" : "✓ Production mode — live payments enabled"}
                </div>
                <div className="mt-4">
                  <h4 className="font-jakarta text-[13px] font-bold mb-2.5" style={{ color: txt }}>Events handled</h4>
                  {["PAYMENT_COMPLETED → marks invoice paid","PAYMENT_REFUNDED → marks order refunded","PAYMENT_FAILED → notifies admin"].map(e => (
                    <div key={e} className="flex items-start gap-2 text-xs py-1.5" style={{ color: txt2, borderBottom: "1px solid var(--border)" }}>
                      <span style={{ color: clr[1].text }}>✓</span> {e}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Email ───────────────────────────────── */}
          {tab === "email" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>
                  <Mail size={15} style={{ color: clr[4].icon }} /> Resend Configuration
                </h3>
                <Field label="API Key"><input style={{ ...inpStyle, fontFamily: "monospace" }} type="password" placeholder="re_xxxxxxxxxxxxxxxx" value={resend.api_key} onChange={e => setResend(p => ({ ...p, api_key: e.target.value }))} /></Field>
                <Field label="From Email"><input style={inpStyle} type="email" value={resend.from_email} onChange={e => setResend(p => ({ ...p, from_email: e.target.value }))} /></Field>
                <Field label="From Name"><input style={inpStyle} value={resend.from_name} onChange={e => setResend(p => ({ ...p, from_name: e.target.value }))} /></Field>
                <Field label="Reply-To"><input style={inpStyle} type="email" value={resend.reply_to} onChange={e => setResend(p => ({ ...p, reply_to: e.target.value }))} /></Field>
                <div className="mt-2"><SaveBtn onClick={() => save("Email")} /></div>
              </div>
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-3 flex items-center gap-2" style={{ color: txt }}>📧 Notification Templates</h3>
                <p className="text-xs mb-3" style={{ color: txt3 }}>Templates in <code className="text-[11px] px-1.5 py-0.5 rounded font-mono" style={{ color: clr[4].text, background: clr[4].bgSoft }}>lib/email/index.ts</code></p>
                <div className="flex flex-col gap-1.5">
                  {EMAIL_TEMPLATES.map(t => (
                    <div key={t.key} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                      <span className="text-sm flex-shrink-0">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium truncate" style={{ color: txt }}>{t.label}</div>
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: txt3 }}>{t.desc}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 border" style={{ background: clr[1].bgSoft, color: clr[1].text, borderColor: clr[1].border }}>Active</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SLA ─────────────────────────────────── */}
          {tab === "sla" && (
            <div>
              <div className="rounded-2xl p-4 sm:p-5 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>
                  <Clock size={15} style={{ color: clr[2].icon }} /> Turnaround Rules
                </h3>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "standard_h", label: "Standard", icon: "🕐", ci: 0 },
                    { key: "rush_h", label: "Rush", icon: "⚡", ci: 2 },
                    { key: "urgent_h", label: "Urgent", icon: "🔥", ci: 4 },
                    { key: "big_design_h", label: "Big Design", icon: "⚠️", ci: 5 },
                  ].map(item => (
                    <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                      <span className="text-lg flex-shrink-0 w-7 text-center">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold" style={{ color: txt }}>{item.label}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input type="number" min="1" max="48" value={sla[item.key as keyof typeof sla]} onChange={e => setSla(p => ({ ...p, [item.key]: parseInt(e.target.value) || 1 }))}
                          className="w-[55px] text-center font-jakarta font-bold text-base outline-none rounded-xl py-2 border"
                          style={{ background: "var(--surface)", color: clr[item.ci].text, borderColor: clr[item.ci].border }} />
                        <span className="text-[11px] font-medium" style={{ color: txt3 }}>hrs</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4"><SaveBtn onClick={() => save("SLA")} /></div>
              </div>
              <div className="rounded-xl p-3.5 text-[13px] leading-relaxed border" style={{ background: clr[2].bgSoft, color: clr[2].text, borderColor: clr[2].border }}>
                ⚠️ All turnaround speeds are free. Changing hours only affects SLA deadlines shown to designers.
              </div>
            </div>
          )}

          {/* ── Access ──────────────────────────────── */}
          {tab === "access" && (
            <div>
              <p className="text-sm mb-4" style={{ color: txt2 }}>Control what each role can access and modify on the platform.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-5">
                {[
                  { role: "Designer", emoji: "✏️", ci: 4, perms: designerAccess, setPerms: setDesignerAccess },
                  { role: "CRM", emoji: "📊", ci: 3, perms: crmAccess, setPerms: setCRMAccess },
                  { role: "Client", emoji: "👤", ci: 0, perms: clientAccess, setPerms: setClientAccess },
                ].map(r => {
                  const c = clr[r.ci];
                  return (
                    <div key={r.role} className="rounded-2xl p-4 sm:p-5 h-full" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2.5 mb-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: c.bgSoft }}>{r.emoji}</div>
                        <h3 className="font-jakarta font-bold text-[13px] capitalize" style={{ color: c.text }}>{r.role}</h3>
                      </div>
                      {Object.entries(r.perms).map(([key, val]) => (
                        <ToggleRow key={key} label={key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} value={val} onChange={(v) => r.setPerms((p: any) => ({ ...p, [key]: v }))} />
                      ))}
                    </div>
                  );
                })}
              </div>
              <SaveBtn onClick={() => toast.success("Access controls saved")} />
            </div>
          )}

          {/* ── Account ─────────────────────────────── */}
          {tab === "account" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>
                  <User size={15} style={{ color: clr[0].icon }} /> My Account
                </h3>
                <Field label="Full Name"><input style={inpStyle} value={account.full_name} onChange={e => setAccount(p => ({ ...p, full_name: e.target.value }))} /></Field>
                <Field label="Email"><input style={{ ...inpStyle, opacity: 0.6, cursor: "not-allowed" }} value={account.email} disabled /></Field>
                <div className="mt-2"><SaveBtn onClick={() => save("Account")} /></div>
              </div>
              <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h3 className="font-jakarta font-bold text-[13px] mb-4 flex items-center gap-2" style={{ color: txt }}>🔑 Change Password</h3>
                <Field label="New Password"><input style={inpStyle} type="password" placeholder="Minimum 8 characters" /></Field>
                <Field label="Confirm Password"><input style={inpStyle} type="password" placeholder="Re-enter password" /></Field>
                <div className="mt-2"><SaveBtn onClick={() => toast.success("Password updated")} /></div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
