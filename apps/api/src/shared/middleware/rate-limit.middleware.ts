import type { MiddlewareHandler, Context } from "hono";
import type { AppEnv } from "@/shared/types/context";
import {
  getRateLimiter,
  type RateLimitTier,
} from "@/shared/lib/redis/rate-limit";
import { HTTP_TOO_MANY_REQUESTS } from "@/shared/constants/http-status";

interface RateLimitMiddlewareOptions {
  /** Rate limit tier to apply */
  tier: RateLimitTier;
  /**
   * Identifier strategy for tracking requests:
   * - `'ip'`   — Always use client IP (best for unauthenticated/public routes)
   * - `'user'` — Use session user ID with IP fallback (best for authenticated routes)
   * - `function` — Custom extraction for specialized cases (e.g., email address)
   * @default 'user'
   */
  by?: "ip" | "user" | ((c: Context<AppEnv>) => string);
  /**
   * Restrict rate limiting to specific HTTP methods.
   * Requests with non-matching methods bypass the limiter entirely.
   * Useful for exempting read-only GET endpoints from write-oriented tiers.
   *
   * @example methods: ['POST'] — only rate-limit mutations, not session reads
   */
  methods?: ReadonlyArray<string>;
}

/**
 * Creates a Hono rate limiting middleware for the specified tier.
 * Sets standard rate limit headers on all responses and returns 429 on breach.
 *
 * @example
 * // Global IP-based protection
 * app.use('/api/*', rateLimitMiddleware({ tier: 'global', by: 'ip' }))
 *
 * // User-scoped API rate limit (falls back to IP for anonymous requests)
 * app.use('/api/v1/*', rateLimitMiddleware({ tier: 'api' }))
 *
 * // Inline in handler tuple for sensitive operations
 * honoFactory.createHandlers(rateLimitMiddleware({ tier: 'sensitive' }), authMiddleware, handler)
 *
 * // Auth tier on POST only — exempts GET /get-session from brute-force limits
 * app.use('*', rateLimitMiddleware({ tier: 'auth', by: 'ip', methods: ['POST'] }))
 */
export function rateLimitMiddleware(
  options: RateLimitMiddlewareOptions,
): MiddlewareHandler<AppEnv> {
  const { tier, by = "user", methods } = options;
  const methodFilter = methods
    ? new Set(methods.map((m) => m.toUpperCase()))
    : null;

  return async (c, next) => {
    if (methodFilter && !methodFilter.has(c.req.method)) {
      return next();
    }

    const identifier = resolveIdentifier(c, by);
    const limiter = getRateLimiter(tier);
    const result = await limiter.limit(identifier);

    // Always expose rate limit state to clients
    c.header("X-RateLimit-Limit", result.limit.toString());
    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", Math.ceil(result.reset / 1000).toString());

    if (!result.success) {
      const retryAfterSeconds = Math.max(
        Math.ceil((result.reset - Date.now()) / 1000),
        1,
      );

      // Return directly instead of throwing — guarantees headers are included in the 429 response
      return c.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
          code: "rate_limit_exceeded",
        },
        {
          status: HTTP_TOO_MANY_REQUESTS,
          headers: {
            "Retry-After": retryAfterSeconds.toString(),
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
          },
        },
      );
    }

    await next();
  };
}

function resolveIdentifier(
  c: Context<AppEnv>,
  by: NonNullable<RateLimitMiddlewareOptions["by"]>,
): string {
  if (typeof by === "function") return by(c);
  if (by === "ip") return `ip:${getClientIp(c)}`;

  // 'user' strategy: prefer user ID, degrade to IP for anonymous requests
  const user = c.get("user");
  if (user?.id) return `user:${user.id}`;
  return `ip:${getClientIp(c)}`;
}

/**
 * Extracts the real client IP from proxy headers with standard priority.
 * Falls back to 'anonymous' when no IP can be determined.
 */
export function getClientIp(c: Context<AppEnv>): string {
  return (
    // Prioritize trusted headers from reverse proxies (Cloudflare, Vercel, etc.)
    // x-forwarded-for is easily spoofed if not strictly controlled by the edge.
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}
