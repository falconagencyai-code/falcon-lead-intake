import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Calendar, CheckCircle2, Cpu, FileText, Loader2, Receipt, TrendingUp, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

import { AIMonitorPage } from "./admin/-ai-monitor-page";
import { ContractsPage } from "./admin/-contracts-page";
import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/clienti")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Clienti" },
      { name: "description", content: "Gestione clienti attivi Falcon Agency." },
    ],
  }),
  component: ClientiPage,
});

// ── Section tabs ────────────────────────────────────────────────────
type SectionTab = "clienti" | "contratti" | "fatture" | "ai-monitor";

const sectionTabs: { id: SectionTab; label: string; icon: typeof Users }[] = [
  { id: "clienti", label: "Clienti", icon: Users },
  { id: "contratti", label: "Contratti", icon: FileText },
  { id: "fatture", label: "Fatture", icon: Receipt },
  { id: "ai-monitor", label: "AI Monitor", icon: Cpu },
];

function ClientiPage() {
  const [section, setSection] = useState<SectionTab>("clienti");
  const { role } = useAuth();

  const visibleTabs = role === "admin"
    ? sectionTabs
    : sectionTabs.filter((t) => t.id === "clienti" || t.id === "contratti");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
        {visibleTabs.map((t) => {
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

      {section === "clienti" && <ClientiInner />}
      {section === "contratti" && <ContractsPage />}
      {section === "fatture" && <FattureSection />}
      {section === "ai-monitor" && <AIMonitorPage />}
    </div>
  );
}

function FattureSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*, lead:leads!lead_id(full_name, company, venditore:profiles!venditore_id(full_name))")
      .eq("status", "paid")
      .order("paid_at", { ascending: false });
    if (error) toast.error(`Errore fatture: ${error.message}`);
    else setPayments((data ?? []) as unknown as Payment[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const channel = supabase
      .channel("payments-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, []);

  const totale = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <p className="label-section">Fatturato</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Pagamenti <span className="text-primary text-glow">Confermati</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registrati automaticamente quando una proposta viene segnata come Pagata.
        </p>
      </header>

      {/* KPI totale */}
      {payments.length > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.05)] px-6 py-4">
          <TrendingUp className="h-8 w-8 shrink-0" style={{ color: "#4ade80" }} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Totale incassato</p>
            <p className="text-3xl font-black" style={{ color: "#4ade80" }}>
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(totale)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Transazioni</p>
            <p className="text-2xl font-black text-foreground">{payments.length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Caricamento…</span>
        </div>
      ) : payments.length === 0 ? (
        <AdminCard className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)]">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">Nessun pagamento ancora</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            I pagamenti appaiono qui automaticamente quando segni una proposta come Pagata.
          </p>
        </AdminCard>
      ) : (
        <AdminCard className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr className="border-b border-[rgba(0,212,255,0.1)]">
                  <th className="py-4">Cliente</th>
                  <th>Servizio</th>
                  <th>Venditore</th>
                  <th>Importo</th>
                  <th>Data pagamento</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] text-foreground/90">
                    <td className="py-4">
                      <p className="font-semibold text-foreground">{p.lead?.full_name ?? "—"}</p>
                      {p.lead?.company && (
                        <p className="text-xs text-muted-foreground">{p.lead.company}</p>
                      )}
                    </td>
                    <td className="text-muted-foreground">{p.description ?? "—"}</td>
                    <td className="text-muted-foreground">{p.lead?.venditore?.full_name ?? "—"}</td>
                    <td className="font-black" style={{ color: "#4ade80" }}>
                      {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.amount)}
                    </td>
                    <td className="text-muted-foreground">{fmtDate(p.paid_at)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] px-3 py-1 text-xs font-semibold" style={{ color: "#a78bfa" }}>
                        🔒 Pagato
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

// ── Types ───────────────────────────────────────────────────────────
type ProjectStatus = "In corso" | "Consegnato" | "In pausa";

type Payment = {
  id: string;
  lead_id: string | null;
  quote_id: string | null;
  amount: number;
  status: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
  lead: {
    full_name: string | null;
    company: string | null;
    venditore: { full_name: string | null } | null;
  } | null;
};

type ClientRow = {
  id: string;
  full_name: string | null;
  company: string | null;
  service_interest: string | null;
  client_status: string | null;
  project_start_date: string | null;
  next_meeting: string | null;
  created_at: string | null;
  venditore: { id: string; full_name: string | null } | null;
};

type QuoteRef = {
  id: string;
  lead_id: string;
  service: string | null;
  amount: number | null;
  status: string;
  pagato_at: string | null;
  content: string | null;
};

// ── Constants ───────────────────────────────────────────────────────
const CLIENT_STATUS_OPTIONS: ProjectStatus[] = ["In corso", "Consegnato", "In pausa"];

const projectStatusTone: Record<ProjectStatus, { color: string; bg: string; border: string }> = {
  "In corso":  { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)",   border: "rgba(0,212,255,0.32)"  },
  Consegnato:  { color: "#34d399",            bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.32)" },
  "In pausa":  { color: "#f59e0b",            bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.32)" },
};

const SERVICE_LABELS_C: Record<string, string> = {
  sito_web:             "Sito web",
  piattaforma_ai:       "Piattaforma AI",
  gestionale:           "Gestionale",
  automazione_ai_agent: "Automazione AI Agent",
  altro:                "Altro",
};

// ── Helpers ─────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try { return format(new Date(iso), "d MMM yyyy", { locale: it }); }
  catch { return "—"; }
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  try { return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: it }); }
  catch { return "—"; }
}

function toDateInput(iso: string | null) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  try { return format(new Date(iso), "yyyy-MM-dd"); }
  catch { return ""; }
}

function toDateTimeInput(iso: string | null) {
  if (!iso) return "";
  try { return format(new Date(iso), "yyyy-MM-dd'T'HH:mm"); }
  catch { return ""; }
}

function formatEuro(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

// ── ClientiInner ────────────────────────────────────────────────────
function ClientiInner() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const [clientRes, quoteRes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, full_name, company, service_interest, client_status, project_start_date, next_meeting, created_at, venditore:profiles!venditore_id(id, full_name)")
        .eq("pipeline_stage", "chiuso_vinto")
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("id, lead_id, service, amount, status, pagato_at, content")
        .in("status", ["Accettata", "Pagato"]),
    ]);
    if (clientRes.error) toast.error(`Errore clienti: ${clientRes.error.message}`);
    else setClients((clientRes.data ?? []) as unknown as ClientRow[]);
    setQuotes((quoteRes.data ?? []) as QuoteRef[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const channel = supabase
      .channel("clienti-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" },  () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => load())
      .subscribe();
    return () => { supabase!.removeChannel(channel); };
  }, []);

  const updateClient = async (
    id: string,
    patch: Partial<Pick<ClientRow, "client_status" | "project_start_date" | "next_meeting">>,
  ) => {
    if (!supabase) return;
    setClients((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) { toast.error(`Errore: ${error.message}`); load(); }
    else toast.success("Cliente aggiornato");
  };

  const active = clients.find((c) => c.id === activeId) ?? null;

  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Falcon Agency</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Clienti <span className="text-primary text-glow">Attivi</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Lead chiusi come Vinto. Apri un cliente per vedere la proposta accettata e gestire il progetto.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Caricamento clienti…</span>
        </div>
      ) : !isSupabaseConfigured ? (
        <AdminCard className="p-8 text-center text-sm text-amber-300">
          Supabase non configurato. Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.
        </AdminCard>
      ) : clients.length === 0 ? (
        <AdminCard className="p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)]">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">Nessun cliente ancora</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Quando un lead viene chiuso come Vinto compare qui automaticamente.
          </p>
        </AdminCard>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const statusKey = (c.client_status as ProjectStatus) ?? "In corso";
            const tone = projectStatusTone[statusKey] ?? projectStatusTone["In corso"];
            const serviceLabel = c.service_interest
              ? SERVICE_LABELS_C[c.service_interest] ?? c.service_interest
              : "—";
            const quote = quotes.find((q) => q.lead_id === c.id);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="glass glass-hover p-5 text-left transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground truncate">
                      {c.company ?? "—"}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-foreground truncate">
                      {c.full_name ?? "(senza nome)"}
                    </h3>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
                  >
                    {statusKey}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] px-3 py-1 text-xs font-semibold text-primary">
                    {serviceLabel}
                  </span>
                  {c.venditore && (
                    <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold text-muted-foreground">
                      👤 {c.venditore.full_name ?? "—"}
                    </span>
                  )}
                </div>

                {/* Proposta accettata */}
                {quote && (
                  <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2"
                    style={{
                      background: quote.status === "Pagato" ? "rgba(167,139,250,0.06)" : "rgba(52,211,153,0.06)",
                      border: `1px solid ${quote.status === "Pagato" ? "rgba(167,139,250,0.2)" : "rgba(52,211,153,0.2)"}`,
                    }}>
                    <span className="text-xs font-semibold" style={{ color: quote.status === "Pagato" ? "#a78bfa" : "#34d399" }}>
                      {quote.status === "Pagato" ? "🔒 Pagato" : "✓ Proposta accettata"}
                    </span>
                    <span className="text-sm font-black" style={{ color: quote.status === "Pagato" ? "#a78bfa" : "#34d399" }}>
                      {formatEuro(quote.amount)}
                    </span>
                  </div>
                )}

                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Inizio progetto</span>
                    <span className="text-foreground">{fmtDate(c.project_start_date)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Prossimo meeting
                    </span>
                    <span className="text-foreground">{fmtDateTime(c.next_meeting)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {active && (
        <ClientDrawer
          client={active}
          quote={quotes.find((q) => q.lead_id === active.id) ?? null}
          onClose={() => setActiveId(null)}
          onUpdate={(patch) => updateClient(active.id, patch)}
        />
      )}
    </div>
  );
}

// ── ClientDrawer ────────────────────────────────────────────────────
function ClientDrawer({
  client,
  quote,
  onClose,
  onUpdate,
}: {
  client: ClientRow;
  quote: QuoteRef | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<ClientRow, "client_status" | "project_start_date" | "next_meeting">>) => void;
}) {
  const { role } = useAuth();
  const [status, setStatus] = useState<ProjectStatus>((client.client_status as ProjectStatus) ?? "In corso");
  const [startDate, setStartDate] = useState(toDateInput(client.project_start_date));
  const [nextMeeting, setNextMeeting] = useState(toDateTimeInput(client.next_meeting));

  useEffect(() => {
    setStatus((client.client_status as ProjectStatus) ?? "In corso");
    setStartDate(toDateInput(client.project_start_date));
    setNextMeeting(toDateTimeInput(client.next_meeting));
  }, [client.id]);

  const serviceLabel = client.service_interest
    ? SERVICE_LABELS_C[client.service_interest] ?? client.service_interest
    : "—";

  const isReadOnly = role === "venditore";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="relative z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[rgba(0,212,255,0.25)] bg-[rgba(7,11,20,0.97)] p-6 shadow-[0_0_60px_rgba(0,212,255,0.15)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-section truncate">{client.company ?? "—"}</p>
            <h2 className="mt-2 text-2xl font-black text-foreground truncate">
              {client.full_name ?? "(senza nome)"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{serviceLabel}</p>
            {client.venditore && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[rgba(0,212,255,0.15)] bg-[rgba(0,212,255,0.06)] px-2.5 py-0.5 text-xs font-semibold text-primary">
                👤 {client.venditore.full_name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.2)] text-muted-foreground hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Proposta accettata — read-only per tutti */}
        {quote ? (
          <div className="mt-5 rounded-2xl p-4 space-y-2"
            style={{
              background: quote.status === "Pagato" ? "rgba(167,139,250,0.06)" : "rgba(52,211,153,0.06)",
              border: `1px solid ${quote.status === "Pagato" ? "rgba(167,139,250,0.25)" : "rgba(52,211,153,0.25)"}`,
            }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Proposta accettata
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: quote.status === "Pagato" ? "rgba(167,139,250,0.15)" : "rgba(52,211,153,0.12)",
                  color: quote.status === "Pagato" ? "#a78bfa" : "#34d399",
                }}>
                {quote.status === "Pagato" ? "🔒 Pagato" : "Accettata"}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{quote.service ?? "—"}</p>
            <p className="text-2xl font-black"
              style={{ color: quote.status === "Pagato" ? "#a78bfa" : "#34d399" }}>
              {formatEuro(quote.amount)}
            </p>
            {quote.pagato_at && (
              <p className="text-xs text-muted-foreground">Pagata il {fmtDate(quote.pagato_at)}</p>
            )}
            {quote.content && (
              <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap border-t border-[rgba(255,255,255,0.06)] pt-2">
                {quote.content}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
            <p className="text-sm text-muted-foreground">Nessuna proposta accettata.</p>
            <p className="mt-0.5 text-xs text-muted-foreground opacity-60">Gestisci le proposte dalla sezione Lead.</p>
          </div>
        )}

        {/* Gestione progetto */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Status progetto
            </label>
            {isReadOnly ? (
              <p className="mt-1.5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm font-semibold text-foreground">
                {status}
              </p>
            ) : (
              <select
                value={status}
                onChange={(e) => {
                  const v = e.target.value as ProjectStatus;
                  setStatus(v);
                  onUpdate({ client_status: v });
                }}
                className="mt-1.5 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                {CLIENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Data inizio progetto
            </label>
            <input
              type="date"
              value={startDate}
              readOnly={isReadOnly}
              onChange={(e) => {
                if (isReadOnly) return;
                setStartDate(e.target.value);
                onUpdate({ project_start_date: e.target.value || null });
              }}
              className="mt-1.5 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              style={isReadOnly ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Prossimo meeting
            </label>
            <input
              type="datetime-local"
              value={nextMeeting}
              readOnly={isReadOnly}
              onChange={(e) => {
                if (isReadOnly) return;
                setNextMeeting(e.target.value);
                onUpdate({
                  next_meeting: e.target.value ? new Date(e.target.value).toISOString() : null,
                });
              }}
              className="mt-1.5 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              style={isReadOnly ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            />
          </div>
        </div>

        <div className="mt-auto pt-6 text-xs text-muted-foreground">
          Cliente dal {fmtDate(client.created_at)}
        </div>
      </aside>
    </div>
  );
}
