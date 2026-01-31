import { ExtensionContext } from 'vscode';
import { generateKeyPair, unwrapKeyMaterial } from './crypto';

/**
 * Manages secure storage of sensitive credentials using VS Code's SecretStorage API.
 * Handles access tokens, device IDs, and cryptographic keys required for end-to-end encryption.
 *
 * Uses the singleton pattern to ensure consistent access across the extension.
 */
export class EnvVaultVsCodeSecrets {
	private static instance: EnvVaultVsCodeSecrets;
	private ctx: ExtensionContext;

	private constructor(ctx: ExtensionContext) {
		this.ctx = ctx;
	}

	/**
	 * Returns the singleton instance, creating it if necessary.
	 * @param ctx - Required on first call to initialize the secret storage.
	 * @throws Error if ctx is not provided on first initialization.
	 */
	public static getInstance(ctx?: ExtensionContext): EnvVaultVsCodeSecrets {
		if (!EnvVaultVsCodeSecrets.instance) {
			if (!ctx) {
				throw new Error('ExtensionContext is required for first initialization');
			}
			EnvVaultVsCodeSecrets.instance = new EnvVaultVsCodeSecrets(ctx);
		}
		return EnvVaultVsCodeSecrets.instance;
	}

	/** Retrieves the stored JWT access token for API authentication. */
	public getAccessToken(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.accessToken');
	}

	/** Stores the JWT access token received after successful authentication. */
	public async setAccessToken(token: string): Promise<void> {
		await this.ctx.secrets.store('envval.accessToken', token);
	}

	/** Retrieves the unique device identifier assigned during authentication. */
	public getDeviceId(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.deviceId');
	}

	/** Stores the device ID used to identify this VS Code instance. */
	public async setDeviceId(id: string): Promise<void> {
		await this.ctx.secrets.store('envval.deviceId', id);
	}

	/** Retrieves the RSA private key (PEM format) used for decrypting environment secrets. */
	public getPrivateKey(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.privateKey');
	}

	/** Stores the RSA private key (PEM format) for local decryption operations. */
	public async setPrivateKey(privateKeyPem: string): Promise<void> {
		await this.ctx.secrets.store('envval.privateKey', privateKeyPem);
	}

	/** Retrieves the RSA public key (PEM format) shared with the server. */
	public getPublicKey(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.publicKey');
	}

	/** Stores the RSA public key (PEM format) sent to server during authentication. */
	public async setPublicKey(publicKeyPem: string): Promise<void> {
		await this.ctx.secrets.store('envval.publicKey', publicKeyPem);
	}

	/** Retrieves the server-encrypted key material (base64) for decryption. */
	public getWrappedKeyMaterial(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.wrappedKeyMaterial');
	}

	/** Stores the wrapped key material received from the server. */
	public async setWrappedKeyMaterial(wrappedKey: string): Promise<void> {
		await this.ctx.secrets.store('envval.wrappedKeyMaterial', wrappedKey);
	}

	/**
	 * Gets the decrypted key material by unwrapping with the stored private key.
	 * Returns undefined if either private key or wrapped key material is missing.
	 */
	public async getKeyMaterial(): Promise<string | undefined> {
		const privateKey = await this.getPrivateKey();
		const wrappedKeyMaterial = await this.getWrappedKeyMaterial();

		if (!privateKey || !wrappedKeyMaterial) {
			return undefined;
		}

		try {
			return unwrapKeyMaterial(privateKey, wrappedKeyMaterial);
		} catch (error) {
			console.error('Failed to unwrap key material:', error);
			return undefined;
		}
	}

	/**
	 * Generates a new RSA keypair and stores both keys.
	 * Returns the public key PEM to send to the server.
	 */
	public async generateAndStoreKeyPair(): Promise<string> {
		const { publicKeyPem, privateKeyPem } = generateKeyPair();
		await Promise.all([this.setPrivateKey(privateKeyPem), this.setPublicKey(publicKeyPem)]);
		return publicKeyPem;
	}

	/**
	 * Gets the stored public key (for sending to server during polling).
	 * Returns undefined if no keypair has been generated.
	 */
	public async getStoredPublicKey(): Promise<string | undefined> {
		return this.getPublicKey();
	}

	/**
	 * Checks if we have a stored keypair (for resuming login flow).
	 */
	public async hasKeyPair(): Promise<boolean> {
		const [privateKey, publicKey] = await Promise.all([this.getPrivateKey(), this.getPublicKey()]);
		return !!privateKey && !!publicKey;
	}

	/** Removes all stored secrets. Used during logout or credential reset. */
	public async clearAll(): Promise<void> {
		await Promise.all([
			this.ctx.secrets.delete('envval.accessToken'),
			this.ctx.secrets.delete('envval.deviceId'),
			this.ctx.secrets.delete('envval.privateKey'),
			this.ctx.secrets.delete('envval.publicKey'),
			this.ctx.secrets.delete('envval.wrappedKeyMaterial'),
		]);
	}
}
