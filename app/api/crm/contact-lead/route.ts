// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const FROM = "GenXdigitizing <support@genxdigitizing.com>";
const REPLY = "support@genxdigitizing.com";

// POST /api/crm/contact-lead — send email to lead, create chat, update stage
export async function POST(req: NextRequest) {
  try {
    const { leadId, to, subject, message, leadName, leadUserId } = await req.json();
    if (!leadId || !to || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Send email via Resend
    let emailSent = false;
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY ?? "");
      const { error } = await resend.emails.send({
        from: FROM,
        to: [to],
        subject,
        reply_to: REPLY,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:Inter,Arial,sans-serif;background:#f5f5f5;padding:20px"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#2563EB,#7C3AED);padding:24px 28px"><h1 style="color:#fff;font-size:20px;margin:0">✦ GenXdigitizing</h1><p style="color:rgba(255,255,255,0.8);font-size:13px;margin:4px 0 0">Professional Embroidery Digitizing</p></div><div style="padding:28px;color:#1a1a2e;font-size:14px;line-height:1.6"><p>Hi ${leadName || "there"},</p><div style="white-space:pre-wrap">${message}</div><div style="margin-top:20px;padding:16px;background:#f0f7ff;border-radius:8px;border:1px solid #dbeafe"><p style="margin:0;font-size:13px;color:#1e40af"><strong>Reply faster in your portal:</strong> Sign in and message us directly — we typically respond within 1 hour.</p><a href="${appUrl}/client/messages" style="display:inline-block;margin-top:10px;background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">Open Support Chat →</a></div></div><div style="background:#f9fafb;padding:16px 28px;font-size:12px;color:#9ca3af;text-align:center"><p>GenXdigitizing · support@genxdigitizing.com</p></div></div></body></html>`,
      });
      emailSent = !error;
      if (error) console.error("[contact-lead] Resend error:", error);
    } catch (e) {
      console.error("[contact-lead] Email send failed:", e);
    }

    // Update lead stage + append activity
    const admin = createAdminClient();

    // Get current notes
    const { data: currentLead } = await admin.from("crm_leads").select("notes").eq("id", leadId).single();
    const activityNote = `\n[${new Date().toISOString()}] Email sent to ${to} - "${subject}"`;
    const newNotes = (currentLead?.notes || "") + activityNote;

    await admin.from("crm_leads").update({
      stage: "contacted",
      notes: newNotes,
      last_contact_at: new Date().toISOString(),
    }).eq("id", leadId);

    // If lead's email has a registered user account, send a chat message from support
    const { data: leadUser } = await admin.from("users").select("id").eq("email", to).maybeSingle();
    if (leadUser?.id) {
      try {
        const { data: admins } = await admin.from("users").select("id").eq("role", "admin").limit(1);
        const senderId = admins?.[0]?.id;
        if (senderId) {
          await admin.from("messages").insert({
            from_user: senderId,
            to_user: leadUser.id,
            body: `Hi ${leadName || "there"}!\n\nThanks for reaching out to GenXdigitizing. Feel free to reply here — this is your direct chat with our support team.\n\nWe typically reply within 1 hour during business hours.`,
          });
          await admin.from("notifications").insert({
            user_id: leadUser.id,
            type: "message",
            title: "New message from Support Team",
            body: "You have a new message from our support team. Open your portal to reply.",
            action_url: "/client/messages",
          });
          // Notify CRM user who sent the email
          await admin.from("notifications").insert({
            user_id: senderId,
            type: "message",
            title: `Email sent — ${leadName || "Lead"}`,
            body: `Subject: "${subject}". Lead moved to Contacted.`,
            action_url: "/crm/leads",
          });
        }
      } catch (e) {
        console.error("[contact-lead] Chat message failed:", e);
      }
    }

    return NextResponse.json({ success: true, emailSent });
  } catch (error: any) {
    console.error("[contact-lead]", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
