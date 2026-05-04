import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  DollarSign,
  Loader2,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";
import { getMetaAds, type MetaAdsData } from "@/server/meta-ads.functions";

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
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("it-IT").format(n);
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

function AdsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [customSince, setCustomSince] = useState<Date | undefined>();
  const [customUntil, setCustomUntil] = useState<Date | undefined>();
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveSync, setLiveSync] = useState(false);
  const intervalRef = useRef<number | null>(null);

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

  // Live sync: refetch every 30s when active
  useEffect(() => {
    if (!liveSync) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      void load(range, customSince, customUntil);
    }, 30_000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [liveSync, range, customSince, customUntil]);

  const kpis = [
    { icon: DollarSign, title: "Spesa totale", value: data ? fmtEur(data.totals.spend) : "—" },
    { icon: Target, title: "CPL medio", value: data ? fmtEur(data.totals.cpl) : "—" },
    { icon: Users, title: "Lead generati", value: data ? fmtNum(data.totals.leads) : "—" },
    { icon: TrendingUp, title: "CTR medio", value: data ? fmtPct(data.totals.ctr) : "—" },
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
          Performance live delle tue campagne Meta (Facebook & Instagram).
        </p>
      </header>

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
                  className={cn("p-0 pointer-events-auto")}
                />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">A</p>
                <Calendar
                  mode="single"
                  selected={customUntil}
                  onSelect={setCustomUntil}
                  disabled={(d) => d > new Date() || (customSince ? d < customSince : false)}
                  className={cn("p-0 pointer-events-auto")}
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
            title="Aggiornamento automatico ogni 30 secondi"
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <AdminCard key={k.title} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{k.title}</p>
                  <p className="mt-3 text-3xl font-black text-foreground">
                    {loading ? <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /> : k.value}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.06)] text-primary">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </AdminCard>
          );
        })}
      </div>

      <section>
        <AdminSectionTitle eyebrow="Dettaglio" title="Campagne attive" />
        <AdminCard className="mt-5 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[rgba(255,255,255,0.06)] text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Campagna</th>
                  <th className="px-5 py-3">Stato</th>
                  <th className="px-5 py-3 text-right">Spesa</th>
                  <th className="px-5 py-3 text-right">Impression</th>
                  <th className="px-5 py-3 text-right">Click</th>
                  <th className="px-5 py-3 text-right">CTR</th>
                  <th className="px-5 py-3 text-right">Lead</th>
                  <th className="px-5 py-3 text-right">CPL</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                )}
                {!loading && data?.campaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                      Nessuna campagna nel periodo selezionato.
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <td className="px-5 py-3 font-medium text-foreground">{c.name}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            c.status === "ACTIVE"
                              ? "bg-green-500/15 text-green-300"
                              : "bg-white/5 text-muted-foreground"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">{fmtEur(c.spend)}</td>
                      <td className="px-5 py-3 text-right">{fmtNum(c.impressions)}</td>
                      <td className="px-5 py-3 text-right">{fmtNum(c.clicks)}</td>
                      <td className="px-5 py-3 text-right">{fmtPct(c.ctr)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary">{fmtNum(c.leads)}</td>
                      <td className="px-5 py-3 text-right">{c.cpl > 0 ? fmtEur(c.cpl) : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </section>
    </div>
  );
}
