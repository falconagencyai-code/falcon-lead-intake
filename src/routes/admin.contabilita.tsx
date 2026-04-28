import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  DollarSign,
  Paperclip,
  Percent,
  Plus,
  Scale,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  Undo2,
  Upload,
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
type Partner = "pat" | "stefano";

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
  paid_by?: Partner | null;
  /** Per "mensile": giorno del mese (1-31). Per "annuale": data ISO YYYY-MM-DD. */
  due_date: string | null;
}

interface OneTimeExpense {
  id: string;
  description: string | null;
  category: string | null;
  amount: number;
  date: string;
  paid_by: Partner;
  note: string | null;
  created_at?: string;
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
  pat: "border-cyan-800 bg-cyan-950 text-cyan-400",
  stefano: "border-amber-800 bg-amber-950 text-amber-400",
};

const partnerBadgeClass: Record<Partner, string> = {
  pat: "border-cyan-800 bg-cyan-950 text-cyan-400",
  stefano: "border-amber-800 bg-amber-950 text-amber-400",
};

const partnerLabel: Record<Partner, string> = {
  pat: "Pat",
  stefano: "Stefano",
};

// =============== PAGE ===============

function ContabilitaPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [oneTimeExpenses, setOneTimeExpenses] = useState<OneTimeExpense[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showFxModal, setShowFxModal] = useState(false);
  const [showOtModal, setShowOtModal] = useState(false);
  const [showDivisoria, setShowDivisoria] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingFx, setEditingFx] = useState<FixedExpense | null>(null);
  const [editingOt, setEditingOt] = useState<OneTimeExpense | null>(null);
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
    const [{ data: tx }, { data: fx }, { data: ot }, { data: ld }] = await Promise.all([
      supabase.from("transactions").select("*, leads(full_name, company)").order("date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("one_time_expenses").select("*").order("date", { ascending: false }),
      supabase.from("leads").select("id, full_name, company").eq("pipeline_stage", "chiuso_vinto"),
    ]);
    setTransactions((tx as Transaction[]) ?? []);
    setFixedExpenses((fx as FixedExpense[]) ?? []);
    setOneTimeExpenses((ot as OneTimeExpense[]) ?? []);
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

  const deleteOt = async (id: string) => {
    if (!supabase || !confirm("Eliminare questa spesa una tantum?")) return;
    await supabase.from("one_time_expenses").delete().eq("id", id);
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
        <DivisoriaModal onClose={() => setShowDivisoria(false)} />
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="w-[180px] whitespace-nowrap px-4 py-3">Nome</th>
                <th className="w-[120px] whitespace-nowrap px-4 py-3">Categoria</th>
                <th className="w-[100px] whitespace-nowrap px-4 py-3 text-right">Importo</th>
                <th className="w-[100px] whitespace-nowrap px-4 py-3">Frequenza</th>
                <th className="w-[120px] whitespace-nowrap px-4 py-3">Scadenza</th>
                <th className="w-[120px] whitespace-nowrap px-4 py-3 text-right">Quota mensile</th>
                <th className="w-[110px] whitespace-nowrap px-4 py-3 text-right">Per partner (÷2)</th>
                <th className="w-[110px] whitespace-nowrap px-4 py-3">Gestito da</th>
                <th className="w-[90px] whitespace-nowrap px-4 py-3">Stato</th>
                <th className="w-[80px] whitespace-nowrap px-4 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Caricamento…</td></tr>
              )}
              {!loading && fixedExpenses.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Nessuna spesa fissa</td></tr>
              )}
              {fixedExpenses.map((fx) => {
                const monthly = fx.frequency === "annuale" ? Number(fx.amount) / 12 : Number(fx.amount);
                const fxPaidBy = (fx.paid_by as Partner | null | undefined) ?? null;
                const dueLabel = fx.due_date
                  ? fx.frequency === "mensile"
                    ? `Giorno ${fx.due_date}`
                    : new Date(fx.due_date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <tr key={fx.id} className="group border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                    <td className="px-4 py-3 font-medium">{fx.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fx.category ?? "—"}</td>
                    <td className="px-4 py-3 text-right">{eur(Number(fx.amount))}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{fx.frequency}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{dueLabel}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{eur(monthly)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{eur(monthly / 2)}</td>
                    <td className="px-4 py-3">
                      {fxPaidBy ? (
                        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", partnerBadgeClass[fxPaidBy])}>
                          {partnerLabel[fxPaidBy]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        fx.active
                          ? "border-[rgba(52,211,153,0.32)] bg-[rgba(52,211,153,0.1)] text-emerald-300"
                          : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                      )}>
                        {fx.active ? "Attivo" : "Inattivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
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
                  <td colSpan={5} className="px-4 py-3 text-right">Totale mensile complessivo:</td>
                  <td className="px-4 py-3 text-right text-primary">{eur(totFissoMese)}</td>
                  <td className="px-4 py-3 text-right text-primary">{eur(totFissoMese / 2)}</td>
                  <td colSpan={3} className="px-4 py-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </AdminCard>

      {/* ONE TIME EXPENSES */}
      <AdminCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <AdminSectionTitle eyebrow="Variabili" title="Spese Una Tantum" />
            <p className="mt-1 text-sm text-muted-foreground">Collaboratori, spese occasionali</p>
          </div>
          <button
            onClick={() => setShowOtModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.08)] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.14)]"
          >
            <Plus className="h-4 w-4" /> Aggiungi spesa
          </button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Data</th>
                <th>Descrizione</th>
                <th>Categoria</th>
                <th className="text-right">Importo</th>
                <th>Gestito da</th>
                <th className="text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Caricamento…</td></tr>
              )}
              {!loading && oneTimeExpenses.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nessuna spesa una tantum</td></tr>
              )}
              {oneTimeExpenses.map((ot) => (
                <tr key={ot.id} className="group border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                  <td className="py-4 text-muted-foreground">{new Date(ot.date).toLocaleDateString("it-IT")}</td>
                  <td className="font-medium">{ot.description ?? "—"}</td>
                  <td className="text-muted-foreground">{ot.category ?? "—"}</td>
                  <td className="text-right font-semibold text-red-400">−{eur(Number(ot.amount))}</td>
                  <td>
                    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", partnerBadgeClass[ot.paid_by])}>
                      {partnerLabel[ot.paid_by]}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                      <button onClick={() => setEditingOt(ot)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-primary hover:text-primary" aria-label="Modifica">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteOt(ot.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-muted-foreground hover:border-destructive hover:text-destructive" aria-label="Elimina">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
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
                <tr key={tx.id} className="group border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
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
                    <div className="inline-flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
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
      {editingTx && (
        <TransactionModal
          leads={leads}
          initial={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={() => { setEditingTx(null); loadAll(); }}
        />
      )}
      {editingFx && (
        <FixedExpenseModal
          initial={editingFx}
          onClose={() => setEditingFx(null)}
          onSaved={() => { setEditingFx(null); loadAll(); }}
        />
      )}
      {showOtModal && (
        <OneTimeExpenseModal
          onClose={() => setShowOtModal(false)}
          onSaved={() => { setShowOtModal(false); loadAll(); }}
        />
      )}
      {editingOt && (
        <OneTimeExpenseModal
          initial={editingOt}
          onClose={() => setEditingOt(null)}
          onSaved={() => { setEditingOt(null); loadAll(); }}
        />
      )}
    </div>
  );
}

// =============== MODALS ===============

function TransactionModal({ leads, initial, onClose, onSaved }: { leads: LeadOption[]; initial?: Transaction | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<TxType>(initial?.type ?? "entrata");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [leadId, setLeadId] = useState(initial?.lead_id ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(initial?.invoice_number ?? "");
  const initialPaidBy: Partner = initial?.paid_by === "stefano" ? "stefano" : "pat";
  const [paidBy, setPaidBy] = useState<Partner>(initialPaidBy);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!supabase || !amount) return;
    setSaving(true);
    const payload = {
      type,
      amount: parseFloat(amount),
      category: category || null,
      date,
      description: description || null,
      lead_id: leadId || null,
      invoice_number: invoiceNumber || null,
      paid_by: paidBy,
    };
    if (initial) {
      await supabase.from("transactions").update(payload).eq("id", initial.id);
    } else {
      await supabase.from("transactions").insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{initial ? "Modifica transazione" : "Nuova transazione"}</h2>
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
              {(["pat", "stefano"] as Partner[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPaidBy(h)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition uppercase tracking-wide",
                    paidBy === h
                      ? h === "pat"
                        ? "bg-cyan-950 text-cyan-400 shadow-[inset_0_0_18px_rgba(0,212,255,0.18)]"
                        : "bg-amber-950 text-amber-400 shadow-[inset_0_0_18px_rgba(251,191,36,0.18)]"
                      : "text-muted-foreground hover:text-white",
                  )}
                >
                  {partnerLabel[h]}
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

function FixedExpenseModal({ initial, onClose, onSaved }: { initial?: FixedExpense | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [frequency, setFrequency] = useState<"mensile" | "annuale">(initial?.frequency ?? "mensile");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [paidBy, setPaidBy] = useState<Partner>((initial?.paid_by as Partner) ?? "pat");
  const [dueDay, setDueDay] = useState<string>(() => {
    if (initial?.frequency === "mensile" && initial.due_date) return initial.due_date;
    return "1";
  });
  const [dueDate, setDueDate] = useState<string>(() => {
    if (initial?.frequency === "annuale" && initial.due_date) return initial.due_date;
    return new Date().toISOString().slice(0, 10);
  });
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!supabase || !name || !amount) return;
    setSaving(true);
    const due_date = frequency === "mensile"
      ? String(Math.min(31, Math.max(1, parseInt(dueDay || "1", 10) || 1)))
      : dueDate;
    const payload = {
      name,
      amount: parseFloat(amount),
      frequency,
      category: category || null,
      active,
      paid_by: paidBy,
      due_date,
    };
    if (initial) {
      await supabase.from("fixed_expenses").update(payload).eq("id", initial.id);
    } else {
      await supabase.from("fixed_expenses").insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{initial ? "Modifica spesa fissa" : "Nuova spesa fissa"}</h2>
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
          {frequency === "mensile" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Giorno del mese (1-31)</span>
              <input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} className={inputClass} placeholder="Es. 15" />
            </label>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Data scadenza annuale</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </label>
          )}
          <div>
            <span className="mb-1 block text-sm text-muted-foreground">Gestito da</span>
            <div className="inline-flex w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-1">
              {(["pat", "stefano"] as Partner[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPaidBy(h)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                    paidBy === h
                      ? h === "pat"
                        ? "bg-cyan-950 text-cyan-400 shadow-[inset_0_0_18px_rgba(0,212,255,0.18)]"
                        : "bg-amber-950 text-amber-400 shadow-[inset_0_0_18px_rgba(251,191,36,0.18)]"
                      : "text-muted-foreground hover:text-white",
                  )}
                >
                  {partnerLabel[h]}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.05)] accent-primary" />
            Attivo (incluso nei calcoli)
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

type SettlementDirection = "pat_to_stefano" | "stefano_to_pat";

interface SettlementEvent {
  id: string;
  direction: SettlementDirection | string;
  net_amount: number;
  pat_balance: number | null;
  stefano_balance: number | null;
  settled_at: string;
  period_start: string | null;
  period_end: string | null;
  reversed: boolean;
  reversed_at: string | null;
  note: string | null;
  receipt_url: string | null;
  created_at?: string;
}

const RECEIPTS_BUCKET = "settlement-receipts";

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const daysBetween = (a: string, b: string) => {
  const ms = new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime();
  return Math.max(0, Math.floor(ms / 86400000));
};

const fmtDateIt = (d: string) =>
  new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });

function DivisoriaModal({ onClose }: { onClose: () => void }) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [oneTime, setOneTime] = useState<OneTimeExpense[]>([]);
  const [events, setEvents] = useState<SettlementEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal step state for "Registra saldo"
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    const [tx, fe, ot, se] = await Promise.all([
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").eq("active", true),
      supabase.from("one_time_expenses").select("*").order("date", { ascending: false }),
      supabase
        .from("settlement_events")
        .select("*")
        .order("settled_at", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    setTxs((tx.data as Transaction[]) ?? []);
    setFixed((fe.data as FixedExpense[]) ?? []);
    setOneTime((ot.data as OneTimeExpense[]) ?? []);
    setEvents((se.data as SettlementEvent[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const today = isoDay(new Date());

  // ---------- periodStart: ultimo settlement non stornato, oppure data più vecchia ----------
  const lastSettlement = events.find((e) => !e.reversed) ?? null;
  const oldestDate = useMemo(() => {
    const dates: string[] = [];
    txs.forEach((t) => t.date && dates.push(t.date));
    oneTime.forEach((o) => o.date && dates.push(o.date));
    fixed.forEach((f: any) => f.created_at && dates.push(String(f.created_at).slice(0, 10)));
    if (dates.length === 0) return today;
    return dates.sort()[0];
  }, [txs, oneTime, fixed, today]);

  const periodStart = lastSettlement?.settled_at?.slice(0, 10) ?? oldestDate;
  const cycleDays = daysBetween(periodStart, today);
  const isFirstCycle = !lastSettlement;

  // ---------- COMPONENTE 1 — Abbonamenti (pro-rated) ----------
  const subscriptionRows = useMemo(() => {
    return fixed.map((f: any) => {
      const created = f.created_at ? String(f.created_at).slice(0, 10) : periodStart;
      const startDate = created > periodStart ? created : periodStart;
      const days = daysBetween(startDate, today);
      const elapsed = f.frequency === "annuale" ? days / 365 : days / 30;
      const prorated = Number(f.amount || 0) * elapsed;
      const paidBy = (f.paid_by as Partner | null) ?? null;
      let delta = 0;
      if (paidBy === "pat") delta = prorated / 2;
      else if (paidBy === "stefano") delta = -prorated / 2;
      return { id: f.id, name: f.name, amount: Number(f.amount || 0), frequency: f.frequency, paidBy, prorated, delta, startDate, days };
    });
  }, [fixed, periodStart, today]);

  const subTotal = subscriptionRows.reduce((s, r) => s + r.delta, 0);

  // ---------- COMPONENTE 2 — Spese una tantum ----------
  const oneTimeRows = useMemo(() => {
    return oneTime
      .filter((o) => o.date >= periodStart)
      .map((o) => {
        const amt = Number(o.amount || 0);
        const delta = o.paid_by === "pat" ? amt / 2 : -amt / 2;
        return { ...o, delta };
      });
  }, [oneTime, periodStart]);

  const oneTimeTotal = oneTimeRows.reduce((s, r) => s + r.delta, 0);

  // ---------- COMPONENTE 3 — Transazioni ----------
  const txRows = useMemo(() => {
    return txs
      .filter((t) => t.date >= periodStart && (t.paid_by === "pat" || t.paid_by === "stefano"))
      .map((t) => {
        const amt = Number(t.amount || 0);
        let delta = 0;
        if (t.type === "uscita") delta = t.paid_by === "pat" ? amt / 2 : -amt / 2;
        else delta = t.paid_by === "pat" ? -amt / 2 : amt / 2;
        return { ...t, delta };
      });
  }, [txs, periodStart]);

  const txTotal = txRows.reduce((s, r) => s + r.delta, 0);

  // ---------- patDelta finale ----------
  const patDelta = subTotal + oneTimeTotal + txTotal;

  let direction: SettlementDirection | null = null;
  let netAmount = 0;
  if (Math.abs(patDelta) >= 0.01) {
    direction = patDelta > 0 ? "stefano_to_pat" : "pat_to_stefano";
    netAmount = Math.abs(patDelta);
  }

  // ---------- Card socio: Anticipato / Ricevuto / Netto (solo periodo corrente) ----------
  const partnerStats = (partner: Partner) => {
    let anticipato = 0;
    let ricevuto = 0;
    // fixed expenses pro-rated
    subscriptionRows.forEach((r) => {
      if (r.paidBy === partner) anticipato += r.prorated;
    });
    // one-time
    oneTimeRows.forEach((r) => {
      if (r.paid_by === partner) anticipato += Number(r.amount || 0);
    });
    // transactions
    txRows.forEach((t) => {
      if (t.paid_by === partner) {
        if (t.type === "uscita") anticipato += Number(t.amount || 0);
        else ricevuto += Number(t.amount || 0);
      }
    });
    return { anticipato, ricevuto, netto: anticipato - ricevuto };
  };

  const patStats = partnerStats("pat");
  const stefanoStats = partnerStats("stefano");

  const directionArrow = (d: string) =>
    d === "stefano_to_pat" ? "Stefano → Pat" : "Pat → Stefano";

  const deltaLabel = (delta: number) => {
    if (Math.abs(delta) < 0.01) return "—";
    return delta > 0
      ? `→ Stefano deve ${eur(delta)}`
      : `→ Pat deve ${eur(-delta)}`;
  };

  // ---------- Conferma definitiva ----------
  const confirmRegister = async () => {
    if (!supabase || !direction) return;
    setSubmitting(true);

    let receiptUrl: string | null = null;
    if (receiptFile) {
      const ext = receiptFile.name.split(".").pop() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, receiptFile, {
        contentType: receiptFile.type || undefined,
        upsert: false,
      });
      if (up.error) {
        // Bucket potrebbe non esistere o non essere pubblico — avvisa ma non bloccare
        // eslint-disable-next-line no-alert
        alert(
          `Errore upload allegato: ${up.error.message}\n\nAssicurati che il bucket "${RECEIPTS_BUCKET}" esista e sia pubblico.\nIl saldo verrà comunque registrato senza allegato.`,
        );
      } else {
        const { data: pub } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path);
        receiptUrl = pub.publicUrl;
      }
    }

    await supabase.from("settlement_events").insert({
      settled_at: today,
      pat_balance: Number(patDelta.toFixed(2)),
      stefano_balance: Number((-patDelta).toFixed(2)),
      net_amount: Number(netAmount.toFixed(2)),
      direction,
      note: noteText.trim() || null,
      receipt_url: receiptUrl,
      period_start: periodStart,
      period_end: today,
      reversed: false,
    });

    setSubmitting(false);
    setReceiptFile(null);
    setNoteText("");
    setStep(0);
    await load();
  };

  const reverseEvent = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm("Confermi lo storno di questo saldo? L'importo tornerà nel bilancio.")) return;
    await supabase
      .from("settlement_events")
      .update({ reversed: true, reversed_at: new Date().toISOString() })
      .eq("id", id);
    await load();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#070b14]" style={{ height: "100vh", width: "100vw" }}>
      {/* HEADER */}
      <div className="flex-shrink-0 border-b border-[rgba(255,255,255,0.06)]">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight text-white">Divisoria</h2>
          <div className="ml-auto flex items-center gap-2">
            {direction && !loading && (
              <button
                onClick={() => setStep(1)}
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
        <div className="mx-auto max-w-6xl space-y-8 p-6">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Caricamento…</p>
          ) : (
            <>
              {/* CARD SOCI */}
              <div className="rounded-2xl border border-[rgba(0,212,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                <div className="grid grid-cols-1 divide-y divide-[rgba(255,255,255,0.06)] md:grid-cols-2 md:divide-x md:divide-y-0">
                  <PartnerSummary name="PAT" accent="cyan" anticipato={patStats.anticipato} ricevuto={patStats.ricevuto} netto={patStats.netto} />
                  <PartnerSummary name="STEFANO" accent="amber" anticipato={stefanoStats.anticipato} ricevuto={stefanoStats.ricevuto} netto={stefanoStats.netto} />
                </div>
              </div>

              {/* CONTATORE CICLO */}
              <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {isFirstCycle ? "Primo ciclo" : "Ciclo corrente"}
                  </p>
                  <p className="mt-1 text-sm text-white/90">
                    {isFirstCycle
                      ? `Dal ${fmtDateIt(periodStart)} (data più vecchia)`
                      : `Dal ${fmtDateIt(periodStart)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black tracking-tight text-primary tabular-nums">{cycleDays}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">giorni</p>
                </div>
              </div>

              {/* SEZIONE 1 — ABBONAMENTI */}
              <BalanceSection
                title="Abbonamenti"
                hint={`Ciclo: ${cycleDays} giorni — pro-rated`}
                rows={subscriptionRows.length}
                subtotal={subTotal}
              >
                {subscriptionRows.length === 0 ? (
                  <EmptyRow text="Nessun abbonamento attivo" />
                ) : (
                  subscriptionRows.map((r) => (
                    <RowLine key={r.id}>
                      <span className="min-w-0 flex-1 truncate text-white/90">{r.name}</span>
                      <span className="w-32 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {eur(r.amount)} / {r.frequency === "annuale" ? "anno" : "mese"}
                      </span>
                      <PartnerBadge p={r.paidBy} />
                      <span className="w-44 shrink-0 text-right text-sm tabular-nums text-white">{deltaLabel(r.delta)}</span>
                    </RowLine>
                  ))
                )}
              </BalanceSection>

              {/* SEZIONE 2 — SPESE UNA TANTUM */}
              <BalanceSection
                title="Spese una tantum"
                hint={`dal ${fmtDateIt(periodStart)}`}
                rows={oneTimeRows.length}
                subtotal={oneTimeTotal}
              >
                {oneTimeRows.length === 0 ? (
                  <EmptyRow text="Nessuna spesa una tantum nel periodo" />
                ) : (
                  oneTimeRows.map((r) => (
                    <RowLine key={r.id}>
                      <span className="min-w-0 flex-1 truncate text-white/90">{r.description ?? "—"}</span>
                      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{eur(Number(r.amount))}</span>
                      <PartnerBadge p={r.paid_by} />
                      <span className="w-44 shrink-0 text-right text-sm tabular-nums text-white">{deltaLabel(r.delta)}</span>
                    </RowLine>
                  ))
                )}
              </BalanceSection>

              {/* SEZIONE 3 — TRANSAZIONI */}
              <BalanceSection
                title="Transazioni"
                hint={`dal ${fmtDateIt(periodStart)}`}
                rows={txRows.length}
                subtotal={txTotal}
              >
                {txRows.length === 0 ? (
                  <EmptyRow text="Nessuna transazione nel periodo" />
                ) : (
                  txRows.map((t) => (
                    <RowLine key={t.id}>
                      <span className="min-w-0 flex-1 truncate text-white/90">{t.description ?? "—"}</span>
                      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{eur(Number(t.amount))}</span>
                      <span
                        className={cn(
                          "inline-flex w-20 shrink-0 justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          t.type === "entrata"
                            ? "border-emerald-800 bg-emerald-950 text-emerald-400"
                            : "border-red-900 bg-red-950 text-red-400",
                        )}
                      >
                        {t.type}
                      </span>
                      <PartnerBadge p={t.paid_by as Partner} />
                      <span className="w-44 shrink-0 text-right text-sm tabular-nums text-white">{deltaLabel(t.delta)}</span>
                    </RowLine>
                  ))
                )}
              </BalanceSection>

              {/* BILANCIO NETTO */}
              <div className="rounded-2xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.04)] px-6 py-5">
                <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Bilancio netto
                  </span>
                  {direction ? (
                    <div className="flex items-center gap-3 text-sm md:text-base">
                      <span className="text-muted-foreground">{directionArrow(direction)}</span>
                      <span className="text-3xl font-black tracking-tight text-primary md:text-4xl">{eur(netAmount)}</span>
                    </div>
                  ) : (
                    <span className="text-base font-semibold text-emerald-400">In pareggio ✓</span>
                  )}
                </div>
              </div>

              {/* STORICO SALDI */}
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Storico saldi</h3>
                  <span className="text-[11px] text-muted-foreground">
                    {events.length} evento{events.length === 1 ? "" : "i"}
                  </span>
                </div>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.06)]">
                  {events.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nessun saldo registrato</p>
                  ) : (
                    <ul className="divide-y divide-[rgba(255,255,255,0.06)]">
                      {events.map((e) => (
                        <li
                          key={e.id}
                          className={cn(
                            "flex flex-wrap items-center gap-3 px-4 py-3 text-sm",
                            e.reversed && "opacity-50",
                          )}
                        >
                          <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">{fmtDateIt(e.settled_at)}</span>
                          <span
                            className={cn(
                              "min-w-0 flex-1 text-white/90",
                              e.reversed && "line-through",
                            )}
                          >
                            {directionArrow(e.direction)} <span className="font-semibold text-white">{eur(Number(e.net_amount))}</span>
                            {e.period_start && e.period_end && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                · dal {fmtDateIt(e.period_start)} al {fmtDateIt(e.period_end)}
                              </span>
                            )}
                            {e.note && <span className="ml-2 text-xs italic text-muted-foreground">— {e.note}</span>}
                          </span>
                          {e.receipt_url && (
                            <a
                              href={e.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[rgba(0,212,255,0.3)] text-primary transition hover:bg-[rgba(0,212,255,0.1)]"
                              aria-label="Apri ricevuta"
                            >
                              <Paperclip className="h-3.5 w-3.5" />
                            </a>
                          )}
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
                          {!e.reversed && (
                            <button
                              onClick={() => reverseEvent(e.id)}
                              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-[rgba(255,255,255,0.08)] px-2 text-[11px] text-muted-foreground transition hover:border-destructive hover:text-destructive"
                              aria-label="Storna saldo"
                            >
                              <Undo2 className="h-3 w-3" /> Storna
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* STEP 1 — Riepilogo */}
      {step === 1 && direction && (
        <ConfirmDialog
          title="Step 1 di 3 — Riepilogo"
          body={
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Periodo dal <span className="text-white">{fmtDateIt(periodStart)}</span> al <span className="text-white">{fmtDateIt(today)}</span> ({cycleDays} giorni)
              </p>
              <MiniRow label="Abbonamenti" value={subTotal} />
              <MiniRow label="Spese una tantum" value={oneTimeTotal} />
              <MiniRow label="Transazioni" value={txTotal} />
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bilancio netto</span>
                  <span className="text-lg font-bold text-primary">{directionArrow(direction)} {eur(netAmount)}</span>
                </div>
              </div>
            </div>
          }
          cancelLabel="Annulla"
          confirmLabel="Continua →"
          onCancel={() => setStep(0)}
          onConfirm={() => setStep(2)}
        />
      )}

      {/* STEP 2 — Allegato e nota */}
      {step === 2 && direction && (
        <ConfirmDialog
          title="Step 2 di 3 — Allegato e nota"
          body={
            <div className="space-y-4 text-sm">
              <div>
                <span className="mb-1 block text-muted-foreground">Allegato (immagine o PDF, opzionale)</span>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-xs text-muted-foreground transition hover:border-primary hover:text-white">
                  <Upload className="h-4 w-4" />
                  {receiptFile ? receiptFile.name : "Scegli file…"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {receiptFile && (
                  <button
                    onClick={() => setReceiptFile(null)}
                    className="mt-2 text-[11px] text-muted-foreground underline hover:text-destructive"
                  >
                    Rimuovi allegato
                  </button>
                )}
              </div>
              <label className="block">
                <span className="mb-1 block text-muted-foreground">Nota (opzionale)</span>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className={inputClass}
                  placeholder="Es. Bonifico ricevuto / Pagamento effettuato in data…"
                />
              </label>
            </div>
          }
          cancelLabel="Indietro"
          confirmLabel="Continua →"
          onCancel={() => setStep(1)}
          onConfirm={() => setStep(3)}
        />
      )}

      {/* STEP 3 — Conferma definitiva */}
      {step === 3 && direction && (
        <ConfirmDialog
          title="Step 3 di 3 — Conferma"
          body={
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">Stai per registrare il seguente saldo:</p>
              <div className="rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] p-4 text-center">
                <p className="text-lg font-bold text-primary">{directionArrow(direction)} {eur(netAmount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  periodo {fmtDateIt(periodStart)} → {fmtDateIt(today)}
                </p>
                {receiptFile && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    📎 {receiptFile.name}
                  </p>
                )}
                {noteText.trim() && (
                  <p className="mt-1 text-[11px] italic text-muted-foreground">"{noteText.trim()}"</p>
                )}
              </div>
            </div>
          }
          cancelLabel="Indietro"
          confirmLabel={submitting ? "Registrazione…" : "Conferma saldo ✓"}
          onCancel={() => !submitting && setStep(2)}
          onConfirm={() => !submitting && confirmRegister()}
        />
      )}
    </div>,
    document.body,
  );
}

// ----- Sub-components Divisoria -----

function BalanceSection({
  title,
  hint,
  rows,
  subtotal,
  children,
}: {
  title: string;
  hint: string;
  rows: number;
  subtotal: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{title}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{rows} voc{rows === 1 ? "e" : "i"}</span>
      </div>
      <ul className="divide-y divide-[rgba(255,255,255,0.04)]">{children}</ul>
      <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.08)] px-5 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Subtotale</span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            Math.abs(subtotal) < 0.01
              ? "text-muted-foreground"
              : subtotal > 0
                ? "text-cyan-300"
                : "text-amber-300",
          )}
        >
          {Math.abs(subtotal) < 0.01
            ? "—"
            : subtotal > 0
              ? `→ Stefano deve ${eur(subtotal)}`
              : `→ Pat deve ${eur(-subtotal)}`}
        </span>
      </div>
    </div>
  );
}

function RowLine({ children }: { children: ReactNode }) {
  return <li className="flex items-center gap-3 px-5 py-2.5 text-sm">{children}</li>;
}

function EmptyRow({ text }: { text: string }) {
  return <li className="px-5 py-4 text-center text-xs text-muted-foreground">{text}</li>;
}

function PartnerBadge({ p }: { p: Partner | null }) {
  if (!p) {
    return (
      <span className="inline-flex w-20 shrink-0 justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        —
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex w-20 shrink-0 justify-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        partnerBadgeClass[p],
      )}
    >
      {partnerLabel[p]}
    </span>
  );
}

function MiniRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          Math.abs(value) < 0.01 ? "text-muted-foreground" : value > 0 ? "text-cyan-300" : "text-amber-300",
        )}
      >
        {Math.abs(value) < 0.01 ? "—" : value > 0 ? `+${eur(value)}` : `−${eur(-value)}`}
      </span>
    </div>
  );
}


function PartnerSummary({
  name,
  accent,
  anticipato,
  ricevuto,
  netto,
}: {
  name: string;
  accent: "cyan" | "amber";
  anticipato: number;
  ricevuto: number;
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
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Anticipato</p>
          <p className="mt-1 text-base font-bold text-red-400 tabular-nums">{eur(anticipato)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Ricevuto</p>
          <p className="mt-1 text-base font-bold text-emerald-300 tabular-nums">{eur(ricevuto)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Netto</p>
          <p className={cn("mt-1 text-base font-bold tabular-nums", netto < 0 ? "text-red-400" : accentClass)}>
            {eur(netto)}
          </p>
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

function OneTimeExpenseModal({ initial, onClose, onSaved }: { initial?: OneTimeExpense | null; onClose: () => void; onSaved: () => void }) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Collaboratore");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState<Partner>((initial?.paid_by as Partner) ?? "pat");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!supabase || !amount || !date) return;
    setSaving(true);
    const payload = {
      description: description || null,
      category: category || null,
      amount: parseFloat(amount),
      date,
      paid_by: paidBy,
      note: note || null,
    };
    if (initial) {
      await supabase.from("one_time_expenses").update(payload).eq("id", initial.id);
    } else {
      await supabase.from("one_time_expenses").insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{initial ? "Modifica spesa" : "Nuova spesa una tantum"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Descrizione</span>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Es. Pagamento collaboratore" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Categoria</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                <option value="Collaboratore">Collaboratore</option>
                <option value="Consulenza">Consulenza</option>
                <option value="Attrezzatura">Attrezzatura</option>
                <option value="Trasferta">Trasferta</option>
                <option value="Altro">Altro</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">Importo (€)</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
          </label>
          <div>
            <span className="mb-1 block text-sm text-muted-foreground">Gestito da</span>
            <div className="inline-flex w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] p-1">
              {(["pat", "stefano"] as Partner[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPaidBy(h)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                    paidBy === h
                      ? h === "pat"
                        ? "bg-cyan-950 text-cyan-400 shadow-[inset_0_0_18px_rgba(0,212,255,0.18)]"
                        : "bg-amber-950 text-amber-400 shadow-[inset_0_0_18px_rgba(251,191,36,0.18)]"
                      : "text-muted-foreground hover:text-white",
                  )}
                >
                  {partnerLabel[h]}
                </button>
              ))}
            </div>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Note (opzionale)</span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-muted-foreground hover:text-white">Annulla</button>
          <button onClick={onSave} disabled={saving || !amount || !date} className="rounded-xl border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.12)] px-4 py-2 text-sm font-semibold text-primary disabled:opacity-50">
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}
