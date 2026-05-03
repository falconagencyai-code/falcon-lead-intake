import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Euro,
  Eye,
  FileText,
  Loader2,
  Mail,
  MessageSquarePlus,
  Paperclip,
  Phone,
  Plus,
  Receipt,
  Send,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AdminCard } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({ meta: [{ title: "Falcon Admin — Pipeline" }] }),
  component: PipelinePage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

type QuoteRow = {
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
  pdf_url: string | null;
};

type Payment = {
  id: string;
  lead_id: string;
  amount: number | null;
  paid_at: string | null;
  description: string | null;
  lead: { full_name: string | null; company: string | null; venditore: { full_name: string | null } | null } | null;
};

type Tab = "lead" | "preventivi" | "clienti" | "chiusure";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_STAGES = ["form_compilato", "contattato", "call_schedulata", "call_effettuata", "no_show"];

const SERVICE_LABELS: Record<string, string> = {
  sito_web: "Sito web",
  piattaforma_ai: "Piattaforma AI",
  gestionale: "Gestionale",
  automazione_ai_agent: "Automazione AI Agent",
  altro: "Altro",
};

const SERVICE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  sito_web:            { bg: "rgba(139,92,246,0.12)", color: "#c4b5fd", border: "rgba(139,92,246,0.35)" },
  piattaforma_ai:      { bg: "rgba(0,212,255,0.12)",  color: "#7dd9ff", border: "rgba(0,212,255,0.35)" },
  gestionale:          { bg: "rgba(251,146,60,0.12)", color: "#fdba74", border: "rgba(251,146,60,0.35)" },
  automazione_ai_agent:{ bg: "rgba(34,197,94,0.12)",  color: "#86efac", border: "rgba(34,197,94,0.35)" },
  altro:               { bg: "rgba(148,163,184,0.12)",color: "#cbd5e1", border: "rgba(148,163,184,0.32)" },
};

const PIPELINE_STAGE_LABELS: Record<string, string> = {
  form_compilato:    "Form compilato",
  contattato:        "Contattato",
  call_schedulata:   "Call schedulata",
  call_effettuata:   "Call effettuata",
  no_show:           "No show",
  preventivo_inviato:"Preventivo inviato",
  chiuso_vinto:      "Chiuso — Vinto ✓",
  chiuso_perso:      "Chiuso — Perso ✗",
};

const PIPELINE_STAGE_SHORT: Record<string, string> = {
  form_compilato:    "Form",
  contattato:        "Contattato",
  call_schedulata:   "Call sched.",
  call_effettuata:   "Call fatta",
  no_show:           "No show",
  preventivo_inviato:"Preventivo",
  chiuso_vinto:      "Vinto ✓",
  chiuso_perso:      "Perso ✗",
};

const PIPELINE_STAGE_OPTIONS = [
  "form_compilato","contattato","call_schedulata","call_effettuata",
  "no_show","preventivo_inviato","chiuso_vinto","chiuso_perso",
] as const;

const PIPELINE_STAGE_STYLES: Record<string, { bg: string; color: string; border: string; glow?: string }> = {
  form_compilato:    { bg: "rgba(0,212,255,0.12)",   color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  contattato:        { bg: "rgba(0,212,255,0.12)",   color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  call_schedulata:   { bg: "rgba(0,212,255,0.12)",   color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  call_effettuata:   { bg: "rgba(0,212,255,0.12)",   color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  no_show:           { bg: "rgba(251,146,60,0.12)",  color: "#fdba74", border: "rgba(251,146,60,0.45)" },
  preventivo_inviato:{ bg: "rgba(0,212,255,0.12)",   color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  chiuso_vinto:      { bg: "rgba(16,185,129,0.18)",  color: "#6ee7b7", border: "rgba(16,185,129,0.55)", glow: "0 0 18px rgba(16,185,129,0.4)" },
  chiuso_perso:      { bg: "rgba(248,113,113,0.12)", color: "#fca5a5", border: "rgba(248,113,113,0.45)" },
};

const STAGE_ICONS: Record<string, string> = {
  form_compilato: "📝", contattato: "📧", call_schedulata: "📅",
  call_effettuata: "📞", no_show: "🚫", preventivo_inviato: "📄",
  chiuso_vinto: "✓", chiuso_perso: "✗",
};

const STAGE_INFO_ACTIVE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  form_compilato:  { label: "Nuovo",          color: "#00d4ff", bg: "rgba(0,212,255,0.08)",   border: "rgba(0,212,255,0.25)" },
  contattato:      { label: "Contattato",      color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)" },
  call_schedulata: { label: "Call schedulata", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  call_effettuata: { label: "Call effettuata", color: "#818cf8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.25)" },
  no_show:         { label: "No show",         color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)" },
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
  process: "Processo da gestire", users: "Numero utenti", ai_use_case: "Caso d'uso AI",
  data_source: "Fonti dati disponibili", site_type: "Tipo di sito", pages: "Contenuti e struttura",
  task: "Task da automatizzare", tools: "Tool da integrare", idea: "Idea del progetto", goal: "Obiettivo principale",
};

const AVATAR_PALETTE = [
  { bg: "rgba(0,212,255,0.18)",   color: "#7dd9ff", border: "rgba(0,212,255,0.4)" },
  { bg: "rgba(139,92,246,0.18)",  color: "#c4b5fd", border: "rgba(139,92,246,0.4)" },
  { bg: "rgba(236,72,153,0.18)",  color: "#f9a8d4", border: "rgba(236,72,153,0.4)" },
  { bg: "rgba(34,197,94,0.18)",   color: "#86efac", border: "rgba(34,197,94,0.4)" },
];

const QUOTE_STATUS_OPTIONS      = ["Inviata","Vista","Accettata","Rifiutata","Scaduta"] as const;
const QUOTE_STATUS_OPTIONS_ADMIN= ["Inviata","Vista","Accettata","Rifiutata","Scaduta","Pagato"] as const;

const QUOTE_STATUS_TONE: Record<string, { color: string; bg: string; border: string }> = {
  Inviata:  { color: "#7dd9ff", bg: "rgba(0,212,255,0.1)",   border: "rgba(0,212,255,0.32)" },
  Vista:    { color: "#facc15", bg: "rgba(250,204,21,0.1)",  border: "rgba(250,204,21,0.32)" },
  Accettata:{ color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.32)" },
  Rifiutata:{ color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  Scaduta:  { color: "#94a3b8", bg: "rgba(255,255,255,0.05)",border: "rgba(255,255,255,0.12)" },
  Pagato:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.32)" },
};

const CLIENT_STATUS_OPTIONS = ["In corso", "Consegnato", "In pausa"] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashIndex(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function initials(name: string | null, email: string | null) {
  const src = (name && name.trim()) || email || "??";
  return src.split(/\s+|@|\./).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "??";
}

function avatarTone(seed: string) {
  return AVATAR_PALETTE[hashIndex(seed, AVATAR_PALETTE.length)];
}

function relativeDate(iso: string | null) {
  if (!iso) return "—";
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: it }); }
  catch { return "—"; }
}

function fullDate(iso: string | null) {
  if (!iso) return "—";
  try { return format(new Date(iso), "d MMMM yyyy 'alle' HH:mm", { locale: it }); }
  catch { return "—"; }
}

function formatAnswerValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function formatEuro(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function toDateInputValue(iso: string | null) {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  try { return format(new Date(iso), "yyyy-MM-dd"); }
  catch { return ""; }
}

function toDateTimeLocalValue(iso: string | null) {
  if (!iso) return "";
  try { return format(new Date(iso), "yyyy-MM-dd'T'HH:mm"); }
  catch { return ""; }
}

function dateGroupLabel(iso: string | null): string {
  if (!iso) return "Senza data";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())
    return `Oggi · ${format(d, "d MMMM", { locale: it })}`;
  if (d.toDateString() === yesterday.toDateString())
    return `Ieri · ${format(d, "d MMMM", { locale: it })}`;
  return format(d, "d MMMM yyyy", { locale: it });
}

function groupByDate(leads: LeadRow[]): { label: string; items: LeadRow[] }[] {
  const groups = new Map<string, LeadRow[]>();
  for (const l of leads) {
    const key = dateGroupLabel(l.created_at);
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function fetchLeads(): Promise<LeadRow[]> {
  if (!supabase) throw new Error("Supabase non configurato");
  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, email, phone, company, status, pipeline_stage, lost_reason, service_interest, budget_range, timeline, form_answers, created_at, client_status, project_start_date, next_meeting, venditore_id, venditore:profiles!venditore_id(id, full_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadRow[];
}

async function fetchNotes(leadId: string): Promise<LeadNote[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lead_notes").select("id, lead_id, user_id, content, created_at")
    .eq("lead_id", leadId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadNote[];
}

async function fetchEvents(leadId: string): Promise<LeadEvent[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("lead_events").select("id, lead_id, stage_from, stage_to, lost_reason, created_at")
    .eq("lead_id", leadId).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LeadEvent[];
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function StageBadge({ stage }: { stage: string }) {
  const style = PIPELINE_STAGE_STYLES[stage] ?? PIPELINE_STAGE_STYLES.form_compilato;
  const icon = STAGE_ICONS[stage] ?? "•";
  const label = PIPELINE_STAGE_SHORT[stage] ?? PIPELINE_STAGE_LABELS[stage] ?? stage;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color, borderColor: style.border, boxShadow: style.glow }}
      title={PIPELINE_STAGE_LABELS[stage] ?? stage}>
      <span className="text-[11px] leading-none">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function VenditoreChip({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: "rgba(0,212,255,0.07)", color: "#7dd9ff", border: "1px solid rgba(0,212,255,0.15)" }}>
      {name}
    </span>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const s = QUOTE_STATUS_TONE[status] ?? QUOTE_STATUS_TONE.Inviata;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {status === "Accettata" && <CheckCircle2 className="w-3 h-3" />}
      {status === "Rifiutata" && <XCircle className="w-3 h-3" />}
      {status}
    </span>
  );
}

function ActionIconButton({
  children, onClick, title, danger, disabled,
}: {
  children: React.ReactNode; onClick: (e: React.MouseEvent) => void;
  title: string; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-muted-foreground backdrop-blur-sm transition hover:border-[rgba(0,212,255,0.4)] hover:text-primary disabled:opacity-50 ${danger ? "hover:!border-[rgba(248,113,113,0.45)] hover:!text-red-300" : ""}`}>
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <AdminCard className="p-12 text-center">
      <Icon className="w-12 h-12 mx-auto mb-4" style={{ color: "#2a3a5c" }} />
      <p className="text-muted-foreground">{text}</p>
    </AdminCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PipelinePage() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("lead");
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [openQuoteLeadId, setOpenQuoteLeadId] = useState<string | null>(null);

  const { data: allLeads = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery<LeadRow[]>({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    enabled: isSupabaseConfigured,
  });

  // Realtime
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel("pipeline-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => void refetchLeads())
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => void refetchLeads())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pipeline-payments"] });
      })
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, [refetchLeads]);

  // Payments
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["pipeline-payments"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase
        .from("payments")
        .select("id, lead_id, amount, paid_at, description, lead:leads!lead_id(full_name, company, venditore:profiles!venditore_id(full_name))")
        .eq("status", "paid")
        .order("paid_at", { ascending: false });
      return (data ?? []) as unknown as Payment[];
    },
    enabled: isSupabaseConfigured,
  });

  const activeLeads     = allLeads.filter(l => ACTIVE_STAGES.includes(l.pipeline_stage ?? ""));
  const preventiviLeads = allLeads.filter(l => l.pipeline_stage === "preventivo_inviato");
  const clientiLeads    = allLeads.filter(l => l.pipeline_stage === "chiuso_vinto");
  const totaleChiusure  = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

  // Preventivi quotes
  const prevIds = preventiviLeads.map(l => l.id);
  const { data: prevQuotes = [] } = useQuery<QuoteRow[]>({
    queryKey: ["pipeline-prev-quotes", prevIds.join(",")],
    queryFn: async () => {
      if (!supabase || prevIds.length === 0) return [];
      const { data } = await supabase.from("quotes").select("*").in("lead_id", prevIds).order("created_at", { ascending: false });
      return (data ?? []) as QuoteRow[];
    },
    enabled: isSupabaseConfigured && prevIds.length > 0,
  });

  const openLead = openLeadId ? allLeads.find(l => l.id === openLeadId) ?? null : null;
  const openQuoteLead = openQuoteLeadId ? allLeads.find(l => l.id === openQuoteLeadId) ?? null : null;

  const tabs: { key: Tab; label: string; count: number | string; icon: typeof Users; color: string }[] = [
    { key: "lead",       label: "Lead",       count: activeLeads.length,     icon: Users,     color: "#00d4ff" },
    { key: "preventivi", label: "Preventivi", count: preventiviLeads.length, icon: FileText,  color: "#a78bfa" },
    { key: "clienti",    label: "Clienti",    count: clientiLeads.length,    icon: UserCheck, color: "#4ade80" },
    { key: "chiusure",   label: "Chiusure",   count: formatEuro(totaleChiusure), icon: TrendingUp, color: "#34d399" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Commerciale</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">
          Pipeline <span className="text-primary text-glow">Commerciale</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Lead · Preventivi · Clienti · Chiusure</p>
      </header>

      {/* Tab navigation */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="relative flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all"
              style={{
                background: active ? `color-mix(in srgb, ${t.color} 10%, transparent)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? `color-mix(in srgb, ${t.color} 40%, transparent)` : "rgba(255,255,255,0.08)"}`,
                boxShadow: active ? `0 0 32px color-mix(in srgb, ${t.color} 15%, transparent)` : "none",
              }}>
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: active ? t.color : "#4a5568" }}>
                  0{i + 1}
                </span>
                {i < tabs.length - 1 && (
                  <ArrowRight className="w-3 h-3 absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 hidden md:block"
                    style={{ color: active ? t.color : "#2a3a5c" }} />
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                  style={{ background: active ? `color-mix(in srgb, ${t.color} 15%, transparent)` : "rgba(255,255,255,0.04)", color: active ? t.color : "#4a5568" }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: active ? t.color : "#c8d8e8" }}>{t.label}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: active ? t.color : "#6677aa" }}>
                    {t.key === "chiusure" ? t.count : `${t.count} ${(t.count as number) === 1 ? "elemento" : "elementi"}`}
                  </p>
                </div>
              </div>
              {active && <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: t.color }} />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {leadsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {activeTab === "lead" && (
            <LeadTab leads={activeLeads} role={role} onOpen={(id) => setOpenLeadId(id)} refetch={refetchLeads} />
          )}
          {activeTab === "preventivi" && (
            <PreventiviTab leads={preventiviLeads} quotes={prevQuotes} role={role}
              onOpenQuotes={(id) => setOpenQuoteLeadId(id)}
              onOpen={(id) => setOpenLeadId(id)} />
          )}
          {activeTab === "clienti" && (
            <ClientiTab leads={clientiLeads} role={role} onOpen={(id) => setOpenLeadId(id)} />
          )}
          {activeTab === "chiusure" && (
            <ChiusureTab payments={payments} totale={totaleChiusure} role={role} />
          )}
        </>
      )}

      <LeadDrawer lead={openLead} onClose={() => setOpenLeadId(null)} />
      <PreventivDetailDrawer
        lead={openQuoteLead}
        onClose={() => setOpenQuoteLeadId(null)}
        onOpenFullDrawer={(id) => { setOpenQuoteLeadId(null); setOpenLeadId(id); }}
      />
    </div>
  );
}

// ─── Tab: Lead (with full drawer + date grouping) ─────────────────────────────

function LeadTab({ leads, role, onOpen, refetch }: {
  leads: LeadRow[];
  role: string | null;
  onOpen: (id: string) => void;
  refetch: () => void;
}) {
  const groups = useMemo(() => groupByDate(leads), [leads]);

  return (
    <div className="space-y-5">
      {/* Stage breakdown strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(STAGE_INFO_ACTIVE).map(([key, info]) => {
          const n = leads.filter(l => l.pipeline_stage === key).length;
          return (
            <div key={key} className="flex items-center gap-3 rounded-2xl px-4 py-2.5 shrink-0"
              style={{ background: info.bg, border: `1px solid ${info.border}` }}>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: info.color }} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: info.color }}>{info.label}</p>
                <p className="text-lg font-black text-foreground leading-none mt-0.5">{n}</p>
              </div>
            </div>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={Users} text="Nessun lead attivo nella pipeline." />
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1" style={{ background: "rgba(0,212,255,0.12)" }} />
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ color: "#7dd9ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.18)" }}>
                  {label}
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(0,212,255,0.12)" }} />
              </div>

              <AdminCard className="overflow-hidden p-0">
                {/* Table header */}
                <div className="hidden grid-cols-[minmax(200px,2fr)_minmax(110px,1fr)_minmax(80px,0.7fr)_minmax(90px,0.8fr)_minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(85px,0.7fr)_100px] items-center gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
                  <span>Lead</span><span>Servizio</span><span>Budget</span>
                  <span>Timing</span><span>Stage</span><span>Venditore</span>
                  <span>Arrivo</span><span className="text-right">Azioni</span>
                </div>
                {items.map(lead => (
                  <LeadRowItem key={lead.id} lead={lead} onOpen={() => onOpen(lead.id)} refetch={refetch} />
                ))}
              </AdminCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRowItem({ lead, onOpen, refetch }: { lead: LeadRow; onOpen: () => void; refetch: () => void }) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead eliminato");
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  return (
    <div onClick={onOpen}
      className="group grid min-h-[68px] cursor-pointer grid-cols-1 items-center gap-3 border-b border-[rgba(255,255,255,0.05)] px-5 py-4 transition-colors last:border-b-0 hover:bg-[rgba(0,212,255,0.04)] lg:grid-cols-[minmax(200px,2fr)_minmax(110px,1fr)_minmax(80px,0.7fr)_minmax(90px,0.8fr)_minmax(140px,1.2fr)_minmax(120px,1fr)_minmax(85px,0.7fr)_100px]">
      {/* Lead */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold border"
          style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>
          {initials(lead.full_name, lead.email)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-foreground truncate">{lead.full_name || "(senza nome)"}</span>
            {lead.company && (
              <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Building2 className="h-3 w-3" />{lead.company}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground truncate">{lead.email ?? "—"}</div>
        </div>
      </div>
      {/* Servizio */}
      <div>
        <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: serviceColor.bg, color: serviceColor.color, borderColor: serviceColor.border }}>
          {SERVICE_LABELS[service] ?? service}
        </span>
      </div>
      {/* Budget */}
      <div className="text-sm text-foreground">{lead.budget_range ?? "—"}</div>
      {/* Timing */}
      <div className="text-sm text-foreground/90">{lead.timeline ?? "—"}</div>
      {/* Stage */}
      <div className="min-w-0"><StageBadge stage={stage} /></div>
      {/* Venditore */}
      <div className="min-w-0">
        {lead.venditore ? (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold truncate max-w-[110px]"
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
      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
        <ActionIconButton title="Dettaglio" onClick={e => { e.stopPropagation(); onOpen(); }}>
          <Eye className="h-3.5 w-3.5" />
        </ActionIconButton>
        <ActionIconButton title="Assegna venditore" onClick={e => { e.stopPropagation(); onOpen(); }}>
          <UserPlus className="h-3.5 w-3.5" />
        </ActionIconButton>
        <ActionIconButton title="Elimina" danger
          onClick={e => {
            e.stopPropagation();
            if (confirm(`Eliminare "${lead.full_name ?? lead.email ?? "questo lead"}"?`)) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </ActionIconButton>
      </div>
    </div>
  );
}

// ─── Tab: Preventivi ──────────────────────────────────────────────────────────

function PreventiviTab({ leads, quotes, role, onOpenQuotes, onOpen }: {
  leads: LeadRow[]; quotes: QuoteRow[]; role: string | null;
  onOpenQuotes: (id: string) => void; onOpen: (id: string) => void;
}) {
  const quoteMap = useMemo(() => {
    const m = new Map<string, QuoteRow[]>();
    for (const q of quotes) {
      const arr = m.get(q.lead_id) ?? [];
      arr.push(q);
      m.set(q.lead_id, arr);
    }
    return m;
  }, [quotes]);

  const groups = useMemo(() => groupByDate(leads), [leads]);

  const inAttesa  = quotes.filter(q => q.status === "In attesa" || q.status === "Inviata" || q.status === "Vista").length;
  const accettati = quotes.filter(q => q.status === "Accettata" || q.status === "Pagato").length;
  const rifiutati = quotes.filter(q => q.status === "Rifiutata" || q.status === "Scaduta").length;

  return (
    <div className="space-y-5">
      <div className="flex gap-3">
        {[
          { label: "In attesa", count: inAttesa,  color: "#facc15" },
          { label: "Accettati", count: accettati, color: "#4ade80" },
          { label: "Rifiutati", count: rifiutati, color: "#f87171" },
        ].map(k => (
          <div key={k.label} className="flex-1 rounded-2xl px-4 py-3 text-center"
            style={{ background: `color-mix(in srgb, ${k.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${k.color} 25%, transparent)` }}>
            <p className="text-xl font-black text-foreground">{k.count}</p>
            <p className="text-xs mt-0.5" style={{ color: k.color }}>{k.label}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <EmptyState icon={FileText} text="Nessun preventivo in corso." />
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1" style={{ background: "rgba(167,139,250,0.15)" }} />
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                  {label}
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(167,139,250,0.15)" }} />
              </div>
              <div className="space-y-3">
                {items.map(l => (
                  <PreventivoCard key={l.id} lead={l} quotes={quoteMap.get(l.id) ?? []} showVenditore={role === "admin"} onOpen={() => onOpenQuotes(l.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreventivoCard({ lead: l, quotes, showVenditore, onOpen }: {
  lead: LeadRow; quotes: QuoteRow[]; showVenditore: boolean; onOpen: () => void;
}) {
  return (
    <div className="cursor-pointer" onClick={onOpen}><AdminCard className="p-4 transition-colors hover:bg-[rgba(167,139,250,0.04)]">
      <div className="flex items-start gap-4">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: "#a78bfa" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{l.full_name ?? "—"}</p>
            {showVenditore && <VenditoreChip name={l.venditore?.full_name ?? null} />}
          </div>
          {l.company && (
            <p className="text-sm mt-0.5 flex items-center gap-1" style={{ color: "#6677aa" }}>
              <Building2 className="w-3.5 h-3.5" />{l.company}
            </p>
          )}
          <div className="mt-3 space-y-2">
            {quotes.length === 0 ? (
              <p className="text-xs" style={{ color: "#4a5568" }}>Nessun preventivo trovato</p>
            ) : quotes.map(q => (
              <div key={q.id} className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <QuoteStatusBadge status={q.status ?? "Inviata"} />
                <span className="text-sm text-foreground flex-1 truncate">{q.service ?? "—"}</span>
                <span className="text-sm font-bold" style={{ color: "#00d4ff" }}>{formatEuro(q.amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs shrink-0 mt-0.5" style={{ color: "#4a5568" }}>
          <Clock className="w-3.5 h-3.5" />{relativeDate(l.created_at)}
        </div>
      </div>
    </AdminCard></div>
  );
}

// ─── Tab: Clienti ─────────────────────────────────────────────────────────────

function ClientiTab({ leads, role, onOpen }: { leads: LeadRow[]; role: string | null; onOpen: (id: string) => void }) {
  const groups = useMemo(() => groupByDate(leads), [leads]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl px-5 py-3"
        style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)" }}>
        <UserCheck className="w-5 h-5" style={{ color: "#4ade80" }} />
        <p className="text-sm font-medium text-foreground">
          {leads.length} {leads.length === 1 ? "cliente acquisito" : "clienti acquisiti"}
        </p>
      </div>
      {leads.length === 0 ? (
        <EmptyState icon={UserCheck} text="Nessun cliente acquisito ancora." />
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1" style={{ background: "rgba(74,222,128,0.12)" }} />
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ color: "#4ade80", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)" }}>
                  {label}
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(74,222,128,0.12)" }} />
              </div>
              <div className="space-y-3">
                {items.map(l => <ClienteCard key={l.id} lead={l} showVenditore={role === "admin"} onOpen={() => onOpen(l.id)} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClienteCard({ lead: l, showVenditore, onOpen }: { lead: LeadRow; showVenditore: boolean; onOpen: () => void }) {
  return (
    <div className="cursor-pointer" onClick={onOpen}><AdminCard className="p-4 transition-colors hover:bg-[rgba(74,222,128,0.04)]">
      <div className="flex items-center gap-4">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: "#4ade80" }} />
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 font-black text-sm"
          style={{ background: "rgba(74,222,128,0.1)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
          {(l.full_name ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{l.full_name ?? "—"}</p>
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "rgba(74,222,128,0.08)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.2)" }}>
              <CheckCircle2 className="w-3 h-3" /> Cliente
            </span>
            {showVenditore && <VenditoreChip name={l.venditore?.full_name ?? null} />}
          </div>
          {l.company && (
            <p className="text-sm mt-0.5 flex items-center gap-1" style={{ color: "#6677aa" }}>
              <Building2 className="w-3.5 h-3.5" />{l.company}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: "#4a5568" }}>
          <CalendarDays className="w-3.5 h-3.5" />{relativeDate(l.created_at)}
        </div>
      </div>
    </AdminCard></div>
  );
}

// ─── Tab: Chiusure ────────────────────────────────────────────────────────────

function ChiusureTab({ payments, totale, role }: { payments: Payment[]; totale: number; role: string | null }) {
  return (
    <div className="space-y-5">
      <AdminCard className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#34d399" }}>Fatturato totale</p>
            <p className="mt-1.5 text-3xl font-black text-foreground text-glow">{formatEuro(totale)}</p>
            <p className="mt-1 text-sm" style={{ color: "#6677aa" }}>
              {payments.length} {payments.length === 1 ? "pagamento ricevuto" : "pagamenti ricevuti"}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <Euro className="w-6 h-6" style={{ color: "#34d399" }} />
          </div>
        </div>
      </AdminCard>
      {payments.length === 0 ? (
        <EmptyState icon={TrendingUp} text="Nessun pagamento registrato ancora." />
      ) : (
        <div className="space-y-3">
          {payments.map(p => <ChiusuraCard key={p.id} payment={p} showVenditore={role === "admin"} />)}
        </div>
      )}
    </div>
  );
}

function ChiusuraCard({ payment: p, showVenditore }: { payment: Payment; showVenditore: boolean }) {
  return (
    <AdminCard className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: "#34d399" }} />
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: "#34d399" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{p.lead?.full_name ?? "—"}</p>
            {showVenditore && <VenditoreChip name={p.lead?.venditore?.full_name ?? null} />}
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#6677aa" }}>{p.description ?? p.lead?.company ?? "—"}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black" style={{ color: "#34d399" }}>{formatEuro(p.amount)}</p>
          {p.paid_at && (
            <p className="text-xs mt-0.5" style={{ color: "#4a5568" }}>
              {new Date(p.paid_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </AdminCard>
  );
}

// ─── Lead Drawer ──────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!lead) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
      if (newStage === "chiuso_perso") update.lost_reason = reason;
      else update.lost_reason = null;
      const { error } = await supabase.from("leads").update(update).eq("id", lead.id);
      if (error) throw error;
      const { error: evErr } = await supabase.from("lead_events").insert({
        lead_id: lead.id, stage_from: prev, stage_to: newStage,
        lost_reason: newStage === "chiuso_perso" ? reason : null,
      });
      if (evErr) throw evErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-events", lead?.id] });
      toast.success("Stage pipeline aggiornato");
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  const noteMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!supabase || !lead) throw new Error("Supabase non configurato");
      const { error } = await supabase.from("lead_notes").insert({ lead_id: lead.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setNoteText("");
      queryClient.invalidateQueries({ queryKey: ["lead-notes", lead?.id] });
      toast.success("Nota salvata");
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  const handleStageChange = async (s: string) => {
    // Guard: can't move to "preventivo_inviato" without an existing quote
    if (s === "preventivo_inviato" && supabase && lead) {
      const { count } = await supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id);
      if (!count || count === 0) {
        toast.error("Crea prima un preventivo per questo lead prima di spostarlo in 'Preventivo inviato'.");
        return;
      }
    }
    setStageDraft(s);
    if (s === "chiuso_perso") {
      if (lostReasonDraft) stageMutation.mutate({ newStage: s, reason: lostReasonDraft });
    } else {
      setLostReasonDraft("");
      stageMutation.mutate({ newStage: s, reason: null });
    }
  };

  const handleLostReasonChange = (r: string) => {
    setLostReasonDraft(r);
    if (r && stageDraft === "chiuso_perso") stageMutation.mutate({ newStage: "chiuso_perso", reason: r });
  };

  const isOpen = !!lead;
  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[520px] overflow-y-auto border-l border-[rgba(0,212,255,0.12)] bg-[#0a1020] shadow-[-30px_0_80px_rgba(0,0,0,0.6)] transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!isOpen}>
        {lead && (
          <DrawerContent
            lead={lead} onClose={onClose}
            notes={notesQuery.data ?? []} notesLoading={notesQuery.isLoading}
            events={eventsQuery.data ?? []} eventsLoading={eventsQuery.isLoading}
            stageDraft={stageDraft} onStageChange={handleStageChange}
            lostReasonDraft={lostReasonDraft} onLostReasonChange={handleLostReasonChange}
            stageSaving={stageMutation.isPending}
            noteText={noteText} setNoteText={setNoteText}
            onAddNote={() => noteText.trim() && noteMutation.mutate(noteText.trim())}
            noteSaving={noteMutation.isPending}
          />
        )}
      </aside>
    </>
  );
}

function DrawerContent({
  lead, onClose, notes, notesLoading, events, eventsLoading,
  stageDraft, onStageChange, lostReasonDraft, onLostReasonChange,
  stageSaving, noteText, setNoteText, onAddNote, noteSaving,
}: {
  lead: LeadRow; onClose: () => void;
  notes: LeadNote[]; notesLoading: boolean;
  events: LeadEvent[]; eventsLoading: boolean;
  stageDraft: string; onStageChange: (s: string) => void;
  lostReasonDraft: string; onLostReasonChange: (r: string) => void;
  stageSaving: boolean; noteText: string; setNoteText: (s: string) => void;
  onAddNote: () => void; noteSaving: boolean;
}) {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !user) throw new Error("Non autenticato");
      const { error } = await supabase.from("leads")
        .update({ venditore_id: user.id, pipeline_stage: "contattato" }).eq("id", lead.id);
      if (error) throw error;
      await supabase.from("lead_events").insert({
        lead_id: lead.id, stage_from: lead.pipeline_stage ?? "form_compilato", stage_to: "contattato",
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

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0a1020]/95 px-6 py-4 backdrop-blur">
        <p className="label-section">Dettaglio lead</p>
        <button onClick={onClose} aria-label="Chiudi"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-6 py-6 space-y-7">
        {/* Identità */}
        <section className="flex items-start gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold border"
            style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>
            {initials(lead.full_name, lead.email)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-foreground truncate">{lead.full_name || "(senza nome)"}</h2>
            <div className="mt-2 space-y-1.5 text-sm">
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{lead.email}</span>
                </a>
              )}
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                  <Phone className="h-3.5 w-3.5 shrink-0" /><span>{lead.phone}</span>
                </a>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" /><span>{lead.company}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: serviceColor.bg, color: serviceColor.color, borderColor: serviceColor.border }}>
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
          {role === "venditore" && !lead.venditore_id && lead.pipeline_stage === "form_compilato" ? (
            <button onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending}
              className="btn-primary w-full justify-center flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.18),rgba(0,212,255,0.08))", border: "1px solid rgba(0,212,255,0.45)", color: "#00d4ff", boxShadow: "0 0 24px rgba(0,212,255,0.2)" }}>
              {claimMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {claimMutation.isPending ? "Acquisizione…" : "Prendi in carico"}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <select value={stageDraft} onChange={e => onStageChange(e.target.value)}
                disabled={stageSaving || (role === "venditore" && lead.venditore_id !== user?.id)}
                className="glass h-11 flex-1 px-3 text-sm text-foreground outline-none disabled:opacity-50">
                {PIPELINE_STAGE_OPTIONS.map(s => (
                  <option key={s} value={s}>{PIPELINE_STAGE_LABELS[s]}</option>
                ))}
              </select>
              {stageSaving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
          )}
          {stageDraft === "chiuso_perso" && (
            <div className="mt-3">
              <p className="label-section mb-2">Motivo perdita</p>
              <select value={lostReasonDraft} onChange={e => onLostReasonChange(e.target.value)}
                disabled={stageSaving}
                className="glass h-11 w-full px-3 text-sm text-foreground outline-none">
                <option value="">Seleziona un motivo…</option>
                {LOST_REASON_OPTIONS.map(r => <option key={r} value={r}>{LOST_REASON_LABELS[r]}</option>)}
              </select>
            </div>
          )}
        </section>

        <VenditoreSection lead={lead} />
        {lead.pipeline_stage === "chiuso_vinto" && <ProjectSection lead={lead} />}
        <ProposalsSection lead={lead} role={role} userId={user?.id ?? null}
          onLeadStageChanged={() => queryClient.invalidateQueries({ queryKey: ["leads"] })} />

        {/* Risposte form */}
        <section>
          <p className="label-section mb-3">Risposte form</p>
          {(() => {
            const ANSWER_ORDER = ["process","users","ai_use_case","data_source","site_type","pages","task","tools","idea","goal"];
            const ordered = [...ANSWER_ORDER.filter(k => k in answers), ...Object.keys(answers).filter(k => !ANSWER_ORDER.includes(k))];
            const items: { label: string; value: string }[] = [];
            if (lead.service_interest) items.push({ label: "Servizio richiesto", value: SERVICE_LABELS[lead.service_interest] ?? lead.service_interest });
            for (const key of ordered) {
              const v = formatAnswerValue(answers[key]);
              if (v && v !== "—") items.push({ label: ANSWER_LABELS[key] ?? key, value: v });
            }
            if (lead.budget_range) items.push({ label: "Budget indicativo", value: lead.budget_range });
            if (lead.timeline) items.push({ label: "Tempistiche", value: lead.timeline });
            if (items.length === 0) return <p className="text-sm text-muted-foreground italic">Nessuna risposta disponibile.</p>;
            return (
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={`${it.label}-${i}`} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{it.label}</p>
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
            {(notesLoading || eventsLoading) && <li className="text-xs text-muted-foreground italic">Caricamento…</li>}
            {(() => {
              type TLItem =
                | { kind: "event"; id: string; created_at: string; ev: LeadEvent }
                | { kind: "note";  id: string; created_at: string; note: LeadNote };
              const items: TLItem[] = [
                ...events.map(ev => ({ kind: "event" as const, id: `e-${ev.id}`, created_at: ev.created_at, ev })),
                ...notes.filter(n => !n.content.startsWith("[status]"))
                  .map(n => ({ kind: "note" as const, id: `n-${n.id}`, created_at: n.created_at, note: n })),
              ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              return items.map(it => {
                if (it.kind === "event") {
                  const st = PIPELINE_STAGE_STYLES[it.ev.stage_to ?? ""] ?? PIPELINE_STAGE_STYLES.form_compilato;
                  const ic = STAGE_ICONS[it.ev.stage_to ?? ""] ?? "•";
                  return (
                    <li key={it.id} className="relative">
                      <span className="absolute -left-[31px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0a1020] text-[10px]"
                        style={{ background: st.bg, color: st.color, borderColor: st.border, boxShadow: st.glow }}>{ic}</span>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: st.color }}>
                        {PIPELINE_STAGE_LABELS[it.ev.stage_to ?? ""] ?? it.ev.stage_to}
                      </p>
                      {it.ev.stage_from && <p className="mt-0.5 text-xs text-muted-foreground">da {PIPELINE_STAGE_LABELS[it.ev.stage_from] ?? it.ev.stage_from}</p>}
                      {it.ev.lost_reason && <p className="mt-1 text-xs font-medium text-red-300">Motivo: {LOST_REASON_LABELS[it.ev.lost_reason] ?? it.ev.lost_reason}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{fullDate(it.ev.created_at)}</p>
                    </li>
                  );
                }
                return (
                  <li key={it.id} className="relative">
                    <span className="absolute -left-[27px] mt-1 flex h-3 w-3 rounded-full border-2 border-[#0a1020]" style={{ background: "#34d399" }} />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/85">Nota interna</p>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{it.note.content}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{fullDate(it.note.created_at)}</p>
                  </li>
                );
              });
            })()}
            <li className="relative">
              <span className="absolute -left-[27px] mt-1 flex h-3 w-3 rounded-full border-2 border-[#0a1020] bg-primary" />
              <p className="text-sm font-semibold text-foreground">Form compilato</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{fullDate(lead.created_at)}</p>
            </li>
          </ol>
        </section>

        {/* Aggiungi nota */}
        <section className="pb-6">
          <p className="label-section mb-2 flex items-center gap-2">
            <MessageSquarePlus className="h-3.5 w-3.5" />Aggiungi nota
          </p>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Scrivi una nota interna…" rows={3}
            className="input-premium resize-none text-sm" />
          <div className="mt-2 flex justify-end">
            <button onClick={onAddNote} disabled={!noteText.trim() || noteSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.1)] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.18)] disabled:opacity-40">
              {noteSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Salva nota
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Venditore section ────────────────────────────────────────────────────────

function VenditoreSection({ lead }: { lead: LeadRow }) {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(lead.venditore_id ?? "");

  useEffect(() => { setDraft(lead.venditore_id ?? ""); }, [lead.id, lead.venditore_id]);

  const { data: venditori = [] } = useQuery({
    queryKey: ["venditori-list"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").eq("role", "venditore").order("full_name");
      return (data ?? []) as { id: string; full_name: string | null }[];
    },
    enabled: role === "admin" && !!supabase,
    staleTime: 60_000,
  });

  const assignMutation = useMutation({
    mutationFn: async (vendId: string | null) => {
      if (!supabase) throw new Error("Supabase non configurato");
      const { error } = await supabase.from("leads").update({ venditore_id: vendId || null }).eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(draft ? "Venditore assegnato" : "Venditore rimosso");
    },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  if (role !== "admin") return null;

  if (lead.venditore) {
    return (
      <section>
        <p className="label-section mb-2 flex items-center gap-2"><UserPlus className="h-3.5 w-3.5" />Venditore assegnato</p>
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
      <p className="label-section mb-2 flex items-center gap-2"><UserPlus className="h-3.5 w-3.5" />Venditore assegnato</p>
      <div className="flex items-center gap-3">
        <select value={draft}
          onChange={e => { setDraft(e.target.value); assignMutation.mutate(e.target.value || null); }}
          disabled={assignMutation.isPending}
          className="glass h-11 flex-1 px-3 text-sm text-foreground outline-none">
          <option value="">— Nessun venditore —</option>
          {venditori.map(v => <option key={v.id} value={v.id}>{v.full_name ?? v.id}</option>)}
        </select>
        {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>
    </section>
  );
}

// ─── Project section ──────────────────────────────────────────────────────────

function ProjectSection({ lead }: { lead: LeadRow }) {
  const queryClient = useQueryClient();
  const [clientStatus, setClientStatus] = useState(lead.client_status ?? "In corso");
  const [startDate, setStartDate] = useState(toDateInputValue(lead.project_start_date));
  const [nextMeeting, setNextMeeting] = useState(toDateTimeLocalValue(lead.next_meeting));

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["leads"] }); toast.success("Progetto aggiornato"); },
    onError: (e: Error) => toast.error(`Errore: ${e.message}`),
  });

  return (
    <section>
      <p className="label-section mb-3 flex items-center gap-2">
        Progetto {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status progetto</label>
          <select value={clientStatus} onChange={e => { setClientStatus(e.target.value); updateMutation.mutate({ client_status: e.target.value }); }}
            className="glass mt-1.5 h-11 w-full px-3 text-sm text-foreground outline-none">
            {CLIENT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Data inizio progetto</label>
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); updateMutation.mutate({ project_start_date: e.target.value || null }); }}
            className="glass mt-1.5 h-11 w-full px-3 text-sm text-foreground outline-none" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prossimo meeting</label>
          <input type="datetime-local" value={nextMeeting}
            onChange={e => { setNextMeeting(e.target.value); updateMutation.mutate({ next_meeting: e.target.value ? new Date(e.target.value).toISOString() : null }); }}
            className="glass mt-1.5 h-11 w-full px-3 text-sm text-foreground outline-none" />
        </div>
      </div>
    </section>
  );
}

// ─── Proposals section ────────────────────────────────────────────────────────

function ProposalsSection({ lead, role, userId, onLeadStageChanged }: {
  lead: LeadRow; role: string | null; userId: string | null; onLeadStageChanged: () => void;
}) {
  const leadId = lead.id;
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [service, setService] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [sentAt, setSentAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingPayQuote, setPendingPayQuote] = useState<QuoteRow | null>(null);

  const load = async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("quotes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    if (error) toast.error(`Errore proposte: ${error.message}`);
    else setQuotes((data ?? []) as QuoteRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [leadId]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;
    // Intercept "Pagato" → open payment modal
    if (newStatus === "Pagato") {
      const quote = quotes.find(q => q.id === id);
      if (quote) { setPendingPayQuote(quote); return; }
    }
    setQuotes(list => list.map(q => q.id === id ? { ...q, status: newStatus } : q));
    const { error } = await supabase.from("quotes").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(`Errore: ${error.message}`); load(); return; }
    if (newStatus === "Accettata") {
      await supabase.from("leads").update({ pipeline_stage: "chiuso_vinto" }).eq("id", leadId);
      onLeadStageChanged();
    } else if (newStatus === "Rifiutata") {
      await supabase.from("leads").update({ pipeline_stage: "chiuso_perso" }).eq("id", leadId);
      onLeadStageChanged();
    }
    toast.success("Proposta aggiornata");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !service || !amount) return;
    setSaving(true);

    // Upload PDF if provided
    let pdf_url: string | null = null;
    if (pdfFile) {
      const ext = pdfFile.name.split(".").pop() ?? "pdf";
      const path = `${leadId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("preventivi").upload(path, pdfFile, { upsert: true });
      if (upErr) { toast.error(`Errore upload PDF: ${upErr.message}`); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("preventivi").getPublicUrl(path);
      pdf_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("quotes").insert({
      lead_id: leadId, venditore_id: userId ?? null,
      service, amount: parseFloat(amount), content: notes || null,
      status: "Inviata", sent_at: sentAt || null,
      pdf_url,
    });
    setSaving(false);
    if (error) { toast.error(`Errore: ${error.message}`); }
    else {
      toast.success("Preventivo creato");
      setService(""); setAmount(""); setNotes(""); setSentAt(format(new Date(), "yyyy-MM-dd")); setPdfFile(null); setShowForm(false);
      load();
    }
  };

  const statusOptions = role === "admin" ? QUOTE_STATUS_OPTIONS_ADMIN : QUOTE_STATUS_OPTIONS;

  return (
    <section>
      {pendingPayQuote && (
        <PaymentModal
          quote={pendingPayQuote}
          lead={lead}
          onCancel={() => setPendingPayQuote(null)}
          onConfirmed={() => {
            setPendingPayQuote(null);
            load();
            onLeadStageChanged();
          }}
        />
      )}
      <p className="label-section mb-3 flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Preventivi</p>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Caricamento…</div>
      ) : quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nessun preventivo ancora.</p>
      ) : (
        <div className="space-y-2">
          {quotes.map(q => {
            const tone = QUOTE_STATUS_TONE[q.status ?? "Inviata"] ?? QUOTE_STATUS_TONE.Inviata;
            const isLocked = q.status === "Pagato" && role === "venditore";
            return (
              <div key={q.id} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
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
                    {q.pdf_url && (
                      <a href={q.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium transition hover:underline"
                        style={{ color: "#7dd9ff" }}>
                        <Download className="h-3 w-3" />PDF allegato
                      </a>
                    )}
                  </div>
                  {isLocked ? (
                    <span className="rounded-lg border px-2 py-1 text-[11px] font-semibold"
                      style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>🔒 Pagato</span>
                  ) : (
                    <select value={q.status ?? "Inviata"} onChange={e => updateStatus(q.id, e.target.value)}
                      className="rounded-lg border px-2 py-1 text-[11px] font-semibold outline-none"
                      style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>
                      {statusOptions.map(s => <option key={s} value={s} style={{ background: "#0a1020", color: "#e2e8f0" }}>{s}</option>)}
                    </select>
                  )}
                </div>
                {q.content && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{q.content}</p>}
              </div>
            );
          })}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleCreate} className="mt-3 space-y-2 rounded-xl border border-[rgba(0,212,255,0.18)] bg-[rgba(0,212,255,0.04)] p-3">
          <input value={service} onChange={e => setService(e.target.value)} placeholder="Servizio"
            className="glass h-9 w-full px-3 text-sm text-foreground outline-none" required />
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Importo €"
            className="glass h-9 w-full px-3 text-sm text-foreground outline-none" required />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note" rows={2}
            className="glass w-full px-3 py-2 text-sm text-foreground outline-none resize-none" />
          <input type="date" value={sentAt} onChange={e => setSentAt(e.target.value)}
            className="glass h-9 w-full px-3 text-sm text-foreground outline-none" />
          {/* PDF upload */}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs transition"
            style={{ borderColor: pdfFile ? "rgba(0,212,255,0.5)" : "rgba(255,255,255,0.12)", background: pdfFile ? "rgba(0,212,255,0.06)" : "rgba(255,255,255,0.02)", color: pdfFile ? "#7dd9ff" : "#6677aa" }}>
            <Paperclip className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{pdfFile ? pdfFile.name : "Allega PDF preventivo (opzionale)"}</span>
            <input type="file" accept="application/pdf" className="hidden"
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Annulla</button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(0,212,255,0.4)] bg-[rgba(0,212,255,0.12)] px-3 py-1.5 text-xs font-semibold text-primary hover:bg-[rgba(0,212,255,0.2)] disabled:opacity-40">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}Salva
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] px-4 py-2 text-xs font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.1)]">
          <Plus className="h-3.5 w-3.5" />Nuovo preventivo
        </button>
      )}
    </section>
  );
}

// ─── Preventiv Detail Drawer ──────────────────────────────────────────────────

function PreventivDetailDrawer({ lead, onClose, onOpenFullDrawer }: {
  lead: LeadRow | null;
  onClose: () => void;
  onOpenFullDrawer: (id: string) => void;
}) {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (leadId: string) => {
    if (!supabase) return;
    setLoading(true);
    const { data } = await supabase.from("quotes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false });
    setQuotes((data ?? []) as QuoteRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (lead) load(lead.id);
    else setQuotes([]);
  }, [lead?.id]);

  useEffect(() => {
    if (!lead) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lead, onClose]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (!supabase || !lead) return;
    // Intercept "Pagato" → open payment modal
    if (newStatus === "Pagato") {
      const quote = quotes.find(q => q.id === id);
      if (quote) { setPendingPayQuote(quote); return; }
    }
    setQuotes(list => list.map(q => q.id === id ? { ...q, status: newStatus } : q));
    const { error } = await supabase.from("quotes").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(`Errore: ${error.message}`); load(lead.id); return; }
    if (newStatus === "Accettata") {
      await supabase.from("leads").update({ pipeline_stage: "chiuso_vinto" }).eq("id", lead.id);
    } else if (newStatus === "Rifiutata") {
      await supabase.from("leads").update({ pipeline_stage: "chiuso_perso" }).eq("id", lead.id);
    }
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-payments"] });
    toast.success("Stato aggiornato");
  };

  const [pendingPayQuote, setPendingPayQuote] = useState<QuoteRow | null>(null);

  const isOpen = !!lead;
  const statusOptions = role === "admin" ? QUOTE_STATUS_OPTIONS_ADMIN : QUOTE_STATUS_OPTIONS;
  const seed = lead ? (lead.full_name || lead.email || lead.id) : "";
  const tone = seed ? avatarTone(seed) : AVATAR_PALETTE[0];

  return (
    <>
      {pendingPayQuote && lead && (
        <PaymentModal
          quote={pendingPayQuote}
          lead={lead}
          onCancel={() => setPendingPayQuote(null)}
          onConfirmed={() => {
            setPendingPayQuote(null);
            load(lead.id);
            queryClient.invalidateQueries({ queryKey: ["leads"] });
            queryClient.invalidateQueries({ queryKey: ["pipeline-payments"] });
          }}
        />
      )}
      <div onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-full max-w-[460px] overflow-y-auto border-l border-[rgba(167,139,250,0.18)] bg-[#0a1020] shadow-[-30px_0_80px_rgba(0,0,0,0.6)] transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!isOpen}>
        {lead && (
          <div className="flex min-h-full flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0a1020]/95 px-6 py-4 backdrop-blur">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold border"
                  style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>
                  {initials(lead.full_name, lead.email)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{lead.full_name ?? "(senza nome)"}</p>
                  {lead.company && <p className="text-xs truncate" style={{ color: "#6677aa" }}>{lead.company}</p>}
                </div>
              </div>
              <button onClick={onClose} aria-label="Chiudi"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Section label + open full drawer button */}
              <div className="flex items-center justify-between">
                <p className="label-section flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />Preventivi inviati
                </p>
                <button onClick={() => onOpenFullDrawer(lead.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)] px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-[rgba(0,212,255,0.12)]">
                  <Eye className="h-3 w-3" />Vedi dettaglio lead
                </button>
              </div>

              {/* Lead email */}
              {lead.email && (
                <a href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <Mail className="h-3.5 w-3.5 shrink-0" />{lead.email}
                </a>
              )}

              {/* Quotes */}
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />Caricamento preventivi…
                </div>
              ) : quotes.length === 0 ? (
                <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-8 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#2a3a5c" }} />
                  <p className="text-sm text-muted-foreground">Nessun preventivo trovato per questo lead.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotes.map(q => {
                    const tone = QUOTE_STATUS_TONE[q.status ?? "Inviata"] ?? QUOTE_STATUS_TONE.Inviata;
                    const isLocked = q.status === "Pagato" && role === "venditore";
                    return (
                      <div key={q.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-4 space-y-3">
                        {/* Quote header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{q.service ?? "—"}</p>
                            <p className="text-xs mt-0.5" style={{ color: "#6677aa" }}>
                              {formatEuro(q.amount)}
                              {q.sent_at && ` · ${format(new Date(q.sent_at), "d MMM yyyy", { locale: it })}`}
                            </p>
                          </div>
                          {isLocked ? (
                            <span className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold shrink-0"
                              style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>🔒 Pagato</span>
                          ) : (
                            <select value={q.status ?? "Inviata"} onChange={e => updateStatus(q.id, e.target.value)}
                              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none shrink-0"
                              style={{ background: tone.bg, color: tone.color, borderColor: tone.border }}>
                              {statusOptions.map(s => (
                                <option key={s} value={s} style={{ background: "#0a1020", color: "#e2e8f0" }}>{s}</option>
                              ))}
                            </select>
                          )}
                        </div>

                        {/* Status note for accepted/paid */}
                        {(q.status === "Accettata" || q.status === "Pagato") && (
                          <p className="text-xs font-semibold" style={{ color: q.status === "Pagato" ? "#a78bfa" : "#34d399" }}>
                            {q.status === "Pagato" ? "✓ Pagamento registrato nel fatturato" : "✓ Preventivo accettato — lead spostato in Clienti"}
                          </p>
                        )}
                        {q.status === "Rifiutata" && (
                          <p className="text-xs font-semibold" style={{ color: "#f87171" }}>✗ Preventivo rifiutato — lead spostato in Perso</p>
                        )}

                        {/* Notes */}
                        {q.content && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap border-t border-[rgba(255,255,255,0.06)] pt-2">{q.content}</p>
                        )}

                        {/* PDF */}
                        {q.pdf_url && (
                          <a href={q.pdf_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline"
                            style={{ color: "#7dd9ff" }}>
                            <Download className="h-3.5 w-3.5" />Scarica PDF allegato
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer hint */}
              <p className="pb-6 text-xs text-center" style={{ color: "#2a3a5c" }}>
                Per aggiungere o modificare preventivi, apri il dettaglio completo del lead.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({ quote, lead, onCancel, onConfirmed }: {
  quote: QuoteRow;
  lead: LeadRow;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [commissionPct, setCommissionPct] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Fetch venditore's commission %
  useEffect(() => {
    if (!supabase || !lead.venditore_id) return;
    supabase.from("profiles")
      .select("percentuale_commissione")
      .eq("id", lead.venditore_id)
      .single()
      .then(({ data }) => { if (data) setCommissionPct(data.percentuale_commissione ?? 0); });
  }, [lead.venditore_id]);

  const amount = quote.amount ?? 0;
  const commissionAmount = Math.round((amount * commissionPct) / 100 * 100) / 100;
  const fmtEuro = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  const handleConfirm = async () => {
    if (!supabase) return;
    setSaving(true);
    const now = new Date().toISOString();
    const today = format(new Date(), "yyyy-MM-dd");

    // 1. Upload invoice/receipt if provided
    let invoice_url: string | null = null;
    if (file) {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${lead.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("fatture").upload(path, file, { upsert: true });
      if (upErr) { toast.error(`Errore upload: ${upErr.message}`); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from("fatture").getPublicUrl(path);
      invoice_url = urlData.publicUrl;
    }

    // 2. Mark quote as paid
    const { error: quoteErr } = await supabase.from("quotes")
      .update({ status: "Pagato", pagato_at: now }).eq("id", quote.id);
    if (quoteErr) { toast.error(`Errore preventivo: ${quoteErr.message}`); setSaving(false); return; }

    // 3. Insert payment record (insert, not upsert, to avoid partial-index conflict)
    const { error: payErr } = await supabase.from("payments").insert({
      lead_id: lead.id,
      quote_id: quote.id,
      amount,
      status: "paid",
      description: quote.service ?? "Pagamento",
      paid_at: now,
      invoice_url,
      venditore_id: lead.venditore_id ?? null,
      commission_pct: commissionPct,
      commission_amount: commissionAmount,
    });
    // 23505 = unique_violation → payment already exists, continue anyway
    if (payErr && payErr.code !== "23505") {
      toast.error(`Errore pagamento: ${payErr.message}`);
      setSaving(false);
      return;
    }

    // 4. Move lead to chiuso_vinto
    const { error: leadErr } = await supabase.from("leads")
      .update({ pipeline_stage: "chiuso_vinto" }).eq("id", lead.id);
    if (leadErr) { toast.error(`Errore lead: ${leadErr.message}`); setSaving(false); return; }

    // 5. Auto-create contabilità entry
    await supabase.from("transactions").insert({
      type: "entrata",
      category: "cliente",
      amount,
      description: `${lead.full_name ?? "—"} — ${quote.service ?? "Servizio"}`,
      date: today,
      lead_id: lead.id,
      paid_by: "agenzia",
    });

    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["pipeline-payments"] });

    toast.success("Pagamento registrato! Chiusure e Contabilità aggiornati ✓");
    setSaving(false);
    onConfirmed();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="relative w-full max-w-md rounded-3xl p-7 space-y-6"
        style={{ background: "rgba(10,16,32,0.98)", border: "1px solid rgba(167,139,250,0.3)", boxShadow: "0 0 80px rgba(167,139,250,0.15)" }}>

        {/* Close */}
        <button onClick={onCancel} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)" }}>
            <Receipt className="h-6 w-6" style={{ color: "#a78bfa" }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#a78bfa" }}>Conferma pagamento</p>
            <h2 className="text-lg font-black text-foreground">{fmtEuro(amount)}</h2>
          </div>
        </div>

        {/* Quote summary */}
        <div className="rounded-2xl px-4 py-3 space-y-1"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-sm font-semibold text-foreground">{quote.service ?? "—"}</p>
          <p className="text-xs" style={{ color: "#6677aa" }}>
            Cliente: <span className="text-foreground/80">{lead.full_name ?? "—"}</span>
            {lead.company && <> · {lead.company}</>}
          </p>
          {lead.venditore && (
            <p className="text-xs" style={{ color: "#6677aa" }}>
              Venditore: <span style={{ color: "#7dd9ff" }}>{lead.venditore.full_name ?? "—"}</span>
              {commissionPct > 0 && (
                <span className="ml-2 font-semibold" style={{ color: "#a78bfa" }}>
                  → commissione {commissionPct}% = {fmtEuro(commissionAmount)}
                </span>
              )}
            </p>
          )}
        </div>

        {/* File upload */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Allega fattura / ricevuta di pagamento
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-all"
            style={{
              borderColor: file ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.1)",
              background: file ? "rgba(167,139,250,0.06)" : "rgba(255,255,255,0.02)",
            }}>
            {file ? (
              <>
                <Receipt className="h-6 w-6" style={{ color: "#a78bfa" }} />
                <p className="text-sm font-semibold" style={{ color: "#a78bfa" }}>{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
              </>
            ) : (
              <>
                <Paperclip className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Clicca per caricare PDF, JPG o PNG</p>
                <p className="text-xs" style={{ color: "#4a5568" }}>Max 20 MB — opzionale</p>
              </>
            )}
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {file && (
            <button onClick={() => setFile(null)} className="mt-1.5 text-xs text-muted-foreground hover:text-foreground">
              Rimuovi file
            </button>
          )}
        </div>

        {/* Info box */}
        <div className="rounded-xl px-4 py-3 space-y-1 text-xs" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
          <p className="font-semibold" style={{ color: "#a78bfa" }}>Cosa succede dopo la conferma:</p>
          <ul className="space-y-0.5" style={{ color: "#6677aa" }}>
            <li>✓ Lead spostato in <span className="text-foreground/80">Chiusure</span></li>
            <li>✓ Entrata registrata in <span className="text-foreground/80">Contabilità</span></li>
            {commissionAmount > 0 && <li>✓ Commissione <span style={{ color: "#a78bfa" }}>{fmtEuro(commissionAmount)}</span> registrata per il team</li>}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={saving}
            className="flex-1 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.04)] py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-40">
            Annulla
          </button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,rgba(167,139,250,0.25),rgba(167,139,250,0.12))", border: "1px solid rgba(167,139,250,0.5)", color: "#a78bfa", boxShadow: "0 0 24px rgba(167,139,250,0.2)" }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {saving ? "Salvataggio…" : "Conferma pagamento"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
