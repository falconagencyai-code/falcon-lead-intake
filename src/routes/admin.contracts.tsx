import { createFileRoute } from "@tanstack/react-router";
import { Download, RefreshCw } from "lucide-react";

import { contracts } from "./admin/-admin-data";
import { AdminBadge, AdminCard, IconButton } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Contratti" },
      { name: "description", content: "Lista contratti mock Falcon Agency." },
    ],
  }),
  component: ContractsPage,
});

const filters = ["Tutti", "Attivo", "In scadenza", "Scaduto", "Bozza"];

function ContractsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="label-section">Legal cockpit</p>
        <h1 className="mt-3 text-4xl font-black text-foreground">Contratti</h1>
      </header>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter, index) => (
          <button key={filter} className={`glass px-4 py-2 text-sm font-semibold transition ${index === 0 ? "text-primary shadow-[0_0_20px_rgba(0,212,255,0.12)]" : "text-muted-foreground hover:text-foreground"}`}>
            {filter}
          </button>
        ))}
      </div>
      <AdminCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr className="border-b border-[rgba(0,212,255,0.1)]"><th className="py-4">Cliente</th><th>Servizio</th><th>Valore</th><th>Inizio</th><th>Scadenza</th><th>Stato</th><th>Azioni</th></tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.client} className="border-b border-[rgba(255,255,255,0.06)]">
                  <td className="py-4 font-semibold text-foreground">{contract.client}</td>
                  <td className="text-muted-foreground">{contract.service}</td>
                  <td className="font-bold text-foreground">{contract.value}</td>
                  <td className="text-muted-foreground">{contract.start}</td>
                  <td className="text-muted-foreground">{contract.end}</td>
                  <td><AdminBadge status={contract.status}>{contract.status}</AdminBadge></td>
                  <td><div className="flex gap-2"><IconButton><Download className="h-4 w-4" /></IconButton><IconButton><RefreshCw className="h-4 w-4" /></IconButton></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
