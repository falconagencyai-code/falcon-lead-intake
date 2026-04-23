import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  Megaphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
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

function TasksPage() {
  const [columns, setColumns] = useState(initialColumns);
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

      <section className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Task aperte totali" value={totals.open.toString()} tone="cyan" />
        <MiniStat label="In scadenza oggi" value={totals.dueToday.toString()} tone="orange" />
        <MiniStat label="Completate questa settimana" value={totals.completedWeek.toString()} tone="green" />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {columns.map((col) => {
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
