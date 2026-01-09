import { logger } from "@salonko/config";
import { emailService } from "@salonko/emails";
import { prisma } from "@salonko/prisma";
import { Redis } from "@upstash/redis";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { SalonkoAdapter } from "./adapter";
import { ErrorCode } from "./error-codes";
import { verifyPassword } from "./password";

// =============================================================================
// Redis-based subscription cache for multi-instance consistency
// TTL: 300 seconds (5 minutes) - balances accuracy with performance
// Falls back to database query if Redis is unavailable
// =============================================================================

const SUBSCRIPTION_CACHE_TTL_SECONDS = 300; // 5 minutes
const SUBSCRIPTION_CACHE_KEY_PREFIX = "subscription:status:";

// Initialize Redis client from environment variables (Upstash)
// Returns null if environment variables are not configured (development mode)
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = Redis.fromEnv();
}

/**
 * Get cached subscription status from Redis
 * @returns The cached status, or undefined if not cached / Redis unavailable
 */
async function getCachedSubscriptionStatus(userId: string): Promise<string | null | undefined> {
  if (!redis) {
    return undefined; // Redis not configured, skip cache
  }

  try {
    const key = `${SUBSCRIPTION_CACHE_KEY_PREFIX}${userId}`;
    const cached = await redis.get<string | null>(key);
    // Redis returns null for non-existent keys, but we use undefined to mean "not cached"
    // We store "null" as a string to distinguish "no subscription" from "not cached"
    if (cached === null) {
      return undefined; // Key doesn't exist
    }
    // Handle the special case where we cached "null" as a string
    if (cached === "NULL_STATUS") {
      return null;
    }
    return cached;
  } catch (error) {
    logger.warn("Redis cache read failed, will query database", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined; // Fallback to database on error
  }
}

/**
 * Set subscription status in Redis cache with TTL
 */
async function setCachedSubscriptionStatus(userId: string, status: string | null): Promise<void> {
  if (!redis) {
    return; // Redis not configured, skip cache
  }

  try {
    const key = `${SUBSCRIPTION_CACHE_KEY_PREFIX}${userId}`;
    // Store "NULL_STATUS" string to represent null (distinguishes from missing key)
    const valueToStore = status === null ? "NULL_STATUS" : status;
    await redis.set(key, valueToStore, { ex: SUBSCRIPTION_CACHE_TTL_SECONDS });
  } catch (error) {
    // Log but don't block the request - caching is best-effort
    logger.warn("Redis cache write failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Invalidate subscription cache for a user
 * Call this from webhook handlers when subscription status changes
 */
export async function invalidateSubscriptionCache(userId: string): Promise<void> {
  if (!redis) {
    return; // Redis not configured, nothing to invalidate
  }

  try {
    const key = `${SUBSCRIPTION_CACHE_KEY_PREFIX}${userId}`;
    await redis.del(key);
    logger.info("Subscription cache invalidated", { userId });
  } catch (error) {
    // Log but don't throw - invalidation failure shouldn't break the webhook
    logger.warn("Failed to invalidate subscription cache", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      salonName?: string | null;
      image?: string | null;
      locale: string;
      timeZone: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    locale?: string;
    timeZone?: string;
    identityProvider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    locale: string;
    timeZone: string;
    subscriptionStatus?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: SalonkoAdapter(prisma),
  session: {
    strategy: "jwt",
    // Shorter JWT lifetime reduces the impact of token leakage and limits stale auth state.
    // Subscription access is enforced server-side (DB-backed) for protected routes.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email i Lozinka",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
        autoLoginToken: { label: "Auto Login Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error(ErrorCode.InvalidCredentials);
        }

        const email = credentials.email.toLowerCase();
        const autoLoginToken = credentials.autoLoginToken;

        // Auto-login flow: validate one-time token after email verification
        if (autoLoginToken) {
          // Use transaction to atomically validate and clear token (prevents race condition)
          const user = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
              where: { email },
            });

            if (!user) {
              throw new Error(ErrorCode.IncorrectEmailPassword);
            }

            const now = new Date();

            // Validate the auto-login token
            if (
              !user.autoLoginToken ||
              user.autoLoginToken !== autoLoginToken ||
              !user.autoLoginTokenExpires ||
              user.autoLoginTokenExpires < now
            ) {
              // Log failed attempt for security monitoring
              logger.warn("Auto-login token validation failed", {
                email,
                hasToken: !!user.autoLoginToken,
                expired: user.autoLoginTokenExpires ? user.autoLoginTokenExpires < now : null,
              });
              throw new Error(ErrorCode.InvalidCredentials);
            }

            // Token is valid - clear it atomically (one-time use)
            const updatedUser = await tx.user.update({
              where: { id: user.id },
              data: {
                autoLoginToken: null,
                autoLoginTokenExpires: null,
              },
            });

            return updatedUser;
          });

          // Send welcome email AFTER successful OTP verification + successful sign-in.
          // This guarantees the welcome email doesn't go out just because OTP was issued,
          // and also avoids sending it if auto-login fails.
          try {
            await emailService.sendWelcomeEmail({
              userName: user.name || "Korisnik",
              userEmail: user.email,
              salonName: user.salonName || "",
            });
          } catch (error) {
            logger.error("Failed to send welcome email after auto-login", {
              error,
              email,
              userId: user.id,
            });
            // Don't block sign-in if email fails
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            salonName: user.salonName,
            locale: user.locale,
            timeZone: user.timeZone,
          };
        }

        // Standard password-based login flow
        if (!credentials.password) {
          throw new Error(ErrorCode.InvalidCredentials);
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { password: true },
        });

        if (!user) {
          throw new Error(ErrorCode.IncorrectEmailPassword);
        }

        // Check if user signed up with OAuth
        if (user.identityProvider !== "EMAIL" || !user.password?.hash) {
          throw new Error(ErrorCode.WrongProvider);
        }

        const isValid = await verifyPassword(credentials.password, user.password.hash);

        if (!isValid) {
          throw new Error(ErrorCode.IncorrectEmailPassword);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          salonName: user.salonName,
          locale: user.locale,
          timeZone: user.timeZone,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // On session update
      if (trigger === "update" && session) {
        return {
          ...token,
          name: session.name ?? token.name,
          salonName: session.salonName ?? token.salonName,
          locale: session.locale ?? token.locale,
        };
      }

      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name;
        token.salonName = user.salonName;
        token.locale = user.locale ?? "sr";
        token.timeZone = user.timeZone ?? "Europe/Belgrade";
      }

      // OAuth sign in - fetch additional user data
      if (account?.type === "oauth" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.salonName = dbUser.salonName;
          token.locale = dbUser.locale;
          token.timeZone = dbUser.timeZone;
        }
      }

      // Add subscription status to token (cached in Redis to reduce database queries)
      // Cache TTL: 5 minutes - balances real-time trial expiry checks with performance
      // Redis provides multi-instance consistency and webhook invalidation support
      if (token.id) {
        // Check Redis cache first (returns undefined if not cached or Redis unavailable)
        const cachedStatus = await getCachedSubscriptionStatus(token.id);
        if (cachedStatus !== undefined) {
          token.subscriptionStatus = cachedStatus;
        } else {
          // Cache miss or Redis unavailable - query database
          const subscription = await prisma.subscription.findUnique({
            where: { userId: token.id },
            select: { status: true, trialEndsAt: true },
          });

          let finalStatus: string | null;
          if (subscription) {
            // Check if trial has expired (real-time check for accuracy)
            const now = new Date();
            if (
              subscription.status === "TRIALING" &&
              subscription.trialEndsAt &&
              now > subscription.trialEndsAt
            ) {
              finalStatus = "EXPIRED";
            } else {
              finalStatus = subscription.status;
            }
          } else {
            finalStatus = null;
          }

          // Cache the result in Redis (best-effort, won't block on failure)
          await setCachedSubscriptionStatus(token.id, finalStatus);
          token.subscriptionStatus = finalStatus;
        }
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          email: token.email,
          name: token.name,
          salonName: token.salonName,
          locale: token.locale,
          timeZone: token.timeZone,
        },
      };
    },

    async signIn({ user, account, profile }) {
      // Credentials provider - already validated in authorize
      if (account?.type === "credentials") {
        return true;
      }

      // OAuth provider (Google)
      if (account?.type === "oauth") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        // Check for existing user
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          // Update identity provider if switching from EMAIL to GOOGLE
          if (existingUser.identityProvider === "EMAIL") {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                identityProvider: "GOOGLE",
                identityProviderId: account.providerAccountId,
                emailVerified: new Date(),
                avatarUrl: user.image ?? existingUser.avatarUrl,
              },
            });
          }
          return true;
        }

        // Create new user with Google
        const salonName = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        const generatedSalonName = await generateUniqueSalonName(salonName);

        await prisma.user.create({
          data: {
            email,
            name: user.name,
            salonName: generatedSalonName,
            avatarUrl: user.image,
            emailVerified: new Date(),
            identityProvider: "GOOGLE",
            identityProviderId: account.providerAccountId,
          },
        });

        // Send welcome email to new user
        try {
          await emailService.sendWelcomeEmail({
            userName: user.name || "Korisnik",
            userEmail: email,
            salonName: generatedSalonName,
          });
        } catch (error) {
          logger.error("Failed to send welcome email", { error, email });
          // Don't block sign-in if email fails
        }

        return true;
      }

      return false;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows same-domain URLs
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};

const MAX_SALON_NAME_ATTEMPTS = 100;

async function generateUniqueSalonName(base: string): Promise<string> {
  const salonName = base.slice(0, 20);
  let counter = 0;

  while (counter < MAX_SALON_NAME_ATTEMPTS) {
    const candidate = counter === 0 ? salonName : `${salonName}${counter}`;
    const existing = await prisma.user.findUnique({
      where: { salonName: candidate },
    });
    if (!existing) return candidate;
    counter++;
  }

  // Fallback: append random string if too many attempts
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${salonName.slice(0, 14)}${randomSuffix}`;
}
