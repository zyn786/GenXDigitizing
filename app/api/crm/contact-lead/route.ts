// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/notify";

const FROM = "genxdigitizing <support@genxdigitizing.com>";
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
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;background:#F1F5F9;margin:0;padding:0;-webkit-font-smoothing:antialiased;">
<div style="padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<div style="background:linear-gradient(160deg,#0F172A 0%,#1E293B 60%,#1E3A5F 100%);padding:36px 32px 32px;text-align:center;">
  <div style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 28px;margin-bottom:12px;">
    <img src="${appUrl}/images/white_logo.png" alt="genxdigitizing" width="180" height="34" style="height:34px;width:auto;display:block;"/>
  </div>
  <div style="width:48px;height:3px;background:linear-gradient(90deg,#2563EB,#F97316);border-radius:2px;margin:14px auto 0;"></div>
  <p style="color:rgba(255,255,255,0.50);font-size:11px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;margin:10px 0 0;">Professional Embroidery Digitizing</p>
</div>

<div style="padding:32px 32px 28px;color:#1E293B;font-size:15px;line-height:1.75;">
  <p style="font-size:18px;font-weight:700;color:#0F172A;margin:0 0 8px;">Hi ${leadName || "there"},</p>
  <div style="white-space:pre-wrap;margin:16px 0;">${message}</div>
  <div style="margin:24px 0 8px;padding:18px 20px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;color:#1E40AF;font-size:14px;line-height:1.7;">
    <strong>Reply faster in your portal:</strong> Sign in and message us directly — we typically respond within 1 hour.
    <div style="text-align:center;margin-top:14px;"><a href="${appUrl}/client/messages" style="display:inline-block;background:linear-gradient(135deg,#2563EB,#1D4ED8);color:#FFFFFF;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(37,99,235,0.25);">Open Support Chat →</a></div>
  </div>
</div>

<div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;font-size:12px;color:#94A3B8;text-align:center;line-height:2;">
  <p style="font-weight:700;color:#64748B;">genxdigitizing</p>
  <p>support@genxdigitizing.com</p>
  <p><a href="${appUrl}/client" style="color:#2563EB;text-decoration:none;font-weight:500;">Client Portal</a> &nbsp;·&nbsp; <a href="${appUrl}/pricing" style="color:#2563EB;text-decoration:none;font-weight:500;">Pricing</a> &nbsp;·&nbsp; <a href="${appUrl}" style="color:#2563EB;text-decoration:none;font-weight:500;">Website</a></p>
</div>

</div></div></body></html>`,
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
            body: `Hi ${leadName || "there"}!\n\nThanks for reaching out to genxdigitizing. Feel free to reply here — this is your direct chat with our support team.\n\nWe typically reply within 1 hour during business hours.`,
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
