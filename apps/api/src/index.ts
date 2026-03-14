import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./lib/env.js";
import { authRoutes } from "./routes/auth.js";

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
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.onError((error, c) => {
  console.error(error);

  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/auth", authRoutes);

serve({
  fetch: app.fetch,
  port: env.PORT,
  hostname: env.HOST,
});
