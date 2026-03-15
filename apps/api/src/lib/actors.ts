/**
 * "Actor" pattern — ensures the role-specific entity (parent / school / club)
 * exists for an authenticated user, auto-creating it if missing.
 */
import { UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "../middleware/auth.js";
import { prisma } from "./prisma.js";

function getFallbackDisplayName(email: string, fallback: string) {
  const emailPrefix = email.split("@")[0]?.trim();

  return emailPrefix && emailPrefix.length > 1 ? emailPrefix : fallback;
}

async function requireProfile(profileId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
    },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  return profile;
}

export async function ensureParentActor(user: AuthenticatedUser) {
  if (user.role !== UserRole.parent) {
    return null;
  }

  const profile = await requireProfile(user.profileId);
  const existingParentProfile = await prisma.parentProfile.findUnique({
    where: { profileId: profile.id },
  });

  if (existingParentProfile) {
    return existingParentProfile;
  }

  return prisma.parentProfile.create({
    data: {
      profileId: profile.id,
      displayName:
        profile.fullName?.trim() ||
        // Ukrainian fallback display name when user hasn't set a real name.
        getFallbackDisplayName(profile.email, "Батьківський профіль"),
    },
  });
}

export async function ensureSchoolActor(user: AuthenticatedUser) {
  if (user.role !== UserRole.school) {
    return null;
  }

  const profile = await requireProfile(user.profileId);

  // Idempotent find-or-create: empty `update` means "just return if exists".
  return prisma.school.upsert({
    where: { profileId: profile.id },
    update: {},
    create: {
      profileId: profile.id,
      name:
        profile.fullName?.trim() ||
        getFallbackDisplayName(profile.email, "Шкільний кабінет"),
    },
  });
}

export async function ensureClubActor(user: AuthenticatedUser) {
  if (user.role !== UserRole.club) {
    return null;
  }

  const profile = await requireProfile(user.profileId);

  // Idempotent find-or-create: empty `update` means "just return if exists".
  return prisma.club.upsert({
    where: { profileId: profile.id },
    update: {},
    create: {
      profileId: profile.id,
      name:
        profile.fullName?.trim() ||
        getFallbackDisplayName(profile.email, "Кабінет гуртка"),
      subjects: [],
    },
  });
}
