import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { FalconMascot } from "@/components/FalconMascot";
import { Step1Service } from "@/components/form/Step1Service";
import { Step2Details } from "@/components/form/Step2Details";
import { Step3BudgetTimeline } from "@/components/form/Step3BudgetTimeline";
import { Step3Contact } from "@/components/form/Step3Contact";
import { Step4ThankYou } from "@/components/form/Step4ThankYou";
import { initialState, type FormState, type ServiceKey } from "@/components/form/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/form-contatto-1")({
  head: () => ({
    meta: [
      { title: "Inizia il tuo progetto — Falcon Agency" },
      { name: "description", content: "Raccontaci il tuo progetto AI: piattaforme, agenti, automazioni e gestionali su misura." },
      { property: "og:title", content: "Inizia il tuo progetto — Falcon Agency" },
      { property: "og:description", content: "Compila il modulo: il tuo Falcon ti contatterà entro 24h." },
    ],
  }),
  component: FormPage,
});

function StepDots({ step, total = 5 }: { step: number; total?: number }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Step ${step} di ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= step;
        const current = idx === step;
        return (
          <span
            key={i}
            className={current ? "animate-dot-pulse" : ""}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: filled ? "#00d4ff" : "transparent",
              border: filled ? "1px solid rgba(0,212,255,0.9)" : "1px solid rgba(255,255,255,0.2)",
              boxShadow: filled && !current ? "0 0 10px rgba(0,212,255,0.6)" : undefined,
              display: "inline-block",
            }}
          />
        );
      })}
    </div>
  );
}

function FormPage() {
  const [step, setStep] = useState(1);
  const [visible, setVisible] = useState(true);
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));
  const setAnswer = (key: string, value: string) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));

  const canAdvance = () => {
    if (step === 1) return state.service !== null;
    if (step === 2) return true;
    if (step === 3) return state.budget !== null && state.timeline !== null;
    if (step === 4)
      return (
        state.fullName.trim().length > 1 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email) &&
        state.phone.trim().length >= 6
      );
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("leads").insert({
          full_name: state.fullName,
          email: state.email,
          phone: state.phone,
          company: state.company || null,
          service_interest: state.service,
          budget_range: state.budget,
          timeline: state.timeline,
          form_answers: state.answers,
          source: "landing_page",
          status: "pending",
        });
        if (error) throw error;
      } else {
        console.warn("Supabase non configurato — skip insert", state);
      }
      setStep(5);
    } catch (e) {
      console.error(e);
      toast.error("Errore nell'invio. Riprova tra poco.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeStep = (targetStep: number) => {
    setVisible(false);
    window.setTimeout(() => {
      setStep(targetStep);
      setVisible(true);
    }, 180);
  };

  const next = () => {
    if (step === 4) return submit();
    changeStep(step + 1);
  };
  const back = () => changeStep(Math.max(1, step - 1));

  const progress = (step / 5) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#070b14" }}>
      {/* Ambient blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "rgba(26,40,112,0.22)" }} />
        <div className="absolute top-10 -right-40 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "rgba(0,212,255,0.05)" }} />
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full blur-3xl" style={{ background: "rgba(26,40,112,0.18)" }} />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: "rgba(0,212,255,0.04)" }} />
      </div>
      <div className="absolute inset-0 circuit-bg pointer-events-none" />
      <Toaster theme="dark" />

      {/* Top bar */}
      <header className="relative z-10 px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
            style={{ background: "var(--gradient-cyan)", boxShadow: "0 0 16px rgba(0,212,255,0.35)" }}
          >
            F
          </div>
          <span className="font-semibold tracking-wide text-white">Falcon Agency</span>
        </div>
        <StepDots step={Math.min(step, 5)} />
      </header>

      {/* Progress bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="relative h-full gradient-progress overflow-hidden"
            style={{
              width: `${progress}%`,
              transition: "width 500ms cubic-bezier(0.4,0,0.2,1)",
              borderRadius: 999,
            }}
          >
            <div
              className="absolute inset-0 animate-shimmer"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                width: "40%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-start">
        {/* Form card */}
        <section
          className="p-6 md:p-10"
          style={{
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 24,
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 180ms ease, transform 180ms ease",
            }}
          >
            {step === 1 && (
              <Step1Service
                value={state.service}
                onChange={(v: ServiceKey) => update({ service: v })}
              />
            )}
            {step === 2 && (
              <Step2Details
                state={state}
                setAnswer={setAnswer}
              />
            )}
            {step === 3 && (
              <Step3BudgetTimeline
                budget={state.budget}
                timeline={state.timeline}
                setBudget={(v) => update({ budget: v })}
                setTimeline={(v) => update({ timeline: v })}
              />
            )}
            {step === 4 && <Step3Contact state={state} update={update} />}
            {step === 5 && <Step4ThankYou />}
          </div>

          {step < 5 && (
            <div className="mt-10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="btn-ghost inline-flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Indietro
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance() || submitting}
                className="btn-primary inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Invio...
                  </>
                ) : step === 4 ? (
                  <>Invia richiesta <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Avanti <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Mascot */}
        <aside className="hidden lg:flex flex-col items-center justify-center sticky top-10">
          <FalconMascot step={step} celebrate={step === 5} size={400} />
          <p className="mt-8 text-center text-sm max-w-xs" style={{ color: "#6677aa" }}>
            {step === 1 && "Scegli il tuo punto di partenza. Sono qui per aiutarti a decollare."}
            {step === 2 && "Perfetto! Dimmi di più sul tuo progetto."}
            {step === 3 && "Bene! Più sei preciso, meglio costruirò la proposta."}
            {step === 4 && "Ultimo passo. Lascia i tuoi contatti e parto subito."}
            {step === 5 && "Missione ricevuta! Decollerò entro 24 ore."}
          </p>
        </aside>
      </div>
    </main>
  );
}
