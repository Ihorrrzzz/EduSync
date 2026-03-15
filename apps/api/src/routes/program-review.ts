import { ProgramReviewStatus, UserRole } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { ensureClubActor, ensureSchoolActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { compareProgramWithModelPlan } from "../lib/program-comparison.js";
import { serializeProgramReview } from "../lib/serializers.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import { ensureFound, parseBody, requireRole } from "./utils.js";

const programReviewRoutes = new Hono<AuthBindings>();

const createReviewSchema = z.object({
  clubProgramId: z.string().trim().min(1).max(120),
  schoolId: z.string().trim().min(1).max(120),
});

const reviewDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "RETURN"]),
  comment: z.string().trim().max(1200).optional().nullable(),
});

const reviewInclude = {
  club: true,
  clubProgram: true,
  school: true,
} as const;

programReviewRoutes.use("*", authMiddleware);
programReviewRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

programReviewRoutes.post("/program-reviews", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);

  const body = await parseBody(c, createReviewSchema);

  const program = await prisma.clubProgram.findFirst({
    where: { id: body.clubProgramId, clubId: club!.id },
  });
  ensureFound(program, "Program not found");

  const school = await prisma.school.findUnique({
    where: { id: body.schoolId },
  });
  ensureFound(school, "School not found");

  const existing = await prisma.programReviewRequest.findUnique({
    where: {
      clubProgramId_schoolId: {
        clubProgramId: program.id,
        schoolId: school.id,
      },
    },
  });

  if (existing) {
    return c.json(
      { error: "A review request for this program and school already exists" },
      409,
    );
  }

  const review = await prisma.programReviewRequest.create({
    data: {
      clubId: club!.id,
      clubProgramId: program.id,
      schoolId: school.id,
    },
    include: reviewInclude,
  });

  // Trigger AI comparison asynchronously - don't block the response
  const fullProgram = await prisma.clubProgram.findUnique({
    where: { id: program.id },
  });

  const modelPlan = await prisma.schoolModelPlan.findUnique({
    where: {
      schoolId_subjectArea: {
        schoolId: school.id,
        subjectArea: program.subjectArea,
      },
    },
  });

  if (fullProgram && modelPlan) {
    compareProgramWithModelPlan({
      clubProgramTitle: fullProgram.title,
      clubProgramSubject: fullProgram.subjectArea,
      clubProgramFileUrl: fullProgram.programFileUrl,
      clubProgramDescription: fullProgram.fullDescription,
      clubProgramModules: Array.isArray(fullProgram.modules)
        ? (fullProgram.modules as string[])
        : [],
      clubProgramOutcomes: Array.isArray(fullProgram.learningOutcomes)
        ? (fullProgram.learningOutcomes as string[])
        : [],
      clubProgramEvaluation: fullProgram.evaluationMethod,
      modelPlanTitle: modelPlan.title,
      modelPlanFileUrl: modelPlan.fileUrl,
    })
      .then(async (result) => {
        await prisma.programReviewRequest.update({
          where: { id: review.id },
          data: {
            aiVerdict: result.verdict,
            aiCoveragePercent: result.coveragePercent,
            aiReportJson: JSON.parse(JSON.stringify(result)),
          },
        });
      })
      .catch((err) => {
        console.error("AI comparison failed for review", review.id, err);
      });
  }

  return c.json({ review: serializeProgramReview(review) }, 201);
});

programReviewRoutes.get("/program-reviews", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);

  const reviews = await prisma.programReviewRequest.findMany({
    where: { clubId: club!.id },
    include: reviewInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    reviews: reviews.map((r) => serializeProgramReview(r)),
  });
});

programReviewRoutes.get("/school/program-reviews", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);

  const reviews = await prisma.programReviewRequest.findMany({
    where: { schoolId: school!.id },
    include: reviewInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    reviews: reviews.map((r) => serializeProgramReview(r)),
  });
});

const DECIDABLE_REVIEW_STATUSES: ReadonlySet<ProgramReviewStatus> = new Set([
  ProgramReviewStatus.PENDING,
  ProgramReviewStatus.RETURNED,
]);

programReviewRoutes.post("/school/program-reviews/:id/decision", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const body = await parseBody(c, reviewDecisionSchema);

  const review = await prisma.programReviewRequest.findFirst({
    where: {
      id: c.req.param("id"),
      schoolId: school!.id,
    },
  });

  ensureFound(review, "Program review request not found");

  if (!DECIDABLE_REVIEW_STATUSES.has(review.status)) {
    return c.json(
      { error: `Cannot decide on a review with status "${review.status}"` },
      409,
    );
  }

  const nextStatus =
    body.decision === "APPROVE"
      ? ProgramReviewStatus.APPROVED
      : body.decision === "RETURN"
        ? ProgramReviewStatus.RETURNED
        : ProgramReviewStatus.REJECTED;

  const updated = await prisma.programReviewRequest.update({
    where: { id: review.id },
    data: {
      status: nextStatus,
      schoolComment: body.comment?.trim() || null,
    },
    include: reviewInclude,
  });

  return c.json({ review: serializeProgramReview(updated) });
});

export { programReviewRoutes };
