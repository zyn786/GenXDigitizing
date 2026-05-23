// @ts-nocheck
"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter }    from "next/navigation";
import { toast }        from "sonner";
import { Send }         from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelative, getInitials } from "@/lib/utils";

export function AdminMsgsUI({ messages, currentUserId }: { messages: any[]; currentUserId: string }) {
  const router     = useRouter();
  const supabase   = createClient();
  const [,startTx] = useTransition();

  // Build threads
  const threadMap = new Map<string, { participant: any; messages: any[]; unread: number; lastMsg: any }>();
  for (const msg of messages) {
    const sender    = msg.sender;
    const recipient = msg.recipient;
    if (!sender || !recipient) { continue; }
    const other = sender.id !== currentUserId ? sender : recipient;
    const key   = other.id;
    if (!threadMap.has(key)) {
      threadMap.set(key, { participant: other, messages: [], unread: 0, lastMsg: null });
    }
    const thread = threadMap.get(key)!;
    thread.messages.push(msg);
    if (!msg.is_read && msg.recipient?.id === currentUserId) { thread.unread++; }
    if (!thread.lastMsg || new Date(msg.created_at) > new Date(thread.lastMsg.created_at)) {
      thread.lastMsg = msg;
    }
  }
  const threads = Array.from(threadMap.values()).sort((a, b) =>
    new Date(b.lastMsg?.created_at ?? 0).getTime() - new Date(a.lastMsg?.created_at ?? 0).getTime()
  );

  const [selId, setSelId] = useState<string | null>(threads[0]?.participant.id ?? null);
  const [body,  setBody]  = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selThread = threads.find(t => t.participant.id === selId);
  const threadMsgs = (selThread?.messages ?? []).sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadMsgs.length]);

  async function send() {
    if (!body.trim() || !selId) { return; }
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        from_user: currentUserId,
        to_user:   selId,
        body:      body.trim(),
      });
      if (error) { toast.error("Failed to send"); return; }
      setBody("");
      startTx(() => router.refresh());
    } finally {
      setSending(false);
    }
  }

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", margin: "0 24px 24px", border: "1px solid var(--border)", borderRadius: 14, minHeight: 500 }}>
      {/* Thread list */}
      <div style={{ width: 250, borderRight: "1px solid var(--border)", background: "var(--surface)", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 13 }}>Conversations</span>
          {totalUnread > 0 && (
            <span style={{ padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#F43F5E", color: "#fff" }}>{totalUnread}</span>
          )}
        </div>
        {threads.length === 0 ? (
          <div style={{ padding: "30px 14px", textAlign: "center", fontSize: 13, color: "var(--txt3)" }}>No messages yet</div>
        ) : threads.map(t => (
          <div key={t.participant.id} onClick={() => setSelId(t.participant.id)}
            style={{ padding: "11px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selId === t.participant.id ? "var(--border)" : "transparent", borderLeft: selId === t.participant.id ? "2px solid #22D3EE" : "2px solid transparent", transition: "all .1s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{t.participant.full_name ?? "User"}</span>
              {t.unread > 0 && (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#F43F5E", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>{t.unread}</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--txt3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.lastMsg?.body ?? ""}
            </div>
            <div style={{ fontSize: 10, color: "var(--txt3)", marginTop: 3 }}>
              {t.lastMsg ? formatRelative(t.lastMsg.created_at) : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Conversation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--elevated)" }}>
        {!selThread ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: .4 }}>
            <p style={{ fontSize: 13, color: "var(--txt3)" }}>Select a conversation</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                {getInitials(selThread.participant.full_name ?? "?")}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{selThread.participant.full_name}</div>
                <div style={{ fontSize: 11, color: "var(--txt3)", textTransform: "capitalize" }}>{selThread.participant.role}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
              {threadMsgs.map(msg => {
                const isMe = msg.sender?.id === currentUserId;
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: 4 }}>
                    <div style={{ fontSize: 10, color: "var(--txt3)" }}>
                      {isMe ? "You" : selThread.participant.full_name} · {formatRelative(msg.created_at)}
                    </div>
                    <div style={{ maxWidth: "75%", padding: "9px 13px", borderRadius: isMe ? "12px 12px 3px 12px" : "12px 12px 12px 3px", fontSize: 13, lineHeight: 1.5, ...(isMe ? { background: "linear-gradient(135deg,#7C3AED,#A855F7)", color: "#fff" } : { background: "#181836", color: "var(--txt2)" }) }}>
                      {msg.body}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: "11px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
              <input
                value={body}
                onChange={e => setBody(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type a message…"
                style={{ flex: 1, background: "#181836", border: "1px solid var(--border2)", borderRadius: 9, padding: "9px 13px", color: "var(--txt)", fontSize: 13, outline: "none", fontFamily: "Inter,sans-serif" }}
              />
              <button onClick={send} disabled={!body.trim() || sending}
                style={{ padding: "9px 14px", borderRadius: 9, background: "linear-gradient(135deg,#7C3AED,#D946EF)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", opacity: !body.trim() ? .5 : 1 }}>
                <Send size={15} color="#fff" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
