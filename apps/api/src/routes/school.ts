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
  const shouldMarkUnderReview = c.req.query("markUnderReview") === "true";
  const request = await prisma.recognitionRequest.findFirst({
    where: {
      id: c.req.param("id"),
      schoolId: school!.id,
    },
    include: requestInclude,
  });

  ensureFound(request, "Recognition request not found");

  if (
    shouldMarkUnderReview &&
    (request.status === RecognitionRequestStatus.SUBMITTED ||
      request.status === RecognitionRequestStatus.AI_READY)
  ) {
    await prisma.recognitionRequest.update({
      where: { id: request.id },
      data: {
        status: RecognitionRequestStatus.UNDER_REVIEW,
      },
    });

    const updatedRequest = await prisma.recognitionRequest.findUnique({
      where: { id: request.id },
      include: requestInclude,
    });
    ensureFound(updatedRequest, "Recognition request not found");

    return c.json({
      request: serializeRequest(updatedRequest),
    });
  }

  return c.json({
    request: serializeRequest(request),
  });
});

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

export { schoolRoutes };
