---
name: Phase 11A.2 admin proof parity + fileType selector
description: Admin/designer proof-files endpoint with signed URLs + AdminProofPreview component + OrderFileUploader fileType selector added May 2026
type: project
---

Phase 11A.2 added admin/designer parity for proof preview viewing and an explicit fileType selector during upload.

**Why:** Admins/managers/designers needed to view proof preview images directly in the order detail page without exposing objectKey/bucket, matching the security model of the client-side proof viewer added in 11A.1. Uploaders previously had no UI to distinguish PROOF_PREVIEW vs FINAL_FILE, causing accidental misclassification.

**How to apply:** When extending file viewing to other roles, mirror the pattern: signed GET URLs (300s), MIME+extension allowlist, blocked extension list (machine files), no objectKey/bucket in response. For uploader UX, the selector forces an explicit fileType choice and propagates it to both the upload-intent and file-record API calls.

Key additions:
- `app/api/admin/orders/[orderId]/proof-files/route.ts` — auth: SUPER_ADMIN/MANAGER unrestricted, DESIGNER must own assignment, others 403. No proofStatus gate (admins/designers see proofs at any stage).
- `components/workflow/admin-proof-preview.tsx` — mirrors client-proof-preview pattern with inline Promise chain in useEffect (no useCallback) to satisfy react-hooks/set-state-in-effect lint rule.
- `components/admin/order-file-uploader.tsx` — adds Eye/Lock card selector with teal vs violet highlight, scopes accept attribute per type, sends fileType + orderId on intent and file-record calls.
- Wired into `app/(admin)/admin/orders/[orderId]/page.tsx` proof section above ProofSendPanel.
