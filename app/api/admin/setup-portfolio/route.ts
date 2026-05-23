// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/supabase/get-user";

// One-time setup: creates tables if they don't exist
export async function POST() {
  const user = await getAdminUser().catch(() => null);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Missing Supabase env vars" }, { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: string[] = [];

  // Create categories table
  const { error: e1 } = await supabase.rpc("create_portfolio_tables_v1");
  if (e1) {
    // RPC doesn't exist yet — create tables via direct insert attempt
    // then create them if they fail with "relation does not exist"
    try {
      // Try inserting to test if tables exist
      const { error: testErr } = await supabase.from("categories").select("id").limit(1);

      if (testErr && testErr.message.includes("does not exist")) {
        // Tables don't exist — we need SQL. Return the migration SQL for manual run.
        return NextResponse.json({
          needsSetup: true,
          message: "Tables don't exist. Run the migration SQL in Supabase SQL Editor.",
          migrationFile: "supabase/migrations/007_portfolio.sql",
        }, { status: 200 });
      }

      if (testErr) {
        return NextResponse.json({ error: testErr.message }, { status: 500 });
      }

      // Tables exist — check if categories have data
      const { data: cats } = await supabase.from("categories").select("id").limit(1);
      if (!cats || cats.length === 0) {
        // Tables exist but no seed data — insert defaults
        const { error: seedErr } = await supabase.from("categories").insert([
          { name: "Embroidery Digitizing", slug: "digitizing", emoji: "🧵", color: "#2FA4D7", sort_order: 1 },
          { name: "Vector Art", slug: "vector", emoji: "✏️", color: "#E76F2E", sort_order: 2 },
          { name: "Patch Design", slug: "patches", emoji: "🏷️", color: "#10B981", sort_order: 3 },
        ]);
        if (seedErr) {
          return NextResponse.json({ error: "Failed to seed categories: " + seedErr.message }, { status: 500 });
        }
        results.push("Seeded 3 categories");
      }

      return NextResponse.json({
        needsSetup: false,
        message: "Tables exist and are ready.",
        details: results,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, details: results });
}
