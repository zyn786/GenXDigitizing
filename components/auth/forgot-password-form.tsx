"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { forgotPasswordAction } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-bold tracking-[0.16em] text-background transition hover:opacity-90 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "SEND RESET LINK"}
    </button>
  );
}

export function ForgotPasswordForm() {
  return (
    <form action={forgotPasswordAction} className="space-y-5">
      <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/60">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="h-16 w-full bg-transparent px-5 text-base outline-none placeholder:text-muted-foreground"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
