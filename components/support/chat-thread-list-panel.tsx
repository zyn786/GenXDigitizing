"use client";

import Link from "next/link";

import type { ChatThreadListItem } from "@/lib/chat/types";

type ChatThreadListPanelProps = {
  mode: "client" | "admin";
  threads: ChatThreadListItem[];
  selectedThreadId?: string | null;
};

function getThreadHref(mode: "client" | "admin", threadId: string): string {
  return mode === "client"
    ? `/client/support/${threadId}`
    : `/admin/support/${threadId}`;
}

function getThreadDotColor(type: ChatThreadListItem["type"]) {
  switch (type) {
    case "ORDER":
      return "bg-emerald-400";
    case "INVOICE":
      return "bg-amber-400";
    default:
      return "bg-cyan-400";
  }
}

export function ChatThreadListPanel({
  mode,
  threads,
  selectedThreadId,
}: ChatThreadListPanelProps) {
  return (
    <div className="flex h-full flex-col border-r border-border/80">
      <div className="border-b border-border/80 p-5">
        <div className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
          Support
        </div>
        <h1 className="mt-2 text-2xl font-semibold">
          {mode === "client"
            ? "Support conversations now live inside the portal."
            : "Support inbox now runs from a live chat foundation."}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "client"
            ? "Select a thread to view the latest client, order, or invoice conversation."
            : "Select a thread to view live client support, order-linked chat, or invoice discussion."}
        </p>
      </div>

      <div className="overflow-y-auto p-3">
        {threads.length === 0 ? (
          <div className="rounded-[1.5rem] border border-border/80 bg-secondary/60 p-4 text-sm text-muted-foreground">
            No support threads yet.
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => {
              const active = selectedThreadId === thread.id;

              return (
                <Link
                  key={thread.id}
                  href={getThreadHref(mode, thread.id) as any}
                  className={`block rounded-[1.75rem] border p-4 transition ${
                    active
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/80 bg-background/50 hover:bg-background/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${getThreadDotColor(
                            thread.type
                          )}`}
                        />
                        <div className="truncate text-lg font-semibold">
                          {thread.subject}
                        </div>
                      </div>

                      <div className="mt-2 truncate text-sm text-muted-foreground">
                        {thread.lastMessagePreview ?? "No messages yet."}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{thread.type}</span>
                        {thread.clientName ? <span>{thread.clientName}</span> : null}
                        {thread.lastMessageAt ? <span>{thread.lastMessageAt}</span> : null}
                      </div>
                    </div>

                    {thread.unreadCount > 0 ? (
                      <div className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        {thread.unreadCount}
                      </div>
                    ) : null}
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