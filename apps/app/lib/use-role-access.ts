"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ProfileRole } from "./api";
import { useDashboardData } from "./dashboard-data-context";

export function useRoleAccess(allowedRoles: ProfileRole[]) {
  const router = useRouter();
  const { me, isLoading, error, refreshMe } = useDashboardData();
  const role = me?.profile.role;
  const isAllowed = role ? allowedRoles.includes(role) : false;

  useEffect(() => {
    if (!isLoading && me && !isAllowed) {
      router.replace("/dashboard/account");
    }
  }, [isAllowed, isLoading, me, router]);

  return {
    me,
    isLoading,
    error,
    refreshMe,
    isAllowed,
  };
}
