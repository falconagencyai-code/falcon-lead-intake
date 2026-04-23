import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Cpu, Settings2, TrendingDown, TrendingUp, Wallet, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/ai-monitor")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — AI Monitor" },
      { name: "description", content: "Monitoraggio costi e utilizzo AI per progetto Falcon Agency." },
    ],
  }),
  component: AIMonitorPage,
});

type Project = {
  id: string;
  client: string;
  project: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  contractValue: number;
  prevCost: number;
  threshold: number;
};

const PRICING: Record<string, { in: number; out: number }> = {
  "Claude Sonnet 4.5": { in: 3, out: 15 },
  "Claude Opus 4": { in: 15, out: 75 },
  "GPT-4o": { in: 2.5, out: 10 },
  "GPT-4o mini": { in: 0.15, out: 0.6 },
  "Gemini 2.5 Pro": { in: 1.25, out: 10 },
};

const initialProjects: Project[] = [
  { id: "p1", client: "Aurora Labs", project: "Piattaforma AI predictive", model: "Claude Sonnet 4.5", inputTokens: 142_000_000, outputTokens: 38_000_000, contractValue: 42000, prevCost: 1820, threshold: 20 },
  { id: "p2", client: "Mesh AI", project: "Agent customer support", model: "Claude Opus 4", inputTokens: 28_000_000, outputTokens: 9_500_000, contractValue: 31000, prevCost: 980, threshold: 20 },
  { id: "p3", client: "Nova Retail", project: "Recommendation engine", model: "GPT-4o", inputTokens: 88_000_000, outputTokens: 22_000_000, contractValue: 28500, prevCost: 540, threshold: 20 },
  { id: "p4", client: "Zenith Group", project: "Workflow automation", model: "GPT-4o mini", inputTokens: 320_000_000, outputTokens: 95_000_000, contractValue: 18700, prevCost: 102, threshold: 20 },
  { id: "p5", client: "Atlas Partners", project: "RAG knowledge base", model: "Claude Sonnet 4.5", inputTokens: 65_000_000, outputTokens: 14_000_000, contractValue: 12400, prevCost: 380, threshold: 15 },
  { id: "p6", client: "Orbit Studio", project: "Content generator", model: "Gemini 2.5 Pro", inputTokens: 42_000_000, outputTokens: 11_500_000, contractValue: 9800, prevCost: 175, threshold: 20 },
];

function calcCost(p: Project) {
  const price = PRICING[p.model];
  const inCost = (p.inputTokens / 1_000_000) * price.in;
  const outCost = (p.outputTokens / 1_000_000) * price.out;
  return (inCost + outCost) * 0.92; // USD→EUR approx
}

const trendChartData = [
  { month: "Feb", Aurora: 1240, Mesh: 720, Nova: 410, Zenith: 78, Atlas: 290 },
  { month: "Mar", Aurora: 1820, Mesh: 980, Nova: 540, Zenith: 102, Atlas: 380 },
  { month: "Apr", Aurora: 2280, Mesh: 1140, Nova: 670, Zenith: 132, Atlas: 470 },
];

const tooltipStyle = { background: "#070b14", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16 };
const fmtEur = (n: number) => `€${n.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
const fmtTok = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1000).toFixed(0)}k`;

function AIMonitorPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftThreshold, setDraftThreshold] = useState<string>("");

  const enriched = useMemo(() => {
    return projects.map((p) => {
      const cost = calcCost(p);
      const margin = ((p.contractValue - cost) / p.contractValue) * 100;
      const trend = ((cost - p.prevCost) / p.prevCost) * 100;
      const ratio = (cost / p.contractValue) * 100;
      return { ...p, cost, margin, trend, ratio, totalTokens: p.inputTokens + p.outputTokens };
    });
  }, [projects]);

  const totals = useMemo(() => {
    const cost = enriched.reduce((s, p) => s + p.cost, 0);
    const tokens = enriched.reduce((s, p) => s + p.totalTokens, 0);
    const top = [...enriched].sort((a, b) => b.cost - a.cost)[0];
    const alerts = enriched.filter((p) => p.ratio > p.threshold).length;
    return { cost, tokens, top, alerts };
  }, [enriched]);

  const topFive = useMemo(() => {
    const top5Ids = [...enriched].sort((a, b) => b.cost - a.cost).slice(0, 5).map((p) => p.client.split(" ")[0]);
    return trendChartData.map((m) => {
      const row: Record<string, string | number> = { month: m.month };
      top5Ids.forEach((k) => { row[k] = (m as Record<string, number | string>)[k] as number ?? 0; });
      return row;
    });
  }, [enriched]);

  const alertProjects = enriched.filter((p) => p.ratio > p.threshold * 0.75);

  const colors = ["#00d4ff", "#a78bfa", "#34d399", "#f59e0b", "#f87171"];

  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">AI cost intelligence</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          AI <span className="text-primary text-glow">Monitor</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Costi token e margini per progetto. Dati mock — pronti per l'integrazione Anthropic Usage API.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi icon={Wallet} title="Costo totale mese" value={fmtEur(totals.cost)} meta="aprile 2026" tone="cyan" />
        <AdminKpi icon={Zap} title="Token consumati" value={fmtTok(totals.tokens)} meta="input + output" tone="cyan" />
        <AdminKpi icon={Cpu} title="Progetto più costoso" value={totals.top.client} meta={fmtEur(totals.top.cost)} tone="orange" />
        <AdminKpi icon={AlertTriangle} title="Alert attivi" value={`${totals.alerts}`} meta="sopra soglia" tone="orange" />
      </section>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Per progetto" title="Costi & margini AI" />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Cliente · Progetto</th>
                <th>Modello</th>
                <th className="text-right">Input</th>
                <th className="text-right">Output</th>
                <th className="text-right">Costo</th>
                <th className="text-right">Margine</th>
                <th className="text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((p) => {
                const trendUp = p.trend >= 0;
                const TrendIcon = trendUp ? TrendingUp : TrendingDown;
                const trendColor = trendUp ? "#f87171" : "#34d399";
                const marginColor = p.margin > 90 ? "#34d399" : p.margin > 75 ? "#facc15" : "#f87171";
                return (
                  <tr key={p.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                    <td className="py-4">
                      <p className="font-medium">{p.client}</p>
                      <p className="text-xs text-muted-foreground">{p.project}</p>
                    </td>
                    <td>
                      <span className="inline-flex items-center rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] px-2.5 py-1 text-xs font-semibold text-[#a78bfa]">
                        {p.model}
                      </span>
                    </td>
                    <td className="text-right text-muted-foreground">{fmtTok(p.inputTokens)}</td>
                    <td className="text-right text-muted-foreground">{fmtTok(p.outputTokens)}</td>
                    <td className="text-right font-semibold text-foreground">{fmtEur(p.cost)}</td>
                    <td className="text-right font-semibold" style={{ color: marginColor }}>{p.margin.toFixed(1)}%</td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: trendColor }}>
                        <TrendIcon className="h-3.5 w-3.5" />
                        {trendUp ? "+" : ""}{p.trend.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Trend 3 mesi" title="Top 5 progetti per costo AI" />
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topFive} margin={{ left: -10, right: 14, top: 12 }}>
              <CartesianGrid stroke="rgba(0,212,255,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtEur(v)} />
              {Object.keys(topFive[0]).filter((k) => k !== "month").map((k, i) => (
                <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminCard>

      <AdminCard className="p-5">
        <div className="flex items-center justify-between">
          <AdminSectionTitle eyebrow="Soglie" title="Alert su margine AI" />
          <span className="text-xs text-muted-foreground">Soglia = % costo AI sul valore contratto</span>
        </div>
        <div className="mt-5 space-y-3">
          {alertProjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Nessun progetto vicino o oltre soglia.</p>
          )}
          {alertProjects.map((p) => {
            const over = p.ratio > p.threshold;
            const warn = !over && p.ratio > p.threshold * 0.75;
            const color = over ? "#f87171" : "#facc15";
            const bg = over ? "rgba(248,113,113,0.08)" : "rgba(250,204,21,0.06)";
            const border = over ? "rgba(248,113,113,0.32)" : "rgba(250,204,21,0.28)";
            const isEditing = editingId === p.id;
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                style={{ background: bg, borderColor: border }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} />
                  <div>
                    <p className="font-semibold text-foreground">{p.client} — {p.project}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Costo AI {fmtEur(p.cost)} su contratto {fmtEur(p.contractValue)} —{" "}
                      <span className="font-semibold" style={{ color }}>
                        {p.ratio.toFixed(1)}% (soglia {p.threshold}%)
                      </span>
                      {over ? " · oltre soglia" : warn ? " · in avvicinamento" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={draftThreshold}
                        onChange={(e) => setDraftThreshold(e.target.value)}
                        className="w-20 rounded-xl border border-[rgba(0,212,255,0.25)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => {
                          const v = Math.max(1, Math.min(100, Number(draftThreshold) || p.threshold));
                          setProjects((list) => list.map((x) => x.id === p.id ? { ...x, threshold: v } : x));
                          setEditingId(null);
                        }}
                        className="rounded-xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] px-3 py-2 text-xs font-semibold text-primary"
                      >
                        Salva
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditingId(p.id); setDraftThreshold(String(p.threshold)); }}
                      className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.1)] px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Imposta soglia
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}
