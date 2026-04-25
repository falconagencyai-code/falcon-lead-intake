import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, DollarSign, ExternalLink, Target, TrendingUp, Users } from "lucide-react";

import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/ads")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Ads & Campagne" },
      { name: "description", content: "Gestione campagne pubblicitarie Falcon Agency." },
    ],
  }),
  component: AdsPage,
});

const kpis = [
  { icon: DollarSign, title: "Spesa totale", value: "—" },
  { icon: Target, title: "CPL medio", value: "—" },
  { icon: Users, title: "Lead generati", value: "—" },
  { icon: TrendingUp, title: "ROAS", value: "—" },
];

function AdsPage() {
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
          Collega il tuo Business Manager per vedere le campagne in tempo reale.
        </p>
      </header>

      <AdminCard className="p-8 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.35)] bg-[rgba(0,212,255,0.08)] text-primary shadow-[0_0_28px_rgba(0,212,255,0.25)]">
            <Target className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Nessun account collegato</h2>
          <p className="text-sm text-muted-foreground">
            Connetti Facebook Business Manager per importare automaticamente spesa, CPL, lead e ROAS delle tue campagne.
          </p>
          <a
            href="https://business.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-2 inline-flex items-center gap-2 text-sm"
          >
            Connetti Facebook Business Manager
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </AdminCard>

      <section>
        <AdminSectionTitle eyebrow="Preview" title="Metriche disponibili dopo il collegamento" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <AdminCard key={k.title} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{k.title}</p>
                    <p className="mt-3 text-3xl font-black text-foreground/40">{k.value}</p>
                    <span
                      className="mt-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--falcon-subtle)",
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(255,255,255,0.12)",
                      }}
                    >
                      In arrivo
                    </span>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-muted-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
