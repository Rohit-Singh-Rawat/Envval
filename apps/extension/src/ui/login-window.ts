import * as vscode from "vscode";
import {
  AuthenticationProvider,
  DeviceCodeResponse,
  PollingStatus,
} from "../providers/auth-provider";
import { Logger } from "../utils/logger";
import { formatError } from "../utils/format-error";
import { getLoginWebviewContent } from "./webview/template";

type WebviewMessage =
  | {
      command: "setState";
      state: string;
      userCode?: string;
      expiresIn?: number;
      message?: string;
    }
  | { command: "browserOpened" }
  | { command: "codeCopied" }
  | { command: "pollingUpdate"; attempt: number };

export class LoginWindow {
  private static instance: LoginWindow;
  private panel: vscode.WebviewPanel | undefined;
  private readonly context: vscode.ExtensionContext;
  private readonly authProvider: AuthenticationProvider;
  private readonly logger: Logger;
  private pollingStatusListener: vscode.Disposable | undefined;
  private currentDeviceCode: DeviceCodeResponse | null = null;

  private constructor(
    context: vscode.ExtensionContext,
    authProvider: AuthenticationProvider,
    logger: Logger,
  ) {
    this.context = context;
    this.authProvider = authProvider;
    this.logger = logger;
  }

  public static getInstance(
    context?: vscode.ExtensionContext,
    authProvider?: AuthenticationProvider,
    logger?: Logger,
  ): LoginWindow {
    if (!LoginWindow.instance) {
      if (!context || !authProvider || !logger) {
        throw new Error(
          "Context, AuthProvider, and Logger are required for first initialization",
        );
      }
      LoginWindow.instance = new LoginWindow(context, authProvider, logger);
    }
    return LoginWindow.instance;
  }

  public async show(): Promise<void> {
    // If panel already exists and is visible, just reveal it
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    // Create new panel
    this.panel = vscode.window.createWebviewPanel(
      "envvalLogin",
      "EnvVal - Sign In",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.panel.webview.html = this.getWebviewContent();

    // Listen to polling status changes
    this.pollingStatusListener = this.authProvider.onPollingStatusChanged(
      (status) => this.handlePollingStatus(status),
    );

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "initiateLogin":
            await this.handleInitiateLogin();
            break;
          case "openBrowser":
            await this.handleOpenBrowser();
            break;
          case "copyCode":
            await this.handleCopyCode();
            break;
          case "copyAndOpen":
            await this.handleCopyCode();
            await this.handleOpenBrowser();
            break;
          case "cancel":
            this.handleCancel();
            break;
          case "close":
            this.dispose();
            break;
        }
      },
      null,
      this.context.subscriptions,
    );

    // Clean up when panel is closed
    this.panel.onDidDispose(
      () => {
        this.authProvider.cancelPolling();
        this.pollingStatusListener?.dispose();
        this.panel = undefined;
        this.currentDeviceCode = null;
      },
      null,
      this.context.subscriptions,
    );
  }

  private async handleInitiateLogin(): Promise<void> {
    try {
      this.sendMessage({ command: "setState", state: "requesting" });

      // Request device code from API
      this.currentDeviceCode = await this.authProvider.initiateLogin();

      // Format user code with dash for display (e.g., ABCD-1234)
      const formattedCode = this.formatUserCode(
        this.currentDeviceCode.user_code,
      );

      // Show the code to user
      this.sendMessage({
        command: "setState",
        state: "showCode",
        userCode: formattedCode,
        expiresIn: this.currentDeviceCode.expires_in,
      });

      // Start polling for token
      const success = await this.authProvider.pollForToken(
        this.currentDeviceCode.device_code,
        this.currentDeviceCode.interval,
        this.currentDeviceCode.expires_in,
      );

      if (success) {
        // Close the window after a short delay to show success
        setTimeout(() => this.dispose(), 1500);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to initiate login";
      this.logger.error(`Login initiation failed: ${errorMessage}`);
      this.sendMessage({
        command: "setState",
        state: "error",
        message: errorMessage,
      });
    }
  }

  private async handleOpenBrowser(): Promise<void> {
    if (!this.currentDeviceCode) {
      return;
    }

    const url =
      this.currentDeviceCode.verification_uri_complete ||
      this.currentDeviceCode.verification_uri;
    try {
      await this.authProvider.openVerificationUrl(url);
      this.sendMessage({ command: "browserOpened" });
    } catch (error) {
      this.logger.error(`Failed to open browser: ${formatError(error)}`);
    }
  }

  private async handleCopyCode(): Promise<void> {
    if (!this.currentDeviceCode) {
      return;
    }

    try {
      await vscode.env.clipboard.writeText(this.currentDeviceCode.user_code);
      this.sendMessage({ command: "codeCopied" });
    } catch (error) {
      this.logger.error(`Failed to copy code: ${formatError(error)}`);
    }
  }

  private handleCancel(): void {
    this.authProvider.cancelPolling();
    this.currentDeviceCode = null;
    this.sendMessage({ command: "setState", state: "initial" });
  }

  private handlePollingStatus(status: PollingStatus): void {
    switch (status.state) {
      case "success":
        this.sendMessage({ command: "setState", state: "success" });
        break;
      case "denied":
        this.sendMessage({ command: "setState", state: "denied" });
        break;
      case "expired":
        this.sendMessage({ command: "setState", state: "expired" });
        break;
      case "error":
        this.sendMessage({
          command: "setState",
          state: "error",
          message: status.message,
        });
        break;
      case "polling":
        this.sendMessage({ command: "pollingUpdate", attempt: status.attempt });
        break;
    }
  }

  private formatUserCode(code: string): string {
    // Format as XXXX-XXXX
    if (code.length === 8) {
      return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    return code;
  }

  private sendMessage(message: WebviewMessage): void {
    if (this.panel) {
      this.panel.webview.postMessage(message);
    }
  }

  private getWebviewContent(): string {
    return getLoginWebviewContent();
  }

  public dispose(): void {
    this.authProvider.cancelPolling();
    this.pollingStatusListener?.dispose();
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
    this.currentDeviceCode = null;
  }
}
