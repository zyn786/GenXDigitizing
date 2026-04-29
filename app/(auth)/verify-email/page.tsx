import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Mail } from "lucide-react";

import {
  resendVerificationEmailAction,
  verifyEmailAction,
} from "@/app/(auth)/actions";
import { EmailOtpForm } from "@/components/auth/email-otp-form";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Verify Email"),
};

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    email?: string;
    token?: string;
    status?: string;
    error?: string;
    pending?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "invalid-code":
      return "That code is incorrect or has expired. Please try again or request a new code.";
    case "invalid-or-expired-token":
      return "This verification link is invalid or has expired.";
    case "invalid-email":
      return "Please enter a valid email address.";
    case "send-failed":
      return "We could not send a verification email right now. Please try again.";
    default:
      return null;
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(params.error);
  const emailValue = params.email ?? "";
  const isPending = params.pending === "1";
  const hasVerificationPayload = Boolean(params.email && params.token);
  const isVerified = params.status === "verified";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_24%),linear-gradient(180deg,#07111f_0%,#0b1423_40%,#0f1728_100%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <section className="w-full max-w-[520px] rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:p-8">

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
              {isVerified ? (
                <CheckCircle className="h-7 w-7 text-emerald-400" />
              ) : (
                <Mail className="h-7 w-7 text-white/70" />
              )}
            </div>
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">
              Email verification
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {isVerified ? "Email verified" : "Check your inbox"}
            </h1>
            {!isVerified && (
              <p className="mt-3 text-sm leading-6 text-white/55">
                {isPending
                  ? "We sent a 6-digit code to your email. Enter it below to activate your account."
                  : "Verify your email to unlock full client access."}
              </p>
            )}
          </div>

          {/* Success state */}
          {isVerified && (
            <div className="mt-6 space-y-5 text-center">
              <p className="text-sm leading-6 text-white/60">
                Your email has been verified. You now have full access to your client dashboard.
              </p>
              <Link
                href="/client/dashboard"
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-white text-sm font-bold tracking-[0.18em] text-slate-950 transition hover:bg-white/90"
              >
                GO TO DASHBOARD
              </Link>
            </div>
          )}

          {/* Sent confirmation */}
          {params.status === "sent" && !isVerified && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              A new verification code has been sent to {emailValue || "your email"}.
            </div>
          )}

          {params.status === "already-verified" && (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              This email is already verified.{" "}
              <Link href="/client/dashboard" className="underline">
                Go to dashboard
              </Link>
            </div>
          )}

          {/* OTP entry mode (new registrations) */}
          {isPending && !isVerified && (
            <EmailOtpForm email={emailValue} errorMessage={errorMessage} />
          )}

          {/* Legacy link-based verification */}
          {hasVerificationPayload && !isPending && !isVerified && (
            <>
              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorMessage}
                </div>
              )}
              <form action={verifyEmailAction} className="mt-8">
                <input type="hidden" name="email" value={params.email} />
                <input type="hidden" name="token" value={params.token} />
                <button
                  type="submit"
                  className="h-14 w-full rounded-full bg-white text-sm font-bold tracking-[0.22em] text-slate-950 transition hover:bg-white/90"
                >
                  VERIFY EMAIL
                </button>
              </form>
            </>
          )}

          {/* Resend section for non-OTP flow */}
          {!isPending && !isVerified && (
            <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-sm font-semibold">Need a new verification email?</div>
              <p className="mt-2 text-sm text-white/55">
                Enter your email and we will send you a fresh verification link.
              </p>
              <form action={resendVerificationEmailAction} className="mt-4 space-y-3">
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={emailValue}
                  placeholder="Email"
                  className="h-14 w-full rounded-[1.25rem] border border-white/10 bg-white/[0.06] px-4 text-white placeholder:text-white/35 outline-none backdrop-blur-xl focus:border-white/25"
                />
                <button
                  type="submit"
                  className="h-12 w-full rounded-full border border-white/10 bg-white/[0.07] text-sm font-semibold text-white transition hover:bg-white/[0.12]"
                >
                  RESEND VERIFICATION EMAIL
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-white/55 transition hover:text-white"
            >
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
