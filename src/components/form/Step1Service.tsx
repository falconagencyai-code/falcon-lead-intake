import { Globe, Brain, Database, Bot, Sparkles } from "lucide-react";
import type { ServiceKey } from "./types";

interface Props {
  value: ServiceKey | null;
  onChange: (value: ServiceKey) => void;
}

const options: { key: ServiceKey; label: string; desc: string; Icon: typeof Globe }[] = [
  { key: "sito_web", label: "Sito Web", desc: "Landing, vetrina o e-commerce", Icon: Globe },
  { key: "piattaforma_ai", label: "Piattaforma AI", desc: "Prodotto AI custom end-to-end", Icon: Brain },
  { key: "gestionale", label: "Gestionale", desc: "Software interno o CRM su misura", Icon: Database },
  { key: "automazione_ai_agent", label: "Automazione con AI Agent", desc: "Workflow autonomi & integrazioni", Icon: Bot },
  { key: "altro", label: "Altro", desc: "Raccontaci la tua idea", Icon: Sparkles },
];

export function Step1Service({ value, onChange }: Props) {
  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Step 1 / 4</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-bold">Di cosa hai bisogno?</h2>
        <p className="mt-2 text-muted-foreground">Seleziona il servizio più vicino al tuo progetto.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(({ key, label, desc, Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`group relative text-left p-5 rounded-xl border bg-card/60 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary ${
                active ? "neon-border border-primary bg-primary/10" : "border-border"
              }`}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${active ? "gradient-cyan text-primary-foreground" : "bg-secondary text-primary"}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
