import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Shared Upstash rate limiting utilities.
 *
 * Notes:
 * - We intentionally reuse a single Redis client and a single in-memory cache Map
 *   to mirror the pattern used in subscription checkout and to keep key prefixes consistent.
 * - In development (or if Upstash isn't configured), we export `null` so callers can allow
 *   requests rather than fail hard.
 */

const UPSTASH_CONFIGURED = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Singletons shared across all rate limiters in this process.
const sharedRedis = UPSTASH_CONFIGURED ? Redis.fromEnv() : null;
const sharedEphemeralCache = new Map<string, number>();

/**
 * Keep this prefix consistent across usages so keys stay grouped in Redis.
 * This matches the existing subscription checkout configuration.
 */
const SHARED_PREFIX = "@salonko/checkout-ratelimit";

export const checkoutRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 checkout sessions per hour
      prefix: SHARED_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

/**
 * Forgot password rate limiters (share the same Redis + prefix as checkout for consistency).
 */
export const forgotPasswordIpRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes per IP
      prefix: SHARED_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

export const forgotPasswordEmailRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 requests per hour per email
      prefix: SHARED_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;
