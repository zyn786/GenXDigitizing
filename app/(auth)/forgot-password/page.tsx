import type { Metadata } from "next";
import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { buildTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: buildTitle("Forgot Password"),
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    status?: string;
    error?: string;
    email?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "invalid-email":
      return "Please enter a valid email address.";
    default:
      return null;
  }
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const errorMessage = getErrorMessage(params.error);
  const emailValue = params.email ?? "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.16),transparent_24%),linear-gradient(180deg,#07111f_0%,#0b1423_40%,#0f1728_100%)]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <section className="w-full max-w-[560px] rounded-2xl border border-border/60 bg-card p-6 shadow-lg md:p-8">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.24em] text-white/45">
              Account recovery
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Forgot your password?
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Enter your email and we will send you a password reset link.
            </p>
          </div>

          {params.status === "sent" ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              If an account exists for {emailValue || "that email"}, a reset link has
              been sent.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <form action={requestPasswordResetAction} className="mt-8 space-y-5">
            <input
              name="email"
              type="email"
              required
              defaultValue={emailValue}
              placeholder="Email"
              className="h-16 w-full rounded-[1.5rem] border border-white/10 bg-white/8 px-5 text-white placeholder:text-white/35 outline-none backdrop-blur-xl"
            />

            <button
              type="submit"
              className="h-14 w-full rounded-full bg-white text-sm font-bold tracking-[0.22em] text-slate-950 transition hover:bg-white/90"
            >
              SEND RESET LINK
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-white/70 transition hover:text-white"
            >
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}