import { UserRole } from "@prisma/client";
import { SignJWT, jwtVerify } from "jose";

type AccessTokenInput = {
  profileId: string;
  email: string;
  role: UserRole;
  fullName: string | null;
};

export type AccessTokenPayload = AccessTokenInput;

const textEncoder = new TextEncoder();

function getAccessSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return textEncoder.encode(secret);
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return textEncoder.encode(secret);
}

export async function signAccessToken(input: AccessTokenInput) {
  return new SignJWT({
    email: input.email,
    role: input.role,
    fullName: input.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.profileId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessSecret());
}

export async function signRefreshToken(profileId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({ type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(profileId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());

  return { token, expiresAt };
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());

  const role = payload.role;
  const email = payload.email;

  if (
    typeof payload.sub !== "string" ||
    typeof email !== "string" ||
    typeof role !== "string" ||
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
  const { payload } = await jwtVerify(token, getRefreshSecret());

  if (typeof payload.sub !== "string") {
    throw new Error("Invalid refresh token payload");
  }

  return { profileId: payload.sub };
}
