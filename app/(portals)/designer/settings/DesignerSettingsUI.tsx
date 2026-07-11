// @ts-nocheck
"use client";
import { useState } from "react";
import { toast }    from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Star, Settings, BarChart3, User, Award, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import Image from "next/image";

const txt  = "var(--txt)";
const txt2 = "var(--txt2)";
const txt3 = "var(--txt3)";

const SPECIALTIES_OPTIONS = [
  "Cap Logo","Left Chest","3D Puff","Jacket Back","Full Back",
  "Sleeve","Patches","Vector Art","Sewout","Complex Designs",
];

const STAT_COLORS = [
  { bgSoft: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.20)", icon: "#7C3AED", text: "#6D28D9" },
  { bgSoft: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.20)",  icon: "#059669", text: "#047857" },
  { bgSoft: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.20)",   icon: "#0891B2", text: "#0E7490" },
  { bgSoft: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.20)",  icon: "#D97706", text: "#92400E" },
];

export function DesignerSettingsUI({ user, profile }: any) {
  const supabase = createClient();
  const [section, setSection] = useState<"profile" | "performance">("profile");
  const [fullName,    setFullName]    = useState(user.full_name ?? "");
  const [specialties, setSpecialties] = useState<string[]>(profile?.specialties ?? []);
  const [saving,      setSaving]      = useState(false);

  function toggleSpecialty(s: string) {
    setSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  }

  async function save() {
    setSaving(true);
    try {
      const { error: nameErr } = await supabase
        .from("users")
        .update({ full_name: fullName } as any)
        .eq("id", user.id);
      if (nameErr) { toast.error("Failed: " + nameErr.message); return; }

      if (profile) {
        const { error: profErr } = await supabase
          .from("designers")
          .update({ specialties } as any)
          .eq("user_id", user.id);
        if (profErr) { toast.error("Failed: " + profErr.message); return; }
      }
      toast.success("Settings saved!");
    } finally {
      setSaving(false);
    }
  }

  const Stars = ({ n }: { n: number }) =>
    <span>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= n ? "#F59E0B" : "var(--border3)", fontSize: 16 }}>★</span>)}</span>;

  const designerName = user.full_name ?? "Designer";
  const designerAvatar = user.avatar_url;

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5" style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
      {/* ── Profile strip ── */}
      <div className="px-4 py-3 rounded-2xl mb-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)" }}>
            {designerAvatar
              ? <Image src={designerAvatar} alt={designerName} className="w-full h-full rounded-full object-cover" />
              : designerName?.charAt(0)?.toUpperCase() || "D"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-syne font-bold text-[14px]" style={{ color: txt }}>{designerName}</span>
            <span className="text-[11px] ml-2 px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(124,58,237,0.10)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.25)" }}>Settings</span>
          </div>
          {profile?.avg_rating > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#D97706" }}>
              <Star size={13} fill="#D97706" /> {Number(profile.avg_rating).toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* ── Title ── */}
      <h2 className="font-syne font-bold text-xl sm:text-2xl leading-tight mb-1"
        style={{ background: "linear-gradient(135deg, #7C3AED, #D946EF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        Settings
      </h2>
      <p className="text-[12px] mb-5 font-medium" style={{ color: txt3 }}>
        Profile & performance · manage your preferences
      </p>

      {/* ── Stats row ── */}
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[
            { label: "Total Orders", val: profile.total_orders ?? "—", icon: <BarChart3 size={14} />, ci: 0 },
            { label: "Completed", val: profile.completed_orders ?? "—", icon: <CheckCircle2 size={14} />, ci: 1 },
            { label: "Avg Turnaround", val: profile.avg_turnaround_h ? `${Number(profile.avg_turnaround_h).toFixed(1)}h` : "—", icon: <Clock size={14} />, ci: 2 },
            { label: "Revision Rate", val: profile.revision_rate ? `${Number(profile.revision_rate).toFixed(1)}%` : "—", icon: <RotateCcw size={14} />, ci: 3 },
          ].map((s, i) => {
            const c = STAT_COLORS[i];
            return (
              <div key={s.label} className="rounded-2xl p-3 sm:p-3.5 transition-all hover:translate-y-[-2px]"
                style={{ background: c.bgSoft, border: `1px solid ${c.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bgSoft, color: c.icon }}>
                    {s.icon}
                  </div>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold" style={{ color: txt3 }}>{s.label}</span>
                </div>
                <div className="font-syne font-bold text-lg sm:text-xl" style={{ color: c.text }}>{s.val}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Section tabs ── */}
      <div className="flex gap-2 mb-5">
        {[
          { key: "profile", label: "Profile", icon: <User size={14} /> },
          { key: "performance", label: "Performance", icon: <Award size={14} /> },
        ].map(tab => {
          const isActive = section === tab.key;
          return (
            <button key={tab.key} onClick={() => setSection(tab.key as any)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold border transition-all active:scale-95"
              style={{
                background: isActive ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "var(--elevated)",
                color: isActive ? "#fff" : txt2,
                borderColor: isActive ? "transparent" : "var(--border2)",
                boxShadow: isActive ? "0 2px 12px rgba(124,58,237,0.20)" : "none",
              }}>
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Profile section ── */}
      {section === "profile" && (
        <div className="rounded-2xl p-4 sm:p-6 mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-syne font-bold text-[15px] mb-5 flex items-center gap-2" style={{ color: txt }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.10)", color: "#7C3AED" }}>
              <User size={13} />
            </div>
            My Profile
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt3 }}>
                Full Name
              </label>
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all"
                style={{
                  background: "var(--elevated)", border: "1.5px solid var(--border2)",
                  color: txt, fontFamily: "Inter, sans-serif",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#7C3AED"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.10)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt3 }}>
                Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full rounded-xl px-4 py-2.5 text-[13px] outline-none opacity-60"
                style={{
                  background: "var(--elevated)", border: "1.5px solid var(--border2)",
                  color: txt3, fontFamily: "Inter, sans-serif",
                }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: txt3 }}>
                Specialties
              </label>
              <div className="flex gap-2 flex-wrap">
                {SPECIALTIES_OPTIONS.map(s => {
                  const active = specialties.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                      className="text-[12px] font-medium rounded-full px-3.5 py-1.5 cursor-pointer transition-all active:scale-95"
                      style={{
                        background: active ? "rgba(124,58,237,0.12)" : "var(--elevated)",
                        color: active ? "#7C3AED" : txt3,
                        border: `1.5px solid ${active ? "rgba(124,58,237,0.35)" : "var(--border2)"}`,
                      }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={save} disabled={saving}
            className="w-full mt-5 py-3 rounded-xl text-[13px] font-semibold text-white border-none cursor-pointer active:scale-[0.98] transition-all"
            style={{ background: saving ? "linear-gradient(135deg, #7C3AED, #D946EF)" : "linear-gradient(135deg, #7C3AED, #D946EF)", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* ── Performance section ── */}
      {section === "performance" && (
        <div className="rounded-2xl p-4 sm:p-6 mb-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="font-syne font-bold text-[15px] mb-5 flex items-center gap-2" style={{ color: txt }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.10)", color: "#D97706" }}>
              <Award size={13} />
            </div>
            Performance Stats
          </h3>

          {profile ? (
            <>
              <div className="rounded-xl p-4 mb-4" style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Stars n={Math.round(profile.avg_rating)} />
                  <span className="font-syne font-bold text-xl" style={{ color: "#D97706" }}>
                    {Number(profile.avg_rating).toFixed(2)}
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: txt2 }}>
                  Your average rating across all completed orders
                </p>
              </div>

              <div className="space-y-0">
                {[
                  ["Total Orders",     profile.total_orders ?? "—",   "#7C3AED", <BarChart3 size={13} />],
                  ["Completed",        profile.completed_orders ?? "—", "#10B981", <CheckCircle2 size={13} />],
                  ["Avg Turnaround",   profile.avg_turnaround_h ? `${Number(profile.avg_turnaround_h).toFixed(1)}h` : "—", "#06B6D4", <Clock size={13} />],
                  ["Revision Rate",    profile.revision_rate ? `${Number(profile.revision_rate).toFixed(1)}%` : "—", "#F97316", <RotateCcw size={13} />],
                ].map(([l, v, c, icon]: any) => (
                  <div key={l} className="flex items-center justify-between py-3 text-[13px]"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2" style={{ color: txt2 }}>
                      <span style={{ color: c }}>{icon}</span>
                      <span>{l}</span>
                    </div>
                    <span className="font-syne font-bold text-[15px]" style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 rounded-xl" style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
              <p className="text-3xl mb-2">📊</p>
              <p className="text-[13px]" style={{ color: txt3 }}>No performance data yet</p>
              <p className="text-[11px] mt-1" style={{ color: txt3 }}>Stats appear after completing orders</p>
            </div>
          )}

          <div className="mt-5 p-4 rounded-xl flex items-start gap-3"
            style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
            <span className="text-lg flex-shrink-0 mt-0.5">♾️</span>
            <div>
              <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#047857" }}>Free Revisions</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#047857", opacity: 0.8 }}>
                Clients can request free revisions — these don't affect your revision rate negatively.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
