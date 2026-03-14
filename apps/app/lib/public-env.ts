function normalizePublicUrl(value: string, name: string) {
  try {
    const url = new URL(value);

    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a valid URL`);
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
