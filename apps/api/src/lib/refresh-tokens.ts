import { createHash } from "node:crypto";

export function hashRefreshToken(token: string) {
  // Store a one-way digest so a database leak does not expose reusable session tokens.
  return createHash("sha256").update(token).digest("hex");
}
