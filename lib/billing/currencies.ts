import type { CurrencyCode } from "@/lib/billing/types";

const symbols: Record<string, string> = {
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "C$",
  AUD: "A$",
};

export function getCurrencySymbol(currency: CurrencyCode) {
  return symbols[currency] ?? `${currency} `;
}