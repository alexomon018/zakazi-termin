import type { RouterOutputs } from "@salonko/trpc";

/**
 * Matches the actual TRPC output type of `user.me` (nullable).
 * Use `AuthenticatedUser` only in places where a non-null user is guaranteed.
 */
export type User = RouterOutputs["user"]["me"];

export type AuthenticatedUser = NonNullable<User>;

export type Timezone = {
  value: string;
  label: string;
};
