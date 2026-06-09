"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye, EyeOff, Mail, Lock, User, Building2,
  Globe, ArrowRight, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "UAE", "Pakistan", "India",
  "South Africa", "New Zealand", "Ireland", "Other",
];

function getPasswordStrength(pw: string): {
  score: number; label: string; color: string;
} {
  let score = 0;
  if (pw.length >= 8)        { score++; }
  if (pw.length >= 12)       { score++; }
  if (/[A-Z]/.test(pw))      { score++; }
  if (/[0-9]/.test(pw))      { score++; }
  if (/[^A-Za-z0-9]/.test(pw)) { score++; }

  const levels = [
    { score: 0, label: "",           color: "" },
    { score: 1, label: "Very weak",  color: "#F43F5E" },
    { score: 2, label: "Weak",       color: "#F97316" },
    { score: 3, label: "Fair",       color: "#FCD34D" },
    { score: 4, label: "Strong",     color: "#16A34A" },
    { score: 5, label: "Very strong",color: "#2563EB" },
  ];
  return levels[Math.min(score, 5)];
}

const PRICING_SUMMARY = [
  { emoji: "🧵", label: "Digitizing", from: 7 },
  { emoji: "✏️", label: "Vector Redraw", from: 8 },
  { emoji: "🏷️", label: "Patch Design", from: 5 },
];

export default function RegisterPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [password,    setPassword]    = useState("");

  const strength = getPasswordStrength(password);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

      const { error: signUpError } = await supabase.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data: {
            full_name:    data.full_name,
            company_name: data.company_name,
            country:      data.country,
            role:         "client",
          },
          emailRedirectTo: `${appUrl}/auth/callback?redirect=/client`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error("This email is already registered. Try signing in instead.");
        } else {
          toast.error(signUpError.message);
        }
        return;
      }

      // Auto-confirm email so user can log in immediately
      try {
        await fetch("/api/auth/auto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
      } catch {
        // Confirmation may fail silently — user still created
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center
          bg-gradient-to-br from-[#16A34A]/15 to-[#2563EB]/15">
          <CheckCircle2 size={28} className="text-[#16A34A]" />
        </div>
        <h2 className="font-syne font-bold text-xl text-[var(--txt)] mb-3">
          Account created! 🎉
        </h2>
        <p className="text-sm text-[var(--txt2)] leading-relaxed mb-6">
          Your account is ready. Sign in now to access your portal.
        </p>
        <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-xl p-4 mb-5 text-left">
          <p className="text-xs font-medium text-[#16A34A] mb-2">
            What's included on every order:
          </p>
          {[
            "🔄 File format conversion — FREE",
            "♾️ Unlimited revisions — FREE",
            "⚡ Rush (6h) & Urgent (3h) turnaround — FREE",
            "🧵 Starting from just $7",
          ].map((item) => (
            <p key={item} className="text-xs text-[var(--txt2)] py-1 border-b border-[var(--border)] last:border-0">
              {item}
            </p>
          ))}
        </div>
        <Button
          variant="grad"
          size="lg"
          className="w-full"
          onClick={() => router.push("/login")}
          rightIcon={<ArrowRight size={15} />}
        >
          Sign In Now
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <img src="/images/black_logo.png" alt="GENX DIGITIZING" className="h-10 w-auto" />
        <div className="text-[11px] text-[var(--txt3)]">Create your client account</div>
      </div>

      {/* Pricing teaser */}
      <div className="flex gap-2 mb-5 justify-center flex-wrap">
        {PRICING_SUMMARY.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px]
              bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt2)]"
          >
            <span>{p.emoji}</span>
            <span className="text-[var(--txt)] font-medium">{p.label}</span>
            <span>from ${p.from}</span>
          </div>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border2)] rounded-2xl p-6">
        <h2 className="font-syne font-bold text-[17px] text-[var(--txt)] mb-5">
          Create your account
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Jane Smith"
            autoComplete="name"
            leftIcon={<User size={14} />}
            error={errors.full_name?.message}
            {...register("full_name")}
          />

          <Input
            label="Company name"
            type="text"
            placeholder="Apex Sports Co."
            autoComplete="organization"
            leftIcon={<Building2 size={14} />}
            error={errors.company_name?.message}
            {...register("company_name")}
          />

          <Input
            label="Email address"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            leftIcon={<Mail size={14} />}
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Country */}
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-[0.04em] mb-1.5 text-[var(--txt3)]">
              Country
            </label>
            <div className="relative">
              <Globe
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--txt3)] pointer-events-none"
              />
              <select
                className="w-full rounded-[9px] pl-9 pr-3.5 py-2.5 text-sm outline-none
                  bg-[var(--elevated)] border border-[var(--border2)] text-[var(--txt)]
                  focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20 cursor-pointer"
                {...register("country")}
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {errors.country && (
              <p className="mt-1 text-[11px] text-[#FB7185]">
                {errors.country.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              leftIcon={<Lock size={14} />}
              rightIcon={showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              onRightIconClick={() => setShowPw((v) => !v)}
              error={errors.password?.message}
              {...register("password", {
                onChange: (e) => setPassword(e.target.value),
              })}
            />
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        background:
                          i <= strength.score ? strength.color : "var(--border2)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: strength.color }}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <Input
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter password"
            autoComplete="new-password"
            leftIcon={<Lock size={14} />}
            rightIcon={showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            onRightIconClick={() => setShowConfirm((v) => !v)}
            error={errors.confirm_password?.message}
            {...register("confirm_password")}
          />

          {/* Terms */}
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="agreed_terms"
              className="mt-1 w-4 h-4 rounded border-[var(--border2)] bg-[var(--elevated)]
                accent-[#2563EB] cursor-pointer"
              {...register("agreed_terms")}
            />
            <label htmlFor="agreed_terms" className="text-xs text-[var(--txt2)] cursor-pointer leading-snug">
              I agree to the{" "}
              <Link href="/terms" className="text-[#2563EB] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#2563EB] hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreed_terms && (
            <p className="text-[11px] text-[#FB7185]">
              {errors.agreed_terms.message}
            </p>
          )}

          <Button
            type="submit"
            variant="grad"
            size="lg"
            className="w-full mt-2"
            loading={loading}
            rightIcon={<ArrowRight size={15} />}
          >
            Create account
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-[var(--txt3)] mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-[#2563EB] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
