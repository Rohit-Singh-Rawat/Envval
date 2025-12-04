import * as vscode from "vscode";
import { EnvVaultVsCodeSecrets } from "../utils/secrets";
import { ENVVAULT_SIGNIN_URL } from "../lib/constants";
import { Logger } from "../utils/logger";

export class AuthenticationProvider {
  private static instance: AuthenticationProvider;
  private readonly logger: Logger;
  private readonly secretsManager: EnvVaultVsCodeSecrets;

  private authenticationStateEmitter = new vscode.EventEmitter<boolean>();
  public readonly onAuthenticationStateChanged =
    this.authenticationStateEmitter.event;

  private constructor(
    secretsManager: EnvVaultVsCodeSecrets,
    logger: Logger
  ) {
    this.logger = logger;
    this.secretsManager = secretsManager;
  }

  public static getInstance(
    secretsManager: EnvVaultVsCodeSecrets,
    logger?: Logger
  ): AuthenticationProvider {
    if (!AuthenticationProvider.instance) {
      if (!secretsManager || !logger) {
        throw new Error(
          "SecretsManager and Logger are required for first initialization"
        );
      }
      AuthenticationProvider.instance = new AuthenticationProvider(
        secretsManager,
        logger
      );
    }
    return AuthenticationProvider.instance;
  }

  public async isAuthenticated(): Promise<boolean> {
    const refreshToken = await this.secretsManager.getRefreshToken();
    return refreshToken !== undefined && refreshToken.length > 0;
  }

  public async initiateLogin(): Promise<void> {
    try {
      this.logger.info("Initiating EnvVault login flow");

      const uriScheme = vscode.env.uriScheme;
      const loginUrl = `${ENVVAULT_SIGNIN_URL}&scheme=${uriScheme}`;
      await vscode.env.openExternal(vscode.Uri.parse(loginUrl));

      vscode.window.showInformationMessage(
        "EnvVault: Complete the login in your browser. You will be redirected back to VS Code."
      );
    } catch (error) {
      this.logger.error(`Login failed: ${(error as Error).message}`);
      vscode.window.showErrorMessage(
        "EnvVault: Failed to initiate login. Please try again."
      );
    }
  }

  public async handleAuthenticationCallback(
    callbackUri: vscode.Uri
  ): Promise<void> {
    try {
      this.logger.info(
        `Handling EnvVault auth callback: ${callbackUri.toString()}`
      );

      const queryParams = new URLSearchParams(callbackUri.query);
      const refreshToken = queryParams.get("token");

      if (!refreshToken) {
        this.logger.error("No refresh token found in EnvVault callback URL");
        vscode.window.showErrorMessage(
          "EnvVault: Authentication failed - no token received."
        );
        return;
      }

      await this.secretsManager.setRefreshToken(refreshToken);
      this.logger.info("EnvVault refresh token stored successfully");

      this.authenticationStateEmitter.fire(true);

      vscode.window.showInformationMessage(
        "EnvVault: Successfully logged in!"
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle EnvVault auth callback: ${(error as Error).message}`
      );
      vscode.window.showErrorMessage(
        "EnvVault: Authentication failed. Please try again."
      );
    }
  }

  public async getAccessToken(): Promise<string | undefined> {
    return this.secretsManager.getAccessToken();
  }

  public async getRefreshToken(): Promise<string | undefined> {
    return this.secretsManager.getRefreshToken();
  }

  public async updateTokens(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    await this.secretsManager.setAccessToken(accessToken);
    await this.secretsManager.setRefreshToken(refreshToken);
    this.authenticationStateEmitter.fire(true);
  }

  public async logout(): Promise<void> {
    try {
      this.logger.info("EnvVault: Logging out");

      await this.secretsManager.clearAll();
      this.authenticationStateEmitter.fire(false);

      vscode.window.showInformationMessage(
        "EnvVault: Logged out successfully."
      );
    } catch (error) {
      this.logger.error(`Logout failed: ${(error as Error).message}`);
      vscode.window.showErrorMessage("EnvVault: Failed to logout.");
    }
  }

  public async handleTokenRefreshFailure(): Promise<void> {
    this.logger.info("EnvVault: Token refresh failed, logging out");
    await this.logout();
    vscode.window.showWarningMessage(
      "EnvVault: Session expired. Please log in again."
    );
  }

  public dispose(): void {
    this.authenticationStateEmitter.dispose();
  }
}
