import type { FormState, ServiceKey } from "./types";

interface Props {
  state: FormState;
  setAnswer: (key: string, value: string) => void;
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

function OptionGrid({ items, value, onSelect }: { items: string[]; value: string | null | undefined; onSelect: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`glass glass-hover px-4 py-4 text-sm font-medium text-white text-left ${active ? "glass-active" : ""}`}
            style={active ? { color: "#00d4ff" } : undefined}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export function Step2Details({ state, setAnswer }: Props) {
  const qs = state.service ? questionsByService[state.service] : [];

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <p className="label-section">Dettagli</p>
        <h2
          className="mt-3 font-bold text-white"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          Raccontaci di più
        </h2>
        <p className="mt-3 text-base" style={{ color: "#6677aa" }}>
          Più dettagli ci dai, più precisa sarà la risposta del tuo Falcon.
        </p>
      </div>

      <div className="space-y-7">
        {qs.map((q) => (
          <div key={q.key}>
            <label className="label-section block mb-3">{q.label}</label>
            {q.type === "text" ? (
              <textarea
                value={state.answers[q.key] || ""}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                placeholder={q.placeholder}
                rows={3}
                className="input-premium resize-none"
              />
            ) : (
              <OptionGrid items={q.options!} value={state.answers[q.key]} onSelect={(v) => setAnswer(q.key, v)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
