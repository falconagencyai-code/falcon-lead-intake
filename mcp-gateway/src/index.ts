import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types.ts";
import { handleMcp } from "./mcp-server.ts";

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 86400,
  }),
);

app.get("/", (c) =>
  c.json({
    name: c.env.MCP_SERVER_NAME,
    version: c.env.MCP_SERVER_VERSION,
    status: "ok",
    description: "Falcon Agency MCP gateway",
  }),
);

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.all("/mcp", handleMcp);

export default app;
