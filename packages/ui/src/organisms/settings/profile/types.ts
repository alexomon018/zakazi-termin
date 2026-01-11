import type { RouterOutputs } from "@salonko/trpc";

export type User = NonNullable<RouterOutputs["user"]["me"]>;

export type Timezone = {
  value: string;
  label: string;
};
