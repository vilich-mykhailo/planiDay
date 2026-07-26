// verificationCode.js
import {
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export const REGISTRATION_CODE_TTL_MS = 10 * 60 * 1000;
export const REGISTRATION_RESEND_DELAY_MS = 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function createRegistrationCode() {
  return String(randomInt(100000, 1000000));
}

export function createCodeHash(verificationId, code) {
  const secret = process.env.EMAIL_CODE_SECRET;

  if (!secret) {
    throw new Error(
      "EMAIL_CODE_SECRET не вказаний у файлі .env",
    );
  }

  return createHmac("sha256", secret)
    .update(`${verificationId}:${code}`)
    .digest("hex");
}

export function compareCodeHashes(firstHash, secondHash) {
  try {
    const firstBuffer = Buffer.from(firstHash, "hex");
    const secondBuffer = Buffer.from(secondHash, "hex");

    if (
      firstBuffer.length === 0 ||
      firstBuffer.length !== secondBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(firstBuffer, secondBuffer);
  } catch {
    return false;
  }
}