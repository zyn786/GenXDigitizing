// @ts-nocheck
import { getAdminUser } from "@/lib/supabase/get-user";
import { getCRMMessages } from "@/lib/supabase/crm-queries";
import { Topbar } from "@/components/portals/Topbar";
import type { AuthUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function CRMMessagesPage() {
  const [user, messages] = await Promise.all([getAdminUser(), getCRMMessages()]);

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
            <p className="mb-4 text-5xl">📭</p>
            <p className="mb-1 font-syne text-base font-bold text-[var(--txt)]">No messages yet</p>
            <p className="text-[13px] text-[var(--txt3)]">Client messages will appear here</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--txt3)]">
                {messages.length} messages
              </p>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {messages.map((msg: any) => {
                const isIncoming = msg.to_user === user.id;
                const senderName =
                  msg.sender?.role === "admin"
                    ? "Support Team"
                    : (msg.sender?.full_name ?? "Unknown");
                const recipientName = msg.recipient?.full_name ?? "Unknown";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 px-4 py-3 ${!msg.is_read && isIncoming ? "bg-[#A855F7]/5" : ""}`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] text-xs font-bold text-white">
                      {senderName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[var(--txt)]">
                          {isIncoming ? senderName : `To: ${recipientName}`}
                        </span>
                        {!msg.is_read && isIncoming && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed text-[var(--txt2)]">{msg.body}</p>
                      <p className="mt-1 text-[10px] text-[var(--txt3)]">
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
