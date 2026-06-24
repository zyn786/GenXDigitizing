"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [ready,    setReady]    = useState(false);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Failed to reset password");
      return;
    }

    setDone(true);
    toast.success("Password updated! Redirecting…");
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg)]">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle,rgba(37,99,235,0.08),transparent 70%)" }} />
        <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle,rgba(249,115,22,0.05),transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="no-underline">
            <img src="/images/black_logo.png" alt="GENX DIGITIZING" className="h-10 w-auto mx-auto" />
          </Link>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-8 ">

          {done ? (
            <div className="text-center">
              <div className="text-[52px] mb-4">✅</div>
              <h2 className="font-syne font-bold text-[22px] mb-2.5
                bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
                Password Updated!
              </h2>
              <p className="text-sm text-[var(--txt2)] mb-5">
                Your password has been changed. Redirecting you to login…
              </p>
              <Link href="/login">
                <Button variant="grad">Go to Login →</Button>
              </Link>
            </div>
          ) : !ready ? (
            <div className="text-center">
              <div className="text-[40px] mb-4">🔐</div>
              <h2 className="font-syne font-bold text-xl text-[var(--txt)] mb-2.5">
                Verifying Reset Link…
              </h2>
              <p className="text-sm text-[var(--txt2)] leading-relaxed">
                If this takes more than a few seconds, your link may have expired.{" "}
                <Link href="/forgot-password" className="text-[#2563EB] no-underline hover:underline">
                  Request a new one
                </Link>.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <div className="text-[40px] mb-3.5">🔑</div>
                <h1 className="font-syne font-bold text-2xl text-[var(--txt)] mb-2">
                  Set New Password
                </h1>
                <p className="text-sm text-[var(--txt2)]">
                  Choose a strong password of at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleReset} className="flex flex-col gap-3.5">
                <div>
                  <Input
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    autoFocus
                  />
                  {password.length > 0 && (
                    <div className="mt-1.5 flex gap-1">
                      {[1, 2, 3, 4].map((i) => {
                        const score = Math.min(4, Math.floor(password.length / 3));
                        const colors = ["#FB7185", "#FCD34D", "#F97316", "#16A34A"];
                        return (
                          <div
                            key={i}
                            className="flex-1 h-1 rounded-sm transition-colors"
                            style={{
                              background: i <= score ? colors[score - 1] : "var(--border2)",
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  error={confirm && confirm !== password ? "Passwords don't match" : undefined}
                />

                <Button
                  type="submit"
                  variant="grad"
                  className="w-full mt-2"
                  disabled={loading || !password || !confirm || password !== confirm}
                >
                  {loading ? "Updating password…" : "Update Password →"}
                </Button>
              </form>

              <p className="text-center text-[13px] text-[var(--txt3)] mt-5">
                <Link href="/login" className="text-[#2563EB] no-underline hover:underline">
                  ← Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
