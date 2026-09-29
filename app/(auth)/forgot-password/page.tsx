// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-[10px] font-syne text-xl font-bold text-white"
          style={{ background: "linear-gradient(135deg,#2563EB,#F97316)" }}
        >
          ✦
        </div>
        <span
          className="font-syne text-[18px] font-bold"
          style={{
            background: "linear-gradient(135deg,#2563EB,#F97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          GENX DIGITIZING
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--border2)] bg-[var(--surface)] p-6">
        {done ? (
          <div className="py-4 text-center">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg,#2563EB22,#F9731622)" }}
            >
              <CheckCircle2 size={26} className="text-[#16A34A]" />
            </div>
            <h2 className="mb-2 font-syne text-[17px] font-bold text-[var(--txt)]">
              Check your email
            </h2>
            <p className="text-[13px] leading-relaxed text-[var(--txt2)]">
              We sent a password reset link to{" "}
              <strong className="text-[var(--txt)]">{getValues("email")}</strong>. It expires in 1
              hour.
            </p>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="mt-5" leftIcon={<ArrowLeft size={13} />}>
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <h2 className="mb-1 font-syne text-[17px] font-bold text-[var(--txt)]">
              Forgot password?
            </h2>
            <p className="mb-5 text-[13px] leading-snug text-[var(--txt2)]">
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <div className="mb-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                leftIcon={<Mail size={14} />}
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            <Button type="submit" variant="grad" size="lg" className="w-full" loading={loading}>
              Send reset link
            </Button>
          </form>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs text-[var(--txt3)] transition-colors hover:text-[#2563EB]"
        >
          <ArrowLeft size={12} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
