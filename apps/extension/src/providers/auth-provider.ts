import * as vscode from 'vscode';
import axios from 'axios';
import { EnvVaultVsCodeSecrets } from '../utils/secrets';
import { API_BASE_URL, DEVICE_VERIFICATION_URL, SESSION_REFRESH_PATH } from '../lib/constants';
import { Logger } from '../utils/logger';
import { AuthApiClient } from '../api/client';
import { DeviceCodeResponse, DeviceTokenResponse } from '../api/types';
import { StatusBar } from '../ui/status-bar';

// Re-export types for external use
export type { DeviceCodeResponse, DeviceTokenResponse };

// Polling status for UI updates
export type PollingStatus =
	| { state: 'idle' }
	| { state: 'requesting_code' }
	| { state: 'waiting_for_approval'; userCode: string; verificationUrl: string }
	| { state: 'polling'; userCode: string; attempt: number }
	| { state: 'success' }
	| { state: 'error'; message: string }
	| { state: 'expired' }
	| { state: 'denied' };

// Polling configuration with exponential backoff
export interface PollingConfig {
	initialInterval: number; // Initial polling interval in seconds
	maxInterval: number; // Maximum polling interval in seconds
	backoffMultiplier: number; // Multiplier for exponential backoff
	slowDownIncrement: number; // Increment when server requests slow down
}

const DEFAULT_POLLING_CONFIG: PollingConfig = {
	initialInterval: 5,
	maxInterval: 30,
	backoffMultiplier: 1.5,
	slowDownIncrement: 5,
};

export class AuthenticationProvider {
	private static instance: AuthenticationProvider;
	private readonly logger: Logger;
	private readonly secretsManager: EnvVaultVsCodeSecrets;
	private readonly authClient: AuthApiClient;

	private authenticationStateEmitter = new vscode.EventEmitter<boolean>();
	public readonly onAuthenticationStateChanged = this.authenticationStateEmitter.event;

	// Polling status emitter for UI updates
	private pollingStatusEmitter = new vscode.EventEmitter<PollingStatus>();
	public readonly onPollingStatusChanged = this.pollingStatusEmitter.event;

	// Track if polling is active
	private isPolling = false;
	private pollAbortController: AbortController | null = null;

	private constructor(secretsManager: EnvVaultVsCodeSecrets, logger: Logger) {
		this.logger = logger;
		this.secretsManager = secretsManager;
		this.authClient = AuthApiClient.getInstance();
	}

	public static getInstance(
		secretsManager: EnvVaultVsCodeSecrets,
		logger?: Logger
	): AuthenticationProvider {
		if (!AuthenticationProvider.instance) {
			if (!secretsManager || !logger) {
				throw new Error('SecretsManager and Logger are required for first initialization');
			}
			AuthenticationProvider.instance = new AuthenticationProvider(secretsManager, logger);
		}
		return AuthenticationProvider.instance;
	}

	public async isAuthenticated(): Promise<boolean> {
		const accessToken = await this.secretsManager.getAccessToken();
		return accessToken !== undefined && accessToken.length > 0;
	}

	/**
	 * Initiates the device authorization flow.
	 * 1. Generates RSA keypair and stores private key
	 * 2. Requests device code from server
	 * Returns the device code response so the UI can display the user code.
	 */
	public async initiateLogin(): Promise<DeviceCodeResponse> {
		this.logger.info('Initiating EnvVault device authorization flow');
		StatusBar.getInstance().setLoading(true, 'Requesting device code...');
		this.pollingStatusEmitter.fire({ state: 'requesting_code' });

		try {
			// Step 1: Generate keypair and store private key locally
			this.logger.info('Generating device keypair...');
			const publicKeyPem = await this.secretsManager.generateAndStoreKeyPair();
			this.logger.info('Device keypair generated and private key stored');

			// Step 2: Request device code from better-auth's device authorization endpoint
			const data = await this.authClient.requestDeviceCode();

			this.logger.info(`Device code received: ${data.user_code}`);

			this.pollingStatusEmitter.fire({
				state: 'waiting_for_approval',
				userCode: data.user_code,
				verificationUrl: data.verification_uri_complete || data.verification_uri,
			});

			return data;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to request device code';
			this.logger.error(`Device code request failed: ${message}`);
			this.pollingStatusEmitter.fire({ state: 'error', message });
			throw error;
		} finally {
			StatusBar.getInstance().setLoading(false);
		}
	}

	/**
	 * Opens the verification URL in the browser.
	 */
	public async openVerificationUrl(url: string): Promise<void> {
		try {
			await vscode.env.openExternal(vscode.Uri.parse(url));
			this.logger.info(`Opened verification URL: ${url}`);
		} catch (error) {
			this.logger.error(`Failed to open verification URL: ${error}`);
			throw error;
		}
	}

	/**
	 * Calculates the next polling interval with exponential backoff.
	 */
	private calculateNextInterval(
		currentInterval: number,
		attempt: number,
		config: PollingConfig
	): number {
		// Apply exponential backoff after a few initial attempts
		if (attempt > 3) {
			const newInterval = currentInterval * config.backoffMultiplier;
			return Math.min(newInterval, config.maxInterval);
		}
		return currentInterval;
	}

	/**
	 * Polls for token after user has been shown the code.
	 * Returns true if authentication succeeded, false otherwise.
	 * Implements exponential backoff to reduce server load.
	 */
	public async pollForToken(
		deviceCode: string,
		interval: number = 5,
		expiresIn: number = 600,
		config: Partial<PollingConfig> = {}
	): Promise<boolean> {
		if (this.isPolling) {
			this.logger.warn('Already polling for token');
			return false;
		}

		const pollingConfig: PollingConfig = { ...DEFAULT_POLLING_CONFIG, ...config };

		this.isPolling = true;
		StatusBar.getInstance().setLoading(true, 'Waiting for sign-in approval...');
		this.pollAbortController = new AbortController();

		let pollingInterval = Math.max(interval, pollingConfig.initialInterval);
		const maxAttempts = Math.floor(expiresIn / pollingConfig.initialInterval);
		let attempts = 0;
		let totalWaitTime = 0;

		this.logger.info(
			`Starting token polling (initial interval: ${pollingInterval}s, max interval: ${pollingConfig.maxInterval}s, expires in: ${expiresIn}s)`
		);

		try {
			while (totalWaitTime < expiresIn && this.isPolling) {
				attempts++;

				this.pollingStatusEmitter.fire({
					state: 'polling',
					userCode: '',
					attempt: attempts,
				});

				// Wait before polling
				await this.sleep(pollingInterval * 1000);
				totalWaitTime += pollingInterval;

				if (!this.isPolling) {
					this.logger.info('Polling cancelled');
					return false;
				}

				try {
					// Get the stored public key to send with token request
					const publicKeyPem = await this.secretsManager.getStoredPublicKey();
					if (!publicKeyPem) {
						throw new Error('Public key not found - keypair generation failed');
					}

					// Use AuthApiClient to poll for token
					const data = await this.authClient.pollDeviceToken(
						deviceCode,
						publicKeyPem,
						this.pollAbortController?.signal
					);

					// Success! Store token, device ID, user ID, and wrapped key material
					this.logger.info('Device authorization successful!');
					this.logger.info(`Device ID: ${data.device_id}`);
					this.logger.info(`User ID: ${data.user_id}`);

					await this.secretsManager.setAccessToken(data.access_token);
					await this.secretsManager.setDeviceId(data.device_id);
					await this.secretsManager.setUserId(data.user_id);
					await this.secretsManager.setWrappedKeyMaterial(data.wrapped_key_material);

					// Verify we can decrypt the key material
					const keyMaterial = await this.secretsManager.getKeyMaterial();
					if (!keyMaterial) {
						throw new Error('Failed to decrypt key material with stored private key');
					}
					this.logger.info('Key material successfully decrypted and verified');

					this.pollingStatusEmitter.fire({ state: 'success' });
					this.authenticationStateEmitter.fire(true);

					this.isPolling = false;
					this.pollAbortController = null;
					return true;
				} catch (error: unknown) {
					// Check if request was aborted
					if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
						this.logger.info('Polling request was aborted');
						this.isPolling = false;
						this.pollAbortController = null;
						return false;
					}

					const errorCode = (error as any).response?.data?.error;
					const errorDescription = (error as any).response?.data?.error_description || (error as Error).message;

					switch (errorCode) {
						case 'authorization_pending':
							// User hasn't approved yet, apply exponential backoff
							const previousInterval = pollingInterval;
							pollingInterval = this.calculateNextInterval(
								pollingInterval,
								attempts,
								pollingConfig
							);
							if (pollingInterval !== previousInterval) {
								this.logger.debug(
									`Polling attempt ${attempts}: authorization pending, increasing interval to ${pollingInterval}s`
								);
							} else {
								this.logger.debug(`Polling attempt ${attempts}: authorization pending`);
							}
							break;

						case 'slow_down':
							// Server explicitly requests slower polling
							pollingInterval = Math.min(
								pollingInterval + pollingConfig.slowDownIncrement,
								pollingConfig.maxInterval
							);
							this.logger.info(
								`Server requested slow down, polling interval now ${pollingInterval}s`
							);
							break;

						case 'access_denied':
							this.logger.error('User denied the authorization request');
							this.pollingStatusEmitter.fire({ state: 'denied' });
							this.isPolling = false;
							this.pollAbortController = null;
							return false;

						case 'expired_token':
							this.logger.error('Device code has expired');
							this.pollingStatusEmitter.fire({ state: 'expired' });
							this.isPolling = false;
							this.pollAbortController = null;
							return false;

						default:
							this.logger.error(`Polling error: ${errorCode} - ${errorDescription}`);
							// Apply backoff for transient errors as well
							pollingInterval = this.calculateNextInterval(
								pollingInterval,
								attempts,
								pollingConfig
							);
							break;
					}
				}
			}

			// Max time reached
			this.logger.error('Token polling timed out');
			this.pollingStatusEmitter.fire({ state: 'expired' });
			this.isPolling = false;
			this.pollAbortController = null;
			return false;
		} finally {
			this.isPolling = false;
			this.pollAbortController = null;
			StatusBar.getInstance().setLoading(false);
		}
	}

	/**
	 * Cancels any ongoing polling.
	 */
	public cancelPolling(): void {
		if (this.isPolling) {
			this.logger.info('Cancelling token polling');
			this.isPolling = false;
			this.pollAbortController?.abort();
			this.pollAbortController = null;
			this.pollingStatusEmitter.fire({ state: 'idle' });
		}
	}

	public async getAccessToken(): Promise<string | undefined> {
		return this.secretsManager.getAccessToken();
	}

	public async setAccessToken(accessToken: string): Promise<void> {
		await this.secretsManager.setAccessToken(accessToken);
		this.authenticationStateEmitter.fire(true);
	}

	public async logout(): Promise<void> {
		try {
			this.logger.info('EnvVault: Logging out');
			this.cancelPolling();

			await this.secretsManager.clearAll();
			this.authenticationStateEmitter.fire(false);

			vscode.window.showInformationMessage('EnvVault: Logged out successfully.');
		} catch (error) {
			this.logger.error(`Logout failed: ${(error as Error).message}`);
			vscode.window.showErrorMessage('EnvVault: Failed to logout.');
		}
	}

	/**
	 * Attempts to refresh the session by calling the server's extension-only
	 * refresh endpoint. Uses raw axios to avoid triggering interceptors.
	 * Returns the (same or new) access token on success, null if the session
	 * was revoked or cannot be refreshed.
	 */
	public async refreshSession(): Promise<string | null> {
		const currentToken = await this.secretsManager.getAccessToken();
		if (!currentToken) {
			this.logger.warn('[Auth] No access token to refresh');
			return null;
		}

		try {
			const response = await axios.post<{ access_token: string }>(
				`${API_BASE_URL}${SESSION_REFRESH_PATH}`,
				undefined,
				{
					headers: {
						Authorization: `Bearer ${currentToken}`,
						'User-Agent': 'envval-extension',
					},
					timeout: 10_000,
					validateStatus: (status) => status < 500,
				}
			);

			if (response.status === 200 && response.data.access_token) {
				this.logger.info('[Auth] Session refreshed successfully');
				await this.secretsManager.setAccessToken(response.data.access_token);
				return response.data.access_token;
			}

			// 401 = session revoked or doesn't exist
			this.logger.info('[Auth] Session refresh rejected by server (revoked or expired beyond recovery)');
			return null;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			this.logger.error(`[Auth] Session refresh failed: ${message}`);
			return null;
		}
	}

	public async handleTokenRefreshFailure(): Promise<void> {
		this.logger.info('EnvVault: Token refresh failed, logging out');
		await this.logout();
		vscode.window.showWarningMessage('EnvVault: Session expired. Please log in again.');
	}

	public dispose(): void {
		this.cancelPolling();
		this.authenticationStateEmitter.dispose();
		this.pollingStatusEmitter.dispose();
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
