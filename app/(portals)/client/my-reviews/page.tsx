// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/portals/Topbar";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";

export default async function MyReviewsPage() {
  const user = await getAdminUser();
  if (!user.client_id) { redirect("/client"); }

  const supabase = createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, stars, text, is_published, created_at, orders(order_number, service_tiers(label))")
    .eq("client_id", user.client_id)
    .order("created_at", { ascending: false });

  const list = reviews ?? [];
  const avgRating = list.length > 0 ? (list.reduce((s, r) => s + r.stars, 0) / list.length).toFixed(1) : "0";

  return (
    <>
      <Topbar title="My Reviews" subtitle={`${list.length} reviews submitted`} user={user} />
      <div className="portal-content" style={{ background: "var(--bg)" }}>
        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <h2 className="font-jakarta font-bold text-xl sm:text-2xl"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #DB2777)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            My Reviews
          </h2>
          <p className="text-[12px] sm:text-xs mt-1" style={{ color: "var(--txt3)" }}>
            {list.length} reviews · {avgRating} ⭐ avg rating
          </p>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(245,158,11,0.1)" }}>
              <Star size={22} style={{ color: "#F59E0B" }} />
            </div>
            <p className="font-jakarta font-bold text-base mb-1" style={{ color: "var(--txt)" }}>No reviews yet</p>
            <p className="text-sm" style={{ color: "var(--txt3)" }}>Reviews appear after delivered orders — find them in My Orders</p>
          </div>
        ) : list.map(r => (
          <div key={r.id} className="rounded-2xl p-4 sm:p-5 mb-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
              <div>
                <div className="font-mono text-xs font-bold mb-1" style={{ color: "#6D28D9" }}>{r.orders?.order_number}</div>
                <div className="text-[13px] sm:text-sm font-semibold" style={{ color: "var(--txt)" }}>{r.orders?.service_tiers?.label ?? "—"}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--txt3)" }}>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-0.5 text-lg">
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ color: i <= r.stars ? "#F59E0B" : "#D1D5DB" }}>★</span>
                  ))}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{
                    background: r.is_published ? "rgba(16,185,129,0.08)" : "rgba(148,163,184,0.08)",
                    color: r.is_published ? "#047857" : "var(--txt3)",
                    borderColor: r.is_published ? "rgba(16,185,129,0.25)" : "rgba(148,163,184,0.25)",
                  }}>
                  {r.is_published ? "✓ Published" : "Hidden"}
                </span>
              </div>
            </div>
            {r.text && (
              <p className="text-[13px] leading-relaxed rounded-xl p-3 italic" style={{ background: "var(--elevated)", color: "var(--txt2)", borderLeft: "3px solid #7C3AED" }}>
                &ldquo;{r.text}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
