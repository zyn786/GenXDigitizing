"use client";

import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { resetPasswordAction } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold tracking-[0.16em] text-background transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SET NEW PASSWORD"}
    </button>
  );
}

type Props = { token: string; email: string };

export function ResetPasswordForm({ token, email }: Props) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <form action={resetPasswordAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/60">
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="New password (min. 8 characters)"
            minLength={8}
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

      <SubmitButton />
    </form>
  );
}
