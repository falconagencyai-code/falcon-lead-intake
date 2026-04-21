import { CheckCircle2 } from "lucide-react";

export function Step4ThankYou() {
  return (
    <div className="text-center space-y-8 animate-slide-in py-8">
      <div
        className="inline-flex items-center justify-center w-24 h-24 rounded-full animate-pulse-glow"
        style={{ background: "var(--gradient-cyan)" }}
      >
        <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
      </div>
      <div>
        <h2
          className="font-bold text-white text-glow"
          style={{ fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          Il tuo Falcon ti contatterà presto 🦅
        </h2>
        <p className="mt-5 text-lg max-w-md mx-auto" style={{ color: "#6677aa" }}>
          Abbiamo ricevuto la tua richiesta. Entro 24h riceverai una risposta dal nostro team.
        </p>
      </div>
      <div
        className="inline-block px-6 py-3 rounded-full text-sm"
        style={{
          border: "1px solid rgba(0,212,255,0.4)",
          background: "rgba(0,212,255,0.06)",
          color: "#00d4ff",
        }}
      >
        🚀 Preparati al decollo
      </div>
    </div>
  );
}
