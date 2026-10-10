import { describe, it, expect } from "vitest";
import { extractWhatsAppMessages } from "./whatsapp";
import { extractMetaMessages } from "./meta";

/** A realistic WhatsApp text message, with Meta's full nesting. */
function waText(text = "Do you digitize cap logos?", from = "923001234567") {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "BIZ",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              contacts: [{ profile: { name: "Dana Whitfield" }, wa_id: from }],
              messages: [
                {
                  from,
                  id: "wamid.ABC123",
                  timestamp: "1760000000",
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe("extractWhatsAppMessages", () => {
  it("reads a text message and names the sender", () => {
    const [m] = extractWhatsAppMessages(waText());
    expect(m.channel).toBe("whatsapp");
    expect(m.externalId).toBe("923001234567");
    expect(m.displayName).toBe("Dana Whitfield");
    expect(m.body).toBe("Do you digitize cap logos?");
    expect(m.providerMessageId).toBe("wamid.ABC123");
    // WhatsApp never gives an email; the identity map matches on the phone.
    expect(m.email).toBeNull();
  });

  it("converts Meta's unix-seconds timestamp", () => {
    const [m] = extractWhatsAppMessages(waText());
    expect(new Date(m.receivedAt!).getUTCFullYear()).toBe(2025);
  });

  it("labels media rather than storing an empty body", () => {
    // The customer sent something. An empty body would look like a glitch.
    const payload = waText();
    const msg = payload.entry[0].changes[0].value.messages[0] as any;
    delete msg.text;
    msg.type = "image";
    msg.image = { id: "media-1", mime_type: "image/jpeg" };

    const [m] = extractWhatsAppMessages(payload);
    expect(m.body).toBe("[image]");
    expect(m.attachments).not.toBeNull();
  });

  it("ignores delivery receipts, which carry no messages", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [{ value: { statuses: [{ id: "wamid.X", status: "delivered" }] } }],
        },
      ],
    };
    expect(extractWhatsAppMessages(payload)).toEqual([]);
  });

  it("skips a message whose sender cannot be normalised", () => {
    // No usable number means we cannot say who this is. Inventing one merges
    // two customers silently.
    expect(extractWhatsAppMessages(waText("hi", "123"))).toEqual([]);
  });

  it("survives a malformed or empty payload instead of throwing", () => {
    expect(extractWhatsAppMessages(null)).toEqual([]);
    expect(extractWhatsAppMessages({})).toEqual([]);
    expect(extractWhatsAppMessages({ entry: [{ changes: [{}] }] })).toEqual([]);
    expect(extractWhatsAppMessages({ entry: "not an array" })).toEqual([]);
  });

  it("reads several messages from one delivery", () => {
    const payload = waText();
    const msgs = payload.entry[0].changes[0].value.messages;
    msgs.push({ ...msgs[0], id: "wamid.DEF456", text: { body: "Second one" } });
    expect(extractWhatsAppMessages(payload)).toHaveLength(2);
  });
});

describe("extractMetaMessages", () => {
  function igMessage(overrides: any = {}) {
    return {
      object: "instagram",
      entry: [
        {
          id: "PAGE",
          messaging: [
            {
              sender: { id: "17841400000000000" },
              recipient: { id: "PAGE" },
              timestamp: 1760000000000,
              message: { mid: "mid.ABC", text: "How much for a left chest logo?" },
              ...overrides,
            },
          ],
        },
      ],
    };
  }

  it("files an Instagram DM under instagram", () => {
    const [m] = extractMetaMessages(igMessage());
    expect(m.channel).toBe("instagram");
    expect(m.externalId).toBe("17841400000000000");
    expect(m.body).toBe("How much for a left chest logo?");
    expect(m.providerMessageId).toBe("mid.ABC");
  });

  it("files a Facebook message under facebook", () => {
    // Messenger arrives with object: "page" — the same entry shape, a
    // different channel. Anything that is not explicitly Instagram is Facebook,
    // because those are the only two objects this endpoint receives.
    const payload = igMessage();
    payload.object = "page";
    const [m] = extractMetaMessages(payload);
    expect(m.channel).toBe("facebook");
  });

  it("never records our own echoed message as inbound", () => {
    // Otherwise the thread shows a reply from the customer that they never sent.
    const payload = igMessage();
    payload.entry[0].messaging[0].message.is_echo = true;
    expect(extractMetaMessages(payload)).toEqual([]);
  });

  it("counts a postback button tap as a message", () => {
    // A tap is a deliberate action even though nothing was typed.
    const payload = igMessage();
    delete payload.entry[0].messaging[0].message;
    payload.entry[0].messaging[0].postback = { title: "Get a quote" };
    const [m] = extractMetaMessages(payload);
    expect(m.body).toBe("Get a quote");
  });

  it("ignores read receipts and reactions", () => {
    const payload = igMessage();
    delete payload.entry[0].messaging[0].message;
    payload.entry[0].messaging[0].read = { mid: "mid.ABC" };
    expect(extractMetaMessages(payload)).toEqual([]);
  });

  it("skips a non-numeric sender id", () => {
    const payload = igMessage();
    payload.entry[0].messaging[0].sender.id = "dana_whitfield";
    expect(extractMetaMessages(payload)).toEqual([]);
  });

  it("survives an empty payload", () => {
    expect(extractMetaMessages(null)).toEqual([]);
    expect(extractMetaMessages({ object: "instagram" })).toEqual([]);
  });
});
