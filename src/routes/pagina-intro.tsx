import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Zap,
  Globe,
  LayoutDashboard,
  Bot,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/pagina-intro")({
  head: () => ({
    meta: [
      { title: "Falcon Agency · Siti, gestionali e automazioni AI" },
      {
        name: "description",
        content:
          "Sviluppiamo siti web, gestionali su misura e automazioni AI per qualsiasi attività. Consegna rapida, prima call gratuita.",
      },
      { property: "og:title", content: "Falcon Agency · Siti, gestionali e automazioni AI" },
      {
        property: "og:description",
        content:
          "Sviluppiamo siti web, gestionali su misura e automazioni AI per qualsiasi attività.",
      },
    ],
  }),
  component: PaginaIntro,
});

const FORM_PATH = "/form-contatto-1";
const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------- Reusable reveal ---------- */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- Animated counter ---------- */
function Counter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(value.replace(/[0-9]/g, "0"));

  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(value);
    if (isNaN(num)) {
      setDisplay(value);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = num * eased;
      const formatted = value.includes(".")
        ? cur.toFixed(1)
        : Math.round(cur).toString();
      setDisplay(formatted + value.replace(/[0-9.]/g, ""));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ---------- NAVBAR ---------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/80 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <span className="text-sm font-black uppercase tracking-[0.18em] text-zinc-900">
          Falcon Agency
        </span>
        <Link
          to={FORM_PATH}
          className="group inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-600"
        >
          Parlaci del tuo progetto
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function BrowserMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl shadow-teal-900/10">
      {/* Browser bar */}
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <div className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-zinc-500 ring-1 ring-zinc-200">
          falcon.agency/progetto
        </div>
      </div>

      {/* SOSTITUIRE con screenshot reale del progetto */}
      <div className="flex h-[300px] bg-white md:h-[340px]">
        {/* Sidebar */}
        <div className="flex w-1/4 flex-col gap-2 border-r border-zinc-100 bg-zinc-50/60 p-3">
          <div className="h-2 w-3/4 rounded bg-teal-400/60" />
          <div className="mt-2 space-y-1.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded ${i === 1 ? "w-full bg-teal-200" : "w-2/3 bg-zinc-200"}`}
              />
            ))}
          </div>
        </div>
        {/* Main */}
        <div className="flex-1 p-4">
          <div className="h-3 w-1/2 rounded bg-zinc-300" />
          <div className="mt-2 h-2 w-1/3 rounded bg-zinc-200" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-zinc-100 p-2">
                <div className="h-1.5 w-1/2 rounded bg-zinc-200" />
                <div className="mt-1.5 h-3 w-3/4 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
          {/* mini chart */}
          <div className="mt-4 flex h-24 items-end gap-1.5 rounded-lg border border-zinc-100 p-2">
            {[40, 65, 50, 80, 55, 90, 70, 95].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-t ${i % 2 === 0 ? "bg-teal-400" : "bg-zinc-300"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-32">
      {/* soft teal gradient at top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-teal-50 via-white to-white" />
      <div className="pointer-events-none absolute -right-20 top-10 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pb-28 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-500/20">
              <Zap className="h-3.5 w-3.5" />
              Consegna rapida · Risultati garantiti
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-zinc-900 md:text-6xl">
              Il tuo business,
              <br />
              potenziato dall'AI.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-5 max-w-md text-lg text-zinc-500">
              Siti web, gestionali su misura e automatizzazioni AI. Consegnati
              in tempi rapidi, per qualsiasi tipo di attività.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8">
              <Link
                to={FORM_PATH}
                className="group inline-flex items-center gap-2 rounded-full bg-teal-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/35"
              >
                Raccontaci il tuo progetto
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-zinc-500">
              {[
                "Risposta entro 24h",
                "Nessun costo iniziale",
                "Prima call gratuita",
              ].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-500" />
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Visual */}
        <div className="relative">
          <Reveal delay={0.15}>
            <BrowserMock />
          </Reveal>

          {/* Floating mini badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
            {["Sito web", "Gestionale AI", "Automazione"].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm"
              >
                <Check className="h-3.5 w-3.5 text-teal-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- STATS ---------- */
function Stats() {
  const stats = [
    { v: "48h", l: "Tempo medio di risposta al brief" },
    { v: "100%", l: "Progetti consegnati nei tempi" },
    { v: "3 in 1", l: "Sito · Gestionale · Automazione" },
  ];
  return (
    <section className="border-y border-zinc-100 bg-zinc-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.l} delay={i * 0.1}>
              <p className="text-5xl font-black tracking-tight text-zinc-900 md:text-6xl">
                <Counter value={s.v} />
              </p>
              <p className="mt-3 text-sm text-zinc-500">{s.l}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.4}>
          <p className="mt-12 text-center text-xs text-zinc-400">
            Lavoriamo con attività di ogni settore e dimensione
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- WHAT WE DO ---------- */
function ServiceCard({
  Icon,
  title,
  text,
  tag,
  visualComment,
  visual,
  delay = 0,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  tag: string;
  visualComment: string;
  visual: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm text-zinc-500">{text}</p>

        {/* {visualComment} */}
        <div className="mt-5 h-32 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/70">
          {visual}
        </div>

        <span className="mt-4 inline-block text-xs font-semibold text-teal-700">
          {tag}
        </span>
      </div>
    </Reveal>
  );
}

function WhatWeDo() {
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900 md:text-5xl">
              Qualunque sia la tua attività,
              <br />
              <span className="font-serif italic text-teal-600">
                abbiamo la soluzione.
              </span>
            </h2>
            <p className="mt-4 text-base text-zinc-500">
              Non vendiamo pacchetti standard. Costruiamo esattamente ciò di cui
              hai bisogno.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <ServiceCard
            Icon={Globe}
            title="Il tuo sito, fatto bene"
            text="Design professionale, veloce e ottimizzato. Pronto in pochi giorni, non mesi."
            tag="Da €X · Consegna in X giorni"
            visualComment="screenshot sito cliente"
            visual={
              <div className="flex h-full flex-col p-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                </div>
                <div className="mt-2 h-2 w-3/4 rounded bg-zinc-300" />
                <div className="mt-1.5 h-2 w-1/2 rounded bg-zinc-200" />
                <div className="mt-3 grid flex-1 grid-cols-3 gap-1.5">
                  <div className="rounded bg-teal-200/60" />
                  <div className="rounded bg-zinc-200" />
                  <div className="rounded bg-zinc-200" />
                </div>
              </div>
            }
            delay={0}
          />
          <ServiceCard
            Icon={LayoutDashboard}
            title="Il tuo gestionale su misura"
            text="Prenotazioni, inventario, clienti, fatture. Tutto in un pannello pensato per la tua attività."
            tag="Su misura · Nessun abbonamento esterno"
            visualComment="screenshot gestionale cliente"
            visual={
              <div className="flex h-full p-3">
                <div className="flex w-1/4 flex-col gap-1">
                  <div className="h-1.5 w-full rounded bg-teal-300" />
                  <div className="h-1.5 w-3/4 rounded bg-zinc-200" />
                  <div className="h-1.5 w-3/4 rounded bg-zinc-200" />
                  <div className="h-1.5 w-3/4 rounded bg-zinc-200" />
                </div>
                <div className="ml-3 flex flex-1 flex-col gap-1.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-6 rounded bg-zinc-200" />
                    <div className="h-6 rounded bg-zinc-200" />
                    <div className="h-6 rounded bg-teal-200/70" />
                  </div>
                  <div className="flex flex-1 items-end gap-1">
                    {[40, 70, 55, 85, 60].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${h}%` }}
                        className="flex-1 rounded-t bg-teal-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
            }
            delay={0.1}
          />
          <ServiceCard
            Icon={Bot}
            title="Fai lavorare il tuo business da solo"
            text="Risposte automatiche, gestione ordini, notifiche, report. Tu ti concentri sul business, ci pensa l'AI."
            tag="Risparmia ore ogni settimana"
            visualComment="flow automazione cliente"
            visual={
              <div className="flex h-full items-center justify-between p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
                  IN
                </div>
                <div className="h-px flex-1 bg-zinc-300" />
                <div className="h-8 w-8 rounded-md bg-zinc-300" />
                <div className="h-px flex-1 bg-zinc-300" />
                <div className="h-8 w-8 rounded-md bg-zinc-300" />
                <div className="h-px flex-1 bg-zinc-300" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                  OK
                </div>
              </div>
            }
            delay={0.2}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- HOW WE WORK ---------- */
function HowWeWork() {
  const steps = [
    {
      n: "01",
      t: "Ci parli del tuo progetto",
      d: "Una call di 20 minuti. Ascoltiamo, capiamo, proponiamo.",
    },
    {
      n: "02",
      t: "Definiamo insieme il prodotto",
      d: "Brief chiaro, tempi certi, costo fisso. Nessuna sorpresa.",
    },
    {
      n: "03",
      t: "Ti consegniamo il risultato",
      d: "Sito, gestionale o automazione. Pronto, funzionante, tuo.",
    },
  ];
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgb(255,255,255) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl font-black tracking-tight text-white md:text-5xl">
            Tre passi.
            <br />
            <span className="text-teal-400">Dal brief al prodotto finito.</span>
          </h2>
        </Reveal>

        <div className="relative mt-16">
          {/* dashed connector desktop */}
          <div className="absolute left-[16%] right-[16%] top-10 hidden border-t-2 border-dashed border-teal-400/30 md:block" />
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <div className="relative text-center md:text-left">
                  <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/30 md:mx-0">
                    <span className="text-3xl font-black text-teal-400">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-white">{s.t}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.4}>
          <div className="mt-16 text-center">
            <Link
              to={FORM_PATH}
              className="group inline-flex items-center gap-2 rounded-full bg-teal-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:bg-teal-400"
            >
              Inizia ora — è gratis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- WORK PREVIEWS ---------- */
function ProjectCard({
  type,
  title,
  sector,
  result,
  delay = 0,
}: {
  type: string;
  title: string;
  sector: string;
  result: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
        {/* INSERIRE screenshot progetto reale */}
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
          <img
            src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='100%25' height='100%25' fill='%23f4f4f5'/%3E%3C/svg%3E"
            alt={`Anteprima ${title} — ${type}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-zinc-400">
            // INSERIRE screenshot progetto reale
          </div>
        </div>
        <div className="p-6">
          <span className="inline-block rounded-full bg-teal-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-700">
            {type}
          </span>
          <h3 className="mt-4 text-lg font-bold text-zinc-900">{title}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-600">
              {sector}
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-600">
              {result}
            </span>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function WorkPreviews() {
  const projects = [
    { type: "Sito Web", title: "Progetto Cliente 1", sector: "Ristorazione", result: "+x prenotazioni" },
    { type: "Gestionale", title: "Progetto Cliente 2", sector: "Studio professionale", result: "-x ore/settimana" },
    { type: "Automazione", title: "Progetto Cliente 3", sector: "E-commerce", result: "Ordini gestiti 24/7" },
    { type: "Sito Web", title: "Progetto Cliente 4", sector: "Negozio locale", result: "+x clienti" },
  ];
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900 md:text-5xl">
              Quello che costruiamo,
              <br />
              <span className="font-serif italic text-teal-600">
                lo puoi vedere.
              </span>
            </h2>
            <p className="mt-4 text-base text-zinc-500">
              Esempi reali di ciò che realizziamo per i nostri clienti.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.title}
              type={p.type}
              title={p.title}
              sector={p.sector}
              result={p.result}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-950 via-zinc-950 to-zinc-950 py-32">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <span className="inline-block rounded-full bg-teal-400/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-teal-300">
            Inizia oggi
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
            Hai un'idea.
            <br />
            <span className="font-serif italic text-teal-300">
              Noi la costruiamo.
            </span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-300">
            Raccontaci cosa vuoi realizzare. Ti rispondiamo entro 24 ore con una
            proposta concreta.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10">
            <Link
              to={FORM_PATH}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-lg font-bold text-zinc-900 shadow-2xl transition-all hover:bg-zinc-100"
            >
              Parla con noi
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-zinc-400">
              {[
                "Nessun impegno",
                "Prima consulenza gratuita",
                "Risposta in 24h",
              ].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 md:flex-row">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
          Falcon Agency
        </p>
        <p className="text-xs text-zinc-500">
          © 2026 · hello@falcon.agency
        </p>
      </div>
    </footer>
  );
}

function PaginaIntro() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <WhatWeDo />
        <HowWeWork />
        <WorkPreviews />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
