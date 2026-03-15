/**
 * Parent routes: children CRUD and recognition request submission.
 * Parents create children profiles and then submit recognition requests
 * on their behalf to specific schools.
 */
import { RecognitionRequestStatus, RecognitionScope, UserRole } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { ensureParentActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { generateRecommendationBand } from "../lib/recommendation-band.js";
import {
  serializeChild,
  serializeRequest,
} from "../lib/serializers.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import {
  ensureFound,
  normalizeOptionalString,
  parseBody,
  requireRole,
  toJsonInput,
} from "./utils.js";

const parentRoutes = new Hono<AuthBindings>();

const childSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  age: z.number().int().min(4).max(19),
  grade: z.number().int().min(1).max(12),
  schoolId: z.string().trim().min(1).max(120).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const createRequestSchema = z.object({
  childId: z.string().trim().min(1).max(120),
  schoolId: z.string().trim().min(1).max(120),
  clubProgramId: z.string().trim().min(1).max(120),
  targetSubject: z.string().trim().min(2).max(120),
  targetGrade: z.number().int().min(1).max(12),
  recognitionScope: z.nativeEnum(RecognitionScope),
  parentNote: z.string().trim().max(1000).optional().nullable(),
});

const requestInclude = {
  child: {
    include: {
      school: true,
    },
  },
  school: true,
  club: true,
  clubProgram: {
    include: {
      club: true,
    },
  },
  aiAnalysis: true,
  decision: true,
} as const;

parentRoutes.use("*", authMiddleware);
parentRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

parentRoutes.get("/children", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const children = await prisma.child.findMany({
    where: { parentProfileId: parentProfile!.id },
    include: {
      school: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    children: children.map((child) => serializeChild(child)),
  });
});

parentRoutes.post("/children", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const body = await parseBody(c, childSchema);
  const normalizedSchoolId = normalizeOptionalString(body.schoolId ?? null);
  const school = normalizedSchoolId
    ? await prisma.school.findUnique({
        where: { id: normalizedSchoolId },
      })
    : null;

  if (normalizedSchoolId && !school) {
    throw new HTTPException(404, { message: "School not found" });
  }

  const child = await prisma.child.create({
    data: {
      parentProfileId: parentProfile!.id,
      fullName: body.fullName.trim(),
      age: body.age,
      grade: body.grade,
      schoolId: school?.id ?? null,
      schoolNameSnapshot: school?.name ?? null, // Denormalized copy so the school name is preserved even if the school record changes
      notes: normalizeOptionalString(body.notes ?? null),
    },
    include: {
      school: true,
    },
  });

  return c.json({ child: serializeChild(child) }, 201);
});

parentRoutes.patch("/children/:id", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const body = await parseBody(c, childSchema);
  const child = await prisma.child.findFirst({
    where: {
      id: c.req.param("id"),
      parentProfileId: parentProfile!.id,
    },
  });

  ensureFound(child, "Child not found");

  const normalizedSchoolId = normalizeOptionalString(body.schoolId ?? null);
  const school = normalizedSchoolId
    ? await prisma.school.findUnique({
        where: { id: normalizedSchoolId },
      })
    : null;

  if (normalizedSchoolId && !school) {
    throw new HTTPException(404, { message: "School not found" });
  }

  const updatedChild = await prisma.child.update({
    where: { id: child.id },
    data: {
      fullName: body.fullName.trim(),
      age: body.age,
      grade: body.grade,
      schoolId: school?.id ?? null,
      schoolNameSnapshot: school?.name ?? null,
      notes: normalizeOptionalString(body.notes ?? null),
    },
    include: {
      school: true,
    },
  });

  return c.json({ child: serializeChild(updatedChild) });
});

parentRoutes.delete("/children/:id", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const child = await prisma.child.findFirst({
    where: {
      id: c.req.param("id"),
      parentProfileId: parentProfile!.id,
    },
    select: {
      id: true,
      _count: {
        select: {
          recognitionRequests: true,
        },
      },
    },
  });

  ensureFound(child, "Child not found");

  if (child._count.recognitionRequests > 0) {
    return c.json(
      {
        error:
          "Cannot delete a child that already has recognition requests. Remove the requests first.",
      },
      409,
    );
  }

  await prisma.child.delete({
    where: { id: child.id },
  });

  return c.json({ ok: true });
});

parentRoutes.get("/requests", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const requests = await prisma.recognitionRequest.findMany({
    where: {
      parentProfileId: parentProfile!.id,
    },
    include: requestInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    requests: requests.map((request) => serializeRequest(request)),
  });
});

parentRoutes.post("/requests", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const body = await parseBody(c, createRequestSchema);
  const child = await prisma.child.findFirst({
    where: {
      id: body.childId,
      parentProfileId: parentProfile!.id,
    },
  });

  ensureFound(child, "Child not found");

  const school = await prisma.school.findUnique({
    where: { id: body.schoolId },
  });

  ensureFound(school, "School not found");

  const program = await prisma.clubProgram.findFirst({
    where: {
      id: body.clubProgramId,
      isPublished: true,
    },
    include: {
      club: true,
    },
  });

  ensureFound(program, "Program not found");

  // Allow resubmission only if the previous request was REJECTED or CHANGES_REQUESTED;
  // all other statuses indicate an active request that shouldn't be duplicated
  const existingRequest = await prisma.recognitionRequest.findFirst({
    where: {
      parentProfileId: parentProfile!.id,
      childId: child.id,
      schoolId: school.id,
      clubProgramId: program.id,
      status: {
        notIn: [
          RecognitionRequestStatus.REJECTED,
          RecognitionRequestStatus.CHANGES_REQUESTED,
        ],
      },
    },
    select: { id: true },
  });

  if (existingRequest) {
    throw new HTTPException(409, {
      message: "A recognition request for this child, school, and program already exists",
    });
  }

  const request = await prisma.recognitionRequest.create({
    data: {
      parentProfileId: parentProfile!.id,
      childId: child.id,
      schoolId: school.id,
      clubId: program.clubId,
      clubProgramId: program.id,
      targetSubject: body.targetSubject.trim(),
      targetGrade: body.targetGrade,
      recognitionScope: body.recognitionScope,
      parentNote: normalizeOptionalString(body.parentNote ?? null),
      status: RecognitionRequestStatus.SUBMITTED,
    },
  });

  const analysis = await generateRecommendationBand({
    programTitle: program.title,
    subjectArea: program.subjectArea,
    shortDescription: program.shortDescription,
    fullDescription: program.fullDescription,
    modules: Array.isArray(program.modules)
      ? program.modules.filter((value): value is string => typeof value === "string")
      : [],
    learningOutcomes: Array.isArray(program.learningOutcomes)
      ? program.learningOutcomes.filter((value): value is string => typeof value === "string")
      : [],
    evaluationMethod: program.evaluationMethod,
    reportFormatSummary: program.reportFormatSummary,
    targetSubject: body.targetSubject.trim(),
    targetGrade: body.targetGrade,
    recognitionScope: body.recognitionScope,
    ageMin: program.ageMin,
    ageMax: program.ageMax,
    gradeMin: program.gradeMin,
    gradeMax: program.gradeMax,
  });

  await prisma.$transaction([
    prisma.recognitionAiAnalysis.upsert({
      where: {
        requestId: request.id,
      },
      update: {
        provider: analysis.provider,
        modelName: analysis.modelName,
        compatibilityScore: analysis.compatibilityScore,
        recommendationBand: analysis.recommendationBand,
        recommendedSchoolAction: analysis.recommendedSchoolAction,
        confidence: analysis.confidence,
        summary: analysis.summary,
        matchedOutcomes: analysis.matchedOutcomes,
        gaps: analysis.gaps,
        suggestedEvidence: analysis.suggestedEvidence,
        safeBandExplanation: analysis.safeBandExplanation,
        rawResponse: toJsonInput(analysis.rawResponse),
      },
      create: {
        requestId: request.id,
        provider: analysis.provider,
        modelName: analysis.modelName,
        compatibilityScore: analysis.compatibilityScore,
        recommendationBand: analysis.recommendationBand,
        recommendedSchoolAction: analysis.recommendedSchoolAction,
        confidence: analysis.confidence,
        summary: analysis.summary,
        matchedOutcomes: analysis.matchedOutcomes,
        gaps: analysis.gaps,
        suggestedEvidence: analysis.suggestedEvidence,
        safeBandExplanation: analysis.safeBandExplanation,
        rawResponse: toJsonInput(analysis.rawResponse),
      },
    }),
    prisma.recognitionRequest.update({
      where: { id: request.id },
      data: {
        status: RecognitionRequestStatus.AI_READY,
      },
    }),
  ]);

  const fullRequest = await prisma.recognitionRequest.findUnique({
    where: { id: request.id },
    include: requestInclude,
  });
  ensureFound(fullRequest, "Recognition request not found");

  return c.json({ request: serializeRequest(fullRequest) }, 201);
});

parentRoutes.get("/requests/:id", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      parentProfileId: parentProfile!.id,
    },
    include: requestInclude,
  });

  ensureFound(request, "Recognition request not found");

  return c.json({
    request: serializeRequest(request),
  });
});

export { parentRoutes };
