// @ts-nocheck
import { getAdminUser }      from "@/lib/supabase/get-user";
import { getClientMessages } from "@/lib/supabase/client-queries";
import { createClient }      from "@/lib/supabase/server";
import { Topbar }            from "@/components/portals/Topbar";
import { ChatSystem }        from "@/components/chat/ChatSystem";
import type { AuthUser }     from "@/types";
import type { Conversation, Message, LinkedOrder } from "@/components/chat/types";

export const dynamic = "force-dynamic";

export default async function ClientMessagesPage() {
  const clientUser = await getAdminUser();
  const messages   = await getClientMessages(clientUser.id);
  const supabase   = createClient();

  // Fetch client's orders for the order selector
  let clientOrders: LinkedOrder[] = [];
  if (clientUser.client_id) {
    const { data: orders } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, turnaround, design_name,
        service_tiers ( label )
      `)
      .eq("client_id", clientUser.client_id)
      .order("created_at", { ascending: false })
      .limit(20);

    clientOrders = (orders ?? []).map((o: any) => ({
    id: o.id,
    orderNumber: o.order_number ?? `#${o.id?.slice(0, 8)}`,
    status: o.status ?? "pending",
    service: (Array.isArray(o.service_tiers) ? o.service_tiers[0]?.label : o.service_tiers?.label) ?? "Embroidery Digitizing",
    designName: o.design_name ?? undefined,
    turnaround: o.turnaround ?? "Standard",
    }));
  }

  // Find the admin to send messages to (service key bypasses RLS)
  let adminId   = "";
  let adminName = "Support";
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id,full_name&role=eq.admin&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: "no-store",
      }
    );
    const users = await res.json();
    if (users?.[0]) {
      adminId   = users[0].id;
      adminName = users[0].full_name ?? "Support";
    }
  } catch { /* adminId stays empty */ }

  if (!adminId) {
    return (
      <>
        <Topbar title="Messages" subtitle="Support & order communications" user={clientUser as unknown as AuthUser} />
        <div className="portal-content flex items-center justify-center">
          <p className="text-[var(--txt3)]">Support unavailable right now. Please try again later.</p>
        </div>
      </>
    );
  }

  const sorted = [...(messages ?? [])].sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const chatMessages: Message[] = sorted.map((msg: any) => {
    const isOwn      = msg.from_user === clientUser.id;
    const otherParty = isOwn ? msg.recipient : msg.sender;

    // Parse reply + attachment metadata
    let body = msg.body ?? "";
    let replyTo: Message["replyTo"];
    let attachments: any[] | undefined;

    if (body.startsWith("--reply--\n")) {
      const endIdx = body.indexOf("\n--reply--\n", 10);
      if (endIdx !== -1) {
        try {
          const replyMeta = JSON.parse(body.slice(10, endIdx));
          replyTo = { id: replyMeta.id, content: replyMeta.c, senderName: replyMeta.n };
          body = body.slice(endIdx + 11);
        } catch { /* ignore */ }
      }
    }

    const attSplit = body.split("\n--attachments--\n");
    if (attSplit.length === 2) {
      body = attSplit[0];
      try {
        attachments = attSplit[1].split("||").map((s: string) => {
          const meta = JSON.parse(s);
          return { id: `att-${Date.now()}-${Math.random()}`, name: meta.n, url: meta.u, type: meta.t, size: meta.s };
        });
      } catch { /* ignore */ }
    }

    return {
      id: msg.id,
      conversationId: `conv-${adminId}`,
      senderId:   msg.from_user ?? msg.sender?.id,
      senderName: isOwn ? "You" : "Support Team",
      senderRole: (isOwn ? "client" : "admin") as Message["senderRole"],
      content:   body,
      replyTo,
      attachments,
      timestamp: new Date(msg.created_at),
      status:    msg.is_read ? "read" : "delivered",
      orderId:   msg.order_id ?? undefined,
    };
  });

  const conversation: Conversation = {
    id: `conv-${adminId}`,
    clientName:    adminName,
    clientEmail:   "",
    companyName:   "",
    recipientId:   adminId,
    recipientRole: "admin",
    category:      "general",
    priority:      "normal",
    lastMessage:   chatMessages.at(-1)?.content?.slice(0, 80),
    lastMessageAt: chatMessages.at(-1)?.timestamp,
    unreadCount:   messages?.filter((m: any) => !m.is_read && m.to_user === clientUser.id).length ?? 0,
    isTyping:      false,
    messages:      chatMessages,
    isPinned:      false,
  };

  return (
    <>
      <Topbar title="Messages" subtitle="Chat with support about your orders" user={clientUser as unknown as AuthUser} />
      <div className="flex-1 flex flex-col min-h-0">
        <ChatSystem
          conversations={[conversation]}
          currentUserId={clientUser.id}
          currentUserName={clientUser.full_name ?? "You"}
          currentUserRole="client"
          singleMode
          clientOrders={clientOrders}
        />
      </div>
    </>
  );
}
