import { RecognitionScope } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { generateRecommendationBand } from "../lib/recommendation-band.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import { normalizeOptionalString, normalizeStringArray, parseBody } from "./utils.js";

const aiRoutes = new Hono<AuthBindings>();

const recommendationBandSchema = z.object({
  programTitle: z.string().trim().min(2).max(160),
  subjectArea: z.string().trim().max(120).optional().nullable(),
  shortDescription: z.string().trim().max(320).optional().nullable(),
  fullDescription: z.string().trim().min(10).max(3000),
  modules: z.array(z.string().trim().min(1).max(180)).max(12).default([]),
  learningOutcomes: z.array(z.string().trim().min(1).max(220)).max(12).default([]),
  evaluationMethod: z.string().trim().min(2).max(800),
  reportFormatSummary: z.string().trim().max(300).optional().nullable(),
  clubEvidenceSummary: z.string().trim().max(1200).optional().nullable(),
  targetSubject: z.string().trim().min(2).max(120),
  targetGrade: z.number().int().min(1).max(12),
  recognitionScope: z.nativeEnum(RecognitionScope),
  ageMin: z.number().int().min(4).max(19).optional().nullable(),
  ageMax: z.number().int().min(4).max(19).optional().nullable(),
  gradeMin: z.number().int().min(1).max(12).optional().nullable(),
  gradeMax: z.number().int().min(1).max(12).optional().nullable(),
});

aiRoutes.use("*", authMiddleware);
aiRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 60,
    windowMs: 15 * 60 * 1000,
  }),
);

aiRoutes.post("/recommendation-band", async (c) => {
  const body = await parseBody(c, recommendationBandSchema);
  const analysis = await generateRecommendationBand({
    programTitle: body.programTitle,
    subjectArea: normalizeOptionalString(body.subjectArea ?? null),
    shortDescription: normalizeOptionalString(body.shortDescription ?? null),
    fullDescription: body.fullDescription,
    modules: normalizeStringArray(body.modules),
    learningOutcomes: normalizeStringArray(body.learningOutcomes),
    evaluationMethod: body.evaluationMethod,
    reportFormatSummary: normalizeOptionalString(body.reportFormatSummary ?? null),
    clubEvidenceSummary: normalizeOptionalString(body.clubEvidenceSummary ?? null),
    targetSubject: body.targetSubject,
    targetGrade: body.targetGrade,
    recognitionScope: body.recognitionScope,
    ageMin: body.ageMin ?? null,
    ageMax: body.ageMax ?? null,
    gradeMin: body.gradeMin ?? null,
    gradeMax: body.gradeMax ?? null,
  });

  return c.json({ analysis });
});

export { aiRoutes };
