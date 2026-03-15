import { Prisma, UserRole } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import type { z } from "zod";
import type { AuthBindings } from "../middleware/auth.js";

export function normalizeOptionalString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function normalizeStringArray(values: string[] | null | undefined) {
  if (!values) {
    return [];
  }

  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function toJsonInput(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);
}

export async function parseBody<T extends z.ZodTypeAny>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  let body: unknown;

  try {
    body = await c.req.json();
  } catch {
    body = null;
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: parsed.error.issues[0]?.message ?? "Invalid request",
    });
  }

  return parsed.data;
}

export function requireRole(
  c: Context<AuthBindings>,
  expectedRole: UserRole,
) {
  const user = c.get("user");

  if (user.role !== expectedRole) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  return user;
}

export function ensureFound<T>(
  value: T | null | undefined,
  message = "Not found",
): asserts value is NonNullable<T> {
  if (value == null) {
    throw new HTTPException(404, { message });
  }
}
