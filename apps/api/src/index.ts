import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { aiRoutes } from "./routes/ai.js";
import { env } from "./lib/env.js";
import { authRoutes } from "./routes/auth.js";
import { catalogRoutes } from "./routes/catalog.js";
import { clubRoutes } from "./routes/club.js";
import { enrollmentRoutes } from "./routes/enrollment.js";
import { journalRoutes } from "./routes/journal.js";
import { meRoutes } from "./routes/me.js";
import { parentRoutes } from "./routes/parent.js";
import { programReviewRoutes } from "./routes/program-review.js";
import { schoolRoutes } from "./routes/school.js";

const app = new Hono();
const allowedCorsOrigins = new Set(env.corsOrigins);

app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) {
        return "";
      }

      return allowedCorsOrigins.has(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }

  console.error(error);

  return c.json({ error: "Internal server error" }, 500);
});

app.get("/uploads/*", async (c) => {
  const filePath = join(process.cwd(), c.req.path);
  try {
    const content = await readFile(filePath);
    return new Response(content, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return c.json({ error: "File not found" }, 404);
  }
});

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/auth", authRoutes);
app.route("/api/me", meRoutes);
app.route("/api/catalog", catalogRoutes);
app.route("/api/school", schoolRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api", parentRoutes);
app.route("/api", clubRoutes);
app.route("/api", programReviewRoutes);
app.route("/api", enrollmentRoutes);
app.route("/api", journalRoutes);

serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
});
