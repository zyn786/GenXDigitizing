// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadToStorage } from "@/lib/storage";
import { notifyUsers } from "@/lib/notify-server";
import { formatLeadArtworkLines } from "@/lib/lead-artwork";
import { formatLeadReferenceLine, generateLeadReference } from "@/lib/lead-reference";
import { recordLeadEvent } from "@/lib/lead-events";
import { emailRequestReceived } from "@/lib/email";
import { nextFollowUpAt } from "@/lib/follow-up";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "image/vnd.adobe.photoshop",
  "application/postscript",
  "application/illustrator",
];

// Simple in-memory rate limiter: 5 requests per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();

    // Honeypot check — bots fill hidden fields
    if (formData.get("website")) {
      return NextResponse.json({ success: true }); // silently accept, don't reveal detection
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const company = formData.get("company") as string;
    const service = formData.get("service") as string;
    const message = formData.get("message") as string;
    const artwork = formData.get("artwork");

    if (!name || !email || !company || !service || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Artwork is OPTIONAL. Most enquiries are questions with no file attached
    // ("do you digitize left-chest logos for 12 shirts?"). This route used to
    // hard-reject any request without a file while the form UI treated the file
    // as optional — so the customer saw a raw error and no lead row was ever
    // written. Validate only when a file is actually present.
    const hasArtwork = artwork instanceof File && artwork.size > 0;

    if (hasArtwork && !ALLOWED_TYPES.includes(artwork.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Upload PNG, JPG, WEBP, PDF, AI, or PSD." },
        { status: 400 }
      );
    }

    if (hasArtwork && artwork.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 20MB" }, { status: 400 });
    }

    let artworkLines: string[] = ["Artwork: none attached"];
    // Tracked separately so the customer's acknowledgement can be accurate:
    // "we have your artwork" must not be sent when the upload failed.
    let artworkFailed = false;

    if (hasArtwork) {
      // Upload artwork to Supabase Storage — folder: requests/
      const buffer = Buffer.from(await artwork.arrayBuffer());
      const safeName = artwork.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `requests/${Date.now()}-${safeName}`;
      const contentType = artwork.type || "application/octet-stream";

      // A storage failure must not cost us the enquiry. uploadToStorage throws,
      // and this call used to sit inside the handler's try/catch — so a bucket
      // hiccup turned "customer told us what they need" into a 500 and no lead
      // row at all. Keep the lead, record that the file did not land.
      try {
        await uploadToStorage(buffer, key, contentType);
        // Canonical lead-artwork lines — the same shape the guest upload wizard
        // writes, so convert-to-order reads both with one parser (lib/lead-artwork).
        artworkLines = formatLeadArtworkLines([{ name: artwork.name, key, size: artwork.size }]);
      } catch (uploadErr) {
        console.error("[contact] artwork upload failed — saving lead without it:", uploadErr);
        artworkFailed = true;
        artworkLines = [
          "Artwork: UPLOAD FAILED",
          `Artwork filename: ${artwork.name} (${(artwork.size / 1024 / 1024).toFixed(1)}MB)`,
          "The customer believes a file was attached. Ask them to resend it.",
        ];
      }
    }

    const supabase = createAdminClient();

    // The customer's reference, generated server-side so it can be looked up
    // again. This route previously returned a bare `success: true` and nothing
    // else — the visitor was told "we reply within 1 hour" with no record on
    // either side that the enquiry had happened.
    const reference = generateLeadReference();

    // Create CRM lead with artwork info
    const { data: lead, error } = await supabase
      .from("crm_leads")
      .insert({
        contact_name: name,
        email,
        company: company || null,
        source: "website",
        stage: "lead",
        // Start the follow-up clock. Without this the engine has nothing to act
        // on and the lead is only chased if a person remembers.
        follow_up_at: nextFollowUpAt("lead")?.toISOString() ?? null,
        notes: [
          formatLeadReferenceLine(reference),
          `Service: ${service}`,
          ...artworkLines,
          "",
          message,
        ].join("\n"),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[contact] DB error:", error);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // Start the timeline. Everything that happens to this lead from here on is
    // an event row, so "when did we first hear from them, and who replied?" is
    // a query rather than a regex over a text column.
    await recordLeadEvent(supabase, {
      leadId: lead.id,
      type: "created",
      actorLabel: name,
      summary: `Enquiry received from the website contact form — ${service}${
        hasArtwork ? ", with artwork" : ""
      }`,
      toStage: "lead",
      metadata: { reference, source: "website", service, hasArtwork },
    });

    // Acknowledge to the customer. This route previously returned a bare
    // success and sent nothing, so a visitor had no record they had ever
    // contacted us. `artworkReceived` reflects what actually happened — a
    // failed upload must not be confirmed as "we have your artwork".
    const ack = await emailRequestReceived({
      to: email,
      name,
      reference,
      subject: service,
      artworkReceived: hasArtwork ? !artworkFailed : undefined,
    });
    if (!ack.success) {
      // The lead is saved and the team is notified, so this is not fatal — but
      // it is the customer's only written confirmation, so it is not silent.
      console.error("[contact] acknowledgement email failed for", reference, ack.error);
    }

    // Notify the people who work leads — `crm` included. Only admins were told,
    // so the role with a leads screen built for exactly this never heard about
    // an enquiry.
    const { data: staff } = await supabase
      .from("users")
      .select("id")
      .in("role", ["admin", "crm"])
      .eq("is_active", true);

    if (staff?.length) {
      await notifyUsers(
        staff.map((a: any) => a.id),
        {
          type: "system",
          title: `New request from ${name}`,
          body: `${reference} · ${email} · ${company} · ${service}${hasArtwork ? " · Artwork attached" : ""}`,
          action_url: "/admin/leads",
        }
      );
    }

    return NextResponse.json({ success: true, reference });
  } catch (err: any) {
    console.error("[contact] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
