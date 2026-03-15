import { RecognitionRequestStatus, UserRole } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { ensureClubActor, ensureParentActor, ensureSchoolActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import {
  normalizeOptionalString,
  normalizeStringArray,
  parseBody,
} from "./utils.js";

const meRoutes = new Hono<AuthBindings>();

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  city: z.string().trim().max(120).optional().nullable(),
  subjects: z.array(z.string().trim().min(1).max(120)).max(10).optional(),
});

meRoutes.use("*", authMiddleware);
meRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

meRoutes.get("/", async (c) => {
  const user = c.get("user");
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: user.profileId },
    select: {
      id: true,
      email: true,
      role: true,
      fullName: true,
    },
  });

  if (user.role === UserRole.parent) {
    const parentProfile = await ensureParentActor(user);
    const [childrenCount, activeRequests, approvedRequests, pendingRequests] =
      await Promise.all([
        prisma.child.count({
          where: { parentProfileId: parentProfile!.id },
        }),
        prisma.recognitionRequest.count({
          where: {
            parentProfileId: parentProfile!.id,
            status: {
              in: [
                RecognitionRequestStatus.SUBMITTED,
                RecognitionRequestStatus.AI_READY,
                RecognitionRequestStatus.UNDER_REVIEW,
                RecognitionRequestStatus.CHANGES_REQUESTED,
              ],
            },
          },
        }),
        prisma.recognitionRequest.count({
          where: {
            parentProfileId: parentProfile!.id,
            status: {
              in: [
                RecognitionRequestStatus.APPROVED,
                RecognitionRequestStatus.PARTIALLY_APPROVED,
              ],
            },
          },
        }),
        prisma.recognitionRequest.count({
          where: {
            parentProfileId: parentProfile!.id,
            status: {
              in: [
                RecognitionRequestStatus.SUBMITTED,
                RecognitionRequestStatus.AI_READY,
                RecognitionRequestStatus.UNDER_REVIEW,
              ],
            },
          },
        }),
      ]);

    return c.json({
      profile,
      account: {
        entityId: parentProfile!.id,
        displayName: parentProfile!.displayName,
        city: parentProfile!.city,
        subjects: [],
      },
      summary: {
        childrenCount,
        activeRequests,
        approvedRequests,
        pendingRequests,
      },
    });
  }

  if (user.role === UserRole.club) {
    const club = await ensureClubActor(user);
    const [
      programsCount,
      publishedProgramsCount,
      requestsNeedingEvidenceCount,
      studentsInRequests,
    ] =
      await Promise.all([
        prisma.clubProgram.count({
          where: { clubId: club!.id },
        }),
        prisma.clubProgram.count({
          where: {
            clubId: club!.id,
            isPublished: true,
          },
        }),
        prisma.recognitionRequest.count({
          where: {
            clubId: club!.id,
            clubEvidenceSummary: null,
            status: {
              in: [
                RecognitionRequestStatus.SUBMITTED,
                RecognitionRequestStatus.AI_READY,
                RecognitionRequestStatus.CHANGES_REQUESTED,
              ],
            },
          },
        }),
        prisma.recognitionRequest.findMany({
          where: {
            clubId: club!.id,
          },
          distinct: ["childId"],
          select: {
            childId: true,
          },
        }),
      ]);

    return c.json({
      profile,
      account: {
        entityId: club!.id,
        displayName: club!.name,
        city: club!.city,
        subjects: club!.subjects,
      },
      summary: {
        studentsCount: studentsInRequests.length,
        programsCount,
        publishedProgramsCount,
        requestsNeedingEvidenceCount,
      },
    });
  }

  const school = await ensureSchoolActor(user);
  const [pendingReviews, approvedRequests, attentionRequired] = await Promise.all([
    prisma.recognitionRequest.count({
      where: {
        schoolId: school!.id,
        status: {
          in: [
            RecognitionRequestStatus.SUBMITTED,
            RecognitionRequestStatus.AI_READY,
            RecognitionRequestStatus.UNDER_REVIEW,
          ],
        },
      },
    }),
    prisma.recognitionRequest.count({
      where: {
        schoolId: school!.id,
        status: {
          in: [
            RecognitionRequestStatus.APPROVED,
            RecognitionRequestStatus.PARTIALLY_APPROVED,
          ],
        },
      },
    }),
    prisma.recognitionRequest.count({
      where: {
        schoolId: school!.id,
        status: {
          in: [
            RecognitionRequestStatus.CHANGES_REQUESTED,
            RecognitionRequestStatus.REJECTED,
          ],
        },
      },
    }),
  ]);

  return c.json({
    profile,
    account: {
      entityId: school!.id,
      displayName: school!.name,
      city: school!.city,
      subjects: [],
    },
    summary: {
      pendingReviews,
      approvedRequests,
      attentionRequired,
    },
  });
});

meRoutes.patch("/profile", async (c) => {
  const user = c.get("user");
  const body = await parseBody(c, updateProfileSchema);
  const displayName = body.displayName.trim();
  const city = normalizeOptionalString(body.city ?? null);

  if (user.role !== UserRole.club && body.subjects) {
    return c.json({ error: "Subjects can only be updated for club accounts" }, 400);
  }

  await prisma.profile.update({
    where: { id: user.profileId },
    data: {
      fullName: displayName,
    },
  });

  if (user.role === UserRole.parent) {
    const parentProfile = await ensureParentActor(user);
    const updatedParentProfile = await prisma.parentProfile.update({
      where: { id: parentProfile!.id },
      data: {
        displayName,
        city,
      },
    });

    return c.json({
      account: {
        entityId: updatedParentProfile.id,
        displayName: updatedParentProfile.displayName,
        city: updatedParentProfile.city,
        subjects: [],
      },
    });
  }

  if (user.role === UserRole.club) {
    const club = await ensureClubActor(user);
    const updatedClub = await prisma.club.update({
      where: { id: club!.id },
      data: {
        name: displayName,
        city,
        subjects: normalizeStringArray(body.subjects ?? []),
      },
    });

    return c.json({
      account: {
        entityId: updatedClub.id,
        displayName: updatedClub.name,
        city: updatedClub.city,
        subjects: updatedClub.subjects,
      },
    });
  }

  const school = await ensureSchoolActor(user);
  const updatedSchool = await prisma.school.update({
    where: { id: school!.id },
    data: {
      name: displayName,
      city,
    },
  });

  return c.json({
    account: {
      entityId: updatedSchool.id,
      displayName: updatedSchool.name,
      city: updatedSchool.city,
      subjects: [],
    },
  });
});

export { meRoutes };
