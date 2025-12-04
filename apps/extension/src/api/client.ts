import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import { API_BASE_URL } from '../lib/constants';
import type { LoginWithTokenResponse, RefreshTokensResponse, EnvExistsResponse, EnvMetadata, Env, CreateEnvData, UpdateEnvData, Repo, RepoExistsResponse, CreateRepoData } from './types';
import type { AuthenticationProvider } from '../providers/auth-provider';
import type { Logger } from '../utils/logger';

class ApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(
            `API Error: ${error.response.status} - ${error.response.statusText}`,
            error.response.data
          );

          if (error.response.status === 401) {
            console.warn('Unauthorized request - token may be invalid');
          }
        } else if (error.request) {
          console.error('No response received from API', error.request);
        } else {
          console.error('API request setup error', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Make a GET request
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  // Make a POST request
  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // Make a PUT request
  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  // Make a DELETE request
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Generic request method
  public async request<T>(
    method: Method,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.request<T>({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  }

  // Get the underlying axios instance
  protected getClient(): AxiosInstance {
    return this.client;
  }
}


export class EnvVaultApiClient extends ApiClient {
  private static instance: EnvVaultApiClient;
  private readonly authProvider: AuthenticationProvider;
  private readonly logger: Logger;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  private constructor(authProvider: AuthenticationProvider, logger: Logger) {
    super();
    this.authProvider = authProvider;
    this.logger = logger;

    const client = this.getClient();

    // Request interceptor: get access token from authProvider and add to headers
    // If no access token exists, automatically fetch it using refresh token
    client.interceptors.request.use(
      async (config) => {
        let accessToken = await this.authProvider.getAccessToken();
        
        // If no access token, try to get one using refresh token
        if (!accessToken) {
          const refreshToken = await this.authProvider.getRefreshToken();
          if (refreshToken) {
            try {
              this.logger.info('No access token found, fetching using refresh token');
              const response = await this.refreshTokens();
              await this.authProvider.updateTokens(response.accessToken, response.refreshToken);
              accessToken = response.accessToken;
            } catch (error) {
              this.logger.error(`Failed to get access token: ${(error as Error).message}`);
              // Will be handled by response interceptor
            }
          }
        }
        
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 by refreshing token
    client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.handleTokenRefresh();
            // Retry original request with new token
            const newToken = await this.authProvider.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return client(originalRequest);
          } catch (refreshError) {
            this.logger.error(`Token refresh failed: ${(refreshError as Error).message}`);
            await this.authProvider.handleTokenRefreshFailure();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public static getInstance(authProvider?: AuthenticationProvider, logger?: Logger): EnvVaultApiClient {
    if (!EnvVaultApiClient.instance) {
      if (!authProvider || !logger) {
        throw new Error('AuthenticationProvider and Logger are required for first initialization');
      }
      EnvVaultApiClient.instance = new EnvVaultApiClient(authProvider, logger);
    }
    return EnvVaultApiClient.instance;
  }

  // Handle token refresh with deduplication
  private async handleTokenRefresh(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await this.refreshTokens();
        // Update tokens in authProvider (which stores them in secrets)
        await this.authProvider.updateTokens(response.accessToken, response.refreshToken);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Login with token (PAT from callback)
  public async loginWithToken(token: string): Promise<LoginWithTokenResponse> {
    const response = await this.post<LoginWithTokenResponse>('/auth/login-with-token', { token });
    // Store tokens in authProvider (which stores them in secrets)
    await this.authProvider.updateTokens(response.accessToken, response.refreshToken);
    return response;
  }

  // Refresh access and refresh tokens
  public async refreshTokens(): Promise<RefreshTokensResponse> {
    const refreshToken = await this.authProvider.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<RefreshTokensResponse>('/auth/refresh', {
      refreshToken: refreshToken,
    });
    return response;
  }

  // Check if environment file exists
  public async checkEnvExists(repoId: string, fileName: string): Promise<EnvExistsResponse> {
    const params = new URLSearchParams({ repoId, fileName });
    return this.get<EnvExistsResponse>(`/envs/exists?${params.toString()}`);
  }

  // Get environment metadata
  public async getEnvMetadata(envId: string): Promise<EnvMetadata> {
    return this.get<EnvMetadata>(`/envs/${envId}/metadata`);
  }

  // Get full environment
  public async getEnv(envId: string): Promise<Env> {
    return this.get<Env>(`/envs/${envId}`);
  }

  public async getEnvs(repoId: string): Promise<Env[]> {
    return this.get<Env[]>(`/envs?repoId=${repoId}`);
  }

  // Create new environment
  public async createEnv(data: CreateEnvData): Promise<Env> {
    return this.post<Env>('/envs', data);
  }

  // Update existing environment
  public async updateEnv(envId: string, data: UpdateEnvData): Promise<Env> {
    return this.put<Env>(`/envs/${envId}`, data);
  }

  // Delete existing environment
  public async deleteEnv(envId: string): Promise<void> {
    return this.delete<void>(`/envs/${envId}`);
  }

  // ===== Repo Methods (Repo-first approach) =====

  // Check if repo exists
  public async checkRepoExists(repoId: string): Promise<RepoExistsResponse> {
    return this.get<RepoExistsResponse>(`/repos/exists?repoId=${repoId}`);
  }

  // Get repo details
  public async getRepo(repoId: string): Promise<Repo> {
    return this.get<Repo>(`/repos/${repoId}`);
  }

  // Create/register repo
  public async createRepo(data: CreateRepoData): Promise<Repo> {
    return this.post<Repo>('/repos', data);
  }

  // Get all envs for a repo (already exists, but keeping it here for clarity)
  // public async getEnvs(repoId: string): Promise<Env[]> - already defined above

}
