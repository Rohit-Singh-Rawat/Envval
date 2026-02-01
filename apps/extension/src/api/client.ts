import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosError,
	type InternalAxiosRequestConfig,
	isAxiosError,
} from 'axios';
import { API_BASE_URL } from '../lib/constants';
import type {
	EnvExistsResponse,
	EnvMetadata,
	Env,
	CreateEnvData,
	UpdateEnvData,
	Repo,
	RepoExistsResponse,
	CreateRepoData,
	EnvsResponse,
	DeviceCodeResponse,
	DeviceTokenResponse,
	MigrateRepoData,
	MigrateRepoResponse,
} from './types';
import type { AuthenticationProvider } from '../providers/auth-provider';
import type { Logger } from '../utils/logger';

const API_V1 = '/api/v1';

/** Configuration for automatic request retry with exponential backoff. */
interface RetryConfig {
	readonly maxRetries: number;
	readonly baseDelayMs: number;
	readonly maxDelayMs: number;
	readonly retryableStatusCodes: ReadonlySet<number>;
}

/** Default retry settings: 3 attempts, 1-10s backoff, retries on transient HTTP errors. */
const RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	baseDelayMs: 1000,
	maxDelayMs: 10000,
	retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
};

/**
 * Network error codes that indicate transient failures worth retrying.
 * These typically occur due to connection issues, not server-side logic problems.
 */
const RETRYABLE_NETWORK_CODES: ReadonlySet<string> = new Set([
	'ECONNABORTED', // Request timeout
	'ETIMEDOUT', // Connection timeout
	'ECONNRESET', // Connection reset by peer
	'ECONNREFUSED', // Connection refused
	'ENOTFOUND', // DNS lookup failed
	'ENETUNREACH', // Network unreachable
	'EAI_AGAIN', // DNS lookup timeout
]);

/** Extended axios config that tracks retry attempts for the interceptor. */
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
	__retryCount?: number;
}

/**
 * Structured API error with status code and request context.
 * Enables upstream code to handle errors based on type (network vs business logic).
 */
export class ApiError extends Error {
	readonly status: number | undefined;
	readonly context: string;
	readonly isRetryable: boolean;

	constructor(message: string, status: number | undefined, context: string, isRetryable = false) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.context = context;
		this.isRetryable = isRetryable;
	}
}

/**
 * Base HTTP client with automatic retry logic for transient failures.
 * Provides typed GET, POST, PUT, DELETE methods with consistent error handling.
 */
class ApiClient {
	protected readonly client: AxiosInstance;
	protected readonly logger?: Logger;

	constructor(baseURL: string = API_BASE_URL, logger?: Logger) {
		this.logger = logger;
		this.client = axios.create({
			baseURL,
			timeout: 10000,
			headers: { 'Content-Type': 'application/json' },
		});

		this.setupRetryInterceptor();
	}

	private setupRetryInterceptor(): void {
		this.client.interceptors.response.use(
			(response) => response,
			async (error: AxiosError) => this.handleRetry(error)
		);
	}

	private async handleRetry(error: AxiosError): Promise<unknown> {
		const config = error.config as RetryableRequestConfig | undefined;
		if (!config) {
			return Promise.reject(error);
		}

		const retryCount = config.__retryCount ?? 0;
		const isRetryable = this.isRetryableError(error);
		const method = config.method?.toUpperCase() ?? 'UNKNOWN';
		const url = config.url ?? 'unknown';

		if (!isRetryable) {
			this.logger?.error(`[API] ${method} ${url} failed: ${this.extractErrorMessage(error)}`);
			return Promise.reject(error);
		}

		if (retryCount >= RETRY_CONFIG.maxRetries) {
			this.logger?.error(
				`[API] ${method} ${url} failed after ${RETRY_CONFIG.maxRetries} retries: ${this.extractErrorMessage(error)}`
			);
			return Promise.reject(error);
		}

		config.__retryCount = retryCount + 1;
		const delay = this.calculateBackoffDelay(retryCount);

		this.logger?.warn(
			`[API] ${method} ${url} - Retry ${config.__retryCount}/${RETRY_CONFIG.maxRetries} in ${delay}ms (${this.extractErrorMessage(error)})`
		);

		await this.sleep(delay);
		return this.client.request(config);
	}

	private isRetryableError(error: AxiosError): boolean {
		// Network errors without response (timeout, connection issues)
		if (!error.response) {
			return RETRYABLE_NETWORK_CODES.has(error.code ?? '');
		}

		// Server-side transient errors
		return RETRY_CONFIG.retryableStatusCodes.has(error.response.status);
	}

	/**
	 * Exponential backoff with jitter to prevent thundering herd.
	 * Formula: min(maxDelay, baseDelay * 2^attempt) + random jitter
	 */
	private calculateBackoffDelay(attempt: number): number {
		const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
		const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
		const jitter = Math.random() * 0.3 * cappedDelay; // 0-30% jitter
		return Math.floor(cappedDelay + jitter);
	}

	private extractErrorMessage(error: AxiosError): string {
		if (error.response?.data && typeof error.response.data === 'object') {
			const data = error.response.data as Record<string, unknown>;
			if (typeof data.error === 'string') return data.error;
			if (typeof data.message === 'string') return data.message;
		}
		return error.message;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await this.client.get<T>(url, config);
			return response.data;
		} catch (error) {
			throw this.createApiError(error, `GET ${url}`);
		}
	}

	protected async post<TResponse, TRequest = Record<string, unknown>>(
		url: string,
		data?: TRequest,
		config?: AxiosRequestConfig
	): Promise<TResponse> {
		try {
			const response = await this.client.post<TResponse>(url, data, config);
			return response.data;
		} catch (error) {
			throw this.createApiError(error, `POST ${url}`);
		}
	}

	protected async put<TResponse, TRequest = Record<string, unknown>>(
		url: string,
		data?: TRequest,
		config?: AxiosRequestConfig
	): Promise<TResponse> {
		try {
			const response = await this.client.put<TResponse>(url, data, config);
			return response.data;
		} catch (error) {
			throw this.createApiError(error, `PUT ${url}`);
		}
	}

	protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await this.client.delete<T>(url, config);
			return response.data;
		} catch (error) {
			throw this.createApiError(error, `DELETE ${url}`);
		}
	}

	private createApiError(error: unknown, context: string): ApiError {
		if (isAxiosError(error)) {
			const status = error.response?.status;
			const message = this.extractErrorMessage(error);
			const isRetryable = this.isRetryableError(error);
			return new ApiError(message, status, context, isRetryable);
		}
		const message = error instanceof Error ? error.message : String(error);
		return new ApiError(message, undefined, context);
	}
}

/**
 * Handles unauthenticated requests for the device code OAuth flow.
 * Used only during initial login before access tokens are available.
 */
export class AuthApiClient extends ApiClient {
	private static instance: AuthApiClient;

	private constructor() {
		super();
	}

	/** Returns the singleton instance. */
	public static getInstance(): AuthApiClient {
		if (!AuthApiClient.instance) {
			AuthApiClient.instance = new AuthApiClient();
		}
		return AuthApiClient.instance;
	}

	/** Initiates device code flow by requesting a code for the user to authorize. */
	public async requestDeviceCode(): Promise<DeviceCodeResponse> {
		return this.post<DeviceCodeResponse>('/api/auth/device/code', {
			client_id: 'envval-extension',
		}, {
			headers: { 'User-Agent': 'envval-extension' },
		});
	}

	/**
	 * Polls the server to check if user has authorized the device code.
	 * @param deviceCode - The device code from requestDeviceCode().
	 * @param publicKeyPem - Client's public key for server to encrypt key material.
	 * @param signal - Optional AbortSignal to cancel polling.
	 */
	public async pollDeviceToken(
		deviceCode: string,
		publicKeyPem: string,
		signal?: AbortSignal
	): Promise<DeviceTokenResponse> {
		return this.post<DeviceTokenResponse>('/api/auth/extension/device/token', {
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			device_code: deviceCode,
			client_id: 'envval-extension',
			public_key: publicKeyPem,
		}, {
			headers: { 'User-Agent': 'envval-extension' },
			signal,
		});
	}
}

/**
 * Authenticated API client for repository and environment operations.
 * Automatically attaches bearer tokens and handles session expiry.
 */
export class EnvVaultApiClient extends ApiClient {
	private static instance: EnvVaultApiClient;
	private readonly authProvider: AuthenticationProvider;

	private constructor(authProvider: AuthenticationProvider, logger: Logger) {
		super(API_BASE_URL, logger);
		this.authProvider = authProvider;
		this.setupAuthInterceptors();
	}

	/**
	 * Configures request/response interceptors for authentication.
	 * - Request: Attaches bearer token from auth provider.
	 * - Response: Triggers re-auth flow on 401 Unauthorized.
	 */
	private setupAuthInterceptors(): void {
		this.client.interceptors.request.use(
			async (config) => {
				const token = await this.authProvider.getAccessToken();
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => Promise.reject(error)
		);

		this.client.interceptors.response.use(
			(response) => response,
			async (error) => {
				if (isAxiosError(error) && error.response?.status === 401) {
					this.logger?.error('[API] Session expired - re-authentication required');
					await this.authProvider.handleTokenRefreshFailure();
				}
				return Promise.reject(error);
			}
		);
	}

	/**
	 * Returns the singleton instance.
	 * @throws Error if authProvider/logger not provided on first call.
	 */
	public static getInstance(
		authProvider?: AuthenticationProvider,
		logger?: Logger
	): EnvVaultApiClient {
		if (!EnvVaultApiClient.instance) {
			if (!authProvider || !logger) {
				throw new Error('EnvVaultApiClient requires AuthenticationProvider and Logger for initialization');
			}
			EnvVaultApiClient.instance = new EnvVaultApiClient(authProvider, logger);
		}
		return EnvVaultApiClient.instance;
	}

	/** Checks if a repository exists on the server. */
	public async checkRepoExists(repoId: string): Promise<RepoExistsResponse> {
		return this.get<RepoExistsResponse>(`${API_V1}/repos/exists`, {
			params: { repoId },
		});
	}

	/** Fetches repository details by ID. */
	public async getRepo(repoId: string): Promise<Repo> {
		return this.get<Repo>(`${API_V1}/repos/${encodeURIComponent(repoId)}`);
	}

	/** Creates a new repository record on the server. */
	public async createRepo(data: CreateRepoData): Promise<Repo> {
		return this.post<Repo, CreateRepoData>(`${API_V1}/repos`, data);
	}

	/** Migrates environments from an old repo ID to a new one. Returns success status. */
	public async migrateRepo(oldRepoId: string, newRepoId: string, gitRemoteUrl?: string): Promise<MigrateRepoResponse> {
		try {
			await this.post<void, MigrateRepoData>(`${API_V1}/repos/migrate`, {
				oldRepoId,
				newRepoId,
				gitRemoteUrl,
			});
			return { success: true };
		} catch (error: unknown) {
			this.logger?.error(`[API] Repository migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error during migration',
			};
		}
	}

	/** Checks if an environment file exists for a given repo. */
	public async checkEnvExists(repoId: string, fileName: string): Promise<EnvExistsResponse> {
		return this.get<EnvExistsResponse>(`${API_V1}/envs/exists`, {
			params: { repoId, fileName },
		});
	}

	/** Fetches all environments across all repositories for the authenticated user. */
	public async getAllEnvs(): Promise<EnvsResponse> {
		return this.get<EnvsResponse>(`${API_V1}/envs`);
	}

	/** Fetches all environments for a specific repository. */
	public async getEnvs(repoId: string): Promise<readonly Env[]> {
		const response = await this.get<EnvsResponse>(`${API_V1}/envs`, {
			params: { repoId },
		});
		return response.environments;
	}

	/** Fetches a single environment by ID, including encrypted content. */
	public async getEnv(envId: string): Promise<Env> {
		return this.get<Env>(`${API_V1}/envs/${encodeURIComponent(envId)}`);
	}

	/** Fetches environment metadata (version, timestamps) without content. */
	public async getEnvMetadata(envId: string): Promise<EnvMetadata> {
		return this.get<EnvMetadata>(`${API_V1}/envs/${encodeURIComponent(envId)}/metadata`);
	}

	/** Creates a new environment with encrypted content. */
	public async createEnv(data: CreateEnvData): Promise<Env> {
		return this.post<Env, CreateEnvData>(`${API_V1}/envs`, data);
	}

	/** Updates an existing environment's encrypted content. */
	public async updateEnv(envId: string, data: UpdateEnvData): Promise<Env> {
		return this.put<Env, UpdateEnvData>(`${API_V1}/envs/${encodeURIComponent(envId)}`, data);
	}

	/** Permanently deletes an environment. */
	public async deleteEnv(envId: string): Promise<void> {
		return this.delete<void>(`${API_V1}/envs/${encodeURIComponent(envId)}`);
	}
}
