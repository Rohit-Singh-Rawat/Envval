import * as vscode from 'vscode';
import axios from 'axios';
import { EnvVaultVsCodeSecrets } from '../utils/secrets';
import { API_BASE_URL, DEVICE_VERIFICATION_URL } from '../lib/constants';
import { Logger } from '../utils/logger';

// Device code response from API
export interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete: string;
	expires_in: number;
	interval: number;
}

// Token response from API (only access_token, no refresh token concept)
export interface DeviceTokenResponse {
	access_token: string;
	device_id: string;
	key_material: string;
}
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
	 * Returns the device code response so the UI can display the user code.
	 */
	public async initiateLogin(): Promise<DeviceCodeResponse> {
		this.logger.info('Initiating EnvVault device authorization flow');
		this.pollingStatusEmitter.fire({ state: 'requesting_code' });

		try {
			// Request device code from better-auth's device authorization endpoint
			const { data } = await axios.post<DeviceCodeResponse>(
				`${API_BASE_URL}/api/auth/device/code`,
				{
					client_id: 'envval-extension',
				},
				{
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'envval-extension',
					},
				}
			);

			this.logger.info(`Device code received: ${data.user_code}`);

			this.pollingStatusEmitter.fire({
				state: 'waiting_for_approval',
				userCode: data.user_code,
				verificationUrl: data.verification_uri_complete || data.verification_uri,
			});

			return data;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to request device code';
			this.logger.error(`Device code request failed: ${message}`);
			this.logger.error(`Error: ${JSON.stringify(error)}`);
			this.pollingStatusEmitter.fire({ state: 'error', message });
			throw error;
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
					// Use custom extension endpoint that returns device_id and key_material
					const { data } = await axios.post<DeviceTokenResponse>(
						`${API_BASE_URL}/api/auth/extension/device/token`,
						{
							grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
							device_code: deviceCode,
							client_id: 'envval-extension',
						},
						{
							headers: {
								'Content-Type': 'application/json',
								'User-Agent': 'envval-extension',
							},
							signal: this.pollAbortController?.signal,
						}
					);

					// Success! Store token and keys
					this.logger.info('Device authorization successful!');
					this.logger.info(`Access token: ${data.access_token} '${JSON.stringify(data)}`);
					this.logger.info(`Device ID: ${data.device_id}`);
					this.logger.info(`Key material: ${data.key_material}`);

					await this.secretsManager.setAccessToken(data.access_token);
					await this.secretsManager.setDeviceId(data.device_id);
					await this.secretsManager.setKeyMaterial(data.key_material);

					this.pollingStatusEmitter.fire({ state: 'success' });
					this.authenticationStateEmitter.fire(true);

					this.isPolling = false;
					this.pollAbortController = null;
					return true;
				} catch (error: any) {
					// Check if request was aborted
					if (axios.isCancel(error) || error.name === 'AbortError') {
						this.logger.info('Polling request was aborted');
						this.isPolling = false;
						this.pollAbortController = null;
						return false;
					}

					const errorCode = error.response?.data?.error;
					const errorDescription = error.response?.data?.error_description || error.message;

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
