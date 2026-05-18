/**
 * OAuth 2.1 + RFC 7591 Dynamic Client Registration for the Falcon MCP gateway.
 *
 * Flow:
 *   1. Client (Claude.ai) hits /mcp without auth  401 + WWW-Authenticate.
 *   2. Client fetches /.well-known/oauth-protected-resource and
 *      /.well-known/oauth-authorization-server to discover endpoints.
 *   3. Client POSTs /register to register itself (public client, PKCE only).
 *   4. Client opens /authorize?... in the user's browser.
 *   5. We show a login form. On success we issue an auth code.
 *   6. Client POSTs /token with the code + PKCE verifier.
 *   7. We mint an fmcp_* token (stored hashed in mcp_tokens) and return it
 *      as the OAuth access_token. The /mcp endpoint already accepts these.
 */

import type { Context } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env } from "./types.ts";
import { renderLoginPage } from "./oauth-html.ts";

// ── helpers ──────────────────────────────────────────────────────────────────

function originOf(c: Context<{ Bindings: Env }>): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

function randomToken(prefix = ""): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return prefix + base64UrlEncode(buf);
}

function base64UrlEncode(buf: Uint8Array): string {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256B64Url(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return base64UrlEncode(new Uint8Array(digest));
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function service(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── discovery ────────────────────────────────────────────────────────────────

/**
 * RFC 9728 protected-resource metadata. Points clients at the auth server.
 */
export function handleProtectedResource(c: Context<{ Bindings: Env }>): Response {
  const origin = originOf(c);
  return c.json({
    resource: `${origin}/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
  });
}

/**
 * RFC 8414 authorization-server metadata. Lists endpoints + capabilities.
 */
export function handleAuthServerMetadata(c: Context<{ Bindings: Env }>): Response {
  const origin = originOf(c);
  return c.json({
    issuer: origin,
    authorization_endpoint: `${origin}/authorize`,
    token_endpoint: `${origin}/token`,
    registration_endpoint: `${origin}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    scopes_supported: ["mcp"],
  });
}

// ── dynamic client registration (RFC 7591) ───────────────────────────────────

interface RegisterRequest {
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
  scope?: string;
}

export async function handleRegister(c: Context<{ Bindings: Env }>): Promise<Response> {
  let body: RegisterRequest;
  try {
    body = await c.req.json<RegisterRequest>();
  } catch {
    return c.json({ error: "invalid_request", error_description: "JSON body required" }, 400);
  }

  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u) => typeof u === "string") : [];
  if (redirectUris.length === 0) {
    return c.json({ error: "invalid_redirect_uri", error_description: "redirect_uris required" }, 400);
  }

  const clientId = randomToken("fmcc_");
  const clientName = (body.client_name ?? "Unnamed MCP client").slice(0, 120);
  const grantTypes = Array.isArray(body.grant_types) && body.grant_types.length ? body.grant_types : ["authorization_code"];
  const responseTypes = Array.isArray(body.response_types) && body.response_types.length ? body.response_types : ["code"];
  const authMethod = body.token_endpoint_auth_method ?? "none";

  const { error } = await service(c.env)
    .from("oauth_clients")
    .insert({
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: grantTypes,
      response_types: responseTypes,
      token_endpoint_auth_method: authMethod,
      scope: body.scope ?? null,
    });
  if (error) {
    return c.json({ error: "server_error", error_description: error.message }, 500);
  }

  return c.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: grantTypes,
      response_types: responseTypes,
      token_endpoint_auth_method: authMethod,
    },
    201,
  );
}

// ── authorization endpoint ───────────────────────────────────────────────────

const AUTHORIZE_FIELDS = [
  "client_id",
  "redirect_uri",
  "response_type",
  "code_challenge",
  "code_challenge_method",
  "state",
  "scope",
] as const;
type AuthorizeField = (typeof AUTHORIZE_FIELDS)[number];

function readParams(source: URLSearchParams | Record<string, string>): Record<AuthorizeField, string> {
  const get = (k: string): string =>
    source instanceof URLSearchParams ? source.get(k) ?? "" : source[k] ?? "";
  return Object.fromEntries(AUTHORIZE_FIELDS.map((k) => [k, get(k)])) as Record<AuthorizeField, string>;
}

async function loadClient(env: Env, clientId: string) {
  if (!clientId) return null;
  const { data } = await service(env)
    .from("oauth_clients")
    .select("client_id, client_name, redirect_uris, token_endpoint_auth_method")
    .eq("client_id", clientId)
    .maybeSingle();
  return data;
}

export async function handleAuthorizeGet(c: Context<{ Bindings: Env }>): Promise<Response> {
  const url = new URL(c.req.url);
  const params = readParams(url.searchParams);
  const client = await loadClient(c.env, params.client_id);

  if (!client) return c.text("Unknown client_id", 400);
  if (!params.redirect_uri || !client.redirect_uris.includes(params.redirect_uri)) {
    return c.text("redirect_uri not registered for this client", 400);
  }
  if (params.response_type !== "code") {
    return redirectWithError(params.redirect_uri, params.state, "unsupported_response_type", "Only response_type=code is supported");
  }
  if (!params.code_challenge || params.code_challenge_method !== "S256") {
    return redirectWithError(params.redirect_uri, params.state, "invalid_request", "PKCE code_challenge (S256) is required");
  }

  const html = renderLoginPage({
    clientName: client.client_name ?? params.client_id,
    hiddenFields: params,
  });
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function handleAuthorizePost(c: Context<{ Bindings: Env }>): Promise<Response> {
  const form = await c.req.formData();
  const params = readParams(Object.fromEntries(Array.from(form.entries()).map(([k, v]) => [k, String(v)])));
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  const client = await loadClient(c.env, params.client_id);
  if (!client) return c.text("Unknown client_id", 400);
  if (!params.redirect_uri || !client.redirect_uris.includes(params.redirect_uri)) {
    return c.text("redirect_uri not registered for this client", 400);
  }

  // Sign in via Supabase Auth using the anon key.
  const anon = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const html = renderLoginPage({
      clientName: client.client_name ?? params.client_id,
      hiddenFields: params,
      error: "Email o password non corretti.",
    });
    return new Response(html, { status: 401, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Issue an authorization code.
  const code = randomToken("fmac_");
  const { error: insertErr } = await service(c.env).from("oauth_codes").insert({
    code,
    client_id: params.client_id,
    user_id: data.user.id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    code_challenge_method: params.code_challenge_method || "S256",
    scope: params.scope || null,
  });
  if (insertErr) {
    return redirectWithError(params.redirect_uri, params.state, "server_error", insertErr.message);
  }

  const redirect = new URL(params.redirect_uri);
  redirect.searchParams.set("code", code);
  if (params.state) redirect.searchParams.set("state", params.state);
  return Response.redirect(redirect.toString(), 302);
}

function redirectWithError(redirectUri: string, state: string | undefined, code: string, description: string): Response {
  try {
    const url = new URL(redirectUri);
    url.searchParams.set("error", code);
    url.searchParams.set("error_description", description);
    if (state) url.searchParams.set("state", state);
    return Response.redirect(url.toString(), 302);
  } catch {
    return new Response(`${code}: ${description}`, { status: 400 });
  }
}

// ── token endpoint ───────────────────────────────────────────────────────────

export async function handleToken(c: Context<{ Bindings: Env }>): Promise<Response> {
  const form = await c.req.formData();
  const grantType = String(form.get("grant_type") ?? "");
  if (grantType !== "authorization_code") {
    return c.json({ error: "unsupported_grant_type" }, 400);
  }
  const code = String(form.get("code") ?? "");
  const redirectUri = String(form.get("redirect_uri") ?? "");
  const clientId = String(form.get("client_id") ?? "");
  const codeVerifier = String(form.get("code_verifier") ?? "");

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return c.json({ error: "invalid_request" }, 400);
  }

  const sb = service(c.env);
  const { data: row, error } = await sb
    .from("oauth_codes")
    .select("code, client_id, user_id, redirect_uri, code_challenge, code_challenge_method, expires_at, used_at")
    .eq("code", code)
    .maybeSingle();
  if (error || !row) return c.json({ error: "invalid_grant", error_description: "code not found" }, 400);
  if (row.used_at) return c.json({ error: "invalid_grant", error_description: "code already used" }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) return c.json({ error: "invalid_grant", error_description: "code expired" }, 400);
  if (row.client_id !== clientId) return c.json({ error: "invalid_grant", error_description: "client mismatch" }, 400);
  if (row.redirect_uri !== redirectUri) return c.json({ error: "invalid_grant", error_description: "redirect_uri mismatch" }, 400);

  // Verify PKCE.
  const expected = await sha256B64Url(codeVerifier);
  if (expected !== row.code_challenge) {
    return c.json({ error: "invalid_grant", error_description: "PKCE verification failed" }, 400);
  }

  // Mark code as used.
  await sb.from("oauth_codes").update({ used_at: new Date().toISOString() }).eq("code", code);

  // Mint the access token (= fmcp_* in mcp_tokens). No expiry; revoke via mcp_tokens.
  const { data: client } = await sb
    .from("oauth_clients")
    .select("client_name")
    .eq("client_id", clientId)
    .maybeSingle();
  const accessToken = randomToken("fmcp_");
  const accessHash = await sha256Hex(accessToken);

  const { error: tokenErr } = await sb.from("mcp_tokens").insert({
    user_id: row.user_id,
    name: `OAuth: ${client?.client_name ?? clientId}`,
    token_hash: accessHash,
    scopes: ["*"],
  });
  if (tokenErr) {
    return c.json({ error: "server_error", error_description: tokenErr.message }, 500);
  }

  return c.json({
    access_token: accessToken,
    token_type: "Bearer",
    scope: "mcp",
  });
}
