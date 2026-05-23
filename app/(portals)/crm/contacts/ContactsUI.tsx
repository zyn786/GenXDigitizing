// @ts-nocheck
"use client";

import { useState, useTransition } from "react";
import { useRouter }               from "next/navigation";
import { toast }                   from "sonner";
import { createClient }            from "@/lib/supabase/client";
import { Search, X, Mail, Phone, Globe, TrendingUp, ChevronRight } from "lucide-react";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

const TIERS = ["all","standard","premium","vip"];
const TIER_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  standard: { bg: "rgba(148,163,184,0.12)", color: "var(--txt2)", border: "rgba(148,163,184,0.25)" },
  premium:  { bg: "rgba(6,182,212,0.12)",   color: "#22D3EE", border: "rgba(6,182,212,0.25)" },
  vip:      { bg: "rgba(252,211,77,0.12)",   color: "#FCD34D", border: "rgba(252,211,77,0.25)" },
};

function TierBadge({ tier }: { tier: string }) {
  const s = TIER_COLOR[tier] ?? TIER_COLOR.standard;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {tier.toUpperCase()}
    </span>
  );
}

function ContactDetail({ contact, onClose }: { contact: any; onClose: () => void }) {
  const supabase   = createClient();
  const router     = useRouter();
  const [,startTx] = useTransition();
  const [saving,   setSaving] = useState(false);
  const [tier,     setTier]   = useState(contact.tier ?? "standard");
  const user = contact.users;

  async function upgradeTier() {
    setSaving(true);
    const { error } = await supabase.from("clients").update({ tier }).eq("id", contact.id);
    setSaving(false);
    if (error) { toast.error("Failed to update tier"); return; }
    toast.success("Tier updated");
    startTx(() => router.refresh());
  }

  async function toggleActive() {
    const { error } = await supabase
      .from("clients").update({ is_active: !contact.is_active }).eq("id", contact.id);
    if (error) { toast.error("Failed"); return; }
    toast.success(contact.is_active ? "Client deactivated" : "Client activated");
    startTx(() => router.refresh());
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}
      onClick={onClose}>
      <div style={{ width: 380, height: "100vh", background: "#0a0a1a", borderLeft: "1px solid var(--border2)",
        overflowY: "auto", boxShadow: "-20px 0 40px rgba(0,0,0,0.4)" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0a0a1a", zIndex: 1 }}>
          <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 15 }}>Contact Details</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--txt3)", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {getInitials(user?.full_name ?? contact.company_name)}
            </div>
            <div>
              <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 16 }}>
                {user?.full_name ?? "—"}
              </div>
              <div style={{ fontSize: 13, color: "var(--txt2)" }}>{contact.company_name}</div>
              <div style={{ marginTop: 5 }}>
                <TierBadge tier={contact.tier} />
                {!contact.is_active && (
                  <span style={{ marginLeft: 6, padding: "2px 9px", borderRadius: 20, fontSize: 11, background: "rgba(244,63,94,0.12)", color: "#FB7185", border: "1px solid rgba(244,63,94,0.25)" }}>
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div style={{ background: "var(--elevated)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            {[
              [<Mail size={12} />, "Email", user?.email ?? "—"],
              [<Phone size={12} />, "Phone", contact.phone ?? "—"],
              [<Globe size={12} />, "Country", contact.country ?? "—"],
            ].map(([icon, label, value]) => (
              <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span style={{ color: "var(--txt3)", flexShrink: 0 }}>{icon}</span>
                <span style={{ color: "var(--txt3)", flexShrink: 0, minWidth: 56 }}>{label}</span>
                <span style={{ color: "var(--txt2)", overflow: "hidden", textOverflow: "ellipsis" }}>{value as string}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13 }}>
              <span style={{ color: "var(--txt3)", flexShrink: 0 }}><TrendingUp size={12} /></span>
              <span style={{ color: "var(--txt3)", flexShrink: 0, minWidth: 56 }}>LTV</span>
              <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, color: "#34D399" }}>{formatCurrency(contact.ltv ?? 0)}</span>
            </div>
          </div>

          {/* Tier upgrade */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 6 }}>Tier</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["standard","premium","vip"].map(t => {
                const s = TIER_COLOR[t];
                return (
                  <button key={t} onClick={() => setTier(t)}
                    style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${tier === t ? s.border : "var(--border2)"}`,
                      background: tier === t ? s.bg : "transparent", color: tier === t ? s.color : "#475569" }}>
                    {t.toUpperCase()}
                  </button>
                );
              })}
            </div>
            {tier !== contact.tier && (
              <button onClick={upgradeTier} disabled={saving}
                style={{ width: "100%", marginTop: 8, padding: "8px 0", borderRadius: 8, background: "linear-gradient(135deg,#7C3AED,#D946EF)", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : `Update to ${tier.toUpperCase()}`}
              </button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {user?.email && (
              <a href={`mailto:${user.email}`} style={{ flex: 1 }}>
                <button style={{ width: "100%", padding: "8px 0", borderRadius: 8, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#22D3EE", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  ✉ Email
                </button>
              </a>
            )}
            <button onClick={toggleActive}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                background: contact.is_active ? "rgba(244,63,94,0.1)" : "rgba(52,211,153,0.1)",
                border:     contact.is_active ? "1px solid rgba(244,63,94,0.25)" : "1px solid rgba(52,211,153,0.25)",
                color:      contact.is_active ? "#FB7185" : "#34D399" }}>
              {contact.is_active ? "Deactivate" : "Activate"}
            </button>
          </div>

          {/* Meta */}
          <div style={{ fontSize: 11, color: "var(--txt3)", lineHeight: 1.8 }}>
            <div>Joined: {formatDate(contact.joined_at)}</div>
            {user?.last_sign_in_at && <div>Last seen: {formatDate(user.last_sign_in_at)}</div>}
            {contact.credit_balance > 0 && <div>Credit balance: {formatCurrency(contact.credit_balance)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CRMContactsUI({ contacts }: { contacts: any[] }) {
  const [search,    setSearch]    = useState("");
  const [tierFilter,setTierFilter]= useState("all");
  const [selected,  setSelected]  = useState<any>(null);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.company_name?.toLowerCase().includes(q)
      || c.users?.full_name?.toLowerCase().includes(q)
      || c.users?.email?.toLowerCase().includes(q)
      || c.country?.toLowerCase().includes(q);
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const totalLTV = filtered.reduce((s, c) => s + Number(c.ltv ?? 0), 0);

  return (
    <div className="portal-content">
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--txt3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, company, email, country…"
            style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "9px 13px 9px 34px", color: "var(--txt)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 10, padding: 4, border: "1px solid var(--border)" }}>
          {TIERS.map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              style={{ padding: "5px 13px", borderRadius: 7, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
                background: tierFilter === t ? "rgba(124,58,237,0.2)" : "transparent",
                color:      tierFilter === t ? "#A855F7" : "#94A3B8",
                boxShadow:  tierFilter === t ? "inset 0 0 0 1px rgba(168,85,247,0.3)" : "none" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--txt3)", whiteSpace: "nowrap" }}>
          {filtered.length} clients · <span style={{ color: "#34D399", fontWeight: 600 }}>{formatCurrency(totalLTV)} LTV</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Client","Company","Country","Tier","LTV","Orders","Last Active",""].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: .5, color: "var(--txt3)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "48px 0", textAlign: "center", color: "var(--txt3)", fontSize: 13 }}>
                  No contacts match your search
                </td>
              </tr>
            ) : filtered.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background .15s" }}
                onClick={() => setSelected(c)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {getInitials(c.users?.full_name ?? c.company_name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{c.users?.full_name ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "var(--txt3)", marginTop: 1 }}>{c.users?.email ?? "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13 }}>{c.company_name}</td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--txt2)" }}>{c.country ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}><TierBadge tier={c.tier} /></td>
                <td style={{ padding: "10px 14px", fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13, color: "#34D399" }}>
                  {formatCurrency(c.ltv ?? 0)}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--txt2)" }}>—</td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--txt3)" }}>
                  {c.users?.last_sign_in_at ? formatDate(c.users.last_sign_in_at, { month: "short", day: "numeric" }) : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <ChevronRight size={14} color="#475569" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slideout */}
      {selected && <ContactDetail contact={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
