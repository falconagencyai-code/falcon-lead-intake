import { createFileRoute } from "@tanstack/react-router";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-1">
        {sectionTabs.map((t) => {
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
  const [proposals, setProposals] = useState(initialProposals);
  const [modalOpen, setModalOpen] = useState(false);

  const loadClients = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("id, full_name, company, service_interest, client_status, project_start_date, next_meeting, created_at")
      .eq("pipeline_stage", "chiuso_vinto")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(`Errore caricamento clienti: ${error.message}`);
    } else {
      setClients((data ?? []) as ClientRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const active = clients.find((c) => c.id === activeId) ?? null;

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
                  <span className="mt-4 inline-flex items-center rounded-full border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] px-3 py-1 text-xs font-semibold text-primary">
                    {serviceLabel}
                  </span>
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
                  const tone = proposalStatusTone[p.status];
                  return (
                    <tr key={p.id} className="border-b border-[rgba(255,255,255,0.06)] text-foreground/90">
                      <td className="py-4 font-medium">{p.client}</td>
                      <td className="text-muted-foreground">{p.service}</td>
                      <td className="font-semibold text-foreground">{p.value}</td>
                      <td className="text-muted-foreground">{p.date}</td>
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
        </AdminCard>
      )}

      {active && (
        <ClientDrawer
          client={active}
          onClose={() => setActiveId(null)}
          onUpdate={(patch) => updateClient(active.id, patch)}
        />
      )}

      {modalOpen && (
        <NewProposalModal
          onClose={() => setModalOpen(false)}
          onCreate={(p) => {
            setProposals((list) => [
              {
                ...p,
                id: `p${list.length + 1}`,
                status: "Inviata",
                date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }),
              },
              ...list,
            ]);
            setModalOpen(false);
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
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: { client: string; service: string; value: string; notes?: string }) => void;
}) {
  const [client, setClient] = useState("");
  const [service, setService] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

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

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!client || !service || !value) return;
            onCreate({ client, service, value: value.startsWith("€") ? value : `€${value}`, notes });
          }}
        >
          {[
            { label: "Cliente", val: client, set: setClient, ph: "Es. Andrea Neri — Mesh AI" },
            { label: "Servizio", val: service, set: setService, ph: "Es. Piattaforma AI" },
            { label: "Valore", val: value, set: setValue, ph: "Es. 24.000" },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="label-section">{f.label}</span>
              <input
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                className="mt-2 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary"
              />
            </label>
          ))}
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
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-[rgba(255,255,255,0.1)] px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              Annulla
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.12)] px-5 py-2.5 text-sm font-semibold text-primary shadow-[0_0_24px_rgba(0,212,255,0.2)]">
              <Plus className="h-4 w-4" /> Crea proposta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
