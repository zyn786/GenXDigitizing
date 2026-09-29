"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Globe,
  ArrowRight,
  ChevronLeft,
  Check,
  Shield,
  ShieldCheck,
  Star,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { SITE_CLAIMS } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "UAE",
  "Pakistan",
  "India",
  "South Africa",
  "New Zealand",
  "Ireland",
  "Other",
];

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) {
    score++;
  }
  if (pw.length >= 12) {
    score++;
  }
  if (/[A-Z]/.test(pw)) {
    score++;
  }
  if (/[0-9]/.test(pw)) {
    score++;
  }
  if (/[^A-Za-z0-9]/.test(pw)) {
    score++;
  }

  const levels = [
    { score: 0, label: "", color: "" },
    { score: 1, label: "Very weak", color: "#F43F5E" },
    { score: 2, label: "Weak", color: "#F97316" },
    { score: 3, label: "Fair", color: "#FCD34D" },
    { score: 4, label: "Strong", color: "#16A34A" },
    { score: 5, label: "Very strong", color: "#2563EB" },
  ];
  return levels[Math.min(score, 5)];
}

const STEPS = [
  { num: 1, label: "Account", icon: Mail },
  { num: 2, label: "Profile", icon: User },
  { num: 3, label: "Confirm", icon: Check },
];

const PRICING_SUMMARY = [
  { emoji: "🧵", label: "Digitizing", from: 7 },
  { emoji: "✏️", label: "Vector Redraw", from: 8 },
  { emoji: "🏷️", label: "Patch Design", from: 5 },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            company_name: data.company_name,
            country: data.country,
            role: "client",
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

      const newUserId = signUpData?.user?.id;

      // 2. Auto-confirm email — pass userId for direct lookup (no pagination issue)
      try {
        await fetch("/api/auth/auto-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, userId: newUserId }),
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

      // 5. Redirect to client portal (no refresh — push already fetches fresh data)
      toast.success("Welcome, " + data.full_name + "!");
      router.push("/client");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Summary data for step 3 ────────────────────────────────────
  const summaryRows = [
    { label: "Email", value: getValues("email") },
    { label: "Full name", value: getValues("full_name") },
    { label: "Company", value: getValues("company_name") },
    { label: "Country", value: getValues("country") },
  ];

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-3">
        <Image
          src="/images/black_logo.png"
          alt="GENX DIGITIZING"
          width={150}
          height={40}
          className="w-auto"
        />
        <div className="text-[11px] text-[var(--txt3)]">Create your client account</div>
      </div>

      {/* Pricing teaser */}
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {PRICING_SUMMARY.map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border2)] bg-[var(--elevated)] px-2.5 py-1 text-[11px] text-[var(--txt2)]"
          >
            <span>{p.emoji}</span>
            <span className="font-medium text-[var(--txt)]">{p.label}</span>
            <span>from ${p.from}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6">
        {/* Step indicator */}
        <div className="mb-7 flex items-center justify-center gap-0">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center gap-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      isDone
                        ? "bg-[#16A34A] text-white"
                        : isActive
                          ? "bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.35)]"
                          : "border border-[var(--border2)] bg-[var(--elevated)] text-[var(--txt3)]"
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
                  <div
                    className="mx-1 mb-4 h-0.5 w-10 rounded-full transition-colors duration-300 sm:w-14"
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
                <h2 className="mb-1 font-syne text-[17px] font-bold text-[var(--txt)]">
                  Create your account
                </h2>
                <p className="mb-5 text-xs text-[var(--txt3)]">
                  Track orders, proofs and revisions in one place — free to create.
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
                        <div className="flex flex-1 gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-colors"
                              style={{
                                background: i <= strength.score ? strength.color : "var(--border2)",
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-medium" style={{ color: strength.color }}>
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
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-3.5">
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#16A34A]" />
                    <span className="text-[11px] font-semibold text-[var(--txt)]">
                      Your data is safe with us
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[var(--txt3)]">
                    <span className="flex items-center gap-1">
                      <Check size={10} className="text-[#16A34A]" /> 256-bit SSL encryption
                    </span>
                    <span className="flex items-center gap-1">
                      <Check size={10} className="text-[#16A34A]" /> We never share your email
                    </span>
                    <span className="flex items-center gap-1">
                      <Check size={10} className="text-[#16A34A]" /> No spam, ever
                    </span>
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
                <h2 className="mb-1 font-syne text-[17px] font-bold text-[var(--txt)]">
                  Tell us about yourself
                </h2>
                <p className="mb-5 text-xs text-[var(--txt3)]">
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
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--txt3)]">
                      Country
                    </label>
                    <div className="relative">
                      <Globe
                        size={14}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--txt3)]"
                      />
                      <select
                        className="w-full cursor-pointer rounded-[9px] border border-[var(--border2)] bg-[var(--elevated)] py-2.5 pl-9 pr-3.5 text-sm text-[var(--txt)] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                        {...register("country")}
                      >
                        <option value="">Select your country…</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.country && (
                      <p className="mt-1 text-[11px] text-[#FB7185]">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                {/* Social proof — Step 2 */}
                <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--elevated)] p-3.5">
                  <div className="mb-2 flex items-center gap-2">
                    <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-[11px] font-semibold text-[var(--txt)]">
                      Trusted worldwide
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white/50 p-2">
                      <Star size={14} className="flex-shrink-0 fill-[#F59E0B] text-[#F59E0B]" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">
                          {SITE_CLAIMS.price.value}
                        </p>
                        <p className="text-[10px] text-[var(--txt3)]">Standard designs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/50 p-2">
                      <Users size={14} className="flex-shrink-0 text-[#2563EB]" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">
                          {SITE_CLAIMS.formats.value}
                        </p>
                        <p className="text-[10px] text-[var(--txt3)]">Machine formats</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/50 p-2">
                      <Clock size={14} className="flex-shrink-0 text-[#7C3AED]" />
                      <div>
                        <p className="text-xs font-bold text-[var(--txt)]">
                          {SITE_CLAIMS.turnaround.value}
                        </p>
                        <p className="text-[10px] text-[var(--txt3)]">Turnaround</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/50 p-2">
                      <RefreshCw size={14} className="flex-shrink-0 text-[#16A34A]" />
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
                <h2 className="mb-1 font-syne text-[17px] font-bold text-[var(--txt)]">
                  Review your details
                </h2>
                <p className="mb-5 text-xs text-[var(--txt3)]">
                  Almost done! Double-check and accept the terms to finish.
                </p>

                {/* Summary card */}
                <div className="mb-5 overflow-hidden rounded-xl border border-[var(--border2)] bg-[var(--elevated)]">
                  {summaryRows.map((row, i) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i < summaryRows.length - 1 ? "border-b border-[var(--border)]" : ""
                      }`}
                    >
                      <span className="text-xs text-[var(--txt3)]">{row.label}</span>
                      <span className="max-w-[60%] truncate text-right text-xs font-medium text-[var(--txt)]">
                        {row.value || <span className="italic text-[var(--txt3)]">—</span>}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Guarantee badge — Step 3 */}
                <div className="from-[#16A34A]/8 to-[#2563EB]/8 mb-5 rounded-xl border border-[#16A34A]/15 bg-gradient-to-r p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Shield size={14} className="text-[#16A34A]" />
                    <span className="text-[11px] font-semibold text-[#16A34A]">
                      GenX Satisfaction Guarantee
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--txt2)]">
                    Not happy with your design? We'll revise it until you are —{" "}
                    <span className="font-semibold text-[var(--txt)]">
                      unlimited free revisions, no questions asked.
                    </span>{" "}
                    Your satisfaction is our reputation.
                  </p>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="agreed_terms"
                    className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-[var(--border2)] bg-[var(--elevated)] accent-[#2563EB]"
                    {...register("agreed_terms")}
                  />
                  <label
                    htmlFor="agreed_terms"
                    className="cursor-pointer text-xs leading-snug text-[var(--txt2)]"
                  >
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
                  <p className="mt-1.5 text-[11px] text-[#FB7185]">{errors.agreed_terms.message}</p>
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

      <p className="mt-4 text-center text-xs text-[var(--txt3)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#2563EB] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
