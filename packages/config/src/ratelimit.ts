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

/** Redis key prefix shared across all rate limiters for consistent grouping. */
const RATE_LIMIT_PREFIX = "@salonko/rate-limit";

export const checkoutRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 checkout sessions per hour
      prefix: RATE_LIMIT_PREFIX,
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
      prefix: RATE_LIMIT_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

export const forgotPasswordEmailRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 requests per hour per email
      prefix: RATE_LIMIT_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

/** Rate limiter for public booking mutations (create, reschedule). */
export const bookingMutationRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 mutations per 15 minutes per IP
      prefix: RATE_LIMIT_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

/** Rate limiter for public booking cancellations (more lenient than create). */
export const bookingCancelRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(10, "15 m"), // 10 cancellations per 15 minutes per IP
      prefix: RATE_LIMIT_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

/** Rate limiter for high-frequency public read endpoints (getSlots). */
export const publicApiRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute per IP
      prefix: RATE_LIMIT_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;

/**
 * Per-messaging-channel rate limiter. Bucket key should be
 * `messaging:<platform>:<externalId>` so one noisy salon cannot exhaust
 * shared agent quotas.
 */
export const messagingChannelRateLimiter: Ratelimit | null = sharedRedis
  ? new Ratelimit({
      redis: sharedRedis,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 inbound messages per minute per channel
      prefix: RATE_LIMIT_PREFIX,
      ephemeralCache: sharedEphemeralCache,
    })
  : null;
