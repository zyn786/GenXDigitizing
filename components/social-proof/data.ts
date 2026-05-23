// Fake live-order notification data — used by LiveOrderProvider

export interface FakeClient {
  firstName: string;
  country: string;
  flag: string;
}

export interface FakeService {
  label: string;
  emoji: string;
  accent: string;
}

export interface FakeNotification {
  id: string;
  client: FakeClient;
  service: FakeService;
  timestamp: Date;
  timeAgo: string;
}

// ── Client pool ──────────────────────────────────────────────
const CLIENTS_USA: FakeClient[] = [
  { firstName: "Michael", country: "Texas", flag: "🇺🇸" },
  { firstName: "James", country: "California", flag: "🇺🇸" },
  { firstName: "Robert", country: "Florida", flag: "🇺🇸" },
  { firstName: "David", country: "New York", flag: "🇺🇸" },
  { firstName: "Chris", country: "Ohio", flag: "🇺🇸" },
  { firstName: "Sarah", country: "Illinois", flag: "🇺🇸" },
  { firstName: "Emily", country: "Georgia", flag: "🇺🇸" },
  { firstName: "Jessica", country: "Michigan", flag: "🇺🇸" },
  { firstName: "Brian", country: "Arizona", flag: "🇺🇸" },
  { firstName: "Kevin", country: "Colorado", flag: "🇺🇸" },
];

const CLIENTS_UK: FakeClient[] = [
  { firstName: "Oliver", country: "London", flag: "🇬🇧" },
  { firstName: "Harry", country: "Manchester", flag: "🇬🇧" },
  { firstName: "George", country: "Birmingham", flag: "🇬🇧" },
  { firstName: "Thomas", country: "Liverpool", flag: "🇬🇧" },
  { firstName: "Emma", country: "Glasgow", flag: "🇬🇧" },
  { firstName: "Sophie", country: "Leeds", flag: "🇬🇧" },
];

const CLIENTS_CANADA: FakeClient[] = [
  { firstName: "Liam", country: "Toronto", flag: "🇨🇦" },
  { firstName: "Ethan", country: "Vancouver", flag: "🇨🇦" },
  { firstName: "Noah", country: "Montreal", flag: "🇨🇦" },
  { firstName: "Olivia", country: "Calgary", flag: "🇨🇦" },
  { firstName: "Ava", country: "Ottawa", flag: "🇨🇦" },
];

const CLIENTS_AUSTRALIA: FakeClient[] = [
  { firstName: "Jack", country: "Sydney", flag: "🇦🇺" },
  { firstName: "Ruby", country: "Melbourne", flag: "🇦🇺" },
  { firstName: "Charlie", country: "Brisbane", flag: "🇦🇺" },
  { firstName: "Chloe", country: "Perth", flag: "🇦🇺" },
  { firstName: "Lucas", country: "Adelaide", flag: "🇦🇺" },
];

const CLIENTS_UAE: FakeClient[] = [
  { firstName: "Ahmed", country: "Dubai", flag: "🇦🇪" },
  { firstName: "Fatima", country: "Abu Dhabi", flag: "🇦🇪" },
  { firstName: "Omar", country: "Sharjah", flag: "🇦🇪" },
  { firstName: "Mariam", country: "Dubai", flag: "🇦🇪" },
];

// ── Service pool ─────────────────────────────────────────────
export const SERVICES: FakeService[] = [
  { label: "Embroidery Order", emoji: "🧵", accent: "#2563EB" },
  { label: "Vector Redraw", emoji: "✏️", accent: "#F97316" },
  { label: "Cap Digitizing", emoji: "🧢", accent: "#2563EB" },
  { label: "Jacket Back Design", emoji: "🧥", accent: "#F97316" },
  { label: "Patch Set", emoji: "🏷️", accent: "#16A34A" },
  { label: "Left Chest Logo", emoji: "👕", accent: "#2563EB" },
  { label: "Puff Embroidery", emoji: "🎩", accent: "#F97316" },
  { label: "Patch Design", emoji: "🏷️", accent: "#16A34A" },
];

// ── Combined client pool ─────────────────────────────────────
const ALL_CLIENTS: FakeClient[] = [
  ...CLIENTS_USA,
  ...CLIENTS_UK,
  ...CLIENTS_CANADA,
  ...CLIENTS_AUSTRALIA,
  ...CLIENTS_UAE,
];

/** Pick a random item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Track recently used clients to avoid repeats
const recentClients = new Set<string>();
const MAX_RECENT = 15;

/** Generate a single fake notification */
export function generateNotification(): FakeNotification {
  // Pick a client not shown recently (or any if pool exhausted)
  const available = ALL_CLIENTS.filter((c) => !recentClients.has(c.firstName));
  const client = pick(available.length > 0 ? available : ALL_CLIENTS);

  // Track for recency
  recentClients.add(client.firstName);
  if (recentClients.size > MAX_RECENT) {
    const first = recentClients.values().next().value;
    if (first) recentClients.delete(first);
  }

  const service = pick(SERVICES);

  // Random time 10–120 seconds ago
  const secondsAgo = Math.floor(Math.random() * 110) + 10;
  const timestamp = new Date(Date.now() - secondsAgo * 1000);

  let timeAgo: string;
  if (secondsAgo < 60) {
    timeAgo = `${secondsAgo} seconds ago`;
  } else {
    const mins = Math.floor(secondsAgo / 60);
    timeAgo = `${mins} minute${mins > 1 ? "s" : ""} ago`;
  }

  return {
    id: crypto.randomUUID(),
    client,
    service,
    timestamp,
    timeAgo,
  };
}
