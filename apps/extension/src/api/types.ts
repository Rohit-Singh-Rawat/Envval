/**
 * API response and request types for the EnvVault extension.
 * All types use readonly modifiers for immutable fields to prevent accidental mutation.
 */

export interface EnvExistsResponse {
	readonly exists: boolean;
}

export interface EnvMetadata {
	readonly id: string;
	readonly repoId: string;
	readonly fileName: string;
	readonly envCount: number;
	readonly latestHash: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface Env {
	readonly id: string;
	readonly repoId: string;
	readonly fileName: string;
	readonly content: string;
	readonly envCount: number;
	readonly latestHash: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface CreateEnvData {
	readonly repoId: string;
	readonly fileName: string;
	readonly content: string;
	readonly envCount: number;
	readonly latestHash: string;
}

export interface UpdateEnvData {
	readonly content?: string;
	readonly fileName?: string;
	readonly envCount?: number;
	readonly latestHash?: string;
}

export interface Repo {
	readonly id: string;
	readonly repoId: string;
	readonly name?: string;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface RepoExistsResponse {
	readonly exists: boolean;
	readonly repo?: Repo;
}

export interface CreateRepoData {
	readonly repoId: string;
	readonly name?: string;
	readonly gitRemoteUrl?: string;
	readonly workspacePath: string;
}

export interface EnvsResponse {
	readonly environments: readonly Env[];
	readonly total: number;
}

export interface DeviceCodeResponse {
	readonly device_code: string;
	readonly user_code: string;
	readonly verification_uri: string;
	readonly verification_uri_complete: string;
	readonly expires_in: number;
	readonly interval: number;
}

export interface DeviceTokenResponse {
	readonly access_token: string;
	readonly device_id: string;
	readonly wrapped_key_material: string;
}

export interface MigrateRepoData {
	readonly oldRepoId: string;
	readonly newRepoId: string;
}

export interface MigrateRepoResponse {
	readonly success: boolean;
	readonly message?: string;
}