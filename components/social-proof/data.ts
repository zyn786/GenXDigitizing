// Live-order notification types — driven by real Supabase orders

export interface LiveNotification {
  id: string;
  clientName: string;
  serviceLabel: string;
  timestamp: Date;
  timeAgo: string;
}

/** Format a Date into a human-readable "time ago" string */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/** Map a service label to an emoji */
export function serviceEmoji(label: string): string {
  const map: Record<string, string> = {
    digitizing: "🧵",
    embroidery: "🧵",
    vector: "✏️",
    "vector art": "✏️",
    "vector redraw": "✏️",
    patches: "🏷️",
    "custom patches": "🏷️",
    "patch design": "🏷️",
    "cap digitizing": "🧢",
    "jacket back": "🧥",
    "left chest": "👕",
    "puff embroidery": "🎩",
  };
  const lower = label.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lower.includes(key)) return emoji;
  }
  return "🧵";
}

/** Map a service label to an accent color */
export function serviceAccent(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("vector") || lower.includes("jacket") || lower.includes("puff")) return "#F97316";
  if (lower.includes("patch")) return "#16A34A";
  return "#2563EB";
}
