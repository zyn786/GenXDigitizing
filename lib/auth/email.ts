import { Resend } from "resend";

type SendEmailVerificationInput = {
  to: string;
  name?: string | null;
  token: string;
};

type SendPasswordResetInput = {
  to: string;
  name?: string | null;
  token: string;
};

type SendEmailOtpInput = {
  to: string;
  name?: string | null;
  code: string;
};

function getBaseUrl() {
  const value =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000";

  return value.replace(/\/+$/, "");
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.EMAIL_FROM ?? "GenX Digitizing <noreply@genxdigitizing.com>";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildEmailVerificationUrl(email: string, token: string) {
  const url = new URL("/verify-email", getBaseUrl());
  url.searchParams.set("email", email.trim().toLowerCase());
  url.searchParams.set("token", token);
  return url.toString();
}

export function buildPasswordResetUrl(email: string, token: string) {
  const url = new URL("/reset-password", getBaseUrl());
  url.searchParams.set("email", email.trim().toLowerCase());
  url.searchParams.set("token", token);
  return url.toString();
}

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: getFromEmail(),
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email.");
  }
}

export async function sendEmailVerificationEmail(
  input: SendEmailVerificationInput
) {
  const verificationUrl = buildEmailVerificationUrl(input.to, input.token);
  const firstName = input.name?.trim() || "there";

  await sendEmail({
    to: input.to,
    subject: "Verify your email for GenX Digitizing",
    text: [
      `Hi ${firstName},`,
      "",
      "Please verify your email to unlock full access to your client portal.",
      "",
      `Verify email: ${verificationUrl}`,
      "",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:0 auto;padding:24px;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">
          GenX Digitizing
        </div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Verify your email</h1>
        <p style="margin:16px 0 0;">
          Hi ${escapeHtml(firstName)},
        </p>
        <p style="margin:12px 0 0;">
          Please verify your email to unlock full access to your client portal.
        </p>
        <p style="margin:24px 0;">
          <a
            href="${verificationUrl}"
            style="display:inline-block;padding:12px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;"
          >
            Verify email
          </a>
        </p>
        <p style="margin:0;color:#6b7280;font-size:14px;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="word-break:break-all;font-size:14px;color:#374151;">
          ${escapeHtml(verificationUrl)}
        </p>
        <p style="margin-top:20px;color:#6b7280;font-size:14px;">
          If you did not create this account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendEmailOtpEmail(input: SendEmailOtpInput) {
  const firstName = input.name?.trim() || "there";

  await sendEmail({
    to: input.to,
    subject: "Your verification code — GenX Digitizing",
    text: [
      `Hi ${firstName},`,
      "",
      `Your 6-digit verification code is: ${input.code}`,
      "",
      "This code expires in 15 minutes.",
      "",
      "If you did not create this account, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;background:#07111f;max-width:620px;margin:0 auto;padding:32px;border-radius:20px;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">
          GenX Digitizing
        </div>
        <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#ffffff;">Verify your email</h1>
        <p style="margin:16px 0 0;color:#9ca3af;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:10px 0 0;color:#9ca3af;">Enter this code to verify your email and access your client portal:</p>
        <div style="margin:32px 0;text-align:center;">
          <div style="display:inline-block;padding:20px 48px;border-radius:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);letter-spacing:0.35em;font-size:44px;font-weight:800;color:#ffffff;font-family:'Courier New',monospace;">
            ${escapeHtml(input.code)}
          </div>
        </div>
        <p style="color:#6b7280;font-size:14px;margin:0;">This code expires in <strong style="color:#d1d5db;">15 minutes</strong>.</p>
        <p style="margin-top:20px;color:#6b7280;font-size:14px;">If you did not create this account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  input: SendPasswordResetInput
) {
  const resetUrl = buildPasswordResetUrl(input.to, input.token);
  const firstName = input.name?.trim() || "there";

  await sendEmail({
    to: input.to,
    subject: "Reset your GenX Digitizing password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset your password.",
      "",
      `Reset password: ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:0 auto;padding:24px;">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">
          GenX Digitizing
        </div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Reset your password</h1>
        <p style="margin:16px 0 0;">
          Hi ${escapeHtml(firstName)},
        </p>
        <p style="margin:12px 0 0;">
          We received a request to reset your password.
        </p>
        <p style="margin:24px 0;">
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:12px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-weight:600;"
          >
            Reset password
          </a>
        </p>
        <p style="margin:0;color:#6b7280;font-size:14px;">
          If the button does not work, copy and paste this link into your browser:
        </p>
        <p style="word-break:break-all;font-size:14px;color:#374151;">
          ${escapeHtml(resetUrl)}
        </p>
        <p style="margin-top:20px;color:#6b7280;font-size:14px;">
          If you did not request this, you can ignore this email.
        </p>
      </div>
    `,
  });
}