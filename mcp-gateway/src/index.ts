import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types.ts";
import { handleMcp } from "./mcp-server.ts";
import {
  handleAuthorizeGet,
  handleAuthorizePost,
  handleAuthServerMetadata,
  handleProtectedResource,
  handleRegister,
  handleToken,
} from "./oauth.ts";

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

// MCP transport
app.all("/mcp", handleMcp);

// OAuth 2.1 + dynamic registration (so Claude.ai and other MCP clients can self-onboard)
app.get("/.well-known/oauth-protected-resource", handleProtectedResource);
app.get("/.well-known/oauth-protected-resource/mcp", handleProtectedResource);
app.get("/.well-known/oauth-authorization-server", handleAuthServerMetadata);
app.post("/register", handleRegister);
app.get("/authorize", handleAuthorizeGet);
app.post("/authorize", handleAuthorizePost);
app.post("/token", handleToken);

export default app;
