import crypto from 'crypto';
import { promisify } from 'util';
import { Logger } from './logger';

/**
 * Cryptographic configuration constants for the extension.
 * Changing these values will break compatibility with existing encrypted data.
 */
const CRYPTO_CONFIG = {
	/** AES-256-GCM algorithm identifier */
	ALGORITHM: 'aes-256-gcm' as const,
	/** PBKDF2 iteration count (100k for balance of security and performance) */
	PBKDF2_ITERATIONS: 100_000,
	/** Derived key length in bytes (32 bytes = 256 bits for AES-256) */
	KEY_LENGTH_BYTES: 32,
	/** Initialization vector length for AES-GCM (12 bytes is standard) */
	IV_LENGTH_BYTES: 12,
	/** Hash algorithm for PBKDF2 */
	PBKDF2_HASH: 'sha512' as const,
	/** Hash algorithm for content hashing */
	CONTENT_HASH: 'sha256' as const,
} as const;

/**
 * Result of encryption operation containing ciphertext and initialization vector.
 */
export interface EncryptionResult {
	/** Base64-encoded ciphertext with authentication tag appended (format: "ciphertext.authTag") */
	readonly ciphertext: string;
	/** Base64-encoded initialization vector */
	readonly iv: string;
}

/**
 * Custom error for cryptographic operation failures.
 * Provides context about which operation failed.
 */
export class CryptoError extends Error {
	constructor(
		message: string,
		public readonly operation: 'derive' | 'encrypt' | 'decrypt' | 'unwrap',
		public readonly cause?: Error
	) {
		super(message);
		this.name = 'CryptoError';
	}
}

/**
 * Derives an AES-256 encryption key from user's key material using PBKDF2.
 * Async version to prevent blocking the event loop.
 */
export async function deriveKeyAsync(keyMaterial: string, userId: string): Promise<string> {
	try {
		if (!keyMaterial || !userId) {
			throw new Error('keyMaterial and userId are required');
		}

		const derivedKey = await promisify(crypto.pbkdf2)(
			keyMaterial,
			userId,
			CRYPTO_CONFIG.PBKDF2_ITERATIONS,
			CRYPTO_CONFIG.KEY_LENGTH_BYTES,
			CRYPTO_CONFIG.PBKDF2_HASH
		);

		return derivedKey.toString('hex');
	} catch (error) {
		throw new CryptoError(
			'Failed to derive encryption key',
			'derive',
			error instanceof Error ? error : undefined
		);
	}
}

/**
 * Derives an AES-256 encryption key from user's key material using PBKDF2.
 *
 * Uses userId as salt to ensure deterministic key derivation across all user devices.
 * The same keyMaterial + userId combination will always produce the same AES key,
 * enabling cross-device synchronization.
 *
 * **Security Note**: While PBKDF2 is typically used for password stretching,
 * here it serves as a KDF (Key Derivation Function) to derive a domain-specific
 * encryption key from high-entropy key material.
 *
 * @param keyMaterial - User's master key material (32 bytes hex-encoded)
 * @param userId - User identifier used as salt for key derivation
 * @returns Hex-encoded AES-256 key (64 hex characters = 32 bytes)
 * @throws {CryptoError} If key derivation fails
 */
export function deriveKey(keyMaterial: string, userId: string): string {
	try {
		if (!keyMaterial || !userId) {
			throw new Error('keyMaterial and userId are required');
		}

		return crypto
			.pbkdf2Sync(
				keyMaterial,
				userId,
				CRYPTO_CONFIG.PBKDF2_ITERATIONS,
				CRYPTO_CONFIG.KEY_LENGTH_BYTES,
				CRYPTO_CONFIG.PBKDF2_HASH
			)
			.toString('hex');
	} catch (error) {
		throw new CryptoError(
			'Failed to derive encryption key',
			'derive',
			error instanceof Error ? error : undefined
		);
	}
}

/**
 * Encrypts environment file content using AES-256-GCM.
 *
 * AES-GCM provides authenticated encryption, ensuring both confidentiality
 * and integrity of the encrypted data. The authentication tag is appended
 * to the ciphertext with a '.' separator.
 *
 * @param plaintext - Environment file content to encrypt
 * @param key - Hex-encoded AES-256 key (from deriveKey)
 * @returns Encryption result containing ciphertext and IV
 * @throws {CryptoError} If encryption fails
 */
export function encryptEnv(plaintext: string, key: string, logger?: Logger): EncryptionResult {
	try {
		if (plaintext === undefined || plaintext === null || !key) {
			throw new Error('plaintext and key are required');
		}

		logger?.debug(`Encrypting ${plaintext.length} bytes`);

		const iv = crypto.randomBytes(CRYPTO_CONFIG.IV_LENGTH_BYTES);
		const cipher = crypto.createCipheriv(
			CRYPTO_CONFIG.ALGORITHM,
			Buffer.from(key, 'hex'),
			iv
		);

		let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
		ciphertext += cipher.final('base64');
		const authTag = cipher.getAuthTag();

		return {
			ciphertext: `${ciphertext}.${authTag.toString('base64')}`,
			iv: iv.toString('base64'),
		};
	} catch (error) {
		throw new CryptoError(
			'Failed to encrypt environment data',
			'encrypt',
			error instanceof Error ? error : undefined
		);
	}
}

/**
 * Decrypts environment file content using AES-256-GCM.
 *
 * Validates ciphertext format and authentication tag before decryption.
 * Authentication failure indicates data tampering or corruption.
 *
 * @param ciphertext - Encrypted data in format "ciphertext.authTag" (base64)
 * @param iv - Initialization vector (base64)
 * @param key - Hex-encoded AES-256 key (from deriveKey)
 * @returns Decrypted plaintext
 * @throws {CryptoError} If decryption fails or data is invalid/tampered
 */
export function decryptEnv(ciphertext: string, iv: string, key: string): string {
	try {
		// Validate inputs
		if (!ciphertext || !iv || !key) {
			throw new Error('ciphertext, iv, and key are required');
		}

		// Parse ciphertext format: "encryptedData.authTag"
		const parts = ciphertext.split('.');
		if (parts.length !== 2) {
			throw new Error(
				`Invalid ciphertext format. Expected "data.tag", got ${parts.length} parts`
			);
		}

		const [encryptedData, authTagBase64] = parts;

		if (!encryptedData || !authTagBase64) {
			throw new Error('Ciphertext data or authentication tag is empty');
		}

		// Validate auth tag is exactly 16 bytes (128-bit GCM tag)
		const authTagBuffer = Buffer.from(authTagBase64, 'base64');
		if (authTagBuffer.length !== 16) {
			throw new Error(`Invalid auth tag length: expected 16 bytes, got ${authTagBuffer.length}`);
		}

		const decipher = crypto.createDecipheriv(
			CRYPTO_CONFIG.ALGORITHM,
			Buffer.from(key, 'hex'),
			Buffer.from(iv, 'base64')
		);

		decipher.setAuthTag(authTagBuffer);

		// Decrypt
		let plaintext = decipher.update(encryptedData, 'base64', 'utf8');
		plaintext += decipher.final('utf8');

		return plaintext;
	} catch (error) {
		throw new CryptoError(
			error instanceof Error ? error.message : 'Failed to decrypt environment data',
			'decrypt',
			error instanceof Error ? error : undefined
		);
	}
}

/**
 * Computes SHA-256 hash of environment file content.
 *
 * Used for conflict detection and integrity verification.
 * Deterministic: same content always produces same hash.
 *
 * @param content - Environment file content to hash
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export function hashEnv(content: string): string {
	return crypto.createHash(CRYPTO_CONFIG.CONTENT_HASH).update(content).digest('hex');
}

/**
 * Counts the number of environment variables in a .env file.
 *
 * Counts lines that:
 * - Are not empty
 * - Do not start with '#' (comments)
 * - Contain '=' (key-value pairs)
 *
 * **Limitation**: Does not parse quoted values. Lines like `KEY="val=ue"`
 * with embedded '=' in quotes are counted correctly but may need special
 * handling during parsing.
 *
 * @param content - Environment file content
 * @returns Number of environment variables
 */
export function countEnvVars(content: string): number {
	const lines = content.split('\n');
	let count = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		// Skip empty lines and comments
		if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
			count++;
		}
	}

	return count;
}

/**
 * Generates an RSA-OAEP 2048-bit key pair for device key wrapping.
 *
 * The public key is sent to the server during device registration.
 * The private key stays on the device and is used to unwrap key material.
 *
 * @returns PEM-formatted public and private keys
 */
export function generateKeyPair(): { publicKeyPem: string; privateKeyPem: string } {
	const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
		modulusLength: 2048,
		publicExponent: 0x10001,
		publicKeyEncoding: { type: 'spki', format: 'pem' },
		privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
	});

	return {
		publicKeyPem: publicKey,
		privateKeyPem: privateKey,
	};
}

/**
 * Unwraps (decrypts) key material using the device private key.
 *
 * The server wraps key material with the device's public key during registration.
 * This function reverses that operation using RSA-OAEP with SHA-256.
 *
 * @param privateKeyPem - PEM-formatted RSA private key
 * @param wrappedBase64 - Base64-encoded wrapped key material from server
 * @returns Decrypted key material as hex string
 * @throws {CryptoError} If unwrapping fails
 */
export function unwrapKeyMaterial(privateKeyPem: string, wrappedBase64: string): string {
	try {
		if (!privateKeyPem || !wrappedBase64) {
			throw new Error('privateKeyPem and wrappedBase64 are required');
		}

		const wrappedBuffer = Buffer.from(wrappedBase64, 'base64');
		const decrypted = crypto.privateDecrypt(
			{
				key: privateKeyPem,
				oaepHash: 'sha256',
			},
			wrappedBuffer
		);

		return decrypted.toString('utf8');
	} catch (error) {
		throw new CryptoError(
			'Failed to unwrap key material',
			'unwrap',
			error instanceof Error ? error : undefined
		);
	}
}
