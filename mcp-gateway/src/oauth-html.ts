/**
 * Minimal HTML templates for the OAuth login screen. Inlined CSS, no JS.
 * Rendered by /authorize (GET) and re-rendered with an error on /authorize (POST) failure.
 */

interface RenderArgs {
  clientName: string;
  hiddenFields: Record<string, string>;
  error?: string;
}

export function renderLoginPage(args: RenderArgs): string {
  const { clientName, hiddenFields, error } = args;
  const hidden = Object.entries(hiddenFields)
    .map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}" />`)
    .join("");
  const errorBlock = error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : "";
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Falcon MCP  Accedi</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: radial-gradient(1200px 600px at 50% -10%, rgba(0,212,255,0.12), transparent 60%), #09090b;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
    }
    .card {
      width: min(420px, 90vw);
      background: rgba(0,0,0,0.55);
      border: 1px solid rgba(0,212,255,0.18);
      border-radius: 18px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.45);
    }
    .brand { font-size: 12px; letter-spacing: 0.32em; text-transform: uppercase; color: #22d3ee; margin-bottom: 4px; }
    h1 { margin: 0 0 6px; font-size: 22px; }
    p.sub { margin: 0 0 24px; color: #a1a1aa; font-size: 14px; }
    .client { color: #22d3ee; font-weight: 600; }
    label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.18em; color: #a1a1aa; margin-bottom: 6px; }
    input[type=email], input[type=password] {
      width: 100%;
      padding: 11px 13px;
      border-radius: 12px;
      border: 1px solid rgba(0,212,255,0.14);
      background: rgba(0,0,0,0.45);
      color: #e4e4e7;
      font-size: 14px;
      margin-bottom: 16px;
      outline: none;
    }
    input:focus { border-color: rgba(0,212,255,0.42); }
    button {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(0,212,255,0.32);
      background: rgba(0,212,255,0.1);
      color: #22d3ee;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.02em;
      cursor: pointer;
    }
    button:hover { background: rgba(0,212,255,0.18); }
    .error {
      margin: -4px 0 18px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(248,113,113,0.32);
      background: rgba(248,113,113,0.08);
      color: #fca5a5;
      font-size: 13px;
    }
    .foot { margin-top: 18px; text-align: center; color: #71717a; font-size: 12px; }
  </style>
</head>
<body>
  <form class="card" method="POST" action="/authorize">
    <div class="brand">Falcon MCP</div>
    <h1>Autorizza l'accesso</h1>
    <p class="sub"><span class="client">${escapeHtml(clientName)}</span> sta chiedendo di leggere e usare i tool Falcon a tuo nome.</p>
    ${errorBlock}
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required autofocus />
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required />
    ${hidden}
    <button type="submit">Accedi e autorizza</button>
    <div class="foot">Stesso account del pannello admin Falcon.</div>
  </form>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
