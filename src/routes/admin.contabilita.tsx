import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  DollarSign,
  Percent,
  Plus,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/contabilita")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Contabilità" },
      { name: "description", content: "Contabilità Falcon Agency: entrate, uscite, transazioni e spese fisse." },
    ],
  }),
  component: ContabilitaPage,
});

// =============== TYPES ===============

type TxType = "entrata" | "uscita";
type Handler = "agenzia" | "pat" | "stefano";

interface Transaction {
  id: string;
  type: TxType;
  category: string | null;
  amount: number;
  description: string | null;
  date: string;
  lead_id: string | null;
  invoice_number: string | null;
  paid_by: Handler;
  created_at?: string;
  leads?: { full_name: string | null; company: string | null } | null;
}

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  frequency: "mensile" | "annuale";
  category: string | null;
  active: boolean;
}

interface LeadOption {
  id: string;
  full_name: string | null;
  company: string | null;
}

// =============== HELPERS ===============

const eur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const tooltipStyle = {
  background: "#070b14",
  border: "1px solid rgba(0,212,255,0.2)",
  borderRadius: 14,
  backdropFilter: "blur(14px)",
};

const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

const inputClass =
  "w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-white outline-none focus:border-primary";

const handlerLabel: Record<Handler, string> = {
  agenzia: "Agenzia",
  pat: "Pat",
  stefano: "Stefano",
};

const handlerBadgeClass: Record<Handler, string> = {
  agenzia: "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.05)] text-muted-foreground",
  pat: "border-[rgba(0,212,255,0.32)] bg-[rgba(0,212,255,0.1)] text-primary",
  stefano: "border-[rgba(251,191,36,0.32)] bg-[rgba(251,191,36,0.1)] text-amber-300",
};

// =============== PAGE ===============

function ContabilitaPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showFxModal, setShowFxModal] = useState(false);
  const [showDivisoria, setShowDivisoria] = useState(false);
  const [filterType, setFilterType] = useState<"all" | TxType>("all");
  const now = new Date();
  const todayIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [periodFrom, setPeriodFrom] = useState<string>(todayIso(startOfMonth));
  const [periodTo, setPeriodTo] = useState<string>(todayIso(endOfMonth));
  const [filterMonth, setFilterMonth] = useState<string>(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const setQuickRange = (range: "thisMonth" | "lastMonth" | "last3Months" | "thisYear") => {
    const n = new Date();
    let from: Date, to: Date;
    if (range === "thisMonth") {
      from = new Date(n.getFullYear(), n.getMonth(), 1);
      to = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    } else if (range === "lastMonth") {
      from = new Date(n.getFullYear(), n.getMonth() - 1, 1);
      to = new Date(n.getFullYear(), n.getMonth(), 0);
    } else if (range === "last3Months") {
      from = new Date(n.getFullYear(), n.getMonth() - 2, 1);
      to = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    } else {
      from = new Date(n.getFullYear(), 0, 1);
      to = new Date(n.getFullYear(), 11, 31);
    }
    setPeriodFrom(todayIso(from));
    setPeriodTo(todayIso(to));
  };

  const loadAll = async () => {
    if (!supabase) return;
    setLoading(true);
    const [{ data: tx }, { data: fx }, { data: ld }] = await Promise.all([
      supabase.from("transactions").select("*, leads(full_name, company)").order("date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("id, full_name, company").eq("pipeline_stage", "chiuso_vinto"),
    ]);
    setTransactions((tx as Transaction[]) ?? []);
    setFixedExpenses((fx as FixedExpense[]) ?? []);
    setLeads((ld as LeadOption[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Months span between periodFrom and periodTo (inclusive)
  const monthsInPeriod = useMemo(() => {
    const from = new Date(periodFrom);
    const to = new Date(periodTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return 1;
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  }, [periodFrom, periodTo]);

  // KPI computation — selected period
  const kpi = useMemo(() => {
    const from = new Date(periodFrom);
    const to = new Date(periodTo);
    to.setHours(23, 59, 59, 999);
    const inRange = (d: string) => {
      const dt = new Date(d);
      return dt >= from && dt <= to;
    };
    const entrate = transactions
      .filter((t) => t.type === "entrata" && inRange(t.date))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const usciteTx = transactions
      .filter((t) => t.type === "uscita" && inRange(t.date))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const usciteFisseMese = fixedExpenses
      .filter((f) => f.active)
      .reduce((s, f) => s + (f.frequency === "annuale" ? Number(f.amount) / 12 : Number(f.amount)), 0);
    const uscite = usciteTx + usciteFisseMese * Math.max(1, monthsInPeriod);
    const utile = entrate - uscite;
    const inAttesa = transactions.filter((t) => t.type === "entrata" && !t.invoice_number && inRange(t.date)).length;
    return {
      entrate,
      uscite,
      utile,
      quota50: utile / 2,
      inAttesa,
    };
  }, [transactions, fixedExpenses, periodFrom, periodTo, monthsInPeriod]);

  // Chart — months within selected period
  const cashFlow = useMemo(() => {
    const from = new Date(periodFrom);
    const to = new Date(periodTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return [];
    const buckets: { key: string; month: string; entrate: number; uscite: number }[] = [];
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cursor <= end) {
      buckets.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
        month: `${monthNames[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
        entrate: 0,
        uscite: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    transactions.forEach((t) => {
      const dt = new Date(t.date);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (b) {
        if (t.type === "entrata") b.entrate += Number(t.amount || 0);
        else b.uscite += Number(t.amount || 0);
      }
    });
    const usciteFisseMese = fixedExpenses
      .filter((f) => f.active)
      .reduce((s, f) => s + (f.frequency === "annuale" ? Number(f.amount) / 12 : Number(f.amount)), 0);
    buckets.forEach((b) => (b.uscite += usciteFisseMese));
    return buckets;
  }, [transactions, fixedExpenses, periodFrom, periodTo]);

  const totFissoMese = fixedExpenses
    .filter((f) => f.active)
    .reduce((s, f) => s + (f.frequency === "annuale" ? Number(f.amount) / 12 : Number(f.amount)), 0);

  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterMonth) {
        const dt = new Date(t.date);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        if (key !== filterMonth) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterMonth]);

  const deleteTx = async (id: string) => {
    if (!supabase || !confirm("Eliminare questa transazione?")) return;
    await supabase.from("transactions").delete().eq("id", id);
    loadAll();
  };

  const deleteFx = async (id: string) => {
    if (!supabase || !confirm("Eliminare questa spesa fissa?")) return;
    await supabase.from("fixed_expenses").delete().eq("id", id);
    loadAll();
  };

  const periodoLabel = (() => {
    const from = new Date(periodFrom);
    const to = new Date(periodTo);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return "";
    const mesi = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
    const isFirstDay = from.getDate() === 1;
    const lastDay = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();
    const isLastDay = to.getDate() === lastDay;
    const sameYear = from.getFullYear() === to.getFullYear();
    const sameMonth = sameYear && from.getMonth() === to.getMonth();
    if (isFirstDay && isLastDay && sameMonth) {
      return `${mesi[from.getMonth()]} ${from.getFullYear()}`;
    }
    if (isFirstDay && isLastDay && sameYear && from.getMonth() === 0 && to.getMonth() === 11) {
      return `${from.getFullYear()}`;
    }
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    return `${fmt(from)} → ${fmt(to)}`;
  })();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-section">Falcon Agency</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Contabilità <span className="text-primary text-glow">— {periodoLabel}</span>
          </h1>
        </div>
        <button
          onClick={() => setShowDivisoria(true)}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[rgba(0,212,255,0.35)] bg-transparent px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.08)] md:self-auto"
        >
          <Scale className="h-4 w-4" />
          Divisoria
        </button>
      </header>

      {showDivisoria && (
        <DivisoriaModal
          onClose={() => setShowDivisoria(false)}
          periodFrom={periodFrom}
          periodTo={periodTo}
        />
      )}

      {/* PERIOD SELECTOR */}
      <AdminCard className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Periodo</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Da</span>
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">A</span>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              ["thisMonth", "Questo mese"],
              ["lastMonth", "Ultimo mese"],
              ["last3Months", "Ultimi 3 mesi"],
              ["thisYear", "Quest'anno"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setQuickRange(key)}
                className="rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </AdminCard>

      {/* KPI ROW — 5 cards */}
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <AdminKpi icon={TrendingUp} title="Entrate Totali" value={eur(kpi.entrate)} meta="periodo selezionato" tone="green" />
        <AdminKpi icon={TrendingDown} title="Uscite Totali" value={eur(kpi.uscite)} meta="incluso fisso" tone="orange" />
        <AdminKpi icon={DollarSign} title="Utile Netto" value={eur(kpi.utile)} meta="entrate − uscite" tone="cyan" />
        <AdminKpi icon={Percent} title="Quota 50%" value={eur(kpi.quota50)} meta="utile ÷ 2" tone="cyan" />
        <AdminKpi icon={Clock} title="Fatture in Attesa" value={String(kpi.inAttesa)} meta="senza n° fattura" tone="orange" />
      </section>

      {/* CASH FLOW CHART */}
      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Cash flow" title="Entrate vs Uscite — periodo selezionato" />
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashFlow} margin={{ left: -10, right: 14, top: 12 }}>
              <defs>
                <linearGradient id="entFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="uscFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(0,212,255,0.08)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => eur(v)} />
              <Area type="monotone" dataKey="entrate" stroke="#00d4ff" fill="url(#entFill)" strokeWidth={3} name="Entrate" />
              <Area type="monotone" dataKey="uscite" stroke="#f59e0b" fill="url(#uscFill)" strokeWidth={3} name="Uscite" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminCard>

      {/* FIXED EXPENSES */}
      <AdminCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <AdminSectionTitle eyebrow="Ricorrenti" title="Spese fisse & abbonamenti" />
          <button
            onClick={() => setShowFxModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.14)]"
          >
            <Plus className="h-4 w-4" /> Aggiungi spesa fissa
          </button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Nome</th>
                <th>Categoria</th>
                <th className="text-right">Importo</th>
                <th>Frequenza</th>
                <th className="text-right">Quota mensile</th>
                <th className="text-right">Per partner (÷2)</th>
                <th>Stato</th>
                <th className="text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Caricamento…</td></tr>
              )}
              {!loading && fixedExpenses.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nessuna spesa fissa</td></tr>
              )}
              {fixedExpenses.map((fx) => {
                const monthly = fx.frequency === "annuale" ? Number(fx.amount) / 12 : Number(fx.amount);
                return (
                  <tr key={fx.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                    <td className="py-4 font-medium">{fx.name}</td>
                    <td className="text-muted-foreground">{fx.category ?? "—"}</td>
                    <td className="text-right">{eur(Number(fx.amount))}</td>
                    <td className="text-muted-foreground capitalize">{fx.frequency}</td>
                    <td className="text-right font-semibold text-primary">{eur(monthly)}</td>
                    <td className="text-right text-muted-foreground">{eur(monthly / 2)}</td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        fx.active
                          ? "border-[rgba(52,211,153,0.32)] bg-[rgba(52,211,153,0.1)] text-emerald-300"
                          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                      )}>
                        {fx.active ? "Attivo" : "Inattivo"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button onClick={() => deleteFx(fx.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {fixedExpenses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[rgba(0,212,255,0.2)] text-sm font-bold text-foreground">
                  <td colSpan={4} className="py-4 text-right">Totale mensile complessivo:</td>
                  <td className="text-right text-primary">{eur(totFissoMese)}</td>
                  <td className="text-right text-primary">{eur(totFissoMese / 2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </AdminCard>

      {/* TRANSACTIONS */}
      <AdminCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <AdminSectionTitle eyebrow="Movimenti" title="Transazioni" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-2xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] p-1">
              {(["all", "entrata", "uscita"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition",
                    filterType === t
                      ? "bg-[rgba(0,212,255,0.12)] text-primary shadow-[inset_0_0_18px_rgba(0,212,255,0.16)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "all" ? "Tutte" : t === "entrata" ? "Entrate" : "Uscite"}
                </button>
              ))}
            </div>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={() => setShowTxModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.14)]"
            >
              <Plus className="h-4 w-4" /> Aggiungi transazione
            </button>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Data</th>
                <th>Tipo</th>
                <th>Gestito da</th>
                <th>Categoria</th>
                <th>Descrizione</th>
                <th>Cliente</th>
                <th className="text-right">Importo</th>
                <th>Fattura n°</th>
                <th className="text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Caricamento…</td></tr>
              )}
              {!loading && filteredTx.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-muted-foreground">Nessuna transazione</td></tr>
              )}
              {filteredTx.map((tx) => {
                const handler = (tx.paid_by ?? "agenzia") as Handler;
                return (
                <tr key={tx.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                  <td className="py-4 text-muted-foreground">{new Date(tx.date).toLocaleDateString("it-IT")}</td>
                  <td>
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                      tx.type === "entrata"
                        ? "border-[rgba(52,211,153,0.32)] bg-[rgba(52,211,153,0.1)] text-emerald-300"
                        : "border-[rgba(248,113,113,0.32)] bg-[rgba(248,113,113,0.1)] text-red-400"
                    )}>
                      {tx.type}
                    </span>
                  </td>
                  <td>
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      handlerBadgeClass[handler],
                    )}>
                      {handlerLabel[handler]}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{tx.category ?? "—"}</td>
                  <td className="font-medium">{tx.description ?? "—"}</td>
                  <td className="text-muted-foreground">
                    {tx.leads?.full_name ?? tx.leads?.company ?? "—"}
                  </td>
                  <td className={cn("text-right font-semibold", tx.type === "entrata" ? "text-emerald-300" : "text-red-400")}>
                    {tx.type === "entrata" ? "+" : "−"}{eur(Number(tx.amount))}
                  </td>
                  <td className="text-muted-foreground">{tx.invoice_number ?? "—"}</td>
                  <td className="text-right">
                    <button onClick={() => deleteTx(tx.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {showTxModal && (
        <TransactionModal
          leads={leads}
          onClose={() => setShowTxModal(false)}
          onSaved={() => { setShowTxModal(false); loadAll(); }}
        />
      )}
      {showFxModal && (
        <FixedExpenseModal
          onClose={() => setShowFxModal(false)}
          onSaved={() => { setShowFxModal(false); loadAll(); }}
        />
      )}
    </div>
  );
}

// =============== MODALS ===============

function TransactionModal({ leads, onClose, onSaved }: { leads: LeadOption[]; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<TxType>("entrata");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paidBy, setPaidBy] = useState<Handler>("agenzia");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!supabase || !amount) return;
    setSaving(true);
    await supabase.from("transactions").insert({
      type,
      amount: parseFloat(amount),
      category: category || null,
      date,
      description: description || null,
      lead_id: leadId || null,
      invoice_number: invoiceNumber || null,
      paid_by: paidBy,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Nuova transazione</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Tipo</span>
              <select value={type} onChange={(e) => setType(e.target.value as TxType)} className={inputClass}>
                <option value="entrata">Entrata</option>
                <option value="uscita">Uscita</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Importo (€)</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Categoria</span>
              <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Es. Software, Stipendio" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Data</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Descrizione</span>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Cliente (opzionale)</span>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={inputClass}>
              <option value="">— Nessun cliente —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.full_name ?? l.company ?? l.id}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Numero fattura (opzionale)</span>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-muted-foreground hover:text-white">Annulla</button>
          <button onClick={onSave} disabled={saving || !amount} className="rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.12)] px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FixedExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"mensile" | "annuale">("mensile");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!supabase || !name || !amount) return;
    setSaving(true);
    await supabase.from("fixed_expenses").insert({
      name,
      amount: parseFloat(amount),
      frequency,
      category: category || null,
      active: true,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Nuova spesa fissa</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Es. Figma, Ufficio" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Importo (€)</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Frequenza</span>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as "mensile" | "annuale")} className={inputClass}>
                <option value="mensile">Mensile</option>
                <option value="annuale">Annuale</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Categoria</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Es. Software, Affitto" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-muted-foreground hover:text-white">Annulla</button>
          <button onClick={onSave} disabled={saving || !name || !amount} className="rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.12)] px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============== DIVISORIA ===============

type Partner = "pat" | "stefano";

interface PartnerPayment {
  id: string;
  paid_by: Partner;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  settled: boolean;
  created_at?: string;
}

function DivisoriaModal({
  onClose,
  periodFrom,
  periodTo,
}: {
  onClose: () => void;
  periodFrom: string;
  periodTo: string;
}) {
  const [payments, setPayments] = useState<PartnerPayment[]>([]);
  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    const [pp, fe, tx] = await Promise.all([
      supabase.from("partner_payments").select("*").eq("settled", false).order("date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").eq("active", true),
      supabase
        .from("transactions")
        .select("*")
        .gte("date", periodFrom)
        .lte("date", periodTo)
        .order("date", { ascending: false }),
    ]);
    setPayments((pp.data as PartnerPayment[]) ?? []);
    setFixed((fe.data as FixedExpense[]) ?? []);
    setTxs((tx.data as Transaction[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFrom, periodTo]);

  const months = useMemo(() => {
    const f = new Date(periodFrom);
    const t = new Date(periodTo);
    if (isNaN(f.getTime()) || isNaN(t.getTime())) return 1;
    return Math.max(1, (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth()) + 1);
  }, [periodFrom, periodTo]);

  // Auto-derived from contabilità
  const entrate = txs.filter((t) => t.type === "entrata").reduce((s, t) => s + Number(t.amount || 0), 0);
  const usciteTransazioni = txs.filter((t) => t.type === "uscita").reduce((s, t) => s + Number(t.amount || 0), 0);
  const usciteFisseMese = fixed.reduce(
    (s, f) => s + (f.frequency === "annuale" ? Number(f.amount) / 12 : Number(f.amount)),
    0,
  );
  const usciteFisse = usciteFisseMese * months;
  const totaleUscite = usciteTransazioni + usciteFisse;
  const utileNetto = entrate - totaleUscite;
  const quotaPerSocio = utileNetto / 2;

  // Manual partner payments
  const patPayments = payments.filter((p) => p.paid_by === "pat");
  const stePayments = payments.filter((p) => p.paid_by === "stefano");
  const patPagato = patPayments.reduce((s, p) => s + Number(p.amount), 0);
  const stefanoPagato = stePayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalePagato = patPagato + stefanoPagato;
  const fairShare = totalePagato / 2;
  const bilancio = patPagato - fairShare; // >0 stefano deve a pat

  const settleAll = async () => {
    if (!supabase || payments.length === 0) return;
    if (!window.confirm("Segnare tutti i pagamenti come saldati?")) return;
    await supabase.from("partner_payments").update({ settled: true }).eq("settled", false);
    await load();
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#070b14]"
      style={{ height: "100vh", width: "100vw" }}
    >
      {/* HEADER — fixed top */}
      <div className="flex-shrink-0 border-b border-[rgba(255,255,255,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-white">Divisoria</h2>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-[rgba(0,212,255,0.12)]"
            >
              <Plus className="h-3.5 w-3.5" /> Aggiungi
            </button>
            <button
              onClick={settleAll}
              disabled={payments.length === 0}
              className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-white disabled:opacity-40"
            >
              Saldo
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:text-white"
              aria-label="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* BODY — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          {/* AUTO section — 3 cols */}
          <div>
            <div className="rounded-2xl border border-[rgba(0,212,255,0.08)] bg-[rgba(255,255,255,0.02)]">
              <div className="grid grid-cols-1 divide-y divide-[rgba(255,255,255,0.05)] md:grid-cols-3 md:divide-x md:divide-y-0">
                <AutoCell label="Entrate agenzia" value={entrate} />
                <AutoCell label="Uscite totali" value={totaleUscite} />
                <AutoCell label="Quota per socio" value={quotaPerSocio} accent />
              </div>
            </div>
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">
              Calcolato sul periodo selezionato · Utile netto {eur(utileNetto)} ·{" "}
              {months} {months === 1 ? "mese" : "mesi"}
            </p>
          </div>

          {/* MANUAL section — two thin columns */}
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <PartnerList
              name="Pat"
              total={patPagato}
              payments={patPayments}
              loading={loading}
              fmtDate={fmtDate}
            />
            <PartnerList
              name="Stefano"
              total={stefanoPagato}
              payments={stePayments}
              loading={loading}
              fmtDate={fmtDate}
            />
          </div>

          {/* SETTLEMENT banner */}
          <div className="mt-8">
            {totalePagato === 0 ? (
              <div className="rounded-xl border-l-2 border-l-[rgba(0,212,255,0.6)] bg-[rgba(0,212,255,0.04)] px-5 py-3 text-sm text-muted-foreground">
                Nessun pagamento manuale registrato
              </div>
            ) : Math.abs(bilancio) < 0.01 ? (
              <div className="flex items-center justify-between rounded-xl border-l-2 border-l-[rgba(34,197,94,0.6)] bg-[rgba(34,197,94,0.04)] px-5 py-3">
                <span className="text-sm text-muted-foreground">In pareggio</span>
                <span className="text-sm font-semibold text-emerald-400">✓</span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border-l-2 border-l-[rgba(0,212,255,0.6)] bg-[rgba(0,212,255,0.04)] px-5 py-4">
                <span className="text-sm text-muted-foreground">
                  {bilancio > 0 ? "Stefano deve a Pat" : "Pat deve a Stefano"}
                </span>
                <span className="text-2xl font-black tracking-tight text-primary">
                  {eur(Math.abs(bilancio))}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddPartnerPaymentModal
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await load();
          }}
        />
      )}
    </div>,
    document.body,
  );
}

function AutoCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-5 py-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-black tracking-tight md:text-3xl",
          accent ? "text-primary" : "text-white",
        )}
      >
        {eur(value)}
      </p>
    </div>
  );
}

function PartnerList({
  name,
  total,
  payments,
  loading,
  fmtDate,
}: {
  name: string;
  total: number;
  payments: PartnerPayment[];
  loading: boolean;
  fmtDate: (d: string) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {name}
        </span>
        <span className="text-sm font-semibold text-white">{eur(total)}</span>
      </div>
      <div className="divide-y divide-[rgba(255,255,255,0.06)]">
        {loading ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Caricamento…</p>
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Nessun pagamento</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                {fmtDate(p.date)}
              </span>
              <span className="min-w-0 flex-1 truncate text-white/90">{p.description}</span>
              <span className="shrink-0 font-medium tabular-nums text-white">
                {eur(Number(p.amount))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AddPartnerPaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [paidBy, setPaidBy] = useState<Partner>("pat");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState("Software");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!supabase || !description || !amount) return;
    setSaving(true);
    await supabase.from("partner_payments").insert({
      paid_by: paidBy,
      description,
      amount: parseFloat(amount),
      date,
      category,
      settled: false,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Aggiungi pagamento</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Pagato da</span>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as Partner)} className={inputClass}>
              <option value="pat">Pat</option>
              <option value="stefano">Stefano</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Descrizione</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Es. Abbonamento Figma" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Importo (€)</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Data</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Categoria</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option>Software</option>
              <option>Marketing</option>
              <option>Hosting</option>
              <option>Operativo</option>
              <option>Altro</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-muted-foreground hover:text-white">
            Annulla
          </button>
          <button
            onClick={onSave}
            disabled={saving || !description || !amount}
            className="rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.12)] px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50"
          >
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}
