import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Eye, Search, Trash2, UserPlus } from "lucide-react";

import { leads } from "./admin/-admin-data";
import { AdminBadge, AdminCard, IconButton } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Lead" },
      { name: "description", content: "Gestione lead mock Falcon Agency." },
    ],
  }),
  component: LeadsPage,
});

const statuses = ["Nuovo", "In valutazione", "Proposta inviata", "Chiuso vinto", "Chiuso perso"];

function LeadsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="label-section">Pipeline</p>
          <h1 className="mt-3 text-4xl font-black text-foreground">Lead <span className="text-primary text-glow">{leads.length}</span></h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="glass flex h-12 min-w-[280px] items-center gap-3 px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" placeholder="Cerca lead..." />
          </label>
          <select className="glass h-12 px-4 text-sm text-foreground outline-none">
            <option>Tutti gli stati</option>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </header>

      <AdminCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-[rgba(255,255,255,0.02)] text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Lead</th>
                <th>Servizio</th>
                <th>Budget</th>
                <th>Timing</th>
                <th>Stato</th>
                <th>Data</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.email} className="group border-t border-[rgba(255,255,255,0.06)] align-top">
                  <td className="px-5 py-4">
                    <details>
                      <summary className="flex cursor-pointer list-none items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.08)] font-bold text-primary">
                          {lead.name.split(" ").map((p) => p[0]).join("")}
                        </span>
                        <span>
                          <span className="block font-semibold text-foreground">{lead.name}</span>
                          <span className="text-xs text-muted-foreground">{lead.email}</span>
                        </span>
                        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                      </summary>
                      <div className="mt-4 max-w-3xl rounded-2xl border border-[rgba(0,212,255,0.12)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-muted-foreground">
                        {lead.answers}
                      </div>
                    </details>
                  </td>
                  <td className="py-4"><span className="rounded-full border border-[rgba(0,212,255,0.2)] px-3 py-1 text-xs text-primary">{lead.service}</span></td>
                  <td className="py-4 text-foreground/90">{lead.budget}</td>
                  <td className="py-4 text-muted-foreground">{lead.timing}</td>
                  <td className="py-4"><button><AdminBadge status={lead.status}>{lead.status}</AdminBadge></button></td>
                  <td className="py-4 text-muted-foreground">{lead.date}</td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <IconButton><Eye className="h-4 w-4" /></IconButton>
                      <IconButton><UserPlus className="h-4 w-4" /></IconButton>
                      <IconButton danger><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
