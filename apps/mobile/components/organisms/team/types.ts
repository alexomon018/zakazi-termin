import type { RouterOutputs } from "@salonko/trpc";

export type Member = RouterOutputs["team"]["listMembers"][number];
export type Invite = RouterOutputs["team"]["listInvites"][number];
