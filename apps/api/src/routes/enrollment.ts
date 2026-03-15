/**
 * Enrollment routes: parent-to-club enrollment workflow.
 * Parents enroll children in published club programs; clubs approve or reject.
 */
import { EnrollmentStatus, UserRole } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { ensureClubActor, ensureParentActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { serializeEnrollment } from "../lib/serializers.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import { ensureFound, parseBody, requireRole } from "./utils.js";

const enrollmentRoutes = new Hono<AuthBindings>();

const createEnrollmentSchema = z.object({
  childId: z.string().trim().min(1).max(120),
  clubProgramId: z.string().trim().min(1).max(120),
  note: z.string().trim().max(500).optional().nullable(),
});

const enrollmentDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

const enrollmentInclude = {
  child: true,
  parentProfile: {
    include: { profile: true },
  },
  club: true,
  clubProgram: true,
} as const;

enrollmentRoutes.use("*", authMiddleware);
enrollmentRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

enrollmentRoutes.post("/enrollments", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);
  const body = await parseBody(c, createEnrollmentSchema);

  const child = await prisma.child.findFirst({
    where: { id: body.childId, parentProfileId: parentProfile!.id },
  });
  ensureFound(child, "Child not found");

  // Only published programs are enrollable — draft programs are invisible to parents
  const program = await prisma.clubProgram.findFirst({
    where: { id: body.clubProgramId, isPublished: true },
  });
  ensureFound(program, "Program not found");

  // Unique constraint on (childId, clubProgramId) prevents duplicate enrollments
  const existing = await prisma.enrollmentRequest.findUnique({
    where: {
      childId_clubProgramId: {
        childId: child.id,
        clubProgramId: program.id,
      },
    },
  });

  if (existing) {
    throw new HTTPException(409, {
      message: "This child is already enrolled or has a pending request for this program",
    });
  }

  const enrollment = await prisma.enrollmentRequest.create({
    data: {
      childId: child.id,
      parentProfileId: parentProfile!.id,
      clubId: program.clubId,
      clubProgramId: program.id,
      note: body.note?.trim() || null,
    },
    include: enrollmentInclude,
  });

  return c.json({ enrollment: serializeEnrollment(enrollment) }, 201);
});

enrollmentRoutes.get("/enrollments", async (c) => {
  const user = requireRole(c, UserRole.parent);
  const parentProfile = await ensureParentActor(user);

  const enrollments = await prisma.enrollmentRequest.findMany({
    where: { parentProfileId: parentProfile!.id },
    include: enrollmentInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    enrollments: enrollments.map((e) => serializeEnrollment(e)),
  });
});

enrollmentRoutes.get("/club/enrollments", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);

  const enrollments = await prisma.enrollmentRequest.findMany({
    where: { clubId: club!.id },
    include: enrollmentInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  return c.json({
    enrollments: enrollments.map((e) => serializeEnrollment(e)),
  });
});

enrollmentRoutes.post("/club/enrollments/:id/decision", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, enrollmentDecisionSchema);

  const enrollment = await prisma.enrollmentRequest.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
    },
  });

  ensureFound(enrollment, "Enrollment request not found");

  if (enrollment.status !== EnrollmentStatus.PENDING) {
    return c.json(
      { error: `Cannot decide on an enrollment with status "${enrollment.status}"` },
      409,
    );
  }

  const nextStatus =
    body.decision === "APPROVE"
      ? EnrollmentStatus.APPROVED
      : EnrollmentStatus.REJECTED;

  const updated = await prisma.enrollmentRequest.update({
    where: { id: enrollment.id },
    data: { status: nextStatus },
    include: enrollmentInclude,
  });

  return c.json({ enrollment: serializeEnrollment(updated) });
});

export { enrollmentRoutes };
