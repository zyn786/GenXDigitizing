<<<<<<< HEAD
# Phase 7 Patch — Notifications + Web Chat

This patch adds the **Phase 7 foundation** for:

- email + web-based chat notifications
- support inbox threads
- order-linked and invoice-linked chat threads
- internal-only notes vs client-visible messages
- reminder rule scaffolding
- separate chat attachments bucket policy
- unit, integration, and E2E starter coverage

## Important implementation choice

This patch is designed as a **merge-safe scaffold**:

- it does **not** force a Prisma migration immediately
- it uses a **mock repository** for chat and notification previews first
- it includes a **Prisma schema snippet** you can merge when you are ready for persistent chat/notification storage

That keeps the patch low-risk while matching your current app architecture.

## Scope included

### Client-facing
- `/client/support`
- `/client/support/[threadId]`

### Admin/internal
- `/admin/support`
- `/admin/support/[threadId]`

### Shared
- chat thread list UI
- chat thread view UI
- message composer UI
- notification rule helpers
- notification event type definitions
- mock repository
- API stub for posting messages
- Prisma snippet for Phase 7 persistence
- tests

## Locked Phase 7 assumptions encoded here

- channel set = **Email + Web Chat**
- **No WhatsApp**
- support model = **general support + order/invoice-linked threads**
- upload bucket = **separate chat attachments bucket**
- single upload limit = **200 MB**
- allowed file types:
  - images
  - PDF
  - AI
  - EPS
  - SVG
  - DST
  - EMB
  - ZIP
  - PSD
  - MP4
- clients can edit messages for **1 minute**
- clients cannot delete messages
- staff can edit messages, cannot delete
- internal-only notes supported
- reminders can target:
  - assigned internal user
  - shared operations inbox/group
  - client
- timing model = **global defaults with per-event overrides**
- fixed system templates only

## Merge notes

### 1) Add support links to protected nav
Recommended nav updates:

```ts
client: [
  { href: "/client/orders", label: "Orders" },
  { href: "/client/files", label: "Files" },
  { href: "/client/revisions", label: "Revisions" },
  { href: "/client/invoices", label: "Invoices" },
  { href: "/client/support", label: "Support" },
]

admin: [
  { href: "/admin/orders", label: "Operations Queue" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/support", label: "Support Inbox" },
  { href: "/admin/audit", label: "Audit Access" },
]
```

### 2) Start with mock data
This patch uses `lib/chat/mock-repository.ts` so the UI can ship before Prisma persistence is merged.

### 3) Move to persistence later
When ready, merge `prisma/phase7-notifications-chat.snippet.prisma` into your schema and replace the mock repository with Prisma-backed queries.

## Suggested validation run after merge

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm dev
```

## Suggested manual checks

### Client
- log in as client
- open `/client/support`
- open a support thread
- open an order-linked thread
- verify internal notes are **not** shown

### Admin
- log in as manager
- open `/admin/support`
- open a thread
- verify internal-only messages are visible internally
- verify linked context (order/invoice/support) renders

### API
- POST a message to `/api/chat/threads/[threadId]/messages`
- verify success response
- verify upload limit / editing rules are shown in UI copy

## Next best follow-up after this patch

The next implementation step after merging this scaffold is:

- **Prisma-backed chat storage**
- **real email send via Resend**
- **notification dispatch log**
- **scheduled reminder worker**
=======
# GenXDigitizing
Embroidery Digitizing, Vector Art &amp; Custom Patches — Delivered Production-Ready.
>>>>>>> ae96d834ae95b2846b2f59af600155a9c9d9e0d8
