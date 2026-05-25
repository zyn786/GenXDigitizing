"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const PORTAL_HOME: Record<string, string> = {
  admin: "/admin", crm: "/crm", client: "/client", designer: "/designer",
};

function Logo() {
  return (
    <div className="flex items-center gap-3 mb-7 justify-center">
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center
        bg-gradient-to-br from-[#2563EB] to-[#F97316] text-white font-jakarta font-bold text-xl">
        ✦
      </div>
      <div>
        <div className="font-jakarta font-extrabold text-lg
          bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#F97316] bg-clip-text text-transparent">
          GENX DIGITIZING
        </div>
        <div className="text-[11px] text-[var(--txt3)]">Sign in to your portal</div>
      </div>
    </div>
  );
}

function RegisterLink() {
  return (
    <p className="text-center text-xs text-[var(--txt3)] mt-4">
      New client?{" "}
      <Link href="/register" className="text-[#2563EB] hover:underline">Create a free account</Link>
    </p>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  const redirectTo = searchParams.get("redirect") ?? "";
  const errorParam = searchParams.get("error")    ?? "";

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [fieldErr,  setFieldErr]  = useState({ email: "", password: "" });

  function validate() {
    const e = { email: "", password: "" };
    if (!email.trim())                 { e.email    = "Email is required"; }
    else if (!/\S+@\S+/.test(email))   { e.email    = "Enter a valid email"; }
    if (!magicMode && !password.trim()){ e.password = "Password is required"; }
    setFieldErr(e);
    return !e.email && !e.password;
  }

  async function handleLogin(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) { return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
      if (!data.user) { toast.error("Login failed. Try again."); return; }

      const { data: profile } = await supabase
        .from("users").select("role, is_active, full_name").eq("id", data.user.id).single();

      if (profile && !(profile as any).is_active) {
        await supabase.auth.signOut();
        toast.error("Account deactivated. Contact support.");
        return;
      }
      const role = (profile as any)?.role ?? "client";
      const dest = redirectTo || PORTAL_HOME[role] || "/client";
      toast.success("Signed in!");
      router.push(dest);
      router.refresh();
    } catch {
      toast.error("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(ev: React.FormEvent) {
    ev.preventDefault();
    if (!email.trim()) { setFieldErr(p => ({ ...p, email: "Email is required" })); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?redirect=${redirectTo}` : ""}` },
      });
      if (error) { toast.error(error.message); return; }
      setMagicSent(true);
    } finally {
      setLoading(false);
    }
  }

  const errorMessages: Record<string, string> = {
    auth_failed:      "Authentication failed. Please try again.",
    account_disabled: "Your account has been deactivated. Contact support.",
    profile_missing:  "Account setup incomplete. Please contact support.",
  };

  if (magicSent) {
    return (
      <div>
        <Logo />
        <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-6">
          <div className="text-center py-2">
            <div className="text-[40px] mb-3">📬</div>
            <h2 className="font-jakarta font-bold text-[17px] text-[var(--txt)] mb-2">Check your email</h2>
            <p className="text-[13px] text-[var(--txt2)] leading-relaxed mb-4">
              We sent a magic link to <strong className="text-[var(--txt)]">{email}</strong>.
              Click it to sign in instantly.
            </p>
            <button
              onClick={() => setMagicSent(false)}
              className="text-[13px] text-[#2563EB] bg-transparent border-none cursor-pointer hover:underline"
            >
              Use a different email
            </button>
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
        <div className="mb-3.5 p-2.5 px-3.5 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[13px] text-[#FB7185]">
          {errorMessages[errorParam]}
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-6">
        <h2 className="font-jakarta font-bold text-[17px] text-[var(--txt)] mb-5">
          {magicMode ? "Magic link sign in" : "Sign in"}
        </h2>

        <form onSubmit={magicMode ? handleMagicLink : handleLogin} noValidate className="flex flex-col gap-3.5">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: "" })); }}
            placeholder="you@company.com"
            autoComplete="email"
            error={fieldErr.email}
          />

          {!magicMode && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--txt3)]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] text-[#2563EB] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: "" })); }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="w-full rounded-[9px] px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors
                    bg-[var(--elevated)] border text-[var(--txt)] placeholder:text-[var(--txt3)]
                    focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                  style={{ borderColor: fieldErr.password ? "rgba(244,63,94,0.5)" : "var(--border2)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none
                    cursor-pointer text-[var(--txt3)] text-[13px]"
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

          <div className="flex items-center gap-2.5 my-0.5">
            <div className="flex-1 h-px bg-[var(--border2)]" />
            <span className="text-[11px] text-[var(--txt3)]">or</span>
            <div className="flex-1 h-px bg-[var(--border2)]" />
          </div>

          <button
            type="button"
            onClick={() => { setMagicMode(v => !v); setFieldErr({ email: "", password: "" }); }}
            className="w-full py-2.5 rounded-[9px] text-[13px] text-[var(--txt2)] cursor-pointer
              bg-[var(--border)] border border-[var(--border2)] hover:bg-[var(--border2)] transition-colors"
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
    <Suspense fallback={
      <div>
        <Logo />
        <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-6">
          <div className="text-center py-7">
            <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent
              rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
