import type { Env, McpToolDefinition, ToolHandler, ToolModule } from "./types.ts";
import { createServiceClient, createUserClient } from "./supabase.ts";
import { leadList } from "./tools/lead-list.ts";
import { leadCreate } from "./tools/lead-create.ts";
import { balanceCompute } from "./tools/balance-compute.ts";

const STATIC_TOOLS: ToolModule[] = [leadList, leadCreate, balanceCompute];

interface DynamicAgentRow {
  id: string;
  name: string;
  description: string;
  endpoint_url: string;
  input_schema: Record<string, unknown> | null;
  auth_required: boolean;
}

export interface RegistryEntry {
  definition: McpToolDefinition;
  handler: ToolHandler;
  agentId?: string;
}

/**
 * Build the active tool registry: static tools + dynamic agents from DB.
 * Called per-request (cheap query). Could be cached behind a Durable Object later.
 */
export async function buildRegistry(env: Env): Promise<RegistryEntry[]> {
  const entries: RegistryEntry[] = STATIC_TOOLS.map((m) => ({
    definition: m.definition,
    handler: m.handler,
  }));

  try {
    const sb = createServiceClient(env);
    const { data, error } = await sb
      .from("mcp_agents")
      .select("id, name, description, endpoint_url, input_schema, auth_required")
      .eq("enabled", true);
    if (error) {
      console.error("registry: failed to load dynamic agents", error.message);
      return entries;
    }
    for (const row of (data ?? []) as DynamicAgentRow[]) {
      entries.push({
        agentId: row.id,
        definition: {
          name: row.name,
          description: row.description,
          inputSchema: row.input_schema ?? { type: "object" },
        },
        handler: makeProxyHandler(row),
      });
    }
  } catch (err) {
    console.error("registry: dynamic agents load threw", err);
  }

  return entries;
}

/**
 * Wrap a dynamic agent endpoint as a tool handler. The gateway POSTs the args
 * to the agent's endpoint and forwards the user JWT if auth_required is true.
 */
function makeProxyHandler(agent: DynamicAgentRow): ToolHandler {
  return async (args, ctx) => {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-falcon-mcp-agent": agent.name,
      "x-falcon-mcp-user": ctx.user.email,
      "x-falcon-mcp-role": ctx.user.role,
    };
    if (agent.auth_required) {
      const jwt = (ctx as unknown as { jwt?: string }).jwt ?? "";
      if (jwt) headers.authorization = `Bearer ${jwt}`;
    }

    let response: Response;
    try {
      response = await fetch(agent.endpoint_url, {
        method: "POST",
        headers,
        body: JSON.stringify({ args, user: ctx.user }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: "text", text: `Agent ${agent.name} unreachable: ${message}` }],
      };
    }

    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep as text */
    }

    if (!response.ok) {
      return {
        isError: true,
        content: [{ type: "text", text: `Agent ${agent.name} HTTP ${response.status}: ${text.slice(0, 500)}` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: typeof parsed === "string" ? parsed : `Agent ${agent.name} OK`,
        },
      ],
      structuredContent: typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : { raw: parsed },
    };
  };
}
