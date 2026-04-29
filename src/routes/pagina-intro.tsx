import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

const FORM_PATH = "/form-contatto-1";
const ACCENT = "#22d3ee";

export const Route = createFileRoute("/pagina-intro")({
  head: () => ({
    meta: [
      { title: "Falcon Agency · Il tuo business, potenziato dall'AI" },
      {
        name: "description",
        content:
          "Siti web, gestionali su misura e automazioni intelligenti. Per qualsiasi tipo di attività.",
      },
    ],
  }),
  component: PaginaIntro,
});

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CtaButton({ children }: { children: ReactNode }) {
  return (
    <Link
      to={FORM_PATH}
      className="btn-primary inline-flex items-center gap-2 animate-pulse-glow"
    >
      {children}
    </Link>
  );
}

function ImagePlaceholder({
  label,
  height = "h-64",
}: {
  label: string;
  height?: string;
}) {
  return (
    /* SOSTITUIRE con immagine reale */
    <div
      className={`flex w-full items-center justify-center rounded-2xl border ${height}`}
      style={{
        borderColor: "rgba(34,211,238,0.18)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <span className="text-sm" style={{ color: "#6677aa" }}>
        [ {label} ]
      </span>
    </div>
  );
}

function PaginaIntro() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#070b14" }}
    >
      {/* Ambient blobs — cyan only, fixed so persistono allo scroll */}
      <div aria-hidden className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: "rgba(34,211,238,0.18)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "rgba(34,211,238,0.10)" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{ background: "rgba(34,211,238,0.14)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: "rgba(34,211,238,0.06)" }}
        />
      </div>
      <div className="fixed inset-0 circuit-bg pointer-events-none z-0" />

      {/* NAVBAR */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "rgba(7,11,20,0.7)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <span
            className="text-[12px] font-medium tracking-[0.3em] uppercase"
            style={{ color: ACCENT }}
          >
            Falcon Agency
          </span>
          <Link
            to={FORM_PATH}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{ background: ACCENT, color: "#070b14" }}
          >
            Parlaci →
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-6 py-16 md:py-24 text-white">
        {/* BLOCCO 1 — HERO */}
        <section className="text-center">
          <Reveal>
            <p
              className="text-[13px] tracking-[0.3em] uppercase font-medium"
              style={{ color: ACCENT }}
            >
              Falcon Agency
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              className="mt-4 font-bold tracking-tight"
              style={{
                fontSize: "clamp(40px, 7.5vw, 68px)",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                textShadow:
                  "0 0 32px rgba(34,211,238,0.35), 0 0 64px rgba(34,211,238,0.18)",
              }}
            >
              Il tuo business,
              <br />
              potenziato dall'AI.
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed"
              style={{ color: "#8a9bbf" }}
            >
              Siti web, gestionali su misura e automazioni intelligenti.
              Per qualsiasi tipo di attività.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-10 flex justify-center">
              <CtaButton>Raccontaci il tuo progetto →</CtaButton>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 2 — PROBLEMA */}
        <section className="mt-28 space-y-6">
          <Reveal>
            <h2
              className="text-3xl font-bold"
              style={{ textShadow: "0 0 24px rgba(34,211,238,0.2)" }}
            >
              Ogni attività ha le stesse difficoltà.
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-lg leading-relaxed" style={{ color: "#a8b5d1" }}>
              Processi manuali che rubano tempo. Nessun sistema per gestire clienti,
              appuntamenti o ordini. Un sito vecchio o inesistente. La sensazione che
              i competitor stiano andando avanti mentre tu sei fermo.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed" style={{ color: "#a8b5d1" }}>
              Il problema non sei tu — è che nessuno ti ha ancora dato gli strumenti
              giusti. Strumenti che oggi esistono, costano meno di quello che pensi,
              e si costruiscono in giorni, non mesi.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ImagePlaceholder label="screenshot progetto reale" />
          </Reveal>
        </section>

        {/* BLOCCO 3 — SERVIZI */}
        <section className="mt-28 -mx-6 md:-mx-[calc((min(64rem,100vw)-42rem)/2)]">
          <div className="mx-auto max-w-5xl px-6 space-y-12">
            <Reveal>
              <h2
                className="text-3xl font-bold text-center"
                style={{ textShadow: "0 0 24px rgba(34,211,238,0.2)" }}
              >
                Cosa costruiamo per te.
              </h2>
            </Reveal>

            <ServiceBlock
              badge="SITI WEB"
              title="La tua presenza online, curata nei dettagli."
              text="Design professionale, veloce e ottimizzato. Il tuo sito è pronto in giorni, non mesi — e rispecchia esattamente chi sei."
              imageUrl="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/f430ce1d4679856f68bdf00811688554-1777472192246.png"
              animation={<BrowserTypewriter />}
            />

            <ServiceBlock
              badge="GESTIONALE AI"
              title="Gestisci tutto da un unico pannello."
              text="Prenotazioni, clienti, agenda, statistiche. Un gestionale costruito attorno alla tua attività — non un software generico che devi adattare a te."
              imageUrl="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/08c593725f05c57921d5e38c586b836f-1777472162177.png"
              animation={<DashboardAnim />}
              reverse
            />

            <ServiceBlock
              badge="AUTOMAZIONI AI"
              title="Il tuo business lavora anche quando tu non puoi."
              text="Risposte automatiche, conferme appuntamento, notifiche, follow-up. L'AI gestisce la comunicazione, tu gestisci il business."
              imageUrl="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/81ae04c1b141e95da9dc73575c11e785-1777472375825.png"
              animation={<ChatAnim />}
            />
          </div>
        </section>

        {/* BLOCCO 4 — PROVA VISIVA */}
        <section className="mt-28 space-y-6">
          <Reveal>
            <h2
              className="text-3xl font-bold"
              style={{ textShadow: "0 0 24px rgba(34,211,238,0.2)" }}
            >
              Ecco come appare nella realtà.
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-lg leading-relaxed" style={{ color: "#a8b5d1" }}>
              Non mockup, non demo. Screenshot reali di ciò che consegniamo ai nostri clienti.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ImagePlaceholder
              label="screenshot gestionale / sito cliente 1"
              height="h-80"
            />
            <p className="mt-3 text-center text-sm" style={{ color: "#6677aa" }}>
              Gestionale prenotazioni — consegnato in 5 giorni
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <ImagePlaceholder
                label="screenshot sito cliente 2"
                height="h-80"
              />
              <p
                className="mt-3 text-center text-sm"
                style={{ color: "#6677aa" }}
              >
                Sito web con integrazione booking — da zero a online in 72 ore
              </p>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 5 — CTA INTERMEDIO */}
        <section className="mt-28">
          <Reveal>
            <div
              className="rounded-2xl p-8 text-center border"
              style={{
                borderColor: "rgba(34,211,238,0.25)",
                background:
                  "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(34,211,238,0.02))",
                boxShadow: "0 0 48px rgba(34,211,238,0.12)",
              }}
            >
              <h3 className="text-2xl font-bold text-white">
                Hai già un'idea in testa?
              </h3>
              <p className="mx-auto mt-3 max-w-md" style={{ color: "#a8b5d1" }}>
                Raccontacela. In 20 minuti capiamo insieme cosa ti serve e ti
                diciamo quanto costa.
              </p>
              <div className="mt-6 flex justify-center">
                <CtaButton>Prenota una call gratuita →</CtaButton>
              </div>
              <p className="mt-4 text-xs" style={{ color: "#6677aa" }}>
                Nessun impegno · Risposta entro 24h
              </p>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 6 — COME FUNZIONA */}
        <section className="mt-28 space-y-8">
          <Reveal>
            <h2
              className="text-3xl font-bold"
              style={{ textShadow: "0 0 24px rgba(34,211,238,0.2)" }}
            >
              Come funziona.
            </h2>
          </Reveal>

          {[
            {
              n: "1",
              title: "Ci parli del tuo progetto",
              text: "Una call gratuita di 20 minuti. Ascoltiamo cosa hai bisogno, senza tecnicismi.",
            },
            {
              n: "2",
              title: "Definiamo insieme il prodotto",
              text: "Ti diciamo esattamente cosa costruiamo, in quanto tempo e a quanto. Nessuna sorpresa dopo.",
            },
            {
              n: "3",
              title: "Ti consegniamo il risultato",
              text: "Veloce, testato, pronto all'uso. E restiamo al tuo fianco anche dopo la consegna.",
            },
          ].map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="flex items-start gap-4">
                <span
                  className="text-5xl font-black leading-none"
                  style={{
                    color: ACCENT,
                    textShadow: "0 0 24px rgba(34,211,238,0.5)",
                  }}
                >
                  {s.n}
                </span>
                <div className="pt-1">
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                  <p
                    className="mt-2 text-lg leading-relaxed"
                    style={{ color: "#a8b5d1" }}
                  >
                    {s.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* BLOCCO 7 — CHIUSURA */}
        <section className="mt-28 text-center">
          <Reveal>
            <h2
              className="text-4xl font-black text-white"
              style={{
                textShadow:
                  "0 0 32px rgba(34,211,238,0.4), 0 0 64px rgba(34,211,238,0.2)",
              }}
            >
              Inizia oggi.
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p
              className="mx-auto mt-4 max-w-lg text-lg leading-relaxed"
              style={{ color: "#a8b5d1" }}
            >
              La prima call è gratuita. Ti diciamo in 20 minuti se e come possiamo
              aiutarti — senza impegno.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex justify-center">
              <CtaButton>Raccontaci il tuo progetto →</CtaButton>
            </div>
            <p className="mt-4 text-sm" style={{ color: "#6677aa" }}>
              ✓ Prima consulenza gratuita · ✓ Risposta in 24h · ✓ Nessun costo iniziale
            </p>
          </Reveal>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        className="relative z-10 border-t py-8"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <p className="text-center text-xs" style={{ color: "#6677aa" }}>
          FALCON AGENCY · © 2026
        </p>
      </footer>
    </div>
  );
}
