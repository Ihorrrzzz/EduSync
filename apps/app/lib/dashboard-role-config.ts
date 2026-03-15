import type { ProfileRole } from "./api";

const dashboardHomePathByRole: Record<ProfileRole, string> = {
  parent: "/dashboard/account",
  club: "/dashboard/account",
  school: "/dashboard/account",
};

export function getDashboardHomePath(role: ProfileRole) {
  return dashboardHomePathByRole[role];
}

export function getDashboardDemoPath(role: ProfileRole) {
  return `/dashboard?guest=${role}`;
}
