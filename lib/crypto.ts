import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * הצפנת מפתחות API אישיים לפני שמירה ב-DB: AES-256-GCM.
 * פורמט האחסון: base64(iv[12] | authTag[16] | ciphertext).
 * KEYS_ENCRYPTION_SECRET = פלט של `openssl rand -base64 32`. צד שרת בלבד.
 */
function getKey(): Buffer {
  const b64 = process.env.KEYS_ENCRYPTION_SECRET;
  if (!b64) throw new Error("KEYS_ENCRYPTION_SECRET is not set");
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) throw new Error("KEYS_ENCRYPTION_SECRET must be 32 bytes (base64)");
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}
