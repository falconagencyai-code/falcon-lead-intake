import { createFileRoute } from "@tanstack/react-router";
import { BarChart2, CheckCircle2, Clock, TrendingDown, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const funnelSteps = [
  { step: "Step 1 · Servizio", visits: 1240 },
  { step: "Step 2 · Dettagli", visits: 842 },
  { step: "Step 3 · Budget", visits: 614 },
  { step: "Step 4 · Contatto", visits: 387 },
  { step: "Step 5 · Invio", visits: 248 },
];

const funnelData = funnelSteps.map((s, i) => {
  const prev = i === 0 ? s.visits : funnelSteps[i - 1].visits;
  const pct = i === 0 ? 100 : Math.round((s.visits / prev) * 100);
  return { ...s, pct };
});

const weeklyData = [
  { day: "1 Apr", invii: 4 }, { day: "3 Apr", invii: 6 }, { day: "5 Apr", invii: 3 },
  { day: "7 Apr", invii: 8 }, { day: "9 Apr", invii: 7 }, { day: "11 Apr", invii: 5 },
  { day: "13 Apr", invii: 9 }, { day: "15 Apr", invii: 12 }, { day: "17 Apr", invii: 8 },
  { day: "19 Apr", invii: 11 }, { day: "21 Apr", invii: 14 }, { day: "23 Apr", invii: 10 },
  { day: "25 Apr", invii: 13 }, { day: "27 Apr", invii: 16 }, { day: "30 Apr", invii: 18 },
];

const totalVisits = funnelData[0].visits;
const completionRate = Math.round((funnelData[4].visits / funnelData[0].visits) * 100);

const dropoffs = funnelData.slice(1).map((s, i) => ({
  step: s.step,
  drop: funnelData[i].visits - s.visits,
}));
const worstDrop = dropoffs.reduce((a, b) => (b.drop > a.drop ? b : a));

const tooltipStyle = { background: "#070b14", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16 };

function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Funnel · form-contatto-1</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Analytics <span className="text-primary text-glow">Funnel</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Metriche del funnel del form di contatto. Dati mock — pronti per essere collegati a Lovable Cloud.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi icon={Users} title="Totale visite form" value={totalVisits.toLocaleString("it-IT")} meta="ultimi 30 giorni" tone="cyan" />
        <AdminKpi icon={CheckCircle2} title="Tasso completamento" value={`${completionRate}%`} meta="step 5 / step 1" tone="green" />
        <AdminKpi icon={TrendingDown} title="Step con più abbandoni" value={`-${worstDrop.drop}`} meta={worstDrop.step} tone="orange" />
        <AdminKpi icon={Clock} title="Tempo medio stimato" value="2m 14s" meta="durata compilazione" tone="cyan" />
      </section>

      <AdminCard className="p-5">
        <div className="flex items-center justify-between gap-4">
          <AdminSectionTitle eyebrow="Conversion" title="Funnel di compilazione" />
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <BarChart2 className="h-4 w-4 text-primary" />
            5 step monitorati
          </div>
        </div>
        <div className="mt-6 h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 40, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="rgba(0,212,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="step"
                stroke="var(--falcon-subtle)"
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(0,212,255,0.06)" }}
                formatter={(value: number, _name, item) => [`${value.toLocaleString("it-IT")} visite (${item.payload.pct}%)`, "Step"]}
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
      </AdminCard>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Trend" title="Invii completati — ultimi 30 giorni" />
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData} margin={{ left: -10, right: 14, top: 12 }}>
              <CartesianGrid stroke="rgba(0,212,255,0.08)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
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
