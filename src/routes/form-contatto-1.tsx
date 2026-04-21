import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { FalconMascot } from "@/components/FalconMascot";
import { Step1Service } from "@/components/form/Step1Service";
import { Step2Details } from "@/components/form/Step2Details";
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

function FormPage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));
  const setAnswer = (key: string, value: string) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }));

  const canAdvance = () => {
    if (step === 1) return state.service !== null;
    if (step === 2) return state.budget !== null && state.timeline !== null;
    if (step === 3)
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
      setStep(4);
    } catch (e) {
      console.error(e);
      toast.error("Errore nell'invio. Riprova tra poco.");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step === 3) return submit();
    setStep((s) => s + 1);
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const progress = (step / 4) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 circuit-bg opacity-30 pointer-events-none" />
      <Toaster theme="dark" />

      {/* Top bar */}
      <header className="relative z-10 px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-cyan flex items-center justify-center font-bold text-primary-foreground">F</div>
          <span className="font-semibold tracking-wide">Falcon Agency</span>
        </div>
        <span className="text-xs text-muted-foreground tracking-[0.2em] uppercase">
          {step < 4 ? `${step} di 4` : "Completato"}
        </span>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="h-1 w-full rounded-full bg-secondary/50 overflow-hidden">
          <div
            className="h-full gradient-cyan transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:py-14 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
        {/* Form card */}
        <section className="rounded-2xl border border-border bg-card/70 backdrop-blur-xl p-6 md:p-10 shadow-[var(--shadow-card)]">
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
              setBudget={(v) => update({ budget: v })}
              setTimeline={(v) => update({ timeline: v })}
            />
          )}
          {step === 3 && <Step3Contact state={state} update={update} />}
          {step === 4 && <Step4ThankYou />}

          {step < 4 && (
            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" /> Indietro
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance() || submitting}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-lg gradient-cyan text-primary-foreground font-semibold hover:scale-[1.03] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Invio...
                  </>
                ) : step === 3 ? (
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
          <FalconMascot step={step} celebrate={step === 4} />
          <p className="mt-6 text-center text-sm text-muted-foreground max-w-xs">
            {step === 1 && "Scegli il tuo punto di partenza. Sono qui per aiutarti a decollare."}
            {step === 2 && "Bene! Più sei preciso, meglio costruirò la proposta."}
            {step === 3 && "Ultimo passo. Lascia i tuoi contatti e parto subito."}
            {step === 4 && "Missione ricevuta! Decollerò entro 24 ore."}
          </p>
        </aside>
      </div>
    </main>
  );
}
