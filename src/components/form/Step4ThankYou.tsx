import { CheckCircle2 } from "lucide-react";

export function Step4ThankYou() {
  return (
    <div className="text-center space-y-6 animate-slide-in py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-cyan animate-pulse-glow">
        <CheckCircle2 className="w-10 h-10 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <div>
        <h2 className="text-3xl md:text-5xl font-bold text-glow">
          Il tuo Falcon ti contatterà presto 🦅
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          Abbiamo ricevuto la tua richiesta. Entro 24h riceverai una risposta dal nostro team.
        </p>
      </div>
      <div className="inline-block px-6 py-3 rounded-full border border-primary/40 bg-primary/5 text-sm text-primary">
        🚀 Preparati al decollo
      </div>
    </div>
  );
}
