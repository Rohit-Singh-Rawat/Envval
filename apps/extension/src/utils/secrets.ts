import { ExtensionContext } from 'vscode';
import { generateKeyPair, unwrapKeyMaterial } from './crypto';

export class EnvVaultVsCodeSecrets {
	private static instance: EnvVaultVsCodeSecrets;
	private ctx: ExtensionContext;

	private constructor(ctx: ExtensionContext) {
		this.ctx = ctx;
	}

	public static getInstance(ctx?: ExtensionContext): EnvVaultVsCodeSecrets {
		if (!EnvVaultVsCodeSecrets.instance) {
			if (!ctx) {
				throw new Error('ExtensionContext is required for first initialization');
			}
			EnvVaultVsCodeSecrets.instance = new EnvVaultVsCodeSecrets(ctx);
		}
		return EnvVaultVsCodeSecrets.instance;
	}

	// ==================== Access Token ====================

	public getAccessToken(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.accessToken');
	}

	public async setAccessToken(token: string): Promise<void> {
		await this.ctx.secrets.store('envval.accessToken', token);
	}

	// ==================== Device ID ====================

	public getDeviceId(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.deviceId');
	}

	public async setDeviceId(id: string): Promise<void> {
		await this.ctx.secrets.store('envval.deviceId', id);
	}

	// ==================== Private Key ====================

	public getPrivateKey(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.privateKey');
	}

	public async setPrivateKey(privateKeyPem: string): Promise<void> {
		await this.ctx.secrets.store('envval.privateKey', privateKeyPem);
	}

	// ==================== Public Key ====================

	public getPublicKey(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.publicKey');
	}

	public async setPublicKey(publicKeyPem: string): Promise<void> {
		await this.ctx.secrets.store('envval.publicKey', publicKeyPem);
	}

	// ==================== Wrapped Key Material ====================

	public getWrappedKeyMaterial(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.wrappedKeyMaterial');
	}

	public async setWrappedKeyMaterial(wrappedKey: string): Promise<void> {
		await this.ctx.secrets.store('envval.wrappedKeyMaterial', wrappedKey);
	}

	// ==================== Key Material (Decrypted) ====================

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

	// ==================== Key Pair Generation ====================

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

	// ==================== Clear All ====================

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
