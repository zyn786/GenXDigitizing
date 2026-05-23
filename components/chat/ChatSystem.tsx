"use client";

import { ChatProvider, useChat } from "./ChatProvider";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import type { Conversation, LinkedOrder } from "./types";

function ChatLayout({ singleMode }: { singleMode?: boolean }) {
  const { mobileView } = useChat();

  if (singleMode) {
    return (
      <div className="flex-1 flex bg-[var(--bg)] min-h-0">
        <div className="flex flex-1 min-h-0">
          <ChatWindow />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-[var(--bg)] min-h-0 min-w-0 overflow-hidden">
      <div className={`${mobileView === "chat" ? "hidden" : "flex"} md:flex
        w-full md:w-[320px] lg:w-[360px] flex-shrink-0 min-w-0`}>
        <ChatSidebar />
      </div>
      <div className={`${mobileView === "sidebar" ? "hidden" : "flex"} md:flex flex-1 min-h-0 min-w-0 overflow-hidden`}>
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
