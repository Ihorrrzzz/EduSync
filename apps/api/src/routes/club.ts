import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  RecognitionRequestStatus,
  RecognitionScope,
  UserRole,
} from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { ensureClubActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { generateRecommendationBand } from "../lib/recommendation-band.js";
import {
  serializeClubRequest,
  serializeProgram,
} from "../lib/serializers.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import {
  ensureFound,
  normalizeOptionalString,
  normalizeStringArray,
  parseBody,
  requireRole,
  toJsonInput,
} from "./utils.js";

const clubRoutes = new Hono<AuthBindings>();

const programSchema = z
  .object({
    title: z.string().trim().min(2).max(160),
    subjectArea: z.string().trim().min(2).max(120),
    shortDescription: z.string().trim().min(10).max(320),
    fullDescription: z.string().trim().min(20).max(3000),
    ageMin: z.number().int().min(4).max(19).optional().nullable(),
    ageMax: z.number().int().min(4).max(19).optional().nullable(),
    gradeMin: z.number().int().min(1).max(12).optional().nullable(),
    gradeMax: z.number().int().min(1).max(12).optional().nullable(),
    modules: z.array(z.string().trim().min(1).max(180)).min(1).max(12),
    learningOutcomes: z.array(z.string().trim().min(1).max(220)).min(1).max(12),
    evaluationMethod: z.string().trim().min(10).max(800),
    reportFormatSummary: z.string().trim().max(300).optional().nullable(),
    programFileUrl: z.string().trim().max(500).optional().nullable(),
    isPublished: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (
      typeof value.ageMin === "number" &&
      typeof value.ageMax === "number" &&
      value.ageMin > value.ageMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Age range is invalid",
        path: ["ageMax"],
      });
    }

    if (
      typeof value.gradeMin === "number" &&
      typeof value.gradeMax === "number" &&
      value.gradeMin > value.gradeMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Grade range is invalid",
        path: ["gradeMax"],
      });
    }
  });

const quickProgramSchema = z.object({
  title: z.string().trim().min(2).max(160),
  subjectArea: z.string().trim().min(2).max(120),
  audience: z.string().trim().max(200).optional().nullable(),
});

const aiPreviewSchema = z.object({
  targetSubject: z.string().trim().min(2).max(120),
  targetGrade: z.number().int().min(1).max(12),
  recognitionScope: z.nativeEnum(RecognitionScope),
});

const evidenceSchema = z.object({
  clubEvidenceSummary: z.string().trim().min(10).max(1200),
  attendanceRate: z.number().int().min(0).max(100).optional().nullable(),
  externalPerformanceBand: z.string().trim().max(120).optional().nullable(),
});

const clubRequestInclude = {
  child: {
    include: {
      school: true,
    },
  },
  school: true,
  clubProgram: true,
  aiAnalysis: true,
  decision: true,
  parentProfile: {
    include: {
      profile: true,
    },
  },
} as const;

clubRoutes.use("*", authMiddleware);
clubRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

clubRoutes.get("/programs", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const programs = await prisma.clubProgram.findMany({
    where: {
      clubId: club!.id,
    },
    include: {
      club: true,
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    programs: programs.map((program) => serializeProgram(program)),
  });
});

clubRoutes.post("/programs", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, programSchema);
  const program = await prisma.clubProgram.create({
    data: {
      clubId: club!.id,
      title: body.title.trim(),
      subjectArea: body.subjectArea.trim(),
      shortDescription: body.shortDescription.trim(),
      fullDescription: body.fullDescription.trim(),
      ageMin: body.ageMin ?? null,
      ageMax: body.ageMax ?? null,
      gradeMin: body.gradeMin ?? null,
      gradeMax: body.gradeMax ?? null,
      modules: normalizeStringArray(body.modules),
      learningOutcomes: normalizeStringArray(body.learningOutcomes),
      evaluationMethod: body.evaluationMethod.trim(),
      reportFormatSummary: normalizeOptionalString(body.reportFormatSummary ?? null),
      programFileUrl: normalizeOptionalString(body.programFileUrl ?? null),
      isPublished: body.isPublished,
    },
    include: {
      club: true,
    },
  });

  return c.json({ program: serializeProgram(program) }, 201);
});

clubRoutes.post("/programs/quick", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, quickProgramSchema);
  const program = await prisma.clubProgram.create({
    data: {
      clubId: club!.id,
      title: body.title.trim(),
      subjectArea: body.subjectArea.trim(),
      shortDescription: body.title.trim(),
      fullDescription: body.title.trim(),
      audience: body.audience?.trim() || null,
      modules: [],
      learningOutcomes: [],
      evaluationMethod: "Не вказано",
      isPublished: false,
    },
    include: {
      club: true,
    },
  });

  return c.json({ program: serializeProgram(program) }, 201);
});

clubRoutes.patch("/programs/:id", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, programSchema);
  const existingProgram = await prisma.clubProgram.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
  });

  ensureFound(existingProgram, "Program not found");

  const updatedProgram = await prisma.clubProgram.update({
    where: { id: existingProgram.id },
    data: {
      title: body.title.trim(),
      subjectArea: body.subjectArea.trim(),
      shortDescription: body.shortDescription.trim(),
      fullDescription: body.fullDescription.trim(),
      ageMin: body.ageMin ?? null,
      ageMax: body.ageMax ?? null,
      gradeMin: body.gradeMin ?? null,
      gradeMax: body.gradeMax ?? null,
      modules: normalizeStringArray(body.modules),
      learningOutcomes: normalizeStringArray(body.learningOutcomes),
      evaluationMethod: body.evaluationMethod.trim(),
      reportFormatSummary: normalizeOptionalString(body.reportFormatSummary ?? null),
      programFileUrl: normalizeOptionalString(body.programFileUrl ?? null),
      isPublished: body.isPublished,
    },
    include: {
      club: true,
    },
  });

  return c.json({ program: serializeProgram(updatedProgram) });
});

clubRoutes.get("/programs/:id", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const program = await prisma.clubProgram.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
    include: {
      club: true,
    },
  });

  ensureFound(program, "Program not found");

  const requests = await prisma.recognitionRequest.findMany({
    where: {
      clubProgramId: program.id,
    },
    include: clubRequestInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    program: serializeProgram(program),
    requests: requests.map((request) => serializeClubRequest(request)),
  });
});

clubRoutes.post("/programs/:id/ai-preview", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, aiPreviewSchema);
  const program = await prisma.clubProgram.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
  });

  ensureFound(program, "Program not found");

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
    targetSubject: body.targetSubject,
    targetGrade: body.targetGrade,
    recognitionScope: body.recognitionScope,
    ageMin: program.ageMin,
    ageMax: program.ageMax,
    gradeMin: program.gradeMin,
    gradeMax: program.gradeMax,
  });

  return c.json({ analysis });
});

clubRoutes.post("/programs/:id/upload", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const program = await prisma.clubProgram.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
  });

  ensureFound(program, "Program not found");

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new HTTPException(400, { message: "File is required" });
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new HTTPException(400, { message: "File must be under 10 MB" });
  }

  const allowedTypes = ["application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    throw new HTTPException(400, { message: "Only PDF files are allowed" });
  }

  const uploadsDir = join(process.cwd(), "uploads", "programs");
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${randomUUID()}.pdf`;
  const filePath = join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/programs/${fileName}`;
  const updatedProgram = await prisma.clubProgram.update({
    where: { id: program.id },
    data: { programFileUrl: fileUrl },
    include: { club: true },
  });

  return c.json({ program: serializeProgram(updatedProgram) });
});

clubRoutes.delete("/programs/:id", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const program = await prisma.clubProgram.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
    select: {
      id: true,
      _count: {
        select: {
          recognitionRequests: true,
          programReviewRequests: true,
          enrollmentRequests: true,
        },
      },
    },
  });

  ensureFound(program, "Program not found");

  const total =
    program._count.recognitionRequests +
    program._count.programReviewRequests +
    program._count.enrollmentRequests;

  if (total > 0) {
    throw new HTTPException(409, {
      message: "Cannot delete a program that has active requests or enrollments",
    });
  }

  await prisma.clubProgram.delete({ where: { id: program.id } });

  return c.json({ ok: true });
});

clubRoutes.get("/club/requests", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const requests = await prisma.recognitionRequest.findMany({
    where: {
      clubId: club!.id,
    },
    include: clubRequestInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    requests: requests.map((request) => serializeClubRequest(request)),
  });
});

clubRoutes.get("/club/requests/:id", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
    include: clubRequestInclude,
  });

  ensureFound(request, "Recognition request not found");

  return c.json({
    request: serializeClubRequest(request),
  });
});

clubRoutes.post("/requests/:id/evidence", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, evidenceSchema);
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
    include: {
      clubProgram: true,
      aiAnalysis: true,
      child: true,
      parentProfile: true,
      school: true,
      club: true,
    },
  });

  ensureFound(request, "Recognition request not found");

  if (
    request.status === RecognitionRequestStatus.APPROVED ||
    request.status === RecognitionRequestStatus.PARTIALLY_APPROVED ||
    request.status === RecognitionRequestStatus.REJECTED
  ) {
    throw new HTTPException(409, {
      message: "Evidence cannot be changed after the school has closed the request",
    });
  }

  const nextStatus =
    request.status === RecognitionRequestStatus.CHANGES_REQUESTED ||
    request.status === RecognitionRequestStatus.SUBMITTED
      ? RecognitionRequestStatus.AI_READY
      : request.status;

  await prisma.recognitionRequest.update({
    where: {
      id: request.id,
    },
    data: {
      clubEvidenceSummary: body.clubEvidenceSummary.trim(),
      attendanceRate: body.attendanceRate ?? null,
      externalPerformanceBand: normalizeOptionalString(
        body.externalPerformanceBand ?? null,
      ),
      status: nextStatus,
    },
  });

  if (!request.aiAnalysis) {
    const analysis = await generateRecommendationBand({
      programTitle: request.clubProgram.title,
      subjectArea: request.clubProgram.subjectArea,
      shortDescription: request.clubProgram.shortDescription,
      fullDescription: request.clubProgram.fullDescription,
      modules: Array.isArray(request.clubProgram.modules)
        ? request.clubProgram.modules.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      learningOutcomes: Array.isArray(request.clubProgram.learningOutcomes)
        ? request.clubProgram.learningOutcomes.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      evaluationMethod: request.clubProgram.evaluationMethod,
      reportFormatSummary: request.clubProgram.reportFormatSummary,
      clubEvidenceSummary: body.clubEvidenceSummary.trim(),
      targetSubject: request.targetSubject,
      targetGrade: request.targetGrade,
      recognitionScope: request.recognitionScope,
      ageMin: request.clubProgram.ageMin,
      ageMax: request.clubProgram.ageMax,
      gradeMin: request.clubProgram.gradeMin,
      gradeMax: request.clubProgram.gradeMax,
    });

    await prisma.recognitionAiAnalysis.create({
      data: {
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
    });
  }

  const updatedRequest = await prisma.recognitionRequest.findUnique({
    where: {
      id: request.id,
    },
    include: clubRequestInclude,
  });
  ensureFound(updatedRequest, "Recognition request not found");

  return c.json({
    request: serializeClubRequest(updatedRequest),
  });
});

export { clubRoutes };
