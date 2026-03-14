import type { Profile, ProfileRole } from "./api";

export function parseProfileRole(role: string | null): ProfileRole | null {
  if (role === "parent" || role === "school" || role === "club") {
    return role;
  }

  return null;
}

export function createGuestProfile(role: ProfileRole): Profile {
  const labels: Record<ProfileRole, string> = {
    parent: "Гість: Батьківський кабінет",
    school: "Гість: Шкільний кабінет",
    club: "Гість: Кабінет гуртка",
  };

  return {
    id: `guest-${role}`,
    email: "guest@edusync.demo",
    role,
    fullName: labels[role],
  };
}
