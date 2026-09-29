"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div
          className="absolute left-[20%] top-[10%] h-[500px] w-[500px] rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle,rgba(37,99,235,0.08),transparent 70%)" }}
        />
        <div
          className="absolute bottom-[10%] right-[15%] h-[400px] w-[400px] rounded-full blur-[80px]"
          style={{ background: "radial-gradient(circle,rgba(249,115,22,0.05),transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="no-underline">
            <Image
              src="/images/black_logo.png"
              alt="GENX DIGITIZING"
              width={150}
              height={40}
              className="mx-auto w-auto"
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-8">
          {done ? (
            <div className="text-center">
              <div className="mb-4 text-[52px]">✅</div>
              <h2 className="mb-2.5 bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text font-syne text-[22px] font-bold text-transparent">
                Password Updated!
              </h2>
              <p className="mb-5 text-sm text-[var(--txt2)]">
                Your password has been changed. Redirecting you to login…
              </p>
              <Link href="/login">
                <Button variant="grad">Go to Login →</Button>
              </Link>
            </div>
          ) : !ready ? (
            <div className="text-center">
              <div className="mb-4 text-[40px]">🔐</div>
              <h2 className="mb-2.5 font-syne text-xl font-bold text-[var(--txt)]">
                Verifying Reset Link…
              </h2>
              <p className="text-sm leading-relaxed text-[var(--txt2)]">
                If this takes more than a few seconds, your link may have expired.{" "}
                <Link
                  href="/forgot-password"
                  className="text-[#2563EB] no-underline hover:underline"
                >
                  Request a new one
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="mb-7 text-center">
                <div className="mb-3.5 text-[40px]">🔑</div>
                <h1 className="mb-2 font-syne text-2xl font-bold text-[var(--txt)]">
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
                            className="h-1 flex-1 rounded-sm transition-colors"
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
                  className="mt-2 w-full"
                  disabled={loading || !password || !confirm || password !== confirm}
                >
                  {loading ? "Updating password…" : "Update Password →"}
                </Button>
              </form>

              <p className="mt-5 text-center text-[13px] text-[var(--txt3)]">
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
