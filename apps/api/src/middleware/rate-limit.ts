import type { MiddlewareHandler } from "hono";

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function resolveClientIp(forwardedFor: string | undefined) {
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function pruneExpiredEntries(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function createRateLimitMiddleware(
  options: RateLimitOptions,
): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    pruneExpiredEntries(now);

    const clientIp = resolveClientIp(c.req.header("x-forwarded-for"));
    const storageKey = `${clientIp}:${c.req.path}`;
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
