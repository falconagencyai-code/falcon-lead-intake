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
    <div className="space-y-8 animate-slide-in">
      <div>
        <p className="label-section">Servizio</p>
        <h2 className="mt-3 font-bold text-white" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Di cosa hai bisogno?
        </h2>
        <p className="mt-3 text-base" style={{ color: "#6677aa" }}>
          Seleziona il servizio più vicino al tuo progetto.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map(({ key, label, desc, Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`glass glass-hover text-left p-5 ${active ? "glass-active" : ""}`}
            >
              <div
                className="relative flex items-center justify-center w-12 h-12 rounded-full"
                style={{
                  background: "rgba(0, 212, 255, 0.08)",
                  boxShadow: active
                    ? "0 0 24px rgba(0,212,255,0.45), inset 0 0 12px rgba(0,212,255,0.2)"
                    : "0 0 16px rgba(0,212,255,0.15)",
                }}
              >
                <Icon className="w-6 h-6" style={{ color: "#00d4ff" }} />
              </div>
              <h3 className="mt-4 text-white font-semibold" style={{ fontSize: "18px" }}>
                {label}
              </h3>
              <p className="mt-1" style={{ color: "#8899aa", fontSize: "13px" }}>
                {desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
