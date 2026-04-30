import { CheckCircle2, Mail, Phone } from "lucide-react";

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
          Abbiamo ricevuto la tua richiesta. Ti contatteremo telefonicamente entro 24h.
        </p>
      </div>

      {/* Email confirmation notice */}
      <div
        className="mx-auto max-w-sm rounded-2xl p-5 text-left space-y-3"
        style={{
          background: "rgba(0,212,255,0.05)",
          border: "1px solid rgba(0,212,255,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,212,255,0.12)" }}
          >
            <Mail className="w-4 h-4" style={{ color: "#00d4ff" }} />
          </div>
          <p className="text-sm font-semibold text-white">
            Controlla la tua email
          </p>
        </div>
        <p className="text-sm leading-relaxed pl-12" style={{ color: "#8899aa" }}>
          Ti abbiamo inviato un riepilogo di quello che hai inviato. Troverai anche un promemoria che ti conferma che ti chiameremo noi.
        </p>
        <p className="text-xs pl-12" style={{ color: "#6677aa" }}>
          📬 Non trovi la mail? Controlla anche la cartella <strong style={{ color: "#8899aa" }}>spam</strong> o <strong style={{ color: "#8899aa" }}>promozioni</strong>.
        </p>
      </div>

      {/* Phone contact reminder */}
      <div className="flex items-center justify-center gap-2 text-sm" style={{ color: "#6677aa" }}>
        <Phone className="w-4 h-4" style={{ color: "#00d4ff" }} />
        <span>Ti chiameremo entro <strong style={{ color: "#8899aa" }}>24 ore</strong> dal numero di Falcon Agency</span>
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
