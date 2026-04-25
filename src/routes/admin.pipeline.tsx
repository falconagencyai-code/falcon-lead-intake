import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2, Users, XCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

import { AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Pipeline" },
      { name: "description", content: "Analisi conversioni e perdite lead della pipeline Falcon Agency." },
    ],
  }),
  component: PipelinePage,
});

type LeadRow = {
  pipeline_stage: string | null;
  lost_reason: string | null;
  created_at: string;
};

type RangePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Oggi" },
  { id: "yesterday", label: "Ieri" },
  { id: "7d", label: "7 giorni" },
  { id: "30d", label: "30 giorni" },
  { id: "custom", label: "Personalizzato" },
];

const STAGES: { id: string; label: string; color: string }[] = [
  { id: "form_compilato", label: "Form compilato", color: "rgba(0,212,255,1)" },
  { id: "contattato", label: "Contattato", color: "rgba(0,212,255,0.85)" },
  { id: "call_schedulata", label: "Call schedulata", color: "rgba(0,212,255,0.7)" },
  { id: "call_effettuata", label: "Call effettuata", color: "rgba(0,212,255,0.55)" },
  { id: "no_show", label: "No show", color: "#f97316" },
  { id: "preventivo_inviato", label: "Preventivo inviato", color: "rgba(0,212,255,0.4)" },
  { id: "chiuso_vinto", label: "Chiuso vinto", color: "#22c55e" },
  { id: "chiuso_perso", label: "Chiuso perso", color: "#ef4444" },
];

const INTERMEDIATE_STAGES = new Set([
  "form_compilato",
  "contattato",
  "call_schedulata",
  "call_effettuata",
  "no_show",
  "preventivo_inviato",
]);

const LOST_REASONS: { id: string; label: string; color: string }[] = [
  { id: "prezzo_troppo_alto", label: "Prezzo troppo alto", color: "#ef4444" },
  { id: "non_si_e_presentato", label: "Non si è presentato", color: "#f97316" },
  { id: "nessuna_risposta", label: "Nessuna risposta", color: "#facc15" },
  { id: "non_convinto", label: "Non convinto", color: "#a855f7" },
  { id: "altro", label: "Altro", color: "#64748b" },
];

const tooltipStyle = {
  background: "#070b14",
  border: "1px solid rgba(0,212,255,0.2)",
  borderRadius: 16,
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function startOfDay(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`).toISOString();
}
function endOfDay(iso: string) {
  return new Date(`${iso}T23:59:59.999Z`).toISOString();
}
function computeRange(preset: RangePreset, customFrom: string, customTo: string) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (preset === "today") return { from: startOfDay(today), to: endOfDay(today) };
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setUTCDate(now.getUTCDate() - 1);
    const yi = y.toISOString().slice(0, 10);
    return { from: startOfDay(yi), to: endOfDay(yi) };
  }
  if (preset === "7d") {
    const s = new Date(now);
    s.setUTCDate(now.getUTCDate() - 6);
    return { from: startOfDay(s.toISOString().slice(0, 10)), to: endOfDay(today) };
  }
  if (preset === "30d") {
    const s = new Date(now);
    s.setUTCDate(now.getUTCDate() - 29);
    return { from: startOfDay(s.toISOString().slice(0, 10)), to: endOfDay(today) };
  }
  const f = customFrom || today;
  const t = customTo || today;
  return { from: startOfDay(f), to: endOfDay(t) };
}

function normalizeReason(raw: string | null): string {
  if (!raw) return "altro";
  const k = raw.toLowerCase().trim().replace(/\s+/g, "_").replace(/'/g, "");
  if (LOST_REASONS.some((r) => r.id === k)) return k;
  return "altro";
}

function PipelinePage() {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const today = todayISO();
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState<string>(today);

  const range = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const { data: leads = [], isLoading } = useQuery<LeadRow[]>({
    queryKey: ["leads-pipeline", range.from, range.to],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("pipeline_stage, lost_reason, created_at")
        .gte("created_at", range.from)
        .lte("created_at", range.to);
      if (error) throw error;
      return (data ?? []) as LeadRow[];
    },
    enabled: isSupabaseConfigured,
  });

  const total = leads.length;
  const withStage = leads.filter((l) => l.pipeline_stage);
  const won = leads.filter((l) => l.pipeline_stage === "chiuso_vinto").length;
  const lost = leads.filter((l) => l.pipeline_stage === "chiuso_perso").length;
  const inProgress = leads.filter(
    (l) => l.pipeline_stage && INTERMEDIATE_STAGES.has(l.pipeline_stage),
  ).length;

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const funnelData = STAGES.map((s) => {
    const count = leads.filter((l) => l.pipeline_stage === s.id).length;
    return {
      stage: s.label,
      id: s.id,
      count,
      color: s.color,
      pct: pct(count),
    };
  });

  // Lost reasons
  const lostLeads = leads.filter((l) => l.pipeline_stage === "chiuso_perso");
  const reasonCounts = new Map<string, number>();
  for (const l of lostLeads) {
    const k = normalizeReason(l.lost_reason);
    reasonCounts.set(k, (reasonCounts.get(k) ?? 0) + 1);
  }
  const reasonsData = LOST_REASONS.map((r) => ({
    id: r.id,
    label: r.label,
    color: r.color,
    count: reasonCounts.get(r.id) ?? 0,
  })).filter((r) => r.count > 0);
  const reasonsTotal = reasonsData.reduce((acc, r) => acc + r.count, 0);

  const hasPipelineData = withStage.length > 0;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Pipeline · Conversioni</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Pipeline <span className="text-primary text-glow">Lead</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Analisi conversioni e perdite lead lungo l&apos;intera pipeline commerciale.
        </p>
      </header>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => {
          const active = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition"
              style={
                active
                  ? {
                      color: "#00d4ff",
                      background: "rgba(0,212,255,0.12)",
                      borderColor: "rgba(0,212,255,0.5)",
                      boxShadow: "0 0 16px rgba(0,212,255,0.18)",
                    }
                  : {
                      color: "var(--falcon-subtle)",
                      background: "rgba(255,255,255,0.03)",
                      borderColor: "rgba(255,255,255,0.1)",
                    }
              }
            >
              {p.label}
            </button>
          );
        })}

        {preset === "custom" && (
          <div className="flex items-center gap-2 rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] px-3 py-1.5">
            <label className="text-xs font-medium text-muted-foreground">Da</label>
            <input
              type="date"
              value={customFrom}
              max={today}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none"
            />
            <span className="text-muted-foreground">→</span>
            <label className="text-xs font-medium text-muted-foreground">A</label>
            <input
              type="date"
              value={customTo}
              max={today}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent text-xs text-foreground outline-none"
            />
          </div>
        )}
      </div>

      {/* KPI */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi
          icon={Users}
          title="Lead totali nel periodo"
          value={total.toLocaleString("it-IT")}
          meta="lead acquisiti"
          tone="cyan"
        />
        <AdminKpi
          icon={CheckCircle2}
          title="% Convertiti"
          value={`${pct(won)}%`}
          meta={`${won} ${won === 1 ? "lead vinto" : "lead vinti"}`}
          tone="green"
        />
        <AdminKpi
          icon={XCircle}
          title="% Persi"
          value={`${pct(lost)}%`}
          meta={`${lost} ${lost === 1 ? "lead perso" : "lead persi"}`}
          tone="orange"
        />
        <AdminKpi
          icon={Activity}
          title="In lavorazione"
          value={`${pct(inProgress)}%`}
          meta={`${inProgress} ${inProgress === 1 ? "lead attivo" : "lead attivi"}`}
          tone="cyan"
        />
      </section>

      {/* Funnel pipeline */}
      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Funnel" title="Distribuzione per stage" />

        {!hasPipelineData && !isLoading ? (
          <div className="mt-6 flex h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.03)] text-center">
            <Activity className="h-10 w-10 text-primary/60" />
            <p className="mt-4 text-sm font-medium text-foreground">Nessun dato pipeline ancora</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Aggiorna lo stage dei lead dal drawer dettaglio per vedere le analisi.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 60, top: 8, bottom: 8 }}>
                  <XAxis type="number" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    stroke="var(--falcon-subtle)"
                    tickLine={false}
                    axisLine={false}
                    width={160}
                  />
                  <ReTooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(0,212,255,0.06)" }}
                    formatter={(value: number, _n, item) => [
                      `${value.toLocaleString("it-IT")} lead (${item.payload.pct}%)`,
                      "Stage",
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} background={{ fill: "rgba(0,212,255,0.06)" }}>
                    {funnelData.map((d) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid gap-2 md:grid-cols-4 xl:grid-cols-8">
              {funnelData.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border p-3"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.stage}
                    </p>
                  </div>
                  <p className="mt-2 text-lg font-bold text-foreground">{s.count}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.pct}% del totale</p>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminCard>

      {/* Lost reasons */}
      {reasonsData.length > 0 && (
        <AdminCard className="p-5">
          <AdminSectionTitle eyebrow="Perdite" title="Motivi di chiusura persa" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reasonsData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    stroke="#070b14"
                    strokeWidth={2}
                  >
                    {reasonsData.map((r) => (
                      <Cell key={r.id} fill={r.color} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      `${value} (${Math.round((value / reasonsTotal) * 100)}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {reasonsData.map((r) => {
                const p = Math.round((r.count / reasonsTotal) * 100);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: r.color }} />
                      <p className="text-sm font-medium text-foreground">{r.label}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{r.count} lead</span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{
                          color: r.color,
                          background: `${r.color}1f`,
                          border: `1px solid ${r.color}55`,
                        }}
                      >
                        {p}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
