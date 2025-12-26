interface EnvExistsResponse {
	exists: boolean;
}

interface EnvMetadata {
	id: string;
	repoId: string;
	fileName: string;
	createdAt: string;
	updatedAt: string;
}

interface Env {
	id: string;
	repoId: string;
	fileName: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

interface CreateEnvData {
	repoId: string;
	fileName: string;
	content: string;
}

interface UpdateEnvData {
	content?: string;
	fileName?: string;
}

interface Repo {
	id: string;
	repoId: string;
	name?: string;
	createdAt: string;
	updatedAt: string;
}

interface RepoExistsResponse {
	exists: boolean;
	repo?: Repo;
}

interface CreateRepoData {
	repoId: string;
	name?: string;
}

export {
	EnvExistsResponse,
	EnvMetadata,
	Env,
	CreateEnvData,
	UpdateEnvData,
	Repo,
	RepoExistsResponse,
	CreateRepoData,
};