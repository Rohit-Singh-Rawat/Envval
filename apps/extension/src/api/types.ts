
interface LoginWithTokenResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshTokensResponse {
  accessToken: string;
  refreshToken: string;
}

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

export { LoginWithTokenResponse, RefreshTokensResponse, EnvExistsResponse, EnvMetadata, Env, CreateEnvData, UpdateEnvData };