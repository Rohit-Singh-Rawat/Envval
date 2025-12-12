import { createHandler } from '@/shared/utils/factory';
import { z } from 'zod';

export const postOnboardingHandler = createHandler({
	schema: {
		json: z.object({
			name: z.string(),
		}),
	},
	handler: async (ctx) => {
		return ctx.json({ message: 'Hello, world!' });
	},
});
