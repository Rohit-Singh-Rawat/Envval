/**
 * Generates an RSA-OAEP 2048-bit key pair for device key wrapping
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
	return crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: 'SHA-256',
		},
		true,
		['encrypt', 'decrypt']
	);
}

/**
 * Exports a public key as PEM format (for server compatibility)
 */
export async function exportPublicKeyAsPem(publicKey: CryptoKey): Promise<string> {
	const exported = await crypto.subtle.exportKey('spki', publicKey);
	const base64 = arrayBufferToBase64(exported);
	return `-----BEGIN PUBLIC KEY-----\n${formatPem(base64)}\n-----END PUBLIC KEY-----`;
}

/**
 * Exports a private key as JWK for IndexedDB storage
 */
export async function exportKeyAsJWK(key: CryptoKey): Promise<JsonWebKey> {
	return crypto.subtle.exportKey('jwk', key);
}

/**
 * Imports a private key from JWK format
 */
export async function importPrivateKeyFromJWK(jwk: JsonWebKey): Promise<CryptoKey> {
	return crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
		'decrypt',
	]);
}

/**
 * Unwraps (decrypts) key material using the device private key
 */
export async function unwrapKeyMaterial(
	privateKey: CryptoKey,
	wrappedBase64: string
): Promise<string> {
	const wrappedBuffer = base64ToArrayBuffer(wrappedBase64);
	const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrappedBuffer);
	return new TextDecoder().decode(decrypted);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

function formatPem(base64: string): string {
	const lines: string[] = [];
	for (let i = 0; i < base64.length; i += 64) {
		lines.push(base64.slice(i, i + 64));
	}
	return lines.join('\n');
}
