import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/shared/types/context';
import { logger } from '@/shared/utils/logger';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
	logger.error(err.message, { error: err.stack });

	if (err instanceof HTTPException) {
		// Validation errors include cause with field errors
		const cause = err.cause as Array<{ path: string; message: string }> | undefined;

		return c.json(
			{
				success: false,
				error: err.message,
				...(cause && { errors: cause }),
			},
			err.status
		);
	}

	// Rate limit errors
	if (err.message.includes('Too many requests')) {
		return c.json(
			{
				success: false,
				error: err.message,
			},
			429
		);
	}

	return c.json(
		{
			success: false,
			error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
		},
		500
	);
};
