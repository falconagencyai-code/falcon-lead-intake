import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Cpu, FileText, Loader2, Plus, Receipt, Users, X } from "lucide-react";
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
      { name: "description", content: "Gestione clienti attivi e proposte commerciali Falcon Agency." },
    ],
  }),
  component: ClientiPage,
});

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
      {section === "fatture" && <FattureEmpty />}
      {section === "ai-monitor" && <AIMonitorPage />}
    </div>
  );
}

function FattureEmpty() {
  return (
    <AdminCard className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)]">
          <Receipt className="h-7 w-7 text-primary" />
        </div>
        <AdminSectionTitle eyebrow="Coming soon" title="In arrivo" />
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Sezione in costruzione — il modulo fatturazione sarà disponibile a breve.
        </p>
      </div>
    </AdminCard>
  );
}

type ProjectStatus = "In corso" | "Consegnato" | "In pausa";
type ProposalStatus = "Inviata" | "Vista" | "Accettata" | "Rifiutata" | "Scaduta";

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

const CLIENT_STATUS_OPTIONS: ProjectStatus[] = ["In corso", "Consegnato", "In pausa"];

const projectStatusTone: Record<ProjectStatus, { color: string; bg: string; border: string }> = {
  "In corso": { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.32)" },
  Consegnato: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  "In pausa": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.32)" },
};

const SERVICE_LABELS_C: Record<string, string> = {
  sito_web: "Sito web",
  piattaforma_ai: "Piattaforma AI",
  gestionale: "Gestionale",
  automazione_ai_agent: "Automazione AI Agent",
  altro: "Altro",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy", { locale: it });
  } catch {
    return "—";
  }
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: it });
  } catch {
    return "—";
  }
}

function toDateInput(iso: string | null) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  try {
    return format(new Date(iso), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

function toDateTimeInput(iso: string | null) {
  if (!iso) return "";
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

const proposalStatusTone: Record<ProposalStatus, { color: string; bg: string; border: string }> = {
  Inviata: { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.32)" },
  Vista: { color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.32)" },
  Accettata: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  Rifiutata: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  Scaduta: { color: "var(--falcon-subtle)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" },
};

type Quote = {
  id: string;
  lead_id: string;
  service: string | null;
  amount: number | null;
  content: string | null;
  status: ProposalStatus;
  rejection_reason: string | null;
  sent_at: string | null;
  created_at: string;
  leads?: { full_name: string | null; company: string | null } | null;
};

type LeadOption = { id: string; full_name: string | null; company: string | null };

const QUOTE_STATUS_OPTIONS: ProposalStatus[] = ["Inviata", "Vista", "Accettata", "Rifiutata", "Scaduta"];

function formatEuro(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function ClientiInner() {
  const [tab, setTab] = useState<"clienti" | "proposte">("clienti");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Quote[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const loadClients = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, full_name, company, service_interest, client_status, project_start_date, next_meeting, created_at, venditore:profiles!venditore_id(id, full_name)")
      .eq("pipeline_stage", "chiuso_vinto")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Errore caricamento clienti: ${error.message}`);
    } else {
      setClients((data ?? []) as ClientRow[]);
    }
    setLoading(false);
  };

  const loadProposals = async () => {
    if (!supabase) return;
    setProposalsLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*, leads(full_name, company)")
      .order("created_at", { ascending: false });
    if (error) toast.error(`Errore proposte: ${error.message}`);
    else setProposals((data ?? []) as Quote[]);
    setProposalsLoading(false);
  };

  const loadLeadOptions = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("leads")
      .select("id, full_name, company")
      .eq("pipeline_stage", "chiuso_vinto")
      .order("created_at", { ascending: false });
    if (!error) setLeadOptions((data ?? []) as LeadOption[]);
  };

  useEffect(() => {
    loadClients();
    loadProposals();
    loadLeadOptions();

    if (!supabase) return;

    // Realtime sync — any change on leads/quotes refreshes this page instantly
    const channel = supabase
      .channel("clienti-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        loadClients();
        loadLeadOptions();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => {
        loadProposals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const active = clients.find((c) => c.id === activeId) ?? null;
  const activeQuote = proposals.find((q) => q.id === activeQuoteId) ?? null;

  const updateClient = async (
    id: string,
    patch: Partial<Pick<ClientRow, "client_status" | "project_start_date" | "next_meeting">>,
  ) => {
    if (!supabase) return;
    setClients((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) {
      toast.error(`Errore: ${error.message}`);
      loadClients();
    } else {
      toast.success("Cliente aggiornato");
    }
  };

  const updateQuote = async (id: string, patch: Partial<Quote>) => {
    if (!supabase) return;
    setProposals((list) => list.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    const { error } = await supabase.from("quotes").update(patch).eq("id", id);
    if (error) {
      toast.error(`Errore: ${error.message}`);
      loadProposals();
    } else {
      toast.success("Proposta aggiornata");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-section">Falcon Agency</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Clienti & <span className="text-primary text-glow">Proposte</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Clienti generati automaticamente dai lead chiusi come Vinto.
          </p>
        </div>
        {tab === "proposte" && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.1)] px-5 text-sm font-semibold text-primary shadow-[0_0_24px_rgba(0,212,255,0.2)] transition hover:bg-[rgba(0,212,255,0.18)]"
          >
            <Plus className="h-4 w-4" /> Nuova proposta
          </button>
        )}
      </header>

      <div className="flex gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
        {([
          { id: "clienti", label: `Clienti · ${clients.length}` },
          { id: "proposte", label: `Proposte · ${proposals.length}` },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "bg-[rgba(0,212,255,0.12)] text-primary shadow-[inset_0_0_24px_rgba(0,212,255,0.08)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "clienti" ? (
        loading ? (
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
              I lead chiusi come Vinto appariranno qui automaticamente.
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] px-3 py-1 text-xs font-semibold text-primary">
                      {serviceLabel}
                    </span>
                    {c.venditore && (
                      <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs font-semibold text-muted-foreground">
                        👤 {c.venditore.full_name ?? "—"}
                      </span>
                    )}
                  </div>
                  <div className="mt-5 space-y-2 text-sm">
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
        )
      ) : (
        <AdminCard className="p-5">
          <AdminSectionTitle eyebrow="Pipeline" title="Proposte commerciali" />
          {proposalsLoading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Caricamento proposte…</span>
            </div>
          ) : proposals.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nessuna proposta ancora.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <tr className="border-b border-[rgba(0,212,255,0.1)]">
                    <th className="py-4">Cliente</th>
                    <th>Servizio</th>
                    <th>Valore</th>
                    <th>Data invio</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => {
                    const tone = proposalStatusTone[p.status] ?? proposalStatusTone.Inviata;
                    const lead = p.leads;
                    const clientLabel = lead
                      ? `${lead.full_name ?? "(senza nome)"}${lead.company ? ` — ${lead.company}` : ""}`
                      : "—";
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setActiveQuoteId(p.id)}
                        className="cursor-pointer border-b border-[rgba(255,255,255,0.06)] text-foreground/90 transition hover:bg-[rgba(0,212,255,0.04)]"
                      >
                        <td className="py-4 font-medium">{clientLabel}</td>
                        <td className="text-muted-foreground">{p.service ?? "—"}</td>
                        <td className="font-semibold text-foreground">{formatEuro(p.amount)}</td>
                        <td className="text-muted-foreground">{fmtDate(p.sent_at)}</td>
                        <td>
                          <span
                            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                            style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      )}

      {active && (
        <ClientDrawer
          client={active}
          onClose={() => setActiveId(null)}
          onUpdate={(patch) => updateClient(active.id, patch)}
        />
      )}

      {activeQuote && (
        <ProposalDrawer
          quote={activeQuote}
          onClose={() => setActiveQuoteId(null)}
          onUpdate={(patch) => updateQuote(activeQuote.id, patch)}
        />
      )}

      {modalOpen && (
        <NewProposalModal
          leads={leadOptions}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            loadProposals();
          }}
        />
      )}
    </div>
  );
}

function ClientDrawer({
  client,
  onClose,
  onUpdate,
}: {
  client: ClientRow;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<ClientRow, "client_status" | "project_start_date" | "next_meeting">>) => void;
}) {
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

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="relative z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[rgba(0,212,255,0.25)] bg-[rgba(7,11,20,0.97)] p-6 shadow-[0_0_60px_rgba(0,212,255,0.15)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-section truncate">{client.company ?? "—"}</p>
            <h2 className="mt-2 text-2xl font-black text-foreground truncate">
              {client.full_name ?? "(senza nome)"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{serviceLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.2)] text-muted-foreground hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Status progetto
            </label>
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
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Data inizio progetto
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                onUpdate({ project_start_date: e.target.value || null });
              }}
              className="mt-1.5 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Prossimo meeting
            </label>
            <input
              type="datetime-local"
              value={nextMeeting}
              onChange={(e) => {
                setNextMeeting(e.target.value);
                onUpdate({
                  next_meeting: e.target.value ? new Date(e.target.value).toISOString() : null,
                });
              }}
              className="mt-1.5 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary"
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

function NewProposalModal({
  leads,
  onClose,
  onCreated,
}: {
  leads: LeadOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [leadId, setLeadId] = useState("");
  const [service, setService] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [sentAt, setSentAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !leadId || !service || !amount) return;
    setSaving(true);
    const { error } = await supabase.from("quotes").insert({
      lead_id: leadId,
      service,
      amount: parseFloat(amount),
      content: notes || null,
      status: "Inviata",
      sent_at: sentAt || null,
    });
    setSaving(false);
    if (error) toast.error(`Errore: ${error.message}`);
    else {
      toast.success("Proposta creata");
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button aria-label="Chiudi" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-50 w-full max-w-lg rounded-3xl border border-[rgba(0,212,255,0.2)] bg-[rgba(7,11,20,0.97)] p-6 shadow-[0_0_60px_rgba(0,212,255,0.18)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="label-section">Pipeline</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">Nuova proposta</h2>
          </div>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.2)] text-muted-foreground hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="label-section">Cliente</span>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            >
              <option value="">Seleziona un lead…</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name ?? "(senza nome)"}{l.company ? ` — ${l.company}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-section">Servizio</span>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              required
              placeholder="Es. Piattaforma AI"
              className="mt-2 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="label-section">Importo €</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Es. 24000"
              className="mt-2 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="label-section">Note</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Dettagli scope, deadline, condizioni..."
              className="mt-2 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="label-section">Data invio</span>
            <input
              type="date"
              value={sentAt}
              onChange={(e) => setSentAt(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              Annulla
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] px-5 py-2.5 text-sm font-semibold text-primary shadow-[0_0_24px_rgba(0,212,255,0.2)] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Crea proposta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProposalDrawer({
  quote,
  onClose,
  onUpdate,
}: {
  quote: Quote;
  onClose: () => void;
  onUpdate: (patch: Partial<Quote>) => void;
}) {
  const [status, setStatus] = useState<ProposalStatus>(quote.status);
  const [rejectionReason, setRejectionReason] = useState(quote.rejection_reason ?? "");

  useEffect(() => {
    setStatus(quote.status);
    setRejectionReason(quote.rejection_reason ?? "");
  }, [quote.id]);

  const tone = proposalStatusTone[status] ?? proposalStatusTone.Inviata;
  const lead = quote.leads;
  const clientLabel = lead
    ? `${lead.full_name ?? "(senza nome)"}${lead.company ? ` — ${lead.company}` : ""}`
    : "—";

  const handleStatus = (v: ProposalStatus) => {
    setStatus(v);
    const patch: Partial<Quote> = { status: v };
    if (v !== "Rifiutata") patch.rejection_reason = null;
    onUpdate(patch);
  };

  const handleRejectionBlur = () => {
    if (status === "Rifiutata") onUpdate({ rejection_reason: rejectionReason || null });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button aria-label="Chiudi" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside className="relative z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[rgba(0,212,255,0.25)] bg-[rgba(7,11,20,0.97)] p-6 shadow-[0_0_60px_rgba(0,212,255,0.15)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label-section truncate">{clientLabel}</p>
            <h2 className="mt-2 text-2xl font-black text-foreground truncate">{quote.service ?? "—"}</h2>
            <p className="mt-1 text-2xl font-bold text-primary">{formatEuro(quote.amount)}</p>
          </div>
          <button onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.2)] text-muted-foreground hover:text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data invio</span>
            <span className="text-foreground">{fmtDate(quote.sent_at)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Creata il</span>
            <span className="text-foreground">{fmtDate(quote.created_at)}</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatus(e.target.value as ProposalStatus)}
              className="mt-1.5 w-full rounded-2xl border px-3 py-3 text-sm font-semibold outline-none"
              style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}
            >
              {QUOTE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} style={{ background: "#0a1020", color: "#e2e8f0" }}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {status === "Rifiutata" && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Motivo del rifiuto
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                onBlur={handleRejectionBlur}
                rows={3}
                placeholder="Scrivi il motivo…"
                className="mt-1.5 w-full rounded-2xl border border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.05)] px-3 py-3 text-sm text-foreground outline-none transition focus:border-[rgba(248,113,113,0.6)]"
              />
            </div>
          )}

          {quote.content && (
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Note
              </label>
              <p className="mt-1.5 whitespace-pre-wrap rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-3 py-3 text-sm text-foreground">
                {quote.content}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
