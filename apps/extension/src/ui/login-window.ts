import * as vscode from 'vscode';
import { AuthenticationProvider } from '../providers/auth-provider';
import { Logger } from '../utils/logger';

export class LoginWindow {
  private static instance: LoginWindow;
  private panel: vscode.WebviewPanel | undefined;
  private readonly context: vscode.ExtensionContext;
  private readonly authProvider: AuthenticationProvider;
  private readonly logger: Logger;

  private constructor(
    context: vscode.ExtensionContext,
    authProvider: AuthenticationProvider,
    logger: Logger
  ) {
    this.context = context;
    this.authProvider = authProvider;
    this.logger = logger;
  }

  public static getInstance(
    context?: vscode.ExtensionContext,
    authProvider?: AuthenticationProvider,
    logger?: Logger
  ): LoginWindow {
    if (!LoginWindow.instance) {
      if (!context || !authProvider || !logger) {
        throw new Error('Context, AuthProvider, and Logger are required for first initialization');
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
      'envvaultLogin',
      'EnvVault - Sign In',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'openBrowserLogin':
            await this.handleBrowserLogin();
            break;
          case 'close':
            this.dispose();
            break;
        }
      },
      null,
      this.context.subscriptions
    );

    // Clean up when panel is closed
    this.panel.onDidDispose(
      () => {
        this.panel = undefined;
      },
      null,
      this.context.subscriptions
    );
  }

  private async handleBrowserLogin(): Promise<void> {
    try {
      this.sendMessage({ command: 'loading', loading: true });
      await this.authProvider.initiateLogin();
      this.sendMessage({ 
        command: 'info', 
        message: 'Complete the login in your browser. You will be redirected back to VS Code.' 
      });
      this.sendMessage({ command: 'loading', loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open browser login';
      this.logger.error(`Browser login failed: ${errorMessage}`);
      this.sendMessage({ command: 'error', message: errorMessage });
      this.sendMessage({ command: 'loading', loading: false });
    }
  }

  private sendMessage(message: any): void {
    if (this.panel) {
      this.panel.webview.postMessage(message);
    }
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EnvVault Sign In</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            max-width: 500px;
            width: 100%;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            font-size: 28px;
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
        }
        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 40px;
            font-size: 14px;
            line-height: 1.6;
        }
        .button-group {
            display: flex;
            justify-content: center;
            margin-top: 30px;
        }
        button {
            padding: 12px 32px;
            font-size: 14px;
            font-weight: 500;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: opacity 0.2s;
            min-width: 200px;
        }
        button:hover:not(:disabled) {
            opacity: 0.9;
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-primary:hover:not(:disabled) {
            background-color: var(--vscode-button-hoverBackground);
        }
        .message {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 13px;
            display: none;
        }
        .message.error {
            background-color: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            display: block;
        }
        .message.success {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            display: block;
        }
        .message.info {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            display: block;
        }
        .help-text {
            margin-top: 15px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.5;
        }
        .help-text a {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
        }
        .help-text a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Sign In to EnvVault</h1>
        <p class="subtitle">Connect your account to sync environment variables securely</p>
        
        <div id="message" class="message"></div>
        
        <div class="button-group">
            <button class="btn-primary" id="browserBtn" onclick="handleBrowserLogin()">
                Sign In with Browser
            </button>
        </div>
        
        <div class="help-text">
            <p>Click the button above to open your browser and complete the authentication.</p>
            <p>You will be redirected back to VS Code automatically after signing in.</p>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        const browserBtn = document.getElementById('browserBtn');
        const messageDiv = document.getElementById('message');
        
        function showMessage(text, type) {
            messageDiv.textContent = text;
            messageDiv.className = 'message ' + type;
        }
        
        function hideMessage() {
            messageDiv.className = 'message';
        }
        
        function setLoading(loading) {
            browserBtn.disabled = loading;
            if (loading) {
                browserBtn.textContent = 'Opening browser...';
            } else {
                browserBtn.textContent = 'Sign In with Browser';
            }
        }
        
        function handleBrowserLogin() {
            hideMessage();
            setLoading(true);
            vscode.postMessage({
                command: 'openBrowserLogin'
            });
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'error':
                    showMessage(message.message, 'error');
                    setLoading(false);
                    break;
                case 'info':
                    showMessage(message.message, 'info');
                    setLoading(false);
                    break;
                case 'success':
                    showMessage(message.message, 'success');
                    setLoading(false);
                    break;
                case 'loading':
                    setLoading(message.loading);
                    break;
            }
        });
    </script>
</body>
</html>`;
  }

  public dispose(): void {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }
}

