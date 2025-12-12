import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context';
import { postOnboardingHandler } from '@/modules/onboarding/post-onboarding-handler';

export const v1Routes = new Hono<AppEnv>();

v1Routes.post('/onboarding', ...postOnboardingHandler);
