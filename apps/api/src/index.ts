import { Hono } from "hono";
import { cors } from "hono/cors";

import { auth } from "./auth";
import { webOrigins } from "./env";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: webOrigins,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Set-Cookie"],
    maxAge: 600,
  }),
);

app.all("/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true }));

export default {
  port: 8787,
  fetch: app.fetch,
};
