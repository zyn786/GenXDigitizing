// @ts-nocheck
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/portals/Sidebar";
import { PortalClientWrapper, PortalProviders } from "@/components/portals/PortalClientWrapper";
import {
  Skeleton,
  SkeletonPageHeader,
  SkeletonStatRow,
  SkeletonContentBlock,
} from "@/components/ui/Skeleton";

function PortalContentSkeleton() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Topbar placeholder */}
      <div className="flex-shrink-0 h-12 sm:h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 sm:px-6">
        <Skeleton className="h-[18px] w-32 sm:w-40 rounded-md" />
      </div>
      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
        <SkeletonPageHeader />
        <SkeletonStatRow count={4} />
        <SkeletonContentBlock height={200} />
      </div>
    </div>
  );
}

type Role = "admin" | "crm" | "client" | "designer";

const PORTAL_HOME: Record<Role, string> = {
  admin: "/admin", crm: "/crm", client: "/client", designer: "/designer",
};

interface PortalLayoutProps {
  children: React.ReactNode;
  requiredRole: Role;
}

export async function PortalLayout({ children, requiredRole }: PortalLayoutProps) {
  const supabase = createClient();

  // 1. Check auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect(`/login?redirect=/${requiredRole}`);

  // 2. Fetch profile
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, role, avatar_url, is_active")
    .eq("id", authUser.id)
    .single();

  if (!profile) redirect("/login?error=profile_missing");
  if (!profile.is_active) redirect("/login?error=account_disabled");

  // 3. Role check
  if (profile.role !== requiredRole && profile.role !== "admin") {
    redirect(PORTAL_HOME[profile.role as Role] ?? "/client");
  }

  // 4. Fetch extended IDs
  let clientId: string | undefined;
  let designerId: string | undefined;
  if (profile.role === "client") {
    const { data } = await supabase.from("clients").select("id").eq("user_id", authUser.id).single();
    clientId = data?.id;
  }
  if (profile.role === "designer") {
    const { data } = await supabase.from("designers").select("id").eq("user_id", authUser.id).single();
    designerId = data?.id;
  }

  // 5. Fetch badge counts for admin, subscription status for client
  let badgeCounts: Record<string, number> = {};
  let subscriptionStatus: string | null = null;
  if (profile.role === "admin") {
    const [
      { count: pendingOrders },
      { count: unreadMessages },
      { count: pendingReviews },
      { count: unreadNotifications },
      { count: unreviewedEdits },
    ] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "submitted"),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("is_read", false).neq("from_user", authUser.id),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("is_published", false),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false).eq("user_id", authUser.id),
      supabase.from("order_edit_log").select("*", { count: "exact", head: true }).eq("reviewed_by_admin", false),
    ]);
    badgeCounts = {
      orders: (pendingOrders ?? 0) + (unreviewedEdits ?? 0),
      messages: unreadMessages ?? 0,
      reviews: pendingReviews ?? 0,
      notifications: unreadNotifications ?? 0,
      leads: 0,
    };
  }
  if (profile.role === "client" && clientId) {
    const { data: sub } = await supabase.from("client_subscriptions")
      .select("status").eq("client_id", clientId)
      .in("status", ["active", "pending", "cancellation_requested"]).maybeSingle();
    subscriptionStatus = sub?.status || null;
  }

  const user = {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name ?? "",
    role: profile.role as Role,
    avatar_url: profile.avatar_url ?? undefined,
    client_id: clientId,
    designer_id: designerId,
  };

  return (
    <PortalProviders userId={user.id} role={user.role} userName={user.full_name} userEmail={user.email}>
      <div className="portal-layout">
        <div className="hidden lg:flex flex-shrink-0"><Sidebar user={user} badgeCounts={badgeCounts} subscriptionStatus={subscriptionStatus} /></div>
        <main className="portal-main">
          <Suspense fallback={<PortalContentSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </PortalProviders>
  );
}
