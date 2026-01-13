import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./routers/_app";

export { appRouter, type AppRouter } from "./routers/_app";
export {
  createTRPCContext,
  createContextInner,
  type Context,
  type Session,
  type CreateInnerContextOptions,
} from "./context";
export {
  t,
  router,
  publicProcedure,
  protectedProcedure,
  createCallerFactory,
} from "./trpc";
export {
  validateSubscriptionData,
  validateStatusTransition,
  assertValidSubscriptionData,
  assertValidStatusTransition,
  type SubscriptionData,
  type ValidationResult,
} from "./lib/subscription-validation";

export { getAppOriginFromHeaders, getAppOriginFromRequest } from "./lib/app-origin";
export { getPlanTierFromPriceId } from "./lib/stripe";

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
