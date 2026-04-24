import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Eye,
  Loader2,
  Mail,
  Phone,
  Search,
  Trash2,
  UserPlus,
  X,
  Building2,
  Clock,
  MessageSquarePlus,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AdminCard } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Lead" },
      { name: "description", content: "Gestione lead Falcon Agency." },
    ],
  }),
  component: LeadsPage,
});

// ============================================================
// Types & constants
// ============================================================

type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  form_answers: Record<string, unknown> | null;
  created_at: string | null;
};

type LeadNote = {
  id: string;
  lead_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
};

const SERVICE_LABELS: Record<string, string> = {
  sito_web: "Sito web",
  piattaforma_ai: "Piattaforma AI",
  gestionale: "Gestionale",
  automazione_ai_agent: "Automazione AI Agent",
  altro: "Altro",
};

const SERVICE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  sito_web: { bg: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "rgba(139,92,246,0.35)" },
  piattaforma_ai: { bg: "rgba(0,212,255,0.12)", color: "#7dd9ff", border: "rgba(0,212,255,0.35)" },
  gestionale: { bg: "rgba(251,146,60,0.12)", color: "#fdba74", border: "rgba(251,146,60,0.35)" },
  automazione_ai_agent: { bg: "rgba(34,197,94,0.12)", color: "#86efac", border: "rgba(34,197,94,0.35)" },
  altro: { bg: "rgba(148,163,184,0.12)", color: "#cbd5e1", border: "rgba(148,163,184,0.32)" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "In attesa",
  contacted: "Contattato",
  qualified: "Qualificato",
  not_qualified: "Non qualificato",
  converted: "Convertito",
};

const STATUS_OPTIONS = ["pending", "contacted", "qualified", "not_qualified", "converted"] as const;

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; glow?: string }> = {
  pending: {
    bg: "rgba(245,158,11,0.10)",
    color: "#fcd34d",
    border: "rgba(245,158,11,0.45)",
  },
  contacted: {
    bg: "rgba(59,130,246,0.12)",
    color: "#93c5fd",
    border: "rgba(59,130,246,0.4)",
  },
  qualified: {
    bg: "rgba(34,197,94,0.12)",
    color: "#86efac",
    border: "rgba(34,197,94,0.4)",
  },
  not_qualified: {
    bg: "rgba(248,113,113,0.10)",
    color: "#fca5a5",
    border: "rgba(248,113,113,0.32)",
  },
  converted: {
    bg: "rgba(16,185,129,0.18)",
    color: "#6ee7b7",
    border: "rgba(16,185,129,0.55)",
    glow: "0 0 18px rgba(16,185,129,0.4)",
  },
};

const ANSWER_LABELS: Record<string, string> = {
  process: "Processo da gestire",
  users: "Numero utenti",
  ai_use_case: "Caso d'uso AI",
  data_source: "Fonti dati disponibili",
  site_type: "Tipo di sito",
  pages: "Contenuti e struttura",
  task: "Task da automatizzare",
  tools: "Tool da integrare",
  idea: "Idea del progetto",
  goal: "Obiettivo principale",
};

const AVATAR_PALETTE = [
  { bg: "rgba(0,212,255,0.18)", color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  { bg: "rgba(139,92,246,0.18)", color: "#c4b5fd", border: "rgba(139,92,246,0.4)" },
  { bg: "rgba(236,72,153,0.18)", color: "#f9a8d4", border: "rgba(236,72,153,0.4)" },
  { bg: "rgba(34,197,94,0.18)", color: "#86efac", border: "rgba(34,197,94,0.4)" },
];

// ============================================================
// Helpers
// ============================================================

function hashIndex(input: string, mod: number) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function initials(name: string | null, email: string | null) {
  const src = (name && name.trim()) || email || "??";
  return (
    src
      .split(/\s+|@|\./)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "??"
  );
}

function avatarTone(seed: string) {
  return AVATAR_PALETTE[hashIndex(seed, AVATAR_PALETTE.length)];
}

function relativeDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: it });
  } catch {
    return "—";
  }
}

function fullDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "d MMMM yyyy 'alle' HH:mm", { locale: it });
  } catch {
    return "—";
  }
}

function formatAnswerValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ============================================================
// Data
// ============================================================

async function fetchLeads(): Promise<LeadRow[]> {
  if (!supabase) throw new Error("Supabase non configurato");
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, company, status, service_interest, budget_range, timeline, form_answers, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}

async function fetchNotes(leadId: string): Promise<LeadNote[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lead_notes")
    .select("id, lead_id, user_id, content, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadNote[];
}

// ============================================================
// Page
// ============================================================

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    enabled: isSupabaseConfigured,
  });

  const allLeads = data ?? [];

  const filtered = useMemo(() => {
    return allLeads.filter((l) => {
      if (statusFilter && (l.status ?? "") !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (l.full_name ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.service_interest ?? "").toLowerCase().includes(q)
      );
    });
  }, [allLeads, query, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const total = allLeads.length;
    const thisWeek = allLeads.filter((l) => l.created_at && new Date(l.created_at).getTime() >= weekAgo).length;
    const pending = allLeads.filter((l) => (l.status ?? "pending") === "pending").length;
    const converted = allLeads.filter((l) => l.status === "converted").length;
    return { total, thisWeek, pending, converted };
  }, [allLeads]);

  const openLead = openLeadId ? allLeads.find((l) => l.id === openLeadId) ?? null : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="label-section">Pipeline</p>
          <h1 className="mt-3 text-4xl font-black text-foreground">
            Lead{" "}
            <span className="text-primary text-glow">{isLoading ? "…" : allLeads.length}</span>
          </h1>
          <KpiStrip
            total={kpis.total}
            thisWeek={kpis.thisWeek}
            pending={kpis.pending}
            converted={kpis.converted}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="glass flex h-12 min-w-[280px] items-center gap-3 px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Cerca lead..."
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass h-12 px-4 text-sm text-foreground outline-none"
          >
            <option value="">Tutti gli stati</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <AdminCard className="flex items-center gap-3 p-5 text-sm text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          Supabase non è configurato. Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.
        </AdminCard>
      )}

      {error && (
        <AdminCard className="flex items-center justify-between gap-3 p-5 text-sm text-red-300">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Errore caricamento lead: {(error as Error).message}
          </span>
          <button
            onClick={() => refetch()}
            className="rounded-full border border-[rgba(248,113,113,0.4)] px-4 py-1.5 text-xs font-semibold text-red-200 hover:bg-[rgba(248,113,113,0.1)]"
          >
            Riprova
          </button>
        </AdminCard>
      )}

      {/* Lead list */}
      <AdminCard className="overflow-hidden p-0">
        {/* Header row */}
        <div className="hidden grid-cols-[minmax(280px,2fr)_minmax(140px,1fr)_minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(110px,1fr)_minmax(120px,auto)] items-center gap-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
          <span>Lead</span>
          <span>Servizio</span>
          <span>Budget</span>
          <span>Timing</span>
          <span>Stato</span>
          <span>Data</span>
          <span className="text-right">Azioni</span>
        </div>

        {isLoading && (
          <div className="px-6 py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
            <p className="mt-3 text-xs uppercase tracking-[0.18em]">Caricamento lead…</p>
          </div>
        )}

        {!isLoading && filtered.length === 0 && !error && (
          <div className="px-6 py-16 text-center text-muted-foreground">
            Nessun lead {query || statusFilter ? "corrisponde ai filtri" : "ancora registrato"}.
          </div>
        )}

        <div>
          {filtered.map((lead) => (
            <LeadRowItem
              key={lead.id}
              lead={lead}
              onOpen={() => setOpenLeadId(lead.id)}
            />
          ))}
        </div>

        {isFetching && !isLoading && (
          <div className="border-t border-[rgba(255,255,255,0.06)] px-6 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Aggiornamento…
          </div>
        )}
      </AdminCard>

      <LeadDrawer lead={openLead} onClose={() => setOpenLeadId(null)} />
    </div>
  );
}

// ============================================================
// KPI strip
// ============================================================

function KpiStrip({
  total,
  thisWeek,
  pending,
  converted,
}: {
  total: number;
  thisWeek: number;
  pending: number;
  converted: number;
}) {
  const items = [
    { label: "Totale lead", value: total, color: "#e2e8f0" },
    { label: "Questa settimana", value: thisWeek, color: "#7dd9ff" },
    { label: "In attesa", value: pending, color: "#fcd34d" },
    { label: "Convertiti", value: converted, color: "#6ee7b7" },
  ];
  return (
    <div className="mt-4 inline-flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-3">
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{it.label}</span>
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: it.color, fontVariantNumeric: "tabular-nums" }}
          >
            {it.value}
          </span>
          {i < items.length - 1 && <span className="ml-4 h-3 w-px bg-[rgba(255,255,255,0.08)]" aria-hidden />}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Lead row
// ============================================================

function LeadRowItem({ lead, onOpen }: { lead: LeadRow; onOpen: () => void }) {
  const queryClient = useQueryClient();
  const seed = lead.full_name || lead.email || lead.id;
  const tone = avatarTone(seed);
  const status = lead.status ?? "pending";
  const service = lead.service_interest ?? "altro";
  const serviceColor = SERVICE_COLORS[service] ?? SERVICE_COLORS.altro;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error("Supabase non configurato");
      const { error } = await supabase.from("leads").delete().eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leads"] }),
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Eliminare il lead "${lead.full_name ?? lead.email ?? "senza nome"}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div
      onClick={onOpen}
      className="group grid min-h-[72px] cursor-pointer grid-cols-1 items-center gap-4 border-b border-[rgba(255,255,255,0.05)] px-6 py-4 transition-colors duration-150 last:border-b-0 hover:bg-[rgba(0,212,255,0.04)] lg:grid-cols-[minmax(280px,2fr)_minmax(140px,1fr)_minmax(110px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(110px,1fr)_minmax(120px,auto)]"
    >
      {/* Lead */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold border"
          style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}
        >
          {initials(lead.full_name, lead.email)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground truncate">
              {lead.full_name || "(senza nome)"}
            </span>
            {lead.company && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {lead.company}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{lead.email ?? "—"}</div>
        </div>
      </div>

      {/* Servizio */}
      <div>
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: serviceColor.bg, color: serviceColor.color, borderColor: serviceColor.border }}
        >
          {SERVICE_LABELS[service] ?? service}
        </span>
      </div>

      {/* Budget */}
      <div className="text-sm text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
        {lead.budget_range ?? "—"}
      </div>

      {/* Timing */}
      <div className="text-sm text-foreground/90" style={{ fontVariantNumeric: "tabular-nums" }}>
        {lead.timeline ?? "—"}
      </div>

      {/* Stato */}
      <div>
        <StatusBadge status={status} />
      </div>

      {/* Data */}
      <div className="text-xs text-muted-foreground" title={fullDate(lead.created_at)}>
        {relativeDate(lead.created_at)}
      </div>

      {/* Azioni */}
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        <ActionIconButton title="Dettaglio" onClick={onOpen}>
          <Eye className="h-3.5 w-3.5" />
        </ActionIconButton>
        <ActionIconButton title="Assegna" onClick={() => {}}>
          <UserPlus className="h-3.5 w-3.5" />
        </ActionIconButton>
        <ActionIconButton title="Elimina" danger onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </ActionIconButton>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
        boxShadow: style.glow,
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ActionIconButton({
  children,
  onClick,
  title,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-muted-foreground backdrop-blur-sm transition hover:border-[rgba(0,212,255,0.4)] hover:text-primary disabled:opacity-50 ${
        danger ? "hover:!border-[rgba(248,113,113,0.45)] hover:!text-red-300" : ""
      }`}
    >
      {children}
    </button>
  );
}

// ============================================================
// Drawer
// ============================================================

function LeadDrawer({ lead, onClose }: { lead: LeadRow | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [statusDraft, setStatusDraft] = useState<string>("");

  useEffect(() => {
    if (lead) {
      setStatusDraft(lead.status ?? "pending");
      setNoteText("");
    }
  }, [lead?.id]);

  // ESC to close
  useEffect(() => {
    if (!lead) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lead, onClose]);

  const notesQuery = useQuery({
    queryKey: ["lead-notes", lead?.id],
    queryFn: () => fetchNotes(lead!.id),
    enabled: !!lead && isSupabaseConfigured,
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      if (!supabase || !lead) throw new Error("Supabase non configurato");
      const prev = lead.status ?? "pending";
      const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", lead.id);
      if (error) throw error;
      // Log timeline event as a system note
      await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        content: `[status] ${STATUS_LABELS[prev] ?? prev} → ${STATUS_LABELS[newStatus] ?? newStatus}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-notes", lead?.id] });
      toast.success("Stato aggiornato");
    },
    onError: (e: Error) => toast.error(`Errore aggiornamento stato: ${e.message}`),
  });

  const noteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!supabase || !lead) throw new Error("Supabase non configurato");
      const { error } = await supabase.from("lead_notes").insert({
        lead_id: lead.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["lead-notes", lead?.id] });
      toast.success("Nota salvata");
    },
    onError: (e: Error) => toast.error(`Errore salvataggio nota: ${e.message}`),
  });

  const isOpen = !!lead;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[520px] overflow-y-auto border-l border-[rgba(0,212,255,0.12)] bg-[#0a1020] shadow-[-30px_0_80px_rgba(0,0,0,0.6)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {lead && <DrawerContent
          lead={lead}
          onClose={onClose}
          notes={notesQuery.data ?? []}
          notesLoading={notesQuery.isLoading}
          statusDraft={statusDraft}
          setStatusDraft={(s) => {
            setStatusDraft(s);
            statusMutation.mutate(s);
          }}
          statusSaving={statusMutation.isPending}
          noteText={noteText}
          setNoteText={setNoteText}
          onAddNote={() => noteText.trim() && noteMutation.mutate(noteText.trim())}
          noteSaving={noteMutation.isPending}
        />}
      </aside>
    </>
  );
}

function DrawerContent({
  lead,
  onClose,
  notes,
  notesLoading,
  statusDraft,
  setStatusDraft,
  statusSaving,
  noteText,
  setNoteText,
  onAddNote,
  noteSaving,
}: {
  lead: LeadRow;
  onClose: () => void;
  notes: LeadNote[];
  notesLoading: boolean;
  statusDraft: string;
  setStatusDraft: (s: string) => void;
  statusSaving: boolean;
  noteText: string;
  setNoteText: (s: string) => void;
  onAddNote: () => void;
  noteSaving: boolean;
}) {
  const seed = lead.full_name || lead.email || lead.id;
  const tone = avatarTone(seed);
  const service = lead.service_interest ?? "altro";
  const serviceColor = SERVICE_COLORS[service] ?? SERVICE_COLORS.altro;
  const answers = lead.form_answers ?? {};
  const answerEntries = Object.entries(answers);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0a1020]/95 px-6 py-4 backdrop-blur">
        <p className="label-section">Dettaglio lead</p>
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.18)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 py-6 space-y-7">
        {/* Identità */}
        <section className="flex items-start gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold border"
            style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}
          >
            {initials(lead.full_name, lead.email)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground truncate">{lead.full_name || "(senza nome)"}</h2>
            <div className="mt-2 space-y-1.5 text-sm">
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </a>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{lead.phone}</span>
                </a>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{lead.company}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: serviceColor.bg, color: serviceColor.color, borderColor: serviceColor.border }}
              >
                {SERVICE_LABELS[service] ?? service}
              </span>
              {lead.budget_range && (
                <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
                  💰 {lead.budget_range}
                </span>
              )}
              {lead.timeline && (
                <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-1 text-[11px] font-semibold text-foreground/90">
                  ⏱ {lead.timeline}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Stato */}
        <section>
          <p className="label-section mb-2">Stato</p>
          <div className="flex items-center gap-3">
            <select
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value)}
              disabled={statusSaving}
              className="glass h-11 flex-1 px-3 text-sm text-foreground outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {statusSaving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
        </section>

        {/* Risposte form — profilo completo in ordine */}
        <section>
          <p className="label-section mb-3">Risposte form</p>
          {(() => {
            const ANSWER_ORDER = [
              "process",
              "users",
              "ai_use_case",
              "data_source",
              "site_type",
              "pages",
              "task",
              "tools",
              "idea",
              "goal",
            ];
            const orderedKeys = [
              ...ANSWER_ORDER.filter((k) => k in (answers as Record<string, unknown>)),
              ...Object.keys(answers).filter((k) => !ANSWER_ORDER.includes(k)),
            ];
            const items: Array<{ label: string; value: string }> = [];

            if (lead.service_interest) {
              items.push({
                label: "Servizio richiesto",
                value: SERVICE_LABELS[lead.service_interest] ?? lead.service_interest,
              });
            }
            for (const key of orderedKeys) {
              const raw = (answers as Record<string, unknown>)[key];
              const v = formatAnswerValue(raw);
              if (v && v !== "—") {
                items.push({ label: ANSWER_LABELS[key] ?? key, value: v });
              }
            }
            if (lead.budget_range) items.push({ label: "Budget indicativo", value: lead.budget_range });
            if (lead.timeline) items.push({ label: "Tempistiche", value: lead.timeline });

            if (items.length === 0) {
              return <p className="text-sm text-muted-foreground italic">Nessuna risposta del form disponibile.</p>;
            }
            return (
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div
                    key={`${it.label}-${i}`}
                    className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {it.label}
                    </p>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{it.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>

        {/* Timeline */}
        <section>
          <p className="label-section mb-3">Timeline</p>
          <ol className="relative space-y-4 border-l border-[rgba(0,212,255,0.18)] pl-5">
            {notesLoading && (
              <li className="text-xs text-muted-foreground italic">Caricamento note…</li>
            )}
            {notes.map((n) => (
              <li key={n.id} className="relative">
                <span className="absolute -left-[27px] mt-1 flex h-3 w-3 rounded-full border-2 border-[#0a1020] bg-emerald-400" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                  Nota interna
                </p>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {fullDate(n.created_at)}
                </p>
              </li>
            ))}
            <li className="relative">
              <span className="absolute -left-[27px] mt-1 flex h-3 w-3 rounded-full border-2 border-[#0a1020] bg-primary" />
              <p className="text-sm font-semibold text-foreground">Form compilato</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {fullDate(lead.created_at)}
              </p>
            </li>
          </ol>
        </section>

        {/* Aggiungi nota */}
        <section className="pb-6">
          <p className="label-section mb-2 flex items-center gap-2">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Aggiungi nota
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Scrivi una nota interna…"
            rows={3}
            className="input-premium resize-none text-sm"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={onAddNote}
              disabled={!noteText.trim() || noteSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.1)] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.18)] disabled:opacity-40"
            >
              {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Salva nota
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
