/**
 * Journal routes: student marks/scores management for club enrollments.
 * Clubs record per-student scores against enrolled programs.
 */
import { EnrollmentStatus, UserRole } from "@prisma/client";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { ensureClubActor } from "../lib/actors.js";
import { prisma } from "../lib/prisma.js";
import { serializeJournalEntry } from "../lib/serializers.js";
import { authMiddleware, type AuthBindings } from "../middleware/auth.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import { ensureFound, parseBody, requireRole } from "./utils.js";

const journalRoutes = new Hono<AuthBindings>();

const journalEntrySchema = z.object({
  subject: z.string().trim().min(1).max(120),
  // scoreValue/scoreMax form a fraction (e.g. 85/100); validated server-side that value <= max
  scoreValue: z.number().int().min(0).max(1000),
  scoreMax: z.number().int().min(1).max(1000),
  comment: z.string().trim().max(500).optional().nullable(),
  date: z.string().datetime().optional().nullable(),
});

journalRoutes.use("*", authMiddleware);
journalRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 120,
    windowMs: 15 * 60 * 1000,
  }),
);

journalRoutes.get("/club/enrollments/:id/journal", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);

  // Journal entries are only meaningful for approved enrollments — rejected/pending ones can't have marks
  const enrollment = await prisma.enrollmentRequest.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
      status: EnrollmentStatus.APPROVED,
    },
    include: {
      child: true,
      clubProgram: true,
    },
  });

  ensureFound(enrollment, "Approved enrollment not found");

  const entries = await prisma.journalEntry.findMany({
    where: { enrollmentRequestId: enrollment.id },
    orderBy: [{ date: "desc" }],
  });

  return c.json({
    enrollment: {
      id: enrollment.id,
      child: {
        id: enrollment.child.id,
        fullName: enrollment.child.fullName,
        grade: enrollment.child.grade,
      },
      clubProgram: {
        id: enrollment.clubProgram.id,
        title: enrollment.clubProgram.title,
        subjectArea: enrollment.clubProgram.subjectArea,
      },
    },
    entries: entries.map((e) => serializeJournalEntry(e)),
  });
});

journalRoutes.post("/club/enrollments/:id/journal", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, journalEntrySchema);

  const enrollment = await prisma.enrollmentRequest.findFirst({
    where: {
      id: c.req.param("id"),
      clubId: club!.id,
      status: EnrollmentStatus.APPROVED,
    },
  });

  ensureFound(enrollment, "Approved enrollment not found");

  if (body.scoreValue > body.scoreMax) {
    throw new HTTPException(400, {
      message: "Score value cannot exceed max score",
    });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      enrollmentRequestId: enrollment.id,
      subject: body.subject.trim(),
      scoreValue: body.scoreValue,
      scoreMax: body.scoreMax,
      comment: body.comment?.trim() || null,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  return c.json({ entry: serializeJournalEntry(entry) }, 201);
});

journalRoutes.patch("/club/journal/:entryId", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);
  const body = await parseBody(c, journalEntrySchema);

  const entry = await prisma.journalEntry.findUnique({
    where: { id: c.req.param("entryId") },
    include: {
      enrollmentRequest: true,
    },
  });

  ensureFound(entry, "Journal entry not found");

  if (entry.enrollmentRequest.clubId !== club!.id) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  if (body.scoreValue > body.scoreMax) {
    throw new HTTPException(400, {
      message: "Score value cannot exceed max score",
    });
  }

  const updated = await prisma.journalEntry.update({
    where: { id: entry.id },
    data: {
      subject: body.subject.trim(),
      scoreValue: body.scoreValue,
      scoreMax: body.scoreMax,
      comment: body.comment?.trim() || null,
      date: body.date ? new Date(body.date) : undefined,
    },
  });

  return c.json({ entry: serializeJournalEntry(updated) });
});

journalRoutes.delete("/club/journal/:entryId", async (c) => {
  const user = requireRole(c, UserRole.club);
  const club = await ensureClubActor(user);

  const entry = await prisma.journalEntry.findUnique({
    where: { id: c.req.param("entryId") },
    include: {
      enrollmentRequest: true,
    },
  });

  ensureFound(entry, "Journal entry not found");

  if (entry.enrollmentRequest.clubId !== club!.id) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await prisma.journalEntry.delete({ where: { id: entry.id } });

  return c.json({ ok: true });
});

export { journalRoutes };
