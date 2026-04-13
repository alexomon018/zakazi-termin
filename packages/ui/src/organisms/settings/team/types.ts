import type { RouterOutputs } from "@salonko/trpc";

export type Organization = RouterOutputs["organization"]["get"];
export type Member = RouterOutputs["team"]["listMembers"][number];
export type Invite = RouterOutputs["team"]["listInvites"][number];
export type User = RouterOutputs["user"]["me"];
