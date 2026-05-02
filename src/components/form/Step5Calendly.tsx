import { useEffect, useRef } from "react";
import { CalendarDays } from "lucide-react";

interface Props {
  fullName: string;
  email: string;
}

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (opts: {
        url: string;
        parentElement: HTMLElement;
        prefill?: { name?: string; email?: string };
        locale?: string;
      }) => void;
    };
  }
}

export function Step5Calendly({ fullName, email }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = () => {
      if (!containerRef.current || !window.Calendly) return;
      containerRef.current.innerHTML = ""; // reset per re-render
      window.Calendly.initInlineWidget({
        url: "https://calendly.com/falconagency-ai/30min?hide_event_type_details=1&hide_gdpr_banner=1&background_color=070b14&text_color=c8d8e8&primary_color=00d4ff",
        parentElement: containerRef.current,
        prefill: { name: fullName, email },
        locale: "it",
      });
    };

    if (window.Calendly) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = init;
    document.head.appendChild(script);
  }, [fullName, email]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event === 'calendly.event_scheduled') {
        const eventUri: string = e.data?.payload?.event?.uri ?? '';
        const eventUuid = eventUri.split('/').pop() ?? '';
        const eventId = eventUuid ? `cal-${eventUuid}` : `cal-${Date.now()}`;
        window.fbq?.('track', 'Lead', {}, { eventID: eventId });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl"
        style={{ minWidth: 280, height: 620 }}
      />
    </div>
  );
}
