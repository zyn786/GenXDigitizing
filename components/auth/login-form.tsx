"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  googleSignInAction,
  signInPasswordAction,
} from "@/app/(auth)/actions";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold tracking-[0.16em] text-background transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-border/80 bg-background/60 px-5 text-sm font-semibold transition hover:bg-card disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      Continue with Google
    </button>
  );
}

type Props = {
  redirectTo: string;
  errorMessage: string | null;
  resetSuccess: boolean;
};

export function LoginForm({ redirectTo, errorMessage, resetSuccess }: Props) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <>
      {resetSuccess && (
        <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          Password reset successfully. Sign in with your new password.
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold tracking-tight">Sign in</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Access your digitizing dashboard with email or Google.
        </p>
      </div>

      <form action={signInPasswordAction} className="space-y-5">
        <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/60">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            className="h-16 w-full border-b border-border/80 bg-transparent px-5 text-base outline-none placeholder:text-muted-foreground"
          />
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Password"
              className="h-16 w-full bg-transparent px-5 pr-14 text-base outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground transition hover:text-foreground"
          >
            Forgot password?
          </Link>
        </div>

        <input type="hidden" name="redirectTo" value={redirectTo} />
        <SubmitButton>SIGN IN</SubmitButton>
      </form>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold tracking-[0.22em] text-muted-foreground">
          OR CONTINUE WITH
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={googleSignInAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <GoogleSubmitButton />
      </form>
    </>
  );
}
