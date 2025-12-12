import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import type { z } from 'zod';
import type { ValidationTargets } from 'hono';

type Target = keyof ValidationTargets;

export const customZValidator = <T extends z.ZodType, Target extends keyof ValidationTargets>(
	target: Target,
	schema: T
) => {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			const errors = result.error.issues.map((issue) => ({
				path: issue.path.join('.'),
				message: issue.message,
			}));

			throw new HTTPException(400, {
				message: 'Validation failed',
				cause: errors,
			});
		}
	});
};
