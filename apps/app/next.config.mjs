import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const localPublicHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

function validatePublicUrl(value, name, { requireInProduction = false } = {}) {
  if (!value) {
    if (requireInProduction && process.env.NODE_ENV === "production") {
      throw new Error(`${name} is not configured`);
    }

    return;
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }

  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !localPublicHosts.has(url.hostname)
  ) {
    throw new Error(`${name} must use https in production`);
  }
}

validatePublicUrl(process.env.NEXT_PUBLIC_API_URL, "NEXT_PUBLIC_API_URL", {
  requireInProduction: true,
});
validatePublicUrl(process.env.NEXT_PUBLIC_SITE_URL, "NEXT_PUBLIC_SITE_URL");

const config = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(configDirectory, "../.."),
};

export default config;
