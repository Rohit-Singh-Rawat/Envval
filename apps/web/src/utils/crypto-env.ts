const CRYPTO_CONFIG = {
  ALGORITHM: "AES-GCM" as const,
  KEY_LENGTH: 256,
  IV_LENGTH_BYTES: 12,
  PBKDF2_ITERATIONS: 100_000,
  PBKDF2_HASH: "SHA-512" as const,
  CONTENT_HASH: "SHA-256" as const,
} as const;

// Reuse a single TextEncoder/TextDecoder instance — they are stateless and cheap
// to create, but there is no reason to allocate a new one per call.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class CryptoError extends Error {
  constructor(
    message: string,
    public readonly operation: "derive" | "decrypt" | "parse",
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CryptoError";
  }
}

interface ParsedCiphertext {
  readonly encryptedData: string;
  readonly authTag: string;
  readonly iv: string;
}

function parseCiphertextFormat(content: string): ParsedCiphertext {
  const parts = content.split(":");
  if (parts.length !== 2) {
    throw new CryptoError(
      `Invalid ciphertext format. Expected "data:iv", got ${parts.length} parts`,
      "parse",
    );
  }

  const [ciphertextWithTag, iv] = parts;
  const tagParts = ciphertextWithTag.split(".");

  if (tagParts.length !== 2) {
    throw new CryptoError(
      `Invalid ciphertext format. Expected "ciphertext.tag", got ${tagParts.length} parts`,
      "parse",
    );
  }

  const [encryptedData, authTag] = tagParts;
  return { encryptedData, authTag, iv };
}

/**
 * Derives an AES-256-GCM key from user key material via PBKDF2.
 * userId is used as the salt — ensures the derived key is user-scoped.
 */
export async function deriveKey(
  keyMaterial: string,
  userId: string,
): Promise<CryptoKey> {
  try {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(keyMaterial),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode(userId),
        iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
        hash: CRYPTO_CONFIG.PBKDF2_HASH,
      },
      baseKey,
      { name: CRYPTO_CONFIG.ALGORITHM, length: CRYPTO_CONFIG.KEY_LENGTH },
      false,
      ["decrypt"],
    );
  } catch (error) {
    throw new CryptoError("Failed to derive encryption key", "derive", error);
  }
}

export async function decryptEnv(
  encryptedContent: string,
  key: CryptoKey,
): Promise<string> {
  try {
    const { encryptedData, authTag, iv } =
      parseCiphertextFormat(encryptedContent);

    const ciphertextBuffer = base64ToArrayBuffer(encryptedData);
    const authTagBuffer = base64ToArrayBuffer(authTag);
    const ivBuffer = base64ToArrayBuffer(iv);

    // Web Crypto API expects ciphertext and GCM auth tag concatenated
    const combinedBuffer = new Uint8Array(
      ciphertextBuffer.byteLength + authTagBuffer.byteLength,
    );
    combinedBuffer.set(new Uint8Array(ciphertextBuffer), 0);
    combinedBuffer.set(
      new Uint8Array(authTagBuffer),
      ciphertextBuffer.byteLength,
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: CRYPTO_CONFIG.ALGORITHM, iv: ivBuffer },
      key,
      combinedBuffer,
    );

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new CryptoError(
      error instanceof Error
        ? error.message
        : "Failed to decrypt environment data",
      "decrypt",
      error,
    );
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
