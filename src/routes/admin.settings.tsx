import { createFileRoute } from "@tanstack/react-router";
import { Bell, Mail, Plus, ToggleRight, Upload, Users } from "lucide-react";

import { AdminCard } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Impostazioni" },
      { name: "description", content: "Impostazioni UI mock Falcon Agency." },
    ],
  }),
  component: SettingsPage,
});

const members = [
  { name: "Alessio Vento", role: "Sales Lead" },
  { name: "Bianca Serra", role: "Account Manager" },
  { name: "Cristian Moro", role: "Closer" },
];

function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="label-section">Control panel</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">Impostazioni</h1>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminCard className="p-6">
          <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-foreground">Profilo agenzia</h2></div>
          <div className="mt-5 grid gap-4">
            <input className="input-premium" defaultValue="Falcon Agency" />
            <input className="input-premium" defaultValue="admin@falconagency.it" />
            <button className="btn-ghost flex items-center justify-center gap-2"><Upload className="h-4 w-4" /> Carica logo</button>
          </div>
        </AdminCard>

        <AdminCard className="p-6">
          <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-foreground">Notifiche</h2></div>
          <div className="mt-6 space-y-5">
            {['Notifiche email nuovi lead', 'Contratti in scadenza'].map((label) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-[rgba(0,212,255,0.1)] bg-[rgba(255,255,255,0.03)] p-4">
                <span className="text-sm text-foreground">{label}</span>
                <ToggleRight className="h-8 w-8 text-primary" />
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <AdminCard className="p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold text-foreground">Team</h2></div>
          <button className="btn-primary flex items-center justify-center gap-2 px-5 py-3"><Plus className="h-4 w-4" /> Aggiungi membro</button>
        </div>
        <div className="mt-6 grid gap-3">
          {members.map((member) => (
            <div key={member.name} className="flex items-center justify-between rounded-2xl border border-[rgba(0,212,255,0.1)] bg-[rgba(255,255,255,0.03)] p-4">
              <div>
                <p className="font-semibold text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
              <span className="rounded-full border border-[rgba(0,212,255,0.22)] px-3 py-1 text-xs text-primary">Attivo</span>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
