import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Eye, Search, Trash2, UserPlus, Loader2, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { AdminBadge, AdminCard, IconButton } from "./admin/-admin-ui";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Falcon Admin — Lead" },
      { name: "description", content: "Gestione lead Falcon Agency." },
    ],
  }),
  component: LeadsPage,
});

const statuses = ["Nuovo", "In valutazione", "Proposta inviata", "Chiuso vinto", "Chiuso perso"];

type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  form_answers: unknown;
  created_at: string | null;
};

async function fetchLeads(): Promise<LeadRow[]> {
  if (!supabase) throw new Error("Supabase non configurato");
  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, email, phone, company, status, service_interest, budget_range, timeline, form_answers, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

function initials(name: string | null, email: string | null) {
  const src = (name && name.trim()) || email || "??";
  return src
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function answersToText(answers: unknown): string {
  if (!answers) return "Nessuna risposta del form disponibile.";
  if (typeof answers === "string") return answers;
  try {
    return JSON.stringify(answers, null, 2);
  } catch {
    return String(answers);
  }
}

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads,
    enabled: isSupabaseConfigured,
  });

  const leads = useMemo(() => {
    const list = data ?? [];
    return list.filter((l) => {
      if (statusFilter && (l.status ?? "") !== statusFilter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (l.full_name ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.service_interest ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, query, statusFilter]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="label-section">Pipeline</p>
          <h1 className="mt-3 text-4xl font-black text-foreground">
            Lead{" "}
            <span className="text-primary text-glow">
              {isLoading ? "…" : leads.length}
            </span>
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="glass flex h-12 min-w-[280px] items-center gap-3 px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Cerca lead..."
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass h-12 px-4 text-sm text-foreground outline-none"
          >
            <option value="">Tutti gli stati</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </header>

      {!isSupabaseConfigured && (
        <AdminCard className="flex items-center gap-3 p-5 text-sm text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          Supabase non è configurato. Aggiungi VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.
        </AdminCard>
      )}

      {error && (
        <AdminCard className="flex items-center justify-between gap-3 p-5 text-sm text-red-300">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Errore caricamento lead: {(error as Error).message}
          </span>
          <button
            onClick={() => refetch()}
            className="rounded-full border border-[rgba(248,113,113,0.4)] px-4 py-1.5 text-xs font-semibold text-red-200 hover:bg-[rgba(248,113,113,0.1)]"
          >
            Riprova
          </button>
        </AdminCard>
      )}

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
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em]">Caricamento lead…</p>
                  </td>
                </tr>
              )}
              {!isLoading && leads.length === 0 && !error && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    Nessun lead {query || statusFilter ? "corrisponde ai filtri" : "ancora registrato"}.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="group border-t border-[rgba(255,255,255,0.06)] align-top">
                  <td className="px-5 py-4">
                    <details>
                      <summary className="flex cursor-pointer list-none items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(0,212,255,0.22)] bg-[rgba(0,212,255,0.08)] font-bold text-primary">
                          {initials(lead.full_name, lead.email)}
                        </span>
                        <span>
                          <span className="block font-semibold text-foreground">
                            {lead.full_name || "(senza nome)"}
                            {lead.company ? <span className="ml-2 text-xs font-normal text-muted-foreground">· {lead.company}</span> : null}
                          </span>
                          <span className="text-xs text-muted-foreground">{lead.email ?? "—"}</span>
                        </span>
                        <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                      </summary>
                      <div className="mt-4 max-w-3xl rounded-2xl border border-[rgba(0,212,255,0.12)] bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-muted-foreground">
                        <pre className="whitespace-pre-wrap font-sans">{answersToText(lead.form_answers)}</pre>
                        {lead.phone && <p className="mt-2 text-xs">Tel: <span className="text-foreground">{lead.phone}</span></p>}
                      </div>
                    </details>
                  </td>
                  <td className="py-4">
                    {lead.service_interest ? (
                      <span className="rounded-full border border-[rgba(0,212,255,0.2)] px-3 py-1 text-xs text-primary">
                        {lead.service_interest}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-4 text-foreground/90">{lead.budget_range ?? "—"}</td>
                  <td className="py-4 text-muted-foreground">{lead.timeline ?? "—"}</td>
                  <td className="py-4">
                    <AdminBadge status={lead.status ?? "Nuovo"}>{lead.status ?? "Nuovo"}</AdminBadge>
                  </td>
                  <td className="py-4 text-muted-foreground">{formatDate(lead.created_at)}</td>
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
        {isFetching && !isLoading && (
          <div className="border-t border-[rgba(255,255,255,0.06)] px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Aggiornamento…
          </div>
        )}
      </AdminCard>
    </div>
  );
}
