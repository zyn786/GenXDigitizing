// @ts-nocheck
/**
 * GenX sales copilot — drafts customer replies for CRM staff.
 *
 * A human reads and edits every draft before it reaches a customer. Nothing in
 * this module sends anything.
 *
 * Design notes:
 * - The model never sees a UUID. Callers resolve the lead / client server-side
 *   and hand over a plain-text briefing; tools take natural keys (an email) so
 *   the model cannot hallucinate an ID.
 * - The agentic loop is written by hand rather than using the SDK's
 *   `client.beta.messages.toolRunner` helper. The runner never settles against
 *   the DeepSeek Anthropic-compatible endpoint (its promise hangs and the
 *   process exits on an unsettled await), while a plain tool_use round-trip
 *   against the same endpoint works fine. The manual loop also keeps us off the
 *   beta namespace entirely.
 * - GENX_SYSTEM is a frozen prefix with a cache breakpoint. Keep it byte-stable.
 */

import Anthropic from "@anthropic-ai/sdk";
// MUST be zod/v4, not "zod". The JSON-Schema generation below uses zod/v4's
// toJSONSchema; a classic v3 schema has no `_zod` property and conversion throws
// "Cannot read properties of undefined (reading 'def')". zod 3.25.x ships the v4
// API on this subpath, so no dependency change is needed.
import { z } from "zod/v4";
import { createAdminClient } from "@/lib/supabase/server";
import { GENX_SYSTEM } from "@/lib/ai/prompts/genx-sales";
import { POLICY_UNKNOWN_REPLY, findPolicy, renderPolicyForModel } from "@/lib/ai/policy";

/**
 * Provider configuration.
 *
 * Defaults to Anthropic on the current Opus (`claude-opus-5-5`). To pin a
 * specific model, or to run on DeepSeek's Anthropic-compatible endpoint, set in
 * .env.local:
 *   ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
 *   SALES_AGENT_MODEL=deepseek-chat
 *
 * `SALES_AGENT_MODEL` overrides the model on either provider, so a deployment
 * that pinned an older id keeps working unchanged.
 *
 * Note on caching: DeepSeek does honour `cache_control`, but only above its
 * minimum cacheable prefix. A short system prompt reports
 * cache_read_input_tokens: 0 and looks uncached; the real ~4.5K-token
 * GENX_SYSTEM prefix does cache (measured: 3072–3328 tokens read per turn).
 * Don't judge caching here from a small test prompt.
 */
export const SALES_MODEL = process.env.SALES_AGENT_MODEL || "claude-opus-5-5";

/** DeepSeek's thinking blocks share the output budget with the draft. */
const MAX_TOKENS = 8192;
const MAX_ITERATIONS = 6;

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      // undefined → the SDK falls back to ANTHROPIC_BASE_URL, then Anthropic.
      baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    });
  }
  return _client;
}

// ---------------------------------------------------------------- tool kit

type ToolResult = { ok: true; data: any } | { ok: false; error: string };

interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run: (input: any) => Promise<string>;
  /** Validate model-supplied input before running. Never trust it. */
  parse: (input: unknown) => ToolResult;
}

/**
 * Build a tool from a zod schema. Generates the JSON Schema the API needs and
 * keeps runtime validation, so a malformed tool call becomes an is_error result
 * the model can correct instead of a crash.
 */
function defineTool<S extends z.ZodType<any>>(opts: {
  name: string;
  description: string;
  schema: S;
  run: (input: z.infer<S>) => Promise<string>;
}): AgentTool {
  const jsonSchema = z.toJSONSchema(opts.schema, { reused: "ref" }) as Record<string, unknown>;
  // The API rejects tool schemas without this.
  jsonSchema.additionalProperties = false;

  return {
    name: opts.name,
    description: opts.description,
    inputSchema: jsonSchema,
    run: opts.run as (input: any) => Promise<string>,
    parse: (input: unknown): ToolResult => {
      const parsed = opts.schema.safeParse(input);
      return parsed.success
        ? { ok: true, data: parsed.data }
        : { ok: false, error: parsed.error.message };
    },
  };
}

/**
 * Live pricing. The persona prompt deliberately contains no prices — this tool
 * is the only sanctioned source, so a price change in the DB takes effect on the
 * next draft with no deploy.
 */
const getServicePrices = defineTool({
  name: "get_service_prices",
  description:
    "Get the current live GenX service prices and turnaround estimates. " +
    "ALWAYS call this before quoting any price. Never state a price from memory.",
  schema: z.object({
    service: z
      .string()
      .optional()
      .describe("Optional filter, e.g. 'digitizing', 'vector', 'patch', 'sewout', 'puff'."),
  }),
  run: async ({ service }) => {
    const admin = createAdminClient();
    let q = admin
      .from("service_tiers")
      .select("id, label, size_desc, price, est_hours, is_big_design")
      .eq("is_active", true)
      .order("sort_order");
    if (service) q = q.ilike("id", `%${service}%`);

    const { data, error } = await q;
    if (error) return `Price lookup failed: ${error.message}`;
    if (!data?.length)
      return "No active service tiers matched that filter. Say the quote depends on the artwork and let a human price it.";

    return data
      .map(
        (t) =>
          `${t.label} (${t.size_desc}) — $${Number(t.price).toFixed(2)}, ` +
          `est. ${t.est_hours}${t.is_big_design ? " [large format]" : ""} [id: ${t.id}]`
      )
      .join("\n");
  },
});

/**
 * Published business policy — samples, refunds, revisions, turnaround,
 * guarantees.
 *
 * The drafting prompt used to instruct the model to "state the actual sample
 * policy" while giving it no source for one, and separately to never guess
 * about refunds or deadlines. This is the source. Anything not in it gets
 * "I'll check with the team", because a wrong answer about a refund is a
 * promise the business has to honour.
 */
const getBusinessPolicy = defineTool({
  name: "get_business_policy",
  description:
    "Look up GenX's published policy on samples, refunds, revisions, turnaround, " +
    "guarantees, payment timing, pricing model or file formats. Call this before " +
    "answering ANY policy question. With no topic, it returns every published " +
    "policy. If a question is not covered here, say you will check with the team — " +
    "never answer a policy question from memory.",
  schema: z.object({
    topic: z
      .string()
      .optional()
      .describe("e.g. 'sample', 'refund', 'revisions', 'turnaround'. Omit for all."),
  }),
  run: async ({ topic }) => {
    if (!topic) {
      return `PUBLISHED POLICY:\n${renderPolicyForModel()}`;
    }
    const entry = findPolicy(topic);
    if (!entry) {
      return (
        `No published policy covers "${topic}". Do not answer from memory and do not ` +
        `improvise. Reply: "${POLICY_UNKNOWN_REPLY}"`
      );
    }
    return `[${entry.topic}] ${entry.statement}\n(published at: ${entry.publishedAt})`;
  },
});

/**
 * Order history, keyed by email so the model never handles a customer UUID.
 */
const getCustomerOrders = defineTool({
  name: "get_customer_orders",
  description:
    "Look up a customer's past orders by email address. Use to ground upsell " +
    "suggestions and repeat-order context in real history rather than guesses.",
  schema: z.object({
    email: z.string().describe("The customer's email address"),
  }),
  run: async ({ email }) => {
    const admin = createAdminClient();

    const { data: clientRow } = await admin
      .from("clients")
      .select("id, company_name, ltv, credit_balance, users!inner(email)")
      .eq("users.email", email.toLowerCase())
      .maybeSingle();

    if (!clientRow) return `No registered client account for ${email}.`;

    const { data: orders } = await admin
      .from("orders")
      .select(
        "order_number, status, service_tier_id, width_inches, height_inches, price, currency, created_at"
      )
      .eq("client_id", clientRow.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const head =
      `Client: ${clientRow.company_name || "(no company)"} | ` +
      `lifetime value $${Number(clientRow.ltv || 0).toFixed(2)} | ` +
      `credit balance $${Number(clientRow.credit_balance || 0).toFixed(2)}`;

    if (!orders?.length) return `${head}\nNo orders yet.`;

    const lines = orders.map(
      (o) =>
        `${o.order_number} — ${o.service_tier_id}, ${o.status}, ` +
        `${o.width_inches ?? "?"}x${o.height_inches ?? "?"}in, ` +
        `$${Number(o.price).toFixed(2)} ${o.currency}, ` +
        `${new Date(o.created_at).toISOString().slice(0, 10)}`
    );

    return [head, ...lines].join("\n");
  },
});

export const SALES_TOOLS: AgentTool[] = [
  getServicePrices,
  getBusinessPolicy,
  getCustomerOrders,
];

/** Tool definitions in the wire shape the Messages API expects. */
const TOOL_DEFS = SALES_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.inputSchema,
}));

// ---------------------------------------------------------------- draft

export interface DraftRequest {
  /** Plain-text briefing assembled by the caller (lead record + thread). */
  briefing: string;
  /** Optional staff instruction, e.g. "customer asked for a rush quote". */
  instruction?: string;
  maxIterations?: number;
}

export interface DraftResult {
  draft: string;
  escalated: boolean;
  toolCalls: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

/**
 * Produce one draft reply by running the agentic loop to completion.
 *
 * Throws Anthropic SDK errors unchanged so the calling route can map them to
 * HTTP status codes.
 */
export async function draftReply({
  briefing,
  instruction,
  maxIterations = MAX_ITERATIONS,
}: DraftRequest): Promise<DraftResult> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: instruction ? `${briefing}\n\n---\n\nSTAFF INSTRUCTION: ${instruction}` : briefing,
    },
  ];

  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };
  let toolCalls = 0;

  for (let turn = 0; turn < maxIterations; turn++) {
    const response = await client().messages.create({
      model: SALES_MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: "text",
          text: GENX_SYSTEM,
          // Frozen prefix — the cache breakpoint stays here. Volatile context
          // goes in `messages`, never in this block.
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: TOOL_DEFS,
      messages,
    });

    totals.inputTokens += response.usage.input_tokens;
    totals.outputTokens += response.usage.output_tokens;
    totals.cacheReadTokens += response.usage.cache_read_input_tokens ?? 0;
    totals.cacheCreationTokens += response.usage.cache_creation_input_tokens ?? 0;

    // A refusal can cut a tool_use off mid-input — never run that turn's tools.
    if (response.stop_reason === "refusal") {
      throw new Error(
        `Model declined to draft (category: ${response.stop_details?.category ?? "unknown"}).`
      );
    }

    // A tool input truncated at max_tokens usually still parses as a valid
    // partial object; running it on truncated input is worse than failing.
    if (response.stop_reason === "max_tokens") {
      throw new Error(
        `Draft hit max_tokens (${MAX_TOKENS}) before finishing — shorten the briefing or raise MAX_TOKENS.`
      );
    }

    // Server-side tool iteration limit: hand the turn back and continue.
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      // end_turn, stop_sequence, or any other terminal state.
      const draft = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();

      if (!draft) {
        throw new Error(`No draft produced (stop_reason: ${response.stop_reason ?? "unknown"}).`);
      }

      return {
        draft,
        escalated: draft.startsWith("ESCALATE:"),
        toolCalls,
        usage: totals,
      };
    }

    messages.push({ role: "assistant", content: response.content });

    // All tool_results go back in ONE user message. Splitting them across
    // messages silently teaches the model to stop calling tools in parallel.
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const call of toolUses) {
      const tool = SALES_TOOLS.find((t) => t.name === call.name);
      if (!tool) {
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          is_error: true,
          content: `Unknown tool "${call.name}".`,
        });
        continue;
      }

      const parsed = tool.parse(call.input);
      if (!parsed.ok) {
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          is_error: true,
          content: `Invalid arguments: ${parsed.error}`,
        });
        continue;
      }

      try {
        const out = await tool.run(parsed.data);
        toolCalls++;
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          content: out,
        });
      } catch (e: any) {
        results.push({
          type: "tool_result",
          tool_use_id: call.id,
          is_error: true,
          content: `Tool failed: ${e?.message ?? String(e)}`,
        });
      }
    }

    messages.push({ role: "user", content: results });
  }

  throw new Error(
    `Draft did not finish within ${maxIterations} tool iterations — the model kept calling tools.`
  );
}

// ---------------------------------------------------------------- briefing

/**
 * Assemble the per-request briefing. Everything volatile lives here so the
 * cached system prefix stays byte-identical across requests.
 */
/**
 * Remove lines this system wrote into the notes timeline.
 *
 * The notes column carries both the customer's own words and our machine-written
 * annotations — "[2026-08-14T10:31:00Z] Stage changed: New Lead → Contacted",
 * "UPLOAD FAILED for: logo.png", "Reference: GX-7K2M9Q". Feeding those to the
 * model as context is noise at best and misleading at worst: an internal note
 * about a failed upload is not something the customer said, and a note about a
 * stage change has nothing to do with their question.
 */
export function stripInternalAnnotations(notes: string): string {
  return notes
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim();
      if (!t) return true; // keep paragraph breaks
      // Only the "[<ISO timestamp>] Event — …" shape is ours. Matching any
      // bracketed prefix would also swallow a staff note like
      // "[urgent] caller wants it before Friday".
      if (/^\[\d{4}-\d{2}-\d{2}[T ][^\]]*\]\s/.test(t)) return false;
      if (/^Reference:\s*GX-/i.test(t)) return false;
      if (/^UPLOAD FAILED for:/i.test(t)) return false;
      if (/^Artwork:\s*UPLOAD FAILED/i.test(t)) return false;
      if (/^The customer believes a file was attached/i.test(t)) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildLeadBriefing(lead: any, thread: any[] = []): string {
  const parts: string[] = ["## LEAD RECORD"];

  parts.push(`Name: ${lead.contact_name || "(unknown)"}`);
  if (lead.company) parts.push(`Company: ${lead.company}`);
  if (lead.email) parts.push(`Email: ${lead.email}`);
  if (lead.country) parts.push(`Country: ${lead.country}`);
  if (lead.phone) parts.push(`Phone: ${lead.phone}`);
  parts.push(`Pipeline stage: ${lead.stage}`);
  if (lead.source) parts.push(`Source: ${lead.source}`);
  if (lead.deal_value) parts.push(`Deal value: $${lead.deal_value}`);
  if (lead.created_at)
    parts.push(`First seen: ${new Date(lead.created_at).toISOString().slice(0, 10)}`);
  if (lead.updated_at)
    parts.push(`Record last updated: ${new Date(lead.updated_at).toISOString().slice(0, 10)}`);
  if (lead.follow_up_at)
    parts.push(`Follow-up due: ${new Date(lead.follow_up_at).toISOString().slice(0, 10)}`);
  if (lead.lost_reason) parts.push(`Lost reason: ${lead.lost_reason}`);

  if (lead.notes) {
    const customerFacing = stripInternalAnnotations(lead.notes);
    if (customerFacing) {
      // Labelled as unverified on purpose. These are typed by staff under time
      // pressure and are often out of date — a note reading "quoted $40 for the
      // jacket back" from three months ago is not a price the assistant may
      // repeat, and it reads as a fact unless it is marked otherwise.
      parts.push(
        "\n## CRM NOTES (internal, written by staff, may be stale or wrong)\n" +
          "Use for background only. Do NOT quote anything from here to the customer " +
          "as fact — prices, promises and dates must come from the tools.\n"
      );
      parts.push(customerFacing);
    }
  }

  if (thread.length) {
    parts.push("\n## CONVERSATION SO FAR (oldest first)");
    for (const m of thread) {
      const who = m.direction === "inbound" ? "CUSTOMER" : "GENX STAFF";
      const when = m.created_at
        ? new Date(m.created_at).toISOString().slice(0, 16).replace("T", " ")
        : "";
      parts.push(`\n[${who}${when ? " " + when : ""}]\n${m.body}`);
    }
  } else {
    parts.push(
      "\n## CONVERSATION SO FAR\nNo prior messages. This is the first reply to this lead."
    );
  }

  parts.push(
    "\n---\nDraft the next reply from GenX staff to this customer, following DRAFTING MODE."
  );

  return parts.join("\n");
}
