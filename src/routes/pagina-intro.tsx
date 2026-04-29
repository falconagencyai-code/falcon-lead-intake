import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

const FORM_PATH = "/form-contatto-1";

export const Route = createFileRoute("/pagina-intro")({
  component: AdvertorialPage,
  head: () => ({
    meta: [
      { title: "Falcon Agency · Il tuo business ha bisogno di un salto" },
      {
        name: "description",
        content:
          "Siti web, gestionali su misura e automazioni AI per la tua attività. Veloce, concreto, tuo.",
      },
    ],
  }),
});

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CtaButton({ children, large = false }: { children: ReactNode; large?: boolean }) {
  return (
    <Link
      to={FORM_PATH}
      className={`inline-flex items-center justify-center rounded-xl bg-cyan-400 font-semibold text-zinc-950 transition-all hover:bg-cyan-300 hover:shadow-[0_0_32px_rgba(34,211,238,0.4)] ${
        large ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"
      }`}
    >
      {children}
    </Link>
  );
}

function ImagePlaceholder({ label, height = "h-64" }: { label: string; height?: string }) {
  return (
    /* SOSTITUIRE con immagine reale */
    <div
      className={`flex w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-800/60 ${height}`}
    >
      <span className="text-sm text-zinc-500">[ {label} ]</span>
    </div>
  );
}

function AdvertorialPage() {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 font-[Inter,system-ui,sans-serif] text-zinc-100 antialiased">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6 md:px-0">
          <span className="text-sm font-black tracking-widest text-white">FALCON AGENCY</span>
          <Link
            to={FORM_PATH}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300"
          >
            Parlaci →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16 md:px-0 md:py-24">
        {/* BLOCCO 1 — HOOK */}
        <section className="text-center">
          <Reveal>
            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white md:text-5xl">
              Il tuo business ha bisogno di un salto.
              <br />
              <span className="text-cyan-400">Noi lo facciamo con l'AI.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
              Che tu abbia un ristorante, uno studio, un negozio o un'idea — costruiamo ciò di cui hai
              bisogno: sito web, gestionale su misura o automazione intelligente. Veloce, concreto, tuo.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8">
              <CtaButton large>Raccontaci il tuo progetto →</CtaButton>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 2 — PROBLEMA */}
        <section className="mt-24 space-y-6">
          <Reveal>
            <h2 className="text-3xl font-bold text-white">Ogni attività ha le stesse difficoltà.</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-lg leading-relaxed text-zinc-300">
              Processi manuali che rubano tempo. Nessun sistema per gestire clienti, appuntamenti o
              ordini. Un sito vecchio o inesistente. La sensazione che i competitor stiano andando avanti
              mentre tu sei fermo.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-zinc-300">
              Il problema non sei tu — è che nessuno ti ha ancora dato gli strumenti giusti. Strumenti
              che oggi esistono, costano meno di quello che pensi, e si costruiscono in giorni, non mesi.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ImagePlaceholder label="screenshot progetto reale" />
          </Reveal>
        </section>

        {/* BLOCCO 3 — SOLUZIONE */}
        <section className="mt-24 space-y-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-white">Cosa costruiamo per te.</h2>
          </Reveal>

          {[
            {
              title: "Sito web professionale",
              text: "Design moderno, veloce, ottimizzato. Non un template uguale a mille altri — una presenza online che rispecchia chi sei e converte i visitatori in clienti.",
            },
            {
              title: "Gestionale AI su misura",
              text: "Prenotazioni, clienti, magazzino, fatture. Un pannello costruito attorno alla tua attività specifica — non un software generico che devi adattare a te.",
            },
            {
              title: "Automazioni intelligenti",
              text: "Risposte automatiche, gestione ordini, notifiche, report. Il tuo business lavora anche quando tu non puoi.",
            },
          ].map((b, i) => (
            <Reveal key={b.title} delay={i * 0.08}>
              <div className="border-l-2 border-cyan-400 pl-4">
                <h3 className="text-xl font-bold text-cyan-400">{b.title}</h3>
                <p className="mt-2 text-lg leading-relaxed text-zinc-300">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* BLOCCO 4 — PROVA VISIVA */}
        <section className="mt-24 space-y-6">
          <Reveal>
            <h2 className="text-3xl font-bold text-white">Ecco come appare nella realtà.</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-lg leading-relaxed text-zinc-300">
              Non mockup, non demo. Screenshot reali di ciò che consegniamo ai nostri clienti.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ImagePlaceholder label="screenshot gestionale / sito cliente 1" height="h-80" />
            <p className="mt-3 text-center text-sm text-zinc-400">
              Gestionale prenotazioni — consegnato in 5 giorni
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <ImagePlaceholder label="screenshot sito cliente 2" height="h-80" />
              <p className="mt-3 text-center text-sm text-zinc-400">
                Sito web con integrazione booking — da zero a online in 72 ore
              </p>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 5 — CTA INTERMEDIO */}
        <section className="mt-24">
          <Reveal>
            <div className="rounded-2xl bg-zinc-900 p-8 text-center">
              <h3 className="text-2xl font-bold text-white">Hai già un'idea in testa?</h3>
              <p className="mx-auto mt-3 max-w-md text-zinc-400">
                Raccontacela. In 20 minuti capiamo insieme cosa ti serve e ti diciamo quanto costa.
              </p>
              <div className="mt-6">
                <CtaButton large>Prenota una call gratuita →</CtaButton>
              </div>
              <p className="mt-4 text-xs text-zinc-500">Nessun impegno · Risposta entro 24h</p>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 6 — COME FUNZIONA */}
        <section className="mt-24 space-y-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-white">Come funziona.</h2>
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
                <span className="text-5xl font-black leading-none text-cyan-400">{s.n}</span>
                <div className="pt-1">
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-lg leading-relaxed text-zinc-300">{s.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </section>

        {/* BLOCCO 7 — CHIUSURA */}
        <section className="mt-24 text-center">
          <Reveal>
            <h2 className="text-4xl font-black text-white">Inizia oggi.</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-zinc-300">
              La prima call è gratuita. Ti diciamo in 20 minuti se e come possiamo aiutarti — senza
              impegno.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8">
              <CtaButton large>Parla con noi ora →</CtaButton>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              ✓ Prima consulenza gratuita · ✓ Risposta in 24h · ✓ Nessun costo iniziale
            </p>
          </Reveal>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-8">
        <p className="text-center text-xs text-zinc-600">FALCON AGENCY · © 2026</p>
      </footer>
    </div>
  );
}
