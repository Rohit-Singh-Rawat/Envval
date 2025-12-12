import {
	createCipheriv,
	createDecipheriv,
	generateKeyPairSync,
	privateDecrypt,
	publicEncrypt,
	randomBytes,
} from 'crypto';

const MASTER_KEY_ENV = 'KEY_MATERIAL_MASTER_KEY';

function getMasterKey(): Buffer {
	const hex = process.env[MASTER_KEY_ENV];
	if (!hex) {
		throw new Error(`${MASTER_KEY_ENV} is required`);
	}
	if (hex.length !== 64) {
		throw new Error(`${MASTER_KEY_ENV} must be 32 bytes hex (64 chars)`);
	}
	return Buffer.from(hex, 'hex');
}

/**
 * Generate a random user key material (256-bit) as hex.
 */
export function generateKeyMaterial(): string {
	return randomBytes(32).toString('hex');
}

export type DeviceKeyPair = {
	publicKeyPem: string;
	privateKeyPem: string;
};

/**
 * Generate an RSA-OAEP keypair for a device (2048-bit, SHA-256).
 * Persist the private key locally on the client; only send the public key to the server.
 */
export function generateDeviceKeyPair(): DeviceKeyPair {
	const { publicKey, privateKey } = generateKeyPairSync('rsa', {
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
 * Wrap (encrypt) user key material for a device using its public key (RSA-OAEP SHA-256).
 * Returns base64 ciphertext.
 */
export function wrapKeyMaterialForDevice(publicKeyPem: string, keyMaterial: string): string {
	const buf = Buffer.from(keyMaterial, 'utf8');
	const ciphertext = publicEncrypt({ key: publicKeyPem, oaepHash: 'sha256' }, buf);
	return ciphertext.toString('base64');
}

/**
 * Unwrap (decrypt) user key material using the device private key (RSA-OAEP SHA-256).
 */
export function unwrapKeyMaterialForDevice(privateKeyPem: string, wrappedB64: string): string {
	const plaintext = privateDecrypt(
		{ key: privateKeyPem, oaepHash: 'sha256' },
		Buffer.from(wrappedB64, 'base64')
	);
	return plaintext.toString('utf8');
}

/**
 * Envelope-encrypt key material with server master key (AES-256-GCM).
 */
export function encryptKeyMaterialWithMaster(keyMaterial: string) {
	const key = getMasterKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ciphertext = Buffer.concat([cipher.update(keyMaterial, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return {
		ciphertext: Buffer.concat([ciphertext, authTag]).toString('base64'),
		iv: iv.toString('base64'),
		keyId: 'default',
	};
}

/**
 * Decrypt key material with server master key (AES-256-GCM).
 */
export function decryptKeyMaterialWithMaster(ciphertextB64: string, ivB64: string): string {
	const key = getMasterKey();
	const buf = Buffer.from(ciphertextB64, 'base64');
	const iv = Buffer.from(ivB64, 'base64');
	if (buf.length < 16) throw new Error('ciphertext too short');
	const authTag = buf.subarray(buf.length - 16);
	const data = buf.subarray(0, buf.length - 16);
	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);
	const plaintext = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
	return plaintext;
}

