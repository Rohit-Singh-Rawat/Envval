import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/shared/types/context';
import { logger } from '@/shared/utils/logger';
import { HTTP_INTERNAL_SERVER_ERROR } from '@/shared/constants/http-status';

interface ValidationError {
	path: string;
	message: string;
}

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
	logger.error(err.message, { error: err.stack });

	if (err instanceof HTTPException) {
		const cause = err.cause as ValidationError[] | undefined;

		if (cause) {
			logger.error(`Validation failed: ${err.message}`, {
				status: err.status,
				errors: cause,
			});
		}

		return c.json(
			{
				success: false,
				error: err.message,
				...(cause && { errors: cause }),
			},
			err.status
		);
	}

	return c.json(
		{
			success: false,
			error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
		},
		HTTP_INTERNAL_SERVER_ERROR
	);
};
