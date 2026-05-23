// @ts-nocheck
export const dynamic = "force-dynamic";

import { getAdminUser } from "@/lib/supabase/get-user";
import { Topbar }       from "@/components/portals/Topbar";
import { createClient } from "@/lib/supabase/server";

export default async function CRMSettingsPage() {
  const user     = await getAdminUser();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Topbar title="Settings" subtitle="CRM account & preferences" user={user} />
      <div className="portal-content">
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 16 }}>My Profile</h3>
            {[["Full Name", profile?.full_name ?? ""], ["Email", profile?.email ?? ""]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 11, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 5 }}>{label}</label>
                <input defaultValue={val} style={{ width: "100%", background: "var(--elevated)", border: "1px solid var(--border2)", borderRadius: 9, padding: "9px 13px", color: "var(--txt)", fontSize: 13, outline: "none", fontFamily: "Inter,sans-serif", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: .4, marginBottom: 5 }}>Role</label>
              <div style={{ padding: "9px 13px", background: "var(--elevated)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13, color: "var(--txt2)" }}>
                CRM Agent
              </div>
            </div>
            <button style={{ padding: "9px 18px", borderRadius: 9, background: "linear-gradient(135deg,#7C3AED,#D946EF)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Save Changes
            </button>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px" }}>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Notifications</h3>
            {[
              ["New lead assigned",         true],
              ["Client message received",   true],
              ["Order status updates",      false],
              ["Review submitted",          true],
            ].map(([label, defaultOn]) => (
              <div key={label as string} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "var(--txt2)" }}>{label as string}</span>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: defaultOn ? "linear-gradient(135deg,#7C3AED,#D946EF)" : "var(--border2)", cursor: "pointer", position: "relative" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: defaultOn ? 18 : 4, transition: "left .15s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
