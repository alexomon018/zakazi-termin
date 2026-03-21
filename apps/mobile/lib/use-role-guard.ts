import { router } from "expo-router";
import { useEffect } from "react";
import { useMe } from "./use-me";

type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";

/**
 * Guards a screen behind specific membership roles.
 * Redirects unauthorized users once the membership data is loaded.
 */
export function useRoleGuard({
  allowedRoles,
  redirectTo = "/(tabs)/settings",
}: {
  allowedRoles: MembershipRole[];
  redirectTo?: string;
}) {
  const meQuery = useMe();
  const role = meQuery.data?.membership?.role as MembershipRole | undefined;
  const isLoading = meQuery.isLoading;
  const isAuthorized = !!role && allowedRoles.includes(role);

  useEffect(() => {
    if (meQuery.isSuccess && !isAuthorized) {
      router.replace(redirectTo as never);
    }
  }, [meQuery.isSuccess, isAuthorized, redirectTo]);

  return { isAuthorized, isLoading, role };
}
