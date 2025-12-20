import { postOnboardingHandler } from '@/modules/onboarding/post-onboarding-handler';
import { honoFactory } from '@/shared/utils/factory';
import { getRepositoriesHandler } from '@/modules/repo/get-repositories-handler';
import { getRepositoryHandler } from '@/modules/repo/get-repository-handler';
import { getRepositoriesEnvHandler } from '@/modules/repo/get-repositories-env-handler';

export const v1Routes = honoFactory
	.createApp()
	.post('/onboarding', ...postOnboardingHandler)
	.get('/repos', ...getRepositoriesHandler)
	.get('/repos/:repoId', ...getRepositoryHandler)
	.get('/repos/:repoId/environments', ...getRepositoriesEnvHandler);
