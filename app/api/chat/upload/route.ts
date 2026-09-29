// @ts-nocheck
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { uploadToStorage, signStorageUrl } from "@/lib/storage";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, cleanupRateLimit } from "@/lib/rate-limit";
import { isServableKey } from "@/lib/storage-keys";

/**
 * Chat / lead attachment storage.
 *
 * SECURITY: this route signs storage URLs with the service-role client, which
 * bypasses storage RLS. It is therefore the only gate in front of these files.
 * Two rules keep that safe:
 *
 *   1. Only the prefixes below may be read or written here. Order artwork/output
 *      (orders/<id>/artwork|output/...) and email-attachments/ are deliberately
 *      excluded — those belong to their own authorized routes and must never be
 *      signable from a URL parameter alone.
 *   2. Callers must be authenticated, and lead/contact artwork is staff-only while
 *      chat attachments are readable only by the two users on the owning message.
 */

/** Prefixes this endpoint is allowed to serve/accept. */
const ALLOWED_PREFIXES = ["chat/", "guest-uploads/", "requests/"];

/** Lead/contact artwork — uploaded before the sender has an account, so staff-only. */
const STAFF_ONLY_PREFIXES = ["guest-uploads/", "requests/"];
const STAFF_ROLES = ["admin", "crm"];

/** Short TTL — the permanent /api/chat/upload?key= URL re-signs on every click. */
const SIGNED_URL_TTL = 300;

/** Extract the storage key from a stored file_url — permanent URL or raw path. */
function storedKey(fileUrl: string | null): string {
  if (!fileUrl) return "";
  const m = fileUrl.match(/[?&]key=([^&\s]+)/);
  if (!m) return fileUrl;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth — this route writes into shared storage.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkRateLimit("chat-file-post", user.id, 30, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many uploads. Please wait a moment." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 250 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum 250MB allowed." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Always land under chat/ so the GET authorization below applies uniformly.
    // The uploader id adds entropy on top of the timestamp.
    const key = `chat/${Date.now()}-${user.id.slice(0, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const contentType = file.type || "application/octet-stream";

    await uploadToStorage(buffer, key, contentType);

    // Permanent URL — resolves via this API to a fresh signed URL
    const permanentUrl = `/api/chat/upload?key=${encodeURIComponent(key)}`;

    return NextResponse.json({
      url: permanentUrl,
      path: key,
      fileName: file.name,
      size: file.size,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}

// GET — resolve a signed URL for a stored key (chat attachments, guest-uploads, requests)
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (!key) {
      return NextResponse.json({ error: "Missing key param" }, { status: 400 });
    }

    // Auth — signing with the service-role client bypasses storage RLS.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!checkRateLimit("chat-file-get", user.id, 120, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    cleanupRateLimit("chat-file-get");

    // Prefix allowlist — 404 so this cannot be used to probe which keys exist.
    if (!isServableKey(key, ALLOWED_PREFIXES)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role;

    if (STAFF_ONLY_PREFIXES.some((p) => key.startsWith(p))) {
      // Lead/contact artwork: staff only.
      if (!STAFF_ROLES.includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (role !== "admin") {
      // Chat attachment: readable only by the sender or recipient of the message
      // that references it. Admins may read any chat file.
      const admin = createAdminClient();
      const participant = `from_user.eq.${user.id},to_user.eq.${user.id}`;
      const permanentUrl = `/api/chat/upload?key=${encodeURIComponent(key)}`;

      const { data: msg } = await admin
        .from("messages")
        .select("id")
        .in("file_url", [permanentUrl, key])
        .or(participant)
        .limit(1);

      // Fallback: rows may store either the permanent URL or a raw path, and the
      // stored value may differ in encoding. Scan the caller's own messages and
      // compare keys in JS so a participant is never locked out of their own file.
      let allowed = Boolean(msg?.length);
      if (!allowed) {
        const { data: own } = await admin
          .from("messages")
          .select("file_url")
          .or(participant)
          .not("file_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(500);
        allowed = (own ?? []).some((m) => storedKey(m.file_url) === key);
      }

      // 404 rather than 403 — do not confirm the file exists to non-participants.
      if (!allowed) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    const signedUrl = await signStorageUrl(key, undefined, SIGNED_URL_TTL);
    if (!signedUrl) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
