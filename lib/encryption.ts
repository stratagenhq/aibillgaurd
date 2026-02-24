import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error("ENCRYPTION_KEY is not set");
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return buf;
}

export function encryptApiKey(plaintext: string): { encrypted: string; iv: string } {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptApiKey(encrypted: string, iv: string): string {
  const key = getKey();
  const data = Buffer.from(encrypted, "base64");
  const ivBuf = Buffer.from(iv, "base64");
  const tag = data.slice(data.length - TAG_LENGTH);
  const ciphertext = data.slice(0, data.length - TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
