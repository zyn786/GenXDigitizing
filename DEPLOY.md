# StitchPro — Deployment Checklist

Work through this list top-to-bottom before going live.

---

## 1. Supabase Setup

- [ ] Create Supabase project at supabase.com
- [ ] Run SQL setup files 1–5 in SQL Editor (see README)
- [ ] Confirm `zainjafri35@gmail.com` has `role = admin` in `public.users`
- [ ] Create storage buckets: `artwork`, `outputs`, `invoices`, `avatars`
- [ ] Set RLS on all buckets (done by step5 SQL)
- [ ] Enable Realtime on tables: `messages`, `notifications`, `orders`
  - Supabase → Database → Replication → enable for those tables
- [ ] Set Auth → Email Templates (optional, Supabase defaults work)
- [ ] Authentication → URL Configuration → set Site URL to production domain
- [ ] Authentication → Redirect URLs → add `https://yourdomain.com/auth/callback`

---

## 2. Payoneer Setup

- [ ] Create Payoneer developer account at developer.payoneer.com
- [ ] Create an Application → get Client ID, Secret Key, Program ID
- [ ] Register webhook endpoint: `https://yourdomain.com/api/webhooks/payoneer`
  - Events to subscribe: `PAYMENT_COMPLETED`, `PAYMENT_REFUNDED`
- [ ] Copy Webhook Secret to `PAYONEER_WEBHOOK_SECRET`
- [ ] Test with sandbox credentials first (`PAYONEER_ENVIRONMENT=sandbox`)

---

## 3. Resend Setup

- [ ] Create Resend account at resend.com
- [ ] Add and verify your sending domain
- [ ] Create API key → copy to `RESEND_API_KEY`
- [ ] Set `RESEND_FROM_EMAIL` to a verified address

---

## 4. Vercel Deployment

- [ ] Push code to GitHub (private repo)
- [ ] Connect repo at vercel.com/new
- [ ] Add all environment variables (copy from `.env.example`)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your Vercel domain (or custom domain)
- [ ] First deploy — check build succeeds
- [ ] Add custom domain in Vercel → Domains
- [ ] Update `NEXT_PUBLIC_APP_URL` to custom domain
- [ ] Redeploy after domain change

---

## 5. Post-Deploy Verification

### Auth flow
- [ ] Register a new client account → verify confirmation email arrives
- [ ] Confirm email → lands on `/client` dashboard
- [ ] Verify client record was created in `public.clients`
- [ ] Log out → log in again → correct portal loads

### Admin
- [ ] Log in as admin → all 10 sidebar pages load
- [ ] Admin → Pricing → prices display and are editable
- [ ] Admin → Settings → company fields save

### Client order flow
- [ ] Place a test order (all 4 wizard steps)
- [ ] Confirm order appears in Admin → Orders
- [ ] Admin creates Payoneer checkout link → invoice updated
- [ ] PDF invoice downloads correctly
- [ ] Notification bell shows new order notification

### Payoneer
- [ ] Use sandbox checkout URL → complete test payment
- [ ] Webhook fires → invoice status → `paid`, order status → `submitted`
- [ ] Client receives payment confirmation email

### Designer flow
- [ ] Create a designer user account, set role in SQL
- [ ] Admin assigns order to designer
- [ ] Designer logs in → task appears in /designer/tasks
- [ ] Designer uploads DST file → status → review
- [ ] Admin delivers → client receives delivery email

### CRM
- [ ] Submit contact form → lead appears in CRM → Leads
- [ ] Admin notification fires
- [ ] CRM messages thread works (send and receive)

---

## 6. SEO

- [ ] Visit `https://yourdomain.com/sitemap.xml` — should return valid XML
- [ ] Visit `https://yourdomain.com/robots.txt` — should block portal routes
- [ ] Submit sitemap to Google Search Console
- [ ] Verify OG meta tags with opengraph.xyz

---

## 7. Security Hardening

- [ ] Rotate Supabase service role key after go-live
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is never exposed client-side
- [ ] Verify debug page `/debug` is blocked by middleware in production
  - Add `pathname.startsWith("/debug")` to middleware disallow list for production
- [ ] Review Supabase RLS policies are all enabled (step5 SQL enables them)
- [ ] Set up Supabase backups: Dashboard → Database → Backups → enable daily

---

## 8. Monitoring

- [ ] Enable Vercel Analytics (Dashboard → Analytics → Enable)
- [ ] Set up Vercel Logs alerts for 5xx errors
- [ ] Supabase → Reports → monitor query performance
- [ ] Confirm Payoneer webhook delivery logs in their dashboard

---

## 9. Business Configuration

- [ ] Update company info in Admin → Settings
- [ ] Upload logo/favicon (replace `/public/images/` files)
- [ ] Review and adjust pricing in Admin → Pricing
- [ ] Set SLA hours in Admin → Settings → SLA configuration
- [ ] Add first designer account and set their Payoneer ID for payouts

---

## Go Live ✓

When all boxes are checked, announce to your first clients and start taking orders.

**Support:** hello@stitchpro.io
