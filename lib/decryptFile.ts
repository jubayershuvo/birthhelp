// utils/createDecryptFile.ts
import CryptoJS from "crypto-js";

const key = process.env.NEXT_PUBLIC_ENCRYPT_KEY;
if (!key) throw new Error("NEXT_PUBLIC_DECRYPT_KEY is not set");

const SECRET_KEY = CryptoJS.SHA256(key);

/**
 * Decrypts a custom encrypted file (.sbd)
 * @param arrayBuffer The encrypted file content as ArrayBuffer
 * @returns The decrypted JSON object
 */
export function decryptFile<T = unknown>(arrayBuffer: ArrayBuffer): T | undefined {
  const bytes = new Uint8Array(arrayBuffer);

  // Extract IV (first 16 bytes) and encrypted data
  const ivBytes = bytes.slice(0, 16);
  const dataBytes = bytes.slice(16);

  // Convert Uint8Array to CryptoJS WordArray
  const ivWordArray = CryptoJS.lib.WordArray.create(ivBytes);
  const encryptedWordArray = CryptoJS.lib.WordArray.create(dataBytes);

  // Create proper CipherParams object
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: encryptedWordArray,
  });

  // Decrypt
  const decrypted = CryptoJS.AES.decrypt(cipherParams, SECRET_KEY, { iv: ivWordArray });

  // Convert decrypted WordArray to UTF-8 string
  const resultStr = decrypted.toString(CryptoJS.enc.Utf8);

  return JSON.parse(resultStr) as T;
}
