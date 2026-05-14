import { createClient } from "@supabase/supabase-js";
import type { AuthedUser, Env } from "./types.ts";

/**
 * Verify a Bearer JWT against Supabase Auth, then enrich with profile data.
 * Returns null if the token is missing, invalid, or the user has no profile.
 */
export async function authenticate(env: Env, request: Request): Promise<AuthedUser | null> {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const jwt = auth.slice(7).trim();
  if (!jwt) return null;

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
  const paid_by = inferPaidBy(email);

  return {
    id: userData.user.id,
    email,
    role: profile?.role ?? "venditore",
    full_name: profile?.full_name ?? null,
    paid_by,
  };
}

/**
 * Map an authenticated user to the Pat/Stefano accounting bucket.
 * Adjust the email match list as needed.
 */
function inferPaidBy(email: string): "pat" | "stefano" | null {
  const lower = email.toLowerCase();
  if (lower.startsWith("patrick") || lower.startsWith("pat@")) return "pat";
  if (lower.startsWith("stefano")) return "stefano";
  return null;
}

export function extractJwt(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const jwt = auth.slice(7).trim();
  return jwt || null;
}
