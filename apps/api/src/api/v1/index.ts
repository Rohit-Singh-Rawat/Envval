import { honoFactory } from '@/shared/utils/factory';
import { rateLimitMiddleware } from '@/shared/middleware/rate-limit.middleware';

import { postOnboardingHandler } from '@/modules/onboarding/post-onboarding-handler';

import { getRepositoriesHandler } from '@/modules/repo/get-repositories-handler';
import { getRepositoryHandler } from '@/modules/repo/get-repository-handler';
import { getRepositoryBySlugHandler } from '@/modules/repo/get-repository-by-slug-handler';
import { getRepositoryExistsHandler } from '@/modules/repo/get-repositories-exist-handler';
import { getRepositoriesEnvHandler } from '@/modules/repo/get-repositories-env-handler';
import { getRepoEnvByFilenameHandler } from '@/modules/repo/get-repo-env-by-filename-handler';
import { postRepositoriesHandler } from '@/modules/repo/post-repositories-handler';
import { postRepoMigrateHandler } from '@/modules/repo/post-repo-migrate-handler';
import { deleteRepositoryHandler } from '@/modules/repo/delete-repository-handler';

import { getEnvsHandler } from '@/modules/envs/get-envs-handler';
import { getEnvHandler } from '@/modules/envs/get-env-handler';
import { getEnvMetadataHandler } from '@/modules/envs/get-env-metadata-handler';
import { getEnvExistsHandler } from '@/modules/envs/get-envs-exists-handler';
import { postEnvsHandler } from '@/modules/envs/post-envs-handler';
import { putEnvsHandler } from '@/modules/envs/put-envs-handler';
import { deleteEnvHandler } from '@/modules/envs/delete-env-handler';

import { getDevicesHandler } from '@/modules/devices/get-devices-handler';
import { deleteDeviceHandler } from '@/modules/devices/delete-device-handler';
import { postRevokeAllDevicesHandler } from '@/modules/devices/post-revoke-all-devices-handler';

import { getUserProfileHandler } from '@/modules/user/get-user-profile-handler';
import { patchUserProfileHandler } from '@/modules/user/patch-user-profile-handler';
import { patchUserNotificationsHandler } from '@/modules/user/patch-user-notifications-handler';
import { getUserStatsHandler } from '@/modules/user/get-user-stats-handler';
import { deleteUserRepositoriesHandler } from '@/modules/user/delete-user-repositories-handler';
import { deleteUserAccountHandler } from '@/modules/user/delete-user-account-handler';

/**
 * API v1 Routes
 *
 * Rate limiting layers (applied cumulatively):
 * 1. Global IP limit (100 req/10s) — applied in app.ts
 * 2. API user limit (60 req/min) — applied here via .use()
 * 3. Sensitive tier (5 req/hr) — applied per-handler on destructive operations
 *
 * RESTful conventions:
 * - Path params for resource identifiers: /repos/:repoId, /envs/:envId
 * - Query params for filtering: /envs?repoId=xxx
 * - Query params for existence checks: /repos/exists?repoId=xxx
 * - Slug-based routes: /repos/by-slug/:slug for human-readable URLs
 */
export const v1Routes = honoFactory
	.createApp()
	.use('*', rateLimitMiddleware({ tier: 'api' }))
	.post('/onboarding', ...postOnboardingHandler)

	// Repositories
	.get('/repos', ...getRepositoriesHandler)
	.post('/repos', ...postRepositoriesHandler)
	.get('/repos/exists', ...getRepositoryExistsHandler)
	.post('/repos/migrate', ...postRepoMigrateHandler)
	.get('/repos/by-slug/:slug', ...getRepositoryBySlugHandler)
	.delete('/repos/by-slug/:slug', ...deleteRepositoryHandler)
	.get('/repos/:repoId', ...getRepositoryHandler)
	.get('/repos/:repoId/environments', ...getRepositoriesEnvHandler)
	.get('/repos/:repoId/environments/:fileName', ...getRepoEnvByFilenameHandler)

	// Environments
	.get('/envs', ...getEnvsHandler)
	.post('/envs', ...postEnvsHandler)
	.get('/envs/exists', ...getEnvExistsHandler)
	.get('/envs/:envId', ...getEnvHandler)
	.get('/envs/:envId/metadata', ...getEnvMetadataHandler)
	.put('/envs/:envId', ...putEnvsHandler)
	.delete('/envs/:envId', ...deleteEnvHandler)

	// Devices
	.get('/devices', ...getDevicesHandler)
	.delete('/devices/:deviceId', ...deleteDeviceHandler)
	.post('/devices/revoke-all', ...postRevokeAllDevicesHandler)

	// User Settings
	.get('/user/profile', ...getUserProfileHandler)
	.patch('/user/profile', ...patchUserProfileHandler)
	.patch('/user/notifications', ...patchUserNotificationsHandler)
	.get('/user/stats', ...getUserStatsHandler)
	.delete('/user/repositories', ...deleteUserRepositoriesHandler)
	.delete('/user/account', ...deleteUserAccountHandler);
