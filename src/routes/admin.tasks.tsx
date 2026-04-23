import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  DollarSign,
  GripVertical,
  Megaphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminCard } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/tasks")({
  head: () => ({
    meta: [
      { title: "Task — Falcon Admin" },
      { name: "description", content: "Task board interno Falcon Agency: Ads, gestionale e clienti." },
    ],
  }),
  component: TasksPage,
});

type Priority = "Alta" | "Media" | "Bassa";
type ColumnKey = "ads" | "gestionale" | "clienti";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  due?: string;
  dueOverdue?: boolean;
  recurring?: boolean;
  done: boolean;
  completedAt?: string;
}

interface Column {
  key: ColumnKey;
  title: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
  bg: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    key: "ads",
    title: "Ads",
    icon: Megaphone,
    accent: "#8b5cf6",
    glow: "rgba(139,92,246,0.35)",
    bg: "rgba(139,92,246,0.12)",
    tasks: [
      { id: "a1", title: "Creare campagna Meta per cliente Rossi Srl", priority: "Alta", done: false },
      { id: "a2", title: "Ottimizzare ROAS campagna Google Ads", priority: "Media", done: false },
      { id: "a3", title: "Preparare report mensile ads per 3 clienti", priority: "Alta", done: false },
      { id: "a4", title: "Testare nuovi copy per adset freddo", priority: "Bassa", done: false },
      { id: "a5", title: "Rinnovare budget campagna TikTok", priority: "Media", done: false },
      { id: "a6", title: "Impostare pixel Facebook cliente Bianchi", priority: "Media", done: true, completedAt: "18 apr" },
      { id: "a7", title: "Analisi competitor settore moda", priority: "Bassa", done: true, completedAt: "16 apr" },
    ],
  },
  {
    key: "gestionale",
    title: "Gestionale Agenzia",
    icon: Building2,
    accent: "#00d4ff",
    glow: "rgba(0,212,255,0.35)",
    bg: "rgba(0,212,255,0.12)",
    tasks: [
      { id: "g1", title: "Fatturare cliente Mario Verdi", priority: "Alta", due: "30 apr", done: false },
      { id: "g2", title: "Rinnovare abbonamento Figma", priority: "Bassa", done: false },
      { id: "g3", title: "Aggiornare contratto collaboratore Dev", priority: "Media", done: false },
      { id: "g4", title: "Riunione team settimanale", priority: "Media", recurring: true, done: false },
      { id: "g5", title: "Aggiornare listino prezzi 2026", priority: "Bassa", done: false },
      { id: "g6", title: "Pagare fattura commercialista", priority: "Alta", due: "25 apr", dueOverdue: true, done: false },
      { id: "g7", title: "Onboarding nuovo collaboratore", priority: "Media", done: true, completedAt: "19 apr" },
      { id: "g8", title: "Setup Notion workspace", priority: "Bassa", done: true, completedAt: "15 apr" },
      { id: "g9", title: "Rinnovo dominio falconagency.ai", priority: "Alta", done: true, completedAt: "12 apr" },
    ],
  },
  {
    key: "clienti",
    title: "Clienti",
    icon: Users,
    accent: "#22c55e",
    glow: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.12)",
    tasks: [
      { id: "c1", title: "Call di allineamento con cliente Tech SpA", priority: "Alta", due: "24 apr", done: false },
      { id: "c2", title: "Consegnare mockup sito web Rossi", priority: "Alta", due: "26 apr", done: false },
      { id: "c3", title: "Inviare proposta automazione a lead Bianchi Srl", priority: "Media", done: false },
      { id: "c4", title: "Follow-up lead non risposto (3 giorni)", priority: "Media", done: false },
      { id: "c5", title: "Revisione feedback piattaforma AI cliente Verdi", priority: "Bassa", done: false },
      { id: "c6", title: "Preparare presentazione onboarding nuovo cliente", priority: "Media", done: false },
      { id: "c7", title: "Consegnato sito web cliente Esposito", priority: "Alta", done: true, completedAt: "20 apr" },
      { id: "c8", title: "Demo piattaforma AI — cliente Ferrari", priority: "Media", done: true, completedAt: "17 apr" },
    ],
  },
];

const priorityTone: Record<Priority, { color: string; bg: string; border: string; dot: string }> = {
  Alta: { color: "#f87171", bg: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.35)", dot: "🔴" },
  Media: { color: "#facc15", bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.32)", dot: "🟡" },
  Bassa: { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.32)", dot: "🟢" },
};

type TabKey = "all" | "ads" | "gestionale" | "clienti";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tutte le task" },
  { key: "ads", label: "Ads" },
  { key: "gestionale", label: "Gestionale" },
  { key: "clienti", label: "Clienti" },
];

function TasksPage() {
  const [columns, setColumns] = useState(initialColumns);
  const [tab, setTab] = useState<TabKey>("all");
  const [showCompleted, setShowCompleted] = useState<Record<ColumnKey, boolean>>({
    ads: false,
    gestionale: false,
    clienti: false,
  });

  const toggleTask = (colKey: ColumnKey, taskId: string) => {
    setColumns((cols) =>
      cols.map((col) =>
        col.key !== colKey
          ? col
          : {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, done: !t.done, completedAt: !t.done ? "oggi" : undefined }
                  : t,
              ),
            },
      ),
    );
  };

  const totals = useMemo(() => {
    const open = columns.reduce((sum, c) => sum + c.tasks.filter((t) => !t.done).length, 0);
    return { open, dueToday: 2, completedWeek: 7 };
  }, [columns]);

  const visibleColumns =
    tab === "all" ? columns : tab === "ads" ? [] : columns.filter((c) => c.key === tab);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-section">Workspace</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Task <span className="text-primary text-glow">Board</span>
          </h1>
        </div>
        <button className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Nuova task
        </button>
      </header>

      <div className="flex flex-wrap rounded-2xl border border-[rgba(0,212,255,0.15)] bg-[rgba(255,255,255,0.03)] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.key
                ? t.key === "ads"
                  ? "bg-[rgba(139,92,246,0.15)] text-[#a78bfa] shadow-[inset_0_0_18px_rgba(139,92,246,0.18)]"
                  : "bg-[rgba(0,212,255,0.12)] text-primary shadow-[inset_0_0_18px_rgba(0,212,255,0.12)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "ads" && (
        <section className="grid gap-4 md:grid-cols-3">
          <MiniStat label="Task aperte totali" value={totals.open.toString()} tone="cyan" />
          <MiniStat label="In scadenza oggi" value={totals.dueToday.toString()} tone="orange" />
          <MiniStat label="Completate questa settimana" value={totals.completedWeek.toString()} tone="green" />
        </section>
      )}

      {tab === "ads" ? (
        <CampaignBoard />
      ) : (
        <section className={`grid gap-5 ${visibleColumns.length === 1 ? "" : "lg:grid-cols-3"}`}>
          {visibleColumns.map((col) => {
            const Icon = col.icon;
            const open = col.tasks.filter((t) => !t.done);
            const done = col.tasks.filter((t) => t.done);
            const expanded = showCompleted[col.key];
            return (
              <AdminCard key={col.key} className="flex flex-col p-5">
                <div
                  className="flex items-center justify-between rounded-2xl border px-4 py-3"
                  style={{ background: col.bg, borderColor: col.glow }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: col.bg, color: col.accent, boxShadow: `0 0 18px ${col.glow}` }}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{col.title}</p>
                      <p className="text-xs text-muted-foreground">{open.length} aperte</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold"
                    style={{ color: col.accent, background: col.bg, border: `1px solid ${col.glow}` }}
                  >
                    {open.length}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  {open.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[rgba(255,255,255,0.08)] py-6 text-center text-xs text-muted-foreground">
                      Tutto fatto ✨
                    </p>
                  ) : (
                    open.map((task) => (
                      <TaskCard key={task.id} task={task} onToggle={() => toggleTask(col.key, task.id)} accent={col.accent} />
                    ))
                  )}
                </div>

                {done.length > 0 && (
                  <div className="mt-5 border-t border-[rgba(255,255,255,0.06)] pt-4">
                    <button
                      onClick={() => setShowCompleted((s) => ({ ...s, [col.key]: !s[col.key] }))}
                      className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                    >
                      <span>Mostra completate ({done.length})</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded && (
                      <div className="mt-3 flex flex-col gap-3">
                        {done.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(col.key, task.id)}
                            accent={col.accent}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </AdminCard>
            );
          })}
        </section>
      )}
    </div>
  );
}

// =============== Campaign Board (Ads) ===============

type CampaignStatus = "in-corso" | "in-pausa" | "completate";
type CampaignPlatform = "META" | "GOOGLE" | "TIKTOK" | "LINKEDIN";

interface Campaign {
  id: string;
  name: string;
  platform: CampaignPlatform;
  client: string;
  budget: string;
  budgetUsed: number;
  due?: string;
  dueUrgent?: boolean;
  priority: Priority;
  status: CampaignStatus;
  assignee: { initials: string; color: string };
  note?: string;
  metrics?: string;
}

const platformPalette: Record<CampaignPlatform, { color: string; bg: string }> = {
  META: { color: "#1877f2", bg: "rgba(24,119,242,0.15)" },
  GOOGLE: { color: "#cbd5e1", bg: "rgba(203,213,225,0.12)" },
  TIKTOK: { color: "#ff0050", bg: "rgba(255,0,80,0.15)" },
  LINKEDIN: { color: "#0077b5", bg: "rgba(0,119,181,0.15)" },
};

const campaigns: Campaign[] = [
  { id: "k1", name: "Campagna Lead Gen Primavera", platform: "META", client: "Rossi Srl", budget: "€1.500/mese", budgetUsed: 68, due: "30 apr", priority: "Alta", status: "in-corso", assignee: { initials: "MG", color: "#8b5cf6" } },
  { id: "k2", name: "Search Brand Keywords", platform: "GOOGLE", client: "Bianchi SpA", budget: "€800/mese", budgetUsed: 82, due: "15 mag", priority: "Media", status: "in-corso", assignee: { initials: "LR", color: "#00d4ff" } },
  { id: "k3", name: "UGC Content Boost", platform: "TIKTOK", client: "Verde Mode", budget: "€600/mese", budgetUsed: 45, due: "31 mag", priority: "Bassa", status: "in-corso", assignee: { initials: "SF", color: "#22c55e" } },
  { id: "k4", name: "Retargeting Carrelli", platform: "META", client: "Esposito Shop", budget: "€1.200/mese", budgetUsed: 91, due: "28 apr", dueUrgent: true, priority: "Alta", status: "in-corso", assignee: { initials: "MG", color: "#8b5cf6" } },
  { id: "k5", name: "Display Awareness Q2", platform: "GOOGLE", client: "Ferrari Tech", budget: "€2.000/mese", budgetUsed: 33, priority: "Media", status: "in-pausa", assignee: { initials: "AV", color: "#f59e0b" }, note: "in attesa approvazione" },
  { id: "k6", name: "B2B Lead Gen", platform: "LINKEDIN", client: "NexCorp", budget: "€950/mese", budgetUsed: 20, priority: "Alta", status: "in-pausa", assignee: { initials: "LR", color: "#00d4ff" }, note: "cliente non risponde" },
  { id: "k7", name: "Campagna Natale 2025", platform: "META", client: "Rossi Srl", budget: "€3.200 spesi", budgetUsed: 100, priority: "Alta", status: "completate", assignee: { initials: "MG", color: "#8b5cf6" }, metrics: "ROAS 4.2x", note: "completata gen 2026" },
  { id: "k8", name: "Promo Black Friday", platform: "GOOGLE", client: "Esposito Shop", budget: "€1.800 spesi", budgetUsed: 100, priority: "Media", status: "completate", assignee: { initials: "LR", color: "#00d4ff" }, metrics: "312 conv.", note: "completata nov 2025" },
];

const statusMeta: Record<CampaignStatus, { label: string; color: string; bg: string; subtle: string }> = {
  "in-corso": { label: "In corso", color: "#a78bfa", bg: "rgba(139,92,246,0.18)", subtle: "rgba(139,92,246,0.04)" },
  "in-pausa": { label: "In pausa", color: "#fbbf24", bg: "rgba(245,158,11,0.18)", subtle: "rgba(245,158,11,0.04)" },
  completate: { label: "Completate", color: "#34d399", bg: "rgba(34,197,94,0.18)", subtle: "rgba(34,197,94,0.04)" },
};

function CampaignBoard() {
  const inCorso = campaigns.filter((c) => c.status === "in-corso");
  const upcoming = inCorso.filter((c) => c.dueUrgent || c.budgetUsed >= 90).slice(0, 3);

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-b-2 px-6 py-5"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))",
          borderColor: "rgba(139,92,246,0.25)",
        }}
      >
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", boxShadow: "0 0 24px rgba(139,92,246,0.35)" }}
            >
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="label-section" style={{ color: "#a78bfa" }}>Marketing</p>
              <h2 className="text-xl font-bold text-foreground">Campaign Board</h2>
            </div>
          </div>
          <div className="hidden h-10 w-px bg-[rgba(139,92,246,0.2)] md:block" />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span><strong className="text-foreground">5</strong> campagne attive</span>
            <span className="hidden md:inline">·</span>
            <span><strong className="text-foreground">€4.200</strong> budget attivo</span>
            <span className="hidden md:inline">·</span>
            <span className="text-amber-400"><strong>2</strong> in scadenza questa settimana</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.06)] px-3 py-2 text-xs text-foreground focus:outline-none">
            <option>Vista: Board</option>
            <option disabled>Vista: Lista</option>
          </select>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", boxShadow: "0 8px 24px rgba(139,92,246,0.35)" }}
          >
            <Plus className="h-4 w-4" /> Nuova campagna
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {(Object.keys(statusMeta) as CampaignStatus[]).map((status) => {
          const list = campaigns.filter((c) => c.status === status);
          const meta = statusMeta[status];
          return (
            <div
              key={status}
              className="rounded-3xl border border-[rgba(255,255,255,0.04)] p-4"
              style={{ background: meta.subtle, borderTop: `2px solid ${meta.color}` }}
            >
              <div className="flex items-center justify-between px-1">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                  <span className="rounded-full bg-black/30 px-1.5 text-[10px]">{list.length}</span>
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {list.map((c) => <CampaignCard key={c.id} campaign={c} />)}
              </div>
            </div>
          );
        })}
      </div>

      <AdminCard className="p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="label-section" style={{ color: "#f59e0b" }}>Urgenze</p>
            <h3 className="text-base font-bold text-foreground">In scadenza questa settimana</h3>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {upcoming.map((c) => {
            const palette = platformPalette[c.platform];
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.04)] px-4 py-2.5"
              >
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: palette.bg, color: palette.color }}
                >
                  {c.platform}
                </span>
                <div className="text-xs">
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-muted-foreground">{c.client} · <span className="text-red-400">Scade {c.due}</span></p>
                </div>
                <button className="btn-ghost rounded-lg px-2.5 py-1 text-xs">Rinnova</button>
              </div>
            );
          })}
        </div>
      </AdminCard>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const palette = platformPalette[campaign.platform];
  const tone = priorityTone[campaign.priority];
  const used = campaign.budgetUsed;
  const usedColor = used > 90 ? "#ef4444" : used > 70 ? "#facc15" : "#22c55e";
  const budgetWarn = used >= 90;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur transition-all hover:-translate-y-[3px] hover:border-[rgba(0,212,255,0.32)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.18)]"
      style={{ borderLeft: `3px solid ${palette.color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider"
            style={{ background: palette.bg, color: palette.color }}
          >
            {campaign.platform}
          </span>
        </div>
        <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground opacity-40 group-hover:opacity-80" />
      </div>

      <p className="mt-2 text-sm font-bold leading-snug text-foreground">{campaign.name}</p>

      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-3.5 w-3.5" /> {campaign.client}
        </div>
        <div className={`flex items-center gap-2 ${budgetWarn ? "text-amber-400" : "text-muted-foreground"}`}>
          <DollarSign className="h-3.5 w-3.5" /> {campaign.budget}
        </div>
        {campaign.due && (
          <div className={`flex items-center gap-2 ${campaign.dueUrgent ? "animate-pulse text-red-400" : "text-muted-foreground"}`}>
            <Calendar className="h-3.5 w-3.5" /> Scad. {campaign.due}
          </div>
        )}
        {campaign.note && (
          <div className="text-[11px] italic text-muted-foreground">{campaign.note}</div>
        )}
      </div>

      {campaign.status !== "completate" ? (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Budget utilizzato</span>
            <span className="font-bold" style={{ color: usedColor }}>{used}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${used}%`, background: usedColor, boxShadow: `0 0 12px ${usedColor}66` }}
            />
          </div>
        </div>
      ) : (
        campaign.metrics && (
          <div className="mt-3 rounded-lg border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)] px-2 py-1 text-center text-[11px] font-bold text-emerald-300">
            {campaign.metrics}
          </div>
        )
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
          >
            {campaign.priority}
          </span>
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: campaign.assignee.color, boxShadow: `0 0 10px ${campaign.assignee.color}55` }}
          >
            {campaign.assignee.initials}
          </div>
        </div>
        <button
          aria-label="menu"
          className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


function MiniStat({ label, value, tone }: { label: string; value: string; tone: "cyan" | "orange" | "green" }) {
  const palette = {
    cyan: { color: "var(--falcon-cyan)", glow: "rgba(0,212,255,0.18)" },
    orange: { color: "#f59e0b", glow: "rgba(245,158,11,0.18)" },
    green: { color: "#22c55e", glow: "rgba(34,197,94,0.18)" },
  }[tone];
  return (
    <AdminCard className="p-5">
      <p className="label-section">{label}</p>
      <p
        className="mt-3 text-3xl font-black"
        style={{ color: palette.color, textShadow: `0 0 24px ${palette.glow}` }}
      >
        {value}
      </p>
    </AdminCard>
  );
}

function TaskCard({ task, onToggle, accent }: { task: Task; onToggle: () => void; accent: string }) {
  const tone = priorityTone[task.priority];
  return (
    <div
      className={`group relative rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-3 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[rgba(0,212,255,0.32)] hover:shadow-[0_0_24px_rgba(0,212,255,0.12)] ${
        task.done ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          aria-label="toggle task"
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors"
          style={{
            borderColor: task.done ? accent : "rgba(255,255,255,0.18)",
            background: task.done ? accent : "transparent",
          }}
        >
          {task.done && <CheckSquare className="h-3.5 w-3.5 text-background" />}
        </button>
        <div className="flex-1">
          <p className={`text-sm leading-snug text-foreground ${task.done ? "line-through" : ""}`}>
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {task.due && (
              <span
                className={`inline-flex items-center gap-1 ${task.dueOverdue ? "text-red-400" : ""}`}
              >
                <Calendar className="h-3 w-3" /> {task.due}
              </span>
            )}
            {task.recurring && (
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> ricorrente
              </span>
            )}
            {task.completedAt && task.done && <span>• {task.completedAt}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
          >
            {task.priority}
          </span>
          <button
            aria-label="menu"
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-[rgba(255,255,255,0.05)] hover:text-foreground group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
