import type { BetterAuthRateLimitStorage } from "better-auth";
import { redis } from "./client";

/**
 * Bridges better-auth's rate limiter with our Upstash Redis instance.
 * Entries are stored as JSON with a 1-hour TTL for auto-eviction.
 */
export const rateLimitStorage: BetterAuthRateLimitStorage = {
  get: async (key) => {
    return (await redis.get(key)) ?? null;
  },
  set: async (key, value) => {
    await redis.set(key, value, { ex: 3600 });
  },
};
