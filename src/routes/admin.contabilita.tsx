import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

interface Transaction {
  id: string;
  type: TxType;
  category: string | null;
  amount: number;
  description: string | null;
  date: string;
  lead_id: string | null;
  invoice_number: string | null;
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

// =============== PAGE ===============

function ContabilitaPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showFxModal, setShowFxModal] = useState(false);
  const [filterType, setFilterType] = useState<"all" | TxType>("all");
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<string>(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

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

  // KPI computation — current month
  const kpi = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const inMonth = (d: string) => {
      const dt = new Date(d);
      return dt.getFullYear() === y && dt.getMonth() === m;
    };
    const entrateMese = transactions
      .filter((t) => t.type === "entrata" && inMonth(t.date))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const usciteTxMese = transactions
      .filter((t) => t.type === "uscita" && inMonth(t.date))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const usciteFisseMese = fixedExpenses
      .filter((f) => f.active)
      .reduce((s, f) => s + (f.frequency === "annuale" ? Number(f.amount) / 12 : Number(f.amount)), 0);
    const usciteMese = usciteTxMese + usciteFisseMese;
    const utile = entrateMese - usciteMese;
    const inAttesa = transactions.filter((t) => t.type === "entrata" && !t.invoice_number).length;
    return {
      entrateMese,
      usciteMese,
      utile,
      quotaPat: utile / 2,
      quotaSocio: utile / 2,
      inAttesa,
    };
  }, [transactions, fixedExpenses]);

  // Chart — last 6 months
  const cashFlow = useMemo(() => {
    const buckets: { key: string; month: string; entrate: number; uscite: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: monthNames[d.getMonth()],
        entrate: 0,
        uscite: 0,
      });
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
  }, [transactions, fixedExpenses]);

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

  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Falcon Agency</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Contabilità <span className="text-primary text-glow">{monthNames[now.getMonth()]}</span>
        </h1>
      </header>

      {/* KPI ROW */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminKpi icon={TrendingUp} title="Entrate totali" value={eur(kpi.entrateMese)} meta="mese corrente" tone="green" />
        <AdminKpi icon={TrendingDown} title="Uscite totali" value={eur(kpi.usciteMese)} meta="mese corrente + fisse" tone="orange" />
        <AdminKpi icon={DollarSign} title="Utile netto" value={eur(kpi.utile)} meta="entrate − uscite" tone="cyan" />
        <AdminKpi icon={User} title="Quota Pat" value={eur(kpi.quotaPat)} meta="50% utile" tone="cyan" />
        <AdminKpi icon={User} title="Quota Socio" value={eur(kpi.quotaSocio)} meta="50% utile" tone="cyan" />
        <AdminKpi icon={Clock} title="Fatture in attesa" value={String(kpi.inAttesa)} meta="entrate senza n° fattura" tone="orange" />
      </section>

      {/* CASH FLOW CHART */}
      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Cash flow" title="Entrate vs Uscite — ultimi 6 mesi" />
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
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]">
                <th className="py-4">Data</th>
                <th>Tipo</th>
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
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Caricamento…</td></tr>
              )}
              {!loading && filteredTx.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nessuna transazione</td></tr>
              )}
              {filteredTx.map((tx) => (
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
              ))}
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
