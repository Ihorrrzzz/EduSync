import { Prisma, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Context, Hono } from "hono";
import { z } from "zod";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { hashRefreshToken } from "../lib/refresh-tokens.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { createRateLimitMiddleware } from "../middleware/rate-limit.js";

const authRoutes = new Hono();

const SUBJECT_OPTIONS = [
  "Мистецтво",
  "Фізична культура",
  "Інформатика",
  "Математика",
  "Природничі науки",
  "Технології",
] as const;

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const MAX_ACTIVE_REFRESH_TOKENS = 5;
const DUMMY_PASSWORD_HASH =
  "$2b$12$F54/V62C/TUoUwIsE302e.2g/tpCLzSxOuvSA14sbeWIH/bJ35bGq";

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .optional();

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(320)
      .email()
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(72),
    role: z.nativeEnum(UserRole),
    fullName: optionalTrimmedString,
    schoolName: optionalTrimmedString,
    city: optionalTrimmedString,
    subjects: z
      .array(z.enum(SUBJECT_OPTIONS))
      .max(SUBJECT_OPTIONS.length)
      .refine(
        (subjects) => new Set(subjects).size === subjects.length,
        "Subjects must be unique",
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === UserRole.school && !value.schoolName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "School name is required",
        path: ["schoolName"],
      });
    }

    if (value.role === UserRole.club && !value.fullName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Club name is required",
        path: ["fullName"],
      });
    }

    if (
      value.role === UserRole.club &&
      (!value.subjects || value.subjects.length < 1)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one subject is required",
        path: ["subjects"],
      });
    }
  });

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

authRoutes.use(
  "*",
  createRateLimitMiddleware({
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
  }),
);

type SessionProfile = {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
};

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

function getCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict" as const,
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
    expires: expiresAt,
  };
}

function clearRefreshCookie(c: Parameters<typeof deleteCookie>[0]) {
  deleteCookie(c, REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "Strict",
    path: "/api/auth",
  });
}

function formatProfile(profile: SessionProfile) {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.fullName,
  };
}

async function createSession(profile: SessionProfile): Promise<SessionTokens> {
  const accessToken = await signAccessToken({
    profileId: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.fullName,
  });
  const { token: refreshToken, expiresAt } = await signRefreshToken(profile.id);

  return { accessToken, refreshToken, expiresAt };
}

async function persistRefreshToken(
  tx: Prisma.TransactionClient,
  profileId: string,
  session: SessionTokens,
) {
  await tx.refreshToken.deleteMany({
    where: {
      profileId,
      expiresAt: { lte: new Date() },
    },
  });

  await tx.refreshToken.create({
    data: {
      profileId,
      tokenHash: hashRefreshToken(session.refreshToken),
      expiresAt: session.expiresAt,
    },
  });

  const staleSessions = await tx.refreshToken.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    skip: MAX_ACTIVE_REFRESH_TOKENS,
    select: { id: true },
  });

  if (staleSessions.length > 0) {
    await tx.refreshToken.deleteMany({
      where: {
        id: {
          in: staleSessions.map((sessionRecord) => sessionRecord.id),
        },
      },
    });
  }
}

async function readJsonBody(c: Context) {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

authRoutes.post("/register", async (c) => {
  const body = await readJsonBody(c);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request" },
      400,
    );
  }

  const { email, password, role, city, schoolName, subjects, fullName } =
    parsedBody.data;
  const resolvedFullName =
    role === UserRole.school ? schoolName ?? null : fullName ?? null;

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    return c.json({ error: "Email already in use" }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.create({
      data: {
        email,
        passwordHash,
        role,
        fullName: resolvedFullName,
      },
    });

    if (role === UserRole.school) {
      await tx.school.create({
        data: {
          profileId: profile.id,
          name: schoolName!,
          city: city ?? null,
        },
      });
    }

    if (role === UserRole.club) {
      await tx.club.create({
        data: {
          profileId: profile.id,
          name: resolvedFullName!,
          city: city ?? null,
          subjects: subjects ?? [],
        },
      });
    }

    const session = await createSession(profile);
    await persistRefreshToken(tx, profile.id, session);

    return { profile, session };
  });

  setCookie(
    c,
    REFRESH_COOKIE_NAME,
    result.session.refreshToken,
    getCookieOptions(result.session.expiresAt),
  );

  return c.json(
    {
      accessToken: result.session.accessToken,
      profile: formatProfile(result.profile),
    },
    201,
  );
});

authRoutes.post("/login", async (c) => {
  const body = await readJsonBody(c);
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid request" },
      400,
    );
  }

  const profile = await prisma.profile.findUnique({
    where: { email: parsedBody.data.email },
  });

  const isPasswordValid = await bcrypt.compare(
    parsedBody.data.password,
    profile?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!profile || !isPasswordValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const session = await prisma.$transaction(async (tx) => {
    const nextSession = await createSession(profile);
    await persistRefreshToken(tx, profile.id, nextSession);

    return nextSession;
  });

  setCookie(
    c,
    REFRESH_COOKIE_NAME,
    session.refreshToken,
    getCookieOptions(session.expiresAt),
  );

  return c.json({
    accessToken: session.accessToken,
    profile: formatProfile(profile),
  });
});

authRoutes.post("/refresh", async (c) => {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);

  if (!refreshToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { profile: true },
    });

    if (
      !storedToken ||
      storedToken.profileId !== payload.profileId ||
      storedToken.expiresAt <= new Date()
    ) {
      if (storedToken) {
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
      }

      clearRefreshCookie(c);

      return c.json({ error: "Unauthorized" }, 401);
    }

    const nextSession = await prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({
        where: { id: storedToken.id },
      });

      const session = await createSession(storedToken.profile);
      await persistRefreshToken(tx, storedToken.profile.id, session);

      return session;
    });

    setCookie(
      c,
      REFRESH_COOKIE_NAME,
      nextSession.refreshToken,
      getCookieOptions(nextSession.expiresAt),
    );

    return c.json({ accessToken: nextSession.accessToken });
  } catch {
    clearRefreshCookie(c);

    return c.json({ error: "Unauthorized" }, 401);
  }
});

authRoutes.post("/logout", async (c) => {
  const refreshToken = getCookie(c, REFRESH_COOKIE_NAME);

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: hashRefreshToken(refreshToken) },
    });
  }

  clearRefreshCookie(c);

  return c.json({ ok: true });
});

export { authRoutes };
