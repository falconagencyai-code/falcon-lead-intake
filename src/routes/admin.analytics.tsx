import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, CheckCircle2, Clock, ExternalLink, TrendingDown, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Analytics" },
      { name: "description", content: "Analytics funnel del form di contatto Falcon Agency." },
    ],
  }),
  component: AnalyticsPage,
});

const STEP_LABELS = ["Servizio", "Dettagli", "Budget", "Contatto", "Invio"];

const tooltipStyle = {
  background: "#070b14",
  border: "1px solid rgba(0,212,255,0.2)",
  borderRadius: 16,
};

type FormEvent = { step: number; session_id: string; created_at: string };
type LeadRow = { created_at: string };

type RangePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Oggi" },
  { id: "yesterday", label: "Ieri" },
  { id: "7d", label: "7 giorni" },
  { id: "30d", label: "30 giorni" },
  { id: "custom", label: "Personalizzato" },
];

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
  if (preset === "today") return { from: startOfDay(today), to: endOfDay(today), days: 1 };
  if (preset === "yesterday") {
    const y = new Date(now);
    y.setUTCDate(now.getUTCDate() - 1);
    const yi = y.toISOString().slice(0, 10);
    return { from: startOfDay(yi), to: endOfDay(yi), days: 1 };
  }
  if (preset === "7d") {
    const s = new Date(now);
    s.setUTCDate(now.getUTCDate() - 6);
    return { from: startOfDay(s.toISOString().slice(0, 10)), to: endOfDay(today), days: 7 };
  }
  if (preset === "30d") {
    const s = new Date(now);
    s.setUTCDate(now.getUTCDate() - 29);
    return { from: startOfDay(s.toISOString().slice(0, 10)), to: endOfDay(today), days: 30 };
  }
  // custom
  const f = customFrom || today;
  const t = customTo || today;
  const days = Math.max(
    1,
    Math.round((new Date(t).getTime() - new Date(f).getTime()) / (24 * 3600 * 1000)) + 1,
  );
  return { from: startOfDay(f), to: endOfDay(t), days };
}

function AnalyticsPage() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<RangePreset>("30d");
  const today = todayISO();
  const [customFrom, setCustomFrom] = useState<string>(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState<string>(today);

  const range = useMemo(
    () => computeRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const { data: events = [], isLoading: loadingEvents } = useQuery<FormEvent[]>({
    queryKey: ["form_events", range.from, range.to],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("form_events")
        .select("step, session_id, created_at")
        .gte("created_at", range.from)
        .lte("created_at", range.to);
      if (error) throw error;
      return (data ?? []) as FormEvent[];
    },
    enabled: isSupabaseConfigured,
  });

  const { data: leads = [] } = useQuery<LeadRow[]>({
    queryKey: ["leads", "range", range.from, range.to],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", range.from)
        .lte("created_at", range.to);
      if (error) throw error;
      return (data ?? []) as LeadRow[];
    },
    enabled: isSupabaseConfigured,
  });

  // Funnel aggregation
  const funnelData = [1, 2, 3, 4, 5].map((n, i) => {
    const visits = new Set(
      events.filter((e) => e.step === n).map((e) => e.session_id),
    ).size;
    return { step: `Step ${n} · ${STEP_LABELS[i]}`, visits, pct: 0 };
  });
  funnelData.forEach((s, i) => {
    if (i === 0) {
      s.pct = 100;
    } else {
      const prev = funnelData[i - 1].visits;
      s.pct = prev ? Math.round((s.visits / prev) * 100) : 0;
    }
  });

  const totalVisits = funnelData[0].visits;
  const completed = funnelData[4].visits;
  const completionRate = totalVisits ? Math.round((completed / totalVisits) * 100) : 0;
  const completionMeta = totalVisits
    ? `${completed} ${completed === 1 ? "persona" : "persone"} su ${totalVisits} che ${totalVisits === 1 ? "apre" : "aprono"} il form ${completed === 1 ? "lo completa" : "lo completano"}`
    : "nessun dato nel periodo";

  const dropoffs = funnelData.slice(1).map((s, i) => ({
    step: s.step,
    drop: Math.max(0, funnelData[i].visits - s.visits),
  }));
  const stepsWithSessions = funnelData.filter((s) => s.visits > 0).length;
  const hasEnoughData = stepsWithSessions >= 2;
  const worstDrop = hasEnoughData
    ? dropoffs.reduce((a, b) => (b.drop > a.drop ? b : a), { step: "—", drop: 0 })
    : { step: "—", drop: 0 };
  const worstDropAvailable = hasEnoughData && worstDrop.drop > 0;

  // Trend chart from leads (granularity: days in range)
  const trendData = useMemo(() => {
    const days: { day: string; invii: number; key: string }[] = [];
    const end = new Date(range.to);
    for (let i = range.days - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setUTCDate(end.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
      days.push({ day: label, invii: 0, key });
    }
    const counts = new Map<string, number>();
    for (const l of leads) {
      const k = new Date(l.created_at).toISOString().slice(0, 10);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return days.map((d) => ({ day: d.day, invii: counts.get(d.key) ?? 0 }));
  }, [leads, range.to, range.days]);

  const hasFunnelData = events.length > 0;

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label-section">Funnel · form-contatto-1</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Analytics <span className="text-primary text-glow">Funnel</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Metriche reali del funnel del form di contatto. Aggiornate in tempo reale.
          </p>
        </div>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => navigate({ to: "/admin/ads" })}
                className="btn-ghost inline-flex items-center gap-2 text-sm"
                style={{
                  border: "1px solid rgba(0,212,255,0.4)",
                  color: "#00d4ff",
                  background: "rgba(0,212,255,0.04)",
                }}
              >
                🎯 Collega Ads
                <ExternalLink className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              Vai alla sezione Ads per collegare Facebook Business Manager
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi
          icon={Users}
          title="Totale visite form"
          value={totalVisits.toLocaleString("it-IT")}
          meta="sessioni uniche"
          tone="cyan"
        />
        <AdminKpi
          icon={CheckCircle2}
          title="Completano il form"
          value={`${completionRate}%`}
          meta={completionMeta}
          tone="green"
        />
        <AdminKpi
          icon={TrendingDown}
          title="Step con più abbandoni"
          value={worstDropAvailable ? `${worstDrop.drop} ${worstDrop.drop === 1 ? "sessione" : "sessioni"}` : "N/D"}
          meta={worstDropAvailable ? worstDrop.step : "dati insufficienti"}
          tone="orange"
        />
        <AdminKpi
          icon={Clock}
          title="Lead nel periodo"
          value={leads.length.toLocaleString("it-IT")}
          meta="invii completati"
          tone="cyan"
        />
      </section>

      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4">
          <AdminSectionTitle eyebrow="Conversion" title="Funnel di compilazione" />
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <BarChart2 className="h-4 w-4 text-primary" />
            5 step monitorati
          </div>
        </div>

        {!hasFunnelData && !loadingEvents ? (
          <div className="mt-6 flex h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.03)] text-center">
            <BarChart2 className="h-10 w-10 text-primary/60" />
            <p className="mt-4 text-sm font-medium text-foreground">Nessun dato funnel</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              I prossimi visitatori del form appariranno qui non appena raggiungono uno step.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 40, top: 8, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(0,212,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="step"
                    stroke="var(--falcon-subtle)"
                    tickLine={false}
                    axisLine={false}
                    width={140}
                  />
                  <ReTooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(0,212,255,0.06)" }}
                    formatter={(value: number, _name, item) => [
                      `${value.toLocaleString("it-IT")} sessioni (${item.payload.pct}%)`,
                      "Step",
                    ]}
                  />
                  <Bar
                    dataKey="visits"
                    fill="#00d4ff"
                    background={{ fill: "rgba(0,212,255,0.08)" }}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid gap-2 md:grid-cols-5">
              {funnelData.map((s, i) => (
                <div key={s.step} className="rounded-2xl border border-[rgba(0,212,255,0.12)] bg-[rgba(0,212,255,0.04)] p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Step {i + 1}</p>
                  <p className="mt-2 text-lg font-bold text-foreground">{s.visits.toLocaleString("it-IT")}</p>
                  <p className="mt-1 text-xs text-primary">{s.pct}% vs precedente</p>
                </div>
              ))}
            </div>
          </>
        )}
      </AdminCard>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Trend" title="Invii completati nel periodo" />
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ left: -10, right: 14, top: 12 }}>
              <CartesianGrid stroke="rgba(0,212,255,0.08)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} allowDecimals={false} />
              <ReTooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="invii"
                stroke="#00d4ff"
                strokeWidth={3}
                dot={{ r: 4, fill: "#00d4ff", stroke: "#070b14", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AdminCard>
    </div>
  );
}
