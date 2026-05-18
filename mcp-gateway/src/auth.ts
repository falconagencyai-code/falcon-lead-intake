import { createClient } from "@supabase/supabase-js";
import type { AuthedUser, Env } from "./types.ts";

/**
 * Authentication: supports two Bearer formats.
 *   1) "fmcp_<random>"  long-lived API token, looked up (hashed) in mcp_tokens.
 *   2) JWT from Supabase Auth (1h default lifetime) verified via auth.getUser.
 *
 * Returns null if missing or invalid.
 */
export async function authenticate(env: Env, request: Request): Promise<AuthedUser | null> {
  const raw = extractJwt(request);
  if (!raw) return null;

  if (raw.startsWith("fmcp_")) {
    return verifyApiToken(env, raw);
  }
  return verifyJwt(env, raw);
}

async function verifyJwt(env: Env, jwt: string): Promise<AuthedUser | null> {
  const verifier = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });

  const { data: userData, error: userErr } = await verifier.auth.getUser(jwt);
  if (userErr || !userData.user) return null;

  const { data: profile } = await verifier
    .from("profiles")
    .select("role, full_name")
    .eq("id", userData.user.id)
    .maybeSingle();

  const email = userData.user.email ?? "";
  return {
    id: userData.user.id,
    email,
    role: profile?.role ?? "venditore",
    full_name: profile?.full_name ?? null,
    paid_by: inferPaidBy(email),
  };
}

async function verifyApiToken(env: Env, rawToken: string): Promise<AuthedUser | null> {
  const hash = await sha256Hex(rawToken);
  const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: token, error } = await service
    .from("mcp_tokens")
    .select("id, user_id, scopes, revoked_at, expires_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (error || !token) return null;
  if (token.revoked_at) return null;
  if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) return null;

  const { data: userRes, error: userErr } = await service.auth.admin.getUserById(token.user_id);
  if (userErr || !userRes?.user) return null;

  const { data: profile } = await service
    .from("profiles")
    .select("role, full_name")
    .eq("id", token.user_id)
    .maybeSingle();

  // best-effort touch  never block on it
  service
    .from("mcp_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id)
    .then(() => undefined, () => undefined);

  const email = userRes.user.email ?? "";
  return {
    id: token.user_id,
    email,
    role: profile?.role ?? "venditore",
    full_name: profile?.full_name ?? null,
    paid_by: inferPaidBy(email),
  };
}

/**
 * Map an authenticated user to the Pat/Stefano accounting bucket.
 */
function inferPaidBy(email: string): "pat" | "stefano" | null {
  const lower = email.toLowerCase();
  if (lower.startsWith("patrick") || lower.startsWith("pat@") || lower.startsWith("falconagency")) return "pat";
  if (lower.startsWith("stefano")) return "stefano";
  return null;
}

export function extractJwt(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const jwt = auth.slice(7).trim();
  return jwt || null;
}

export function isApiToken(bearer: string | null): boolean {
  return !!bearer && bearer.startsWith("fmcp_");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
