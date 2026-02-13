import { Ratelimit } from '@upstash/ratelimit';
import { HTTPException } from 'hono/http-exception';
import { redis } from './client';
import { HTTP_TOO_MANY_REQUESTS } from '@/shared/constants/http-status';

/**
 * Rate limit tier configurations using sliding window algorithm.
 * Each tier targets a specific category of API operations with appropriate thresholds.
 *
 * Tiers are layered — a single request can be checked against multiple tiers
 * (e.g., global + api, or global + auth) for defense in depth.
 */
const TIER_CONFIG = {
	/** High-throughput global limit per IP — first line of DDoS protection */
	global: { requests: 100, window: '10 s' },
	/** Standard API calls per user/IP — general abuse prevention */
	api: { requests: 60, window: '1 m' },
	/** Authentication endpoints per IP — brute force protection */
	auth: { requests: 10, window: '1 m' },
	/** Write/mutation operations per user — prevents bulk data manipulation */
	mutation: { requests: 30, window: '1 m' },
	/** Destructive operations per user — critical action throttling */
	sensitive: { requests: 5, window: '1 h' },
	/** Email dispatches per address — prevents email spam/abuse */
	email: { requests: 5, window: '30 m' },
} as const;

export type RateLimitTier = keyof typeof TIER_CONFIG;

function createLimiter(tier: RateLimitTier): Ratelimit {
	const { requests, window } = TIER_CONFIG[tier];
	return new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(
			requests,
			window as Parameters<typeof Ratelimit.slidingWindow>[1]
		),
		prefix: `rl:${tier}`,
		analytics: true,
	});
}

/** Pre-built rate limiter instances — one per tier, all sharing a single Redis connection */
const limiters: Record<RateLimitTier, Ratelimit> = {
	global: createLimiter('global'),
	api: createLimiter('api'),
	auth: createLimiter('auth'),
	mutation: createLimiter('mutation'),
	sensitive: createLimiter('sensitive'),
	email: createLimiter('email'),
};

export function getRateLimiter(tier: RateLimitTier): Ratelimit {
	return limiters[tier];
}

export function getTierConfig(tier: RateLimitTier) {
	return TIER_CONFIG[tier];
}

/**
 * Service-level rate limit enforcement — throws HTTPException(429) on breach.
 * Use for non-middleware contexts like email sending in service classes.
 */
export async function enforceRateLimit(tier: RateLimitTier, identifier: string): Promise<void> {
	const limiter = getRateLimiter(tier);
	const { success } = await limiter.limit(identifier);

	if (!success) {
		throw new HTTPException(HTTP_TOO_MANY_REQUESTS, {
			message: 'Too many requests. Please try again later.',
			// Attach a machine-readable code via cause so the global error handler
			// can surface it without conflating it with validation errors.
			cause: { code: 'rate_limit_exceeded' },
		});
	}
}
