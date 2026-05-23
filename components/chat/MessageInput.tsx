"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Mic, Smile, X, Zap, FileText, Loader2, Square, Plus, Reply,
} from "lucide-react";
import { toast } from "sonner";
import { useChat } from "./ChatProvider";
import { OrderSelector } from "./OrderSelector";
import { QUICK_REPLIES, SAVED_RESPONSES } from "./config";

const EMOJIS = ["😊","👍","🎉","🧵","✨","🔥","💯","🙏","❤️","😂","🤩","👋","💪","⭐","📎","🎯","⚡","🪡","✏️","🧢"];

const ACCEPTED_FILES = ".dst,.emb,.pes,.jef,.xxx,.vip,.hus,.exp,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.ai,.eps,.pdf,.zip,.rar";

interface MessageInputProps {
  showQuickReplies?: boolean;
}

export function MessageInput({ showQuickReplies = false }: MessageInputProps) {
  const {
    sendMessage,
    startTyping,
    activeConversationId,
    replyTo,
    setReplyTo,
    isUploading,
    uploadProgress,
    isRecording,
    startRecording,
    stopRecording,
    recordingTime,
    clientOrders,
    currentUserRole,
  } = useChat();

  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    await sendMessage(trimmed, files.length > 0 ? files : undefined);
    setText("");
    setFiles([]);
    setShowEmoji(false);
    setShowQuick(false);
    inputRef.current?.focus();
  }, [text, files, sendMessage]);

  const handleVoiceToggle = useCallback(async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        await sendMessage("", undefined, blob);
      }
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, sendMessage]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles: File[] = [];
      for (const f of Array.from(e.target.files)) {
        if (f.size > 250 * 1024 * 1024) {
          toast.error(`${f.name} is too large. Maximum 250MB per file.`);
        } else {
          validFiles.push(f);
        }
      }
      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
      e.target.value = "";
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const insertQuickReply = (content: string) => {
    setText(content);
    setShowQuick(false);
    inputRef.current?.focus();
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--surface)] lg:pb-0 safe-area-bottom sticky bottom-2 lg:relative z-10">
      {/* Files preview */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pt-3 flex gap-2 flex-wrap"
          >
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]
                  bg-[var(--elevated)] border border-[var(--border2)] text-[#374151]"
              >
                <FileText size={12} />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <span className="text-[10px] text-[#4B5563]">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="w-4 h-4 rounded flex items-center justify-center
                    hover:bg-[var(--border3)] text-[#4B5563] hover:text-[#1F2937]
                    bg-transparent border-none cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress bar */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2.5 bg-[#7C3AED]/5 border-b border-[#7C3AED]/15 flex items-center gap-3"
          >
            <Loader2 size={14} className="animate-spin text-[#7C3AED] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#7C3AED]">Uploading file...</span>
                <span className="text-[11px] font-bold text-[#7C3AED] tabular-nums">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--elevated)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#0E7490]"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-[#4B5563] mt-1">Please wait while your file uploads...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-[#DC2626]/5 border-b border-[#DC2626]/15
              flex items-center gap-3"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2.5 h-2.5 rounded-full bg-[#DC2626]"
            />
            <span className="text-[12px] font-semibold text-[#DC2626]">
              Recording {formatRecordingTime(recordingTime)}
            </span>
            <span className="text-[11px] text-[#4B5563]">
              Speak now — click stop when done
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick replies panel */}
      <AnimatePresence>
        {showQuick && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border)] overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5563]">
                Quick Replies
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.id}
                    onClick={() => insertQuickReply(qr.content)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg text-left
                      bg-[var(--elevated)] border border-[var(--border2)]
                      text-[#374151] hover:text-[#1F2937] hover:border-[#7C3AED]/30
                      transition-all cursor-pointer max-w-[200px] truncate"
                    title={qr.content}
                  >
                    <span className="text-[#7C3AED] font-semibold">{qr.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4B5563] mt-1">
                Saved Responses
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {SAVED_RESPONSES.map((sr) => (
                  <button
                    key={sr.id}
                    onClick={() => insertQuickReply(sr.content)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg text-left
                      bg-[var(--elevated)] border border-[var(--border2)]
                      text-[#374151] hover:text-[#1F2937] hover:border-[#7C3AED]/30
                      transition-all cursor-pointer max-w-[200px] truncate"
                    title={sr.content}
                  >
                    <span className="text-[#0E7490] font-semibold">{sr.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border)] overflow-hidden"
          >
            <div className="px-4 py-2.5 flex gap-1.5 flex-wrap">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setText((t) => t + emoji);
                    setShowEmoji(false);
                    inputRef.current?.focus();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg
                    hover:bg-[var(--border)] transition-colors cursor-pointer
                    bg-transparent border-none"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply preview — compact premium bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-[var(--border)] bg-[var(--elevated)]/80 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
              <div className="w-1 h-8 rounded-full bg-[#7C3AED] flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-[10px] font-bold text-[#7C3AED] truncate">Replying to {replyTo.senderName}</p>
                <p className="text-[11px] text-[#374151] truncate mt-0.5">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                  text-[#4B5563] hover:text-[#1F2937] hover:bg-[var(--border)]
                  transition-all cursor-pointer bg-transparent border-none"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILES}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Paperclip — clients only (admin uses + menu) */}
          {currentUserRole === "client" && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-8 h-8 rounded-full flex items-center justify-center
              text-[#4B5563] hover:text-[#1F2937] hover:bg-[var(--border)]
              transition-all cursor-pointer bg-transparent border-none
              disabled:opacity-40 disabled:cursor-not-allowed"
            title="Attach files"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
          </button>
          )}
          {currentUserRole !== "client" && <OrderSelector orders={clientOrders} />}
          {currentUserRole !== "client" && showQuickReplies && (
          <div className="relative">
            <button
              onClick={() => setShowPlusMenu((v) => !v)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer
                bg-transparent border-none ${showPlusMenu ? "text-[#7C3AED] bg-[#7C3AED]/10 rotate-45" : "text-[#4B5563] hover:text-[#1F2937] hover:bg-[var(--border)]"}`}
              title="More options"
            >
              <Plus size={20} />
            </button>
            {/* Dropup menu — 2 options only */}
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 flex flex-col gap-1 p-1.5 rounded-2xl
                    bg-[var(--surface)] border border-[var(--border)] shadow-lg min-w-[160px] z-20"
                >
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
                    disabled={isUploading}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium
                      text-[#374151] hover:bg-[var(--elevated)] hover:text-[#1F2937]
                      transition-all cursor-pointer bg-transparent border-none text-left
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                    <span>Attach Files</span>
                  </button>
                  {showQuickReplies && (
                    <button
                      onClick={() => { setShowPlusMenu(false); setShowQuick((v) => !v); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium
                        transition-all cursor-pointer bg-transparent border-none text-left
                        ${showQuick ? "text-[#7C3AED] bg-[#7C3AED]/10" : "text-[#374151] hover:bg-[var(--elevated)] hover:text-[#1F2937]"}`}
                    >
                      <Zap size={14} />
                      <span>Quick Replies</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          )}
        </div>

        {/* Text input — premium pill */}
        <div className="flex-1 flex items-center gap-1 bg-[var(--elevated)] border border-[var(--border2)]
          rounded-2xl px-1.5 sm:px-2 py-0.5 sm:py-1 focus-within:border-[#7C3AED]/40 focus-within:ring-1 focus-within:ring-[#7C3AED]/10 transition-all">
          <button
            onClick={() => { setShowEmoji((v) => !v); setShowQuick(false); }}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
              text-[#4B5563] hover:text-[#1F2937] transition-colors
              cursor-pointer bg-transparent border-none"
            title="Emoji"
          >
            <Smile size={16} />
          </button>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value && activeConversationId) startTyping(activeConversationId);
            }}
            onKeyDown={handleKey}
            placeholder={isRecording ? "Recording..." : isUploading ? "Uploading..." : "Message"}
            disabled={isRecording || isUploading}
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1F2937]
              placeholder:text-[#4B5563] disabled:opacity-50 px-1"
          />
          <button
            onClick={handleVoiceToggle}
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer
              bg-transparent border-none ${
                isRecording
                  ? "text-[#DC2626]"
                  : "text-[#4B5563] hover:text-[#1F2937]"
              }`}
            title={isRecording ? "Stop" : "Mic"}
          >
            {isRecording ? <Square size={12} /> : <Mic size={15} />}
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && files.length === 0) || isUploading}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
            bg-[#7C3AED] text-white shadow-[0_1px_4px_rgba(109,40,217,0.25)]
            hover:bg-[#5B21B6] hover:shadow-[0_2px_8px_rgba(109,40,217,0.3)]
            active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
            transition-all cursor-pointer border-none"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
