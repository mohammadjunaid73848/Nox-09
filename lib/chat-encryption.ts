import crypto from "crypto"

const ENCRYPTION_ALGORITHM = "aes-256-gcm"

/**
 * Encrypt chat message content
 * Uses AES-256-GCM for authenticated encryption
 */
export function encryptChatMessage(
  content: string,
  encryptionKey: string,
): {
  encryptedContent: string
  iv: string
  authTag: string
} {
  const iv = crypto.randomBytes(16)
  const key = Buffer.from(encryptionKey.padEnd(32, "0").slice(0, 32))

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  let encryptedContent = cipher.update(content, "utf8", "hex")
  encryptedContent += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  return {
    encryptedContent,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  }
}

/**
 * Decrypt chat message content
 */
export function decryptChatMessage(
  encryptedContent: string,
  iv: string,
  authTag: string,
  encryptionKey: string,
): string {
  const key = Buffer.from(encryptionKey.padEnd(32, "0").slice(0, 32))

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(iv, "hex"))
  decipher.setAuthTag(Buffer.from(authTag, "hex"))

  let decrypted = decipher.update(encryptedContent, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * Generate encryption key from user ID and secret
 */
export function generateUserEncryptionKey(userId: string): string {
  const secret = process.env.ENCRYPTION_SECRET || "default-secret-key-change-in-production"
  return crypto.createHmac("sha256", secret).update(userId).digest("hex")
}
