"use client";

import Link from "next/link";
import type { Route } from "next";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ChatThreadListItem } from "@/lib/chat/types";

type Props = {
  mode: "client" | "admin";
  threads: ChatThreadListItem[];
  selectedThreadId?: string | null;
};

function getThreadHref(mode: "client" | "admin", threadId: string): string {
  return mode === "client" ? `/client/support/${threadId}` : `/admin/support/${threadId}`;
}

function getThreadDotColor(type: ChatThreadListItem["type"]) {
  switch (type) {
    case "ORDER": return "bg-emerald-500";
    case "INVOICE": return "bg-amber-500";
    default: return "bg-cyan-500";
  }
}

export function ChatThreadListPanel({ mode, threads, selectedThreadId }: Props) {
  return (
    <div className="flex h-full flex-col border-r border-border/60">
      <div className="border-b border-border/60 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Support</p>
        <h2 className="mt-1 text-lg font-semibold">
          {mode === "client" ? "Conversations" : "Support Inbox"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "client" ? "Chat with our team about orders and invoices." : "Live client support, order-linked, and invoice discussions."}
        </p>
      </div>

      <div className="overflow-y-auto p-3 [scrollbar-width:thin]">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-12 text-center">
            <MessageCircle className="h-6 w-6 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium">No conversations yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {mode === "client" ? "Start a chat from any order or invoice." : "No open support threads."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => {
              const active = selectedThreadId === thread.id;
              return (
                <Link
                  key={thread.id}
                  href={getThreadHref(mode, thread.id) as Route}
                  className={`block rounded-2xl border p-4 transition ${
                    active
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/60 bg-card/70 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getThreadDotColor(thread.type)}`} />
                        <p className="truncate text-sm font-semibold">{thread.subject}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {thread.lastMessagePreview ?? "No messages yet."}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                        <span>{thread.type}</span>
                        {thread.clientName && <span>{thread.clientName}</span>}
                        {thread.lastMessageAt && <span>{thread.lastMessageAt}</span>}
                      </div>
                    </div>
                    {thread.unreadCount > 0 && (
                      <Badge className="shrink-0 bg-primary text-primary-foreground text-[10px]">
                        {thread.unreadCount}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
