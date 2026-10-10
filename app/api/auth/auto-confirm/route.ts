// @ts-nocheck
import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// POST /api/auth/auto-confirm — confirm the CALLER'S OWN email address.
//
// This route used to accept an arbitrary `userId` or `email` from the request
// body and confirm it with the service-role key, behind a middleware check that
// only required *some* authenticated role. Any self-registered account could
// therefore confirm the email of any other account, and the paginated
// email-search branch doubled as a user-enumeration oracle. The only real
// caller is app/(auth)/register/page.tsx, which runs this immediately after
// signUp — so the session is always the account being confirmed.
export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user: caller },
    } = await supabase.auth.getUser();

    if (!caller) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (caller.email_confirmed_at) {
      return NextResponse.json({ success: true, userId: caller.id, alreadyConfirmed: true });
    }

    const admin = createAdminClient();
    const { error: confirmError } = await admin.auth.admin.updateUserById(caller.id, {
      email_confirm: true,
    });

    if (confirmError) {
      return NextResponse.json({ error: confirmError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: caller.id });
  } catch (error: any) {
    console.error("[auto-confirm]", error);
    return NextResponse.json({ error: error.message || "Auto-confirm failed" }, { status: 500 });
  }
}
