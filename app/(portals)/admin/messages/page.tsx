import { createClient }  from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }         from "@/components/portals/Topbar";
import { ChatSystem }     from "@/components/chat/ChatSystem";
import type { AuthUser }  from "@/types";
import type { Conversation, Message } from "@/components/chat/types";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase  = createClient();
  const adminUser = await getAdminUser();

  const { data: rawMessages } = await supabase
    .from("messages")
    .select(`
      id, body, is_read, created_at, order_id, from_user, to_user,
      sender:from_user ( id, full_name, avatar_url, role, email ),
      recipient:to_user ( id, full_name, avatar_url, role, email ),
      orders ( id, order_number, status, turnaround, design_name, service_tiers ( label ) )
    `)
    .or(`from_user.eq.${adminUser.id},to_user.eq.${adminUser.id}`)
    .order("created_at", { ascending: false })
    .limit(500);

  const messages = (rawMessages ?? []) as any[];

  const conversationMap = new Map<string, Conversation>();

  for (const msg of messages) {
    const order = msg.orders as any;
    const sender = msg.sender as any;
    const recipient = msg.recipient as any;
    const isIncoming = msg.to_user === adminUser.id;
    const otherParty = isIncoming ? sender : recipient;

    if (!otherParty?.id) continue;

    const key = `conv-${otherParty.id}`;

    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        id: key,
        orderId: msg.order_id ?? undefined,
        linkedOrder: order ? {
          id: order.id,
          orderNumber: order.order_number ?? `#${order.id?.slice(0, 8)}`,
          status: (order.status as any) ?? "pending",
          service: (Array.isArray(order.service_tiers) ? order.service_tiers[0]?.label : order.service_tiers?.label) ?? "Embroidery Digitizing",
          designName: order.design_name ?? undefined,
          turnaround: order.turnaround ?? "Standard",
        } : undefined,
        clientName: otherParty.full_name ?? "Unknown",
        clientEmail: otherParty.email ?? "",
        clientAvatar: otherParty.avatar_url ?? null,
        companyName: "",
        recipientId: otherParty.id,
        recipientRole: (otherParty.role ?? "client") as Conversation["recipientRole"],
        sectionLabel: otherParty.role === "designer" ? "Designers" : otherParty.role === "crm" ? "CRM Team" : "Clients",
        category: "order",
        priority: "normal",
        lastMessage: msg.body?.slice(0, 80),
        lastMessageAt: msg.created_at ? new Date(msg.created_at) : undefined,
        unreadCount: 0,
        isTyping: false,
        messages: [],
        isPinned: false,
      });
    }

    const conv = conversationMap.get(key)!;

    if (order?.id && !conv.linkedOrder) {
      conv.linkedOrder = {
        id: order.id,
        orderNumber: order.order_number ?? `#${order.id?.slice(0, 8)}`,
        status: (order.status as any) ?? "pending",
        service: (Array.isArray(order.service_tiers) ? order.service_tiers[0]?.label : order.service_tiers?.label) ?? "Embroidery Digitizing",
        designName: order.design_name ?? undefined,
        turnaround: order.turnaround ?? "Standard",
      };
      conv.orderId = msg.order_id ?? undefined;
    }

    const isUnread = isIncoming && !msg.is_read;

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

    conv.messages.push({
      id: msg.id,
      conversationId: key,
      senderId: sender?.id ?? "unknown",
      senderName: sender?.role === "admin" ? "Support Team" : (sender?.full_name ?? "Unknown"),
      senderRole: (sender?.role ?? "client") as Message["senderRole"],
      content: body,
      replyTo,
      attachments,
      timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
      status: msg.is_read ? "read" : "delivered",
      orderId: msg.order_id ?? undefined,
      linkedOrder: order ? {
        id: order.id,
        orderNumber: order.order_number ?? `#${order.id?.slice(0, 8)}`,
        status: order.status ?? "pending",
        service: (Array.isArray(order.service_tiers) ? order.service_tiers[0]?.label : order.service_tiers?.label) ?? "Embroidery Digitizing",
        designName: order.design_name ?? undefined,
        turnaround: order.turnaround ?? "Standard",
      } : undefined,
    });

    if (isUnread) conv.unreadCount++;
  }

  const conversations: Conversation[] = Array.from(conversationMap.values())
    .map((c) => ({ ...c, messages: c.messages.reverse() }))
    .sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));

  return (
    <>
      <Topbar title="Support Inbox" subtitle="All client communications" user={adminUser as unknown as AuthUser} />
      <div className="portal-content flex-1 flex flex-col min-h-0" style={{ background: "var(--bg)", padding: 0 }}>
        <ChatSystem
          conversations={conversations}
          currentUserId={adminUser.id}
          currentUserName="Support Team"
          currentUserRole="admin"
        />
      </div>
    </>
  );
}
