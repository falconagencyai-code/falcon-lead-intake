import type { Context } from "hono";
import type {
  AuthedUser,
  Env,
  JsonRpcRequest,
  JsonRpcResponse,
  ToolHandlerContext,
} from "./types.ts";
import { buildRegistry, type RegistryEntry } from "./registry.ts";
import { authenticate, extractJwt } from "./auth.ts";
import { createServiceClient } from "./supabase.ts";
import { logAction } from "./audit.ts";

const PROTOCOL_VERSION = "2025-03-26";

export async function handleMcp(c: Context<{ Bindings: Env }>): Promise<Response> {
  if (c.req.method !== "POST") {
    return c.text("Method not allowed", 405);
  }

  let body: JsonRpcRequest;
  try {
    body = await c.req.json<JsonRpcRequest>();
  } catch {
    return c.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } } satisfies JsonRpcResponse);
  }

  const env = c.env;

  // initialize and ping don't require auth (so client can probe the server)
  if (body.method === "initialize") {
    return c.json({
      jsonrpc: "2.0",
      id: body.id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: true } },
        serverInfo: { name: env.MCP_SERVER_NAME, version: env.MCP_SERVER_VERSION },
      },
    } satisfies JsonRpcResponse);
  }

  if (body.method === "ping") {
    return c.json({ jsonrpc: "2.0", id: body.id, result: {} } satisfies JsonRpcResponse);
  }

  if (body.method === "notifications/initialized") {
    return new Response(null, { status: 204 });
  }

  // All other methods require auth
  const user = await authenticate(env, c.req.raw);
  if (!user) {
    return c.json({
      jsonrpc: "2.0",
      id: body.id,
      error: { code: -32001, message: "Unauthorized: missing or invalid Bearer token" },
    } satisfies JsonRpcResponse, 401);
  }

  if (body.method === "tools/list") {
    const registry = await buildRegistry(env);
    return c.json({
      jsonrpc: "2.0",
      id: body.id,
      result: {
        tools: registry.map((e) => e.definition),
      },
    } satisfies JsonRpcResponse);
  }

  if (body.method === "tools/call") {
    const params = (body.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
    const toolName = params.name;
    const args = params.arguments ?? {};
    if (!toolName) {
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        error: { code: -32602, message: "tools/call: 'name' is required" },
      } satisfies JsonRpcResponse);
    }

    const registry = await buildRegistry(env);
    const entry = registry.find((e) => e.definition.name === toolName);
    if (!entry) {
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      } satisfies JsonRpcResponse);
    }

    const start = Date.now();
    const jwt = extractJwt(c.req.raw) ?? "";
    const ctx: ToolHandlerContext & { jwt: string } = {
      env,
      user,
      serviceClient: createServiceClient(env),
      jwt,
    };

    try {
      const result = await entry.handler(args, ctx);
      const duration = Date.now() - start;
      // fire-and-forget audit
      c.executionCtx.waitUntil(
        logAction(env, {
          toolName,
          agentId: entry.agentId,
          user,
          input: args,
          output: result.structuredContent ?? result.content,
          status: result.isError ? "error" : "success",
          errorMessage: result.isError ? extractText(result.content) : undefined,
          durationMs: duration,
        }),
      );
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          content: result.content,
          structuredContent: result.structuredContent,
          isError: result.isError ?? false,
        },
      } satisfies JsonRpcResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      c.executionCtx.waitUntil(
        logAction(env, {
          toolName,
          agentId: entry.agentId,
          user,
          input: args,
          status: "error",
          errorMessage: message,
          durationMs: Date.now() - start,
        }),
      );
      return c.json({
        jsonrpc: "2.0",
        id: body.id,
        error: { code: -32000, message },
      } satisfies JsonRpcResponse);
    }
  }

  return c.json({
    jsonrpc: "2.0",
    id: body.id,
    error: { code: -32601, message: `Method not found: ${body.method}` },
  } satisfies JsonRpcResponse);
}

function extractText(content: Array<{ type: "text"; text: string }>): string {
  return content.map((c) => c.text).join(" ").slice(0, 500);
}

// Lightweight ref to satisfy TS (User is referenced in handlers)
export type _User = AuthedUser;
export type _Registry = RegistryEntry;
