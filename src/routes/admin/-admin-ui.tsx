import type { LucideIcon } from "lucide-react";
import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

const statusTone: Record<string, { color: string; bg: string; border: string }> = {
  Nuovo: { color: "var(--falcon-cyan)", bg: "rgba(0,212,255,0.1)", border: "rgba(0,212,255,0.35)" },
  "In valutazione": { color: "#facc15", bg: "rgba(250,204,21,0.1)", border: "rgba(250,204,21,0.32)" },
  "Proposta inviata": { color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.32)" },
  Chiuso: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  "Chiuso vinto": { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  Perso: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  "Chiuso perso": { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  Attivo: { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.32)" },
  "In scadenza": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.32)" },
  Scaduto: { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.32)" },
  Bozza: { color: "var(--falcon-subtle)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)" },
};

const kpiTone = {
  cyan: "text-primary shadow-[0_0_24px_rgba(0,212,255,0.25)]",
  green: "text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.18)]",
  orange: "text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.16)]",
};

export function AdminCard({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("glass shadow-[0_24px_80px_rgba(0,0,0,0.28)]", className)}>{children}</div>;
}

export function AdminSectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="label-section">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-bold text-foreground">{title}</h2>
    </div>
  );
}

export function AdminBadge({ status, children }: PropsWithChildren<{ status: string }>) {
  const tone = statusTone[status] ?? statusTone.Bozza;
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
      style={{ color: tone.color, background: tone.bg, borderColor: tone.border }}
    >
      {children}
    </span>
  );
}

export function AdminKpi({ icon: Icon, title, value, meta, tone }: { icon: LucideIcon; title: string; value: string; meta: string; tone: keyof typeof kpiTone }) {
  return (
    <AdminCard className="glass-hover p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-black text-foreground text-glow">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{meta}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.16)] bg-[rgba(255,255,255,0.04)]", kpiTone[tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </AdminCard>
  );
}

export function IconButton({ children, danger = false }: PropsWithChildren<{ danger?: boolean }>) {
  return (
    <button className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(0,212,255,0.14)] bg-[rgba(255,255,255,0.04)] text-muted-foreground transition hover:border-primary hover:text-primary", danger && "hover:border-destructive hover:text-destructive")}>
      {children}
    </button>
  );
}
