export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MCP_SERVER_NAME: string;
  MCP_SERVER_VERSION: string;
}

export interface AuthedUser {
  id: string;
  email: string;
  role: "admin" | "venditore" | string;
  full_name: string | null;
  paid_by: "pat" | "stefano" | null;
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolHandlerContext {
  env: Env;
  user: AuthedUser;
  /**
   * Pre-built Supabase client for tool handlers. Either user-scoped (JWT auth,
   * RLS applies) or service-role (API-token auth, RLS bypassed; gateway has
   * already verified the user role from mcp_tokens). Tools must use this.
   */
  db: ReturnType<typeof import("./supabase.ts").createServiceClient>;
  serviceClient: ReturnType<typeof import("./supabase.ts").createServiceClient>;
}

export type ToolHandler = (
  args: Record<string, unknown>,
  ctx: ToolHandlerContext,
) => Promise<{
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}>;

export interface ToolModule {
  definition: McpToolDefinition;
  handler: ToolHandler;
}
