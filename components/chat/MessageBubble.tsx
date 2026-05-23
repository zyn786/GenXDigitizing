"use client";

import { motion } from "framer-motion";
import { Check, CheckCheck, FileText, Image, FileArchive, Play, Pause, Trash2, Download, Reply, Edit2 } from "lucide-react";
import { useState, useRef, useCallback, memo } from "react";
import { useChat } from "./ChatProvider";
import type { Message, Attachment } from "./types";

const IMG_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg|avif)$/i;

// Strip reply and attachment markers from display text
function cleanContent(raw: string): string {
  if (!raw) return "";
  let text = raw;
  // Remove --reply-- block (handle variations: \n, space, missing trailing marker)
  const replyStart = text.indexOf("--reply--");
  if (replyStart >= 0 && replyStart <= 2) {
    const afterMarker = text.slice(replyStart + 9); // skip "--reply--"
    // Try: \n{json}\n--reply--\n
    const endMarker = afterMarker.indexOf("\n--reply--");
    if (endMarker >= 0) {
      // Skip past the end marker + newline
      const afterEnd = afterMarker.indexOf("\n", endMarker + 11);
      text = afterEnd >= 0 ? afterMarker.slice(afterEnd + 1) : afterMarker.slice(endMarker + 11);
    } else {
      // Fallback: just strip the first line if it looks like JSON
      const newlineIdx = afterMarker.indexOf("\n");
      if (newlineIdx >= 0 && (afterMarker.startsWith("{") || afterMarker.startsWith(" "))) {
        text = afterMarker.slice(newlineIdx + 1);
      }
    }
  }
  // Remove --attachments-- block
  const attIdx = text.indexOf("\n--attachments--\n");
  if (attIdx !== -1) text = text.slice(0, attIdx);
  return text.trim();
}

// ReplyPreview component - Telegram-style reply block
function ReplyPreview({ replyTo, isOwn, onClick }: {
  replyTo: { id: string; content: string; senderName: string };
  isOwn: boolean;
  onClick: () => void;
}) {
  const preview = replyTo.content?.length > 60
    ? replyTo.content.slice(0, 60) + "…"
    : replyTo.content || "Attachment";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg mb-2 overflow-hidden cursor-pointer border-none p-0 active:scale-[0.98] transition-transform"
      style={{ background: isOwn ? "rgba(255,255,255,0.1)" : "var(--elevated)" }}>
      <div className="flex items-stretch"
        style={{ borderLeft: isOwn ? "3px solid rgba(255,255,255,0.25)" : "3px solid #7C3AED" }}>
        <div className="flex-1 min-w-0 px-2.5 py-1.5 overflow-hidden">
          <p className="text-[11px] font-semibold truncate leading-tight"
            style={{ color: isOwn ? "rgba(255,255,255,0.8)" : "#7C3AED" }}>
            {replyTo.senderName || "User"}
          </p>
          <p className="text-[11px] truncate leading-tight mt-0.5"
            style={{ color: isOwn ? "rgba(255,255,255,0.6)" : "var(--txt2)" }}>
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}

const FilePreview = memo(function FilePreview({ att }: { att: Attachment }) {
  const { name, type, size, url } = att;
  const ext = name.split(".").pop()?.toUpperCase() ?? "";
  const sizeStr = size > 1_000_000 ? `${(size / 1_000_000).toFixed(1)} MB` : `${Math.round(size / 1000)} KB`;
  const isImage = IMG_EXTENSIONS.test(name);

  const icon =
    type === "image" || isImage ? <Image size={16} /> :
    type === "embroidery" ? "🧵" :
    type === "vector" ? "✏️" :
    type === "archive" ? <FileArchive size={16} /> :
    <FileText size={16} />;

  const accent =
    type === "image" || isImage ? "#0E7490" :
    type === "embroidery" ? "#7C3AED" :
    type === "vector" ? "#D97706" :
    type === "archive" ? "#E11D48" :
    "#4B5563";

  const [showFull, setShowFull] = useState(false);
  const [longPress, setLongPress] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleTouchStart = useCallback(() => {
    pressTimer.current = setTimeout(() => setLongPress(true), 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (longPress) {
      setLongPress(false);
    }
  }, [longPress]);

  const downloadFile = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  }, [url, name]);

  // Image preview inside chat
  if (isImage && url) {
    return (
      <div className="relative">
        {showFull ? (
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowFull(false)}>
            <img src={url} alt={name} className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        ) : null}
        <div
          className="relative rounded-xl overflow-hidden cursor-pointer group/img border border-[var(--border2)]"
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => !longPress && setShowFull(true)}
        >
          <img
            src={url}
            alt={name}
            className="w-full max-w-[240px] max-h-[240px] object-cover"
            loading="lazy"
          />
          {/* Download button on hover/long press */}
          <button
            onClick={(e) => { e.stopPropagation(); downloadFile(); }}
            className={`absolute bottom-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center
              bg-black/50 text-white border-none cursor-pointer transition-opacity
              ${longPress ? "opacity-100" : "opacity-0 group-hover/img:opacity-100"}`}
          >
            <Download size={14} />
          </button>
          <div className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/50 text-white">
            {sizeStr}
          </div>
        </div>
      </div>
    );
  }

  // Non-image file — download card
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg no-underline cursor-pointer
        bg-[var(--elevated)] border border-[var(--border2)]
        hover:border-[var(--border3)] transition-all group/file"
      onClick={downloadFile}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
        style={{ background: `${accent}15`, color: accent }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-[#1F2937] truncate max-w-[200px] sm:max-w-[280px]">{name}</p>
        <p className="text-[10px] text-[#4B5563]">
          {ext} · {sizeStr}
        </p>
      </div>
      <div className="w-7 h-7 rounded-md flex items-center justify-center
        bg-[var(--border)] text-[#4B5563] opacity-0 group-hover/file:opacity-100 transition-opacity flex-shrink-0">
        <Download size={12} />
      </div>
    </div>
  );
});

function VoiceNotePlayer({ duration, played }: { duration: number; played: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); setIsPlaying(false); return 100; }
        return p + 1;
      });
    }, duration * 10);
  };

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <div className="flex items-center gap-2.5 min-w-[160px]">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          bg-[#7C3AED] text-white border-none cursor-pointer hover:bg-[#7C3AED] transition-colors"
      >
        {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full bg-[var(--border2)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#0891B2]"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <p className="text-[10px] text-[#4B5563] mt-0.5">
          {isPlaying ? "Playing..." : `${mins}:${secs.toString().padStart(2, "0")}`}
          {played && !isPlaying && " · Played"}
        </p>
      </div>
    </div>
  );
}

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const { deleteMessage, editMessage, setReplyTo, canDeleteMessage, canEditMessage, currentUserRole } = useChat();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const canDelete = canDeleteMessage(message);
  const canEdit = canEditMessage(message);

  const handleReply = () => {
    setReplyTo({
      id: message.id,
      content: cleanContent(message.content || "") || "Attachment",
      senderName: message.senderName,
    });
    setShowActions(false);
  };

  const handleStartEdit = () => {
    setEditText(cleanContent(message.content || ""));
    setIsEditing(true);
    setShowActions(false);
  };

  const handleSaveEdit = () => {
    if (editText.trim()) editMessage(message.id, editText.trim());
    setIsEditing(false);
  };

  const initials = message.senderName
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Use fixed format to avoid hydration mismatch (server vs client locale)
  const timeStr = `${String(message.timestamp.getHours()).padStart(2, "0")}:${String(message.timestamp.getMinutes()).padStart(2, "0")}`;

  const tick =
    message.status === "sending" ? (
      <span className="text-[10px] opacity-40">●</span>
    ) : message.status === "sent" ? (
      <Check size={12} className="opacity-40" />
    ) : message.status === "delivered" ? (
      <CheckCheck size={12} className="opacity-50" />
    ) : message.status === "read" ? (
      <CheckCheck size={12} className="text-[#16A34A]" />
    ) : null;

  return (
    <motion.div
      id={`msg-${message.id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 mb-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar — incoming only */}
      {!isOwn && (
        <div className="flex-shrink-0 self-end mb-0.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center
            text-[10px] font-bold text-white select-none
            bg-gradient-to-br from-[#4B5563] to-[#1F2937]">
            {initials}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[75%] min-w-0 ${isOwn ? "items-end" : "items-start"}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Linked order badge */}
        {message.linkedOrder && currentUserRole !== "client" && (
          <div
            className="text-[10px] px-2.5 py-1 rounded-xl mb-1.5 font-medium inline-flex items-center gap-1.5
              bg-[var(--surface)] border border-[var(--border)] shadow-sm text-[#374151] max-w-full cursor-pointer
              hover:border-[var(--border3)] transition-all"
          >
            <span className="font-mono font-bold text-[#1F2937] text-[11px]">{message.linkedOrder.orderNumber}</span>
            <span className="text-[#4B5563]">·</span>
            <span className="truncate text-[#374151]">{message.linkedOrder.designName || message.linkedOrder.service}</span>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/20"
              style={{
                background:
                  message.linkedOrder.status === "delivered" ? "#16A34A" :
                  message.linkedOrder.status === "revision" ? "#DC2626" :
                  message.linkedOrder.status === "review" ? "#D97706" :
                  message.linkedOrder.status === "in_progress" ? "#7C3AED" :
                  message.linkedOrder.status === "approved" ? "#0891B2" :
                  "#D97706",
              }}
            />
          </div>
        )}

        {/* Bubble — WhatsApp-style image messages */}
        {message.attachments && message.attachments.length > 0 &&
          message.attachments.every(a => IMG_EXTENSIONS.test(a.name)) &&
          !cleanContent(message.content || "").trim() ? (
          // Pure image message — WhatsApp style gallery
          <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
            {/* Reply preview for image messages */}
            {message.replyTo?.senderName && (
              <ReplyPreview replyTo={message.replyTo} isOwn={isOwn} onClick={() => {
                const el = document.getElementById(`msg-${message.replyTo!.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-2", "ring-[#7C3AED]", "ring-offset-2", "rounded-lg");
                  setTimeout(() => el.classList.remove("ring-2", "ring-[#7C3AED]", "ring-offset-2", "rounded-lg"), 2000);
                }
              }} />
            )}
            {message.attachments.map((att) => (
              <FilePreview key={att.id} att={att} />
            ))}
            {/* Time + ticks for image messages */}
            <span className={`inline-flex items-center gap-1 px-1 text-[10px] leading-none
              ${isOwn ? "text-[#4B5563] self-end" : "text-[#4B5563] self-start"}`}
            >
              <span>{timeStr}</span>
              {isOwn && tick}
            </span>
            {/* Reply + Edit + Delete for image messages */}
            {showActions && (
              <div className={`flex items-center justify-center ${isOwn ? "self-end" : "self-start"}`}>
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                  <button onClick={(e) => { e.stopPropagation(); handleReply(); }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                      cursor-pointer border-none bg-transparent
                      text-[#4B5563] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all">
                    <Reply size={13} />
                  </button>
                  {canEdit && (
                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                        cursor-pointer border-none bg-transparent
                        text-[#4B5563] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all">
                      <Edit2 size={13} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this message?")) deleteMessage(message.id); }}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                        cursor-pointer border-none bg-transparent
                        text-[#4B5563] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
        // Normal text bubble
        <div
          className={`relative px-3.5 pb-2 pt-2 text-sm leading-[1.5] min-w-0 overflow-hidden [overflow-wrap:anywhere]
            ${isOwn
              ? "rounded-[16px_16px_4px_16px] bg-[#7C3AED] text-white shadow-[0_1px_3px_rgba(109,40,217,0.2)]"
              : "rounded-[16px_16px_16px_4px] bg-[var(--surface)] text-[#1F2937] border border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            }`}
        >
          {/* Reply preview inside bubble */}
          {message.replyTo?.senderName && (
            <ReplyPreview replyTo={message.replyTo} isOwn={isOwn} onClick={() => {
              const el = document.getElementById(`msg-${message.replyTo!.id}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-[#7C3AED]", "ring-offset-2", "rounded-lg");
                setTimeout(() => el.classList.remove("ring-2", "ring-[#7C3AED]", "ring-offset-2", "rounded-lg"), 2000);
              }
            }} />
          )}

          {/* Edit mode or normal display */}
          {isEditing ? (
            <div className="flex flex-col gap-1.5">
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setIsEditing(false); }}
                className={`w-full bg-transparent border-b pb-1 outline-none text-sm ${isOwn ? "text-white border-white/30 placeholder-white/40" : "text-[#1F2937] border-[var(--border3)] placeholder-[var(--txt3)]"}`}
                placeholder="Edit message..."
                autoFocus
              />
              <div className="flex gap-2 text-[10px]">
                <button onClick={handleSaveEdit} className={`${isOwn ? "text-white/80" : "text-[#7C3AED]"} font-semibold`}>Save</button>
                <button onClick={() => setIsEditing(false)} className="text-[#4B5563]">Cancel</button>
                <span className="text-[#4B5563] ml-auto">esc to cancel</span>
              </div>
            </div>
          ) : (
            cleanContent(message.content || "")
          )}

          {/* Attachments — non-image or mixed */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {message.attachments.map((att) => (
                <FilePreview key={att.id} att={att} />
              ))}
            </div>
          )}

          {/* Voice note */}
          {message.voiceNote && (
            <div className="mt-1.5">
              <VoiceNotePlayer duration={message.voiceNote.duration} played={message.voiceNote.played} />
            </div>
          )}

          {/* Floating action bar — Reply / Edit / Delete */}
          {showActions && !isEditing && (
            <div className={`flex items-center justify-center mt-1 mb-1 ${isOwn ? "self-end" : "self-start"}`}>
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
                <button onClick={(e) => { e.stopPropagation(); handleReply(); }}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                    cursor-pointer border-none bg-transparent
                    text-[#4B5563] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all"
                  title="Reply">
                  <Reply size={13} />
                </button>
                {canEdit && (
                  <button onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                      cursor-pointer border-none bg-transparent
                      text-[#4B5563] hover:text-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all"
                    title="Edit">
                    <Edit2 size={13} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this message?")) deleteMessage(message.id); }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                      cursor-pointer border-none bg-transparent
                      text-[#4B5563] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-all"
                    title="Delete">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Time + ticks + edited — inside bubble */}
          <span className={`inline-flex items-center gap-1 ml-2 float-right mt-1 relative -bottom-0.5 -right-0.5
            ${isOwn ? "text-white/60" : "text-[#4B5563]"}`}
          >
            {message.edited && <span className="text-[9px] italic">edited</span>}
            <span className="text-[10px] leading-none">{timeStr}</span>
            {isOwn && tick}
          </span>
        </div>
        )}
      </div>
    </motion.div>
  );
}
