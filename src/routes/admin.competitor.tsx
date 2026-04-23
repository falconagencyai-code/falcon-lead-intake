import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AdminCard, AdminKpi, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/competitor")({
  head: () => ({
    meta: [
      { title: "Competitor — Falcon Admin" },
      { name: "description", content: "Radar di monitoraggio competitor agenzie AI & digital." },
    ],
  }),
  component: CompetitorPage,
});

type Platform = "IG" | "TT";

interface Competitor {
  id: string;
  name: string;
  initials: string;
  color: string;
  platforms: Platform[];
  followers: number;
  engagement: number;
  postsPerWeek: number;
  services: string[];
  lastContentDays: number;
}

const competitors: Competitor[] = [
  { id: "1", name: "DigitalMind Agency", initials: "DM", color: "#8b5cf6", platforms: ["IG", "TT"], followers: 28400, engagement: 4.2, postsPerWeek: 5.1, services: ["Piattaforme AI", "Automazioni"], lastContentDays: 1 },
  { id: "2", name: "CodeFlow Studio", initials: "CF", color: "#00d4ff", platforms: ["IG"], followers: 15200, engagement: 3.1, postsPerWeek: 3.4, services: ["Siti Web", "E-commerce"], lastContentDays: 4 },
  { id: "3", name: "AI Builders Italia", initials: "AI", color: "#22c55e", platforms: ["TT"], followers: 41800, engagement: 6.7, postsPerWeek: 7.2, services: ["AI Agent", "Automazioni"], lastContentDays: 0 },
  { id: "4", name: "NexGen Digital", initials: "NG", color: "#f59e0b", platforms: ["IG", "TT"], followers: 9700, engagement: 2.9, postsPerWeek: 2.1, services: ["Full Service"], lastContentDays: 9 },
  { id: "5", name: "Automata Agency", initials: "AA", color: "#ef4444", platforms: ["TT"], followers: 33100, engagement: 5.4, postsPerWeek: 4.8, services: ["Automazioni", "AI Agent"], lastContentDays: 2 },
  { id: "6", name: "WebCraft Pro", initials: "WP", color: "#06b6d4", platforms: ["IG"], followers: 22600, engagement: 3.8, postsPerWeek: 3.9, services: ["Siti Web", "Piattaforme AI"], lastContentDays: 5 },
  { id: "7", name: "FutureStack", initials: "FS", color: "#a855f7", platforms: ["IG", "TT"], followers: 18300, engagement: 4.1, postsPerWeek: 4.4, services: ["Full Service"], lastContentDays: 3 },
  { id: "8", name: "Pixel & Prompt", initials: "PP", color: "#ec4899", platforms: ["IG"], followers: 7400, engagement: 5.9, postsPerWeek: 2.7, services: ["Piattaforme AI"], lastContentDays: 6 },
  { id: "9", name: "DataDriven Agency", initials: "DD", color: "#14b8a6", platforms: ["TT"], followers: 52000, engagement: 7.2, postsPerWeek: 6.8, services: ["Automazioni", "AI Agent"], lastContentDays: 1 },
  { id: "10", name: "Loom Digital", initials: "LD", color: "#f97316", platforms: ["IG", "TT"], followers: 11900, engagement: 3.3, postsPerWeek: 2.9, services: ["Siti Web", "E-commerce"], lastContentDays: 16 },
];

const platformTone: Record<Platform, { label: string; bg: string; color: string }> = {
  IG: { label: "IG", bg: "rgba(139,92,246,0.2)", color: "#a78bfa" },
  TT: { label: "TT", bg: "rgba(239,68,68,0.15)", color: "#f87171" },
};

const engagementSeries = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 3 + Math.sin(i / 3) * 1.2 + (i / 30) * 1.5 + Math.random() * 0.4,
}));

const recentContent = [
  { type: "Reel", likes: "12.4K", comments: 320, views: "180K", date: "1g fa" },
  { type: "Post", likes: "4.8K", comments: 95, views: "—", date: "3g fa" },
  { type: "Video", likes: "22.1K", comments: 540, views: "320K", date: "5g fa" },
];

const alerts = [
  { tone: "red", emoji: "🔴", title: "AI Builders Italia ha pubblicato 3 contenuti in 24h", sub: "Picco attività rilevato", time: "2h fa" },
  { tone: "yellow", emoji: "🟡", title: "DataDriven Agency ha guadagnato +800 follower in 7 giorni", sub: "Crescita sopra media", time: "ieri" },
  { tone: "green", emoji: "🟢", title: "Automata Agency ha iniziato a usare hashtag #agenziaAI", sub: "Nuovo posizionamento", time: "3 giorni fa" },
];

function lastContentTone(days: number) {
  if (days < 3) return { color: "#34d399", label: `Ultimo contenuto: ${days === 0 ? "oggi" : `${days}g fa`}` };
  if (days <= 7) return { color: "#facc15", label: `Ultimo contenuto: ${days}g fa` };
  if (days <= 14) return { color: "#facc15", label: `Ultimo contenuto: ${days}g fa` };
  return { color: "#f87171", label: `Ultimo contenuto: ${days}g fa` };
}

function CompetitorPage() {
  const [search, setSearch] = useState("");
  const [platformTab, setPlatformTab] = useState<"all" | "IG" | "TT" | "both">("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"followers" | "engagement" | "recent">("followers");
  const [openDetail, setOpenDetail] = useState<Competitor | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Platform>("IG");

  const filtered = useMemo(() => {
    let list = competitors.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (platformTab === "IG") list = list.filter((c) => c.platforms.includes("IG"));
    if (platformTab === "TT") list = list.filter((c) => c.platforms.includes("TT"));
    if (platformTab === "both") list = list.filter((c) => c.platforms.length === 2);
    if (serviceFilter !== "all") list = list.filter((c) => c.services.includes(serviceFilter));
    if (sortBy === "followers") list = [...list].sort((a, b) => b.followers - a.followers);
    if (sortBy === "engagement") list = [...list].sort((a, b) => b.engagement - a.engagement);
    if (sortBy === "recent") list = [...list].sort((a, b) => a.lastContentDays - b.lastContentDays);
    return list;
  }, [search, platformTab, serviceFilter, sortBy]);

  const openDrawer = (c: Competitor) => {
    setActiveTab(c.platforms[0]);
    setOpenDetail(c);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-section">Intelligence</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Radar <span className="text-primary text-glow">Competitor</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Monitoraggio automatico agenzie AI & digital.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[rgba(34,197,94,0.32)] bg-[rgba(34,197,94,0.08)] px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live
          </div>
          <span className="text-xs text-muted-foreground">Ultimo aggiornamento: oggi alle 09:14</span>
          <button className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Aggiorna ora
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpi icon={Eye} title="Competitor monitorati" value="12" meta="su Instagram & TikTok" tone="cyan" />
        <AdminKpi icon={FileText} title="Nuovi contenuti (7gg)" value="47" meta="aggregato piattaforme" tone="cyan" />
        <AdminKpi icon={TrendingUp} title="Engagement medio" value="3.8%" meta="benchmark settore" tone="green" />
        <AdminKpi icon={Bell} title="Alert attivi" value="3" meta="da rivedere" tone="orange" />
      </section>

      <AdminCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca agenzia..."
              className="w-full rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.04)] py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.03)] p-1">
            {(["all", "IG", "TT", "both"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPlatformTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  platformTab === tab ? "bg-[rgba(0,212,255,0.12)] text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "all" ? "Tutti" : tab === "IG" ? "Instagram" : tab === "TT" ? "TikTok" : "Entrambi"}
              </button>
            ))}
          </div>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="all">Tutti i servizi</option>
            <option value="Siti Web">Siti Web</option>
            <option value="Piattaforme AI">Piattaforme AI</option>
            <option value="Automazioni">Automazioni</option>
            <option value="Full Service">Full Service</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "followers" | "engagement" | "recent")}
            className="rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="followers">Ordina: Follower</option>
            <option value="engagement">Ordina: Engagement</option>
            <option value="recent">Ordina: Attività recente</option>
          </select>
          <button
            onClick={() => setOpenModal(true)}
            className="btn-primary ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> Aggiungi competitor
          </button>
        </div>
      </AdminCard>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const tone = lastContentTone(c.lastContentDays);
          return (
            <AdminCard
              key={c.id}
              className="group flex flex-col p-5 transition-all hover:-translate-y-1 hover:border-[rgba(0,212,255,0.4)] hover:shadow-[0_0_32px_rgba(0,212,255,0.15)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}99)`, boxShadow: `0 0 18px ${c.color}55` }}
                  >
                    {c.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.name}</p>
                    <div className="mt-1 flex gap-1.5">
                      {c.platforms.map((p) => (
                        <span
                          key={p}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ background: platformTone[p].bg, color: platformTone[p].color }}
                        >
                          {platformTone[p].label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="rounded-md p-1 text-muted-foreground hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-3">
                <Metric label="Follower" value={c.followers >= 1000 ? `${(c.followers / 1000).toFixed(1)}K` : `${c.followers}`} />
                <Metric label="Engagement" value={`${c.engagement}%`} />
                <Metric label="Post/sett." value={c.postsPerWeek.toFixed(1)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.services.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-[rgba(0,212,255,0.18)] bg-[rgba(0,212,255,0.06)] px-2.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-3">
                <span className="text-xs font-medium" style={{ color: tone.color }}>
                  {tone.label}
                </span>
                <button
                  onClick={() => openDrawer(c)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Vedi dettaglio →
                </button>
              </div>
            </AdminCard>
          );
        })}
      </section>

      <AdminCard className="p-5">
        <AdminSectionTitle eyebrow="Notifiche" title="Alert attivi" />
        <div className="mt-5 flex flex-col gap-3">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">{a.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.sub} • {a.time}</p>
                </div>
              </div>
              <button className="rounded-md p-1 text-muted-foreground hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      {openDetail && (
        <DetailDrawer
          competitor={openDetail}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setOpenDetail(null)}
        />
      )}

      {openModal && <AddModal onClose={() => setOpenModal(false)} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailDrawer({
  competitor,
  activeTab,
  setActiveTab,
  onClose,
}: {
  competitor: Competitor;
  activeTab: Platform;
  setActiveTab: (p: Platform) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-[rgba(0,212,255,0.4)] bg-[rgba(7,11,20,0.97)] p-6 shadow-[-24px_0_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${competitor.color}, ${competitor.color}99)` }}
            >
              {competitor.initials}
            </div>
            <div>
              <p className="text-base font-bold text-foreground">{competitor.name}</p>
              <div className="mt-1 flex gap-1.5">
                {competitor.platforms.map((p) => (
                  <span key={p} className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: platformTone[p].bg, color: platformTone[p].color }}>
                    {platformTone[p].label}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {competitor.platforms.length > 1 && (
          <div className="mt-5 flex rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.03)] p-1">
            {competitor.platforms.map((p) => (
              <button
                key={p}
                onClick={() => setActiveTab(p)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  activeTab === p ? "bg-[rgba(0,212,255,0.12)] text-primary" : "text-muted-foreground"
                }`}
              >
                {p === "IG" ? "Instagram" : "TikTok"}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
          <Metric label="Follower" value={`${(competitor.followers / 1000).toFixed(1)}K`} />
          <Metric label="Following" value="412" />
          <Metric label="Post" value="1.2K" />
          <Metric label="Eng. rate" value={`${competitor.engagement}%`} />
          <Metric label="Crescita 30g" value="+3.4%" />
          <Metric label="Frequenza" value={`${competitor.postsPerWeek}/sett`} />
        </div>

        <div className="mt-6">
          <p className="label-section">Engagement ultimi 30gg</p>
          <div className="mt-3 h-44 rounded-2xl border border-[rgba(0,212,255,0.12)] bg-[rgba(255,255,255,0.02)] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={engagementSeries}>
                <CartesianGrid stroke="rgba(0,212,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis stroke="var(--falcon-subtle)" tickLine={false} axisLine={false} fontSize={10} />
                <Tooltip contentStyle={{ background: "#070b14", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="value" stroke="var(--falcon-cyan)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6">
          <p className="label-section">Ultimi contenuti</p>
          <div className="mt-3 flex flex-col gap-2">
            {recentContent.map((rc, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,255,255,0.05)]">
                  <Play className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{rc.type}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {rc.likes}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {rc.comments}</span>
                    {rc.views !== "—" && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {rc.views}</span>}
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground">{rc.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="label-section">Temi rilevati</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["#AI", "#automazione", "#webdesign", "#tutorial", "#agenziaAI"].map((t) => (
              <span key={t} className="rounded-full border border-[rgba(0,212,255,0.18)] bg-[rgba(0,212,255,0.06)] px-2.5 py-1 text-[11px] text-primary">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Media {competitor.postsPerWeek} post/settimana</p>
        </div>
      </aside>
    </div>
  );
}

function AddModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-[rgba(0,212,255,0.3)] bg-[rgba(7,11,20,0.98)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="label-section">Setup</p>
            <h3 className="mt-2 text-lg font-bold text-foreground">Aggiungi competitor</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username Instagram</label>
            <input
              placeholder="@nomeagenzia"
              className="mt-1.5 w-full rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username TikTok</label>
            <input
              placeholder="@nomeagenzia"
              className="mt-1.5 w-full rounded-xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Servizi offerti</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Siti Web", "Piattaforme AI", "Automazioni", "AI Agent", "E-commerce", "Full Service"].map((s) => (
                <label
                  key={s}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[rgba(0,212,255,0.18)] bg-[rgba(0,212,255,0.04)] px-3 py-1 text-xs text-foreground hover:bg-[rgba(0,212,255,0.1)]"
                >
                  <input type="checkbox" className="h-3 w-3 accent-[var(--falcon-cyan)]" />
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button className="btn-primary mt-6 w-full rounded-xl py-3 text-sm font-semibold">
          Inizia monitoraggio
        </button>
      </div>
    </div>
  );
}
