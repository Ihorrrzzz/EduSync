function normalizePublicUrl(value: string, name: string) {
  try {
    const url = new URL(value);

    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return normalizePublicUrl(configuredUrl, "NEXT_PUBLIC_APP_URL");
  }

  return normalizePublicUrl("http://localhost:3002", "NEXT_PUBLIC_APP_URL");
}
