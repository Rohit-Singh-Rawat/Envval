import crypto from 'crypto';

export const deriveKey = (keyMaterial: string, deviceId: string) => {
	return crypto.pbkdf2Sync(keyMaterial, deviceId, 100000, 32, 'sha512').toString('hex');
};

export const encryptEnv = (env: string, key: string) => {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
	let ciphertext = cipher.update(env, 'utf8', 'base64');
	ciphertext += cipher.final('base64');
	const authTag = cipher.getAuthTag();
	return {
		ciphertext: ciphertext + '.' + authTag.toString('base64'),
		iv: iv.toString('base64'),
	};
};

export const decryptEnv = (ciphertext: string, iv: string, key: string) => {
	try {
		const decipher = crypto.createDecipheriv(
			'aes-256-gcm',
			Buffer.from(key, 'hex'),
			Buffer.from(iv, 'base64')
		);
		decipher.setAuthTag(Buffer.from(ciphertext.split('.')[1], 'base64'));
		let plaintext = decipher.update(ciphertext.split('.')[0], 'base64', 'utf8');
		plaintext += decipher.final('utf8');
		return plaintext;
	} catch (error) {
		throw new Error(
			'Failed to decrypt data: ' + (error instanceof Error ? error.message : 'Unknown error')
		);
	}
};

export const hashEnv = (envs: string): string => {
	return crypto.createHash('sha256').update(envs).digest('hex');
};

export const countEnvVars = (content: string): number => {
	const lines = content.split('\n');
	let count = 0;
	for (const line of lines) {
		const trimmed = line.trim();
		// Skip empty lines and comments, but count key=value pairs
		if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
			count++;
		}
	}
	return count;
};

/**
 * Generates an RSA-OAEP 2048-bit key pair for device key wrapping.
 * Returns PEM-formatted keys.
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
 * Unwraps (decrypts) key material using the device private key (RSA-OAEP SHA-256).
 * @param privateKeyPem - PEM-formatted private key
 * @param wrappedBase64 - Base64-encoded wrapped key material
 * @returns Decrypted key material as string
 */
export function unwrapKeyMaterial(privateKeyPem: string, wrappedBase64: string): string {
	const wrappedBuffer = Buffer.from(wrappedBase64, 'base64');
	const decrypted = crypto.privateDecrypt(
		{
			key: privateKeyPem,
			oaepHash: 'sha256',
		},
		wrappedBuffer
	);
	return decrypted.toString('utf8');
}
