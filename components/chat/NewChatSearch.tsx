"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, User, Loader2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "./ChatProvider";
import type { Conversation } from "./types";

interface FoundUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function UnifiedSearch() {
  const {
    setActiveConversationId,
    conversations,
    setConversations,
    filteredConversations,
    searchQuery,
    setSearchQuery,
  } = useChat();

  const [results, setResults] = useState<FoundUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search users by email
  useEffect(() => {
    if (searchQuery.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
        .limit(6);
      setResults((data ?? []) as FoundUser[]);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const matchedConversations = searchQuery.length >= 2
    ? conversations.filter((c) =>
        c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.linkedOrder?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const startChat = useCallback((user: FoundUser) => {
    const existingId = `conv-${user.id}`;
    const exists = conversations.find((c) => c.id === existingId);

    if (exists) {
      setActiveConversationId(existingId);
    } else {
      const newConv: Conversation = {
        id: existingId,
        clientName: user.full_name ?? user.email,
        clientEmail: user.email,
        companyName: "",
        recipientId: user.id,
        recipientRole: (user.role as Conversation["recipientRole"]) ?? "client",
        sectionLabel: user.role === "designer" ? "Designers" : user.role === "crm" ? "CRM Team" : "Clients",
        category: "general",
        priority: "normal",
        unreadCount: 0,
        isTyping: false,
        messages: [],
        isPinned: false,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(existingId);
    }

    setSearchQuery("");
    setResults([]);
    setIsOpen(false);
  }, [conversations, setActiveConversationId, setConversations, setSearchQuery]);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setSearchQuery("");
    setIsOpen(false);
  }, [setActiveConversationId, setSearchQuery]);

  const hasResults = matchedConversations.length > 0 || results.length > 0;

  return (
    <div className="px-3 pb-3 relative">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--txt3)]" />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => { if (searchQuery.length >= 2 && hasResults) setIsOpen(true); }}
          placeholder="Search or start new chat..."
          className="w-full pl-8 pr-8 py-2 rounded-lg text-[12px] outline-none transition-colors
            bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt)]
            placeholder:text-[var(--txt3)] focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/20"
        />
        {loading && (
          <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--txt3)]" />
        )}
        {searchQuery && !loading && (
          <button
            onClick={() => { setSearchQuery(""); setIsOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
              flex items-center justify-center text-[var(--txt3)] hover:text-[var(--txt)]
              bg-transparent border-none cursor-pointer text-[10px]"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && searchQuery.length >= 2 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-3 right-3 top-full mt-1 z-50
              bg-[var(--surface)] border border-[var(--border2)] rounded-xl shadow-xl
              overflow-hidden max-h-[320px] overflow-y-auto"
          >
            {/* Existing conversations */}
            {matchedConversations.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--txt3)]">
                  Conversations
                </div>
                {matchedConversations.slice(0, 4).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left
                      hover:bg-[var(--border)] transition-colors cursor-pointer
                      border-b border-[var(--border)] last:border-b-0
                      bg-transparent border-x-0 border-t-0"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center
                      bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20
                      text-[var(--txt)] font-bold text-[11px] flex-shrink-0">
                      {conv.clientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-semibold text-[var(--txt)] block truncate">
                        {conv.clientName}
                      </span>
                      <p className="text-[11px] text-[var(--txt3)] truncate">
                        {conv.lastMessage?.slice(0, 50) ?? "No messages"}
                      </p>
                    </div>
                    <MessageSquare size={13} className="text-[var(--txt3)] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* User search results */}
            {results.length > 0 && (
              <div>
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#A855F7]">
                  Start new chat
                </div>
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startChat(user)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left
                      hover:bg-[var(--border)] transition-colors cursor-pointer
                      border-b border-[var(--border)] last:border-b-0
                      bg-transparent border-x-0 border-t-0"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center
                      bg-gradient-to-br from-[#7C3AED]/20 to-[#06B6D4]/20
                      text-[var(--txt)] font-bold text-[11px] flex-shrink-0">
                      {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--txt)] truncate">
                          {user.full_name ?? "Unnamed"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0
                          bg-[var(--border)] text-[var(--txt3)]">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--txt3)] truncate">{user.email}</p>
                    </div>
                    <Plus size={14} className="text-[#A855F7] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {matchedConversations.length === 0 && results.length === 0 && !loading && (
              <div className="px-4 py-5 text-center">
                <User size={20} className="text-[var(--txt3)] mx-auto mb-2" />
                <p className="text-[12px] text-[var(--txt2)] font-medium">No results</p>
                <p className="text-[11px] text-[var(--txt3)] mt-0.5">Try a different search</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
