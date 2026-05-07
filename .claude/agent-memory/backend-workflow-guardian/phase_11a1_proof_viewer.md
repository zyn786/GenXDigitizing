---
name: Phase 11A.1 Client Proof Viewer
description: Client-side proof preview endpoint and UI added May 2026 — signed-URL gating, MIME/extension allowlist, proofStatus reviewable set.
type: project
---

Phase 11A.1 added client-facing proof preview viewing on top of 11A.0 hardening.

**Why:** Clients had no way to view PROOF_PREVIEW images uploaded by designers — `/api/client/orders/[orderId]/files` is FINAL_FILE-only by design, so a separate read path was needed that exposes preview images without ever leaking objectKey/bucket or production machine files.

**How to apply:**

- New endpoint: `app/api/client/orders/[orderId]/proof-files/route.ts`. Auth: CLIENT-only (403 otherwise), owns the order via `clientUserId === session.user.id` (404 otherwise).
- Reviewable proofStatus set: `SENT_TO_CLIENT | CLIENT_REVIEWING | CLIENT_APPROVED | REVISION_REQUESTED`. Anything else returns `{ ok: true, files: [] }` — never an error, just empty.
- Filtering: `fileType === "PROOF_PREVIEW"` plus an allowlist (`image/jpeg`, `image/jpg`, `image/png`, `application/pdf`) and a blocklist of machine-file extensions (dst/pes/emb/exp/jef/vp3/xxx/hus/sew/dxt/zip). Failing files are silently omitted, not errored.
- Response shape: `{ id, fileName, mimeType, sizeBytes, createdAt, previewUrl }`. `objectKey` and `bucket` MUST never appear in the response — generate `previewUrl` via `createGetSignedUrl(bucket, objectKey, 300)` and drop the raw fields.
- TTL: 300 seconds matches the existing download route convention.
- UI component: `components/workflow/client-proof-preview.tsx` ("use client"). Renders inside the existing Proof Review card on `app/(client)/client/orders/[orderId]/page.tsx`, ABOVE `ClientProofReview`. Same conditional gate as `ClientProofReview` — do not widen.
- The existing client order detail page wraps it in a CardContent with `grid gap-4`; a "Final machine files locked" notice was added below `ClientProofReview` when `!filesUnlocked`.
