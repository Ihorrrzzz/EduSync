import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

type AccessTokenInput = {
  profileId: string;
  email: string;
  role: UserRole;
  fullName: string | null;
};

const textEncoder = new TextEncoder();
const TOKEN_ISSUER = "edusync-api";
const ACCESS_TOKEN_AUDIENCE = "edusync-app";
const REFRESH_TOKEN_AUDIENCE = "edusync-session";

function getAccessSecret() {
  return textEncoder.encode(env.JWT_SECRET);
}

function getRefreshSecret() {
  return textEncoder.encode(env.JWT_REFRESH_SECRET);
}

export async function signAccessToken(input: AccessTokenInput) {
  return new SignJWT({
    email: input.email,
    role: input.role,
    fullName: input.fullName,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(ACCESS_TOKEN_AUDIENCE)
    .setSubject(input.profileId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessSecret());
}

export async function signRefreshToken(profileId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(TOKEN_ISSUER)
    .setAudience(REFRESH_TOKEN_AUDIENCE)
    .setJti(randomUUID())
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());

  return { token, expiresAt };
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret(), {
    issuer: TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
  });

  const role = payload.role;
  const email = payload.email;
  const type = payload.type;

  if (
    typeof payload.sub !== "string" ||
    typeof email !== "string" ||
    typeof role !== "string" ||
    type !== "access" ||
    !Object.values(UserRole).includes(role as UserRole)
  ) {
    throw new Error("Invalid access token payload");
  }

  const fullName =
    typeof payload.fullName === "string" ? payload.fullName : null;

  return {
    profileId: payload.sub,
    email,
    role: role as UserRole,
    fullName,
  };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, getRefreshSecret(), {
    issuer: TOKEN_ISSUER,
    audience: REFRESH_TOKEN_AUDIENCE,
  });

  if (typeof payload.sub !== "string" || payload.type !== "refresh") {
    throw new Error("Invalid refresh token payload");
  }

  return { profileId: payload.sub };
}
