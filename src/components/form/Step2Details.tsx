import type { FormState, ServiceKey } from "./types";

interface Props {
  state: FormState;
  setAnswer: (key: string, value: string) => void;
  setBudget: (value: string) => void;
  setTimeline: (value: string) => void;
}

const questionsByService: Record<ServiceKey, { key: string; label: string; type: "text" | "options"; options?: string[]; placeholder?: string }[]> = {
  sito_web: [
    { key: "site_type", label: "Che tipo di sito ti serve?", type: "options", options: ["Landing page", "Sito vetrina", "E-commerce", "Web app"] },
    { key: "pages", label: "Hai già contenuti o struttura?", type: "text", placeholder: "Descrivi brevemente..." },
  ],
  piattaforma_ai: [
    { key: "ai_use_case", label: "Qual è il caso d'uso principale?", type: "text", placeholder: "Es. assistente clienti, analisi documenti..." },
    { key: "data_source", label: "Hai già dati o documenti da usare?", type: "options", options: ["Sì, molti", "Pochi", "Non ancora"] },
  ],
  gestionale: [
    { key: "process", label: "Quale processo vuoi gestire?", type: "text", placeholder: "Es. ordini, magazzino, clienti..." },
    { key: "users", label: "Quanti utenti useranno il gestionale?", type: "options", options: ["1-5", "5-20", "20-100", "100+"] },
  ],
  automazione_ai_agent: [
    { key: "task", label: "Quale task vuoi automatizzare?", type: "text", placeholder: "Es. risposte email, lead qualification..." },
    { key: "tools", label: "Con quali tool deve integrarsi?", type: "text", placeholder: "Es. HubSpot, Slack, Gmail..." },
  ],
  altro: [
    { key: "idea", label: "Raccontaci la tua idea", type: "text", placeholder: "Descrivi il tuo progetto..." },
    { key: "goal", label: "Qual è l'obiettivo principale?", type: "text", placeholder: "Cosa vuoi ottenere?" },
  ],
};

const budgets = ["< €1.000", "€1.000–€5.000", "€5.000–€15.000", "€15.000+"];
const timelines = ["Prima possibile", "1-3 mesi", "3-6 mesi", "Non ho fretta"];

export function Step2Details({ state, setAnswer, setBudget, setTimeline }: Props) {
  const qs = state.service ? questionsByService[state.service] : [];

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Step 2 / 4</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-bold">Raccontaci di più</h2>
        <p className="mt-2 text-muted-foreground">Più dettagli ci dai, più precisa sarà la risposta del tuo Falcon.</p>
      </div>

      <div className="space-y-5">
        {qs.map((q) => (
          <div key={q.key}>
            <label className="block text-sm font-medium mb-2">{q.label}</label>
            {q.type === "text" ? (
              <textarea
                value={state.answers[q.key] || ""}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                className="w-full p-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {q.options!.map((opt) => {
                  const active = state.answers[q.key] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswer(q.key, opt)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        active ? "neon-border border-primary bg-primary/10 text-primary" : "border-border bg-card/60 hover:border-primary/60"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-2">Budget indicativo</label>
          <div className="grid grid-cols-2 gap-2">
            {budgets.map((b) => {
              const active = state.budget === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget(b)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    active ? "neon-border border-primary bg-primary/10 text-primary" : "border-border bg-card/60 hover:border-primary/60"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quando vuoi iniziare?</label>
          <div className="grid grid-cols-2 gap-2">
            {timelines.map((t) => {
              const active = state.timeline === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeline(t)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    active ? "neon-border border-primary bg-primary/10 text-primary" : "border-border bg-card/60 hover:border-primary/60"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
