// @ts-nocheck
import { getAdminUser }   from "@/lib/supabase/get-user";
import { getCRMMessages } from "@/lib/supabase/crm-queries";
import { Topbar }         from "@/components/portals/Topbar";
import type { AuthUser }  from "@/types";

export const dynamic = "force-dynamic";

export default async function CRMMessagesPage() {
  const [user, messages] = await Promise.all([
    getAdminUser(),
    getCRMMessages(),
  ]);

  const unread = messages.filter((m: any) => !m.is_read && m.to_user === user.id).length;

  return (
    <>
      <Topbar
        title="Messages"
        subtitle={unread > 0 ? `${unread} unread` : "Client communications"}
        user={user as unknown as AuthUser}
      />
      <div className="portal-content">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-5xl mb-4">📭</p>
            <p className="font-jakarta font-bold text-base text-[var(--txt)] mb-1">No messages yet</p>
            <p className="text-[13px] text-[var(--txt3)]">Client messages will appear here</p>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--txt3)]">
                {messages.length} messages
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {messages.map((msg: any) => {
                const isIncoming = msg.to_user === user.id;
                const senderName = msg.sender?.role === "admin" ? "Support Team" : (msg.sender?.full_name ?? "Unknown");
                const recipientName = msg.recipient?.full_name ?? "Unknown";
                return (
                  <div
                    key={msg.id}
                    className={`px-4 py-3 flex items-start gap-3 ${!msg.is_read && isIncoming ? "bg-[#A855F7]/5" : ""}`}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4]">
                      {senderName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-[var(--txt)]">
                          {isIncoming ? senderName : `To: ${recipientName}`}
                        </span>
                        {!msg.is_read && isIncoming && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                        )}
                      </div>
                      <p className="text-[13px] text-[var(--txt2)] leading-relaxed">{msg.body}</p>
                      <p className="text-[10px] text-[var(--txt3)] mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
