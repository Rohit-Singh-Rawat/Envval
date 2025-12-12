import type { Context, Handler, MiddlewareHandler } from 'hono';
import type { z } from 'zod';
import type { AppEnv } from '@/shared/types/context';
import { zValidator } from '@hono/zod-validator';
import type { ValidationTargets } from 'hono';
import { HTTPException } from 'hono/http-exception';

type ValidationTarget = keyof ValidationTargets;

type Schema = { [K in ValidationTarget]?: z.ZodType };

type HandlerConfig<T extends Schema> = {
	schema?: T;
	middleware?: MiddlewareHandler<AppEnv>[];
	handler: (c: Context<AppEnv>) => Response | Promise<Response>;
};

function createValidator<Target extends ValidationTarget, S extends z.ZodType>(
	target: Target,
	schema: S
) {
	return zValidator(target, schema, (result) => {
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
}

export function createHandler<T extends Schema = {}>(config: HandlerConfig<T>): Handler<AppEnv>[] {
	const { schema, middleware = [], handler } = config;

	const validators = schema
		? (Object.entries(schema) as [ValidationTarget, z.ZodType][]).map(
				([target, zodSchema]) => createValidator(target, zodSchema) as unknown as Handler<AppEnv>
			)
		: [];

	return [...validators, ...(middleware as Handler<AppEnv>[]), handler as Handler<AppEnv>];
}
