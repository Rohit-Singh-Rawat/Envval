import { ExtensionContext } from "vscode";

export class EnvVaultVsCodeSecrets {
  private static instance: EnvVaultVsCodeSecrets;
  private ctx: ExtensionContext;

  private constructor(ctx: ExtensionContext) {
    this.ctx = ctx;
  }

  public static getInstance(ctx?: ExtensionContext): EnvVaultVsCodeSecrets {
    if (!EnvVaultVsCodeSecrets.instance) {
      if (!ctx) {
        throw new Error(
          "ExtensionContext is required for first initialization"
        );
      }
      EnvVaultVsCodeSecrets.instance = new EnvVaultVsCodeSecrets(ctx);
    }
    return EnvVaultVsCodeSecrets.instance;
  }

  public getAccessToken(): Thenable<string | undefined> {
    return this.ctx.secrets.get("envvault.accessToken");
  }

  public getRefreshToken(): Thenable<string | undefined> {
    return this.ctx.secrets.get("envvault.refreshToken");
  }

  public getDeviceId(): Thenable<string | undefined> {
    return this.ctx.secrets.get("envvault.deviceId");
  }

  public getKeyMaterial(): Thenable<string | undefined> {
    return this.ctx.secrets.get("envvault.keyMaterial");
  }

  public async setAccessToken(token: string): Promise<void> {
    await this.ctx.secrets.store("envvault.accessToken", token);
  }

  public async setRefreshToken(token: string): Promise<void> {
    await this.ctx.secrets.store("envvault.refreshToken", token);
  }

  public async setDeviceId(id: string): Promise<void> {
    await this.ctx.secrets.store("envvault.deviceId", id);
  }

  public async setKeyMaterial(key: string): Promise<void> {
    await this.ctx.secrets.store("envvault.keyMaterial", key);
  }

  public async clearAll(): Promise<void> {
    await this.ctx.secrets.delete("envvault.accessToken");
    await this.ctx.secrets.delete("envvault.refreshToken");
    await this.ctx.secrets.delete("envvault.deviceId");
    await this.ctx.secrets.delete("envvault.keyMaterial");
  }
}


