import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  DollarSign,
  Percent,
  Plus,
  Scale,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingFx, setEditingFx] = useState<FixedExpense | null>(null);
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
                      <div className="inline-flex items-center gap-1.5">
                        <button onClick={() => setEditingFx(fx)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-primary hover:text-primary" aria-label="Modifica">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteFx(fx.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-destructive hover:text-destructive" aria-label="Elimina">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => setEditingTx(tx)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-primary hover:text-primary" aria-label="Modifica">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteTx(tx.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-destructive hover:text-destructive" aria-label="Elimina">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
          <div>
            <span className="mb-1 block text-sm text-muted-foreground">Gestito da</span>
            <div className="inline-flex w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-1">
              {(["agenzia", "pat", "stefano"] as Handler[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPaidBy(h)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    paidBy === h
                      ? h === "agenzia"
                        ? "bg-[rgba(255,255,255,0.08)] text-white"
                        : h === "pat"
                          ? "bg-[rgba(0,212,255,0.14)] text-primary shadow-[inset_0_0_18px_rgba(0,212,255,0.18)]"
                          : "bg-[rgba(251,191,36,0.14)] text-amber-300 shadow-[inset_0_0_18px_rgba(251,191,36,0.18)]"
                      : "text-muted-foreground hover:text-white",
                  )}
                >
                  {handlerLabel[h]}
                </button>
              ))}
            </div>
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
type SettlementDirection = "pat_to_stefano" | "stefano_to_pat";

interface SettlementEvent {
  id: string;
  direction: SettlementDirection;
  net_amount: number;
  settlement_date: string;
  reversed: boolean;
  reversed_at: string | null;
  note: string | null;
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
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [events, setEvents] = useState<SettlementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);

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
    const [tx, fe, se] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .gte("date", periodFrom)
        .lte("date", periodTo)
        .order("date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").eq("active", true),
      supabase
        .from("settlement_events")
        .select("*")
        .order("settlement_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    setTxs((tx.data as Transaction[]) ?? []);
    setFixed((fe.data as FixedExpense[]) ?? []);
    setEvents((se.data as SettlementEvent[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFrom, periodTo]);

  // ---------- Calcolo balance ----------
  const sumBy = (handler: Partner, type: TxType) =>
    txs
      .filter((t) => (t.paid_by ?? "agenzia") === handler && t.type === type)
      .reduce((s, t) => s + Number(t.amount || 0), 0);

  const patUscite = sumBy("pat", "uscita");
  const patEntrate = sumBy("pat", "entrata");
  const stefanoUscite = sumBy("stefano", "uscita");
  const stefanoEntrate = sumBy("stefano", "entrata");

  const patNetto = patUscite - patEntrate;
  const stefanoNetto = stefanoUscite - stefanoEntrate;
  const totaleNetto = patNetto + stefanoNetto;
  const fairShare = totaleNetto / 2;

  // patDeve > 0 → Pat ha pagato più del dovuto → Stefano deve a Pat
  const patSurplus = patNetto - fairShare;

  // Aggiusta con i settlement non stornati
  const settledPatToStefano = events
    .filter((e) => !e.reversed && e.direction === "pat_to_stefano")
    .reduce((s, e) => s + Number(e.net_amount || 0), 0);
  const settledStefanoToPat = events
    .filter((e) => !e.reversed && e.direction === "stefano_to_pat")
    .reduce((s, e) => s + Number(e.net_amount || 0), 0);

  // patSurplus residuo: ogni pagamento da Stefano a Pat lo riduce; ogni pagamento da Pat a Stefano lo aumenta
  const balanceAdjusted = patSurplus - settledStefanoToPat + settledPatToStefano;

  let direction: SettlementDirection | null = null;
  let amountDue = 0;
  if (Math.abs(balanceAdjusted) >= 0.01) {
    if (balanceAdjusted > 0) {
      direction = "stefano_to_pat";
      amountDue = balanceAdjusted;
    } else {
      direction = "pat_to_stefano";
      amountDue = -balanceAdjusted;
    }
  }

  const directionLabel = (d: SettlementDirection, amt: number) =>
    d === "stefano_to_pat"
      ? `Stefano deve a Pat ${eur(amt)}`
      : `Pat deve a Stefano ${eur(amt)}`;

  const directionArrow = (d: SettlementDirection) =>
    d === "stefano_to_pat" ? "Stefano → Pat" : "Pat → Stefano";

  const today = new Date().toISOString().slice(0, 10);

  const confirmRegister = async () => {
    if (!supabase || !direction) return;
    await supabase.from("settlement_events").insert({
      direction,
      net_amount: Number(amountDue.toFixed(2)),
      settlement_date: today,
      reversed: false,
    });
    setConfirmStep(0);
    await load();
  };

  const reverseEvent = async (id: string) => {
    if (!supabase) return;
    if (
      !window.confirm(
        "Confermi lo storno di questo saldo? L'importo tornerà nel bilancio.",
      )
    )
      return;
    await supabase
      .from("settlement_events")
      .update({ reversed: true, reversed_at: new Date().toISOString() })
      .eq("id", id);
    await load();
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#070b14]"
      style={{ height: "100vh", width: "100vw" }}
    >
      {/* HEADER */}
      <div className="flex-shrink-0 border-b border-[rgba(255,255,255,0.06)]">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-white">Divisoria</h2>
          <div className="ml-auto flex items-center gap-2">
            {direction && (
              <button
                onClick={() => setConfirmStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.14)]"
              >
                Registra saldo
              </button>
            )}
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

      {/* BODY */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-8 p-6">
          {/* AUTO summary — 2 partner columns */}
          <div className="rounded-2xl border border-[rgba(0,212,255,0.08)] bg-[rgba(255,255,255,0.02)]">
            <div className="grid grid-cols-1 divide-y divide-[rgba(255,255,255,0.06)] md:grid-cols-2 md:divide-x md:divide-y-0">
              <PartnerSummary
                name="PAT"
                accent="cyan"
                uscite={patUscite}
                entrate={patEntrate}
                netto={patNetto}
              />
              <PartnerSummary
                name="STEFANO"
                accent="amber"
                uscite={stefanoUscite}
                entrate={stefanoEntrate}
                netto={stefanoNetto}
              />
            </div>
            <div className="border-t border-[rgba(255,255,255,0.08)] px-5 py-4">
              <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Bilancio corrente
                </span>
                {loading ? (
                  <span className="text-sm text-muted-foreground">Caricamento…</span>
                ) : direction ? (
                  <div className="flex items-center gap-3 text-sm md:text-base">
                    <span className="text-muted-foreground">{directionArrow(direction)}</span>
                    <span className="text-2xl font-black tracking-tight text-primary md:text-3xl">
                      {eur(amountDue)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-emerald-400">In pareggio ✓</span>
                )}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Calcolato sul periodo selezionato — fixed expenses considerate nei KPI principali (split 50/50).
              </p>
            </div>
          </div>

          {/* STORICO SALDI */}
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Storico saldi
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {events.length} evento{events.length === 1 ? "" : "i"}
              </span>
            </div>
            <div className="rounded-2xl border border-[rgba(255,255,255,0.06)]">
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Caricamento…</p>
              ) : events.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nessun saldo registrato
                </p>
              ) : (
                <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm",
                        e.reversed && "opacity-50",
                      )}
                    >
                      <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {fmtDate(e.settlement_date)}
                      </span>
                      <span className="min-w-0 flex-1 text-white/90">
                        {directionArrow(e.direction)}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-white">
                        {eur(Number(e.net_amount))}
                      </span>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          e.reversed
                            ? "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-muted-foreground"
                            : "border-[rgba(52,211,153,0.32)] bg-[rgba(52,211,153,0.1)] text-emerald-300",
                        )}
                      >
                        {e.reversed ? "Stornato" : "Registrato"}
                      </span>
                      <button
                        onClick={() => !e.reversed && reverseEvent(e.id)}
                        disabled={e.reversed}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(255,255,255,0.08)] text-muted-foreground transition hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[rgba(255,255,255,0.08)] disabled:hover:text-muted-foreground"
                        aria-label="Storna saldo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM STEP 1 */}
      {confirmStep === 1 && direction && (
        <ConfirmDialog
          title="Registra saldo"
          body={
            <>
              <p className="text-sm text-muted-foreground">
                Stai per registrare un saldo tra i soci.
              </p>
              <div className="mt-4 rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Bilancio attuale
                </p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {directionLabel(direction, amountDue)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Data: {fmtDate(today)}</p>
              </div>
            </>
          }
          cancelLabel="Annulla"
          confirmLabel="Continua →"
          onCancel={() => setConfirmStep(0)}
          onConfirm={() => setConfirmStep(2)}
        />
      )}

      {/* CONFIRM STEP 2 */}
      {confirmStep === 2 && direction && (
        <ConfirmDialog
          title="Conferma definitiva"
          body={
            <>
              <p className="text-sm text-muted-foreground">
                Questa azione è reversibile ma richiede conferma.
              </p>
              <div className="mt-4 rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] p-4 text-center">
                <p className="text-base font-bold text-white">
                  {directionLabel(direction, amountDue)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">in data {fmtDate(today)}</p>
              </div>
            </>
          }
          cancelLabel="Annulla"
          confirmLabel="Conferma saldo ✓"
          onCancel={() => setConfirmStep(0)}
          onConfirm={confirmRegister}
        />
      )}
    </div>,
    document.body,
  );
}

function PartnerSummary({
  name,
  accent,
  uscite,
  entrate,
  netto,
}: {
  name: string;
  accent: "cyan" | "amber";
  uscite: number;
  entrate: number;
  netto: number;
}) {
  const accentClass = accent === "cyan" ? "text-primary" : "text-amber-300";
  return (
    <div className="px-5 py-5">
      <div className="flex items-baseline justify-between">
        <h3 className={cn("text-sm font-bold uppercase tracking-[0.22em]", accentClass)}>
          {name}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">socio</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Uscite</p>
          <p className="mt-1 text-base font-bold text-red-400 tabular-nums">{eur(uscite)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Entrate</p>
          <p className="mt-1 text-base font-bold text-emerald-300 tabular-nums">{eur(entrate)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Netto</p>
          <p className={cn("mt-1 text-base font-bold tabular-nums", accentClass)}>{eur(netto)}</p>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <div className="mt-4">{body}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-muted-foreground hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.12)] px-4 py-2 text-sm font-semibold text-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

