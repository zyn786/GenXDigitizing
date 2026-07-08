"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, Building2,
  Globe, ArrowRight, ChevronLeft, Check,
  Shield, ShieldCheck, Star, Clock, RefreshCw, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { SITE_STATS, fmtPlus } from "@/lib/site-config";
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

const STEPS = [
  { num: 1, label: "Account",  icon: Mail },
  { num: 2, label: "Profile",  icon: User },
  { num: 3, label: "Confirm",  icon: Check },
];

const PRICING_SUMMARY = [
  { emoji: "🧵", label: "Digitizing", from: 7 },
  { emoji: "✏️", label: "Vector Redraw", from: 8 },
  { emoji: "🏷️", label: "Patch Design", from: 5 },
];

export default function RegisterPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step,         setStep]         = useState(1);
  const [showPw,       setShowPw]       = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [password,     setPassword]     = useState("");

  const strength = getPasswordStrength(password);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function handleNext() {
    let valid = false;
    if (step === 1) {
      valid = await trigger(["email", "password", "confirm_password"]);
    } else if (step === 2) {
      valid = await trigger(["full_name", "company_name", "country"]);
    }
    if (valid) setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      // 1. Create account (no email redirect needed — we auto-confirm + sign in directly)
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
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast.error("This email is already registered. Try signing in instead.");
        } else {
          toast.error(signUpError.message);
        }
        setLoading(false);
        return;
      }

      // 2. Auto-confirm email — skip verification email entirely
      try {
        await fetch("/api/auth/auto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        });
      } catch {
        // Confirmation may fail silently — user still created
      }

      // 3. Auto sign-in — go directly to client portal
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        // Sign-in failed (rare — user exists and is confirmed). Fall back to login page.
        toast.error("Account created! Please sign in.");
        router.push("/login");
        return;
      }

      // 4. Send professional welcome email (fire-and-forget)
      fetch("/api/auth/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          name: data.full_name,
          company: data.company_name,
        }),
      }).catch(function () {
        // Welcome email is nice-to-have — don't block registration if it fails
      });

      // 5. Redirect to client portal
      toast.success("Welcome, " + data.full_name + "!");
      router.push("/client");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Summary data for step 3 ────────────────────────────────────
  const summaryRows = [
    { label: "Email",       value: getValues("email") },
    { label: "Full name",   value: getValues("full_name") },
    { label: "Company",     value: getValues("company_name") },
    { label: "Country",     value: getValues("country") },
  ];

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
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-7">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isDone   = step > s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center gap-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone
                        ? "bg-[#16A34A] text-white"
                        : isActive
                          ? "bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)]"
                          : "bg-[var(--elevated)] text-[var(--txt3)] border border-[var(--border2)]"
                    }`}
                  >
                    {isDone ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-semibold transition-colors ${
                      isActive ? "text-[#2563EB]" : isDone ? "text-[#16A34A]" : "text-[var(--txt3)]"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-10 sm:w-14 h-0.5 mx-1 mb-4 rounded-full transition-colors duration-300"
                    style={{ background: step > s.num ? "#16A34A" : "var(--border2)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AnimatePresence mode="wait">
            {/* ── Step 1: Account ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="font-syne font-bold text-[17px] text-[var(--txt)] mb-1">
                  Create your account
                </h2>
                <p className="text-xs text-[var(--txt3)] mb-5">
                  Join {SITE_STATS.verifiedReviews}+ businesses who trust us with their embroidery digitizing.
                </p>

                <div className="space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    leftIcon={<Mail size={14} />}
                    error={errors.email?.message}
                    {...register("email")}
                  />

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
                </div>

                {/* Trust badges — Step 1 */}
                <div className="mt-5 p-3.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={14} className="text-[#16A34A]" />
                    <span className="text-[11px] font-semibold text-[var(--txt)]">Your data is safe with us</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--txt3)]">
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#16A34A]" /> 256-bit SSL encryption</span>
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#16A34A]" /> We never share your email</span>
                    <span className="flex items-center gap-1"><Check size={10} className="text-[#16A34A]" /> No spam, ever</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Profile ────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="font-syne font-bold text-[17px] text-[var(--txt)] mb-1">
                  Tell us about yourself
                </h2>
                <p className="text-xs text-[var(--txt3)] mb-5">
                  So we can personalize your experience and make ordering effortless.
                </p>

                <div className="space-y-4">
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
                </div>

                {/* Social proof — Step 2 */}
                <div className="mt-5 p-3.5 rounded-xl bg-[var(--elevated)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-[11px] font-semibold text-[var(--txt)]">Trusted worldwide</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                      <Star size={14} className="text-[#F59E0B] fill-[#F59E0B] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">{SITE_STATS.avgRating}/5</p>
                        <p className="text-[10px] text-[var(--txt3)]">{fmtPlus(SITE_STATS.verifiedReviews)} verified reviews</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                      <Users size={14} className="text-[#2563EB] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">{fmtPlus(SITE_STATS.ordersCompleted)}+</p>
                        <p className="text-[10px] text-[var(--txt3)]">Happy clients</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                      <Clock size={14} className="text-[#7C3AED] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">{SITE_STATS.avgDeliveryHours}h</p>
                        <p className="text-[10px] text-[var(--txt3)]">Avg delivery time</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50">
                      <RefreshCw size={14} className="text-[#16A34A] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">Unlimited</p>
                        <p className="text-[10px] text-[var(--txt3)]">Free revisions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Confirm ─────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="font-syne font-bold text-[17px] text-[var(--txt)] mb-1">
                  Review your details
                </h2>
                <p className="text-xs text-[var(--txt3)] mb-5">
                  Almost done! Double-check and accept the terms to finish.
                </p>

                {/* Summary card */}
                <div className="bg-[var(--elevated)] border border-[var(--border2)] rounded-xl overflow-hidden mb-5">
                  {summaryRows.map((row, i) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i < summaryRows.length - 1 ? "border-b border-[var(--border)]" : ""
                      }`}
                    >
                      <span className="text-xs text-[var(--txt3)]">{row.label}</span>
                      <span className="text-xs font-medium text-[var(--txt)] text-right max-w-[60%] truncate">
                        {row.value || <span className="text-[var(--txt3)] italic">—</span>}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Guarantee badge — Step 3 */}
                <div className="mb-5 p-3.5 rounded-xl bg-gradient-to-r from-[#16A34A]/8 to-[#2563EB]/8 border border-[#16A34A]/15">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield size={14} className="text-[#16A34A]" />
                    <span className="text-[11px] font-semibold text-[#16A34A]">GenX Satisfaction Guarantee</span>
                  </div>
                  <p className="text-[11px] text-[var(--txt2)] leading-relaxed">
                    Not happy with your design? We'll revise it until you are — <span className="font-semibold text-[var(--txt)]">unlimited free revisions, no questions asked.</span> Your satisfaction is our reputation.
                  </p>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="agreed_terms"
                    className="mt-0.5 w-4 h-4 rounded border-[var(--border2)] bg-[var(--elevated)]
                      accent-[#2563EB] cursor-pointer flex-shrink-0"
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
                  <p className="mt-1.5 text-[11px] text-[#FB7185]">
                    {errors.agreed_terms.message}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className={`flex gap-3 ${step === 1 ? "justify-end" : "justify-between"} mt-6`}>
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleBack}
                leftIcon={<ChevronLeft size={14} />}
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                variant="grad"
                size="md"
                onClick={handleNext}
                rightIcon={<ArrowRight size={14} />}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="grad"
                size="lg"
                loading={loading}
                rightIcon={<ArrowRight size={15} />}
              >
                Create account
              </Button>
            )}
          </div>
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
