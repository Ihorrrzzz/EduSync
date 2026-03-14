import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

const config = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(configDirectory, "../.."),
};

export default config;
