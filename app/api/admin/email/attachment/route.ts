// @ts-nocheck
/**
 * Download an attachment of a received (inbound) email.
 *
 * Resend exposes attachments through a list endpoint that returns a short-lived
 * signed `download_url` per file, so this resolves that and streams the bytes
 * back with a proper filename — the browser never sees the signed URL.
 *
 *   GET /api/admin/email/attachment?email=<resend_email_id>&id=<attachment_id>
 *
 * Outbound attachments live in Supabase Storage instead, and are served by
 * redirecting to a short-lived signed URL:
 *
 *   GET /api/admin/email/attachment?path=email-attachments/<file>
 */
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { RESEND_API } from "@/lib/resend-inbound";
import { signStorageUrl } from "@/lib/storage";

/** Only paths written by the composer's upload route may be served. */
const ATTACHMENT_PREFIX = "email-attachments/";

/** Strip anything that could break the Content-Disposition header. */
function safeFilename(name: string): string {
  return (name || "attachment").replace(/[\r\n"\\]/g, "_").slice(0, 200);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAdminUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Outbound attachment: hand back a short-lived signed URL ──
    const storagePath = req.nextUrl.searchParams.get("path");
    if (storagePath) {
      if (storagePath.indexOf(ATTACHMENT_PREFIX) !== 0 || storagePath.indexOf("..") !== -1) {
        return NextResponse.json({ error: "Invalid attachment reference" }, { status: 400 });
      }
      const signed = await signStorageUrl(storagePath, undefined, 300);
      if (!signed) {
        return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
      }
      return NextResponse.redirect(signed);
    }

    const emailId = req.nextUrl.searchParams.get("email");
    const attachmentId = req.nextUrl.searchParams.get("id");
    if (!emailId || !attachmentId) {
      return NextResponse.json({ error: "Missing email or id" }, { status: 400 });
    }

    const key = process.env.RESEND_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "RESEND_API_KEY is not configured" }, { status: 500 });
    }

    // Only serve attachments for mail this inbox actually stored.
    const supabase = createAdminClient();
    const known = await supabase
      .from("received_emails")
      .select("id")
      .eq("resend_id", emailId)
      .maybeSingle();
    if (!known.data) {
      return NextResponse.json({ error: "Unknown email" }, { status: 404 });
    }

    const listRes = await fetch(
      RESEND_API + "/emails/receiving/" + encodeURIComponent(emailId) + "/attachments",
      { headers: { Authorization: "Bearer " + key } }
    );
    if (!listRes.ok) {
      console.error("[admin/email/attachment] List failed:", listRes.status);
      return NextResponse.json({ error: "Could not list attachments" }, { status: 502 });
    }

    const list = await listRes.json();
    const match = (list.data || []).find((a: any) => a.id === attachmentId);
    if (!match || !match.download_url) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const fileRes = await fetch(match.download_url);
    if (!fileRes.ok || !fileRes.body) {
      console.error("[admin/email/attachment] Download failed:", fileRes.status);
      return NextResponse.json({ error: "Could not download attachment" }, { status: 502 });
    }

    // `inline=1` renders in the browser instead of downloading. The UI uses the
    // default (attachment) for the <img> thumbnail — Content-Disposition is
    // ignored for subresource loads, so both work — and this for the
    // click-through, so a full-size image opens in a tab rather than landing in
    // the Downloads folder.
    const disposition = req.nextUrl.searchParams.get("inline") === "1" ? "inline" : "attachment";

    return new NextResponse(fileRes.body, {
      status: 200,
      headers: {
        "Content-Type": match.content_type || "application/octet-stream",
        "Content-Disposition": disposition + '; filename="' + safeFilename(match.filename) + '"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    console.error("[admin/email/attachment]", err);
    return NextResponse.json({ error: err?.message || "Download failed" }, { status: 500 });
  }
}
