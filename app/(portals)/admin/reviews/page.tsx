// @ts-nocheck
import { createClient }    from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }           from "@/components/portals/Topbar";
import { AdminReviewsUI }   from "./ReviewsUI";

export const dynamic = "force-dynamic";


export default async function AdminReviewsPage() {
  const supabase = createClient();
  const user = await getAdminUser();

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id, stars, text, is_published, created_at,
      clients ( id, company_name, users ( full_name, avatar_url ) ),
      orders ( id, order_number, service_tiers ( label ) )
    `)
    .order("created_at", { ascending: false });

  const list      = reviews ?? [];
  const avg       = list.length ? list.reduce((s, r) => s + r.stars, 0) / list.length : 0;
  const fiveStar  = list.filter(r => r.stars === 5).length;
  const fourPlus  = list.filter(r => r.stars >= 4).length;

  return (
    <>
      <Topbar title="Reviews" subtitle="Client feedback on completed orders" user={user} />
      <AdminReviewsUI
        reviews={list}
        avgRating={Math.round(avg * 10) / 10}
        total={list.length}
        fiveStarPct={list.length ? Math.round((fiveStar / list.length) * 100) : 0}
        fourPlusPct={list.length ? Math.round((fourPlus / list.length) * 100) : 0}
      />
    </>
  );
}
