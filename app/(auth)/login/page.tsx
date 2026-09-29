"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
// requestNotificationPermission replaced by inline sync call — see handleLogin()
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const PORTAL_HOME: Record<string, string> = {
  admin: "/admin",
  crm: "/crm",
  client: "/client",
  designer: "/designer",
};

function Logo() {
  return (
    <div className="mb-7 flex flex-col items-center gap-3">
      <Image
        src="/images/black_logo.png"
        alt="GENX DIGITIZING"
        width={150}
        height={40}
        className="w-auto"
      />
      <div className="text-[11px] text-[var(--txt3)]">Sign in to your portal</div>
    </div>
  );
}

function RegisterLink() {
  return (
    <p className="mt-4 text-center text-xs text-[var(--txt3)]">
      New client?{" "}
      <Link href="/register" className="text-[#2563EB] hover:underline">
        Create a free account
      </Link>
    </p>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectTo = searchParams.get("redirect") ?? "";
  const errorParam = searchParams.get("error") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErr, setFieldErr] = useState({ email: "", password: "" });
  const [transitioning, setTransitioning] = useState(false);

  function validate() {
    const e = { email: "", password: "" };
    if (!email.trim()) {
      e.email = "Email is required";
    } else if (!/\S+@\S+/.test(email)) {
      e.email = "Enter a valid email";
    }
    if (!magicMode && !password.trim()) {
      e.password = "Password is required";
    }
    setFieldErr(e);
    return !e.email && !e.password;
  }

  async function handleLogin(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) {
      return;
    }

    // Request notification permission NOW — before any await.
    // Browsers only show the permission dialog during a user gesture.
    // Calling it after await breaks the gesture chain → dialog never appears.
    let notifGranted = false;
    if ("Notification" in window && Notification.permission === "default") {
      try {
        notifGranted = (await Notification.requestPermission()) === "granted";
      } catch {
        /* browser doesn't support */
      }
    } else if ("Notification" in window && Notification.permission === "granted") {
      notifGranted = true;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("invalid login") || m.includes("invalid credentials")) {
          toast.error("Incorrect email or password.");
        } else if (m.includes("email not confirmed")) {
          toast.error("Please confirm your email first — check your inbox.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (!data.user) {
        toast.error("Login failed. Try again.");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, is_active, full_name")
        .eq("id", data.user.id)
        .single();

      if (profile && !(profile as any).is_active) {
        await supabase.auth.signOut();
        toast.error("Account deactivated. Contact support.");
        return;
      }
      const role = (profile as any)?.role ?? "client";
      const dest = redirectTo || PORTAL_HOME[role] || "/client";
      toast.success("Signed in!");
      // Subscribe to push if notification permission was granted above
      if (notifGranted) {
        const { subscribeToPush } = await import("@/lib/push-notifications");
        subscribeToPush(data.user.id).catch(() => {});
      }
      setTransitioning(true);
      // Brief pause so user sees the loading screen before navigation starts
      setTimeout(() => {
        router.push(dest);
        router.refresh();
      }, 600);
    } catch {
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(ev: React.FormEvent) {
    ev.preventDefault();
    if (!email.trim()) {
      setFieldErr((p) => ({ ...p, email: "Email is required" }));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ""}`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  }

  const errorMessages: Record<string, string> = {
    auth_failed: "Authentication failed. Please try again.",
    account_disabled: "Your account has been deactivated. Contact support.",
    profile_missing: "Account setup incomplete. Please contact support.",
  };

  if (magicSent) {
    return (
      <div>
        <Logo />
        <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6">
          <div className="py-2 text-center">
            <div className="mb-3 text-[40px]">📬</div>
            <h2 className="mb-2 font-syne text-[17px] font-bold text-[var(--txt)]">
              Check your email
            </h2>
            <p className="mb-4 text-[13px] leading-relaxed text-[var(--txt2)]">
              We sent a magic link to <strong className="text-[var(--txt)]">{email}</strong>. Click
              it to sign in instantly.
            </p>
            <button
              onClick={() => setMagicSent(false)}
              className="cursor-pointer border-none bg-transparent text-[13px] text-[#2563EB] hover:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
        <RegisterLink />
      </div>
    );
  }

  if (transitioning) {
    return (
      <div>
        <Logo />
        <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6">
          <div className="flex flex-col items-center gap-4 py-6">
            <Image
              src="/images/black_logo.png"
              alt="GENX DIGITIZING"
              width={120}
              height={32}
              className="w-auto animate-pulse"
            />
            <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#2563EB] border-t-transparent" />
            <div className="text-center">
              <p className="mb-1 font-syne text-[16px] font-bold text-[var(--txt)]">
                Loading your portal
              </p>
              <p className="text-[12px] text-[var(--txt3)]">Preparing your dashboard…</p>
            </div>
          </div>
        </div>
        <RegisterLink />
      </div>
    );
  }

  return (
    <div>
      <Logo />

      {errorParam && errorMessages[errorParam] && (
        <div className="mb-3.5 rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 p-2.5 px-3.5 text-[13px] text-[#FB7185]">
          {errorMessages[errorParam]}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6">
        <h2 className="mb-5 font-syne text-[17px] font-bold text-[var(--txt)]">
          {magicMode ? "Magic link sign in" : "Sign in"}
        </h2>

        <form
          onSubmit={magicMode ? handleMagicLink : handleLogin}
          noValidate
          className="flex flex-col gap-3.5"
        >
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErr((p) => ({ ...p, email: "" }));
            }}
            placeholder="you@company.com"
            autoComplete="email"
            error={fieldErr.email}
          />

          {!magicMode && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--txt3)]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-[#2563EB] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErr((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full rounded-[9px] border bg-[var(--elevated)] px-3.5 py-2.5 pr-10 text-sm text-[var(--txt)] outline-none transition-colors placeholder:text-[var(--txt3)] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                  style={{
                    borderColor: fieldErr.password ? "rgba(244,63,94,0.5)" : "var(--border2)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer border-none bg-transparent text-[13px] text-[var(--txt3)]"
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {fieldErr.password && (
                <p className="mt-1 text-[11px] text-[#FB7185]">{fieldErr.password}</p>
              )}
            </div>
          )}

          <Button type="submit" variant="grad" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : magicMode ? "✨ Send magic link" : "Sign in →"}
          </Button>

          <div className="my-0.5 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-[var(--border2)]" />
            <span className="text-[11px] text-[var(--txt3)]">or</span>
            <div className="h-px flex-1 bg-[var(--border2)]" />
          </div>

          <button
            type="button"
            onClick={() => {
              setMagicMode((v) => !v);
              setFieldErr({ email: "", password: "" });
            }}
            className="w-full cursor-pointer rounded-[9px] border border-[var(--border2)] bg-[var(--border)] py-2.5 text-[13px] text-[var(--txt2)] transition-colors hover:bg-[var(--border2)]"
          >
            {magicMode ? "Sign in with password instead" : "Use magic link (no password)"}
          </button>
        </form>
      </div>

      <RegisterLink />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Logo />
          <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6">
            <div className="py-7 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
