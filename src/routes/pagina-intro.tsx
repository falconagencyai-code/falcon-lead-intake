import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  Users,
  BarChart3,
  Target,
  Map,
  Rocket,
  LineChart,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/pagina-intro")({
  head: () => ({
    meta: [
      { title: "Falcon Agency — Marketing digitale che genera risultati" },
      {
        name: "description",
        content:
          "Strategie di marketing digitale e advertising che generano lead qualificati e clienti reali. Prenota una call gratuita.",
      },
      { property: "og:title", content: "Falcon Agency — Marketing digitale che genera risultati" },
      {
        property: "og:description",
        content:
          "Strategie di marketing digitale e advertising che generano lead qualificati e clienti reali.",
      },
    ],
  }),
  component: PaginaIntro,
});

const FORM_PATH = "/form-contatto-1";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative w-full ${className}`}>
      {children}
    </section>
  );
}

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
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: { opacity: 0, y: 32 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

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
        scrolled
          ? "border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/pagina-intro" className="text-lg font-extrabold tracking-tight">
          <span className="text-cyan-400">Falcon</span>
          <span className="text-white"> Agency</span>
        </Link>
        <Link
          to={FORM_PATH}
          className="group inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/5 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
        >
          Prenota una call
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <Section id="hero" className="min-h-screen overflow-hidden pt-32">
      <div ref={ref} className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl flex-col items-center justify-center px-6 text-center">
        {/* Glow blobs */}
        <motion.div
          style={{ y }}
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[120px]"
        />
        <motion.div
          style={{ y }}
          className="pointer-events-none absolute right-0 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[100px]"
        />
        <motion.div
          style={{ y }}
          className="pointer-events-none absolute left-0 bottom-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-teal-500/15 blur-[100px]"
        />

        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Agenzia AI-First · Risultati misurabili
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] } } }}
          className="mt-8 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
        >
          Porta la tua azienda{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            al livello successivo.
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] } } }}
          className="mt-6 max-w-2xl text-lg text-zinc-400 md:text-xl"
        >
          Strategie di marketing digitale e advertising che generano lead qualificati e clienti reali — non solo click.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ ...fadeUp, show: { ...fadeUp.show, transition: { duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] } } }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            to={FORM_PATH}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-7 py-3.5 text-base font-semibold text-zinc-950 shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-all hover:shadow-[0_0_60px_rgba(34,211,238,0.5)]"
          >
            Inizia la valutazione gratuita
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#preview"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-medium text-white backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/10"
          >
            Scopri come lavoriamo
          </a>
        </motion.div>
      </div>
    </Section>
  );
}

function Stats() {
  const stats = [
    { value: "€ 2M+", label: "Budget ads gestito", Icon: TrendingUp },
    { value: "47+", label: "Clienti soddisfatti", Icon: Users },
    { value: "3.8x", label: "ROAS medio clienti", Icon: BarChart3 },
  ];
  return (
    <Section className="bg-zinc-900/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.12}>
              <div className="group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-white/5 p-8 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:bg-white/[0.07]">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl transition-opacity group-hover:opacity-60" />
                <s.Icon className="h-7 w-7 text-cyan-400" />
                <p className="mt-6 text-5xl font-extrabold tracking-tight text-white">{s.value}</p>
                <p className="mt-2 text-sm uppercase tracking-wider text-zinc-400">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

function MiniDashboard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
        <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">LIVE</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { l: "Lead oggi", v: "47" },
          { l: "ROAS", v: "4.2x" },
          { l: "Spent", v: "€312" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg border border-white/5 bg-white/5 p-3">
            <p className="text-[10px] uppercase text-zinc-500">{k.l}</p>
            <p className="mt-1 text-lg font-bold text-white">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex h-28 items-end gap-1.5">
        {[40, 65, 50, 80, 60, 95, 70, 88, 72, 100, 85, 92].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500/40 to-cyan-300"
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] text-zinc-500">
        <span>Lun</span><span>Mar</span><span>Mer</span><span>Gio</span><span>Ven</span><span>Sab</span><span>Dom</span>
      </div>
    </div>
  );
}

function MiniPipeline() {
  const steps = [
    { l: "Lead", c: "bg-cyan-400" },
    { l: "Qualificato", c: "bg-teal-400" },
    { l: "Proposta", c: "bg-blue-400" },
    { l: "Cliente", c: "bg-emerald-400" },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-wider text-zinc-400">Pipeline · Q1 2026</p>
      <div className="mt-6 space-y-4">
        {steps.map((s, i) => (
          <div key={s.l} className="flex items-center gap-3">
            <div className={`h-8 w-8 shrink-0 rounded-full ${s.c} flex items-center justify-center text-xs font-bold text-zinc-950`}>
              {i + 1}
            </div>
            <div className="flex-1 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{s.l}</span>
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">
                  {[124, 68, 31, 14][i]}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full ${s.c}`} style={{ width: `${[100, 55, 25, 12][i]}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniReports() {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Report mensile</p>
        <span className="text-[10px] text-zinc-500">Aggiornato 2 min fa</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Conversion</p>
          <p className="mt-1 text-2xl font-bold text-cyan-300">+24%</p>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
          <p className="text-[10px] uppercase text-zinc-500">CPA</p>
          <p className="mt-1 text-2xl font-bold text-teal-300">-18%</p>
        </div>
      </div>
      <svg viewBox="0 0 200 80" className="mt-4 h-24 w-full">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,60 L20,50 L40,55 L60,40 L80,45 L100,30 L120,35 L140,20 L160,25 L180,15 L200,10 L200,80 L0,80 Z" fill="url(#g)" />
        <path d="M0,60 L20,50 L40,55 L60,40 L80,45 L100,30 L120,35 L140,20 L160,25 L180,15 L200,10" stroke="rgb(34,211,238)" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

function PreviewRow({
  title,
  text,
  visual,
  reverse = false,
}: {
  title: string;
  text: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`grid grid-cols-1 items-center gap-12 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <Reveal>
        <div>
          <h3 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h3>
          <p className="mt-4 text-lg text-zinc-400">{text}</p>
        </div>
      </Reveal>
      <Reveal delay={0.15}>{visual}</Reveal>
    </div>
  );
}

function PreviewSection() {
  return (
    <Section id="preview" className="py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Tutto sotto controllo, sempre.
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Dal primo lead al cliente pagante, tracciamo ogni step del tuo percorso.
            </p>
          </div>
        </Reveal>
        <div className="mt-24 space-y-32">
          <PreviewRow
            title="Dashboard completa in tempo reale"
            text="Vedi ogni lead, ogni trattativa e ogni euro che entra — in un'unica interfaccia."
            visual={<MiniDashboard />}
          />
          <PreviewRow
            reverse
            title="Pipeline CRM integrata"
            text="Ogni lead segue un percorso preciso: dal primo contatto alla firma del contratto."
            visual={<MiniPipeline />}
          />
          <PreviewRow
            title="Report e analytics automatici"
            text="Niente fogli Excel. I numeri che contano, sempre aggiornati."
            visual={<MiniReports />}
          />
        </div>
      </div>
    </Section>
  );
}

function Process() {
  const steps = [
    { Icon: Target, title: "Analisi gratuita", text: "Capiamo il tuo business, il mercato e gli obiettivi concreti." },
    { Icon: Map, title: "Strategia su misura", text: "Nessun template. Una strategia costruita solo per te." },
    { Icon: Rocket, title: "Esecuzione e ottimizzazione", text: "Lanciamo, testiamo e miglioriamo ogni settimana." },
    { Icon: LineChart, title: "Risultati misurabili", text: "Report chiari, numeri reali, crescita costante." },
  ];
  return (
    <Section className="bg-zinc-900/40 py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Il nostro processo in 4 step
            </h2>
          </div>
        </Reveal>
        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent lg:block" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.12}>
                <div className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-zinc-950 backdrop-blur-md">
                    <s.Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Results() {
  const cards = [
    {
      sector: "E-commerce",
      metric: "+210% ROAS in 60 giorni",
      detail: "Budget: €3.000/mese · Canale: Meta Ads",
    },
    {
      sector: "B2B Services",
      metric: "47 lead qualificati/mese",
      detail: "Budget: €1.500/mese · Canale: Google Ads + LinkedIn",
    },
    {
      sector: "Local Business",
      metric: "€18k fatturato aggiuntivo",
      detail: "Budget: €800/mese · Canale: Meta Ads",
    },
  ];
  return (
    <Section className="py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Risultati reali, non promesse
            </h2>
          </div>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.sector} delay={i * 0.12}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:bg-white/[0.07]">
                <span className="inline-block rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  {c.sector}
                </span>
                <p className="mt-6 text-3xl font-extrabold leading-tight text-white">{c.metric}</p>
                <p className="mt-4 text-sm text-zinc-400">{c.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

function FinalCTA() {
  return (
    <Section className="relative overflow-hidden py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cyan-900/40 via-blue-900/30 to-zinc-950" />
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Pronto a far crescere il tuo business?
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-300">
            Compila il form in 3 minuti. Ti ricontattiamo entro 24 ore per fissare la tua call gratuita.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10">
            <Link
              to={FORM_PATH}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 px-8 py-4 text-lg font-semibold text-zinc-950 shadow-[0_0_50px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_70px_rgba(34,211,238,0.6)]"
            >
              Inizia ora
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-5 text-sm text-zinc-400">
              Nessun impegno. Nessuna carta di credito. Solo risultati.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="text-base font-extrabold">
          <span className="text-cyan-400">Falcon</span>
          <span className="text-white"> Agency</span>
        </div>
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-400 md:flex-row md:gap-6">
          <a href="#" className="transition-colors hover:text-cyan-300">Privacy policy</a>
          <a href="mailto:hello@falconagency.it" className="transition-colors hover:text-cyan-300">
            hello@falconagency.it
          </a>
        </div>
        <p className="text-xs text-zinc-500">© 2026 Falcon Agency</p>
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
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
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
