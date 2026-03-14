import type { UserRole } from "@prisma/client";
import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../lib/tokens.js";

export type AuthenticatedUser = {
  profileId: string;
  role: UserRole;
  email: string;
  fullName: string | null;
};

export type AuthBindings = {
  Variables: {
    user: AuthenticatedUser;
  };
};

export const authMiddleware: MiddlewareHandler<AuthBindings> = async (
  c,
  next,
) => {
  const authorizationHeader = c.req.header("Authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    const payload = await verifyAccessToken(token);

    c.set("user", payload);

    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
};
