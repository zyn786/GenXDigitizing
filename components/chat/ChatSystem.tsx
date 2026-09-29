"use client";

import { ChatProvider, useChat } from "./ChatProvider";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import type { Conversation, LinkedOrder } from "./types";

function ChatLayout({ singleMode }: { singleMode?: boolean }) {
  const { mobileView } = useChat();

  if (singleMode) {
    return (
      <div className="flex min-h-0 flex-1 bg-[var(--bg)]">
        <div className="flex min-h-0 flex-1">
          <ChatWindow />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--bg)]">
      <div
        className={`${mobileView === "chat" ? "hidden" : "flex"} w-full min-w-0 flex-shrink-0 md:flex md:w-[320px] lg:w-[360px]`}
      >
        <ChatSidebar />
      </div>
      <div
        className={`${mobileView === "sidebar" ? "hidden" : "flex"} min-h-0 min-w-0 flex-1 overflow-hidden md:flex`}
      >
        <ChatWindow />
      </div>
    </div>
  );
}

interface ChatSystemProps {
  conversations: Conversation[];
  currentUserId: string;
  currentUserName?: string;
  currentUserRole?: "admin" | "crm" | "client" | "designer";
  singleMode?: boolean;
  clientOrders?: LinkedOrder[];
}

export function ChatSystem({
  conversations,
  currentUserId,
  currentUserName,
  currentUserRole,
  singleMode,
  clientOrders,
}: ChatSystemProps) {
  return (
    <ChatProvider
      initialConversations={conversations}
      currentUserId={currentUserId}
      currentUserName={currentUserName}
      currentUserRole={currentUserRole}
      clientOrders={clientOrders}
    >
      <ChatLayout singleMode={singleMode} />
    </ChatProvider>
  );
}
