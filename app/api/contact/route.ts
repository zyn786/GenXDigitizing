import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  service: z.string().min(1).max(120),
  message: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = checkRateLimit(`contact:${ip}`, 3, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: "Too many requests. Please try again in a few minutes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        },
      }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Please fill in all required fields correctly." },
      { status: 400 }
    );
  }

  const { name, email, service, message } = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL ?? "support@genxdigitizing.com";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "GenX Digitizing <support@genxdigitizing.com>";

  if (apiKey && process.env.NODE_ENV === "production") {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmail,
        reply_to: email,
        subject: `New inquiry from ${name} — ${service}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="margin-bottom:16px">New project inquiry</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#666;width:120px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0;font-weight:600">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#666">Service</td><td style="padding:8px 0;font-weight:600">${service}</td></tr>
            </table>
            <div style="margin-top:20px;padding:16px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.6">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
        `,
      }),
    });
  } else {
    console.log(`[DEV] Contact form submission from ${name} <${email}>: ${service}\n${message}`);
  }

  return NextResponse.json({ ok: true });
}
