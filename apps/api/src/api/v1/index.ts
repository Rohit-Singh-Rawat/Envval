// v1/index.ts
import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const onboardingSchema = z.object({ name: z.string() });

export const v1Routes = new Hono<AppEnv>().post(
	'/onboarding',
	zValidator('json', onboardingSchema),
	(c) => {
		const data = c.req.valid('json');
		return c.json({ message: 'Hello, world!' });
	}
);
