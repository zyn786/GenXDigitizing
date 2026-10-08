import "server-only";
import { sendWhatsAppText } from "@/lib/whatsapp";

const recipients = () =>
  (process.env.GENX_WHATSAPP_ALERT_NUMBERS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export async function notifyGenXWhatsApp(message: string) {
  const numbers = recipients();
  if (!numbers.length) return { sent: 0 };

  const results = await Promise.allSettled(
    numbers.map((number) => sendWhatsAppText(number, message)),
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

export async function notifyNewLeadWhatsApp(input: {
  name: string;
  service?: string;
  email?: string;
  phone?: string;
}) {
  const lines = [
    "🆕 GenX New Lead",
    `Name: ${input.name}`,
    input.service ? `Service: ${input.service}` : null,
    input.email ? `Email: ${input.email}` : null,
    input.phone ? `WhatsApp: ${input.phone}` : null,
    "Open the CRM to follow up.",
  ].filter(Boolean);

  return notifyGenXWhatsApp(lines.join("\n"));
}

export async function notifyOrderWhatsApp(input: {
  orderNumber: string;
  status: string;
  price?: number;
  priority?: string;
}) {
  return notifyGenXWhatsApp([
    "📦 GenX Order Update",
    `Order: ${input.orderNumber}`,
    `Status: ${input.status}`,
    input.price != null ? `Value: $${input.price.toFixed(2)}` : null,
    input.priority ? `Priority: ${input.priority}` : null,
  ].filter(Boolean).join("\n"));
}
