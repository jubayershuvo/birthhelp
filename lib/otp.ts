// lib/otp.ts
import { authenticator } from "otplib";
import crypto from "crypto";
import base32Encode from "base32-encode";

authenticator.options = {
  digits: 6,
  step: 600, // 10 minutes
};

// Generate deterministic base32 secret from whatsapp
export const getSecretFromWhatsapp = (whatsapp: string): string => {
  // hash the whatsapp (SHA256)
  const hash = crypto.createHash("sha256").update(whatsapp).digest();
  // encode as base32
  return base32Encode(hash, "RFC4648", { padding: false });
};

// Generate OTP
export const generateOtp = (whatsapp: string) => {
  const secret = getSecretFromWhatsapp(whatsapp);
  return authenticator.generate(secret);
};

// Verify OTP
export const verifyOtp = (otp: string, whatsapp: string) => {
  const secret = getSecretFromWhatsapp(whatsapp);
  return authenticator.check(otp, secret);
};
