import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type EncryptedAnalyticsSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

function getEncryptionKey() {
  const configuredKey = process.env.GOOGLE_ANALYTICS_ENCRYPTION_KEY?.trim();

  if (!configuredKey) {
    throw new Error(
      "GOOGLE_ANALYTICS_ENCRYPTION_KEY must be a 32-byte base64 or hexadecimal key",
    );
  }

  const key = /^[0-9a-f]{64}$/i.test(configuredKey)
    ? Buffer.from(configuredKey, "hex")
    : Buffer.from(configuredKey, "base64");

  if (key.length !== 32) {
    throw new Error(
      "GOOGLE_ANALYTICS_ENCRYPTION_KEY must be a 32-byte base64 or hexadecimal key",
    );
  }

  return key;
}

export function encryptAnalyticsSecret(value: string): EncryptedAnalyticsSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptAnalyticsSecret(encrypted: EncryptedAnalyticsSecret): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
