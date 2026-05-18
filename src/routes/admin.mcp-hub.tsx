import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Filter,
  KeyRound,
  Link2,
  Plug,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/mcp-hub")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — MCP Hub" },
      { name: "description", content: "Gestione gateway MCP, agent custom e audit log Falcon Agency." },
    ],
  }),
  component: McpHubPage,
});

type SectionTab = "overview" | "agents" | "audit" | "connect";

const sectionTabs: { id: SectionTab; label: string; icon: typeof Cpu }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "agents", label: "Agents", icon: Cpu },
  { id: "audit", label: "Audit Log", icon: ShieldCheck },
  { id: "connect", label: "Connect", icon: Plug },
];

function McpHubPage() {
  const [section, setSection] = useState<SectionTab>("overview");
  const { role } = useAuth();

  if (role && role !== "admin") {
    return (
      <AdminCard className="p-6">
        <p className="text-sm text-muted-foreground">
          Sezione riservata agli amministratori.
        </p>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="label-section">Falcon Agency</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          MCP <span className="text-primary text-glow">Hub</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Gateway, agent registry e audit log del Model Context Protocol di Falcon.
          Gli agent registrati qui diventano automaticamente disponibili in Claude AI
          e Claude Code per Pat e Stefano.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
        {sectionTabs.map((t) => {
          const Icon = t.icon;
          const active = section === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[rgba(0,212,255,0.12)] text-primary shadow-[inset_0_0_24px_rgba(0,212,255,0.08)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {section === "overview" && <OverviewSection />}
      {section === "agents" && <AgentsSection />}
      {section === "audit" && <AuditSection />}
      {section === "connect" && <ConnectSection />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// OVERVIEW
// ────────────────────────────────────────────────────────────────────

type OverviewStats = {
  agentsTotal: number;
  agentsEnabled: number;
  callsLast24h: number;
  errorsLast24h: number;
  topTools: { tool_name: string; count: number }[];
  recentActions: McpAction[];
};

function OverviewSection() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [agentsRes, actionsRes, errorsRes, recentRes, topRes] = await Promise.all([
      supabase.from("mcp_agents").select("id, enabled"),
      supabase.from("mcp_actions").select("id", { count: "exact", head: true }).gte("created_at", since),
      supabase.from("mcp_actions").select("id", { count: "exact", head: true }).gte("created_at", since).eq("status", "error"),
      supabase.from("mcp_actions").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("mcp_actions").select("tool_name").gte("created_at", since),
    ]);

    const agents = agentsRes.data ?? [];
    const enabled = agents.filter((a: { enabled: boolean }) => a.enabled).length;

    const toolCounts = new Map<string, number>();
    for (const row of (topRes.data ?? []) as { tool_name: string }[]) {
      toolCounts.set(row.tool_name, (toolCounts.get(row.tool_name) ?? 0) + 1);
    }
    const topTools = Array.from(toolCounts.entries())
      .map(([tool_name, count]) => ({ tool_name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      agentsTotal: agents.length,
      agentsEnabled: enabled,
      callsLast24h: actionsRes.count ?? 0,
      errorsLast24h: errorsRes.count ?? 0,
      topTools,
      recentActions: (recentRes.data ?? []) as McpAction[],
    });
    setLoading(false);
  };

  if (!isSupabaseConfigured) {
    return <NotConfigured />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi
          icon={Cpu}
          title="Agent registrati"
          value={loading ? "—" : `${stats?.agentsEnabled ?? 0}/${stats?.agentsTotal ?? 0}`}
          meta="attivi / totali"
          tone="cyan"
        />
        <AdminKpi
          icon={Zap}
          title="Chiamate 24h"
          value={loading ? "—" : String(stats?.callsLast24h ?? 0)}
          meta="totale tool + agent"
          tone="cyan"
        />
        <AdminKpi
          icon={AlertTriangle}
          title="Errori 24h"
          value={loading ? "—" : String(stats?.errorsLast24h ?? 0)}
          meta={stats?.errorsLast24h ? "da investigare" : "tutto ok"}
          tone={stats?.errorsLast24h ? "orange" : "green"}
        />
        <AdminKpi
          icon={ShieldCheck}
          title="Gateway"
          value="Da deployare"
          meta="Cloudflare Workers"
          tone="orange"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[3fr_2fr]">
        <AdminCard className="p-5">
          <AdminSectionTitle eyebrow="Audit" title="Ultime azioni MCP" />
          <div className="mt-5 overflow-x-auto">
            {loading ? (
              <SkeletonRows />
            ) : !stats?.recentActions?.length ? (
              <EmptyState text="Nessuna azione registrata. Quando deployerai il gateway e Claude inizierà a chiamare i tool, le vedrai qui." />
            ) : (
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr className="border-b border-[rgba(0,212,255,0.1)]">
                    <th className="py-3">Quando</th>
                    <th>Utente</th>
                    <th>Tool</th>
                    <th>Stato</th>
                    <th className="text-right">Durata</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActions.map((a) => (
                    <tr key={a.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                      <td className="py-3 text-muted-foreground">
                        {a.created_at ? format(new Date(a.created_at), "d MMM HH:mm", { locale: it }) : "—"}
                      </td>
                      <td className="font-medium">{a.user_email ?? "—"}</td>
                      <td className="font-mono text-xs text-primary">{a.tool_name}</td>
                      <td>
                        <StatusPill status={a.status} />
                      </td>
                      <td className="text-right text-muted-foreground">{a.duration_ms ? `${a.duration_ms}ms` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </AdminCard>

        <AdminCard className="p-5">
          <AdminSectionTitle eyebrow="Usage" title="Top 5 tool (24h)" />
          <div className="mt-5 space-y-3">
            {loading ? (
              <SkeletonRows compact />
            ) : !stats?.topTools?.length ? (
              <EmptyState text="Nessun dato di utilizzo ancora." compact />
            ) : (
              stats.topTools.map((t) => {
                const max = stats.topTools[0]?.count ?? 1;
                const pct = Math.round((t.count / max) * 100);
                return (
                  <div key={t.tool_name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs text-foreground">{t.tool_name}</span>
                      <span className="text-muted-foreground">{t.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(0,212,255,0.4)" }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </AdminCard>
      </section>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Sources" title="Stato fonti dati" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <DataSourceCard name="Supabase Falcon" detail="DB principale" status="ok" icon={Database} />
          <DataSourceCard name="Calendly (bookings)" detail="Sistema venditori call" status="ok" icon={Database} />
          <DataSourceCard name="Facebook Ads" detail="Da collegare API" status="pending" icon={Database} />
          <DataSourceCard name="Higgsfield AI" detail="MCP esterno" status="external" icon={Database} />
        </div>
      </AdminCard>
    </div>
  );
}

function DataSourceCard({
  name,
  detail,
  status,
  icon: Icon,
}: {
  name: string;
  detail: string;
  status: "ok" | "pending" | "error" | "external";
  icon: typeof Database;
}) {
  const palette = {
    ok: { color: "#34d399", bg: "rgba(52,211,153,0.1)", label: "Online" },
    pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Pending" },
    error: { color: "#f87171", bg: "rgba(248,113,113,0.1)", label: "Errore" },
    external: { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", label: "Esterno" },
  }[status];
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.16)] bg-[rgba(255,255,255,0.04)] text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        </div>
        <span
          className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: palette.color, background: palette.bg, borderColor: palette.color }}
        >
          {palette.label}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// AGENTS
// ────────────────────────────────────────────────────────────────────

type McpAgent = {
  id: string;
  name: string;
  description: string;
  endpoint_url: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  auth_required: boolean;
  enabled: boolean;
  owner: "pat" | "stefano" | "shared";
  created_at: string;
};

function AgentsSection() {
  const [agents, setAgents] = useState<McpAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mcp_agents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(`Errore agents: ${error.message}`);
    else setAgents((data ?? []) as McpAgent[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    if (!supabase) return;
    const channel = supabase
      .channel("mcp-agents-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "mcp_agents" }, () => void load())
      .subscribe();
    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return agents;
    const q = filter.toLowerCase();
    return agents.filter(
      (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q),
    );
  }, [agents, filter]);

  const toggleEnabled = async (agent: McpAgent) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("mcp_agents")
      .update({ enabled: !agent.enabled })
      .eq("id", agent.id);
    if (error) toast.error(error.message);
    else toast.success(`${agent.name} ${agent.enabled ? "disattivato" : "attivato"}`);
  };

  const removeAgent = async (agent: McpAgent) => {
    if (!supabase) return;
    if (!confirm(`Eliminare l'agent "${agent.name}"?`)) return;
    const { error } = await supabase.from("mcp_agents").delete().eq("id", agent.id);
    if (error) toast.error(error.message);
    else toast.success("Agent eliminato");
  };

  if (!isSupabaseConfigured) return <NotConfigured />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Cerca agent…"
            className="h-10 w-72 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] px-4 py-2.5 text-sm font-semibold text-primary shadow-[0_0_24px_rgba(0,212,255,0.15)] transition hover:bg-[rgba(0,212,255,0.14)]"
        >
          <Plus className="h-4 w-4" />
          Aggiungi agent
        </button>
      </div>

      {showForm && <AgentForm onDone={() => setShowForm(false)} onSaved={load} />}

      <AdminCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="px-5 py-4">Nome</th>
                <th>Descrizione</th>
                <th>Owner</th>
                <th>Endpoint</th>
                <th>Stato</th>
                <th className="px-5 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8">
                    <SkeletonRows />
                  </td>
                </tr>
              ) : !filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Nessun agent registrato. Clicca "Aggiungi agent" per registrare il primo endpoint MCP.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                    <td className="px-5 py-4 font-mono text-xs text-primary">{a.name}</td>
                    <td className="max-w-[300px] truncate text-muted-foreground">{a.description}</td>
                    <td>
                      <OwnerPill owner={a.owner} />
                    </td>
                    <td className="max-w-[220px] truncate font-mono text-[11px] text-muted-foreground">
                      {a.endpoint_url}
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          color: a.enabled ? "#34d399" : "#4a5568",
                          background: a.enabled ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                          borderColor: a.enabled ? "rgba(52,211,153,0.32)" : "rgba(255,255,255,0.08)",
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: a.enabled ? "#34d399" : "#4a5568" }}
                        />
                        {a.enabled ? "ON" : "OFF"}
                      </span>
                    </td>
                    <td className="px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => toggleEnabled(a)}
                          title={a.enabled ? "Disattiva" : "Attiva"}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,212,255,0.14)] text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeAgent(a)}
                          title="Elimina"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,212,255,0.14)] text-muted-foreground transition hover:border-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

function AgentForm({ onDone, onSaved }: { onDone: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [owner, setOwner] = useState<"pat" | "stefano" | "shared">("shared");
  const [authRequired, setAuthRequired] = useState(true);
  const [inputSchema, setInputSchema] = useState('{\n  "type": "object",\n  "properties": {},\n  "required": []\n}');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    let parsedSchema: unknown;
    try {
      parsedSchema = JSON.parse(inputSchema);
    } catch {
      toast.error("Input schema non è JSON valido");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("mcp_agents").insert({
      name: name.trim(),
      description: description.trim(),
      endpoint_url: endpointUrl.trim(),
      input_schema: parsedSchema,
      owner,
      auth_required: authRequired,
      enabled: true,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agent registrato");
    onSaved();
    onDone();
  };

  return (
    <AdminCard className="p-5">
      <AdminSectionTitle eyebrow="New agent" title="Registra un nuovo agent" />
      <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Nome (slug)" hint="es. qualify_lead — usato come identificatore">
          <input
            required
            pattern="[a-z0-9_]+"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="qualify_lead"
            className="h-10 w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="Owner">
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value as typeof owner)}
            className="h-10 w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="shared">Shared (Pat + Stefano)</option>
            <option value="pat">Pat</option>
            <option value="stefano">Stefano</option>
          </select>
        </Field>
        <Field label="Descrizione" hint="Vista da Claude per scegliere quando usare il tool — sii specifico" className="md:col-span-2">
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Analizza un lead e suggerisce stage e lost_reason in base al testo delle note."
            className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="Endpoint URL" hint="HTTPS dell'agent (Lovable Edge Function, Worker, ecc.)" className="md:col-span-2">
          <input
            required
            type="url"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://functions.supabase.co/qualify-lead"
            className="h-10 w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="Input Schema (JSON Schema)" className="md:col-span-2">
          <textarea
            value={inputSchema}
            onChange={(e) => setInputSchema(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
          />
        </Field>
        <Field label="Auth richiesta">
          <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={authRequired}
              onChange={(e) => setAuthRequired(e.target.checked)}
              className="h-4 w-4 accent-[var(--falcon-cyan)]"
            />
            Propaga JWT utente all'agent
          </label>
        </Field>
        <div className="flex items-end justify-end gap-2 md:col-span-2">
          <button
            type="button"
            onClick={onDone}
            className="h-10 rounded-xl border border-[rgba(255,255,255,0.06)] px-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] px-4 text-sm font-semibold text-primary shadow-[0_0_24px_rgba(0,212,255,0.15)] transition hover:bg-[rgba(0,212,255,0.14)] disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? "Salvataggio…" : "Registra agent"}
          </button>
        </div>
      </form>
    </AdminCard>
  );
}

// ────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ────────────────────────────────────────────────────────────────────

type McpAction = {
  id: string;
  created_at: string;
  user_email: string | null;
  user_role: string | null;
  tool_name: string;
  agent_id: string | null;
  input: unknown;
  output: unknown;
  status: "success" | "error";
  error_message: string | null;
  duration_ms: number | null;
  session_id: string | null;
};

function AuditSection() {
  const [actions, setActions] = useState<McpAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from("mcp_actions").select("*").order("created_at", { ascending: false }).limit(100);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setActions((data ?? []) as McpAction[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);

  if (!isSupabaseConfigured) return <NotConfigured />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["all", "success", "error"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === s
                ? "bg-[rgba(0,212,255,0.12)] text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Tutti" : s === "success" ? "Successi" : "Errori"}
          </button>
        ))}
      </div>

      <AdminCard className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="px-5 py-4">Quando</th>
                <th>Utente</th>
                <th>Tool</th>
                <th>Stato</th>
                <th className="text-right">Durata</th>
                <th className="px-5"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8">
                    <SkeletonRows />
                  </td>
                </tr>
              ) : !actions.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    Nessuna azione registrata.
                  </td>
                </tr>
              ) : (
                actions.flatMap((a) => {
                  const isOpen = expanded === a.id;
                  const rows = [
                    <tr key={a.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                      <td className="px-5 py-3 text-muted-foreground">
                        {format(new Date(a.created_at), "d MMM HH:mm:ss", { locale: it })}
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="font-medium">{a.user_email ?? "—"}</span>
                          {a.user_role && <span className="text-[10px] uppercase text-muted-foreground">{a.user_role}</span>}
                        </div>
                      </td>
                      <td className="font-mono text-xs text-primary">{a.tool_name}</td>
                      <td>
                        <StatusPill status={a.status} />
                      </td>
                      <td className="text-right text-muted-foreground">{a.duration_ms ? `${a.duration_ms}ms` : "—"}</td>
                      <td className="px-5 text-right">
                        <button
                          onClick={() => setExpanded(isOpen ? null : a.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {isOpen ? "Chiudi" : "Dettagli"}
                        </button>
                      </td>
                    </tr>,
                  ];
                  if (isOpen) {
                    rows.push(
                      <tr key={`${a.id}-detail`} className="border-b border-[rgba(255,255,255,0.06)]">
                        <td colSpan={6} className="bg-[rgba(0,212,255,0.02)] px-5 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <CodeBlock title="Input" data={a.input} />
                            <CodeBlock title={a.status === "error" ? "Errore" : "Output"} data={a.status === "error" ? a.error_message : a.output} />
                          </div>
                        </td>
                      </tr>,
                    );
                  }
                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

function CodeBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <div>
      <p className="label-section mb-2">{title}</p>
      <pre className="max-h-64 overflow-auto rounded-xl border border-[rgba(0,212,255,0.1)] bg-[rgba(0,0,0,0.4)] p-3 text-[11px] font-mono text-foreground">
        {data == null ? "—" : typeof data === "string" ? data : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// CONNECT
// ────────────────────────────────────────────────────────────────────

function ConnectSection() {
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [minted, setMinted] = useState<string | null>(null);
  const gatewayUrl = import.meta.env.VITE_MCP_GATEWAY_URL ?? "https://falcon-mcp.<your-account>.workers.dev";

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("mcp_tokens")
      .select("id, name, last_used_at, created_at, revoked_at, expires_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTokens((data ?? []) as McpToken[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const createToken = async () => {
    if (!supabase) return;
    const name = newName.trim();
    if (!name) {
      toast.error("Dai un nome al token (es. 'Claude Code  laptop')");
      return;
    }
    setCreating(true);
    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes.user) throw new Error("Non autenticato");

      const rand = new Uint8Array(32);
      crypto.getRandomValues(rand);
      const plaintext = "fmcp_" + base64UrlEncode(rand);
      const hash = await sha256Hex(plaintext);

      const { error } = await supabase.from("mcp_tokens").insert({
        user_id: userRes.user.id,
        name,
        token_hash: hash,
        scopes: ["*"],
      });
      if (error) throw error;

      setMinted(plaintext);
      setNewName("");
      await load();
      toast.success("Token creato  copialo subito, non lo rivedrai");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore creazione token");
    } finally {
      setCreating(false);
    }
  };

  const revokeToken = async (token: McpToken) => {
    if (!supabase) return;
    if (!confirm(`Revocare il token "${token.name}"?`)) return;
    const { error } = await supabase
      .from("mcp_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", token.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Token revocato");
      load();
    }
  };

  if (!isSupabaseConfigured) return <NotConfigured />;

  const tokenForSnippet = minted ?? "<INCOLLA_QUI_IL_TOKEN>";
  const claudeCodeCli = `claude mcp add --transport http --scope user falcon \\\n  ${gatewayUrl} \\\n  --header "Authorization: Bearer ${tokenForSnippet}"`;
  const claudeCodeJson = JSON.stringify(
    {
      mcpServers: {
        falcon: {
          type: "http",
          url: gatewayUrl,
          headers: { Authorization: `Bearer ${tokenForSnippet}` },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="space-y-5">
      <AdminCard className="p-5">
        <div className="flex items-center justify-between">
          <AdminSectionTitle eyebrow="Step 1" title="Genera un token personale" />
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Il token autentica Claude verso il gateway al posto tuo. Mostrato una volta sola: salvalo nel password manager.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Es. Claude Code  laptop"
            className="flex-1 rounded-xl border border-[rgba(0,212,255,0.1)] bg-[rgba(0,0,0,0.4)] px-3 py-2 text-sm text-foreground outline-none focus:border-[rgba(0,212,255,0.4)]"
            disabled={creating}
            onKeyDown={(e) => {
              if (e.key === "Enter") void createToken();
            }}
          />
          <button
            onClick={() => void createToken()}
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.32)] bg-[rgba(0,212,255,0.08)] px-4 py-2 text-sm font-semibold text-primary hover:bg-[rgba(0,212,255,0.14)] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Generazione..." : "Genera token"}
          </button>
        </div>

        {minted && (
          <div className="mt-4 rounded-xl border border-[rgba(52,211,153,0.32)] bg-[rgba(52,211,153,0.06)] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#34d399]">
              <CheckCircle2 className="h-4 w-4" /> Token creato  copialo ora
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[rgba(52,211,153,0.2)] bg-[rgba(0,0,0,0.45)] p-3">
              <code className="flex-1 break-all text-xs font-mono text-foreground">{minted}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(minted);
                  toast.success("Token copiato");
                }}
                className="rounded-lg border border-[rgba(52,211,153,0.32)] px-2.5 py-1 text-xs font-semibold text-[#34d399] hover:bg-[rgba(52,211,153,0.1)]"
              >
                Copia
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Se chiudi questa pagina senza copiarlo non potrai recuperarlo: dovrai revocarlo e generarne un altro.
            </p>
          </div>
        )}
      </AdminCard>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Step 2A" title="Collega Claude Code (CLI)" />
        <p className="mt-3 text-sm text-muted-foreground">
          Comando one-shot da terminale (sostituisce `&lt;INCOLLA_QUI_IL_TOKEN&gt;` con quello generato sopra se non l'hai già fatto):
        </p>
        <CodeBlock title="terminale" data={claudeCodeCli} />
        <p className="mt-4 text-xs text-muted-foreground">
          In alternativa, aggiungi questo blocco in <code className="rounded bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-xs font-mono text-primary">~/.claude.json</code>:
        </p>
        <CodeBlock title="~/.claude.json" data={claudeCodeJson} />
      </AdminCard>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Step 2B" title="Collega Claude AI (web/desktop)" />
        <p className="mt-3 text-sm text-muted-foreground">
          Claude.ai → Settings → Connectors → Aggiungi connettore personalizzato. Incolla solo questo URL:
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.1)] bg-[rgba(0,0,0,0.4)] p-3">
          <Link2 className="h-4 w-4 text-primary" />
          <code className="flex-1 text-xs font-mono text-foreground">{gatewayUrl}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(gatewayUrl);
              toast.success("URL copiato");
            }}
            className="rounded-lg border border-[rgba(0,212,255,0.14)] px-2.5 py-1 text-xs text-primary hover:bg-[rgba(0,212,255,0.08)]"
          >
            Copia
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          I campi OAuth restano vuoti: Claude scopre l'auth da solo via metadata. Al primo uso ti chiederà di accedere col tuo account Falcon  e il token long-lived viene creato in automatico (lo vedi sotto in "I tuoi token attivi").
        </p>
      </AdminCard>

      <AdminCard className="p-0">
        <div className="flex items-center justify-between p-5">
          <AdminSectionTitle eyebrow="Step 3" title="I tuoi token attivi" />
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="px-5 py-3">Nome</th>
                <th>Creato</th>
                <th>Ultimo uso</th>
                <th>Stato</th>
                <th className="px-5 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8">
                    <SkeletonRows />
                  </td>
                </tr>
              ) : !tokens.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    Nessun token. Generane uno qui sopra per collegare Claude.
                  </td>
                </tr>
              ) : (
                tokens.map((t) => {
                  const revoked = !!t.revoked_at;
                  return (
                    <tr key={t.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                      <td className="px-5 py-3 font-medium">{t.name}</td>
                      <td className="text-muted-foreground">
                        {format(new Date(t.created_at), "d MMM yyyy", { locale: it })}
                      </td>
                      <td className="text-muted-foreground">
                        {t.last_used_at ? format(new Date(t.last_used_at), "d MMM HH:mm", { locale: it }) : "mai"}
                      </td>
                      <td>
                        <span
                          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            color: revoked ? "#f87171" : "#34d399",
                            background: revoked ? "rgba(248,113,113,0.08)" : "rgba(52,211,153,0.08)",
                            borderColor: revoked ? "rgba(248,113,113,0.32)" : "rgba(52,211,153,0.32)",
                          }}
                        >
                          {revoked ? "Revocato" : "Attivo"}
                        </span>
                      </td>
                      <td className="px-5 text-right">
                        {!revoked && (
                          <button
                            onClick={() => revokeToken(t)}
                            className="text-xs font-semibold text-destructive hover:underline"
                          >
                            Revoca
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

function base64UrlEncode(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type McpToken = {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
  expires_at: string | null;
};

// ────────────────────────────────────────────────────────────────────
// SHARED PIECES
// ────────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: "success" | "error" }) {
  const ok = status === "success";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        color: ok ? "#34d399" : "#f87171",
        background: ok ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
        borderColor: ok ? "rgba(52,211,153,0.32)" : "rgba(248,113,113,0.32)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: ok ? "#34d399" : "#f87171" }}
      />
      {ok ? "Success" : "Error"}
    </span>
  );
}

function OwnerPill({ owner }: { owner: McpAgent["owner"] }) {
  const palette = {
    pat: { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.32)" },
    stefano: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.32)" },
    shared: { color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.32)" },
  }[owner];
  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ color: palette.color, background: palette.bg, borderColor: palette.border }}
    >
      {owner}
    </span>
  );
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SkeletonRows({ compact = false }: { compact?: boolean }) {
  const rows = compact ? 3 : 4;
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-[rgba(255,255,255,0.04)]" />
      ))}
    </div>
  );
}

function EmptyState({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <div className={`text-center text-sm text-muted-foreground ${compact ? "py-4" : "py-10"}`}>
      {text}
    </div>
  );
}

function NotConfigured() {
  return (
    <AdminCard className="p-6">
      <p className="text-sm text-muted-foreground">
        Supabase non è configurato. Imposta le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in <code className="rounded bg-[rgba(255,255,255,0.05)] px-1 text-xs font-mono">.env</code>.
      </p>
    </AdminCard>
  );
}
