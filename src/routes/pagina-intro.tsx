import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

function ServiceVisual({ imageUrl, animation }: { imageUrl: string; animation: ReactNode }) {
  const [phase, setPhase] = useState<"image" | "anim">("image");
  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p === "image" ? "anim" : "image")), phase === "image" ? 3000 : 4000);
    return () => clearTimeout(t);
  }, [phase]);
  return (
    <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
      <AnimatePresence mode="wait">
        {phase === "image" ? (
          <motion.img
            key="img"
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ) : (
          <motion.div
            key="anim"
            className="absolute inset-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {animation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ServiceBlock({
  badge,
  title,
  text,
  imageUrl,
  animation,
  reverse = false,
}: {
  badge: string;
  title: string;
  text: string;
  imageUrl: string;
  animation: ReactNode;
  reverse?: boolean;
}) {
  return (
    <Reveal>
      <div
        className={`grid md:grid-cols-2 gap-8 items-center rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}
      >
        <div>
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em]"
            style={{ background: "rgba(34,211,238,0.12)", color: ACCENT, border: "1px solid rgba(34,211,238,0.3)" }}
          >
            {badge}
          </span>
          <h3 className="mt-4 text-2xl md:text-3xl font-bold text-white leading-tight">{title}</h3>
          <p className="mt-4 text-zinc-300 leading-relaxed">{text}</p>
        </div>
        <ServiceVisual imageUrl={imageUrl} animation={animation} />
      </div>
    </Reveal>
  );
}

function BrowserTypewriter() {
  const phrases = [
    "La tua pizzeria, online.",
    "Il tuo studio, online.",
    "Il tuo negozio, online.",
    "La tua attività, online.",
  ];
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    const current = phrases[idx];
    if (typing) {
      if (text.length < current.length) {
        const t = setTimeout(() => setText(current.slice(0, text.length + 1)), 60);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setTyping(false), 1500);
      return () => clearTimeout(t);
    } else {
      if (text.length > 0) {
        const t = setTimeout(() => setText(text.slice(0, -1)), 30);
        return () => clearTimeout(t);
      }
      setTyping(true);
      setIdx((i) => (i + 1) % phrases.length);
    }
  }, [text, typing, idx]);
  return (
    <div className="w-full h-full flex flex-col bg-zinc-900">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-700 bg-zinc-800/60">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <div className="ml-3 flex-1 max-w-xs rounded-md bg-zinc-900 border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
          tuodominio.com
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <span
          className="text-xl md:text-2xl font-bold text-center"
          style={{ color: ACCENT, textShadow: "0 0 18px rgba(34,211,238,0.5)" }}
        >
          {text}
          <span className="inline-block w-[2px] h-5 ml-0.5 align-middle bg-cyan-400 animate-pulse" />
        </span>
      </div>
    </div>
  );
}

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const dur = 1500;
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur);
      setN(Math.floor(p * to));
      if (p === 1) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [to]);
  return (
    <span style={{ color: ACCENT }}>
      {prefix}
      {n.toLocaleString("it-IT")}
      {suffix}
    </span>
  );
}

function DashboardAnim() {
  return (
    <div className="w-full h-full bg-zinc-900 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Prenotazioni oggi", to: 12 },
          { label: "Questa settimana", to: 47 },
          { label: "Entrate mese", to: 3240, prefix: "€" },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-2">
            <div className="text-[9px] uppercase tracking-wider text-zinc-400">{k.label}</div>
            <div className="mt-1 text-lg font-bold">
              <Counter to={k.to} prefix={k.prefix ?? ""} />
            </div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="mt-auto flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/60 p-3"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-[11px] font-bold text-zinc-900">
          MR
        </div>
        <div className="flex-1 text-xs text-zinc-200">
          <span className="font-semibold">Marco R.</span> — 15:30
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
          Confermato
        </span>
      </motion.div>
    </div>
  );
}

function ChatAnim() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const delays = [800, 1200, 1400, 1200, 1400, 1500];
    if (step >= 6) {
      const t = setTimeout(() => setStep(0), 1800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep(step + 1), delays[step]);
    return () => clearTimeout(t);
  }, [step]);
  const Bubble = ({ side, children, accent = false }: { side: "l" | "r"; children: ReactNode; accent?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${side === "l" ? "self-start bg-zinc-700 text-zinc-100" : "self-end"} ${accent ? "border border-cyan-400/30 bg-cyan-400/20 text-cyan-100" : ""}`}
    >
      {children}
    </motion.div>
  );
  return (
    <div className="w-full h-full bg-zinc-900 p-4 flex flex-col gap-2 overflow-hidden">
      <AnimatePresence>
        {step >= 1 && <Bubble key="1" side="l">Ciao, avete disponibilità domani alle 15?</Bubble>}
        {step === 2 && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="self-end flex gap-1 rounded-2xl bg-cyan-400/20 border border-cyan-400/30 px-3 py-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </motion.div>
        )}
        {step >= 3 && <Bubble key="3" side="r" accent>Certo! Ho disponibile domani 15:00 e 16:30. Quale preferisci?</Bubble>}
        {step >= 4 && <Bubble key="4" side="l">15:00 perfetto grazie</Bubble>}
        {step >= 5 && <Bubble key="5" side="r" accent>✓ Appuntamento confermato per domani alle 15:00. Riceverai un promemoria!</Bubble>}
      </AnimatePresence>
    </div>
  );
}

function ProblemTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const items = [
    { y: 30, text: "Processi manuali che rubano tempo" },
    { y: 110, text: "Nessun sistema per clienti e appuntamenti" },
    { y: 190, text: "Sito web vecchio o assente" },
    { y: 250, text: "I competitor ti stanno superando" },
  ];
  // Smooth S-curve path with 2 curves, height ~280
  const path =
    "M 30 10 C 80 60, -10 110, 30 150 C 70 190, 80 240, 30 270";
  return (
    <div ref={ref} className="mx-auto w-full max-w-md" style={{ height: 280 }}>
      <div className="relative h-full">
        <svg
          width="60"
          height="280"
          viewBox="0 0 60 280"
          className="absolute left-0 top-0"
          style={{ overflow: "visible" }}
        >
          <motion.path
            d={path}
            fill="none"
            stroke="rgba(34,211,238,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          {items.map((it, i) => (
            <motion.circle
              key={i}
              cx="30"
              cy={it.y}
              r="6"
              fill="#22d3ee"
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.35 }}
              style={{ filter: "drop-shadow(0 0 8px rgba(34,211,238,0.8))" }}
            />
          ))}
        </svg>
        {items.map((it, i) => (
          <motion.div
            key={i}
            className="absolute text-sm md:text-base font-medium"
            style={{ left: 76, top: it.y - 12, color: "#a8b5d1" }}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 1.2 + i * 0.35 }}
          >
            {it.text}
          </motion.div>
        ))}
      </div>
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
          <Reveal delay={0.2}>
            <div className="mt-12 flex justify-center">
              <img
                src="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/08c593725f05c57921d5e38c586b836f-1777472162177.png"
                alt="Mockup gestionale Falcon Agency"
                className="hero-float w-full"
                style={{
                  maxWidth: "780px",
                  borderRadius: "12px",
                  boxShadow: "0 0 60px rgba(34,211,238,0.12)",
                }}
              />
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex justify-center">
              <CtaButton>Raccontaci il tuo progetto →</CtaButton>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 2 — PROBLEMA */}
        <section className="mt-28 space-y-6 text-center">
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
            <div className="mt-8 flex justify-center">
              <ProblemTimeline />
            </div>
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
            <img
              src="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/f430ce1d4679856f68bdf00811688554-1777472192246.png"
              alt="Gestionale prenotazioni"
              className="w-full object-cover"
              style={{ borderRadius: "12px" }}
            />
            <p className="mt-3 text-center text-sm" style={{ color: "#6677aa" }}>
              Gestionale prenotazioni — consegnato in 5 giorni
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8">
              <img
                src="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/81ae04c1b141e95da9dc73575c11e785-1777472375825.png"
                alt="Sito web con integrazione booking"
                className="w-full object-cover"
                style={{ borderRadius: "12px" }}
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
