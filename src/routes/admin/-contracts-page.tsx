import { useEffect, useState } from "react";
import { Plus, Printer, X } from "lucide-react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminBadge, AdminCard, IconButton } from "./-admin-ui";

type Contract = {
  id: string;
  contract_number: string | null;
  lead_id: string | null;
  client_name: string | null;
  client_company: string | null;
  client_email: string | null;
  client_address: string | null;
  client_vat: string | null;
  client_cf: string | null;
  service: string | null;
  service_description: string | null;
  amount: number | null;
  payment_terms: string | null;
  start_date: string | null;
  end_date: string | null;
  place: string | null;
  additional_clauses: string | null;
  status: string;
  created_at: string;
};

type LeadOption = {
  id: string;
  full_name: string | null;
  company: string | null;
  email: string | null;
};

const filters = ["Tutti", "Attivo", "In scadenza", "Scaduto", "Bozza"];

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
};

const formatAmount = (a: number | null) =>
  a == null ? "—" : `€ ${a.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tutti");
  const [showNew, setShowNew] = useState(false);
  const [viewing, setViewing] = useState<Contract | null>(null);

  const load = async () => {
    if (!supabase) return;
    setLoading(true);
    let q = supabase.from("contracts").select("*").order("created_at", { ascending: false });
    if (filter !== "Tutti") q = q.eq("status", filter);
    const { data, error } = await q;
    if (!error && data) setContracts(data as Contract[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  if (!isSupabaseConfigured) {
    return <div className="text-muted-foreground">Lovable Cloud non configurato.</div>;
  }

  return (
    <>
      <div className="space-y-6 no-print">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-section">Legal cockpit</p>
            <h1 className="mt-3 text-4xl font-black text-foreground">Contratti</h1>
          </div>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuovo contratto
          </Button>
        </header>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`glass px-4 py-2 text-sm font-semibold transition ${
                f === filter ? "text-primary shadow-[0_0_20px_rgba(0,212,255,0.12)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <AdminCard className="p-5">
          {loading ? (
            <p className="py-10 text-center text-muted-foreground">Caricamento…</p>
          ) : contracts.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">Nessun contratto trovato.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <tr className="border-b border-[rgba(0,212,255,0.1)]">
                    <th className="py-4">Numero</th>
                    <th>Cliente</th>
                    <th>Servizio</th>
                    <th>Valore</th>
                    <th>Inizio</th>
                    <th>Scadenza</th>
                    <th>Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setViewing(c)}
                      className="cursor-pointer border-b border-[rgba(255,255,255,0.06)] transition hover:bg-[rgba(0,212,255,0.04)]"
                    >
                      <td className="py-4 font-mono text-xs text-primary">{c.contract_number ?? "—"}</td>
                      <td className="font-semibold text-foreground">
                        {c.client_company || c.client_name || "—"}
                        {c.client_company && c.client_name ? (
                          <span className="ml-2 text-xs text-muted-foreground">{c.client_name}</span>
                        ) : null}
                      </td>
                      <td className="text-muted-foreground">{c.service ?? "—"}</td>
                      <td className="font-bold text-foreground">{formatAmount(c.amount)}</td>
                      <td className="text-muted-foreground">{formatDate(c.start_date)}</td>
                      <td className="text-muted-foreground">{formatDate(c.end_date)}</td>
                      <td>
                        <AdminBadge status={c.status}>{c.status}</AdminBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>

      {showNew ? (
        <NewContractModal
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            void load();
          }}
        />
      ) : null}

      {viewing ? <ContractView contract={viewing} onClose={() => setViewing(null)} /> : null}
    </>
  );
}

function NewContractModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadId, setLeadId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientVat, setClientVat] = useState("");
  const [clientCf, setClientCf] = useState("");
  const [service, setService] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("50% alla firma, 50% alla consegna");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [place, setPlace] = useState("Milano");
  const [additionalClauses, setAdditionalClauses] = useState("");
  const [status, setStatus] = useState("Bozza");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!supabase) return;
      const { data } = await supabase
        .from("leads")
        .select("id, full_name, company, email")
        .eq("pipeline_stage", "chiuso_vinto")
        .order("created_at", { ascending: false });
      if (data) setLeads(data as LeadOption[]);
    })();
  }, []);

  const onSelectLead = (id: string) => {
    setLeadId(id);
    const l = leads.find((x) => x.id === id);
    if (l) {
      setClientName(l.full_name ?? "");
      setClientCompany(l.company ?? "");
      setClientEmail(l.email ?? "");
    }
  };

  const onSave = async () => {
    if (!supabase) return;
    setSaving(true);
    const { error } = await supabase.from("contracts").insert({
      lead_id: leadId || null,
      client_name: clientName || null,
      client_company: clientCompany || null,
      client_email: clientEmail || null,
      client_address: clientAddress || null,
      client_vat: clientVat || null,
      client_cf: clientCf || null,
      service: service || null,
      service_description: serviceDescription || null,
      amount: amount ? parseFloat(amount) : null,
      payment_terms: paymentTerms || null,
      start_date: startDate || null,
      end_date: endDate || null,
      place: place || null,
      additional_clauses: additionalClauses || null,
      status,
    });
    setSaving(false);
    if (!error) onCreated();
    else alert("Errore: " + error.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 no-print">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[rgba(0,212,255,0.15)] bg-[#0d1117] p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Nuovo contratto</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 [&_input]:border-[rgba(255,255,255,0.1)] [&_input]:bg-[rgba(255,255,255,0.05)] [&_input]:text-white [&_textarea]:border-[rgba(255,255,255,0.1)] [&_textarea]:bg-[rgba(255,255,255,0.05)] [&_textarea]:text-white">
          <Field label="Cliente esistente (opzionale)">
            <select
              value={leadId}
              onChange={(e) => onSelectLead(e.target.value)}
              className="h-9 w-full rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 text-sm text-white"
            >
              <option value="">— Nuovo cliente —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.company ? `${l.company} — ${l.full_name ?? ""}` : l.full_name ?? l.email ?? l.id}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome cliente"><Input value={clientName} onChange={(e) => setClientName(e.target.value)} /></Field>
            <Field label="Azienda"><Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></Field>
            <Field label="Indirizzo"><Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} /></Field>
            <Field label="P.IVA"><Input value={clientVat} onChange={(e) => setClientVat(e.target.value)} /></Field>
            <Field label="Codice Fiscale"><Input value={clientCf} onChange={(e) => setClientCf(e.target.value)} /></Field>
          </div>

          <Field label="Servizio"><Input value={service} onChange={(e) => setService(e.target.value)} /></Field>
          <Field label="Descrizione servizio">
            <Textarea value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} rows={3} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Importo €"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
            <Field label="Condizioni pagamento"><Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} /></Field>
            <Field label="Data inizio"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Data fine"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
            <Field label="Luogo firma"><Input value={place} onChange={(e) => setPlace(e.target.value)} /></Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 text-sm text-white"
              >
                <option>Bozza</option>
                <option>Attivo</option>
                <option>In scadenza</option>
                <option>Scaduto</option>
              </select>
            </Field>
          </div>

          <Field label="Clausole aggiuntive (opzionale)">
            <Textarea value={additionalClauses} onChange={(e) => setAdditionalClauses(e.target.value)} rows={3} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Salvataggio…" : "Crea contratto"}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ContractView({ contract: c, onClose }: { contract: Contract; onClose: () => void }) {
  const today = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const created = c.created_at ? new Date(c.created_at).toLocaleDateString("it-IT") : "—";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-black contract-print">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-gray-300 bg-white px-6 py-3">
        <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-black">
          <X className="h-4 w-4" /> Chiudi
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Printer className="h-4 w-4" /> Stampa / PDF
        </button>
      </div>

      <div
        className="mx-auto max-w-[820px] px-16 py-16 text-[15px] leading-relaxed"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="flex items-start justify-between border-b-2 border-black pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">FALCON AGENCY</h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-gray-600">AI · Marketing · Web</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-bold">CONTRATTO N. {c.contract_number ?? "—"}</p>
            <p className="text-gray-600">Data: {created}</p>
          </div>
        </header>

        <section className="mt-10">
          <p className="text-center text-lg font-bold tracking-widest">TRA</p>
          <div className="mt-3 text-center">
            <p className="font-bold">FALCON AGENCY</p>
            <p>Via [•••], Milano</p>
            <p>P.IVA: [•••] — C.F.: [•••]</p>
            <p>Email: info@falconagency.ai</p>
            <p className="mt-2 italic">di seguito denominata "Agenzia"</p>
          </div>

          <p className="mt-6 text-center text-lg font-bold tracking-widest">E</p>
          <div className="mt-3 text-center">
            <p className="font-bold">{c.client_company || "—"}{c.client_name ? ` — ${c.client_name}` : ""}</p>
            <p>{c.client_address || "—"}</p>
            <p>P.IVA: {c.client_vat || "—"} — C.F.: {c.client_cf || "—"}</p>
            <p>Email: {c.client_email || "—"}</p>
            <p className="mt-2 italic">di seguito denominato "Cliente"</p>
          </div>
        </section>

        <Article title="ART. 1 — OGGETTO DEL CONTRATTO">
          L'Agenzia si impegna a fornire al Cliente i seguenti servizi:
          <br />
          <strong>{c.service || "—"}</strong>
          {c.service_description ? <> — {c.service_description}</> : null}
        </Article>

        <Article title="ART. 2 — DURATA">
          Il presente contratto ha decorrenza dal <strong>{formatDate(c.start_date)}</strong> al{" "}
          <strong>{formatDate(c.end_date)}</strong>.
        </Article>

        <Article title="ART. 3 — CORRISPETTIVO E PAGAMENTI">
          Il corrispettivo pattuito per i servizi è pari a <strong>{formatAmount(c.amount)}</strong> (IVA esclusa).
          <br />
          Modalità di pagamento: {c.payment_terms || "—"}.
          <br />
          Il pagamento dovrà essere effettuato tramite bonifico bancario ai dati comunicati dall'Agenzia.
        </Article>

        <Article title="ART. 4 — PROPRIETÀ INTELLETTUALE">
          Tutti i materiali, elaborati e output prodotti nell'ambito del presente contratto rimangono di proprietà
          dell'Agenzia fino al saldo integrale del corrispettivo. Al completamento del pagamento, la proprietà
          intellettuale viene trasferita al Cliente nella misura concordata.
        </Article>

        <Article title="ART. 5 — RISERVATEZZA">
          Le parti si impegnano a mantenere riservate tutte le informazioni ricevute nell'ambito della collaborazione e
          a non divulgarle a terzi senza previo consenso scritto.
        </Article>

        <Article title="ART. 6 — RESPONSABILITÀ">
          L'Agenzia non è responsabile per ritardi o inadempimenti causati da informazioni incomplete o errate fornite
          dal Cliente, o da cause di forza maggiore.
        </Article>

        <Article title="ART. 7 — RISOLUZIONE">
          Il contratto si risolve automaticamente in caso di mancato pagamento nei termini. Ciascuna parte può recedere
          con preavviso scritto di 15 giorni. Le prestazioni già eseguite rimangono dovute.
        </Article>

        <Article title="ART. 8 — FORO COMPETENTE">
          Per qualsiasi controversia è competente il Tribunale di Milano. Il presente contratto è regolato dalla legge
          italiana.
        </Article>

        {c.additional_clauses ? (
          <Article title="ART. 9 — DISPOSIZIONI AGGIUNTIVE">{c.additional_clauses}</Article>
        ) : null}

        <section className="mt-12">
          <p className="font-bold">FIRME</p>
          <p className="mt-2">Luogo e data: {c.place || "Milano"}, {today}</p>
          <div className="mt-12 grid grid-cols-2 gap-12">
            <div>
              <p className="border-t border-black pt-2 text-sm">Per Falcon Agency</p>
            </div>
            <div>
              <p className="border-t border-black pt-2 text-sm">Per il Cliente</p>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .contract-print { position: static !important; }
        }
      `}</style>
    </div>
  );
}

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-justify">{children}</p>
    </section>
  );
}
