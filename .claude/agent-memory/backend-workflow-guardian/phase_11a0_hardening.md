---
name: Phase 11A.0 Proof/File Security Hardening
description: Authorization rules and decisions baked into asset/file/proof routes during the May 2026 hardening pass.
type: project
---

Phase 11A.0 closed seven backend security gaps around files, proofs, and payment approval.

**Why:** Pre-hardening, `/api/assets/[...key]` was fully public, designer admin file routes had no per-order assignment check, payment + admin proof actions were callable by CHAT_SUPPORT/MARKETING (via `isAppAdminRole`), and the client file list/download leaked PROOF_PREVIEW rows when files were unlocked.

**How to apply:** When adding new file/proof endpoints, follow the patterns established here:

- `/api/assets/[...key]/route.ts` does its own auth via `authorizeAssetAccess(objectKey, userId, role)`. Decision tree: OrderFile → ClientReferenceFile → PaymentProofSubmission. ChatAttachment is intentionally not yet covered (returns 404 fallthrough). Unauthenticated requests get 403 not 404 — do not leak existence.
- `PaymentProofSubmission.proofImageKey` is NOT `@unique` in the Prisma schema. Use `findFirst`, not `findUnique`, when looking it up.
- `getOrderFileById` in `lib/payments/repository.ts` does NOT select `fileType`. If you need fileType, do a separate `prisma.orderFile.findUnique({ select: { fileType: true } })` rather than altering the helper signature.
- Payment approval (`/api/admin/orders/[orderId]/approve-payment`) and admin proof approve/reject are SUPER_ADMIN | MANAGER only — do NOT re-introduce `isAppAdminRole` here, it includes DESIGNER/CHAT_SUPPORT/MARKETING.
- Designer assignment guard pattern: after the existing role check, if `session.user.role === "DESIGNER"`, look up `assignedToUserId` and 403 if it doesn't match `session.user.id`. Applied to `/api/admin/order-files-upload`, `/api/admin/orders/[orderId]/files` (GET+POST), `/api/admin/order-files/[fileId]/download`.
- Client proof actions guard on BOTH `status === "PROOF_READY"` AND `proofStatus in ("SENT_TO_CLIENT", "CLIENT_REVIEWING")`.
- Client file list and download are FINAL_FILE-only — never expose PROOF_PREVIEW rows on the client side, those go through proof preview UI separately.
