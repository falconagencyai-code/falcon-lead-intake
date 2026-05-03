import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { AdminCard } from "./admin/-admin-ui";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  Mail,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({ meta: [{ title: "Falcon Admin — Pipeline" }] }),
  component: PipelinePage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  full_name: string | null;
  company: string | null;
  email: string | null;
  pipeline_stage: string | null;
  created_at: string;
  venditore_id: string | null;
  venditore: { full_name: string | null } | null;
}

interface Quote {
  id: string;
  lead_id: string;
  service: string | null;
  amount: number | null;
  status: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  lead_id: string;
  amount: number | null;
  paid_at: string | null;
  description: string | null;
  lead: {
    full_name: string | null;
    company: string | null;
    venditore: { full_name: string | null } | null;
  } | null;
}

type Tab = "lead" | "preventivi" | "clienti" | "chiusure";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_STAGES = ["form_compilato", "contattato", "call_schedulata", "call_effettuata", "no_show"];

const STAGE_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  form_compilato:  { label: "Nuovo",          color: "#00d4ff", bg: "rgba(0,212,255,0.08)",   border: "rgba(0,212,255,0.25)" },
  contattato:      { label: "Contattato",      color: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)" },
  call_schedulata: { label: "Call schedulata", color: "#a78bfa", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)" },
  call_effettuata: { label: "Call effettuata", color: "#818cf8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.25)" },
  no_show:         { label: "No show",         color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)" },
};

const QUOTE_STATUS_INFO: Record<string, { label: string; color: string; bg: string; border: string }> = {
  "In attesa": { label: "In attesa", color: "#facc15", bg: "rgba(250,204,21,0.08)",  border: "rgba(250,204,21,0.25)" },
  "Accettata": { label: "Accettata", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)" },
  "Rifiutata": { label: "Rifiutata", color: "#f87171", bg: "rgba(248,113,113,0.08)",border: "rgba(248,113,113,0.25)" },
  "Pagato":    { label: "Pagato",    color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000);
  if (d >= 1) return `${d}g fa`;
  if (h >= 1) return `${h}h fa`;
  return "adesso";
}

function fmtEur(n: number | null) {
  if (!n) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function VenditoreChip({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: "rgba(0,212,255,0.07)", color: "#7dd9ff", border: "1px solid rgba(0,212,255,0.15)" }}>
      {name}
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_INFO[stage] ?? STAGE_INFO.form_compilato;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function QuoteStatusBadge({ status }: { status: string }) {
  const s = QUOTE_STATUS_INFO[status] ?? QUOTE_STATUS_INFO["In attesa"];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {status === "Pagato" && <CheckCircle2 className="w-3 h-3" />}
      {status === "Rifiutata" && <XCircle className="w-3 h-3" />}
      {s.label}
    </span>
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
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("lead");
  const [loading, setLoading] = useState(true);

  const [activeLeads, setActiveLeads] = useState<Lead[]>([]);
  const [preventiviLeads, setPreventiviLeads] = useState<Lead[]>([]);
  const [preventiviQuotes, setPreventiviQuotes] = useState<Quote[]>([]);
  const [clientiLeads, setClientiLeads] = useState<Lead[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const sel = "id, full_name, company, email, pipeline_stage, created_at, venditore_id, venditore:profiles!venditore_id(full_name)";
      let q = supabase.from("leads").select(sel).order("created_at", { ascending: false });
      if (role === "venditore" && user?.id) q = q.eq("venditore_id", user.id);

      const { data: leadsData } = await q;
      const all = (leadsData ?? []) as unknown as Lead[];

      const active    = all.filter(l => ACTIVE_STAGES.includes(l.pipeline_stage ?? ""));
      const preventivi = all.filter(l => l.pipeline_stage === "preventivo_inviato");
      const clienti   = all.filter(l => l.pipeline_stage === "chiuso_vinto");
      const allIds    = all.map(l => l.id);
      const prevIds   = preventivi.map(l => l.id);

      const [quotesRes, paymentsRes] = await Promise.all([
        prevIds.length > 0
          ? supabase.from("quotes")
              .select("id, lead_id, service, amount, status, created_at")
              .in("lead_id", prevIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as Quote[] }),
        allIds.length > 0
          ? supabase.from("payments")
              .select("id, lead_id, amount, paid_at, description, lead:leads!lead_id(full_name, company, venditore:profiles!venditore_id(full_name))")
              .eq("status", "paid")
              .in("lead_id", allIds)
              .order("paid_at", { ascending: false })
          : Promise.resolve({ data: [] as Payment[] }),
      ]);

      setActiveLeads(active);
      setPreventiviLeads(preventivi);
      setPreventiviQuotes((quotesRes.data ?? []) as Quote[]);
      setClientiLeads(clienti);
      setPayments((paymentsRes.data ?? []) as Payment[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [role, user?.id]);

  useEffect(() => {
    if (!supabase) return;
    const ch = supabase.channel("pipeline-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .subscribe();
    return () => { supabase!.removeChannel(ch); };
  }, []);

  const totaleChiusure = payments.reduce((s, p) => s + (p.amount ?? 0), 0);

  const tabs: {
    key: Tab;
    label: string;
    count: number | string;
    icon: typeof Users;
    color: string;
  }[] = [
    { key: "lead",       label: "Lead",       count: activeLeads.length,     icon: Users,     color: "#00d4ff" },
    { key: "preventivi", label: "Preventivi", count: preventiviLeads.length, icon: FileText,  color: "#a78bfa" },
    { key: "clienti",    label: "Clienti",    count: clientiLeads.length,    icon: UserCheck, color: "#4ade80" },
    { key: "chiusure",   label: "Chiusure",   count: fmtEur(totaleChiusure), icon: TrendingUp,color: "#34d399" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="label-section">Commerciale</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">
          Pipeline <span className="text-primary text-glow">Commerciale</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lead · Preventivi · Clienti · Chiusure
        </p>
      </header>

      {/* Tab navigation */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {tabs.map((t, i) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="relative flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all"
              style={{
                background: active ? `color-mix(in srgb, ${t.color} 10%, transparent)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? `color-mix(in srgb, ${t.color} 40%, transparent)` : "rgba(255,255,255,0.08)"}`,
                boxShadow: active ? `0 0 32px color-mix(in srgb, ${t.color} 15%, transparent)` : "none",
              }}
            >
              {/* Step number */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: active ? t.color : "#4a5568" }}>
                  0{i + 1}
                </span>
                {/* Arrow to next (except last) */}
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

              {/* Active indicator bar */}
              {active && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: t.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <>
          {activeTab === "lead"       && <LeadTab       leads={activeLeads}                     role={role} />}
          {activeTab === "preventivi" && <PreventiviTab leads={preventiviLeads} quotes={preventiviQuotes} role={role} />}
          {activeTab === "clienti"    && <ClientiTab    leads={clientiLeads}                    role={role} />}
          {activeTab === "chiusure"   && <ChiusureTab   payments={payments} totale={totaleChiusure} role={role} />}
        </>
      )}
    </div>
  );
}

// ─── Tab: Lead ────────────────────────────────────────────────────────────────

function LeadTab({ leads, role }: { leads: Lead[]; role: string | null }) {
  return (
    <div className="space-y-5">
      {/* Stage breakdown strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(STAGE_INFO).map(([key, info]) => {
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
        <div className="space-y-3">
          {leads.map(l => <LeadCard key={l.id} lead={l} showVenditore={role === "admin"} />)}
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead: l, showVenditore }: { lead: Lead; showVenditore: boolean }) {
  const stage = STAGE_INFO[l.pipeline_stage ?? "form_compilato"] ?? STAGE_INFO.form_compilato;
  return (
    <AdminCard className="p-4">
      <div className="flex items-center gap-4">
        <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: stage.color }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground">{l.full_name ?? "—"}</p>
            <StageBadge stage={l.pipeline_stage ?? "form_compilato"} />
            {showVenditore && <VenditoreChip name={l.venditore?.full_name ?? null} />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: "#6677aa" }}>
            {l.company && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />{l.company}
              </span>
            )}
            {l.email && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <Mail className="w-3.5 h-3.5" />{l.email}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: "#4a5568" }}>
          <Clock className="w-3.5 h-3.5" />{timeAgo(l.created_at)}
        </div>
      </div>
    </AdminCard>
  );
}

// ─── Tab: Preventivi ──────────────────────────────────────────────────────────

function PreventiviTab({ leads, quotes, role }: { leads: Lead[]; quotes: Quote[]; role: string | null }) {
  const quoteMap = new Map<string, Quote[]>();
  for (const q of quotes) {
    const arr = quoteMap.get(q.lead_id) ?? [];
    arr.push(q);
    quoteMap.set(q.lead_id, arr);
  }

  const inAttesa  = quotes.filter(q => q.status === "In attesa").length;
  const accettati = quotes.filter(q => q.status === "Accettata").length;
  const rifiutati = quotes.filter(q => q.status === "Rifiutata").length;

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
        <div className="space-y-3">
          {leads.map(l => (
            <PreventivoCard key={l.id} lead={l} quotes={quoteMap.get(l.id) ?? []} showVenditore={role === "admin"} />
          ))}
        </div>
      )}
    </div>
  );
}

function PreventivoCard({ lead: l, quotes, showVenditore }: { lead: Lead; quotes: Quote[]; showVenditore: boolean }) {
  return (
    <AdminCard className="p-4">
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
            ) : (
              quotes.map(q => (
                <div key={q.id} className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <QuoteStatusBadge status={q.status ?? "In attesa"} />
                  <span className="text-sm text-foreground flex-1 truncate">{q.service ?? "—"}</span>
                  <span className="text-sm font-bold" style={{ color: "#00d4ff" }}>{fmtEur(q.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs shrink-0 mt-0.5" style={{ color: "#4a5568" }}>
          <Clock className="w-3.5 h-3.5" />{timeAgo(l.created_at)}
        </div>
      </div>
    </AdminCard>
  );
}

// ─── Tab: Clienti ─────────────────────────────────────────────────────────────

function ClientiTab({ leads, role }: { leads: Lead[]; role: string | null }) {
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
        <div className="space-y-3">
          {leads.map(l => <ClienteCard key={l.id} lead={l} showVenditore={role === "admin"} />)}
        </div>
      )}
    </div>
  );
}

function ClienteCard({ lead: l, showVenditore }: { lead: Lead; showVenditore: boolean }) {
  return (
    <AdminCard className="p-4">
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
          <CalendarDays className="w-3.5 h-3.5" />{timeAgo(l.created_at)}
        </div>
      </div>
    </AdminCard>
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
            <p className="mt-1.5 text-3xl font-black text-foreground text-glow">{fmtEur(totale)}</p>
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
          <p className="text-sm mt-0.5" style={{ color: "#6677aa" }}>
            {p.description ?? p.lead?.company ?? "—"}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-lg font-black" style={{ color: "#34d399" }}>{fmtEur(p.amount)}</p>
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
