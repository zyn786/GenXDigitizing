// @ts-nocheck
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import {
  Send, Loader2, CheckCircle2, X, Mail, Inbox, ChevronDown, ChevronUp,
  Clock, User, Search, ArrowLeft, Reply, Paperclip, Trash2, Menu,
} from "lucide-react";

/* ── tokens ─────────────────────────────────────────── */
var cTxt   = "var(--txt)";
var cTxt2  = "var(--txt2)";
var cTxt3  = "var(--txt3)";
var cSurf  = "var(--surface)";
var cBord  = "var(--border)";
var cBord2 = "var(--border2)";
var cElev  = "var(--elevated)";

/* ── from addresses ─────────────────────────────────── */
var FROM_OPTIONS = [
  { email: "support@genxdigitizing.com", label: "Support" },
  { email: "noreply@genxdigitizing.com", label: "No-Reply" },
  { email: "orders@genxdigitizing.com",  label: "Orders" },
  { email: "billing@genxdigitizing.com", label: "Billing" },
];

/* ── color palette ──────────────────────────────────── */
var CLR = {
  blue:   { bg: "rgba(59,130,246,0.1)",   icon: "#3B82F6", text: "#1D4ED8" },
  green:  { bg: "rgba(16,185,129,0.1)",   icon: "#10B981", text: "#047857" },
  purple: { bg: "rgba(139,92,246,0.1)",   icon: "#8B5CF6", text: "#6D28D9" },
  orange: { bg: "rgba(249,115,22,0.1)",   icon: "#F97316", text: "#C2410C" },
};

var inpStyle: React.CSSProperties = {
  width: "100%", background: cElev, border: "1px solid " + cBord2,
  borderRadius: 10, padding: "10px 14px", color: cTxt, fontSize: 13,
  outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box",
};

/* ── types ──────────────────────────────────────────── */
type SentEmail = {
  id: string; to_email: string; from_email?: string; subject: string; body: string;
  sent_at: string; resend_id?: string; attachments?: string;
};
type ReceivedEmail = {
  id: string; from_email: string; to_email: string; cc_emails?: string; subject: string;
  body_html?: string; body_text?: string; received_at: string; attachments_meta?: string;
};
type AttachFile = {
  name: string; size: number; type: string; data: string; // base64
};

/* ── helpers ────────────────────────────────────────── */
function fmtDate(iso: string) {
  var d = new Date(iso);
  var now = new Date();
  var isToday = d.toDateString() === now.toDateString();
  var time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  var diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function stripTags(html?: string) {
  if (!html) return "";
  var div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

function avLetter(email: string) {
  var name = email.split("@")[0] || "";
  return (name[0] || "?").toUpperCase();
}

function avColor(email: string) {
  var colors = ["#3B82F6","#10B981","#8B5CF6","#F97316","#EC4899","#06B6D4","#EF4444","#6366F1"];
  var hash = 0;
  for (var i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/* ── component ──────────────────────────────────────── */
interface Props {
  userId: string;
  sentEmails: SentEmail[];
  receivedEmails: ReceivedEmail[];
}

export function EmailComposer({ userId, sentEmails: initSent, receivedEmails: initRecv }: Props) {
  /* state */
  var [folder, setFolder] = useState("inbox");
  var [selectedId, setSelectedId] = useState(null);
  var [search, setSearch] = useState("");
  var [showList, setShowList] = useState(true);
  var [sidebarOpen, setSidebarOpen] = useState(false);

  /* compose */
  var [to, setTo] = useState("");
  var [from, setFrom] = useState(FROM_OPTIONS[0].email);
  var [subject, setSubject] = useState("");
  var [message, setMessage] = useState("");
  var [sending, setSending] = useState(false);
  var [sentOk, setSentOk] = useState(false);
  var [attachments, setAttachments] = useState([]);

  var [sentList, setSentList] = useState(initSent);
  var [inboxList] = useState(initRecv);
  var fileRef = useRef(null);

  /* filter */
  var list = folder === "inbox" ? inboxList : sentList;
  var filtered = list.filter(function (e) {
    if (!search) return true;
    var q = search.toLowerCase();
    var body = folder === "inbox" ? (e.body_text || stripTags(e.body_html) || "") : (e.body || "");
    var sender = folder === "inbox" ? e.from_email : e.to_email;
    return (e.subject||"").toLowerCase().indexOf(q) !== -1 ||
           sender.toLowerCase().indexOf(q) !== -1 ||
           body.toLowerCase().indexOf(q) !== -1;
  });

  var selected = list.find(function (e) { return e.id === selectedId; }) || null;

  /* ── attach ─────────────────────────────────────── */
  function handleAttach(e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (f.size > 10 * 1024 * 1024) { toast.error(f.name + " is too large (max 10MB)"); continue; }
      var reader = new FileReader();
      reader.onload = (function (file) {
        return function (ev) {
          var base64 = (ev.target.result || "").split(",")[1] || "";
          setAttachments(function (prev) { return prev.concat([{ name: file.name, size: file.size, type: file.type, data: base64 }]); });
        };
      })(f);
      reader.readAsDataURL(f);
    }
    e.target.value = "";
  }

  function removeAttach(idx: number) {
    setAttachments(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
  }

  /* ── send ───────────────────────────────────────── */
  function doSend() {
    if (!to.trim() || !subject.trim() || !message.trim()) { toast.error("Fill all fields"); return; }
    setSending(true);
    fetch("/api/admin/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: to.trim(), subject: subject.trim(), message: message.trim(),
        userId: userId, from: from.trim(),
        attachments: attachments.map(function (a) { return { filename: a.name, content: a.data, content_type: a.type }; }),
      }),
    }).then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.success && d.error) { toast.error(d.error); return; }
        var entry = { id: d.id || crypto.randomUUID(), to_email: to.trim(), from_email: from.trim(), subject: subject.trim(), body: message.trim(), sent_at: new Date().toISOString(), resend_id: d.id, attachments: attachments.map(function(a){return a.name;}).join(", ") };
        setSentList(function (p) { return [entry].concat(p); });
        setSentOk(true);
        toast.success("Email sent");
      })
      .catch(function () { toast.error("Network error"); })
      .finally(function () { setSending(false); });
  }

  function resetCompose() {
    setTo(""); setFrom(FROM_OPTIONS[0].email); setSubject(""); setMessage("");
    setAttachments([]); setSentOk(false); setFolder("inbox"); setShowList(true);
  }

  function replyTo(email: string, subj: string) {
    setTo(email); setSubject("Re: " + subj); setMessage(""); setAttachments([]);
    setFolder("compose"); setShowList(false); setSentOk(false);
  }

  function openEmail(id: string) { setSelectedId(id); setShowList(false); }

  function goToList() { setShowList(true); setSelectedId(null); }

  function navFolder(f: string) {
    setFolder(f); setSelectedId(null); setSearch(""); setShowList(true);
    setSentOk(false); setSidebarOpen(false);
  }

  function startCompose() { setFolder("compose"); setSentOk(false); setShowList(false); setSidebarOpen(false); }

  var showDetail = !showList && selected && folder !== "compose";
  var showCompose = folder === "compose";

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <div className="email-client">
      <style dangerouslySetInnerHTML={{ __html: "\n.email-client { display:flex; height:calc(100vh - 140px); position:relative; min-height:560px; border-radius:16px; overflow:hidden; background:" + cSurf + "; border:1px solid " + cBord + "; }\n.email-sidebar { width:200px; flex-shrink:0; border-right:1px solid " + cBord + "; display:flex; flex-direction:column; background:rgba(0,0,0,0.01); }\n.email-main { flex:1; display:flex; flex-direction:column; min-width:0; }\n.email-list-panel { width:380px; flex-shrink:0; border-right:1px solid " + cBord + "; display:flex; flex-direction:column; }\n.email-detail-panel { flex:1; display:flex; flex-direction:column; min-width:0; }\n\n@media (max-width: 768px) {\n  .email-client { flex-direction:column; height:calc(100dvh - 100px); border-radius:12px; }\n  .email-sidebar { display:none; }\n  .email-sidebar.open { display:flex; position:fixed; z-index:40; top:0; left:0; bottom:0; width:240px; box-shadow:4px 0 20px rgba(0,0,0,0.2); }\n  .email-list-panel { width:100%; border-right:none; }\n  .email-detail-panel { width:100%; position:absolute; inset:0; z-index:10; background:" + cSurf + "; }\n}\n@media (min-width: 769px) and (max-width: 1100px) {\n  .email-list-panel { width:280px; }\n}\n" }} />

      {/* ═══ SIDEBAR BACKDROP (mobile) ═══ */}
      {sidebarOpen && (
        <div className="email-sidebar-backdrop" onClick={function(){setSidebarOpen(false)}}
          style={{ display: "none", position: "fixed", inset: 0, zIndex: 35, background: "rgba(0,0,0,0.3)" }} />
      )}

      {/* ═══ MOBILE HEADER ═══════════════════════ */}
      <div className="email-mobile-header" style={{ display: "none", padding: "8px 12px", borderBottom: "1px solid " + cBord, alignItems: "center", gap: 8 }}>
        <button type="button" onClick={function(){setSidebarOpen(!sidebarOpen)}} style={{ background: "none", border: "none", cursor: "pointer", color: cTxt, padding: 4, display: "flex" }}><Menu size={20} /></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: cTxt, fontFamily: "Syne, sans-serif" }}>
          {showCompose ? "Compose" : folder === "inbox" ? "Inbox" : "Sent"}
        {!showCompose && showList && (
          <button type="button" onClick={startCompose} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, background: CLR.blue.icon, border: "none", cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 700, fontFamily: "Inter, sans-serif", padding: "6px 12px", borderRadius: 8 }}>
            <Mail size={13} /> Compose
          </button>
        )}
        </span>
        {!showCompose && !showList && (
          <button type="button" onClick={goToList} style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: CLR.blue.icon, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", padding: 0 }}>
            <ArrowLeft size={14} /> List
          </button>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: "@media (max-width: 768px) { .email-mobile-header { display:flex !important; } .email-sidebar { display:none !important; } .email-sidebar.open { display:flex !important; } .email-sidebar-backdrop { display:block !important; } }\n" }} />

      {/* ═══ SIDEBAR ══════════════════════════════ */}
      <div className={"email-sidebar" + (sidebarOpen ? " open" : "")}>
        <div style={{ padding: "14px 12px" }}>
          <button type="button" onClick={startCompose} style={{
            width: "100%", padding: "10px 16px", borderRadius: 12, border: "none",
            background: folder === "compose" ? "linear-gradient(135deg, #1D4ED8, #6D28D9)" : "linear-gradient(135deg, #2563EB, #7C3AED)",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "Inter, sans-serif", display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(37,99,235,0.25)", transition: "all 0.15s",
          }}><Mail size={14} /> Compose</button>
        </div>
        <div style={{ flex: 1, padding: "0 8px" }}>
          {[
            { key: "inbox", label: "Inbox", count: inboxList.length, icon: <Inbox size={16} /> },
            { key: "sent",  label: "Sent",  count: sentList.length,  icon: <Send size={16} /> },
          ].map(function (f) {
            var act = folder === f.key;
            return (
              <button key={f.key} type="button" onClick={function(){navFolder(f.key);}} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, marginBottom: 2,
                border: "none", background: act ? CLR.blue.bg : "transparent",
                color: act ? CLR.blue.text : cTxt2, fontSize: 13, fontWeight: act ? 700 : 500,
                cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 0.12s",
              }}>
                <span style={{ color: act ? CLR.blue.icon : cTxt3, display: "flex" }}>{f.icon}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{f.label}</span>
                {f.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: act ? CLR.blue.icon : cBord2, color: act ? "#fff" : cTxt3, minWidth: 20, textAlign: "center" }}>{f.count}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid " + cBord }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: cTxt3, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Send from</div>
          <div style={{ fontSize: 11, color: cTxt2, fontWeight: 600 }}>support@genxdigitizing.com</div>
          <div style={{ fontSize: 10, color: cTxt3, marginTop: 1 }}>via Resend</div>
        </div>
      </div>

      {/* ═══ MAIN ════════════════════════════════ */}
      <div className="email-main">
        {/* ── COMPOSE VIEW ──────────────────────── */}
        {showCompose && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid " + cBord, display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" onClick={function(){navFolder("inbox");}} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: cTxt2, fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif", padding: 0 }}>
                <ArrowLeft size={14} /> Back
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: cTxt, fontFamily: "Syne, sans-serif" }}>New Message</span>
            </div>

            {sentOk ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: CLR.green.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle2 size={32} style={{ color: CLR.green.icon }} />
                  </div>
                  <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: 20, fontWeight: 700, color: cTxt, margin: "0 0 4px" }}>Message Sent</h3>
                  <p style={{ fontSize: 13, color: cTxt2, margin: "0 0 24px" }}>Delivered to <strong>{to}</strong></p>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <button type="button" onClick={resetCompose} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid " + cBord, background: cSurf, color: cTxt, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Back to Inbox</button>
                    <button type="button" onClick={function(){setSentOk(false);setTo("");setSubject("");setMessage("");setAttachments([]);}} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #2563EB, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Send Another</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
                <div style={{ maxWidth: 700 }}>
                  {/* From */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="efld">From</label>
                    <select style={{ ...inpStyle, cursor: "pointer", appearance: "auto" }} value={from} onChange={function(e){setFrom(e.target.value);}}>
                      {FROM_OPTIONS.map(function(f){return <option key={f.email} value={f.email}>{f.label} &lt;{f.email}&gt;</option>;})}
                    </select>
                  </div>

                  {/* To */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="efld">To</label>
                    <input style={inpStyle} type="text" placeholder="recipient@example.com — commas for multiple" value={to} onChange={function(e){setTo(e.target.value);}} />
                  </div>

                  {/* Subject */}
                  <div style={{ marginBottom: 12 }}>
                    <label className="efld">Subject</label>
                    <input style={inpStyle} type="text" placeholder="Email subject..." value={subject} onChange={function(e){setSubject(e.target.value);}} />
                  </div>

                  {/* Body */}
                  <div style={{ marginBottom: 12 }}>
                    <textarea style={{ ...inpStyle, minHeight: 220, resize: "vertical", lineHeight: 1.7 }}
                      placeholder="Write your message...&#10;Supports HTML for rich formatting." value={message}
                      onChange={function(e){setMessage(e.target.value);}} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                      <span style={{ fontSize: 10, color: cTxt3 }}>HTML supported</span>
                      <span style={{ fontSize: 10, color: cTxt3 }}>{message.length} chars</span>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <input ref={fileRef} type="file" multiple onChange={handleAttach} style={{ display: "none" }} />
                      <button type="button" onClick={function(){fileRef.current && fileRef.current.click();}} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px dashed " + cBord2, background: "transparent", color: cTxt2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                        <Paperclip size={13} /> Attach files
                      </button>
                      <span style={{ fontSize: 11, color: cTxt3 }}>Max 10MB each</span>
                    </div>
                    {attachments.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {attachments.map(function(a, i){return(
                          <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: CLR.blue.bg, borderRadius: 8, border: "1px solid rgba(59,130,246,0.2)", fontSize: 11, color: CLR.blue.text, fontWeight: 600 }}>
                            <Paperclip size={11} /> {a.name} <span style={{ color: cTxt3, fontWeight: 400 }}>({fmtSize(a.size)})</span>
                            <button type="button" onClick={function(){removeAttach(i);}} style={{ background: "none", border: "none", cursor: "pointer", color: cTxt3, padding: "0 2px", display: "flex" }}><X size={12} /></button>
                          </div>
                        );})}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button type="button" onClick={function(){navFolder("inbox");}} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid " + cBord, background: "transparent", color: cTxt2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <X size={14} /> Discard
                    </button>
                    <button type="button" onClick={doSend} disabled={sending} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: sending ? "#94A3B8" : "linear-gradient(135deg, #2563EB, #7C3AED)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer", fontFamily: "Inter, sans-serif", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {sending ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Send size={14} /> Send</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INBOX / SENT LIST + DETAIL ─────────── */}
        {!showCompose && (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {/* List panel */}
            <div className="email-list-panel" style={{ display: (showList || (!showList && !selected)) ? "flex" : "none" }}>
              {/* Search */}
              <div style={{ padding: "10px 12px", borderBottom: "1px solid " + cBord }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: cTxt3, pointerEvents: "none" }} />
                  <input style={{ ...inpStyle, paddingLeft: 34, paddingTop: 7, paddingBottom: 7, fontSize: 12 }}
                    placeholder={"Search " + folder + "..."} value={search}
                    onChange={function(e){setSearch(e.target.value);}} />
                </div>
              </div>

              {/* List */}
              <div style={{ flex: 1, overflow: "auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: CLR.blue.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      {folder === "inbox" ? <Inbox size={22} style={{ color: CLR.blue.icon }} /> : <Send size={22} style={{ color: CLR.blue.icon }} />}
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: cTxt, margin: "0 0 4px" }}>{search ? "No matches" : folder === "inbox" ? "Inbox empty" : "No sent emails"}</p>
                    <p style={{ fontSize: 12, color: cTxt3, margin: 0 }}>{search ? "Try different search" : folder === "inbox" ? "Configure inbound webhook to receive emails" : "Send your first email"}</p>
                  </div>
                ) : filtered.map(function(email){
                  var isSel = selectedId === email.id;
                  var preview = folder === "inbox" ? (email.body_text || stripTags(email.body_html) || "") : (email.body || "");
                  var sender = folder === "inbox" ? email.from_email : email.to_email;
                  var dateField = folder === "inbox" ? email.received_at : email.sent_at;
                  return (
                    <div key={email.id} onClick={function(){openEmail(email.id);}} style={{
                      padding: "12px 14px", borderBottom: "1px solid " + cBord,
                      background: isSel ? CLR.blue.bg : "transparent", cursor: "pointer",
                      borderLeft: isSel ? "3px solid " + CLR.blue.icon : "3px solid transparent", transition: "background 0.1s",
                    }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: avColor(sender), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{avLetter(sender)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: 13, fontWeight: isSel ? 700 : 600, color: cTxt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sender}</span>
                            <span style={{ fontSize: 10, color: cTxt3, flexShrink: 0, marginLeft: 8 }}>{fmtDate(dateField)}</span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: isSel ? CLR.blue.text : cTxt, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject || "(no subject)"}</div>
                          <div style={{ fontSize: 11, color: cTxt3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trunc(preview, 80)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div className="email-detail-panel" style={{ display: showDetail ? "flex" : "none" }}>
              {showDetail && selected && (
                <EmailDetail
                  email={selected}
                  folder={folder}
                  onBack={goToList}
                  onReply={function(){replyTo(folder==="inbox"?selected.from_email:selected.to_email, selected.subject);}}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global label styles */}
      <style dangerouslySetInnerHTML={{ __html: ".efld{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:" + cTxt3 + ";margin-bottom:5px;}\n@media (max-width: 768px) {\n  .email-list-panel { width:100% !important; border-right:none !important; }\n  .email-detail-panel { width:100% !important; }\n}\n@media (min-width: 769px) and (max-width: 1100px) {\n  .email-list-panel { width:280px !important; }\n}\n" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Email Detail Sub-Component
   ═══════════════════════════════════════════════════════ */
function EmailDetail({ email, folder, onBack, onReply }: {
  email: any; folder: string; onBack: () => void; onReply: () => void;
}) {
  return (
    <>
      <div style={{ padding: "12px 18px", borderBottom: "1px solid " + cBord, display: "flex", alignItems: "center", gap: 10 }}>
        <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: cTxt2, padding: 0 }}><ArrowLeft size={16} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: cTxt, fontFamily: "Syne, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.subject || "(no subject)"}</div>
        </div>
        <button type="button" onClick={onReply} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid " + cBord, background: cSurf, color: cTxt2, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", whiteSpace: "nowrap" }}>
          <Reply size={12} /> Reply
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        {/* Meta card */}
        <div style={{ marginBottom: 20, padding: "14px 16px", background: cElev, borderRadius: 12, border: "1px solid " + cBord2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: avColor(folder === "inbox" ? email.from_email : email.to_email), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
              {avLetter(folder === "inbox" ? email.from_email : email.to_email)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: cTxt, overflow: "hidden", textOverflow: "ellipsis" }}>
                {folder === "inbox" ? email.from_email : email.to_email}
              </div>
              <div style={{ fontSize: 11, color: cTxt3, marginTop: 1 }}>
                {fmtFullDate(folder === "inbox" ? email.received_at : email.sent_at)}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: cTxt2, flexWrap: "wrap" }}>
            <span><strong style={{ color: cTxt3 }}>From:</strong> {email.from_email || (folder === "inbox" ? email.from_email : "support@genxdigitizing.com")}</span>
            <span><strong style={{ color: cTxt3 }}>To:</strong> {email.to_email}</span>
            {email.cc_emails && <span><strong style={{ color: cTxt3 }}>CC:</strong> {email.cc_emails}</span>}
            {email.attachments_meta && <span><strong style={{ color: cTxt3 }}>Attachments:</strong> {
              (function(){
                try { return JSON.parse(email.attachments_meta).map(function(a){return a.filename;}).join(", "); }
                catch(e){ return email.attachments_meta; }
              })()
            }</span>}
            {email.attachments && <span><strong style={{ color: cTxt3 }}>Attachments:</strong> {email.attachments}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: 14, color: cTxt, lineHeight: 1.8 }}>
          {folder === "inbox" ? (
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body_html || email.body_text || "(empty)") }} />
          ) : (
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{email.body}</div>
          )}
        </div>
      </div>
    </>
  );
}
