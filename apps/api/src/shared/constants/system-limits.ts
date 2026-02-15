/**
 * Centralized system limits for abuse prevention.
 * All quotas and size caps live here — tune per pricing tier as needed.
 */

export const MAX_REQUEST_BODY_SIZE = 1024 * 1024; // 1 MB

export const MAX_ENV_CONTENT_LENGTH = 512_000;
export const MAX_ENV_VAR_COUNT = 10_000;
export const MAX_ENV_FILE_NAME_LENGTH = 255;
export const MAX_ENVS_PER_REPO = 50;

export const MAX_REPOS_PER_USER = 50;
export const MAX_WORKSPACE_PATH_LENGTH = 1024;

export const MAX_DEVICES_PER_USER = 20;

export const MAX_PUBLIC_KEY_LENGTH = 4096;
