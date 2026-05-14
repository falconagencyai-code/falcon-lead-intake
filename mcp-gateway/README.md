# Falcon MCP Gateway

Cloudflare Worker che espone gli strumenti di Falcon Agency a Claude AI e Claude Code via Model Context Protocol (Streamable HTTP, JSON-RPC 2.0).

## Architettura in 3 righe

- **Entry**: `src/index.ts` (Hono app, route `/mcp`)
- **Dispatcher**: `src/mcp-server.ts` (JSON-RPC: initialize / tools/list / tools/call)
- **Tools**: 3 tool statici in `src/tools/` + agent dinamici letti dalla tabella Supabase `mcp_agents`

## Setup locale

```bash
cd mcp-gateway
npm install
cp .dev.vars.example .dev.vars   # poi compila i 3 valori reali
npm run dev                       # http://localhost:8787
```

I 3 valori in `.dev.vars`:

- `SUPABASE_URL` — `https://tpzpydnvcbcdkuthyweh.supabase.co`
- `SUPABASE_ANON_KEY` — pubblica, usata per verificare i JWT degli utenti
- `SUPABASE_SERVICE_ROLE_KEY` — privata, usata SOLO per scrivere `mcp_actions` e leggere il registry agent

## Deploy su Cloudflare

```bash
npx wrangler login                                # una tantum
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npm run deploy
```

L'URL di deploy sarà tipo `https://falcon-mcp-gateway.<account>.workers.dev`.

## Test rapido (curl)

```bash
# initialize (no auth)
curl -X POST https://<URL>/mcp \
  -H "content-type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# tools/list (richiede Bearer JWT Supabase)
curl -X POST https://<URL>/mcp \
  -H "content-type: application/json" \
  -H "Authorization: Bearer <SUPABASE_USER_JWT>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

Per ottenere un JWT utente: login in Falcon Admin → DevTools → `localStorage` → chiave `sb-...-auth-token` → estrai `access_token`.

## Uso da Claude Code

Aggiungi in `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "falcon": {
      "url": "https://falcon-mcp-gateway.<account>.workers.dev/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer <SUPABASE_USER_JWT>"
      }
    }
  }
}
```

> Il JWT scade ogni ora. Per uso continuativo serve OAuth — TODO sprint successivo (Workers OAuth Provider + refresh token).

## Tool statici v0

| Nome | Funzione |
|---|---|
| `falcon_lead_list` | Lista lead con filtri stage/source/since |
| `falcon_lead_create` | Crea nuovo lead (stage 'nuovo' + nota opzionale) |
| `falcon_balance_compute` | Calcola saldo divisorio Pat/Stefano (logica patDelta) |

## Agent dinamici

Aggiungi righe in `mcp_agents` (via UI MCP Hub admin o SQL). Ogni riga abilitata viene esposta come tool MCP, e ogni call viene proxata all'`endpoint_url` con header:

- `x-falcon-mcp-agent: <name>`
- `x-falcon-mcp-user: <email>`
- `x-falcon-mcp-role: admin | venditore`
- `Authorization: Bearer <jwt>` se `auth_required = true`

Body POST: `{ "args": <input>, "user": { id, email, role, ... } }`.

## Audit

Ogni `tools/call` scrive su `mcp_actions` (fire-and-forget). Visibile in MCP Hub → Audit Log.
