// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser }  from "@/lib/supabase/get-user";
import { getCRMReviews } from "@/lib/supabase/crm-queries";
import { Topbar }        from "@/components/portals/Topbar";
import { CRMReviewsUI }  from "./ReviewsUI";

export default async function CRMReviewsPage() {
  const [user, reviews] = await Promise.all([getAdminUser(), getCRMReviews()]);

  const avg = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.stars, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <>
      <Topbar title="Reviews" subtitle={`${reviews.length} reviews · ${avg}★ avg`} user={user} />
      <CRMReviewsUI reviews={reviews} />
    </>
  );
}
