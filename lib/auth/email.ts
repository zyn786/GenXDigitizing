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

type BuildEmailShellInput = {
  previewText: string;
  badge: string;
  title: string;
  intro: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  secondaryText?: string;
  fallbackUrl?: string;
  otpCode?: string;
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
  return (
    process.env.EMAIL_FROM ??
    "GenX Digitizing <noreply@genxdigitizing.com>"
  );
}

function getLogoUrl() {
  return (
    process.env.EMAIL_LOGO_URL ??
    `${getBaseUrl()}/logo.png`
  );
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

function buildEmailShell({
  previewText,
  badge,
  title,
  intro,
  body,
  buttonLabel,
  buttonUrl,
  secondaryText,
  fallbackUrl,
  otpCode,
}: BuildEmailShellInput) {
  const logoUrl = getLogoUrl();

  const safePreviewText = escapeHtml(previewText);
  const safeBadge = escapeHtml(badge);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeBody = escapeHtml(body);
  const safeSecondaryText = secondaryText ? escapeHtml(secondaryText) : "";
  const safeButtonLabel = buttonLabel ? escapeHtml(buttonLabel) : "";
  const safeButtonUrl = buttonUrl ? escapeHtml(buttonUrl) : "";
  const safeFallbackUrl = fallbackUrl ? escapeHtml(fallbackUrl) : "";
  const safeOtpCode = otpCode ? escapeHtml(otpCode) : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
  </head>

  <body style="margin:0;padding:0;background:#f4efe6;font-family:Arial,Helvetica,sans-serif;color:#151515;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${safePreviewText}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4efe6;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:36px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;margin:0 auto;">
            <tr>
              <td align="center" style="padding:0 0 22px;">
                <img
                  src="${escapeHtml(logoUrl)}"
                  width="150"
                  alt="GenX Digitizing"
                  style="display:block;border:0;outline:none;text-decoration:none;max-width:150px;height:auto;"
                >
              </td>
            </tr>

            <tr>
              <td style="background:#101010;border-radius:28px;overflow:hidden;border:1px solid rgba(215,180,106,0.26);box-shadow:0 28px 80px rgba(16,16,16,0.22);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:34px 32px 10px;">
                      <div style="font-size:11px;line-height:1;letter-spacing:0.22em;text-transform:uppercase;color:#d7b46a;font-weight:700;">
                        ${safeBadge}
                      </div>

                      <h1 style="margin:16px 0 0;font-size:30px;line-height:1.18;color:#ffffff;font-weight:800;letter-spacing:-0.03em;">
                        ${safeTitle}
                      </h1>

                      <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#eee8dc;">
                        ${safeIntro}
                      </p>

                      <p style="margin:12px 0 0;font-size:15px;line-height:1.8;color:#cfc7b9;">
                        ${safeBody}
                      </p>
                    </td>
                  </tr>

                  ${
                    otpCode
                      ? `
                  <tr>
                    <td align="center" style="padding:22px 32px 8px;">
                      <div style="display:inline-block;background:rgba(255,255,255,0.07);border:1px solid rgba(215,180,106,0.28);border-radius:20px;padding:22px 30px;min-width:250px;">
                        <div style="font-family:'Courier New',Courier,monospace;font-size:42px;line-height:1;font-weight:800;letter-spacing:0.28em;color:#ffffff;text-align:center;">
                          ${safeOtpCode}
                        </div>
                      </div>
                    </td>
                  </tr>
                  `
                      : ""
                  }

                  ${
                    buttonLabel && buttonUrl
                      ? `
                  <tr>
                    <td align="left" style="padding:26px 32px 6px;">
                      <a
                        href="${safeButtonUrl}"
                        style="display:inline-block;background:#d7b46a;color:#111111;text-decoration:none;font-size:14px;font-weight:800;padding:14px 24px;border-radius:999px;box-shadow:0 12px 30px rgba(215,180,106,0.24);"
                      >
                        ${safeButtonLabel}
                      </a>
                    </td>
                  </tr>
                  `
                      : ""
                  }

                  ${
                    secondaryText
                      ? `
                  <tr>
                    <td style="padding:18px 32px 0;">
                      <p style="margin:0;font-size:13px;line-height:1.7;color:#9f9688;">
                        ${safeSecondaryText}
                      </p>
                    </td>
                  </tr>
                  `
                      : ""
                  }

                  ${
                    fallbackUrl
                      ? `
                  <tr>
                    <td style="padding:14px 32px 4px;">
                      <p style="margin:0;font-size:12px;line-height:1.7;color:#81786c;">
                        If the button does not work, copy and paste this link into your browser:
                      </p>

                      <p style="margin:8px 0 0;font-size:12px;line-height:1.7;color:#d8cdbd;word-break:break-all;">
                        ${safeFallbackUrl}
                      </p>
                    </td>
                  </tr>
                  `
                      : ""
                  }

                  <tr>
                    <td style="padding:28px 32px 34px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid rgba(255,255,255,0.1);">
                        <tr>
                          <td style="padding-top:18px;">
                            <p style="margin:0;font-size:12px;line-height:1.7;color:#847c70;">
                              GenX Digitizing · Premium embroidery digitizing service
                            </p>
                            <p style="margin:6px 0 0;font-size:12px;line-height:1.7;color:#6f675d;">
                              This is an automated message. Please do not reply directly to this email.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 18px 0;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#8a8175;">
                  © ${new Date().getFullYear()} GenX Digitizing. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
    html: buildEmailShell({
      previewText: "Verify your GenX Digitizing email address.",
      badge: "Account Verification",
      title: "Verify your email",
      intro: `Hi ${firstName},`,
      body:
        "Please verify your email address to unlock full access to your GenX Digitizing client portal, quotes, orders, proofs, invoices, and final files.",
      buttonLabel: "Verify Email",
      buttonUrl: verificationUrl,
      fallbackUrl: verificationUrl,
      secondaryText:
        "If you did not create this account, you can safely ignore this email.",
    }),
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
    html: buildEmailShell({
      previewText: "Your GenX Digitizing verification code is ready.",
      badge: "Secure Login Code",
      title: "Your verification code",
      intro: `Hi ${firstName},`,
      body:
        "Use the code below to verify your email and continue accessing your GenX Digitizing client portal.",
      otpCode: input.code,
      secondaryText:
        "This code expires in 15 minutes. For your security, do not share this code with anyone.",
    }),
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
    html: buildEmailShell({
      previewText: "Reset your GenX Digitizing password securely.",
      badge: "Password Recovery",
      title: "Reset your password",
      intro: `Hi ${firstName},`,
      body:
        "We received a request to reset your GenX Digitizing account password. Click the button below to create a new password.",
      buttonLabel: "Reset Password",
      buttonUrl: resetUrl,
      fallbackUrl: resetUrl,
      secondaryText:
        "If you did not request a password reset, you can safely ignore this email. Your current password will remain unchanged.",
    }),
  });
}