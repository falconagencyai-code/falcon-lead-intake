import { useEffect } from "react";
import { CalendarDays } from "lucide-react";

export function Step5Calendly() {
  useEffect(() => {
    if (document.querySelector('script[src*="calendly"]')) return;
    const s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl"
          style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)" }}
        >
          <CalendarDays className="w-6 h-6" style={{ color: "#00d4ff" }} />
        </div>
        <h2 className="font-bold text-white" style={{ fontSize: "clamp(18px, 3vw, 24px)" }}>
          Prenota la tua call gratuita
        </h2>
        <p className="text-sm" style={{ color: "#6677aa" }}>
          30 minuti per capire come possiamo aiutarti. Scegli il momento che preferisci.
        </p>
      </div>

      {/* Calendly inline widget */}
      <div
        className="calendly-inline-widget overflow-hidden rounded-2xl"
        data-url="https://calendly.com/falconagency-ai/30min?hide_event_type_details=1&hide_gdpr_banner=1&background_color=070b14&text_color=c8d8e8&primary_color=00d4ff"
        style={{ minWidth: 280, height: 620 }}
      />

    </div>
  );
}
