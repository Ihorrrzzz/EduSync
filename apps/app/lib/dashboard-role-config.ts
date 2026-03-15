import type { ProfileRole } from "./api";

const dashboardHomePathByRole: Record<ProfileRole, string> = {
  parent: "/dashboard/children",
  club: "/dashboard/programs",
  school: "/dashboard/review",
};

export function getDashboardHomePath(role: ProfileRole) {
  return dashboardHomePathByRole[role];
}

export function getDashboardDemoPath(role: ProfileRole) {
  return `/dashboard?guest=${role}`;
}
