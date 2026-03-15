/**
 * In-memory per-IP rate limiting.
 * Per-process only — not shared across cluster workers or multiple instances.
 */
import type { MiddlewareHandler } from "hono";

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// Cap memory usage: once exceeded, oldest entries are evicted FIFO-style.
const MAX_STORE_SIZE = 10_000;
// Resets on process restart; not suitable for multi-instance deployments.
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rightmost-IP trust model: the trusted reverse proxy (nginx) sets x-real-ip.
// Falls back to the last x-forwarded-for entry to resist client-spoofed headers.
function resolveClientIp(c: { req: { header: (name: string) => string | undefined } }) {
  const connInfo = c.req.header("x-real-ip");

  if (connInfo) {
    return connInfo.trim();
  }

  const forwarded = c.req.header("x-forwarded-for");

  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1]?.trim() || "unknown";
  }

  return "unknown";
}

// Collapse UUIDs to `:id` so /items/abc-123 and /items/def-456 share one bucket.
function normalizeRoutePath(path: string) {
  return path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ":id",
  );
}

function pruneExpiredEntries(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entriesToRemove = rateLimitStore.size - MAX_STORE_SIZE;
    const iterator = rateLimitStore.keys();

    for (let i = 0; i < entriesToRemove; i++) {
      const next = iterator.next();
      if (!next.done) {
        rateLimitStore.delete(next.value);
      }
    }
  }
}

export function createRateLimitMiddleware(
  options: RateLimitOptions,
): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    pruneExpiredEntries(now);

    const clientIp = resolveClientIp(c);
    const storageKey = `${clientIp}:${normalizeRoutePath(c.req.path)}`;
    const currentEntry = rateLimitStore.get(storageKey);

    if (!currentEntry || currentEntry.resetAt <= now) {
      rateLimitStore.set(storageKey, {
        count: 1,
        resetAt: now + options.windowMs,
      });

      await next();
      return;
    }

    if (currentEntry.count >= options.maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((currentEntry.resetAt - now) / 1000),
      );

      c.header("Retry-After", String(retryAfterSeconds));

      return c.json(
        {
          error: "Too many requests. Please try again later.",
        },
        429,
      );
    }

    currentEntry.count += 1;
    rateLimitStore.set(storageKey, currentEntry);

    await next();
  };
}
