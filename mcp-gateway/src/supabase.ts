import { createClient } from "@supabase/supabase-js";
import type { Env } from "./types.ts";

/**
 * Service-role client — bypasses RLS. Use only for:
 *  - writing audit logs (mcp_actions)
 *  - reading dynamic agent registry (mcp_agents)
 *  - calls explicitly intended to bypass RLS
 *
 * For all user-data operations prefer createUserClient() so RLS enforces permissions.
 */
export function createServiceClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-falcon-mcp": "service" } },
  });
}

/**
 * User-scoped client — every request runs with the user's JWT, so RLS applies.
 * This is the default for tool handlers reading or writing business data.
 */
export function createUserClient(env: Env, jwt: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "x-falcon-mcp": "user",
      },
    },
  });
}
