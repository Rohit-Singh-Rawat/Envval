import axios, { type AxiosInstance, type AxiosRequestConfig, isAxiosError } from 'axios';
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

/**
 * Custom error class for API errors with typed status code.
 * Provides structured error information for proper error handling upstream.
 */
export class ApiError extends Error {
	readonly status: number | undefined;
	readonly context: string;

	constructor(message: string, status: number | undefined, context: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.context = context;
	}
}

class ApiClient {
	protected readonly client: AxiosInstance;

	constructor(baseURL: string = API_BASE_URL) {
		this.client = axios.create({
			baseURL,
			timeout: 10000,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await this.client.get<T>(url, config);
			return response.data;
		} catch (error) {
			throw this.handleError(error, `GET ${url}`);
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
			throw this.handleError(error, `POST ${url}`);
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
			throw this.handleError(error, `PUT ${url}`);
		}
	}

	protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response = await this.client.delete<T>(url, config);
			return response.data;
		} catch (error) {
			throw this.handleError(error, `DELETE ${url}`);
		}
	}

	private handleError(error: unknown, context: string): ApiError {
		if (isAxiosError(error)) {
			const status = error.response?.status;
			const message = error.response?.data?.error || error.message;
			return new ApiError(message, status, context);
		}
		const message = error instanceof Error ? error.message : String(error);
		return new ApiError(message, undefined, context);
	}
}

export class AuthApiClient extends ApiClient {
	private static instance: AuthApiClient;

	private constructor() {
		super();
	}

	public static getInstance(): AuthApiClient {
		if (!AuthApiClient.instance) {
			AuthApiClient.instance = new AuthApiClient();
		}
		return AuthApiClient.instance;
	}

	public async requestDeviceCode(): Promise<DeviceCodeResponse> {
		return this.post<DeviceCodeResponse>('/api/auth/device/code', {
			client_id: 'envval-extension',
		}, {
			headers: { 'User-Agent': 'envval-extension' },
		});
	}

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

export class EnvVaultApiClient extends ApiClient {
	private static instance: EnvVaultApiClient;
	private readonly authProvider: AuthenticationProvider;
	private readonly logger: Logger;

	private constructor(authProvider: AuthenticationProvider, logger: Logger) {
		super();
		this.authProvider = authProvider;
		this.logger = logger;
		this.setupInterceptors();
	}

	private setupInterceptors(): void {
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
					this.logger.error('Session expired - re-authentication required');
					await this.authProvider.handleTokenRefreshFailure();
				}
				return Promise.reject(error);
			}
		);
	}

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

	// Repository Operations

	public async checkRepoExists(repoId: string): Promise<RepoExistsResponse> {
		return this.get<RepoExistsResponse>(`${API_V1}/repos/exists`, {
			params: { repoId },
		});
	}

	public async getRepo(repoId: string): Promise<Repo> {
		return this.get<Repo>(`${API_V1}/repos/${encodeURIComponent(repoId)}`);
	}

	public async createRepo(data: CreateRepoData): Promise<Repo> {
		return this.post<Repo, CreateRepoData>(`${API_V1}/repos`, data);
	}

	public async migrateRepo(oldRepoId: string, newRepoId: string): Promise<MigrateRepoResponse> {
		try {
			await this.post<void, MigrateRepoData>(`${API_V1}/repos/migrate`, {
				oldRepoId,
				newRepoId,
			});
			return { success: true };
		} catch (error: unknown) {
			this.logger.error(`Repository migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Unknown error during migration',
			};
		}
	}

	// Environment Operations

	public async checkEnvExists(repoId: string, fileName: string): Promise<EnvExistsResponse> {
		return this.get<EnvExistsResponse>(`${API_V1}/envs/exists`, {
			params: { repoId, fileName },
		});
	}

	public async getAllEnvs(): Promise<EnvsResponse> {
		return this.get<EnvsResponse>(`${API_V1}/envs`);
	}

	public async getEnvs(repoId: string): Promise<readonly Env[]> {
		const response = await this.get<EnvsResponse>(`${API_V1}/envs`, {
			params: { repoId },
		});
		return response.environments;
	}

	public async getEnv(envId: string): Promise<Env> {
		return this.get<Env>(`${API_V1}/envs/${encodeURIComponent(envId)}`);
	}

	public async getEnvMetadata(envId: string): Promise<EnvMetadata> {
		return this.get<EnvMetadata>(`${API_V1}/envs/${encodeURIComponent(envId)}/metadata`);
	}

	public async createEnv(data: CreateEnvData): Promise<Env> {
		return this.post<Env, CreateEnvData>(`${API_V1}/envs`, data);
	}

	public async updateEnv(envId: string, data: UpdateEnvData): Promise<Env> {
		return this.put<Env, UpdateEnvData>(`${API_V1}/envs/${encodeURIComponent(envId)}`, data);
	}

	public async deleteEnv(envId: string): Promise<void> {
		return this.delete<void>(`${API_V1}/envs/${encodeURIComponent(envId)}`);
	}
}
