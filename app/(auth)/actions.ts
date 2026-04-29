"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { VerificationTokenPurpose } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/auth/schemas";
import { signIn } from "@/auth";
import {
  clearVerificationTokensForIdentifier,
  consumeVerificationToken,
  issueVerificationToken,
  issueEmailOtp,
} from "@/lib/auth/tokens";
import {
  sendEmailVerificationEmail,
  sendEmailOtpEmail,
  sendPasswordResetEmail,
} from "@/lib/auth/email";

const DEFAULT_REDIRECT: Route = "/post-login";
const LOGIN_ROUTE: Route = "/login";
const FORGOT_PASSWORD_ROUTE: Route = "/forgot-password";
const RESET_PASSWORD_ROUTE: Route = "/reset-password";
const VERIFY_EMAIL_ROUTE: Route = "/verify-email";
const CLIENT_DASHBOARD_ROUTE: Route = "/client/dashboard";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  token: z.string().trim().min(1),
  password: z.string().min(8).max(128),
});

const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  token: z.string().trim().min(1),
});

const verifyEmailOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6).regex(/^\d{6}$/),
});

const resendVerificationSchema = z.object({
  email: z.string().trim().email(),
});

function getSafeRedirect(nextValue: FormDataEntryValue | null): Route {
  const value = typeof nextValue === "string" ? nextValue.trim() : "";

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  return value as Route;
}

function redirectWithParams(
  pathname: Route,
  params: Record<string, string | undefined>
): never {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const suffix = search.toString();
  const target = suffix ? `${pathname}?${suffix}` : pathname;

  redirect(target as Route);
}

function redirectToLogin(params: Record<string, string | undefined>): never {
  redirectWithParams(LOGIN_ROUTE, params);
}

export async function registerAction(formData: FormData): Promise<void> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
  });

  if (!parsed.success) {
    redirectToLogin({ mode: "register", error: "invalid-registration-form" });
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    redirectToLogin({ mode: "register", error: "email-already-exists" });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      role: "CLIENT",
      onboardingComplete: false,
      clientProfile: {
        create: {
          companyName: parsed.data.companyName || null,
        },
      },
    },
  });

  try {
    const rawOtp = await issueEmailOtp(prisma, {
      identifier: email,
      userId: user.id,
    });

    await sendEmailOtpEmail({
      to: email,
      name: user.name,
      code: rawOtp,
    });
  } catch (error) {
    console.error("Failed to send OTP email after registration", error);
  }

  try {
    await signIn("email-password", {
      email,
      password: parsed.data.password,
      redirectTo: `${VERIFY_EMAIL_ROUTE}?pending=1&email=${encodeURIComponent(
        email
      )}`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirectToLogin({
        mode: "register",
        error: "auto-login-failed",
      });
    }

    throw error;
  }
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  const redirectTo = getSafeRedirect(formData.get("redirectTo"));

  await signIn("google", {
    redirectTo,
  });
}

export async function signInPasswordAction(formData: FormData): Promise<void> {
  const emailEntry = formData.get("email");
  const passwordEntry = formData.get("password");
  const redirectTo = getSafeRedirect(formData.get("redirectTo"));

  if (typeof emailEntry !== "string" || typeof passwordEntry !== "string") {
    redirectToLogin({
      error: "invalid-email-or-password",
      next: redirectTo,
    });
  }

  const email = emailEntry;
  const password = passwordEntry;

  try {
    await signIn("email-password", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirectToLogin({
        error: "invalid-email-or-password",
        next: redirectTo,
      });
    }

    throw error;
  }

  redirect(redirectTo);
}

export async function requestPasswordResetAction(
  formData: FormData
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirectWithParams(FORGOT_PASSWORD_ROUTE, {
      error: "invalid-email",
    });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
    },
  });

  if (user?.isActive && user.email) {
    try {
      const issued = await issueVerificationToken(prisma, {
        identifier: user.email,
        purpose: VerificationTokenPurpose.PASSWORD_RESET,
        userId: user.id,
      });

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: issued.rawToken,
      });
    } catch (error) {
      console.error("Failed to send password reset email", error);
    }
  }

  redirectWithParams(FORGOT_PASSWORD_ROUTE, {
    status: "sent",
    email,
  });
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const emailValue = formData.get("email");
    const tokenValue = formData.get("token");

    redirectWithParams(RESET_PASSWORD_ROUTE, {
      error: "invalid-reset-form",
      email: typeof emailValue === "string" ? emailValue : undefined,
      token: typeof tokenValue === "string" ? tokenValue : undefined,
    });
  }

  const email = parsed.data.email.toLowerCase();

  const tokenRecord = await consumeVerificationToken(prisma, {
    identifier: email,
    purpose: VerificationTokenPurpose.PASSWORD_RESET,
    token: parsed.data.token,
  });

  if (!tokenRecord) {
    redirectWithParams(RESET_PASSWORD_ROUTE, {
      error: "invalid-or-expired-token",
      email,
      token: parsed.data.token,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    redirectWithParams(RESET_PASSWORD_ROUTE, {
      error: "invalid-or-expired-token",
      email,
      token: parsed.data.token,
    });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetRequestedAt: null,
    },
  });

  await clearVerificationTokensForIdentifier(
    prisma,
    email,
    VerificationTokenPurpose.PASSWORD_RESET
  );

  redirectToLogin({
    status: "password-reset-success",
  });
}

export async function resendVerificationEmailAction(
  formData: FormData
): Promise<void> {
  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "invalid-email",
    });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerified: true,
      isActive: true,
    },
  });

  if (!user || !user.email || !user.isActive) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      status: "sent",
      email,
    });
  }

  if (user.emailVerified) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      status: "already-verified",
      email,
    });
  }

  try {
    const issued = await issueVerificationToken(prisma, {
      identifier: email,
      purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
      userId: user.id,
    });

    await sendEmailVerificationEmail({
      to: email,
      name: user.name,
      token: issued.rawToken,
    });
  } catch (error) {
    console.error("Failed to resend verification email", error);

    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "send-failed",
      email,
    });
  }

  redirectWithParams(VERIFY_EMAIL_ROUTE, {
    status: "sent",
    email,
  });
}

export async function verifyEmailOtpAction(formData: FormData): Promise<void> {
  const parsed = verifyEmailOtpSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
  });

  if (!parsed.success) {
    const emailValue = formData.get("email");

    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "invalid-code",
      email: typeof emailValue === "string" ? emailValue : undefined,
      pending: "1",
    });
  }

  const email = parsed.data.email.toLowerCase();

  const consumed = await consumeVerificationToken(prisma, {
    identifier: email,
    purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
    token: parsed.data.otp,
  });

  if (!consumed) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "invalid-code",
      email,
      pending: "1",
    });
  }

  await prisma.user.updateMany({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await clearVerificationTokensForIdentifier(
    prisma,
    email,
    VerificationTokenPurpose.EMAIL_VERIFICATION
  );

  redirect(CLIENT_DASHBOARD_ROUTE);
}

export async function resendEmailOtpAction(formData: FormData): Promise<void> {
  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "invalid-email",
      pending: "1",
    });
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      emailVerified: true,
      isActive: true,
    },
  });

  if (user?.emailVerified) {
    redirect(CLIENT_DASHBOARD_ROUTE);
  }

  if (user?.isActive && user.id) {
    try {
      const rawOtp = await issueEmailOtp(prisma, {
        identifier: email,
        userId: user.id,
      });

      await sendEmailOtpEmail({
        to: email,
        name: user.name ?? null,
        code: rawOtp,
      });
    } catch (error) {
      console.error("Failed to resend OTP email", error);

      redirectWithParams(VERIFY_EMAIL_ROUTE, {
        error: "send-failed",
        email,
        pending: "1",
      });
    }
  }

  redirectWithParams(VERIFY_EMAIL_ROUTE, {
    status: "sent",
    email,
    pending: "1",
  });
}

export async function verifyEmailAction(formData: FormData): Promise<void> {
  const parsed = verifyEmailSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });

  if (!parsed.success) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "invalid-or-expired-token",
    });
  }

  const email = parsed.data.email.toLowerCase();

  const consumed = await consumeVerificationToken(prisma, {
    identifier: email,
    purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
    token: parsed.data.token,
  });

  if (!consumed) {
    redirectWithParams(VERIFY_EMAIL_ROUTE, {
      error: "invalid-or-expired-token",
      email,
    });
  }

  await prisma.user.updateMany({
    where: { email },
    data: {
      emailVerified: new Date(),
    },
  });

  await clearVerificationTokensForIdentifier(
    prisma,
    email,
    VerificationTokenPurpose.EMAIL_VERIFICATION
  );

  redirectWithParams(VERIFY_EMAIL_ROUTE, {
    status: "verified",
    email,
  });
}

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  return requestPasswordResetAction(formData);
}