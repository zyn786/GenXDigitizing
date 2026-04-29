import { createHash, randomBytes } from "crypto";

import {
  PrismaClient,
  VerificationTokenPurpose,
} from "@prisma/client";

import { generateOtpCode } from "./otp";

const EMAIL_VERIFICATION_MINUTES = 60 * 24;
const PASSWORD_RESET_MINUTES = 60;

type DbClient = Pick<PrismaClient, "verificationToken" | "user">;

type IssueTokenInput = {
  identifier: string;
  purpose: VerificationTokenPurpose;
  userId?: string;
  expiresInMinutes?: number;
};

type ConsumeTokenInput = {
  identifier: string;
  purpose: VerificationTokenPurpose;
  token: string;
};

export type IssuedTokenResult = {
  rawToken: string;
  hashedToken: string;
  expiresAt: Date;
};

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateVerificationTokenValue() {
  return randomBytes(32).toString("hex");
}

function getDefaultExpiryMinutes(purpose: VerificationTokenPurpose) {
  switch (purpose) {
    case VerificationTokenPurpose.PASSWORD_RESET:
      return PASSWORD_RESET_MINUTES;
    case VerificationTokenPurpose.EMAIL_VERIFICATION:
    default:
      return EMAIL_VERIFICATION_MINUTES;
  }
}

export async function issueVerificationToken(
  db: DbClient,
  input: IssueTokenInput
): Promise<IssuedTokenResult> {
  const identifier = normalizeIdentifier(input.identifier);
  const rawToken = generateVerificationTokenValue();
  const hashedToken = hashVerificationToken(rawToken);
  const expiresAt = new Date(
    Date.now() +
      1000 *
        60 *
        (input.expiresInMinutes ?? getDefaultExpiryMinutes(input.purpose))
  );

  await db.verificationToken.deleteMany({
    where: {
      identifier,
      purpose: input.purpose,
    },
  });

  await db.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      purpose: input.purpose,
      expires: expiresAt,
    },
  });

  if (input.userId) {
    if (input.purpose === VerificationTokenPurpose.EMAIL_VERIFICATION) {
      await db.user.update({
        where: { id: input.userId },
        data: {
          emailVerificationSentAt: new Date(),
        },
      });
    }

    if (input.purpose === VerificationTokenPurpose.PASSWORD_RESET) {
      await db.user.update({
        where: { id: input.userId },
        data: {
          passwordResetRequestedAt: new Date(),
        },
      });
    }
  }

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
}

export async function findValidVerificationToken(
  db: DbClient,
  input: ConsumeTokenInput
) {
  const identifier = normalizeIdentifier(input.identifier);
  const hashedToken = hashVerificationToken(input.token);

  return db.verificationToken.findFirst({
    where: {
      identifier,
      purpose: input.purpose,
      token: hashedToken,
      expires: {
        gt: new Date(),
      },
    },
  });
}

export async function consumeVerificationToken(
  db: DbClient,
  input: ConsumeTokenInput
) {
  const record = await findValidVerificationToken(db, input);

  if (!record) {
    return null;
  }

  await db.verificationToken.deleteMany({
    where: {
      token: record.token,
    },
  });

  return record;
}

export async function clearVerificationTokensForIdentifier(
  db: DbClient,
  identifier: string,
  purpose?: VerificationTokenPurpose
) {
  return db.verificationToken.deleteMany({
    where: {
      identifier: normalizeIdentifier(identifier),
      ...(purpose ? { purpose } : {}),
    },
  });
}

export async function purgeExpiredVerificationTokens(db: DbClient) {
  return db.verificationToken.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });
}

export async function issueEmailOtp(
  db: DbClient,
  input: { identifier: string; userId?: string }
): Promise<string> {
  const identifier = normalizeIdentifier(input.identifier);
  const rawOtp = generateOtpCode();
  const hashedToken = hashVerificationToken(rawOtp);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.verificationToken.deleteMany({
    where: { identifier, purpose: VerificationTokenPurpose.EMAIL_VERIFICATION },
  });

  await db.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
      expires: expiresAt,
    },
  });

  if (input.userId) {
    await db.user.update({
      where: { id: input.userId },
      data: { emailVerificationSentAt: new Date() },
    });
  }

  return rawOtp;
}