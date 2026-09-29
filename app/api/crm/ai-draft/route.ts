// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { checkRateLimit, cleanupRateLimit } from "@/lib/rate-limit";
import { draftReply, buildLeadBriefing } from "@/lib/ai/sales-agent";

// Drafts are slow (a tool-using model call). Vercel's default 10s would kill it.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_DRAFTS_PER_HOUR = 40;

// POST /api/crm/ai-draft
// Body: { leadId?: string, clientEmail?: string, instruction?: string }
// Returns: { draft, escalated, usage }
//
// Auth: middleware already restricts /api/crm/* to admin + crm roles. The
// getUser() call below is for attribution and rate limiting, not authorization.
export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI drafting is not configured. Set ANTHROPIC_API_KEY." },
        { status: 503 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    cleanupRateLimit("ai-draft");
    if (!checkRateLimit("ai-draft", user.id, MAX_DRAFTS_PER_HOUR, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: `Draft limit reached (${MAX_DRAFTS_PER_HOUR}/hour). Try again later.` },
        { status: 429 }
      );
    }

    const { leadId, clientEmail, instruction } = await req.json();
    if (!leadId && !clientEmail) {
      return NextResponse.json(
        { error: "Provide leadId or clientEmail" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Load the lead ────────────────────────────────────────────────
    let lead: any = null;
    if (leadId) {
      const { data } = await admin
        .from("crm_leads")
        .select(
          "id, contact_name, email, company, phone, country, stage, deal_value, " +
            "source, notes, lost_reason, created_at, updated_at, follow_up_at"
        )
        .eq("id", leadId)
        .maybeSingle();
      lead = data;
    } else {
      const { data } = await admin
        .from("crm_leads")
        .select(
          "id, contact_name, email, company, phone, country, stage, deal_value, " +
            "source, notes, lost_reason, created_at, updated_at, follow_up_at"
        )
        .eq("email", String(clientEmail).toLowerCase())
        .maybeSingle();
      lead = data;
    }

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // ── Load the thread ──────────────────────────────────────────────
    // Portal messages live against a users row, not the lead. Match by email.
    const thread: any[] = [];
    const { data: leadUser } = await admin
      .from("users")
      .select("id")
      .eq("email", lead.email)
      .maybeSingle();

    if (leadUser?.id) {
      const { data: msgs } = await admin
        .from("messages")
        .select("from_user, to_user, body, created_at")
        .or(`from_user.eq.${leadUser.id},to_user.eq.${leadUser.id}`)
        .order("created_at", { ascending: true })
        .limit(30);

      for (const m of msgs ?? []) {
        thread.push({
          direction: m.from_user === leadUser.id ? "inbound" : "outbound",
          body: m.body,
          created_at: m.created_at,
        });
      }
    }

    const briefing = buildLeadBriefing(lead, thread);

    const result = await draftReply({ briefing, instruction });

    console.log(
      `[ai-draft] lead=${lead.id} by=${user.id} ` +
        `in=${result.usage.inputTokens} out=${result.usage.outputTokens} ` +
        `cache_read=${result.usage.cacheReadTokens} cache_write=${result.usage.cacheCreationTokens}`
    );

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[ai-draft] bad ANTHROPIC_API_KEY");
      return NextResponse.json({ error: "AI credentials invalid" }, { status: 500 });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "AI provider is rate limiting us. Retry shortly." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      console.error("[ai-draft] API error", err.status, err.message);
      return NextResponse.json(
        { error: `AI error: ${err.message}` },
        { status: err.status ?? 500 }
      );
    }

    console.error("[ai-draft]", err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
