"use client";

import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ChatThreadDetail, ChatThreadListItem } from "@/lib/chat/types";

type SortKey = "recent" | "oldest" | "unread";
type FilterKey = "all" | "open" | "resolved";

type Props = {
  mode: "client" | "admin";
  threads: ChatThreadListItem[];
  selectedThreadId?: string | null;
  onThreadSelect?: (detail: ChatThreadDetail | null) => void;
};

function getThreadDotColor(type: ChatThreadListItem["type"]) {
  switch (type) {
    case "ORDER": return "bg-emerald-500";
    case "INVOICE": return "bg-amber-500";
    default: return "bg-cyan-500";
  }
}

function getTypeLabel(type: ChatThreadListItem["type"]) {
  switch (type) {
    case "ORDER": return "Order";
    case "INVOICE": return "Invoice";
    default: return "Support";
  }
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

async function fetchThreadDetail(threadId: string): Promise<ChatThreadDetail | null> {
  const response = await fetch(`/api/chat/threads/${threadId}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { thread: ChatThreadDetail };
  return data.thread;
}

/* ── Controls ──────────────────────────────────────────────── */

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "oldest", label: "Oldest" },
  { key: "unread", label: "Unread" },
];

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
            value === opt.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export function ChatThreadListPanel({ mode, threads, selectedThreadId, onThreadSelect }: Props) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);

  const countOpen = useMemo(() => threads.filter((t) => t.isOpen).length, [threads]);
  const countResolved = useMemo(() => threads.filter((t) => !t.isOpen).length, [threads]);
  const hasUnread = useMemo(() => threads.some((t) => t.unreadCount > 0), [threads]);

  const visible = useMemo(() => {
    let filtered = [...threads];

    // Filter
    if (filter === "open") filtered = filtered.filter((t) => t.isOpen);
    if (filter === "resolved") filtered = filtered.filter((t) => !t.isOpen);

    // Sort
    switch (sort) {
      case "recent":
        filtered.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case "oldest":
        filtered.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return aTime - bTime;
        });
        break;
      case "unread":
        filtered.sort((a, b) => b.unreadCount - a.unreadCount || new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime());
        break;
    }

    return filtered;
  }, [threads, sort, filter]);

  async function handleThreadClick(threadId: string) {
    if (loadingThreadId) return;
    setLoadingThreadId(threadId);
    try {
      const detail = await fetchThreadDetail(threadId);
      if (detail && onThreadSelect) {
        onThreadSelect(detail);
      }
    } finally {
      setLoadingThreadId(null);
    }
  }

  return (
    <div className="flex h-full flex-col border-r border-border/60">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Support</p>
        <h2 className="mt-1 text-lg font-semibold">
          {mode === "client" ? "Conversations" : "Support Inbox"}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {mode === "client"
            ? "Chat with our team about orders and invoices."
            : `${visible.length} of ${threads.length} thread${threads.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Sort + Filter controls */}
      {threads.length > 0 && (
        <div className="shrink-0 space-y-2 border-b border-border/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Sort</span>
            <SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">Show</span>
            <SegmentedControl
              options={FILTER_OPTIONS.map((o) => ({
                ...o,
                label:
                  o.key === "open"
                    ? `Open (${countOpen})`
                    : o.key === "resolved"
                      ? `Resolved (${countResolved})`
                      : `All (${threads.length})`,
              }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
          {sort === "unread" && !hasUnread && (
            <p className="text-[10px] text-muted-foreground/60">No unread messages — showing all threads.</p>
          )}
        </div>
      )}

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
        {threads.length === 0 ? (
          <EmptyState mode={mode} />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-10 text-center">
            <p className="text-sm font-medium">No matching threads</p>
            <p className="text-xs text-muted-foreground">Try a different filter.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {visible.map((thread) => {
              const active = selectedThreadId === thread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => handleThreadClick(thread.id)}
                  disabled={loadingThreadId === thread.id}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent hover:border-border/60 hover:bg-muted/30"
                  } ${loadingThreadId === thread.id ? "opacity-60 cursor-wait" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${getThreadDotColor(thread.type)}`} />
                        <p className="truncate text-sm font-semibold">{thread.subject}</p>
                        {!thread.isOpen && (
                          <span className="shrink-0 rounded-full border border-border/40 px-1.5 py-px text-[9px] text-muted-foreground">Closed</span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {thread.lastMessagePreview ?? "No messages yet."}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                        <span className="rounded-full border border-border/40 px-1.5 py-px">{getTypeLabel(thread.type)}</span>
                        {thread.clientName && <span>{thread.clientName}</span>}
                        {thread.lastMessageAt && <span>{relativeTime(thread.lastMessageAt)}</span>}
                      </div>
                    </div>
                    {thread.unreadCount > 0 && (
                      <Badge className="shrink-0 text-[10px]">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ mode }: { mode: "client" | "admin" }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40">
        <MessageCircle className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div>
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {mode === "client"
            ? "Start a chat from any order or invoice."
            : "No open support threads."}
        </p>
      </div>
    </div>
  );
}
