import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";

import { AdminCard, AdminSectionTitle } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/fatture")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Fatture" },
      { name: "description", content: "Gestione fatture clienti." },
    ],
  }),
  component: FatturePage,
});

function FatturePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label-section">Clienti</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Fatture <span className="text-primary text-glow">Mock</span>
        </h1>
      </header>

      <AdminCard className="p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(0,212,255,0.2)] bg-[rgba(0,212,255,0.05)]">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <AdminSectionTitle eyebrow="Coming soon" title="In arrivo" />
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Il modulo fatturazione sarà disponibile a breve. Potrai generare, inviare e tracciare le fatture direttamente da qui.
          </p>
        </div>
      </AdminCard>
    </div>
  );
}
