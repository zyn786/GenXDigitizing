import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

import { buildTitle } from "@/lib/site";
import { PublicShellBackground } from "@/components/marketing/public-shell-background";
import { SiteLogo } from "@/components/branding/site-logo";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: buildTitle("Login"),
};

type LoginPageProps = {
  searchParams?: Promise<{
    mode?: string;
    error?: string;
    next?: string;
    reset?: string;
    status?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "invalid-email-or-password":
      return "Invalid email or password.";
    case "email-already-exists":
      return "An account with that email already exists.";
    case "invalid-registration-form":
      return "Please complete the registration form correctly.";
    case "auto-login-failed":
      return "Account created, but automatic sign in failed. Please sign in manually.";
    default:
      return null;
  }
}

function getStatusMessage(status?: string) {
  switch (status) {
    case "password-reset-success":
      return "Your password has been reset. Please sign in.";
    case "session-expired":
      return "Your session expired due to inactivity. Please sign in again.";
    default:
      return null;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const isRegister = params.mode === "register";
  const redirectTo = params.next?.startsWith("/") ? params.next : "/post-login";
  const errorMessage = getErrorMessage(params.error);
  const statusMessage = getStatusMessage(params.status);
  const resetSuccess = params.reset === "1" || params.status === "password-reset-success";

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <PublicShellBackground />

      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />

      <div className="relative z-10 min-h-screen">
        <div className="page-shell flex min-h-screen items-center justify-center py-8">
          <div className="grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left — brand panel */}
            <section className="hidden lg:block">
              <div className="max-w-2xl space-y-6">
                <div className="inline-flex rounded-full border border-border/80 bg-card/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-xl">
                  Premium embroidery digitizing
                </div>

                <SiteLogo size="md" />

                <div className="space-y-4">
                  <h1 className="text-5xl font-semibold tracking-tight">
                    Embroidery digitizing, vector art & custom patches —
                    <span className="gradient-text"> delivered production-ready.</span>
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-muted-foreground">
                    GenX Digitizing turns your artwork into machine-ready files your
                    decorators can run without callbacks. Crisp stitch quality, fast
                    delivery, and a client portal to track every order.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                  >
                    Get a free quote
                  </Link>
                  <Link
                    href="/portfolio"
                    className="inline-flex h-12 items-center rounded-full border border-border/80 bg-card/70 px-6 text-sm font-semibold transition hover:bg-card"
                  >
                    View our work
                  </Link>
                </div>

                <div className="grid max-w-2xl gap-4 pt-4 sm:grid-cols-3">
                  {[
                    ["1,200+", "Files delivered"],
                    ["24 hr", "Standard turnaround"],
                    ["100%", "Revision included"],
                  ].map(([value, label]) => (
                    <div
                      key={label}
                      className="rounded-[1.5rem] border border-border/80 bg-card/70 p-4 backdrop-blur-xl"
                    >
                      <div className="text-3xl font-semibold gradient-text">{value}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Right — auth card */}
            <section className="flex justify-center lg:justify-end">
              <div className="glass-panel premium-shadow w-full max-w-[570px] rounded-[2rem] border-border/80 p-4 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to site
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/70 text-muted-foreground transition hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </Link>
                </div>

                {/* Tab toggle */}
                <div className="mb-6 grid grid-cols-2 rounded-full border border-border/80 bg-background/60 p-1">
                  <Link
                    href="/login"
                    className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                      !isRegister
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?mode=register"
                    className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                      isRegister
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Create Account
                  </Link>
                </div>

                {statusMessage ? (
                  <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    {statusMessage}
                  </div>
                ) : null}

                {!isRegister ? (
                  <>
                    <LoginForm
                      redirectTo={redirectTo}
                      errorMessage={errorMessage}
                      resetSuccess={resetSuccess}
                    />

                    <div className="mt-4 text-right">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-white/65 transition hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </>
                ) : (
                  <RegisterForm
                    redirectTo={redirectTo}
                    errorMessage={errorMessage}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}