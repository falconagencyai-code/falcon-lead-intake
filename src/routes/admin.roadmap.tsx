import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  Code,
  Map as MapIcon,
  Megaphone,
  Target,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  GripVertical,
  MoreHorizontal,
  Plus,
  User,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AdminCard } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/roadmap")({
  head: () => ({
    meta: [
      { title: "Road-map — Falcon Admin" },
      { name: "description", content: "Hub operativo Falcon Agency: roadmap, obiettivi, clienti e campagne." },
    ],
  }),
  component: RoadmapPage,
});

type Priority = "P0" | "P1" | "P2";
type ChecklistItem = { id: string; label: string; priority: Priority; done: boolean };
type Section = {
  id: string;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  barColor: string;
  items: ChecklistItem[];
};

const initialSections: Section[] = [
  {
    id: "acquisizione",
    title: "Acquisizione Clienti",
    icon: Target,
    iconColor: "#00d4ff",
    barColor: "#ef4444",
    items: [
      { id: "a1", label: "Follow-up 5 lead in sospeso da +7 giorni", priority: "P0", done: false },
      { id: "a2", label: "Inviare proposta a Bianchi Srl", priority: "P0", done: false },
      { id: "a3", label: "Attivare referral con partner", priority: "P0", done: false },
      { id: "a4", label: "Setup form contatto sul sito", priority: "P0", done: true },
      { id: "a5", label: "Pubblicare 2 case study sul sito", priority: "P1", done: false },
      { id: "a6", label: "Avviare partnership con agenzia creativa", priority: "P2", done: false },
    ],
  },
  {
    id: "ads",
    title: "Campagne Ads",
    icon: Megaphone,
    iconColor: "#8b5cf6",
    barColor: "#8b5cf6",
    items: [
      { id: "ad1", label: "Campagna lead gen aprile Meta", priority: "P0", done: true },
      { id: "ad2", label: "Setup pixel Facebook tutti i clienti", priority: "P0", done: true },
      { id: "ad3", label: "Ottimizzare ROAS campagna Google", priority: "P0", done: false },
      { id: "ad4", label: "Creare UGC content per TikTok cliente Verde", priority: "P1", done: false },
      { id: "ad5", label: "Avviare campagna LinkedIn B2B", priority: "P2", done: false },
    ],
  },
  {
    id: "gestionale",
    title: "Gestionale Agenzia",
    icon: Building2,
    iconColor: "#00d4ff",
    barColor: "#eab308",
    items: [
      { id: "g1", label: "Fatturare cliente Mario Verdi (scad. 30 apr)", priority: "P0", done: false },
      { id: "g2", label: "Setup Supabase progetto admin", priority: "P0", done: true },
      { id: "g3", label: "Onboarding collaboratore dev", priority: "P0", done: true },
      { id: "g4", label: "Rinnovo dominio falconagency.ai", priority: "P0", done: true },
      { id: "g5", label: "Aggiornare listino prezzi 2026", priority: "P1", done: false },
      { id: "g6", label: "Scrivere manuale operativo agenzia", priority: "P2", done: false },
    ],
  },
  {
    id: "prodotto",
    title: "Sviluppo Prodotto",
    icon: Code,
    iconColor: "#00d4ff",
    barColor: "#00d4ff",
    items: [
      { id: "p1", label: "Landing page pubblica con form", priority: "P0", done: true },
      { id: "p2", label: "Dashboard admin base", priority: "P0", done: true },
      { id: "p3", label: "Integrazione Supabase + RLS", priority: "P0", done: true },
      { id: "p4", label: "Form multi-step qualificazione lead", priority: "P0", done: true },
      { id: "p5", label: "Notifiche email automatiche nuovi lead", priority: "P0", done: false },
      { id: "p6", label: "Sezione portfolio clienti sul sito", priority: "P1", done: false },
      { id: "p7", label: "App companion mobile", priority: "P2", done: false },
    ],
  },
  {
    id: "clienti",
    title: "Clienti Attivi",
    icon: Users,
    iconColor: "#22c55e",
    barColor: "#22c55e",
    items: [
      { id: "c1", label: "Consegnato sito web cliente Esposito", priority: "P0", done: true },
      { id: "c2", label: "Demo piattaforma AI cliente Ferrari", priority: "P0", done: true },
      { id: "c3", label: "Revisione feedback cliente Rossi Srl", priority: "P0", done: false },
      { id: "c4", label: "Presentazione onboarding cliente Bianchi", priority: "P1", done: false },
    ],
  },
  {
    id: "obiettivi",
    title: "Obiettivi Q2",
    icon: TrendingUp,
    iconColor: "#eab308",
    barColor: "#eab308",
    items: [
      { id: "o1", label: "Raggiungere €80.000 fatturato Q2", priority: "P0", done: false },
      { id: "o2", label: "Acquisire 8 nuovi clienti (apr-giu)", priority: "P0", done: false },
      { id: "o3", label: "Lanciare 3 servizi AI productizzati", priority: "P1", done: false },
      { id: "o4", label: "Assumere 1 account manager", priority: "P2", done: false },
    ],
  },
];

const priorityTone: Record<Priority, { color: string; bg: string }> = {
  P0: { color: "#ef4444", bg: "rgba(239,68,68,0.2)" },
  P1: { color: "#f59e0b", bg: "rgba(245,158,11,0.2)" },
  P2: { color: "#eab308", bg: "rgba(234,179,8,0.2)" },
};

type TabKey = "panoramica" | "clienti" | "ads" | "gestionale" | "prodotto" | "obiettivi";

const tabs: { key: TabKey; label: string }[] = [
  { key: "panoramica", label: "Panoramica" },
  { key: "clienti", label: "Clienti" },
  { key: "ads", label: "Campagne Ads" },
  { key: "gestionale", label: "Gestionale" },
  { key: "prodotto", label: "Prodotto & Tech" },
  { key: "obiettivi", label: "Obiettivi Q2" },
];

function RoadmapPage() {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [tab, setTab] = useState<TabKey>("panoramica");

  const totals = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    const done = all.filter((i) => i.done).length;
    return { done, total: all.length, pct: Math.round((done / all.length) * 100) };
  }, [sections]);

  const toggle = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
          : s,
      ),
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.15)] text-primary">
            <MapIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              Road-map <span className="text-primary text-glow">Falcon Agency</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hub operativo — stato avanzamento, obiettivi, clienti e campagne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-xl">
            {totals.done}/{totals.total} completati
          </span>
          <span className="text-2xl font-black text-primary text-glow">{totals.pct}%</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${totals.pct}%`,
            background: "linear-gradient(90deg, #1a2870, #00d4ff)",
          }}
        />
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-2">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-[rgba(0,212,255,0.12)] text-primary border-b-2 border-primary"
                  : "text-[#6677aa] hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} className="animate-in fade-in duration-150">
        {tab === "panoramica" && <PanoramicaTab sections={sections} toggle={toggle} />}
        {tab === "clienti" && <ClientiTab />}
        {tab === "ads" && <CampaignBoard />}
        {tab === "gestionale" && (
          <SingleSection section={sections.find((s) => s.id === "gestionale")!} toggle={toggle} />
        )}
        {tab === "prodotto" && (
          <SingleSection section={sections.find((s) => s.id === "prodotto")!} toggle={toggle} />
        )}
        {tab === "obiettivi" && <ObiettiviTab />}
      </div>
    </div>
  );
}

/* ============== PANORAMICA ============== */
function PanoramicaTab({
  sections,
  toggle,
}: {
  sections: Section[];
  toggle: (sectionId: string, itemId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Milestones */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MilestoneCard
          color="#ef4444"
          label="PRIORITÀ ALTA · QUESTO MESE"
          title="Acquisizione nuovi clienti"
          description="Chiudere 3 nuovi contratti entro fine aprile. Attivare campagne ads e follow-up lead."
          progress={20}
          metric={{ label: "PO critici", value: "4" }}
        />
        <MilestoneCard
          color="#f59e0b"
          label="IN CORSO · Q2 2026"
          title="Lancio Dashboard Admin"
          description="Completare le sezioni admin: lead, team, contabilità, competitor, roadmap."
          progress={60}
          metric={{ label: "Task aperte", value: "6" }}
        />
      </div>

      {/* Sections grid */}
      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => (
          <SectionCard key={section.id} section={section} toggle={toggle} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({
  color,
  label,
  title,
  description,
  progress,
  metric,
}: {
  color: string;
  label: string;
  title: string;
  description: string;
  progress: number;
  metric: { label: string; value: string };
}) {
  return (
    <AdminCard className="p-5" >
      <div
        className="-m-5 mb-5 rounded-t-3xl border-l-4 p-5"
        style={{ borderColor: color, background: `${color}10` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color }}>
              {label}
            </p>
            <h3 className="mt-2 text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Avanzamento</p>
            <p className="mt-1 text-2xl font-black" style={{ color }}>
              {progress}%
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{metric.label}</p>
            <p className="text-lg font-bold" style={{ color }}>
              {metric.value}
            </p>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}

function SectionCard({
  section,
  toggle,
}: {
  section: Section;
  toggle: (sectionId: string, itemId: string) => void;
}) {
  const Icon = section.icon;
  const done = section.items.filter((i) => i.done).length;
  const pct = Math.round((done / section.items.length) * 100);

  return (
    <AdminCard className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${section.iconColor}20`, color: section.iconColor }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-foreground">{section.title}</h3>
        </div>
        <span className="text-sm text-[#6677aa]">
          {done}/{section.items.length}
        </span>
      </div>

      <div className="mt-3 h-[2px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: section.barColor }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {section.items.map((item) => {
          const tone = priorityTone[item.priority];
          return (
            <li
              key={item.id}
              className={`group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-[rgba(0,212,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] ${
                item.done ? "opacity-40" : ""
              }`}
            >
              <button
                onClick={() => toggle(section.id, item.id)}
                aria-label={item.done ? "Segna come da fare" : "Segna come completato"}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition"
                style={{
                  borderColor: item.done ? "#22c55e" : "rgba(255,255,255,0.2)",
                  background: item.done ? "#22c55e" : "transparent",
                }}
              >
                {item.done && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#070b14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm text-foreground ${item.done ? "line-through" : ""}`}
              >
                {item.label}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ color: tone.color, background: tone.bg }}
              >
                {item.priority}
              </span>
            </li>
          );
        })}
      </ul>
    </AdminCard>
  );
}

function SingleSection({
  section,
  toggle,
}: {
  section: Section;
  toggle: (sectionId: string, itemId: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <SectionCard section={section} toggle={toggle} />
    </div>
  );
}

/* ============== CLIENTI ============== */
type Client = {
  name: string;
  initials: string;
  color: string;
  service: string;
  progress: number;
  deadline: string;
  responsible: string;
  responsibleColor: string;
  status: "Attivo" | "In attesa feedback" | "Completato";
};

const clients: Client[] = [
  { name: "Rossi Srl", initials: "RS", color: "#00d4ff", service: "Piattaforma AI", progress: 65, deadline: "12 mag", responsible: "MA", responsibleColor: "#8b5cf6", status: "Attivo" },
  { name: "Bianchi SpA", initials: "BS", color: "#8b5cf6", service: "Sito Web", progress: 30, deadline: "30 mag", responsible: "LF", responsibleColor: "#22c55e", status: "In attesa feedback" },
  { name: "Verde Mode", initials: "VM", color: "#22c55e", service: "Automazione", progress: 80, deadline: "5 mag", responsible: "MA", responsibleColor: "#8b5cf6", status: "Attivo" },
  { name: "Esposito Shop", initials: "ES", color: "#f59e0b", service: "E-commerce", progress: 100, deadline: "Consegnato", responsible: "GA", responsibleColor: "#00d4ff", status: "Completato" },
  { name: "Ferrari Tech", initials: "FT", color: "#ef4444", service: "AI Agent", progress: 15, deadline: "20 giu", responsible: "LF", responsibleColor: "#22c55e", status: "Attivo" },
];

const clientStatusTone: Record<Client["status"], { color: string; bg: string }> = {
  Attivo: { color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  "In attesa feedback": { color: "#eab308", bg: "rgba(234,179,8,0.15)" },
  Completato: { color: "#9ca3af", bg: "rgba(156,163,175,0.15)" },
};

function ClientiTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {clients.map((c) => {
        const st = clientStatusTone[c.status];
        return (
          <AdminCard key={c.name} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black"
                  style={{ background: `${c.color}25`, color: c.color }}
                >
                  {c.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{c.name}</h3>
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff" }}
                  >
                    {c.service}
                  </span>
                </div>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ color: st.color, background: st.bg }}
              >
                {c.status}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Avanzamento progetto</span>
                <span className="font-bold text-foreground">{c.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${c.progress}%`,
                    background: c.progress === 100 ? "#22c55e" : "linear-gradient(90deg,#1a2870,#00d4ff)",
                  }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Prossima: <span className="text-foreground">{c.deadline}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Resp.</span>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black"
                  style={{ background: `${c.responsibleColor}25`, color: c.responsibleColor }}
                >
                  {c.responsible}
                </div>
              </div>
            </div>
          </AdminCard>
        );
      })}
    </div>
  );
}

/* ============== OBIETTIVI Q2 ============== */
type KR = { label: string; current: string; target: string; pct: number };
type OKR = { id: string; title: string; krs: KR[] };

const okrs: OKR[] = [
  {
    id: "O1",
    title: "Crescita fatturato",
    krs: [
      { label: "Fatturato Q2", current: "€48K", target: "€80K", pct: 60 },
      { label: "Nuovi clienti", current: "5", target: "8", pct: 62 },
      { label: "Tasso conversione lead", current: "18%", target: "25%", pct: 72 },
    ],
  },
  {
    id: "O2",
    title: "Prodotto & Automazione",
    krs: [
      { label: "Servizi AI lanciati", current: "3", target: "5", pct: 60 },
      { label: "Tool interno CRM", current: "0", target: "1", pct: 0 },
      { label: "Integrazioni attive", current: "4", target: "4", pct: 100 },
    ],
  },
  {
    id: "O3",
    title: "Visibilità & Brand",
    krs: [
      { label: "Case study pubblicati", current: "2", target: "4", pct: 50 },
      { label: "Follower LinkedIn", current: "1.2K", target: "5K", pct: 24 },
      { label: "Partnership attive", current: "0", target: "2", pct: 0 },
    ],
  },
];

function ObiettiviTab() {
  return (
    <div className="space-y-5">
      {okrs.map((okr, idx) => {
        const overall = Math.round(okr.krs.reduce((acc, k) => acc + k.pct, 0) / okr.krs.length);
        return (
          <AdminCard key={okr.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  OBIETTIVO · O{idx + 1}
                </p>
                <h3 className="mt-2 text-2xl font-black text-foreground">{okr.title}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Progresso</p>
                <p className="mt-1 text-3xl font-black text-primary text-glow">{overall}%</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {okr.krs.map((kr, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">
                      <span className="text-xs font-bold text-muted-foreground">KR{i + 1} · </span>
                      {kr.label}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">{kr.current}</span> / {kr.target}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${kr.pct}%`,
                        background:
                          kr.pct >= 80
                            ? "#22c55e"
                            : kr.pct >= 50
                              ? "linear-gradient(90deg,#1a2870,#00d4ff)"
                              : "#f59e0b",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AdminCard>
        );
      })}
    </div>
  );
}

/* ============== CAMPAIGN BOARD (Ads) ============== */
type Platform = "META" | "GOOGLE" | "TIKTOK" | "LINKEDIN";
type CampaignStatus = "in_corso" | "in_pausa" | "completate";
type Campaign = {
  id: string;
  platform: Platform;
  name: string;
  client: string;
  budget: string;
  used: number;
  deadline: string;
  daysLeft: number;
  priority: "Alta" | "Media" | "Bassa";
  assignee: string;
  assigneeColor: string;
  status: CampaignStatus;
  note?: string;
  result?: string;
};

const platformTone: Record<Platform, { color: string; bg: string }> = {
  META: { color: "#1877f2", bg: "rgba(24,119,242,0.18)" },
  GOOGLE: { color: "#d1d5db", bg: "rgba(209,213,219,0.12)" },
  TIKTOK: { color: "#ff0050", bg: "rgba(255,0,80,0.16)" },
  LINKEDIN: { color: "#0077b5", bg: "rgba(0,119,181,0.18)" },
};

const campaignPriorityTone: Record<Campaign["priority"], { color: string; bg: string }> = {
  Alta: { color: "#ef4444", bg: "rgba(239,68,68,0.18)" },
  Media: { color: "#facc15", bg: "rgba(250,204,21,0.18)" },
  Bassa: { color: "#22c55e", bg: "rgba(34,197,94,0.18)" },
};

const campaigns: Campaign[] = [
  { id: "c1", platform: "META", name: "Campagna Lead Gen Primavera", client: "Rossi Srl", budget: "€1.500/mese", used: 68, deadline: "30 apr", daysLeft: 7, priority: "Alta", assignee: "MA", assigneeColor: "#8b5cf6", status: "in_corso" },
  { id: "c2", platform: "GOOGLE", name: "Search Brand Keywords", client: "Bianchi SpA", budget: "€800/mese", used: 82, deadline: "15 mag", daysLeft: 22, priority: "Media", assignee: "LF", assigneeColor: "#22c55e", status: "in_corso" },
  { id: "c3", platform: "TIKTOK", name: "UGC Content Boost", client: "Verde Mode", budget: "€600/mese", used: 45, deadline: "31 mag", daysLeft: 38, priority: "Bassa", assignee: "GA", assigneeColor: "#00d4ff", status: "in_corso" },
  { id: "c4", platform: "META", name: "Retargeting Carrelli", client: "Esposito Shop", budget: "€1.200/mese", used: 91, deadline: "28 apr", daysLeft: 5, priority: "Alta", assignee: "MA", assigneeColor: "#8b5cf6", status: "in_corso" },
  { id: "c5", platform: "GOOGLE", name: "Display Awareness Q2", client: "Ferrari Tech", budget: "€2.000/mese", used: 33, deadline: "—", daysLeft: 99, priority: "Media", assignee: "LF", assigneeColor: "#22c55e", status: "in_pausa", note: "in attesa approvazione" },
  { id: "c6", platform: "LINKEDIN", name: "B2B Lead Gen", client: "NexCorp", budget: "€950/mese", used: 20, deadline: "—", daysLeft: 99, priority: "Alta", assignee: "GA", assigneeColor: "#00d4ff", status: "in_pausa", note: "cliente non risponde" },
  { id: "c7", platform: "META", name: "Campagna Natale 2025", client: "Rossi Srl", budget: "€3.200 spesi", used: 100, deadline: "gen 2026", daysLeft: 0, priority: "Media", assignee: "MA", assigneeColor: "#8b5cf6", status: "completate", result: "ROAS 4.2x" },
  { id: "c8", platform: "GOOGLE", name: "Promo Black Friday", client: "Esposito Shop", budget: "€1.800 spesi", used: 100, deadline: "nov 2025", daysLeft: 0, priority: "Alta", assignee: "GA", assigneeColor: "#00d4ff", status: "completate", result: "conv. 312" },
];

const campaignColumns: { key: CampaignStatus; label: string; color: string; bg: string }[] = [
  { key: "in_corso", label: "In corso", color: "#8b5cf6", bg: "rgba(139,92,246,0.04)" },
  { key: "in_pausa", label: "In pausa", color: "#f59e0b", bg: "rgba(245,158,11,0.04)" },
  { key: "completate", label: "Completate", color: "#22c55e", bg: "rgba(34,197,94,0.04)" },
];

function CampaignBoard() {
  const expiring = campaigns.filter((c) => c.status === "in_corso" && c.daysLeft <= 7);
  const activeCount = campaigns.filter((c) => c.status === "in_corso").length;
  const activeBudget = "€4.200";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="rounded-3xl border-b p-5"
        style={{
          background: "linear-gradient(180deg, rgba(139,92,246,0.06), transparent)",
          borderBottomColor: "rgba(139,92,246,0.2)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(139,92,246,0.18)" }}>
              <Megaphone className="h-5 w-5" style={{ color: "#8b5cf6" }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Campaign Board</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{activeCount}</span> campagne attive ·{" "}
                <span className="font-semibold text-foreground">{activeBudget}</span> budget attivo ·{" "}
                <span className="font-semibold text-amber-400">{expiring.length}</span> in scadenza questa settimana
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-foreground focus:outline-none">
              <option>Board</option>
              <option disabled>Lista</option>
            </select>
            <button
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(139,92,246,0.35)] transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#6d28d9)" }}
            >
              <Plus className="h-4 w-4" />
              Nuova campagna
            </button>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="grid gap-5 xl:grid-cols-3">
        {campaignColumns.map((col) => {
          const items = campaigns.filter((c) => c.status === col.key);
          return (
            <div
              key={col.key}
              className="rounded-3xl border p-4"
              style={{ background: col.bg, borderTop: `2px solid ${col.color}`, borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: `${col.color}25`, color: col.color }}
                >
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-3">
                {items.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expiring */}
      {expiring.length > 0 && (
        <AdminCard className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-foreground">In scadenza questa settimana</h3>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {expiring.map((c) => {
              const tone = platformTone[c.platform];
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                >
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: tone.bg, color: tone.color }}
                  >
                    {c.platform}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  <span className="text-xs text-muted-foreground">· {c.client}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: c.daysLeft <= 3 ? "#ef4444" : "#f59e0b" }}
                  >
                    Scade tra {c.daysLeft}g
                  </span>
                  <button className="ml-2 rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary">
                    Rinnova
                  </button>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}
    </div>
  );
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const tone = platformTone[c.platform];
  const prio = campaignPriorityTone[c.priority];
  const usedColor = c.used > 90 ? "#ef4444" : c.used > 70 ? "#facc15" : "#22c55e";
  const budgetWarn = c.used >= 90;
  const deadlineUrgent = c.daysLeft > 0 && c.daysLeft <= 3;

  return (
    <div
      className="group relative rounded-2xl border bg-[rgba(255,255,255,0.02)] p-4 transition hover:-translate-y-[3px] hover:border-primary"
      style={{ borderLeft: `3px solid ${tone.color}`, borderColor: "rgba(255,255,255,0.06)", borderLeftColor: tone.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: tone.bg, color: tone.color }}
          >
            {c.platform}
          </span>
          <h4 className="text-sm font-bold text-foreground">{c.name}</h4>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-50" />
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-center gap-2 text-[#6677aa]">
          <User className="h-3.5 w-3.5" />
          <span>{c.client}</span>
        </div>
        <div className={`flex items-center gap-2 ${budgetWarn ? "text-amber-400" : "text-muted-foreground"}`}>
          <DollarSign className="h-3.5 w-3.5" />
          <span>{c.budget}</span>
        </div>
        <div className={`flex items-center gap-2 ${deadlineUrgent ? "animate-pulse text-red-400" : "text-muted-foreground"}`}>
          <Calendar className="h-3.5 w-3.5" />
          <span>{c.deadline}{c.note ? ` · ${c.note}` : ""}{c.result ? ` · ${c.result}` : ""}</span>
        </div>
      </div>

      {c.status !== "completate" && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Budget utilizzato</span>
            <span className="font-bold" style={{ color: usedColor }}>{c.used}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div className="h-full rounded-full transition-all" style={{ width: `${c.used}%`, background: usedColor }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-3">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: prio.bg, color: prio.color }}
        >
          {c.priority}
        </span>
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-black"
            style={{ background: `${c.assigneeColor}30`, color: c.assigneeColor }}
          >
            {c.assignee}
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
