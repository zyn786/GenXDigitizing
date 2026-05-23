# StitchPro — Embroidery Digitizing Platform

Full-stack SaaS for professional embroidery digitizing. **Next.js 14 · Supabase · Payoneer · Resend · TypeScript · Tailwind CSS**

## Portals

| Portal | Route | Role |
|---|---|---|
| Admin | `/admin` | `admin` |
| CRM | `/crm` | `crm` |
| Client | `/client` | `client` |
| Designer | `/designer` | `designer` |

Public site: `/home` · `/pricing` · `/services` · `/contact`

---

## Local Setup

```bash
npm install
cp .env.example .env.local   # fill in credentials
npm run dev
```

---

## Database Setup

Run SQL files in order in Supabase SQL Editor:

1. `supabase/setup/step1_enums.sql`
2. `supabase/setup/step2_core_tables.sql`
3. `supabase/setup/step3_remaining_tables.sql`
4. `supabase/setup/step4_triggers.sql`
5. `supabase/setup/step5_rls_and_fix.sql`  ← fixes your admin account

### Storage Buckets (create in Supabase Dashboard → Storage)

| Bucket | Type | Max |
|---|---|---|
| `artwork` | Private | 50MB |
| `outputs` | Private | 20MB |
| `invoices` | Private | 5MB |
| `avatars` | Public | 2MB |

---

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Payoneer
PAYONEER_ENVIRONMENT=sandbox   # → production for live
PAYONEER_CLIENT_ID=
PAYONEER_SECRET_KEY=
PAYONEER_PROGRAM_ID=
PAYONEER_WEBHOOK_SECRET=
# Register webhook: https://yourdomain.com/api/webhooks/payoneer

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@yourdomain.com
RESEND_FROM_NAME=StitchPro
RESEND_REPLY_TO=support@yourdomain.com

# Company (PDF invoices + emails)
COMPANY_NAME=StitchPro
COMPANY_EMAIL=hello@stitchpro.io
COMPANY_WEBSITE=stitchpro.io
```

---

## Deploy to Vercel

```bash
npm i -g vercel && vercel
```

**After deploying:**
1. Set `NEXT_PUBLIC_APP_URL` to your production domain
2. Supabase → Authentication → URL Configuration → add your domain
3. Supabase → Authentication → Redirect URLs → add `https://yourdomain.com/auth/callback`
4. Register Payoneer webhook URL in their dashboard

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/contact` | POST | Contact form → CRM lead |
| `/api/invoices/[id]/checkout` | POST | Create Payoneer checkout session |
| `/api/invoices/[id]/pdf` | GET | Generate + download PDF invoice |
| `/api/orders/[id]/status` | PATCH | Update status → triggers emails |
| `/api/notifications` | GET/PATCH | Fetch / mark-read notifications |
| `/api/webhooks/payoneer` | POST | Payment events → mark invoice paid |

---

## Role Assignment (SQL)

```sql
-- Promote to admin
UPDATE public.users SET role = 'admin' WHERE email = 'you@example.com';

-- Add designer
UPDATE public.users SET role = 'designer' WHERE email = 'designer@example.com';
INSERT INTO public.designers (user_id)
  SELECT id FROM public.users WHERE email = 'designer@example.com'
  ON CONFLICT (user_id) DO NOTHING;
```

---

## Pricing

Live-editable via **Admin → Pricing** (no code changes needed).

| Service | Size | Price |
|---|---|---|
| Digitizing | Small <5k st | $7 |
| Digitizing | Medium <15k st | $18 |
| Digitizing | Large 15k+ st | $25 |
| Vector | Simple | $8 |
| Vector | Medium | $15 |
| Vector | Complex | $30 |
| Sewout | Small | $5 |
| Sewout | Medium | $10 |
| Sewout | Large | $15 |

**Always free:** Revisions · Format conversion · Rush (6h) · Urgent (3h)

---

## Debug

Visit `/debug` to inspect session, role, and client/designer record status.
