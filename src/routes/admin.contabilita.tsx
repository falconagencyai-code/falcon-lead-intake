import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Download,
  DollarSign,
  Eye,
  Megaphone,
  MoreHorizontal,
  Pencil,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";
import { AdminBadge, AdminCard, AdminKpi, AdminSectionTitle, IconButton } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/contabilita")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Contabilità" },
      { name: "description", content: "Contabilità Falcon Agency: entrate, uscite, transazioni e categorie." },
    ],
  }),
  component: ContabilitaPage,
});

// =============== MOCK DATA ===============

const cashFlow = [
  { month: "Jan", entrate: 38000, uscite: 26500 },
  { month: "Feb", entrate: 42500, uscite: 28900 },
  { month: "Mar", entrate: 51000, uscite: 33200 },
  { month: "Apr", entrate: 47500, uscite: 31100 },
  { month: "Mag", entrate: 58000, uscite: 36800 },
  { month: "Giu", entrate: 62300, uscite: 38750 },
];

const expenseBreakdown = [
  { name: "Stipendi & collaboratori", value: 45, amount: 17440, color: "#1a2870" },
  { name: "Software & tools", value: 18, amount: 6975, color: "#00d4ff" },
  { name: "Marketing", value: 12, amount: 4650, color: "#8b5cf6" },
  { name: "Consulenze esterne", value: 10, amount: 3875, color: "#f59e0b" },
  { name: "Infrastruttura", value: 8, amount: 3100, color: "#22c55e" },
  { name: "Altro", value: 7, amount: 2710, color: "#6677aa" },
];

type TxType = "entrata" | "uscita";
type TxStatus = "Pagato" | "In attesa" | "Scaduto" | "Programmato";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  party: string;
  amount: number;
  type: TxType;
  status: TxStatus;
}

const transactions: Transaction[] = [
  { id: "TX-0142", date: "23 Giu", description: "Fattura — Piattaforma AI", category: "Fattura cliente", party: "Aurora Labs", amount: 12000, type: "entrata", status: "Pagato" },
  { id: "TX-0141", date: "22 Giu", description: "Stipendio Dev Senior", category: "Stipendio", party: "Marco R.", amount: 3200, type: "uscita", status: "Pagato" },
  { id: "TX-0140", date: "21 Giu", description: "Fattura — Sito Web", category: "Fattura cliente", party: "Nova Retail", amount: 3500, type: "entrata", status: "Pagato" },
  { id: "TX-0139", date: "20 Giu", description: "Google Ads — Q2", category: "Marketing", party: "Google Ireland", amount: 1500, type: "uscita", status: "Pagato" },
  { id: "TX-0138", date: "19 Giu", description: "Claude API — uso mensile", category: "Software", party: "Anthropic", amount: 280, type: "uscita", status: "Pagato" },
  { id: "TX-0137", date: "18 Giu", description: "Fattura — Automazione CRM", category: "Fattura cliente", party: "Zenith Group", amount: 8000, type: "entrata", status: "In attesa" },
  { id: "TX-0136", date: "17 Giu", description: "Figma — team plan", category: "Software", party: "Figma Inc.", amount: 45, type: "uscita", status: "Pagato" },
  { id: "TX-0135", date: "16 Giu", description: "Commercialista — Q2", category: "Consulenza", party: "Studio Conti", amount: 400, type: "uscita", status: "Pagato" },
  { id: "TX-0134", date: "15 Giu", description: "Fattura — Brand Identity", category: "Fattura cliente", party: "Orbit Studio", amount: 4200, type: "entrata", status: "Pagato" },
  { id: "TX-0133", date: "14 Giu", description: "AWS — infra production", category: "Infrastruttura", party: "Amazon Web Services", amount: 220, type: "uscita", status: "Pagato" },
  { id: "TX-0132", date: "13 Giu", description: "Fattura — Consulenza AI", category: "Fattura cliente", party: "Atlas Partners", amount: 2800, type: "entrata", status: "Scaduto" },
  { id: "TX-0131", date: "12 Giu", description: "Notion — workspace", category: "Software", party: "Notion Labs", amount: 16, type: "uscita", status: "Pagato" },
  { id: "TX-0130", date: "11 Giu", description: "Zoom — pro plan", category: "Software", party: "Zoom Inc.", amount: 15, type: "uscita", status: "Pagato" },
  { id: "TX-0129", date: "10 Giu", description: "Stipendio Designer", category: "Stipendio", party: "Bianca S.", amount: 2600, type: "uscita", status: "Pagato" },
  { id: "TX-0128", date: "09 Giu", description: "Fattura — E-commerce setup", category: "Fattura cliente", party: "Mesh AI", amount: 6400, type: "entrata", status: "Pagato" },
  { id: "TX-0127", date: "08 Giu", description: "Meta Ads — campagna lead", category: "Marketing", party: "Meta Platforms", amount: 980, type: "uscita", status: "Pagato" },
  { id: "TX-0126", date: "07 Giu", description: "Fattura — Maintenance", category: "Fattura cliente", party: "Nova Retail", amount: 1800, type: "entrata", status: "Programmato" },
  { id: "TX-0125", date: "06 Giu", description: "Linear — team", category: "Software", party: "Linear Orbit", amount: 32, type: "uscita", status: "Pagato" },
];

const monthlyRecap = [
  { month: "Gennaio", entrate: 38000, uscite: 26500 },
  { month: "Febbraio", entrate: 42500, uscite: 28900 },
  { month: "Marzo", entrate: 51000, uscite: 33200 },
  { month: "Aprile", entrate: 47500, uscite: 31100 },
  { month: "Maggio", entrate: 58000, uscite: 36800 },
  { month: "Giugno", entrate: 62300, uscite: 38750 },
];

const expenseCategories = [
  { name: "Stipendi & Collaboratori", icon: Users, spent: 17440, budget: 18000, trend: 4.2, color: "#1a2870" },
  { name: "Software & Tools", icon: Cpu, spent: 875, budget: 800, trend: 9.1, color: "#00d4ff" },
  { name: "Marketing", icon: Megaphone, spent: 2480, budget: 3000, trend: -6.4, color: "#8b5cf6" },
  { name: "Consulenze", icon: Wrench, spent: 3875, budget: 4000, trend: 2.1, color: "#f59e0b" },
  { name: "Infrastruttura", icon: Cpu, spent: 1080, budget: 1000, trend: 11.5, color: "#22c55e" },
  { name: "Varie", icon: MoreHorizontal, spent: 320, budget: 500, trend: -12.0, color: "#6677aa" },
];

// =============== HELPERS ===============

const eur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const categoryTone: Record<string, { color: string; bg: string; border: string }> = {
  "Fattura cliente": { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)" },
  Stipendio: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.3)" },
  Software: { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.3)" },
  Marketing: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
  Consulenza: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
  Infrastruttura: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)" },
};

function CategoryBadge({ category }: { category: string }) {
  const tone = categoryTone[category] ?? { color: "#6677aa", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" };
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
    >
      {category}
    </span>
  );
}

const tooltipStyle = {
  background: "rgba(7,11,20,0.95)",
  border: "1px solid rgba(0,212,255,0.25)",
  borderRadius: 14,
  backdropFilter: "blur(14px)",
};

// =============== PAGE ===============

type TabKey = "Tutte" | "Entrate" | "Uscite" | "In attesa";
const tabs: TabKey[] = ["Tutte", "Entrate", "Uscite", "In attesa"];
const PAGE_SIZE = 10;

function ContabilitaPage() {
  const [tab, setTab] = useState<TabKey>("Tutte");
  const [period, setPeriod] = useState("Questo mese");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (tab === "Tutte") return transactions;
    if (tab === "Entrate") return transactions.filter((t) => t.type === "entrata");
    if (tab === "Uscite") return transactions.filter((t) => t.type === "uscita");
    return transactions.filter((t) => t.status === "In attesa" || t.status === "Scaduto");
  }, [tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Falcon Agency</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Contabilità <span className="text-primary text-glow">Giugno</span>
        </h1>
      </header>

      {/* KPI ROW */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi icon={TrendingUp} title="Entrate totali" value="€62.300" meta="mese corrente" tone="green" />
        <AdminKpi icon={TrendingDown} title="Uscite totali" value="€38.750" meta="mese corrente" tone="orange" />
        <AdminCard className="glass-hover p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Utile netto</p>
              <p className="mt-3 text-3xl font-black text-foreground text-glow">€23.550</p>
              <span className="mt-2 inline-flex items-center rounded-full border border-[rgba(52,211,153,0.32)] bg-[rgba(52,211,153,0.1)] px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                +38% margine
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.16)] bg-[rgba(255,255,255,0.04)] text-primary shadow-[0_0_24px_rgba(0,212,255,0.25)]">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </AdminCard>
        <AdminCard className="glass-hover p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fatture in attesa</p>
              <p className="mt-3 text-3xl font-black text-foreground text-glow">€9.200</p>
              <p className="mt-2 text-sm text-amber-400">3 fatture scadute</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.08)] text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.18)]">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </AdminCard>
      </section>

      {/* CHARTS ROW */}
      <section className="grid gap-5 xl:grid-cols-[65fr_35fr]">
        <AdminCard className="min-h-[400px] p-5">
          <AdminSectionTitle eyebrow="Cash flow" title="Flusso di cassa — ultimi 6 mesi" />
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlow} margin={{ left: -18, right: 14, top: 12 }}>
                <defs>
                  <linearGradient id="entrateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="usciteFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,212,255,0.08)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => eur(v)} />
                <Legend wrapperStyle={{ paddingTop: 12, color: "var(--falcon-subtle)" }} />
                <Area type="monotone" dataKey="entrate" stroke="#00d4ff" fill="url(#entrateFill)" strokeWidth={3} name="Entrate" />
                <Area type="monotone" dataKey="uscite" stroke="#ef4444" fill="url(#usciteFill)" strokeWidth={3} name="Uscite" />
                <Line type="monotone" dataKey="entrate" stroke="#00d4ff" strokeWidth={3} dot={false} legendType="none" />
                <Line type="monotone" dataKey="uscite" stroke="#ef4444" strokeWidth={3} dot={false} legendType="none" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard className="min-h-[400px] p-5">
          <AdminSectionTitle eyebrow="Categorie" title="Breakdown uscite" />
          <div className="mt-4 grid grid-cols-[1fr_1.1fr] items-center gap-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseBreakdown} innerRadius={52} outerRadius={86} paddingAngle={3} dataKey="value">
                    {expenseBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="rgba(255,255,255,0.06)" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {expenseBreakdown.map((entry) => (
                <div key={entry.name} className="flex items-start justify-between gap-2 text-xs">
                  <span className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                    <span className="leading-tight">
                      {entry.name}
                      <span className="block text-[10px] text-muted-foreground/70">{eur(entry.amount)}</span>
                    </span>
                  </span>
                  <span className="font-semibold text-foreground">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>
      </section>

      {/* TRANSACTIONS */}
      <AdminCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <AdminSectionTitle eyebrow="Movimenti" title="Transazioni" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] p-1">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                    tab === t
                      ? "bg-[rgba(0,212,255,0.12)] text-primary shadow-[inset_0_0_18px_rgba(0,212,255,0.16)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option>Questo mese</option>
              <option>Trimestre</option>
              <option>Anno</option>
            </select>
            <button className="btn-ghost inline-flex items-center gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Esporta CSV
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">#</th>
                <th>Data</th>
                <th>Descrizione</th>
                <th>Categoria</th>
                <th>Cliente / Fornitore</th>
                <th className="text-right">Importo</th>
                <th>Stato</th>
                <th className="text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((tx) => (
                <tr key={tx.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                  <td className="py-4 text-xs text-muted-foreground">{tx.id}</td>
                  <td className="text-muted-foreground">{tx.date}</td>
                  <td>
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: tx.type === "entrata" ? "#22c55e" : "#ef4444" }}
                      />
                      {tx.description}
                    </span>
                  </td>
                  <td><CategoryBadge category={tx.category} /></td>
                  <td className="text-muted-foreground">{tx.party}</td>
                  <td className={cn("text-right font-semibold", tx.type === "entrata" ? "text-emerald-300" : "text-red-400")}>
                    {tx.type === "entrata" ? "+" : "−"}{eur(tx.amount)}
                  </td>
                  <td><AdminBadge status={tx.status === "Pagato" ? "Attivo" : tx.status === "Scaduto" ? "Scaduto" : tx.status === "In attesa" ? "In valutazione" : "Bozza"}>{tx.status}</AdminBadge></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <IconButton><Eye className="h-4 w-4" /></IconButton>
                      <IconButton><Pencil className="h-4 w-4" /></IconButton>
                      <IconButton><Download className="h-4 w-4" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} di {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.04)] text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-foreground">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.04)] text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </AdminCard>

      {/* MONTHLY RECAP */}
      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Riepilogo" title="Performance mensile" />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Mese</th>
                <th className="text-right">Entrate</th>
                <th className="text-right">Uscite</th>
                <th className="text-right">Utile</th>
                <th className="text-right">Margine</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRecap.map((row) => {
                const utile = row.entrate - row.uscite;
                const margine = (utile / row.entrate) * 100;
                return (
                  <tr key={row.month} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                    <td className="py-3.5 font-medium">{row.month}</td>
                    <td className="text-right text-emerald-300">{eur(row.entrate)}</td>
                    <td className="text-right text-red-400">{eur(row.uscite)}</td>
                    <td className={cn("text-right font-semibold", utile >= 0 ? "text-emerald-300" : "text-red-400")}>
                      {eur(utile)}
                    </td>
                    <td className="text-right text-muted-foreground">{margine.toFixed(1)}%</td>
                  </tr>
                );
              })}
              {(() => {
                const totEntrate = monthlyRecap.reduce((a, r) => a + r.entrate, 0);
                const totUscite = monthlyRecap.reduce((a, r) => a + r.uscite, 0);
                const totUtile = totEntrate - totUscite;
                const totMargine = (totUtile / totEntrate) * 100;
                return (
                  <tr className="border-t-2 border-primary/60 text-foreground">
                    <td className="py-4 text-sm font-bold uppercase tracking-wider text-primary">Totale YTD</td>
                    <td className="text-right font-bold text-emerald-300">{eur(totEntrate)}</td>
                    <td className="text-right font-bold text-red-400">{eur(totUscite)}</td>
                    <td className="text-right font-bold text-emerald-300">{eur(totUtile)}</td>
                    <td className="text-right font-bold text-foreground">{totMargine.toFixed(1)}%</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* CATEGORY CARDS */}
      <section>
        <AdminSectionTitle eyebrow="Budget" title="Categorie di spesa" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expenseCategories.map((cat) => {
            const Icon = cat.icon;
            const pct = Math.min(150, (cat.spent / cat.budget) * 100);
            const overBudget = cat.spent > cat.budget;
            const trendUp = cat.trend >= 0;
            return (
              <AdminCard key={cat.name} className="glass-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.16)] bg-[rgba(255,255,255,0.04)]"
                      style={{ color: cat.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">Budget {eur(cat.budget)}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      trendUp
                        ? "border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.1)] text-red-400"
                        : "border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] text-emerald-300",
                    )}
                  >
                    {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(cat.trend).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <p className="text-2xl font-black text-foreground">{eur(cat.spent)}</p>
                  <p className={cn("text-xs font-semibold", overBudget ? "text-red-400" : "text-muted-foreground")}>
                    {((cat.spent / cat.budget) * 100).toFixed(0)}% del budget
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: overBudget ? "#ef4444" : `linear-gradient(90deg, ${cat.color}, var(--falcon-cyan))`,
                      boxShadow: overBudget ? "0 0 12px rgba(239,68,68,0.5)" : "0 0 12px rgba(0,212,255,0.3)",
                    }}
                  />
                </div>
              </AdminCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
