import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { authRoutes } from "./routes/auth.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/auth", authRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "localhost";

serve({
  fetch: app.fetch,
  port,
  hostname: host,
});
