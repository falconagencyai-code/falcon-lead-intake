import { CheckCircle2, Mail, Phone } from "lucide-react";

export function Step4ThankYou() {
  return (
    <div className="text-center space-y-6 animate-slide-in py-6">
      {/* Check icon */}
      <div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full animate-pulse-glow"
        style={{ background: "var(--gradient-cyan)" }}
      >
        <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
      </div>

      {/* Title */}
      <div>
        <h2
          className="font-bold text-white"
          style={{ fontSize: "clamp(22px, 3.5vw, 30px)", letterSpacing: "-0.01em", lineHeight: 1.2 }}
        >
          Richiesta inviata con successo ✓
        </h2>
        <p className="mt-3 text-base max-w-sm mx-auto" style={{ color: "#8899aa" }}>
          Abbiamo ricevuto tutto. Ecco cosa succede adesso.
        </p>
      </div>

      {/* Two prominent notice blocks */}
      <div className="mx-auto max-w-sm space-y-3 text-left">

        {/* Email block */}
        <div
          className="rounded-2xl p-4 flex gap-4 items-start"
          style={{
            background: "rgba(0,212,255,0.07)",
            border: "1px solid rgba(0,212,255,0.25)",
          }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: "rgba(0,212,255,0.15)" }}
          >
            <Mail className="w-5 h-5" style={{ color: "#00d4ff" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              📧 Email di conferma in arrivo
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
              Riceverai un riepilogo della tua richiesta entro{" "}
              <strong style={{ color: "#ffffff" }}>5 minuti</strong>. Se non la trovi, controlla{" "}
              <strong style={{ color: "#c9d6ea" }}>spam</strong> o{" "}
              <strong style={{ color: "#c9d6ea" }}>promozioni</strong>.
            </p>
          </div>
        </div>

        {/* Phone block */}
        <div
          className="rounded-2xl p-4 flex gap-4 items-start"
          style={{
            background: "rgba(0,212,255,0.07)",
            border: "1px solid rgba(0,212,255,0.25)",
          }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: "rgba(0,212,255,0.15)" }}
          >
            <Phone className="w-5 h-5" style={{ color: "#00d4ff" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">
              📞 Ti contatteremo telefonicamente
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#8899aa" }}>
              Un membro del team ti chiamerà entro{" "}
              <strong style={{ color: "#ffffff" }}>24 ore</strong> per discutere il tuo progetto.
            </p>
          </div>
        </div>
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
