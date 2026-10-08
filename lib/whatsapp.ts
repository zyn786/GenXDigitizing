import "server-only";

const GRAPH_VERSION = process.env.WHATSAPP_API_VERSION;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

function assertConfigured() {
  if (!GRAPH_VERSION || !PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    throw new Error("WhatsApp Cloud API is not configured");
  }
}

async function requestGraph(body: Record<string, unknown>) {
  assertConfigured();
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendWhatsAppText(to: string, body: string) {
  return requestGraph({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeWhatsAppNumber(to),
    type: "text",
    text: { preview_url: false, body },
  });
}

export async function sendWhatsAppTemplate(
  to: string,
  name: string,
  languageCode = "en_US",
  parameters: string[] = [],
) {
  return requestGraph({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizeWhatsAppNumber(to),
    type: "template",
    template: {
      name,
      language: { code: languageCode },
      ...(parameters.length
        ? {
            components: [{
              type: "body",
              parameters: parameters.map((text) => ({ type: "text", text })),
            }],
          }
        : {}),
    },
  });
}

export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\\d]/g, "");
}
