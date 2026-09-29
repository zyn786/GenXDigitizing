// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar } from "@/components/portals/Topbar";
import { AdminSettingsUI } from "./SettingsUI";
import { composeFrom, composeReplyTo, bareAddress, displayName } from "@/lib/email/address";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getAdminUser();

  // Sender identity lives in the deployment environment, not the database, and
  // these are not NEXT_PUBLIC vars so the client cannot read them. Pass them
  // through so the UI can show what is actually configured rather than the
  // hardcoded defaults it used to display.
  const sender = {
    from: composeFrom(),
    replyTo: composeReplyTo(),
    fromEnv: bareAddress(process.env.RESEND_FROM_EMAIL) || "(not set)",
    nameEnv:
      displayName(process.env.RESEND_FROM_EMAIL) || process.env.RESEND_FROM_NAME || "(not set)",
    replyEnv: process.env.RESEND_REPLY_TO || "(not set — defaulting to support@)",
  };

  // Payoneer credentials are read from the environment by lib/payoneer/client.ts
  // — the tab's fields never fed anything.
  const payoneer = {
    env: process.env.PAYONEER_ENVIRONMENT ?? "sandbox",
    clientConfigured: Boolean(process.env.PAYONEER_CLIENT_ID),
    secretConfigured: Boolean(process.env.PAYONEER_WEBHOOK_SECRET),
    programConfigured: Boolean(process.env.PAYONEER_PROGRAM_ID),
  };

  return (
    <>
      <Topbar title="Settings" subtitle="Platform configuration" user={user} />
      <AdminSettingsUI user={user} sender={sender} payoneerEnv={payoneer} />
    </>
  );
}
