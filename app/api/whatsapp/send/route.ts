import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendWhatsAppText, sendWhatsAppTemplate } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.WHATSAPP_INTERNAL_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const to = typeof body?.to === "string" ? body.to : "";
  if (!to) return NextResponse.json({ error: "Missing recipient" }, { status: 400 });

  try {
    if (body.type === "template") {
      if (typeof body.name !== "string") {
        return NextResponse.json({ error: "Missing template name" }, { status: 400 });
      }
      const result = await sendWhatsAppTemplate(
        to,
        body.name,
        typeof body.languageCode === "string" ? body.languageCode : "en_US",
        Array.isArray(body.parameters) ? body.parameters.map(String) : [],
      );
      return NextResponse.json({ ok: true, result });
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });

    const result = await sendWhatsAppText(to, message);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("WhatsApp send failed", error);
    return NextResponse.json({ error: "WhatsApp send failed" }, { status: 502 });
  }
}
