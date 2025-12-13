import { postOnboardingHandler } from '@/modules/onboarding/post-onboarding-handler';
import { honoFactory } from '@/shared/utils/factory';

export const v1Routes = honoFactory.createApp().post('/onboarding', ...postOnboardingHandler);
