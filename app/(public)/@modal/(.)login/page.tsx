import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { ModalCloseButton } from "@/components/auth/modal-close-button";

export const metadata: Metadata = {
  title: "Sign In · GenX Digitizing",
};

type LoginModalProps = {
  searchParams?: Promise<{
    mode?: string;
    error?: string;
    next?: string;
    reset?: string;
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

export default async function LoginModalPage({ searchParams }: LoginModalProps) {
  const params = (await searchParams) ?? {};
  const isRegister = params.mode === "register";
  const redirectTo = params.next?.startsWith("/") ? params.next : "/post-login";
  const errorMessage = getErrorMessage(params.error);
  const resetSuccess = params.reset === "1";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8">
      {/* Backdrop — blurs the page behind */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-[540px]">
        <div className="glass-panel premium-shadow rounded-[2rem] border-border/80 p-4 md:p-7">

          {/* Header row */}
          <div className="mb-5 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </Link>
            <ModalCloseButton />
          </div>

          {/* Tab toggle */}
          <div className="mb-6 grid grid-cols-2 rounded-full border border-border/80 bg-background/60 p-1">
            <Link
              href="/login"
              className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                !isRegister
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                isRegister
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </Link>
          </div>

          {/* Form */}
          {!isRegister ? (
            <LoginForm
              redirectTo={redirectTo}
              errorMessage={errorMessage}
              resetSuccess={resetSuccess}
            />
          ) : (
            <RegisterForm
              redirectTo={redirectTo}
              errorMessage={errorMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
