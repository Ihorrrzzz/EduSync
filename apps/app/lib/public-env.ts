const LOCAL_PUBLIC_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function normalizePublicUrl(value: string, name: string) {
  try {
    const url = new URL(value);

    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:" &&
      !LOCAL_PUBLIC_HOSTS.has(url.hostname)
    ) {
      throw new Error(`${name} must use https in production`);
    }

    return url.toString().replace(/\/$/, "");
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`${name} must be a valid URL`);
    }

    throw error;
  }
}

function resolvePublicUrl(
  value: string | undefined,
  name: string,
  developmentFallback: string,
  requireInProduction = true,
) {
  if (value) {
    return normalizePublicUrl(value, name);
  }

  if (requireInProduction && process.env.NODE_ENV === "production") {
    throw new Error(`${name} is not configured`);
  }

  return normalizePublicUrl(developmentFallback, name);
}

export function getApiBaseUrl() {
  return resolvePublicUrl(
    process.env.NEXT_PUBLIC_API_URL,
    "NEXT_PUBLIC_API_URL",
    "http://localhost:3001",
    true,
  );
}

export function getSiteUrl() {
  return resolvePublicUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    "NEXT_PUBLIC_SITE_URL",
    "http://localhost:3000",
    false,
  );
}
