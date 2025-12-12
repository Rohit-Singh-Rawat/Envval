import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const rateLimiter = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(10, '10 s'),
	analytics: true,
});

export const authRateLimiter = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(5, '30 m'),
	analytics: true,
});

export const emailRateLimiter = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(5, '30 m'),
	analytics: true,
});

type RateLimitProps = {
	actionType: 'auth' | 'default' | 'email';
	identifier: string;
};

function getDynamicRateLimiter(actionType: 'auth' | 'default' | 'email'): Ratelimit {
	switch (actionType) {
		case 'auth':
			return authRateLimiter;
		case 'email':
			return emailRateLimiter;
		default:
			return rateLimiter;
	}
}

export async function rateLimit({ actionType, identifier }: RateLimitProps): Promise<void> {
	const limiter = getDynamicRateLimiter(actionType);
	const { success } = await limiter.limit(identifier);

	if (!success) {
		throw new Error('Too many requests. Please try again later.');
	}
}

