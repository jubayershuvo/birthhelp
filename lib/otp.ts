// lib/otp.ts
import { authenticator } from "otplib";
import crypto from "crypto";
import base32Encode from "base32-encode";

authenticator.options = {
  digits: 6,
  step: 600, // 10 minutes
};

// Generate deterministic base32 secret from email
export const getSecretFromEmail = (email: string): string => {
  // hash the email (SHA256)
  const hash = crypto.createHash("sha256").update(email).digest();
  // encode as base32
  return base32Encode(hash, "RFC4648", { padding: false });
};

// Generate OTP
export const generateOtp = (email: string) => {
  const secret = getSecretFromEmail(email);
  return authenticator.generate(secret);
};

// Verify OTP
export const verifyOtp = (token: string, email: string) => {
  const secret = getSecretFromEmail(email);
  return authenticator.check(token, secret);
};
