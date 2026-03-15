import type { ProfileRole } from "./api";

export function parseProfileRole(role: string | null): ProfileRole | null {
  if (role === "parent" || role === "school" || role === "club") {
    return role;
  }

  return null;
}
