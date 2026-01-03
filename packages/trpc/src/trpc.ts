import type { Subscription } from "@salonko/prisma";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Protected procedure - requires authenticated user
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Morate biti prijavljeni da biste pristupili ovoj funkciji.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

/**
 * Helper to check if subscription is active or in trial
 */
function isSubscriptionActive(subscription: Subscription | null): boolean {
  if (!subscription) {
    return false;
  }

  // Check if subscription is TRIALING
  if (subscription.status === "TRIALING") {
    const now = new Date();
    const trialEnd = subscription.trialEndsAt;
    // Trial is active if trialEndsAt exists and hasn't passed
    if (trialEnd && now < trialEnd) {
      return true;
    }
    return false;
  }

  // Check if subscription is ACTIVE
  if (subscription.status === "ACTIVE") {
    return true;
  }

  return false;
}

/**
 * Subscription-protected procedure - requires authenticated user with active subscription or trial
 * This extends protectedProcedure to additionally verify subscription status
 */
export const subscriptionProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Get user's subscription
  const subscription = await ctx.prisma.subscription.findUnique({
    where: { userId: ctx.session.user.id },
  });

  // Check if subscription is active or in trial
  if (!isSubscriptionActive(subscription)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Morate imati aktivnu pretplatu ili probni period da biste pristupili ovoj funkciji.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
