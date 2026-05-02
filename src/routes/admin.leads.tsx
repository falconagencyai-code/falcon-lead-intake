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
  Plus,
  FileText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
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
  pipeline_stage: string | null;
  lost_reason: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  form_answers: Record<string, unknown> | null;
  created_at: string | null;
  client_status: string | null;
  project_start_date: string | null;
  next_meeting: string | null;
  venditore_id: string | null;
  venditore: { id: string; full_name: string | null } | null;
};

type LeadNote = {
  id: string;
  lead_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
};

type LeadEvent = {
  id: string;
  lead_id: string;
  stage_from: string | null;
  stage_to: string | null;
  lost_reason: string | null;
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

// ============================================================
// Pipeline stages
// ============================================================

const PIPELINE_STAGE_LABELS: Record<string, string> = {
  form_compilato: "Form compilato",
  contattato: "Contattato",
  call_schedulata: "Call schedulata",
  call_effettuata: "Call effettuata",
  no_show: "No show",
  preventivo_inviato: "Preventivo inviato",
  chiuso_vinto: "Chiuso — Vinto ✓",
  chiuso_perso: "Chiuso — Perso ✗",
};

const PIPELINE_STAGE_OPTIONS = [
  "form_compilato",
  "contattato",
  "call_schedulata",
  "call_effettuata",
  "no_show",
  "preventivo_inviato",
  "chiuso_vinto",
  "chiuso_perso",
] as const;

const PIPELINE_STAGE_STYLES: Record<string, { bg: string; color: string; border: string; glow?: string }> = {
  form_compilato: { bg: "rgba(0,212,255,0.12)", color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  contattato: { bg: "rgba(0,212,255,0.12)", color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  call_schedulata: { bg: "rgba(0,212,255,0.12)", color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  call_effettuata: { bg: "rgba(0,212,255,0.12)", color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  no_show: { bg: "rgba(251,146,60,0.12)", color: "#fdba74", border: "rgba(251,146,60,0.45)" },
  preventivo_inviato: { bg: "rgba(0,212,255,0.12)", color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  chiuso_vinto: {
    bg: "rgba(16,185,129,0.18)",
    color: "#6ee7b7",
    border: "rgba(16,185,129,0.55)",
    glow: "0 0 18px rgba(16,185,129,0.4)",
  },
  chiuso_perso: { bg: "rgba(248,113,113,0.12)", color: "#fca5a5", border: "rgba(248,113,113,0.45)" },
};

const STAGE_ICONS: Record<string, string> = {
  form_compilato: "📝",
  contattato: "📧",
  call_schedulata: "📅",
  call_effettuata: "📞",
  no_show: "🚫",
  preventivo_inviato: "📄",
  chiuso_vinto: "✓",
  chiuso_perso: "✗",
};

const LOST_REASON_LABELS: Record<string, string> = {
  prezzo: "Prezzo troppo alto",
  no_show: "Non si è presentato alla call",
  nessuna_risposta: "Nessuna risposta",
  non_convinto: "Non convinto del servizio",
  altro: "Altro",
};

const LOST_REASON_OPTIONS = ["prezzo", "no_show", "nessuna_risposta", "non_convinto", "altro"] as const;

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
      "id, full_name, email, phone, company, status, pipeline_stage, lost_reason, service_interest, budget_range, timeline, form_answers, created_at, client_status, project_start_date, next_meeting, venditore_id, venditore:profiles!venditore_id(id, full_name)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadRow[];
}

async function fetchNotes(leadId: string): Promise<LeadNote[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lead_notes")
    .select("id, lead_id, user_id, content, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadNote[];
}

async function fetchEvents(leadId: string): Promise<LeadEvent[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lead_events")
    .select("id, lead_id, stage_from, stage_to, lost_reason, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadEvent[];
}

// ============================================================
// Page
// ============================================================

function LeadsPage() {
  const { role } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [venditoreFilter, setVenditoreFilter] = useState<string>("");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    enabled: isSupabaseConfigured,
  });

  // Realtime sync — refetches when leads table changes from any page (e.g. clienti page)
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        void refetch();
      })
      .subscribe();
    return () => {
      supabase?.removeChannel(channel);
    };
  }, [refetch]);

  const allLeads = data ?? [];

  const filtered = useMemo(() => {
    return allLeads.filter((l) => {
      if (statusFilter && (l.status ?? "") !== statusFilter) return false;
      if (venditoreFilter && (l.venditore_id ?? "") !== venditoreFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (l.full_name ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.service_interest ?? "").toLowerCase().includes(q)
      );
    });
  }, [allLeads, query, statusFilter, venditoreFilter]);

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
          {role === "admin" && (
            <select
              value={venditoreFilter}
              onChange={(e) => setVenditoreFilter(e.target.value)}
              className="glass h-12 px-4 text-sm text-foreground outline-none"
            >
              <option value="">Tutti i venditori</option>
              {Array.from(
                new Map(
                  allLeads
                    .filter(l => l.venditore)
                    .map(l => [l.venditore_id!, l.venditore!.full_name ?? l.venditore_id!])
                )
              ).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}
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
        <div className="hidden grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(90px,0.8fr)_minmax(100px,0.8fr)_minmax(155px,1.2fr)_minmax(130px,1fr)_minmax(90px,0.8fr)_minmax(110px,auto)] items-center gap-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
          <span>Lead</span>
          <span>Servizio</span>
          <span>Budget</span>
          <span>Timing</span>
          <span>Stage</span>
          <span>Venditore</span>
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
  const stage = lead.pipeline_stage ?? "form_compilato";
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
      className="group grid min-h-[72px] cursor-pointer grid-cols-1 items-center gap-4 border-b border-[rgba(255,255,255,0.05)] px-6 py-4 transition-colors duration-150 last:border-b-0 hover:bg-[rgba(0,212,255,0.04)] lg:grid-cols-[minmax(220px,2fr)_minmax(120px,1fr)_minmax(90px,0.8fr)_minmax(100px,0.8fr)_minmax(155px,1.2fr)_minmax(130px,1fr)_minmax(90px,0.8fr)_minmax(110px,auto)]"
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

      {/* Stage */}
      <div className="min-w-0">
        <StageBadge stage={stage} />
      </div>

      {/* Venditore */}
      <div className="min-w-0">
        {lead.venditore ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold truncate max-w-[120px]"
            style={{ background: "rgba(0,212,255,0.07)", color: "#7dd9ff", border: "1px solid rgba(0,212,255,0.18)" }}>
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black"
              style={{ background: "rgba(0,212,255,0.18)", color: "#00d4ff" }}>
              {(lead.venditore.full_name ?? "?")[0].toUpperCase()}
            </span>
            <span className="truncate">{lead.venditore.full_name ?? "—"}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
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
        <ActionIconButton title="Assegna venditore" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
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

const PIPELINE_STAGE_SHORT_LABELS: Record<string, string> = {
  form_compilato: "Form",
  contattato: "Contattato",
  call_schedulata: "Call sched.",
  call_effettuata: "Call fatta",
  no_show: "No show",
  preventivo_inviato: "Preventivo",
  chiuso_vinto: "Vinto ✓",
  chiuso_perso: "Perso ✗",
};

function StageBadge({ stage }: { stage: string }) {
  const style = PIPELINE_STAGE_STYLES[stage] ?? PIPELINE_STAGE_STYLES.form_compilato;
  const icon = STAGE_ICONS[stage] ?? "•";
  const label = PIPELINE_STAGE_SHORT_LABELS[stage] ?? PIPELINE_STAGE_LABELS[stage] ?? stage;
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 truncate whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
        boxShadow: style.glow,
      }}
      title={PIPELINE_STAGE_LABELS[stage] ?? stage}
    >
      <span aria-hidden className="text-[11px] leading-none">{icon}</span>
      <span className="truncate">{label}</span>
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
  const [stageDraft, setStageDraft] = useState<string>("");
  const [lostReasonDraft, setLostReasonDraft] = useState<string>("");

  useEffect(() => {
    if (lead) {
      setStageDraft(lead.pipeline_stage ?? "form_compilato");
      setLostReasonDraft(lead.lost_reason ?? "");
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

  const eventsQuery = useQuery({
    queryKey: ["lead-events", lead?.id],
    queryFn: () => fetchEvents(lead!.id),
    enabled: !!lead && isSupabaseConfigured,
  });

  const stageMutation = useMutation({
    mutationFn: async ({ newStage, reason }: { newStage: string; reason: string | null }) => {
      if (!supabase || !lead) throw new Error("Supabase non configurato");
      const prev = lead.pipeline_stage ?? "form_compilato";
      const update: Record<string, unknown> = { pipeline_stage: newStage };
      if (newStage === "chiuso_perso") {
        update.lost_reason = reason;
      } else {
        update.lost_reason = null;
      }
      const { error } = await supabase.from("leads").update(update).eq("id", lead.id);
      if (error) throw error;
      const { error: evErr } = await supabase.from("lead_events").insert({
        lead_id: lead.id,
        stage_from: prev,
        stage_to: newStage,
        lost_reason: newStage === "chiuso_perso" ? reason : null,
      });
      if (evErr) throw evErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-events", lead?.id] });
      toast.success("Stage pipeline aggiornato");
    },
    onError: (e: Error) => toast.error(`Errore aggiornamento stage: ${e.message}`),
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

  const handleStageChange = (s: string) => {
    setStageDraft(s);
    if (s === "chiuso_perso") {
      // wait for reason; trigger only if reason already set
      if (lostReasonDraft) {
        stageMutation.mutate({ newStage: s, reason: lostReasonDraft });
      }
    } else {
      setLostReasonDraft("");
      stageMutation.mutate({ newStage: s, reason: null });
    }
  };

  const handleLostReasonChange = (r: string) => {
    setLostReasonDraft(r);
    if (r && stageDraft === "chiuso_perso") {
      stageMutation.mutate({ newStage: "chiuso_perso", reason: r });
    }
  };

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
          events={eventsQuery.data ?? []}
          eventsLoading={eventsQuery.isLoading}
          stageDraft={stageDraft}
          onStageChange={handleStageChange}
          lostReasonDraft={lostReasonDraft}
          onLostReasonChange={handleLostReasonChange}
          stageSaving={stageMutation.isPending}
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
  events,
  eventsLoading,
  stageDraft,
  onStageChange,
  lostReasonDraft,
  onLostReasonChange,
  stageSaving,
  noteText,
  setNoteText,
  onAddNote,
  noteSaving,
}: {
  lead: LeadRow;
  onClose: () => void;
  notes: LeadNote[];
  notesLoading: boolean;
  events: LeadEvent[];
  eventsLoading: boolean;
  stageDraft: string;
  onStageChange: (s: string) => void;
  lostReasonDraft: string;
  onLostReasonChange: (r: string) => void;
  stageSaving: boolean;
  noteText: string;
  setNoteText: (s: string) => void;
  onAddNote: () => void;
  noteSaving: boolean;
}) {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !user) throw new Error("Non autenticato");
      const { error } = await supabase
        .from("leads")
        .update({ venditore_id: user.id, pipeline_stage: "contattato" })
        .eq("id", lead.id);
      if (error) throw error;
      await supabase.from("lead_events").insert({
        lead_id: lead.id,
        stage_from: lead.pipeline_stage ?? "form_compilato",
        stage_to: "contattato",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-events", lead.id] });
      toast.success("Lead preso in carico!");
      onClose();
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

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

        {/* Stage pipeline */}
        <section>
          <p className="label-section mb-2">Stage pipeline</p>

          {/* "Prendi in carico" — venditore only, unassigned lead, form_compilato */}
          {role === "venditore" && !lead.venditore_id && lead.pipeline_stage === "form_compilato" ? (
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="btn-primary w-full justify-center flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,212,255,0.08) 100%)", border: "1px solid rgba(0,212,255,0.45)", color: "#00d4ff", boxShadow: "0 0 24px rgba(0,212,255,0.2)" }}
            >
              {claimMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <UserPlus className="h-4 w-4" />}
              {claimMutation.isPending ? "Acquisizione…" : "Prendi in carico"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <select
                value={stageDraft}
                onChange={(e) => onStageChange(e.target.value)}
                disabled={stageSaving || (role === "venditore" && lead.venditore_id !== user?.id)}
                className="glass h-11 flex-1 px-3 text-sm text-foreground outline-none disabled:opacity-50"
              >
                {PIPELINE_STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {PIPELINE_STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
              {stageSaving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          )}

          {stageDraft === "chiuso_perso" && (
            <div className="mt-3">
              <p className="label-section mb-2">Motivo perdita</p>
              <select
                value={lostReasonDraft}
                onChange={(e) => onLostReasonChange(e.target.value)}
                disabled={stageSaving}
                className="glass h-11 w-full px-3 text-sm text-foreground outline-none"
              >
                <option value="">Seleziona un motivo…</option>
                {LOST_REASON_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {LOST_REASON_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <VenditoreSection lead={lead} />

        {lead.pipeline_stage === "chiuso_vinto" && <ProjectSection lead={lead} />}

        <ProposalsSection
          leadId={lead.id}
          role={role}
          userId={user?.id ?? null}
          onLeadStageChanged={() => {
            queryClient.invalidateQueries({ queryKey: ["leads"] });
          }}
        />

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
            {(notesLoading || eventsLoading) && (
              <li className="text-xs text-muted-foreground italic">Caricamento timeline…</li>
            )}
            {(() => {
              type TLItem =
                | { kind: "event"; id: string; created_at: string; ev: LeadEvent }
                | { kind: "note"; id: string; created_at: string; note: LeadNote };
              const items: TLItem[] = [
                ...events.map((ev) => ({ kind: "event" as const, id: `e-${ev.id}`, created_at: ev.created_at, ev })),
                ...notes
                  .filter((n) => !n.content.startsWith("[status]"))
                  .map((n) => ({ kind: "note" as const, id: `n-${n.id}`, created_at: n.created_at, note: n })),
              ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

              return items.map((it) => {
                if (it.kind === "event") {
                  const stage = it.ev.stage_to ?? "";
                  const style = PIPELINE_STAGE_STYLES[stage] ?? PIPELINE_STAGE_STYLES.form_compilato;
                  const icon = STAGE_ICONS[stage] ?? "•";
                  return (
                    <li key={it.id} className="relative">
                      <span
                        className="absolute -left-[31px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0a1020] text-[10px]"
                        style={{ background: style.bg, color: style.color, borderColor: style.border, boxShadow: style.glow }}
                      >
                        {icon}
                      </span>
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: style.color }}
                      >
                        {PIPELINE_STAGE_LABELS[stage] ?? stage}
                      </p>
                      {it.ev.stage_from && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          da {PIPELINE_STAGE_LABELS[it.ev.stage_from] ?? it.ev.stage_from}
                        </p>
                      )}
                      {it.ev.lost_reason && (
                        <p className="mt-1 text-xs font-medium text-red-300">
                          Motivo: {LOST_REASON_LABELS[it.ev.lost_reason] ?? it.ev.lost_reason}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {fullDate(it.ev.created_at)}
                      </p>
                    </li>
                  );
                }
                return (
                  <li key={it.id} className="relative">
                    <span
                      className="absolute -left-[27px] mt-1 flex h-3 w-3 rounded-full border-2 border-[#0a1020]"
                      style={{ background: "#34d399" }}
                    />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/85">
                      Nota interna
                    </p>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{it.note.content}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {fullDate(it.note.created_at)}
                    </p>
                  </li>
                );
              });
            })()}
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

// ============================================================
// Venditore assignment section (admin only, inside drawer)
// ============================================================

function VenditoreSection({ lead }: { lead: LeadRow }) {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(lead.venditore_id ?? "");

  useEffect(() => { setDraft(lead.venditore_id ?? ""); }, [lead.id, lead.venditore_id]);

  const { data: venditori = [] } = useQuery({
    queryKey: ["venditori-list"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "venditore")
        .order("full_name");
      return (data ?? []) as { id: string; full_name: string | null }[];
    },
    enabled: role === "admin" && !!supabase,
    staleTime: 60_000,
  });

  const assignMutation = useMutation({
    mutationFn: async (vendId: string | null) => {
      if (!supabase) throw new Error("Supabase non configurato");
      const { error } = await supabase
        .from("leads")
        .update({ venditore_id: vendId || null })
        .eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(draft ? "Venditore assegnato" : "Venditore rimosso");
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  if (role !== "admin") return null;

  // Read-only when a venditore has taken the lead in charge
  if (lead.venditore) {
    return (
      <section>
        <p className="label-section mb-2 flex items-center gap-2">
          <UserPlus className="h-3.5 w-3.5" />
          Venditore assegnato
        </p>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)" }}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black"
            style={{ background: "rgba(0,212,255,0.18)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.35)" }}>
            {(lead.venditore.full_name ?? "?")[0].toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-foreground">{lead.venditore.full_name ?? "—"}</span>
          <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-muted-foreground">In carico</span>
        </div>
      </section>
    );
  }

  return (
    <section>
      <p className="label-section mb-2 flex items-center gap-2">
        <UserPlus className="h-3.5 w-3.5" />
        Venditore assegnato
      </p>
      <div className="flex items-center gap-3">
        <select
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            assignMutation.mutate(e.target.value || null);
          }}
          disabled={assignMutation.isPending}
          className="glass h-11 flex-1 px-3 text-sm text-foreground outline-none"
        >
          <option value="">— Nessun venditore —</option>
          {venditori.map((v) => (
            <option key={v.id} value={v.id}>{v.full_name ?? v.id}</option>
          ))}
        </select>
        {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>
    </section>
  );
}

// ============================================================
// Project section (visibile solo per chiuso_vinto)
// ============================================================

const CLIENT_STATUS_OPTIONS = ["In corso", "Consegnato", "In pausa"] as const;

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  // already YYYY-MM-DD or full date
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  try {
    return format(new Date(iso), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

function toDateTimeLocalValue(iso: string | null) {
  if (!iso) return "";
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

function ProjectSection({ lead }: { lead: LeadRow }) {
  const queryClient = useQueryClient();
  const [clientStatus, setClientStatus] = useState<string>(lead.client_status ?? "In corso");
  const [startDate, setStartDate] = useState<string>(toDateInputValue(lead.project_start_date));
  const [nextMeeting, setNextMeeting] = useState<string>(toDateTimeLocalValue(lead.next_meeting));

  useEffect(() => {
    setClientStatus(lead.client_status ?? "In corso");
    setStartDate(toDateInputValue(lead.project_start_date));
    setNextMeeting(toDateTimeLocalValue(lead.next_meeting));
  }, [lead.id]);

  const updateMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!supabase) throw new Error("Supabase non configurato");
      const { error } = await supabase.from("leads").update(patch).eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Progetto aggiornato");
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  const handleStatus = (v: string) => {
    setClientStatus(v);
    updateMutation.mutate({ client_status: v });
  };
  const handleStart = (v: string) => {
    setStartDate(v);
    updateMutation.mutate({ project_start_date: v || null });
  };
  const handleMeeting = (v: string) => {
    setNextMeeting(v);
    updateMutation.mutate({ next_meeting: v ? new Date(v).toISOString() : null });
  };

  return (
    <section>
      <p className="label-section mb-3 flex items-center gap-2">
        Progetto
        {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Status progetto
          </label>
          <select
            value={clientStatus}
            onChange={(e) => handleStatus(e.target.value)}
            className="glass mt-1.5 h-11 w-full px-3 text-sm text-foreground outline-none"
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
            onChange={(e) => handleStart(e.target.value)}
            className="glass mt-1.5 h-11 w-full px-3 text-sm text-foreground outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Prossimo meeting
          </label>
          <input
            type="datetime-local"
            value={nextMeeting}
            onChange={(e) => handleMeeting(e.target.value)}
            className="glass mt-1.5 h-11 w-full px-3 text-sm text-foreground outline-none"
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Proposals section (drawer lead)
// ============================================================

type Quote = {
  id: string;
  lead_id: string;
  service: string | null;
  amount: number | null;
  content: string | null;
  status: string | null;
  rejection_reason: string | null;
  sent_at: string | null;
  created_at: string;
  venditore_id: string | null;
  pagato_at: string | null;
};

const QUOTE_STATUS_OPTIONS = ["Inviata", "Vista", "Accettata", "Rifiutata", "Scaduta"] as const;
const QUOTE_STATUS_OPTIONS_ADMIN = ["Inviata", "Vista", "Accettata", "Rifiutata", "Scaduta", "Pagato"] as const;

const QUOTE_STATUS_TONE: Record<string, { color: string; bg: string; border: string }> = {
  Inviata: { color: "#7dd9ff", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.32)" },
  Vista: { color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.32)" },
  Accettata: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  Rifiutata: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  Scaduta: { color: "#94a3b8", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" },
  Pagato: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.32)" },
};

function formatEuro(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function ProposalsSection({
  leadId,
  role,
  userId,
  onLeadStageChanged,
}: {
  leadId: string;
  role: string | null;
  userId: string | null;
  onLeadStageChanged: () => void;
}) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [service, setService] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [sentAt, setSentAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) toast.error(`Errore proposte: ${error.message}`);
    else setQuotes((data ?? []) as Quote[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status: newStatus };
    if (newStatus === "Pagato") patch.pagato_at = now;

    setQuotes((list) => list.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
    const { error } = await supabase.from("quotes").update(patch).eq("id", id);
    if (error) {
      toast.error(`Errore: ${error.message}`);
      load();
      return;
    }

    // Sync lead pipeline_stage
    if (newStatus === "Accettata" || newStatus === "Pagato") {
      await supabase.from("leads").update({ pipeline_stage: "chiuso_vinto" }).eq("id", leadId);
      onLeadStageChanged();
    } else if (newStatus === "Rifiutata") {
      await supabase.from("leads").update({ pipeline_stage: "chiuso_perso" }).eq("id", leadId);
      onLeadStageChanged();
    }

    // When marked Pagato: auto-create payment record (idempotent via quote_id unique index)
    if (newStatus === "Pagato") {
      const quote = quotes.find((q) => q.id === id);
      if (quote) {
        await supabase.from("payments").upsert({
          lead_id: leadId,
          quote_id: id,
          amount: quote.amount ?? 0,
          status: "paid",
          description: quote.service ?? "Pagamento",
          paid_at: now,
        }, { onConflict: "quote_id" });
      }
    }

    toast.success(newStatus === "Pagato" ? "Pagamento registrato nel fatturato ✓" : "Proposta aggiornata");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !service || !amount) return;
    setSaving(true);
    const { error } = await supabase.from("quotes").insert({
      lead_id: leadId,
      venditore_id: userId ?? null,
      service,
      amount: parseFloat(amount),
      content: notes || null,
      status: "Inviata",
      sent_at: sentAt || null,
    });
    setSaving(false);
    if (error) {
      toast.error(`Errore: ${error.message}`);
    } else {
      toast.success("Proposta creata");
      setService("");
      setAmount("");
      setNotes("");
      setSentAt(format(new Date(), "yyyy-MM-dd"));
      setShowForm(false);
      load();
    }
  };

  const statusOptions = role === "admin" ? QUOTE_STATUS_OPTIONS_ADMIN : QUOTE_STATUS_OPTIONS;

  return (
    <section>
      <p className="label-section mb-3 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5" />
        Proposte
      </p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Caricamento…
        </div>
      ) : quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nessuna proposta ancora.</p>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => {
            const tone = QUOTE_STATUS_TONE[q.status ?? "Inviata"] ?? QUOTE_STATUS_TONE.Inviata;
            const isLocked = q.status === "Pagato" && role === "venditore";
            return (
              <div
                key={q.id}
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{q.service ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEuro(q.amount)} · {q.sent_at ? format(new Date(q.sent_at), "d MMM yyyy", { locale: it }) : "—"}
                    </p>
                    {(q.status === "Accettata" || q.status === "Pagato") && q.amount && (
                      <p className="mt-1 text-xs font-semibold" style={{ color: q.status === "Pagato" ? "#a78bfa" : "#34d399" }}>
                        {q.status === "Pagato" ? "✓ Pagata" : "✓ Accettata"}
                      </p>
                    )}
                  </div>
                  {isLocked ? (
                    <span className="rounded-lg border px-2 py-1 text-[11px] font-semibold"
                      style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>
                      🔒 Pagato
                    </span>
                  ) : (
                    <select
                      value={q.status ?? "Inviata"}
                      onChange={(e) => updateStatus(q.id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-[11px] font-semibold outline-none"
                      style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s} style={{ background: "#0a1020", color: "#e2e8f0" }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {q.content && (
                  <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{q.content}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleCreate} className="mt-3 space-y-2 rounded-xl border border-[rgba(0,212,255,0.18)] bg-[rgba(0,212,255,0.04)] p-3">
          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="Servizio"
            className="glass h-9 w-full px-3 text-sm text-foreground outline-none"
            required
          />
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Importo €"
            className="glass h-9 w-full px-3 text-sm text-foreground outline-none"
            required
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note"
            rows={2}
            className="glass w-full px-3 py-2 text-sm text-foreground outline-none resize-none"
          />
          <input
            type="date"
            value={sentAt}
            onChange={(e) => setSentAt(e.target.value)}
            className="glass h-9 w-full px-3 text-sm text-foreground outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.12)] px-3 py-1.5 text-xs font-semibold text-primary hover:bg-[rgba(0,212,255,0.2)] disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Salva
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.06)] px-3 py-1.5 text-xs font-semibold text-primary hover:bg-[rgba(0,212,255,0.12)]"
        >
          <Plus className="h-3 w-3" /> Nuova proposta
        </button>
      )}
    </section>
  );
}
