/**
 * Browser-compatible cryptographic utilities for environment variable encryption/decryption.
 * Uses Web Crypto API (AES-256-GCM) for authenticated encryption.
 */

const CRYPTO_CONFIG = {
	ALGORITHM: 'AES-GCM' as const,
	KEY_LENGTH: 256,
	IV_LENGTH_BYTES: 12,
	PBKDF2_ITERATIONS: 100_000,
	PBKDF2_HASH: 'SHA-512' as const,
	CONTENT_HASH: 'SHA-256' as const,
} as const;

export class CryptoError extends Error {
	constructor(
		message: string,
		public readonly operation: 'derive' | 'decrypt' | 'parse',
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'CryptoError';
	}
}

interface ParsedCiphertext {
	readonly encryptedData: string;
	readonly authTag: string;
	readonly iv: string;
}

/**
 * Parses encrypted content format from server: "ciphertext.authTag:iv"
 * @throws {CryptoError} If format is invalid
 */
function parseCiphertextFormat(content: string): ParsedCiphertext {
	const parts = content.split(':');
	if (parts.length !== 2) {
		throw new CryptoError(
			`Invalid ciphertext format. Expected "data:iv", got ${parts.length} parts`,
			'parse'
		);
	}

	const [ciphertextWithTag, iv] = parts;
	const tagParts = ciphertextWithTag.split('.');
	
	if (tagParts.length !== 2) {
		throw new CryptoError(
			`Invalid ciphertext format. Expected "ciphertext.tag", got ${tagParts.length} parts`,
			'parse'
		);
	}

	const [encryptedData, authTag] = tagParts;
	return { encryptedData, authTag, iv };
}

/**
 * Derives an AES-256-GCM encryption key from user's key material using PBKDF2.
 * Uses userId as salt to ensure deterministic key derivation across devices.
 * 
 * @param keyMaterial - User's master key material (hex string)
 * @param userId - User identifier used as salt
 * @returns CryptoKey suitable for AES-GCM operations
 */
export async function deriveKey(
	keyMaterial: string,
	userId: string
): Promise<CryptoKey> {
	try {
		const keyMaterialBuffer = new TextEncoder().encode(keyMaterial);
		const saltBuffer = new TextEncoder().encode(userId);

		const baseKey = await crypto.subtle.importKey(
			'raw',
			keyMaterialBuffer,
			'PBKDF2',
			false,
			['deriveBits', 'deriveKey']
		);

		return await crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: saltBuffer,
				iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
				hash: CRYPTO_CONFIG.PBKDF2_HASH,
			},
			baseKey,
			{ name: CRYPTO_CONFIG.ALGORITHM, length: CRYPTO_CONFIG.KEY_LENGTH },
			false,
			['decrypt']
		);
	} catch (error) {
		throw new CryptoError(
			'Failed to derive encryption key',
			'derive',
			error
		);
	}
}

/**
 * Decrypts environment file content using AES-256-GCM.
 * Validates authentication tag to ensure data integrity.
 * 
 * @param encryptedContent - Encrypted data in format "ciphertext.authTag:iv"
 * @param key - Derived CryptoKey from deriveKey()
 * @returns Decrypted plaintext content
 * @throws {CryptoError} If decryption fails or data is tampered
 */
export async function decryptEnv(
	encryptedContent: string,
	key: CryptoKey
): Promise<string> {
	try {
		const { encryptedData, authTag, iv } = parseCiphertextFormat(encryptedContent);

		const ciphertextBuffer = base64ToArrayBuffer(encryptedData);
		const authTagBuffer = base64ToArrayBuffer(authTag);
		const ivBuffer = base64ToArrayBuffer(iv);

		// Concatenate ciphertext and auth tag as required by Web Crypto API
		const combinedBuffer = new Uint8Array(
			ciphertextBuffer.byteLength + authTagBuffer.byteLength
		);
		combinedBuffer.set(new Uint8Array(ciphertextBuffer), 0);
		combinedBuffer.set(new Uint8Array(authTagBuffer), ciphertextBuffer.byteLength);

		const decryptedBuffer = await crypto.subtle.decrypt(
			{
				name: CRYPTO_CONFIG.ALGORITHM,
				iv: ivBuffer,
			},
			key,
			combinedBuffer
		);

		return new TextDecoder().decode(decryptedBuffer);
	} catch (error) {
		throw new CryptoError(
			error instanceof Error ? error.message : 'Failed to decrypt environment data',
			'decrypt',
			error
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
