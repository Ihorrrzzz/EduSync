/**
 * School routes: review incoming recognition requests, issue decisions,
 * and manage model plans (reference curricula) per subject area.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  RecognitionRequestStatus,
  SchoolDecision,
  UserRole,
} from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { ensureSchoolActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { serializeRequest } from "../lib/serializers.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import {
  ensureFound,
  normalizeStringArray,
  parseBody,
  requireRole,
  toJsonInput,
} from "./utils.js";

const schoolRoutes = new Hono<AuthBindings>();

const schoolRequestsQuerySchema = z.object({
  status: z.nativeEnum(RecognitionRequestStatus).optional(),
});

const decisionSchema = z.object({
  decision: z.nativeEnum(SchoolDecision),
  comment: z.string().trim().min(5).max(1200),
  recognizedTopics: z.array(z.string().trim().min(1).max(160)).max(10).optional(),
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

schoolRoutes.use("*", authMiddleware);
schoolRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

schoolRoutes.get("/requests", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const parsedQuery = schoolRequestsQuerySchema.safeParse(c.req.query());

  if (!parsedQuery.success) {
    return c.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Invalid query" },
      400,
    );
  }

  const requests = await prisma.recognitionRequest.findMany({
    where: {
      schoolId: school!.id,
      status: parsedQuery.data.status,
    },
    include: requestInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    requests: requests.map((request) => serializeRequest(request)),
  });
});

schoolRoutes.get("/requests/:id", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      schoolId: school!.id,
    },
    include: requestInclude,
  });

  ensureFound(request, "Recognition request not found");

  return c.json({
    request: serializeRequest(request),
  });
});

schoolRoutes.post("/requests/:id/mark-under-review", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      schoolId: school!.id,
    },
    include: requestInclude,
  });

  ensureFound(request, "Recognition request not found");

  if (
    request.status !== RecognitionRequestStatus.SUBMITTED &&
    request.status !== RecognitionRequestStatus.AI_READY
  ) {
    return c.json({ request: serializeRequest(request) });
  }

  const updatedRequest = await prisma.recognitionRequest.update({
    where: { id: request.id },
    data: { status: RecognitionRequestStatus.UNDER_REVIEW },
    include: requestInclude,
  });

  return c.json({ request: serializeRequest(updatedRequest) });
});

// Only allow decisions once AI analysis is complete or manual review has begun —
// prevents premature decisions on requests that haven't been assessed yet
const DECIDABLE_STATUSES: ReadonlySet<RecognitionRequestStatus> = new Set([
  RecognitionRequestStatus.AI_READY,
  RecognitionRequestStatus.UNDER_REVIEW,
]);

schoolRoutes.post("/requests/:id/decision", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const body = await parseBody(c, decisionSchema);
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      schoolId: school!.id,
    },
  });

  ensureFound(request, "Recognition request not found");

  if (!DECIDABLE_STATUSES.has(request.status)) {
    return c.json(
      { error: `Cannot make a decision on a request with status "${request.status}"` },
      409,
    );
  }

  // Map the school's decision type to the corresponding request lifecycle status
  const nextStatus =
    body.decision === SchoolDecision.APPROVE
      ? RecognitionRequestStatus.APPROVED
      : body.decision === SchoolDecision.PARTIAL
        ? RecognitionRequestStatus.PARTIALLY_APPROVED
        : body.decision === SchoolDecision.REQUEST_CHANGES
          ? RecognitionRequestStatus.CHANGES_REQUESTED
          : RecognitionRequestStatus.REJECTED;

  await prisma.$transaction([
    prisma.recognitionDecision.upsert({
      where: {
        requestId: request.id,
      },
      update: {
        schoolId: school!.id,
        decision: body.decision,
        comment: body.comment.trim(),
        recognizedTopics:
          body.recognizedTopics && body.recognizedTopics.length > 0
            ? toJsonInput(normalizeStringArray(body.recognizedTopics))
            : toJsonInput(null),
        decidedAt: new Date(),
      },
      create: {
        requestId: request.id,
        schoolId: school!.id,
        decision: body.decision,
        comment: body.comment.trim(),
        recognizedTopics:
          body.recognizedTopics && body.recognizedTopics.length > 0
            ? toJsonInput(normalizeStringArray(body.recognizedTopics))
            : toJsonInput(null),
        decidedAt: new Date(),
      },
    }),
    prisma.recognitionRequest.update({
      where: {
        id: request.id,
      },
      data: {
        status: nextStatus,
      },
    }),
  ]);

  const updatedRequest = await prisma.recognitionRequest.findUnique({
    where: {
      id: request.id,
    },
    include: requestInclude,
  });
  ensureFound(updatedRequest, "Recognition request not found");

  return c.json({
    request: serializeRequest(updatedRequest),
  });
});

schoolRoutes.get("/model-plans", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const plans = await prisma.schoolModelPlan.findMany({
    where: { schoolId: school!.id },
    orderBy: [{ subjectArea: "asc" }],
  });

  return c.json({ plans });
});

schoolRoutes.post("/model-plans", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const formData = await c.req.formData();
  const file = formData.get("file");
  const title = formData.get("title");
  const subjectArea = formData.get("subjectArea");

  if (!(file instanceof File)) {
    return c.json({ error: "File is required" }, 400);
  }

  if (typeof title !== "string" || title.trim().length < 2) {
    return c.json({ error: "Title is required (min 2 chars)" }, 400);
  }

  if (typeof subjectArea !== "string" || subjectArea.trim().length < 2) {
    return c.json({ error: "Subject area is required" }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return c.json({ error: "File must be under 10 MB" }, 400);
  }

  if (file.type !== "application/pdf") {
    return c.json({ error: "Only PDF files are allowed" }, 400);
  }

  const uploadsDir = join(process.cwd(), "uploads", "model-plans");
  await mkdir(uploadsDir, { recursive: true });

  const fileName = `${randomUUID()}.pdf`;
  const filePath = join(uploadsDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/model-plans/${fileName}`;

  // Upsert: each school has at most one model plan per subject area; uploading again replaces it
  const plan = await prisma.schoolModelPlan.upsert({
    where: {
      schoolId_subjectArea: {
        schoolId: school!.id,
        subjectArea: subjectArea.trim(),
      },
    },
    update: {
      title: title.trim(),
      fileUrl,
    },
    create: {
      schoolId: school!.id,
      subjectArea: subjectArea.trim(),
      title: title.trim(),
      fileUrl,
    },
  });

  return c.json({ plan }, 201);
});

schoolRoutes.delete("/model-plans/:id", async (c) => {
  const user = requireRole(c, UserRole.school);
  const school = await ensureSchoolActor(user);
  const plan = await prisma.schoolModelPlan.findFirst({
    where: {
      id: c.req.param("id"),
      schoolId: school!.id,
    },
  });

  ensureFound(plan, "Model plan not found");

  await prisma.schoolModelPlan.delete({ where: { id: plan.id } });

  return c.json({ ok: true });
});

export { schoolRoutes };
