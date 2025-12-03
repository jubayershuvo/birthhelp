// utils/encryptFile.ts
import crypto from "crypto";

const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.NEXT_PUBLIC_ENCRYPT_KEY!)
  .digest();

export type Encryptable = string | object | string[] | object[];

export function encryptFile(data: Encryptable): Buffer {
  // Generate random IV
  const iv = crypto.randomBytes(16);

  // Create AES cipher
  const cipher = crypto.createCipheriv("aes-256-cbc", SECRET_KEY, iv);

  // Encrypt data
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);

  // Prepend IV to encrypted data
  return Buffer.concat([iv, encrypted]);

}
