import type { AuthedUser, Env } from "./types.ts";
import { createServiceClient } from "./supabase.ts";

export interface AuditEntry {
  toolName: string;
  agentId?: string | null;
  user: AuthedUser | null;
  input: unknown;
  output?: unknown;
  status: "success" | "error";
  errorMessage?: string;
  durationMs: number;
  sessionId?: string | null;
}

/**
 * Best-effort write to mcp_actions. Never throws — audit failure must not break tool calls.
 */
export async function logAction(env: Env, entry: AuditEntry): Promise<void> {
  try {
    const client = createServiceClient(env);
    await client.from("mcp_actions").insert({
      tool_name: entry.toolName,
      agent_id: entry.agentId ?? null,
      user_id: entry.user?.id ?? null,
      user_email: entry.user?.email ?? null,
      user_role: entry.user?.role ?? null,
      input: entry.input ?? null,
      output: entry.output ?? null,
      status: entry.status,
      error_message: entry.errorMessage ?? null,
      duration_ms: Math.max(0, Math.round(entry.durationMs)),
      session_id: entry.sessionId ?? null,
    });
  } catch (err) {
    console.error("audit write failed", err);
  }
}
