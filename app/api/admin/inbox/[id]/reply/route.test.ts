import { describe, it, expect, vi, beforeEach } from "vitest";

const { assertInboxStaff, getReplyTarget, recordOutbound, recordReplySentEvent, sendWhatsAppText } =
  vi.hoisted(() => ({
    assertInboxStaff: vi.fn(),
    getReplyTarget: vi.fn(),
    recordOutbound: vi.fn(),
    recordReplySentEvent: vi.fn(),
    sendWhatsAppText: vi.fn(),
  }));

vi.mock("@/lib/inbox/queries", () => ({
  assertInboxStaff,
  getReplyTarget,
  recordOutbound,
  recordReplySentEvent,
  NotInboxStaffError: class NotInboxStaffError extends Error {},
}));

vi.mock("@/lib/whatsapp/send", () => ({ sendWhatsAppText }));

const { POST } = await import("./route");

const HOUR = 3600_000;
const inboundAgo = (ms: number) => new Date(Date.now() - ms).toISOString();

const request = (body: unknown) =>
  ({ json: async () => body }) as unknown as import("next/server").NextRequest;

const params = (id: string) => ({ params: Promise.resolve({ id }) });

/** A thread that is inside the window and has an address. */
function openThread(overrides: Record<string, unknown> = {}) {
  return {
    conversationId: "c1",
    channel: "whatsapp",
    externalId: "923001234567",
    lastInboundAt: inboundAgo(HOUR),
    leadId: "lead-1",
    displayName: "Ayesha",
    ...overrides,
  };
}

async function call(body: unknown, id = "c1") {
  const res = await POST(request(body), params(id));
  return { status: res.status, json: await res.json() };
}

beforeEach(() => {
  vi.clearAllMocks();
  assertInboxStaff.mockResolvedValue({ id: "u1", role: "admin", full_name: "Test Admin" });
  sendWhatsAppText.mockResolvedValue({ ok: true, messageId: "wamid.ABC" });
  recordOutbound.mockImplementation(async (_id: string, m: any) => ({
    id: "m1",
    direction: "outbound",
    body: m.body,
    attachments: null,
    provider: m.provider,
    sentBy: m.sentBy,
    externalId: m.externalId,
    createdAt: new Date().toISOString(),
  }));
});

/**
 * This endpoint is the only thing in the inbox that reaches a customer, so the
 * tests that matter are the ones proving it does NOT send.
 */
describe("reply route — when it must not send", () => {
  it("refuses a non-staff caller without touching the provider", async () => {
    const { NotInboxStaffError } = await import("@/lib/inbox/queries");
    assertInboxStaff.mockRejectedValue(new NotInboxStaffError());

    const { status } = await call({ body: "hello" });
    expect(status).toBe(403);
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("refuses a channel with no send path", async () => {
    getReplyTarget.mockResolvedValue(openThread({ channel: "instagram" }));

    const { status, json } = await call({ body: "hello" });
    expect(status).toBe(409);
    expect(json.reason).toBe("unsupported_channel");
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("refuses outside the 24-hour window", async () => {
    getReplyTarget.mockResolvedValue(openThread({ lastInboundAt: inboundAgo(30 * HOUR) }));

    const { status, json } = await call({ body: "hello" });
    expect(status).toBe(409);
    expect(json.reason).toBe("window_closed");
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("refuses a thread the customer never wrote in", async () => {
    getReplyTarget.mockResolvedValue(openThread({ lastInboundAt: null }));

    const { status, json } = await call({ body: "hello" });
    expect(status).toBe(409);
    expect(json.reason).toBe("no_inbound");
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("refuses an empty or whitespace-only body", async () => {
    getReplyTarget.mockResolvedValue(openThread());

    expect((await call({ body: "   " })).status).toBe(400);
    expect((await call({})).status).toBe(400);
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("404s an unknown thread", async () => {
    getReplyTarget.mockResolvedValue(null);
    expect((await call({ body: "hello" })).status).toBe(404);
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  it("refuses when the contact has no address on the channel", async () => {
    getReplyTarget.mockResolvedValue(openThread({ externalId: null }));

    const { status, json } = await call({ body: "hello" });
    expect(status).toBe(409);
    expect(json.reason).toBe("no_address");
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });
});

describe("reply route — when it does send", () => {
  it("sends to the contact's address and records what went out", async () => {
    getReplyTarget.mockResolvedValue(openThread());

    const { status, json } = await call({ body: "  Yes, we can do that.  " });

    expect(status).toBe(201);
    expect(json.recorded).toBe(true);
    expect(sendWhatsAppText).toHaveBeenCalledWith("923001234567", "Yes, we can do that.");
    expect(recordOutbound).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        body: "Yes, we can do that.", // trimmed
        provider: "whatsapp",
        externalId: "wamid.ABC",
        sentBy: "u1", // from the session, never from the request body
      })
    );
  });

  it("never sends a message the provider rejected, and records nothing", async () => {
    getReplyTarget.mockResolvedValue(openThread());
    sendWhatsAppText.mockResolvedValue({ ok: false, error: "(#131047) ...", code: 131047 });

    const { status, json } = await call({ body: "hello" });

    expect(status).toBe(502);
    expect(json.error).toMatch(/24-hour window closed/);
    expect(recordOutbound).not.toHaveBeenCalled();
  });

  it("does not trust a sentBy in the body over the session", async () => {
    getReplyTarget.mockResolvedValue(openThread());

    await call({ body: "hello", sentBy: "someone-else" });

    expect(recordOutbound.mock.calls[0][1].sentBy).toBe("u1");
  });

  it("puts the reply on the lead timeline, attributed to the sender", async () => {
    getReplyTarget.mockResolvedValue(openThread());

    await call({ body: "Yes, we can do that." });

    expect(recordReplySentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: "lead-1",
        channel: "whatsapp",
        body: "Yes, we can do that.",
        actorId: "u1",
        actorLabel: "Test Admin",
        conversationId: "c1",
      })
    );
  });

  it("skips the timeline event when the thread is not attached to a lead", async () => {
    getReplyTarget.mockResolvedValue(openThread({ leadId: null }));

    const { status } = await call({ body: "hello" });

    expect(status).toBe(201);
    expect(recordReplySentEvent).not.toHaveBeenCalled();
  });

  it("still reports the reply as recorded when only the timeline event fails", async () => {
    getReplyTarget.mockResolvedValue(openThread());
    // recordLeadEvent swallows its own errors, but the route must not depend on
    // that. A throw here landing in the "sent but not recorded" handler would
    // tell staff the reply is missing from the thread when it is right there —
    // and that warning exists precisely so they do not send it again.
    recordReplySentEvent.mockRejectedValue(new Error("lead_events insert failed"));

    const { status, json } = await call({ body: "hello" });

    expect(status).toBe(201);
    expect(json.ok).toBe(true);
    expect(json.recorded).toBe(true); // the message row DID land
    expect(json.warning).toBeUndefined();
  });

  /**
   * The honest-failure case. The customer HAS been messaged, so reporting a
   * failure would invite a duplicate reply; reporting a clean success would
   * hide that the history is now missing a message.
   */
  it("reports a sent-but-unrecorded reply as a success with a warning", async () => {
    getReplyTarget.mockResolvedValue(openThread());
    recordOutbound.mockRejectedValue(new Error("insert failed"));

    const { status, json } = await call({ body: "hello" });

    expect(status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.recorded).toBe(false);
    expect(json.warning).toMatch(/was sent, but it could not be saved/);
    expect(sendWhatsAppText).toHaveBeenCalledTimes(1);
  });
});
