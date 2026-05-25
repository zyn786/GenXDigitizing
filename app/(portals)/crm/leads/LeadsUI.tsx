// @ts-nocheck
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, DollarSign, Send, Image, Loader2, Mail, Globe, Calendar, Building2, FileText, ChevronRight, TrendingUp, Target, Trophy } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

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

const STAGES = [
  { id: "lead", label: "New Lead", ci: 4, icon: "📥" },
  { id: "contacted", label: "Contacted", ci: 3, icon: "📞" },
  { id: "won", label: "Won", ci: 1, icon: "🏆" },
  { id: "lost", label: "Lost", ci: 5, icon: "❌" },
];

const SOURCES = ["website","referral","social","email","cold_outreach","other"];
const inpStyle: React.CSSProperties = { width: "100%", background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 10, padding: "9px 13px", color: txt, fontSize: 13, outline: "none", fontFamily: "Inter,sans-serif", boxSizing: "border-box" };

function LeadCard({ lead, onClick }: { lead: any; onClick: () => void }) {
  const stage = STAGES.find(s => s.id === lead.stage)!;
  const sc = clr[stage.ci];
  return (
    <div onClick={onClick} className="rounded-xl p-4 cursor-pointer active:opacity-80 transition-all"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: sc.bgSoft, color: sc.text, border: `1px solid ${sc.border}` }}>
            {getInitials(lead.contact_name)}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: txt }}>{lead.contact_name}</div>
            <div className="text-[11px]" style={{ color: txt2 }}>{lead.company ?? lead.email}</div>
          </div>
        </div>
        {lead.deal_value > 0 && (
          <div className="flex items-center gap-0.5 text-sm font-bold flex-shrink-0" style={{ color: clr[1].text }}>
            <DollarSign size={11} />{lead.deal_value}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
            style={{ background: sc.bgSoft, color: sc.text, borderColor: sc.border }}>
            {stage.icon} {stage.label}
          </span>
          <span className="text-[10px] capitalize" style={{ color: txt2 }}>{lead.source?.replace("_", " ")}</span>
        </div>
        <ChevronRight size={14} style={{ color: txt3 }} />
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ contact_name: "", email: "", company: "", country: "", source: "website", stage: "lead", deal_value: "", notes: "" });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.contact_name || !form.email) { toast.error("Name and email required"); return; }
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  }

  const upd = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border p-6"
        style={{ background: "var(--bg)", borderColor: "var(--border2)" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-jakarta font-bold text-lg" style={{ color: txt }}>Add Lead</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: txt3 }}><X size={16} /></button>
        </div>
        {[
          ["Full Name *", "contact_name", "text", "Jane Smith"],
          ["Email *", "email", "email", "jane@company.com"],
          ["Company", "company", "text", "Acme Corp"],
          ["Country", "country", "text", "US"],
          ["Deal Value ($)", "deal_value", "number", "250"],
        ].map(([label, key, type, placeholder]) => (
          <div key={key as string} className="mb-3">
            <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt2 }}>{label as string}</label>
            <input type={type as string} value={(form as any)[key as string]} onChange={upd(key as string)} placeholder={placeholder as string} style={inpStyle} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt2 }}>Source</label>
            <select value={form.source} onChange={upd("source")} style={{ ...inpStyle, cursor: "pointer" }}>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt2 }}>Stage</label>
            <select value={form.stage} onChange={upd("stage")} style={{ ...inpStyle, cursor: "pointer" }}>
              {STAGES.filter(s => s.id !== "won" && s.id !== "lost").map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt2 }}>Notes</label>
          <textarea value={form.notes} onChange={upd("notes")} rows={3} placeholder="Source info, design needs, requirements…" style={{ ...inpStyle, resize: "none" }} />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-[13px] font-medium border cursor-pointer transition-all active:scale-95"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}>Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-[2] py-2 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}>
            {saving ? "Adding…" : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LeadDetailModal({ lead, onClose, onContact }: { lead: any; onClose: () => void; onContact: () => void }) {
  const artworkUrl = getArtworkUrl(lead.notes);
  const stage = STAGES.find(s => s.id === lead.stage);
  const sc = clr[stage?.ci ?? 4];
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  useEffect(() => {
    if (!lead.email) return;
    fetch(`/api/crm/lead-orders?email=${encodeURIComponent(lead.email)}`)
      .then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => {}).finally(() => setOrdersLoaded(true));
  }, [lead.email]);

  const activityLines = (lead.notes || "").split("\n").filter((l: string) => l.startsWith("["));
  const cleanNotes = (lead.notes || "").split("\n").filter((l: string) => !l.startsWith("[")).join("\n").trim();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 sm:p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-[600px] max-h-[88vh] overflow-y-auto rounded-2xl border" style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
        onClick={e => e.stopPropagation()}>
        <div className="p-5 sm:p-6 pb-0 relative">
          <button onClick={onClose} className="absolute top-5 right-5 bg-transparent border-none cursor-pointer" style={{ color: txt3 }}><X size={18} /></button>
          <div className="flex items-center gap-3 sm:gap-3.5 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-[18px] sm:text-[22px] font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${sc.icon},${sc.text})` }}>
              {getInitials(lead.contact_name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-jakarta font-bold text-lg sm:text-xl mb-1" style={{ color: txt }}>{lead.contact_name}</h2>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border"
                  style={{ background: sc.bgSoft, color: sc.text, borderColor: sc.border }}>{stage?.icon} {stage?.label}</span>
                <span className="text-[11px] capitalize font-medium" style={{ color: txt2 }}>{lead.source?.replace("_", " ") || "Unknown source"}</span>
                <span className="text-[11px]" style={{ color: txt2 }}>{formatDate(lead.created_at, { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "var(--elevated)" }}>
              <Mail size={16} style={{ color: clr[0].icon, flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Email</div>
                <a href={`mailto:${lead.email}`} className="text-[12px] font-medium no-underline break-all" style={{ color: txt }}>{lead.email}</a>
              </div>
            </div>
            {lead.company && (
              <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "var(--elevated)" }}>
                <Building2 size={16} style={{ color: clr[4].icon, flexShrink: 0 }} />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Company</div>
                  <div className="text-[12px] font-medium" style={{ color: txt }}>{lead.company}</div>
                </div>
              </div>
            )}
            {lead.country && (
              <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "var(--elevated)" }}>
                <Globe size={16} style={{ color: clr[1].icon, flexShrink: 0 }} />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Country</div>
                  <div className="text-[12px] font-medium" style={{ color: txt }}>{lead.country}</div>
                </div>
              </div>
            )}
            <div className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: "var(--elevated)" }}>
              <Calendar size={16} style={{ color: clr[2].icon, flexShrink: 0 }} />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color: txt3 }}>Created</div>
                <div className="text-[12px] font-medium" style={{ color: txt }}>{formatDate(lead.created_at, { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
            </div>
          </div>

          {lead.deal_value > 0 && (
            <div className="text-center mb-4 p-2.5 rounded-xl border font-semibold text-[12px]"
              style={{ background: clr[1].bgSoft, borderColor: clr[1].border, color: clr[1].text }}>
              Deal Value: ${Number(lead.deal_value).toLocaleString()}
            </div>
          )}

          {cleanNotes && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText size={14} style={{ color: txt3 }} />
                <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txt3 }}>Notes</span>
              </div>
              <div className="rounded-xl p-3.5 text-[13px] leading-relaxed whitespace-pre-wrap border"
                style={{ background: "var(--elevated)", color: txt2, borderColor: "var(--border)" }}>{cleanNotes}</div>
            </div>
          )}

          {activityLines.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar size={14} style={{ color: txt3 }} />
                <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txt3 }}>Activity Log</span>
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                {activityLines.map((line: string, i: number) => {
                  const timestamp = line.match(/\[(.*?)\]/)?.[1] || "";
                  const action = line.replace(/\[.*?\]\s*/, "");
                  const date = timestamp ? new Date(timestamp) : null;
                  const dotColor = action.includes("Stage changed") ? clr[4].icon : action.includes("Email") ? clr[0].icon : clr[3].icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[11px]"
                      style={{ borderBottom: i < activityLines.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                      <span className="flex-1" style={{ color: txt2 }}>{action}</span>
                      {date && (
                        <span className="text-[10px] whitespace-nowrap flex-shrink-0" style={{ color: txt3 }}>
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {ordersLoaded && orders.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <FileText size={14} style={{ color: txt3 }} />
                <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txt3 }}>Orders ({orders.length})</span>
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ background: "var(--elevated)", borderColor: "var(--border)" }}>
                {orders.map((o, i) => (
                  <div key={o.id} className="flex items-center justify-between px-3.5 py-2.5 text-[11px] gap-2"
                    style={{ borderBottom: i < orders.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold" style={{ color: txt }}>{o.orderNumber}</div>
                      <div className="text-[10px]" style={{ color: txt2 }}>{o.service}{o.designName ? ` · ${o.designName}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-[12px]" style={{ color: clr[1].text }}>${o.price}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase border"
                        style={{ background: "var(--elevated)", color: txt2, borderColor: "var(--border2)" }}>{o.status?.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {artworkUrl && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <Image size={14} style={{ color: txt3 }} />
                <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txt3 }}>Artwork</span>
              </div>
              <a href={artworkUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-[12px] no-underline border transition-all"
                style={{ background: clr[4].bgSoft, borderColor: clr[4].border, color: clr[4].text }}>
                <Image size={16} /> View / Download Artwork ↗
              </a>
            </div>
          )}

          <div className="flex gap-2.5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={onContact}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
              style={{ background: `linear-gradient(135deg,${clr[0].bg},${clr[4].bg})` }}>
              <Send size={15} /> Contact via Email
            </button>
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium border cursor-pointer transition-all active:scale-95"
              style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getArtworkUrl(notes: string) {
  if (!notes) return null;
  const match = notes.match(/Download:\s*(https?:\/\/[^\s]+)/);
  return match?.[1] || null;
}

function ContactLeadModal({ lead, onClose }: { lead: any; onClose: () => void }) {
  const [subject, setSubject] = useState(`Re: Your inquiry with GenXdigitizing`);
  const [message, setMessage] = useState(`Hi ${lead.contact_name},\n\nThank you for reaching out! We'd love to help with your embroidery project.\n\nCould you share more details about what you need? We can provide a quote and turnaround time.\n\nBest regards,\nGenXdigitizing Team`);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject || !message) { toast.error("Subject and message are required"); return; }
    setSending(true);
    const res = await fetch("/api/crm/contact-lead", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, to: lead.email, subject, message, leadName: lead.contact_name }),
    });
    setSending(false);
    if (res.ok) { toast.success("Email sent! Lead moved to Contacted."); onClose(); window.location.reload(); }
    else { const err = await res.json().catch(() => ({})); toast.error(err.error || "Failed to send email"); }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full max-w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl border p-6" style={{ background: "var(--bg)", borderColor: "var(--border2)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-jakarta font-bold text-lg mb-0.5" style={{ color: txt }}>Contact {lead.contact_name}</h3>
            <p className="text-[11px] m-0" style={{ color: txt2 }}>{lead.email}</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer" style={{ color: txt3 }}><X size={16} /></button>
        </div>
        <div className="mb-3.5">
          <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt2 }}>Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inpStyle }} />
        </div>
        <div className="mb-4">
          <label className="block text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: txt2 }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} style={{ ...inpStyle, resize: "vertical", fontFamily: "Inter,sans-serif", lineHeight: 1.5 }} />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-[13px] font-medium border cursor-pointer transition-all active:scale-95"
            style={{ background: "var(--elevated)", borderColor: "var(--border2)", color: txt2 }}>Cancel</button>
          <button onClick={handleSend} disabled={sending}
            className="flex-[2] py-2 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white flex items-center justify-center gap-1.5 transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg,${clr[0].bg},${clr[4].bg})` }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? "Sending..." : "Send Email & Move to Contacted"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CRMLeadsUI({ leads: initial, userId, fetchError }: { leads: any[]; userId: string; fetchError?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [,startTx] = useTransition();
  const [leads, setLeads] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [contactLead, setContactLead] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filteredLeads = stageFilter === "all" ? leads : leads.filter(l => l.stage === stageFilter);

  if (fetchError) {
    return (
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        <div className="text-center py-16 px-4">
          <div className="text-5xl mb-4">⚠️</div>
          <h3 className="font-jakarta font-bold text-lg mb-2" style={{ color: txt }}>Failed to load leads</h3>
          <p className="text-sm mb-4" style={{ color: txt2 }}>{fetchError}</p>
          <button onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}>Retry</button>
        </div>
      </div>
    );
  }

  async function moveLead(id: string, stage: string) {
    const lead = leads.find(l => l.id === id);
    const oldStage = STAGES.find(s => s.id === lead?.stage)?.label || lead?.stage;
    const newStage = STAGES.find(s => s.id === stage)?.label || stage;
    const activityNote = `\n[${new Date().toISOString()}] Stage changed: ${oldStage} → ${newStage}`;
    const newNotes = (lead?.notes || "") + activityNote;
    const { error } = await supabase.from("crm_leads").update({ stage, notes: newNotes }).eq("id", id);
    if (error) { toast.error("Failed"); return; }
    setLeads(l => l.map(l => l.id === id ? { ...l, stage, notes: newNotes } : l));
    toast.success(`Moved to ${newStage}`);
  }

  async function addLead(data: any) {
    const { data: lead, error } = await supabase
      .from("crm_leads").insert({ ...data, deal_value: data.deal_value ? parseFloat(data.deal_value) : null }).select().single();
    if (error) { toast.error("Failed: " + error.message); return; }
    setLeads(l => [lead, ...l]);
    setShowAdd(false);
    toast.success("Lead added!");
    startTx(() => router.refresh());
  }

  return (
    <div className="portal-content" style={{ background: "var(--bg)" }}>
      {/* Header with gradient */}
      <div className="mb-5 sm:mb-6">
        <h2 className="font-jakarta font-bold text-xl sm:text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Leads
        </h2>
        <p className="text-[12px] sm:text-xs mt-1" style={{ color: txt3 }}>
          {leads.length} leads in pipeline · {leads.filter(l => !["won","lost"].includes(l.stage)).length} active
        </p>
      </div>

      {/* Stat row + Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { label: "Total Leads", val: leads.length, icon: <Target size={14} />, ci: 0 },
            { label: "Active Pipeline", val: leads.filter(l => !["won","lost"].includes(l.stage)).length, icon: <TrendingUp size={14} />, ci: 3 },
            { label: "Won", val: leads.filter(l => l.stage === "won").length, icon: <Trophy size={14} />, ci: 1 },
          ].map(s => {
            const c = clr[s.ci];
            return (
              <div key={s.label} className="rounded-xl px-3.5 py-2.5 flex-shrink-0 flex items-center gap-2"
                style={{ background: c.bgSoft, border: `1px solid ${c.border}` }}>
                <span style={{ color: c.icon }}>{s.icon}</span>
                <div>
                  <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: txt2 }}>{s.label}</div>
                  <div className="font-jakarta font-bold text-base" style={{ color: c.text }}>{s.val}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold border-none cursor-pointer text-white transition-all active:scale-95 self-start sm:self-auto"
          style={{ background: `linear-gradient(135deg,${clr[4].bg},${clr[4].icon})` }}>
          <Plus size={14} /> Add Lead
        </button>
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
        {[{ id: "all", label: "All Leads", ci: 0 } as any, ...STAGES].map(f => {
          const fc = f.id === "all" ? clr[0] : clr[(STAGES.find(s => s.id === f.id)!).ci];
          const isActive = stageFilter === f.id;
          const count = f.id === "all" ? leads.length : leads.filter(l => l.stage === f.id).length;
          return (
            <button key={f.id} onClick={() => setStageFilter(f.id)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold border transition-all active:scale-95"
              style={{
                background: isActive ? fc.bgSoft : "var(--elevated)",
                borderColor: isActive ? fc.border : "var(--border2)",
                color: isActive ? fc.text : txt2,
              }}>
              <span className="text-xs">{f.icon || "📋"}</span>
              <span>{f.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: isActive ? fc.bgSoft : "var(--elevated)", color: isActive ? fc.text : txt3 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden flex flex-col gap-2">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-sm font-medium" style={{ color: txt3 }}>
            {stageFilter === "all" ? "No leads yet." : "No leads in this stage."}
          </div>
        ) : filteredLeads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="grid px-4 py-2.5 border-b text-[10px] font-bold uppercase tracking-wider"
          style={{ gridTemplateColumns: "minmax(160px,2fr) minmax(160px,1fr) 90px 110px 130px", gap: 8, background: "var(--elevated)", color: txt3, borderColor: "var(--border)" }}>
          <span>Name</span>
          <span>Company / Email</span>
          <span>Source</span>
          <span>Stage</span>
          <span className="text-right">Actions</span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-16 text-center text-sm font-medium" style={{ color: txt3 }}>
            {stageFilter === "all" ? "No leads yet. New contact form submissions will appear here." : "No leads in this stage."}
          </div>
        ) : filteredLeads.map(lead => {
          const stage = STAGES.find(s => s.id === lead.stage);
          const sc = clr[stage?.ci ?? 4];
          return (
            <div key={lead.id} onClick={() => setSelectedLead(lead)}
              className="grid items-center cursor-pointer transition-colors"
              style={{ gridTemplateColumns: "minmax(160px,2fr) minmax(160px,1fr) 90px 110px 130px", gap: 8, padding: "12px 16px", fontSize: 12, borderBottom: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: sc.bgSoft, color: sc.text, border: `1px solid ${sc.border}` }}>
                  {getInitials(lead.contact_name)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate" style={{ color: txt }}>{lead.contact_name}</div>
                  {lead.notes && (
                    <div className="text-[10px] truncate max-w-[200px]" style={{ color: txt3 }}>{lead.notes.slice(0, 60)}{lead.notes.length > 60 ? "…" : ""}</div>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate" style={{ color: txt2 }}>{lead.company || "—"}</div>
                <div className="text-[10px] truncate" style={{ color: txt3 }}>{lead.email || "—"}</div>
              </div>
              <span className="text-[11px] capitalize font-medium" style={{ color: txt2 }}>{lead.source?.replace("_", " ") || "—"}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border w-fit whitespace-nowrap"
                style={{ background: sc.bgSoft, color: sc.text, borderColor: sc.border }}>{stage?.icon} {stage?.label}</span>
              <div className="flex gap-1 justify-end items-center">
                <select value={lead.stage} onClick={e => e.stopPropagation()} onChange={(e) => moveLead(lead.id, e.target.value)}
                  className="text-[10px] py-1 px-1.5 rounded-md cursor-pointer max-w-[110px] border outline-none font-medium"
                  style={{ background: "var(--elevated)", color: txt2, borderColor: "var(--border2)" }}>
                  {STAGES.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}
                </select>
                <span className="text-[9px] whitespace-nowrap" style={{ color: txt3 }}>{formatDate(lead.created_at, { month: "short", day: "numeric" })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onAdd={addLead} />}
      {selectedLead && !contactLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} onContact={() => { setContactLead(selectedLead); }} />
      )}
      {contactLead && <ContactLeadModal lead={contactLead} onClose={() => setContactLead(null)} />}
    </div>
  );
}
