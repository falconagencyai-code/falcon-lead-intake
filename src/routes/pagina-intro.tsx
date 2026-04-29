import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, TrendingUp, Target, Clock } from "lucide-react";

export const Route = createFileRoute("/pagina-intro")({
  head: () => ({
    meta: [
      { title: "Falcon Agency · Crescita reale per il tuo business" },
      {
        name: "description",
        content:
          "Strategie di advertising e marketing digitale che generano lead qualificati e clienti reali. Prenota una call gratuita.",
      },
      { property: "og:title", content: "Falcon Agency · Crescita reale per il tuo business" },
      {
        property: "og:description",
        content:
          "Strategie di advertising e marketing digitale che generano lead qualificati e clienti reali.",
      },
    ],
  }),
  component: PaginaIntro,
});

const FORM_PATH = "/form-contatto-1";
const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  x = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  x?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- NAVBAR ---------- */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-black/60 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/pagina-intro" className="text-sm font-extrabold uppercase tracking-[0.2em] text-white">
          Falcon Agency
        </Link>
        <Link
          to={FORM_PATH}
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-cyan-400 hover:text-cyan-300"
        >
          Prenota una call
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#080810] pt-32">
      {/* Static glow blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-32 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT */}
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-cyan-400 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5" />
              Agenzia AI-First · Risultati misurabili
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mt-8 text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
              Smetti di
              <br />
              inseguire clienti.
              <br />
              <span className="text-cyan-400">Inizia a chiuderli.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md text-lg text-zinc-400">
              Strategie di advertising e marketing digitale che generano lead qualificati e clienti reali — non solo numeri.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10">
              <Link
                to={FORM_PATH}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-black transition-all hover:bg-zinc-100"
              >
                Inizia la valutazione
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-6 flex flex-wrap gap-2">
              {["✓ Nessun impegno", "✓ Risposta in 24h", "✓ Prima call gratuita"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* RIGHT */}
        <div className="relative mx-auto h-[440px] w-full max-w-[420px]">
          {/* Hexagon shield */}
          <Reveal delay={0.2}>
            <div className="relative mx-auto h-[400px] w-[340px] rotate-12">
              <svg viewBox="0 0 200 220" className="absolute inset-0 h-full w-full drop-shadow-[0_0_60px_rgba(34,211,238,0.35)]">
                <defs>
                  <linearGradient id="hexG" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgb(34,211,238)" />
                    <stop offset="100%" stopColor="rgb(124,58,237)" />
                  </linearGradient>
                </defs>
                <polygon
                  points="100,10 185,60 185,160 100,210 15,160 15,60"
                  fill="url(#hexG)"
                  opacity="0.9"
                />
                <polygon
                  points="100,10 185,60 185,160 100,210 15,160 15,60"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </Reveal>

          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
            className="absolute left-0 top-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
          >
            📈 +210% ROAS
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: EASE }}
            className="absolute bottom-8 right-0 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
          >
            🎯 47 lead/mese
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.6, ease: EASE }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/15 bg-black/60 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md"
          >
            ⚡ Setup in 7 giorni
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- STATS (white) ---------- */
function Stats() {
  const cards = [
    { v: "€2M+", l: "Budget gestito", pos: "left-2 top-4 md:left-8 md:top-12", Icon: TrendingUp },
    { v: "47+", l: "Clienti attivi", pos: "right-2 top-8 md:right-10 md:top-20", Icon: Target },
    { v: "3.8x", l: "ROAS medio", pos: "left-4 bottom-12 md:left-16 md:bottom-20", Icon: TrendingUp },
    { v: "24/7", l: "Monitoraggio attivo", pos: "right-4 bottom-8 md:right-16 md:bottom-16", Icon: Clock },
  ];
  return (
    <section className="relative overflow-hidden bg-white py-32">
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden">
          <Reveal>
            <h2 className="text-center text-7xl font-black leading-[0.85] tracking-tight text-zinc-950 md:text-9xl">
              L'impatto,
              <br />
              <span className="text-violet-600">Misurato.</span>
            </h2>
          </Reveal>

          {cards.map((c, i) => (
            <motion.div
              key={c.l}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
              className={`absolute ${c.pos} z-10 rounded-2xl border border-violet-200 bg-white px-5 py-4 shadow-xl shadow-violet-900/5`}
            >
              <c.Icon className="h-4 w-4 text-violet-600" />
              <p className="mt-2 text-3xl font-black text-zinc-950 md:text-4xl">{c.v}</p>
              <p className="text-xs uppercase tracking-wider text-zinc-500">{c.l}</p>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.4}>
          <p className="mt-16 text-center text-sm text-zinc-500">
            Dati aggiornati · Clienti reali · Nessuna stima
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- PRODUCT MOCKUPS ---------- */
function MockPipeline() {
  const steps = ["Nuovo", "Contattato", "Call", "Preventivo", "Chiuso"];
  const colors = ["bg-zinc-600", "bg-zinc-500", "bg-cyan-700", "bg-cyan-500", "bg-cyan-400"];
  const leads = [
    { n: "M. Rossi", v: "€2.4k" },
    { n: "L. Bianchi", v: "€5.1k" },
    { n: "A. Verdi", v: "€3.8k" },
    { n: "G. Neri", v: "€7.2k" },
    { n: "F. Galli", v: "€4.5k" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <p className="mb-6 text-xs uppercase tracking-wider text-zinc-400">Pipeline · Gennaio 2026</p>
      <div className="relative flex items-center justify-between">
        <div className="absolute left-4 right-4 top-3 h-px bg-gradient-to-r from-zinc-700 via-cyan-700 to-cyan-400" />
        {steps.map((s, i) => (
          <div key={s} className="relative z-10 flex flex-col items-center">
            <div className={`h-6 w-6 rounded-full ${colors[i]} border-2 border-zinc-950`} />
            <p className="mt-2 text-[10px] font-medium text-white">{s}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-5 gap-2">
        {leads.map((l) => (
          <div key={l.n} className="rounded-md border border-white/5 bg-white/5 p-2">
            <p className="truncate text-[10px] text-white">{l.n}</p>
            <p className="text-[10px] font-bold text-cyan-400">{l.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockChart() {
  const months = ["Set", "Ott", "Nov", "Dic", "Gen", "Feb"];
  const inc = [60, 75, 70, 90, 85, 100];
  const exp = [30, 35, 32, 40, 38, 42];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Entrate vs Uscite</p>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-zinc-400"><span className="h-2 w-2 rounded-sm bg-cyan-400" />Entrate</span>
          <span className="flex items-center gap-1 text-zinc-400"><span className="h-2 w-2 rounded-sm bg-violet-400" />Uscite</span>
        </div>
      </div>
      <div className="flex h-40 items-end gap-3">
        {months.map((m, i) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-1">
              <div style={{ height: `${inc[i] * 1.3}px` }} className="flex-1 rounded-t bg-cyan-400" />
              <div style={{ height: `${exp[i] * 1.3}px` }} className="flex-1 rounded-t bg-violet-400" />
            </div>
            <p className="text-[10px] text-zinc-500">{m}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockReport() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <p className="mb-4 text-xs uppercase tracking-wider text-zinc-400">Report settimanale</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Entrate", v: "€18k" },
          { l: "Lead", v: "94" },
          { l: "ROAS", v: "4.2x" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-white/5 bg-white/5 p-3">
            <p className="text-[10px] uppercase text-zinc-500">{k.l}</p>
            <p className="mt-1 text-2xl font-black text-white">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {[
          { c: "Meta Ads", v: "+€8.2k" },
          { c: "Google Ads", v: "+€6.5k" },
          { c: "LinkedIn", v: "+€3.3k" },
        ].map((r) => (
          <div key={r.c} className="flex items-center justify-between rounded-md border border-white/5 bg-white/5 px-3 py-2">
            <span className="text-xs text-zinc-300">{r.c}</span>
            <span className="text-xs font-bold text-cyan-400">{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewBlock({
  num,
  title,
  text,
  visual,
  reverse = false,
}: {
  num: string;
  title: string;
  text: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <Reveal x={reverse ? 40 : -40}>
        <div>
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-xs font-bold text-cyan-400">
            {num}
          </span>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h3>
          <p className="mt-4 text-lg text-zinc-400">{text}</p>
        </div>
      </Reveal>
      <Reveal x={reverse ? -40 : 40} delay={0.15}>
        {visual}
      </Reveal>
    </div>
  );
}

function PreviewSection() {
  return (
    <section className="bg-zinc-950 py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Tutto sotto controllo,
              <br />
              <span className="text-cyan-400">sempre.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Dal primo lead al cliente pagante, ogni step è tracciato e ottimizzato.
            </p>
          </div>
        </Reveal>

        <div className="mt-24 space-y-32">
          <PreviewBlock
            num="01"
            title="Pipeline CRM completa"
            text="Ogni lead segue un percorso preciso. Vedi in tempo reale dove si trova ogni trattativa."
            visual={<MockPipeline />}
          />
          <PreviewBlock
            reverse
            num="02"
            title="Contabilità e analytics in tempo reale"
            text="Entrate, uscite e utile netto sempre aggiornati. Nessun foglio Excel."
            visual={<MockChart />}
          />
          <PreviewBlock
            num="03"
            title="Report automatici"
            text="Ogni settimana sai esattamente cosa ha funzionato, cosa ottimizzare e quanto hai guadagnato."
            visual={<MockReport />}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- PROCESS ---------- */
function Process() {
  const steps = [
    { t: "Analisi gratuita", d: "Studiamo il tuo mercato, i competitor e gli obiettivi reali. Nessun template." },
    { t: "Strategia su misura", d: "Una roadmap costruita solo per te: canali, budget, messaggi e KPI chiari." },
    { t: "Esecuzione e ottimizzazione", d: "Lanciamo, testiamo e miglioriamo ogni settimana. Dati alla mano." },
    { t: "Risultati e crescita", d: "Report settimanali, numeri reali, decisioni basate sui dati." },
  ];
  return (
    <section className="relative overflow-hidden bg-black py-32">
      {/* Dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(rgb(255,255,255) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl font-black tracking-tight text-white md:text-5xl">
            Il nostro processo
            <br />
            <span className="text-cyan-400">in 4 step.</span>
          </h2>
        </Reveal>

        <div className="relative mt-20">
          <div className="absolute bottom-10 left-1/2 top-10 hidden border-l-2 border-dashed border-white/10 md:block" />
          <div className="space-y-10">
            {steps.map((s, i) => {
              const offset = i % 2 === 0 ? "md:mr-16" : "md:ml-16";
              return (
                <Reveal key={s.t} delay={i * 0.12} x={i % 2 === 0 ? -30 : 30}>
                  <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md ${offset}`}>
                    <span className="pointer-events-none absolute -right-2 -top-6 select-none text-7xl font-black text-white/10">
                      0{i + 1}
                    </span>
                    <h3 className="text-xl font-bold text-white">{s.t}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{s.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- RESULTS (white) ---------- */
function Results() {
  const cards = [
    { tag: "E-commerce", color: "bg-violet-100 text-violet-700", v: "+210%", s: "ROAS in 60 giorni", d: "Budget €3k/mese · Meta Ads" },
    { tag: "B2B Services", color: "bg-cyan-100 text-cyan-700", v: "47", s: "lead qualificati/mese", d: "Budget €1.5k/mese · Google + LinkedIn" },
    { tag: "Local Business", color: "bg-emerald-100 text-emerald-700", v: "€18k", s: "fatturato aggiuntivo", d: "Budget €800/mese · Meta Ads" },
  ];
  return (
    <section className="bg-white py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl font-black tracking-tight text-zinc-950 md:text-5xl">
            Risultati reali,
            <br />
            <span className="text-violet-600">non promesse.</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.tag} delay={i * 0.12}>
              <div className="h-full rounded-2xl border border-violet-200 bg-white p-7 shadow-md">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${c.color}`}>
                  {c.tag}
                </span>
                <p className="mt-6 text-5xl font-black tracking-tight text-zinc-950">{c.v}</p>
                <p className="mt-1 text-sm font-medium text-zinc-700">{c.s}</p>
                <p className="mt-4 text-xs text-zinc-500">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FINAL CTA ---------- */
function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-black py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 opacity-30">
        <svg viewBox="0 0 200 220" className="h-full w-full blur-3xl">
          <defs>
            <linearGradient id="ctaG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgb(34,211,238)" />
              <stop offset="100%" stopColor="rgb(124,58,237)" />
            </linearGradient>
          </defs>
          <polygon points="100,10 185,60 185,160 100,210 15,160 15,60" fill="url(#ctaG)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Pronto a crescere?</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white md:text-6xl">
            Porta Falcon Agency
            <br />
            nel tuo business.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400">
            Compila il form in 3 minuti. Ti ricontattiamo entro 24 ore per la tua call gratuita.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="mt-10">
            <Link
              to={FORM_PATH}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-lg font-bold text-black transition-all hover:bg-zinc-100"
            >
              Inizia ora
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-5 text-sm text-zinc-400">
              Nessun impegno · Nessuna carta di credito · Solo risultati
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white">Falcon Agency</p>
        <p className="text-xs text-zinc-500">© 2026 · Privacy Policy</p>
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
    <div className="min-h-screen bg-black font-sans text-white antialiased">
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <PreviewSection />
        <Process />
        <Results />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
