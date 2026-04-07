import { trpc } from "@/lib/trpc";

export function useMe() {
  return trpc.user.me.useQuery(undefined, { retry: false });
}
