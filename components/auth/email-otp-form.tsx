"use client";

import * as React from "react";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { verifyEmailOtpAction, resendEmailOtpAction } from "@/app/(auth)/actions";

function VerifyButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-14 w-full rounded-full bg-white text-sm font-bold tracking-[0.22em] text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying…
        </span>
      ) : (
        "VERIFY EMAIL"
      )}
    </button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition hover:text-white disabled:opacity-40"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      Resend code
    </button>
  );
}

type Props = {
  email: string;
  errorMessage: string | null;
};

export function EmailOtpForm({ email, errorMessage }: Props) {
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(""));
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [inputSuccess, setInputSuccess] = React.useState(false);

  const otp = digits.join("");
  const isFull = digits.every((d) => /^\d$/.test(d));

  React.useEffect(() => {
    if (isFull) setLocalError(null);
  }, [isFull]);

  function setDigit(index: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, rawValue: string) {
    const digit = rawValue.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < 5) {
      // Small timeout ensures the state updates before focus change
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "Delete") {
      e.preventDefault();
      setDigit(index, "");
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0);
  }

  const displayError = localError ?? errorMessage;

  return (
    <div className="mt-8 space-y-6">
      {displayError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}

      {inputSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Code entered — tap Verify to continue.
        </div>
      )}

      <div>
        <p className="mb-5 text-center text-sm text-white/60">
          Enter the 6-digit code sent to{" "}
          <span className="font-semibold text-white">{email}</span>
        </p>

        <div className="flex justify-center gap-2 sm:gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              value={digits[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (isFull) setInputSuccess(true);
              }}
              className={`h-14 w-11 rounded-[1rem] border text-center text-2xl font-bold text-white outline-none backdrop-blur transition sm:w-12
                ${digits[i]
                  ? "border-indigo-400/40 bg-indigo-500/10 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20"
                  : "border-white/15 bg-white/[0.06] focus:border-white/40 focus:bg-white/[0.1] focus:ring-2 focus:ring-white/15"
                }`}
              aria-label={`Digit ${i + 1} of 6`}
            />
          ))}
        </div>

        {/* Progress indicator */}
        <div className="mt-3 flex justify-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 w-5 rounded-full transition-all ${/^\d$/.test(digits[i]) ? "bg-indigo-400" : "bg-white/10"}`}
            />
          ))}
        </div>
      </div>

      <form action={verifyEmailOtpAction}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="otp" value={otp} />
        <VerifyButton disabled={!isFull} />
      </form>

      <div className="flex justify-center">
        <form action={resendEmailOtpAction}>
          <input type="hidden" name="email" value={email} />
          <ResendButton />
        </form>
      </div>
    </div>
  );
}
