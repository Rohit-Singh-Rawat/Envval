import { ExtensionContext } from 'vscode';

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

	public getAccessToken(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.accessToken');
	}

	public getDeviceId(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.deviceId');
	}

	public getKeyMaterial(): Thenable<string | undefined> {
		return this.ctx.secrets.get('envval.keyMaterial');
	}

	public async setAccessToken(token: string): Promise<void> {
		await this.ctx.secrets.store('envval.accessToken', token);
	}

	public async setDeviceId(id: string): Promise<void> {
		await this.ctx.secrets.store('envval.deviceId', id);
	}

	public async setKeyMaterial(key: string): Promise<void> {
		await this.ctx.secrets.store('envval.keyMaterial', key);
	}

	public async clearAll(): Promise<void> {
		await this.ctx.secrets.delete('envval.accessToken');
		await this.ctx.secrets.delete('envval.deviceId');
		await this.ctx.secrets.delete('envval.keyMaterial');
	}
}
