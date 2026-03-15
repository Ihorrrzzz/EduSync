/**
 * Public catalog endpoints — no authentication required.
 * Exposes searchable/filterable lists of schools and published club programs.
 */
import type { Prisma } from "@prisma/client";
import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeProgram } from "../lib/serializers.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";
import { normalizeOptionalString } from "./utils.js";

const catalogRoutes = new Hono();

const schoolCatalogQuerySchema = z.object({
  city: z.string().trim().max(120).optional(),
  search: z.string().trim().max(120).optional(),
});

const programCatalogQuerySchema = z.object({
  city: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(120).optional(),
  age: z.coerce.number().int().min(4).max(19).optional(),
  grade: z.coerce.number().int().min(1).max(12).optional(),
  clubId: z.string().trim().min(1).max(120).optional(),
  search: z.string().trim().max(120).optional(),
});

catalogRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 180,
    windowMs: 15 * 60 * 1000,
  }),
);

catalogRoutes.get("/schools", async (c) => {
  const parsedQuery = schoolCatalogQuerySchema.safeParse(c.req.query());

  if (!parsedQuery.success) {
    return c.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Invalid query" },
      400,
    );
  }

  const city = normalizeOptionalString(parsedQuery.data.city);
  const search = normalizeOptionalString(parsedQuery.data.search);
  const where: Prisma.SchoolWhereInput = {};

  if (city) {
    where.city = {
      contains: city,
      mode: "insensitive",
    };
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        city: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const schools = await prisma.school.findMany({
    where,
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
    },
  });

  return c.json({ schools });
});

catalogRoutes.get("/programs", async (c) => {
  const parsedQuery = programCatalogQuerySchema.safeParse(c.req.query());

  if (!parsedQuery.success) {
    return c.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Invalid query" },
      400,
    );
  }

  const city = normalizeOptionalString(parsedQuery.data.city);
  const subject = normalizeOptionalString(parsedQuery.data.subject);
  const search = normalizeOptionalString(parsedQuery.data.search);
  const where: Prisma.ClubProgramWhereInput = {
    isPublished: true,
  };
  const andFilters: Prisma.ClubProgramWhereInput[] = [];

  if (subject) {
    andFilters.push({
      subjectArea: {
        contains: subject,
        mode: "insensitive",
      },
    });
  }

  if (city) {
    andFilters.push({
      club: {
        city: {
          contains: city,
          mode: "insensitive",
        },
      },
    });
  }

  if (parsedQuery.data.clubId) {
    andFilters.push({
      clubId: parsedQuery.data.clubId,
    });
  }

  // Age/grade filters use OR-with-null so programs without explicit bounds are included
  // (i.e. a null min/max means "no restriction" rather than "excluded from results")
  if (typeof parsedQuery.data.age === "number") {
    andFilters.push({
      AND: [
        {
          OR: [{ ageMin: null }, { ageMin: { lte: parsedQuery.data.age } }],
        },
        {
          OR: [{ ageMax: null }, { ageMax: { gte: parsedQuery.data.age } }],
        },
      ],
    });
  }

  if (typeof parsedQuery.data.grade === "number") {
    andFilters.push({
      AND: [
        {
          OR: [{ gradeMin: null }, { gradeMin: { lte: parsedQuery.data.grade } }],
        },
        {
          OR: [{ gradeMax: null }, { gradeMax: { gte: parsedQuery.data.grade } }],
        },
      ],
    });
  }

  if (search) {
    andFilters.push({
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          shortDescription: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          fullDescription: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          club: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  const programs = await prisma.clubProgram.findMany({
    where,
    include: {
      club: true,
    },
    orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
  });

  return c.json({
    programs: programs.map((program) => serializeProgram(program)),
  });
});

export { catalogRoutes };
