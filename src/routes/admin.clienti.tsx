import { createFileRoute } from "@tanstack/react-router";
import { Calendar, FileText, Plus, X } from "lucide-react";
import { useState } from "react";

import { AdminBadge, AdminCard, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/clienti")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Clienti" },
      { name: "description", content: "Gestione clienti attivi e proposte commerciali Falcon Agency." },
    ],
  }),
  component: ClientiPage,
});

type ProjectStatus = "In corso" | "Consegnato" | "In pausa";
type ProposalStatus = "Inviata" | "Vista" | "Accettata" | "Rifiutata" | "Scaduta";

type Meeting = { date: string; topic: string };
type Client = {
  id: string;
  name: string;
  company: string;
  service: string;
  startDate: string;
  status: ProjectStatus;
  nextMeeting: string;
  notes: string;
  history: Meeting[];
  contractUrl: string;
};

const initialClients: Client[] = [
  {
    id: "c1",
    name: "Giulia Ferri",
    company: "Aurora Labs",
    service: "Piattaforma AI",
    startDate: "12 Gen 2026",
    status: "In corso",
    nextMeeting: "28 Apr 2026 · 15:00",
    notes: "Cliente molto reattivo. Interessata a estensione modulo predictive analytics nel Q3.",
    history: [
      { date: "20 Apr · 14:00", topic: "Review sprint 4 — modulo onboarding" },
      { date: "06 Apr · 10:30", topic: "Kickoff fase 2 — integrazione CRM" },
      { date: "22 Mar · 16:00", topic: "Demo MVP piattaforma" },
    ],
    contractUrl: "#contract-aurora",
  },
  {
    id: "c2",
    name: "Marco Riva",
    company: "Nova Retail",
    service: "E-commerce",
    startDate: "01 Feb 2026",
    status: "In corso",
    nextMeeting: "25 Apr 2026 · 11:00",
    notes: "Necessita migrazione catalogo da Magento. Budget extra approvato per integrazione ERP.",
    history: [
      { date: "18 Apr · 11:00", topic: "Walkthrough checkout custom" },
      { date: "04 Apr · 09:30", topic: "Allineamento design system" },
    ],
    contractUrl: "#contract-nova",
  },
  {
    id: "c3",
    name: "Elena Costa",
    company: "Zenith Group",
    service: "Automazioni",
    startDate: "15 Mar 2026",
    status: "In corso",
    nextMeeting: "30 Apr 2026 · 09:30",
    notes: "Focus su workflow Make + HubSpot. Cliente strategico, possibile upsell AI agent Q3.",
    history: [
      { date: "16 Apr · 09:30", topic: "Mapping processi commerciali" },
      { date: "28 Mar · 15:00", topic: "Audit tech stack attuale" },
    ],
    contractUrl: "#contract-zenith",
  },
  {
    id: "c4",
    name: "Luca Bianchi",
    company: "Orbit Studio",
    service: "Brand Identity",
    startDate: "10 Gen 2026",
    status: "Consegnato",
    nextMeeting: "—",
    notes: "Progetto chiuso con successo. Inviata proposta retainer mensile per content design.",
    history: [
      { date: "08 Apr · 17:00", topic: "Consegna finale brand book" },
      { date: "25 Mar · 11:00", topic: "Review tipografia & palette" },
      { date: "10 Mar · 14:30", topic: "Presentazione concept" },
    ],
    contractUrl: "#contract-orbit",
  },
  {
    id: "c5",
    name: "Sara Leone",
    company: "Pixel Studio",
    service: "AI Agent",
    startDate: "05 Feb 2026",
    status: "In pausa",
    nextMeeting: "06 Mag 2026 · 14:00",
    notes: "In attesa approvazione interna su scope. Riprenderemo a maggio dopo board meeting.",
    history: [
      { date: "02 Apr · 10:00", topic: "Sospensione temporanea — review interna" },
      { date: "20 Mar · 15:30", topic: "Definizione personas agent" },
    ],
    contractUrl: "#contract-pixel",
  },
];

const projectStatusTone: Record<ProjectStatus, { color: string; bg: string; border: string }> = {
  "In corso": { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.32)" },
  Consegnato: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  "In pausa": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.32)" },
};

const serviceTone: Record<string, string> = {
  "Piattaforma AI": "rgba(139,92,246,0.18)",
  "E-commerce": "rgba(0,212,255,0.16)",
  Automazioni: "rgba(52,211,153,0.16)",
  "Brand Identity": "rgba(245,158,11,0.16)",
  "AI Agent": "rgba(248,113,113,0.16)",
};
const serviceColor: Record<string, string> = {
  "Piattaforma AI": "#a78bfa",
  "E-commerce": "#00d4ff",
  Automazioni: "#34d399",
  "Brand Identity": "#f59e0b",
  "AI Agent": "#f87171",
};

const proposalStatusTone: Record<ProposalStatus, { color: string; bg: string; border: string }> = {
  Inviata: { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.32)" },
  Vista: { color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.32)" },
  Accettata: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  Rifiutata: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  Scaduta: { color: "var(--falcon-subtle)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" },
};

type Proposal = {
  id: string;
  client: string;
  service: string;
  value: string;
  date: string;
  status: ProposalStatus;
};

const initialProposals: Proposal[] = [
  { id: "p1", client: "Andrea Neri — Mesh AI", service: "Piattaforma AI", value: "€38.000", date: "18 Apr 2026", status: "Vista" },
  { id: "p2", client: "Marta Villa — Studio V", service: "Sito Web", value: "€12.000", date: "15 Apr 2026", status: "Inviata" },
  { id: "p3", client: "Davide Fontana — Flow", service: "CRM Custom", value: "€22.500", date: "10 Apr 2026", status: "Accettata" },
  { id: "p4", client: "Nadia Romano — Atlas", service: "E-commerce", value: "€31.000", date: "05 Apr 2026", status: "Vista" },
  { id: "p5", client: "Paolo Greco — Raven", service: "Consulenza AI", value: "€8.500", date: "28 Mar 2026", status: "Rifiutata" },
  { id: "p6", client: "Chiara Monti — Polar", service: "Automazioni", value: "€14.200", date: "12 Mar 2026", status: "Scaduta" },
];

function ClientiPage() {
  const [tab, setTab] = useState<"clienti" | "proposte">("clienti");
  const [clients, setClients] = useState(initialClients);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [proposals, setProposals] = useState(initialProposals);
  const [modalOpen, setModalOpen] = useState(false);

  const active = clients.find((c) => c.id === activeId) ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-section">Falcon Agency</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Clienti & <span className="text-primary text-glow">Proposte</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Gestione clienti attivi, meeting e pipeline proposte commerciali.
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
          { id: "clienti", label: `Clienti attivi · ${clients.length}` },
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
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const tone = projectStatusTone[c.status];
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="glass glass-hover p-5 text-left transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{c.company}</p>
                    <h3 className="mt-1 text-lg font-bold text-foreground">{c.name}</h3>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
                  >
                    {c.status}
                  </span>
                </div>
                <span
                  className="mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: serviceTone[c.service] ?? "rgba(255,255,255,0.06)", color: serviceColor[c.service] ?? "#fff" }}
                >
                  {c.service}
                </span>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Inizio progetto</span>
                    <span className="text-foreground">{c.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Prossimo meeting</span>
                    <span className="text-foreground">{c.nextMeeting}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
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
          onUpdateNotes={(notes) =>
            setClients((list) => list.map((c) => (c.id === active.id ? { ...c, notes } : c)))
          }
        />
      )}

      {modalOpen && (
        <NewProposalModal
          onClose={() => setModalOpen(false)}
          onCreate={(p) => {
            setProposals((list) => [{ ...p, id: `p${list.length + 1}`, status: "Inviata", date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) }, ...list]);
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
  onUpdateNotes,
}: {
  client: Client;
  onClose: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="relative z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[rgba(0,212,255,0.25)] bg-[rgba(7,11,20,0.97)] p-6 shadow-[0_0_60px_rgba(0,212,255,0.15)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label-section">{client.company}</p>
            <h2 className="mt-2 text-2xl font-black text-foreground">{client.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{client.service} · dal {client.startDate}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.2)] text-muted-foreground hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6">
          <p className="label-section">Storico meeting</p>
          <ul className="mt-3 space-y-2">
            {client.history.map((m, i) => (
              <li key={i} className="rounded-2xl border border-[rgba(0,212,255,0.1)] bg-[rgba(0,212,255,0.04)] p-3">
                <p className="text-xs text-primary">{m.date}</p>
                <p className="mt-1 text-sm text-foreground">{m.topic}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex-1">
          <p className="label-section">Note libere</p>
          <textarea
            value={client.notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            rows={6}
            className="mt-3 w-full rounded-2xl border border-[rgba(0,212,255,0.18)] bg-[rgba(255,255,255,0.03)] p-3 text-sm text-foreground outline-none transition focus:border-primary"
          />
        </div>

        <a
          href={client.contractUrl}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.1)] px-5 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.18)]"
        >
          <FileText className="h-4 w-4" /> Apri contratto
        </a>
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
