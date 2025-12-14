import { postOnboardingHandler } from '@/modules/onboarding/post-onboarding-handler';
import { honoFactory } from '@/shared/utils/factory';
import { getRepositoriesHandler } from '@/modules/repo/get-repositories-handler';

export const v1Routes = honoFactory
	.createApp()
	.post('/onboarding', ...postOnboardingHandler)
	.get('/repos', ...getRepositoriesHandler);
