import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  DollarSign,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";
import { getMetaAds, type MetaAdsData } from "@/server/meta-ads.functions";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/admin/ads")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Ads & Campagne" },
      { name: "description", content: "Gestione campagne pubblicitarie Falcon Agency." },
    ],
  }),
  component: AdsPage,
});

type Range = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

const ranges: { key: Range; label: string }[] = [
  { key: "today", label: "Oggi" },
  { key: "yesterday", label: "Ieri" },
  { key: "7d", label: "7 giorni" },
  { key: "30d", label: "30 giorni" },
  { key: "90d", label: "90 giorni" },
];

const fmtEur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("it-IT").format(n);
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

function rangeToISO(range: Range, since?: Date, until?: Date): { from: string; to: string } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_399_999);

  if (range === "custom" && since && until) {
    const f = new Date(since.getFullYear(), since.getMonth(), since.getDate());
    const t = new Date(until.getFullYear(), until.getMonth(), until.getDate(), 23, 59, 59, 999);
    return { from: f.toISOString(), to: t.toISOString() };
  }
  if (range === "yesterday") {
    const y = new Date(todayStart.getTime() - 86_400_000);
    return { from: y.toISOString(), to: new Date(todayStart.getTime() - 1).toISOString() };
  }
  const daysBack = range === "today" ? 0 : range === "7d" ? 6 : range === "30d" ? 29 : 89;
  return {
    from: new Date(todayStart.getTime() - daysBack * 86_400_000).toISOString(),
    to: todayEnd.toISOString(),
  };
}

type FormEvent = { step: number; session_id: string };

function AdsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [customSince, setCustomSince] = useState<Date | undefined>();
  const [customUntil, setCustomUntil] = useState<Date | undefined>();
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveSync, setLiveSync] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const isoRange = rangeToISO(range, customSince, customUntil);

  const load = async (r: Range, since?: Date, until?: Date) => {
    if (r === "custom" && (!since || !until)) return;
    setLoading(true);
    try {
      const result = await getMetaAds({
        data: {
          range: r,
          since: since ? format(since, "yyyy-MM-dd") : undefined,
          until: until ? format(until, "yyyy-MM-dd") : undefined,
        },
      });
      setData(result);
    } catch (e) {
      console.error(e);
      setData({
        totals: { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 },
        campaigns: [],
        currency: "EUR",
        error: e instanceof Error ? e.message : "Errore sconosciuto",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(range, customSince, customUntil);
  }, [range, customSince, customUntil]);

  useEffect(() => {
    if (!liveSync) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = window.setInterval(() => void load(range, customSince, customUntil), 30_000);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [liveSync, range, customSince, customUntil]);

  // Internal funnel data from Supabase
  const { data: formEvents = [] } = useQuery<FormEvent[]>({
    queryKey: ["form_events_ads", isoRange.from, isoRange.to],
    queryFn: async () => {
      if (!supabase) return [];
      const { data: rows, error } = await supabase
        .from("form_events")
        .select("step, session_id")
        .gte("created_at", isoRange.from)
        .lte("created_at", isoRange.to);
      if (error) throw error;
      return (rows ?? []) as FormEvent[];
    },
    enabled: isSupabaseConfigured,
  });

  const { data: dbLeads = [] } = useQuery<{ created_at: string }[]>({
    queryKey: ["leads_ads", isoRange.from, isoRange.to],
    queryFn: async () => {
      if (!supabase) return [];
      const { data: rows, error } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", isoRange.from)
        .lte("created_at", isoRange.to);
      if (error) throw error;
      return rows ?? [];
    },
    enabled: isSupabaseConfigured,
  });

  const sessionsByStep = (step: number) =>
    new Set(formEvents.filter((e) => e.step === step).map((e) => e.session_id)).size;

  const introSessions = sessionsByStep(0);
  const formStarted = sessionsByStep(1);
  const dbLeadCount = dbLeads.length;

  const metaSpend = data?.totals.spend ?? 0;
  const metaImpressions = data?.totals.impressions ?? 0;
  const metaClicks = data?.totals.clicks ?? 0;
  const metaLeads = data?.totals.leads ?? 0;
  const metaCPL = data?.totals.cpl ?? 0;
  const metaCTR = data?.totals.ctr ?? 0;
  const metaCPC = metaClicks > 0 ? metaSpend / metaClicks : 0;

  const funnelSteps: {
    label: string;
    sub: string;
    value: number;
    source: "Meta" | "DB";
    icon: typeof Eye;
  }[] = [
    { label: "Impressioni", sub: "visualizzazioni annuncio", value: metaImpressions, source: "Meta", icon: Eye },
    { label: "Clic annuncio", sub: "link click", value: metaClicks, source: "Meta", icon: MousePointerClick },
    { label: "Pagina intro", sub: "sessioni tracciate", value: introSessions, source: "DB", icon: Users },
    { label: "Form avviato", sub: "step 1 raggiunto", value: formStarted, source: "DB", icon: Target },
    { label: "Lead DB", sub: "form completati", value: dbLeadCount, source: "DB", icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <header>
        <Link
          to="/admin/analytics"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ad Analytics
        </Link>
        <p className="label-section mt-4">Marketing · Performance</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Ads & <span className="text-primary text-glow">Campagne</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Performance live delle tue campagne Meta — funnel completo dall'annuncio al lead.
        </p>
      </header>

      {/* Date filters */}
      <div className="flex flex-wrap items-center gap-2">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              range === r.key
                ? "border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.12)] text-primary"
                : "border-[rgba(255,255,255,0.1)] text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={() => setRange("custom")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition",
                range === "custom"
                  ? "border-[rgba(0,212,255,0.5)] bg-[rgba(0,212,255,0.12)] text-primary"
                  : "border-[rgba(255,255,255,0.1)] text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {customSince && customUntil
                ? `${format(customSince, "dd/MM")} – ${format(customUntil, "dd/MM")}`
                : "Personalizzato"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-[rgba(255,255,255,0.08)] bg-[#0c1322] p-3" align="start">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Da</p>
                <Calendar
                  mode="single"
                  selected={customSince}
                  onSelect={setCustomSince}
                  disabled={(d) => d > new Date()}
                  className="p-0 pointer-events-auto"
                />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">A</p>
                <Calendar
                  mode="single"
                  selected={customUntil}
                  onSelect={setCustomUntil}
                  disabled={(d) => d > new Date() || (customSince ? d < customSince : false)}
                  className="p-0 pointer-events-auto"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLiveSync((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition",
              liveSync
                ? "border-green-500/50 bg-green-500/10 text-green-300"
                : "border-[rgba(255,255,255,0.1)] text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className={cn("h-3.5 w-3.5", liveSync && "animate-pulse")} />
            {liveSync ? "Live · ON" : "Live Sync"}
          </button>
          <button
            onClick={() => load(range, customSince, customUntil)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Aggiorna
          </button>
        </div>
      </div>

      {data?.error && (
        <AdminCard className="border-red-500/30 bg-red-500/5 p-5 text-sm text-red-300">
          ⚠️ {data.error}
        </AdminCard>
      )}

      {/* KPI Strip — 6 metriche */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {(
          [
            { icon: DollarSign, label: "Spesa totale", value: data ? fmtEur(metaSpend) : "—", sub: "budget consumato", meta: true },
            { icon: Eye, label: "Impressioni", value: data ? fmtNum(metaImpressions) : "—", sub: "visualizzazioni annuncio", meta: true },
            { icon: MousePointerClick, label: "Clic", value: data ? fmtNum(metaClicks) : "—", sub: `CPC ${data && metaCPC > 0 ? fmtEur(metaCPC) : "—"}`, meta: true },
            { icon: Target, label: "CPL (Meta)", value: data ? fmtEur(metaCPL) : "—", sub: `CTR ${fmtPct(metaCTR)}`, meta: true },
            { icon: Users, label: "Lead Meta", value: data ? fmtNum(metaLeads) : "—", sub: "pixel tracked", meta: true },
            { icon: TrendingUp, label: "Lead DB", value: fmtNum(dbLeadCount), sub: "form completati", meta: false },
          ] as const
        ).map((k) => {
          const Icon = k.icon;
          return (
            <AdminCard key={k.label} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">{k.label}</p>
                  <p className="mt-2 text-2xl font-black text-foreground">
                    {loading && k.meta ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      k.value
                    )}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">{k.sub}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.06)] text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>

      {/* Funnel Unificato */}
      <AdminCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <AdminSectionTitle eyebrow="Funnel completo · Meta + DB" title="Dall'annuncio al lead" />
            <p className="mt-1 text-xs text-muted-foreground">
              Blu = dati Meta · Viola = dati interni Supabase. Le % mostrano la conversione rispetto allo step precedente.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> Meta
            </span>
            <span className="flex items-center gap-1.5 text-violet-400">
              <span className="h-2 w-2 rounded-full bg-violet-400" /> DB interno
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 xl:grid-cols-5">
          {funnelSteps.map((step, i) => {
            const Icon = step.icon;
            const prev = funnelSteps[i - 1];
            const pct = prev && prev.value > 0 ? Math.round((step.value / prev.value) * 100) : null;
            const pctColor =
              pct === null ? "" : pct >= 50 ? "#4ade80" : pct >= 20 ? "#f59e0b" : "#f87171";
            const isMeta = step.source === "Meta";

            return (
              <div key={step.label} className="flex xl:contents">
                <div
                  className="flex flex-1 flex-col justify-between rounded-2xl border p-4"
                  style={{
                    background: isMeta ? "rgba(96,165,250,0.05)" : "rgba(167,139,250,0.05)",
                    borderColor: isMeta ? "rgba(96,165,250,0.2)" : "rgba(167,139,250,0.2)",
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl border"
                      style={{
                        background: isMeta ? "rgba(96,165,250,0.1)" : "rgba(167,139,250,0.1)",
                        borderColor: isMeta ? "rgba(96,165,250,0.3)" : "rgba(167,139,250,0.3)",
                        color: isMeta ? "#60a5fa" : "#a78bfa",
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        color: isMeta ? "#60a5fa" : "#a78bfa",
                        borderColor: isMeta ? "rgba(96,165,250,0.3)" : "rgba(167,139,250,0.3)",
                        background: isMeta ? "rgba(96,165,250,0.08)" : "rgba(167,139,250,0.08)",
                      }}
                    >
                      {step.source}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{step.label}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/60">{step.sub}</p>
                    <p className="mt-2 text-2xl font-black text-foreground">
                      {loading && isMeta ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        fmtNum(step.value)
                      )}
                    </p>
                    {pct !== null && (
                      <p className="mt-1.5 text-xs font-bold" style={{ color: pctColor }}>
                        {pct}% dallo step prec.
                      </p>
                    )}
                  </div>
                </div>

                {i < funnelSteps.length - 1 && (
                  <div className="flex items-center justify-center px-1 text-muted-foreground/30 xl:hidden">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop arrows — rendered below the grid row */}
        <div className="mt-3 hidden xl:grid xl:grid-cols-5">
          {funnelSteps.map((_, i) => (
            <div key={i} className="flex items-center justify-end pr-1.5">
              {i < funnelSteps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/25" />
              )}
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Campagne table */}
      <section>
        <AdminSectionTitle eyebrow="Dettaglio campagne" title="Performance nel periodo" />
        <AdminCard className="mt-5 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Campagna</th>
                  <th className="px-5 py-3">Stato</th>
                  <th className="px-5 py-3 text-right">Spesa</th>
                  <th className="px-5 py-3 text-right">Impression</th>
                  <th className="px-5 py-3 text-right">Clic</th>
                  <th className="px-5 py-3 text-right">CTR</th>
                  <th className="px-5 py-3 text-right">CPC</th>
                  <th className="px-5 py-3 text-right">Lead</th>
                  <th className="px-5 py-3 text-right">CPL</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                )}
                {!loading && (!data || data.campaigns.length === 0) && (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted-foreground">
                      Nessuna campagna nel periodo selezionato.
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.campaigns.map((c) => {
                    const cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-[rgba(255,255,255,0.04)] last:border-0 transition-colors hover:bg-[rgba(0,212,255,0.02)]"
                      >
                        <td className="max-w-[200px] truncate px-5 py-3 font-medium text-foreground">{c.name}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              c.status === "ACTIVE"
                                ? "bg-green-500/15 text-green-300"
                                : "bg-white/5 text-muted-foreground"
                            }`}
                          >
                            {c.status === "ACTIVE" ? "Attiva" : c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">{fmtEur(c.spend)}</td>
                        <td className="px-5 py-3 text-right">{fmtNum(c.impressions)}</td>
                        <td className="px-5 py-3 text-right">{fmtNum(c.clicks)}</td>
                        <td className="px-5 py-3 text-right">{fmtPct(c.ctr)}</td>
                        <td className="px-5 py-3 text-right">{cpc > 0 ? fmtEur(cpc) : "—"}</td>
                        <td className="px-5 py-3 text-right font-semibold text-primary">{fmtNum(c.leads)}</td>
                        <td className="px-5 py-3 text-right">{c.cpl > 0 ? fmtEur(c.cpl) : "—"}</td>
                      </tr>
                    );
                  })}
              </tbody>
              {!loading && data && data.campaigns.length > 1 && (
                <tfoot className="border-t border-[rgba(0,212,255,0.15)] bg-[rgba(0,212,255,0.03)] text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <td className="px-5 py-3 text-muted-foreground" colSpan={2}>
                      Totale
                    </td>
                    <td className="px-5 py-3 text-right text-foreground">{fmtEur(metaSpend)}</td>
                    <td className="px-5 py-3 text-right text-foreground">{fmtNum(metaImpressions)}</td>
                    <td className="px-5 py-3 text-right text-foreground">{fmtNum(metaClicks)}</td>
                    <td className="px-5 py-3 text-right text-foreground">{fmtPct(metaCTR)}</td>
                    <td className="px-5 py-3 text-right text-foreground">
                      {metaCPC > 0 ? fmtEur(metaCPC) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{fmtNum(metaLeads)}</td>
                    <td className="px-5 py-3 text-right text-foreground">
                      {metaCPL > 0 ? fmtEur(metaCPL) : "—"}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </AdminCard>
      </section>
    </div>
  );
}
