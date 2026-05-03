import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  Euro,
  MessageSquare,
  Phone,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/admin/guida")({
  head: () => ({ meta: [{ title: "Falcon Admin — Guida Venditore" }] }),
  component: GuidaPage,
});

const STEPS = [
  {
    n: "01",
    icon: Zap,
    title: "Lead entra nel sistema",
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.2)",
    items: [
      "Il form Facebook acquisisce il contatto automaticamente.",
      "Il CRM (Pipeline) registra il lead in tempo reale.",
      "Ricevi notifica entro 5 minuti via WhatsApp o email.",
      "Trovi il lead nella sezione Pipeline › tab Lead.",
    ],
  },
  {
    n: "02",
    icon: Phone,
    title: "Primo contatto entro 1 ora",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.2)",
    items: [
      "Obiettivo: non vendere — solo fissare la discovery call.",
      "Se non risponde: richiama dopo 3 ore.",
      "Se non risponde ancora: WhatsApp scritto breve e diretto.",
      "Sposta il lead in 'Contattato' sul CRM dopo il primo tentativo.",
    ],
  },
  {
    n: "03",
    icon: Users,
    title: "Discovery call + Presentazione (30-45 min)",
    color: "#34d399",
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.2)",
    items: [
      "Prima parte (15-20 min): ascolto. Cosa fa l'attività, quale problema vuole risolvere, cosa usa adesso, budget, chi decide.",
      "Seconda parte (15-20 min): presenta 3-4 soluzioni concrete con prezzi.",
      "Usa la strategia multi-offerta: Entry / Media / Premium.",
      "Chi ha scelta compra più facilmente — porta sempre a casa almeno uno.",
      "Se il cliente non è pronto: fissa subito la call successiva prima di chiudere.",
    ],
  },
  {
    n: "04",
    icon: BookOpen,
    title: "Preventivo entro 24h",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    items: [
      "Documento semplice, max 1 pagina: servizio, prezzo, tempistica, cosa include.",
      "Nessun tecnicismo. Chiaro e diretto.",
      "Invia il preventivo entro 24h dalla call.",
      "Caricalo su Pipeline › tab Preventivi › Nuovo preventivo.",
    ],
  },
  {
    n: "05",
    icon: MessageSquare,
    title: "Follow-up — Call di chiusura",
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.2)",
    items: [
      "Entro 48h dall'invio: contatta il cliente per una call di revisione (15-20 min).",
      "Obiettivo: rispondere a domande, sciogliere dubbi, chiudere.",
      "Non aspettare che sia il cliente a rispondere — prendi l'iniziativa.",
      "Se non risponde entro 5 giorni: secondo tentativo.",
      "Se non risponde entro 10 giorni: archivia il lead e vai avanti.",
    ],
  },
  {
    n: "06",
    icon: CheckCircle2,
    title: "Chiusura e onboarding",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.2)",
    items: [
      "Contratto o accordo scritto firmato.",
      "Acconto del 50% prima di iniziare i lavori.",
      "Inizio lavori con data di consegna confermata.",
      "Sposta il lead in 'Chiuso / Vinto' e registra il pagamento in Pipeline.",
    ],
  },
];

const SERVICES = [
  { name: "Sito web vetrina", price: "1.000 – 1.500 €", days: "7-10 gg lav.", maint: "200 €/anno dal 2° anno" },
  { name: "Sito web avanzato", price: "1.500 – 3.000 €", days: "10-20 gg lav.", maint: "400 €/anno dal 2° anno" },
  { name: "Automazione business", price: "800 – 2.000 €", days: "5-7 gg lav.", maint: "200 €/anno dal 2° anno" },
  { name: "Gestionale custom", price: "Da 3.000 €", days: "3-6 settimane", maint: "500 €/anno dal 2° anno" },
  { name: "Pacchetto completo", price: "Da 7.000 €", days: "4-8 settimane", maint: "1.000 €/anno dal 2° anno" },
];

const TIERS = [
  {
    tier: "Entry",
    service: "Sito web base",
    goal: "Non perdere chi ha budget basso",
    color: "#6677aa",
  },
  {
    tier: "Media",
    service: "Sito + automazione",
    goal: "Scelta più frequente — alza il ticket medio",
    color: "#00d4ff",
    highlight: true,
  },
  {
    tier: "Premium",
    service: "Pacchetto completo",
    goal: "Per chi è già convinto — massimizza il valore",
    color: "#a78bfa",
  },
];

const OBJECTIONS = [
  {
    q: '"Costa troppo"',
    a: 'Riporta il focus sul ROI: "Quanti clienti in più deve portarti per coprire l\'investimento?" Di solito bastano 1-2. Poi presenta il tier Entry se il budget è davvero un blocco.',
  },
  {
    q: '"Ci devo pensare"',
    a: 'Non lasciarlo senza un passo successivo. Fissa subito la call successiva: "Perfetto, ti chiamo giovedì alle 11 per risponderti a qualsiasi domanda." Chi non ha un appuntamento non torna.',
  },
  {
    q: '"Non ho tempo adesso"',
    a: 'È spesso una resistenza, non un vero ostacolo. Risposta: "Capisco — proprio per questo usiamo l\'AI: il tuo sito/gestionale è pronto in 7-10 giorni, senza che tu debba fare nulla." Poi proponi un appuntamento rapido di 15 minuti.',
  },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(0,212,255,0.1)" }}
    >
      {children}
    </div>
  );
}

export default function GuidaPage() {
  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-section">Venditore</p>
          <h1 className="mt-3 text-4xl font-black text-foreground md:text-5xl">
            Guida <span className="text-primary text-glow">Operativa</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "#6677aa" }}>
            Tutto quello che devi sapere per lavorare sulla piattaforma Falcon — dalla ricezione del lead alla chiusura del contratto.
          </p>
        </div>
        <a
          href="/guida-venditore.pdf"
          download="Falcon_Guida_Venditore.pdf"
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all shrink-0"
          style={{
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.35)",
            color: "#00d4ff",
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.18)")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.1)")}
        >
          <Download className="h-4 w-4" />
          Scarica Guida PDF
        </a>
      </header>

      {/* Pipeline steps */}
      <section>
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#3a4a6a" }}>
          Pipeline — Dal lead alla chiusura
        </p>
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.n}>
                <div className="flex gap-5 p-5">
                  {/* Number + connector */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black"
                      style={{ background: step.bg, border: `1px solid ${step.border}`, color: step.color }}
                    >
                      {step.n}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px flex-1 min-h-[24px]" style={{ background: "rgba(255,255,255,0.06)" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 shrink-0" style={{ color: step.color }} />
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {step.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "#8899bb" }}>
                          <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: step.color, opacity: 0.6 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Listino prezzi */}
      <section>
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#3a4a6a" }}>
          Servizi e Listino Prezzi
        </p>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(0,212,255,0.1)" }}>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.15em]" style={{ color: "#3a4a6a" }}>Servizio</th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.15em]" style={{ color: "#3a4a6a" }}>Prezzo</th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.15em]" style={{ color: "#3a4a6a" }}>Tempi</th>
                  <th className="px-5 py-4 text-left text-xs uppercase tracking-[0.15em]" style={{ color: "#3a4a6a" }}>Manutenzione</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s, i) => (
                  <tr
                    key={s.name}
                    className="border-b transition-colors"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">{s.name}</td>
                    <td className="px-5 py-4">
                      <span className="font-semibold" style={{ color: "#00d4ff" }}>{s.price}</span>
                    </td>
                    <td className="px-5 py-4" style={{ color: "#8899bb" }}>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "#3a4a6a" }} />
                        {s.days}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: "#6677aa" }}>{s.maint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t text-xs" style={{ borderColor: "rgba(255,255,255,0.05)", color: "#4a5568" }}>
            💡 Al cliente si vende il risultato. Il fatto che sia sviluppato con AI è un dettaglio interno.
          </div>
        </Card>
      </section>

      {/* Strategia multi-offerta */}
      <section>
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#3a4a6a" }}>
          Strategia Multi-Offerta
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card
              key={t.tier}
              className={t.highlight ? "ring-1" : ""}
              style={t.highlight ? { "--tw-ring-color": "rgba(0,212,255,0.3)" } as React.CSSProperties : {}}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}40` }}
                  >
                    {t.tier}
                  </span>
                  {t.highlight && <Star className="h-4 w-4" style={{ color: "#00d4ff" }} />}
                </div>
                <p className="font-semibold text-foreground mb-1">{t.service}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6677aa" }}>{t.goal}</p>
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs" style={{ color: "#4a5568" }}>
          Il cliente percepisce valore nel confronto tra opzioni. Quasi sempre sceglie il tier medio.
        </p>
      </section>

      {/* Discovery call */}
      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5" style={{ color: "#00d4ff" }} />
              <h3 className="font-bold text-foreground">Formula Discovery Call</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl p-4" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.12)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#00d4ff" }}>Prima parte — 15/20 min</p>
                <ul className="space-y-1.5 text-sm" style={{ color: "#8899bb" }}>
                  <li>• Cosa fa l'attività</li>
                  <li>• Quale problema vuole risolvere</li>
                  <li>• Cosa usa adesso</li>
                  <li>• Budget disponibile</li>
                  <li>• Chi prende la decisione finale</li>
                </ul>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#4ade80" }}>Seconda parte — 15/20 min</p>
                <ul className="space-y-1.5 text-sm" style={{ color: "#8899bb" }}>
                  <li>• Presenta 3-4 soluzioni concrete</li>
                  <li>• Sempre con prezzi chiari</li>
                  <li>• Usa esempi per settore specifico</li>
                  <li>• Chiudi fissando il prossimo passo</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold" style={{ color: "#4a5568" }}>
              <TrendingUp className="h-3.5 w-3.5" />
              Regola: 70% ascolto, 30% parlare
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" style={{ color: "#f59e0b" }} />
              <h3 className="font-bold text-foreground">Gestire le Obiezioni</h3>
            </div>
            <div className="space-y-4">
              {OBJECTIONS.map((o) => (
                <div key={o.q}>
                  <p className="text-sm font-semibold mb-1.5" style={{ color: "#f59e0b" }}>{o.q}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#8899bb" }}>{o.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Come usare il CRM */}
      <section>
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#3a4a6a" }}>
          Come usare il CRM — Flusso operativo
        </p>
        <Card>
          <div className="p-5 space-y-0">
            {[
              { icon: Zap, label: "Lead arriva", desc: "Trovi il contatto nella Pipeline › tab Lead. Controlla servizio richiesto, budget e tempistica prima di chiamare.", color: "#00d4ff" },
              { icon: Phone, label: "Dopo il primo contatto", desc: "Sposta il lead su 'Contattato'. Se fissi la call, sposta su 'Call fissata' e aggiorna la data.", color: "#a78bfa" },
              { icon: Euro, label: "Dopo la call", desc: "Vai su Preventivi › Nuovo preventivo. Inserisci servizio, importo, note e allega il PDF se ce l'hai.", color: "#f59e0b" },
              { icon: CheckCircle2, label: "Alla chiusura", desc: "Clicca su 'Pagato' nel preventivo accettato. Inserisci numero fattura e carica la ricevuta. Il lead si sposta automaticamente in Chiusure.", color: "#4ade80" },
            ].map((row, i, arr) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className={`flex gap-4 ${i < arr.length - 1 ? "pb-5 border-b" : ""}`} style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5" style={{ background: `${row.color}18`, border: `1px solid ${row.color}30` }}>
                    <Icon className="h-4 w-4" style={{ color: row.color }} />
                  </div>
                  <div className={i < arr.length - 1 ? "pb-5" : ""}>
                    <p className="font-semibold text-sm text-foreground mb-1">{row.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#8899bb" }}>{row.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Download CTA */}
      <Card>
        <div className="flex flex-col items-center gap-4 p-8 text-center md:flex-row md:text-left md:justify-between">
          <div>
            <p className="font-bold text-foreground mb-1">Vuoi la guida completa in PDF?</p>
            <p className="text-sm" style={{ color: "#6677aa" }}>
              Scarica il documento ufficiale Falcon Agency con pipeline, listino e strategia di vendita.
            </p>
          </div>
          <a
            href="/guida-venditore.pdf"
            download="Falcon_Guida_Venditore.pdf"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all shrink-0 whitespace-nowrap"
            style={{
              background: "rgba(0,212,255,0.12)",
              border: "1px solid rgba(0,212,255,0.4)",
              color: "#00d4ff",
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.22)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.12)")}
          >
            <Download className="h-4 w-4" />
            Scarica Guida PDF
          </a>
        </div>
      </Card>
    </div>
  );
}
