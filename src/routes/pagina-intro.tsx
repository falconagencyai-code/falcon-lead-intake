import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
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


function ServiceVisual({ imageUrl, animation }: { imageUrl: string; animation: ReactNode }) {
  const [phase, setPhase] = useState<"image" | "anim">("image");
  useEffect(() => {
    const t = setTimeout(() => setPhase((p) => (p === "image" ? "anim" : "image")), phase === "image" ? 5500 : 7000);
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
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        ) : (
          <motion.div
            key="anim"
            className="absolute inset-0 w-full h-full flex items-center justify-center"
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
  text: ReactNode;
  imageUrl: string;
  animation: ReactNode;
  reverse?: boolean;
}) {
  return (
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
  );
}

function ScrollRevealBlock({
  children,
  direction,
}: {
  children: ReactNode;
  direction: "left" | "right";
}) {
  const xStart = direction === "left" ? -60 : 60;
  return (
    <motion.div
      initial={{ opacity: 0, x: xStart }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

function ScrollTypewriter({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.45"],
  });
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      const count = Math.round(Math.max(0, Math.min(1, v)) * text.length);
      if (textRef.current) textRef.current.textContent = text.slice(0, count);
      if (caretRef.current)
        caretRef.current.style.opacity = count > 0 && count < text.length ? "1" : "0";
    });
  }, [scrollYProgress, text]);
  return (
    <h2 ref={ref} className={className} style={{ ...style, position: "relative" }}>
      <span style={{ visibility: "hidden" }}>{text}</span>
      <span style={{ position: "absolute", left: 0, right: 0, top: 0 }}>
        <span ref={textRef} />
        <span
          ref={caretRef}
          style={{
            display: "inline-block",
            width: 3,
            height: "0.9em",
            marginLeft: 2,
            verticalAlign: "-0.1em",
            background: ACCENT,
            opacity: 0,
            animation: "pulse 1s ease-in-out infinite",
          }}
        />
      </span>
    </h2>
  );
}

const BROWSER_PHRASES = [
  "La tua pizzeria, online.",
  "Il tuo studio, online.",
  "Il tuo negozio, online.",
  "La tua attività, online.",
];

function BrowserTypewriter() {
  const phrases = BROWSER_PHRASES;
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
    const start = performance.now();
    const dur = 1500;
    let rafId: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setN(Math.floor(p * to));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [to]);
  return (
    <span style={{ color: ACCENT }}>
      {prefix}{n.toLocaleString("it-IT")}{suffix}
    </span>
  );
}

const DASHBOARD_KPIS = [
  { label: "Prenotazioni oggi", to: 12 },
  { label: "Questa settimana", to: 47 },
  { label: "Entrate mese", to: 3240, prefix: "€" },
] as const;

function DashboardAnim() {
  return (
    <div className="w-full h-full bg-zinc-900 p-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {DASHBOARD_KPIS.map((k) => (
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
    const delays = [1200, 2200, 2500, 2000, 2800, 2200];
    if (step >= 6) {
      const t = setTimeout(() => setStep(0), 4000);
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

const STRONG_STYLE: React.CSSProperties = { color: "white", fontWeight: 600 };

const PROBLEMS: ReactNode[] = [
  <><strong style={STRONG_STYLE}>Processi manuali</strong> che rubano tempo</>,
  <>Nessun sistema per <strong style={STRONG_STYLE}>clienti e appuntamenti</strong></>,
  <><strong style={STRONG_STYLE}>Sito web vecchio</strong> o assente</>,
  <>I <strong style={STRONG_STYLE}>competitor ti stanno superando</strong></>,
];

const PATH_D =
  "M 50 0 C 50 30, 20 50, 50 80 C 80 110, 80 150, 50 160 C 20 170, 20 210, 50 230 C 80 250, 50 265, 50 280";

const NODE_POSITIONS = [
  { x: 50, y: 0, progress: 0.05 },
  { x: 50, y: 80, progress: 0.32 },
  { x: 50, y: 160, progress: 0.62 },
  { x: 50, y: 280, progress: 0.9 },
];

function ProblemNode({
  scrollYProgress,
  node,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  node: (typeof NODE_POSITIONS)[number];
}) {
  const opacity = useTransform(
    scrollYProgress,
    [node.progress - 0.04, node.progress + 0.04],
    [0, 1],
  );
  return (
    <motion.circle
      cx={node.x}
      cy={node.y}
      r="5"
      fill="#22d3ee"
      style={{
        opacity,
        filter: "drop-shadow(0 0 6px rgba(34,211,238,0.8))",
      }}
    />
  );
}

function ProblemLabel({
  scrollYProgress,
  node,
  index,
}: {
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  node: (typeof NODE_POSITIONS)[number];
  index: number;
}) {
  const opacity = useTransform(
    scrollYProgress,
    [node.progress - 0.04, node.progress + 0.08],
    [0, 1],
  );
  const yShift = useTransform(
    scrollYProgress,
    [node.progress - 0.04, node.progress + 0.08],
    [6, 0],
  );
  const isRight = index % 2 === 0;
  return (
    <motion.div
      style={{
        position: "absolute",
        top: `${(node.y / 290) * 100}%`,
        left: isRight ? "calc(50% + 20px)" : undefined,
        right: !isRight ? "calc(50% + 20px)" : undefined,
        transform: "translateY(-50%)",
        opacity,
        y: yShift,
        color: "#c9d6ea",
        fontSize: "13px",
        lineHeight: 1.4,
        maxWidth: "130px",
        textAlign: isRight ? "left" : "right",
        willChange: "transform, opacity",
      }}
    >
      {PROBLEMS[index]}
    </motion.div>
  );
}

function ProblemTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.4"],
  });

  return (
    <div
      ref={containerRef}
      className="relative mx-auto"
      style={{ width: 320, height: 320 }}
    >
      <svg
        viewBox="0 0 100 290"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
        overflow="visible"
      >
        <path
          d={PATH_D}
          fill="none"
          stroke="rgba(34,211,238,0.1)"
          strokeWidth="2"
        />
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            pathLength: scrollYProgress,
            filter: "drop-shadow(0 0 4px rgba(34,211,238,0.6))",
            willChange: "stroke-dashoffset",
          }}
        />
        {NODE_POSITIONS.map((node, i) => (
          <ProblemNode key={i} scrollYProgress={scrollYProgress} node={node} />
        ))}
      </svg>

      {NODE_POSITIONS.map((node, i) => (
        <ProblemLabel
          key={i}
          scrollYProgress={scrollYProgress}
          node={node}
          index={i}
        />
      ))}
    </div>
  );
}

function PaginaIntro() {
  return (
    <div
      className="relative min-h-screen"
      style={{ background: "#070b14" }}
    >
      {/* Ambient blobs — cyan only, fixed so persistono allo scroll. GPU-promoted to avoid recompositing on scroll. */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <div
          className="absolute -top-32 -left-32 w-[340px] h-[340px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 left-1/4 w-[360px] h-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.13) 0%, transparent 70%)" }}
        />
      </div>
      <div
        className="fixed inset-0 circuit-bg pointer-events-none z-0"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      />

      {/* NAVBAR */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "rgba(255,255,255,0.06)",
          background: "rgba(7,11,20,0.88)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img
              src="https://tpzpydnvcbcdkuthyweh.supabase.co/storage/v1/object/public/assets/falcon-wings-closed.png"
              alt="Falcon"
              style={{
                width: "36px",
                height: "36px",
                objectFit: "contain",
              }}
            />
            <span
              className="text-[12px] font-medium tracking-[0.3em] uppercase"
              style={{ color: "#22d3ee" }}
            >
              Falcon Agency
            </span>
          </div>
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
              style={{ color: "#b8c8e0" }}
            >
              <strong style={STRONG_STYLE}>Siti web</strong>, <strong style={STRONG_STYLE}>gestionali su misura</strong> e <strong style={STRONG_STYLE}>automazioni intelligenti</strong>.
              Per qualsiasi tipo di attività.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-12 flex justify-center">
              <img
                src="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/08c593725f05c57921d5e38c586b836f-1777472162177.png"
                alt="Mockup gestionale Falcon Agency"
                className="hero-float w-full"
                fetchPriority="high"
                decoding="async"
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
            <p className="text-lg leading-relaxed" style={{ color: "#c9d6ea" }}>
              Qualunque sia il settore, i problemi che frenano la crescita sono sempre gli stessi.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex justify-center">
              <ProblemTimeline />
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
                Vuoi capire cosa è possibile fare?
              </h3>
              <p className="mx-auto mt-3 max-w-md" style={{ color: "#c9d6ea" }}>
                Raccontaci la tua attività. Insieme capiamo cosa ti serve e ti proponiamo la soluzione giusta.
              </p>
              <div className="mt-6 flex justify-center">
                <CtaButton>Scopri cosa possiamo fare per te →</CtaButton>
              </div>
              <p className="mt-4 text-xs" style={{ color: "#6677aa" }}>
                Nessun impegno · Rispondiamo entro 24h
              </p>
            </div>
          </Reveal>
        </section>

        {/* BLOCCO 3 — SERVIZI */}
        <section className="mt-28 -mx-6 md:-mx-[calc((min(64rem,100vw)-42rem)/2)]">
          <div className="mx-auto max-w-5xl px-6 space-y-12 overflow-hidden">
            <ScrollTypewriter
              text="Cosa costruiamo per te."
              className="relative text-3xl font-bold text-center mx-auto"
              style={{
                textShadow: "0 0 24px rgba(34,211,238,0.2)",
                minHeight: "1.2em",
              }}
            />

            <ScrollRevealBlock direction="left">
              <ServiceBlock
                badge="SITI WEB"
                title="La tua presenza online, curata nei dettagli."
                text="Design professionale, veloce e ottimizzato. Il tuo sito è pronto in giorni, non mesi, e rispecchia esattamente chi sei."
                imageUrl="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/f430ce1d4679856f68bdf00811688554-1777472192246.png"
                animation={<BrowserTypewriter />}
              />
            </ScrollRevealBlock>

            <ScrollRevealBlock direction="right">
              <ServiceBlock
                badge="GESTIONALE AI"
                title="Gestisci tutto da un unico pannello."
                text="Prenotazioni, clienti, agenda, statistiche. Un gestionale costruito attorno alla tua attività, non un software generico da adattare a te."
                imageUrl="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/08c593725f05c57921d5e38c586b836f-1777472162177.png"
                animation={<DashboardAnim />}
                reverse
              />
            </ScrollRevealBlock>

            <ScrollRevealBlock direction="left">
              <ServiceBlock
                badge="AUTOMAZIONI AI"
                title="Il tuo business lavora anche quando tu non puoi."
                text="Risposte automatiche, conferme appuntamento, notifiche, follow-up. L'AI gestisce la comunicazione, tu gestisci il business."
                imageUrl="https://ytrnunswsbgyghzyhyqs.supabase.co/storage/v1/object/public/product-images/nano-banana/287ab373-0c94-4fda-82d8-bd28fa1f249a/81ae04c1b141e95da9dc73575c11e785-1777472375825.png"
                animation={<ChatAnim />}
              />
            </ScrollRevealBlock>
          </div>
        </section>

        {/* BLOCCO 6 — COME FUNZIONA */}
        <section className="mt-28 space-y-8">
          <Reveal>
            <h2
              className="text-3xl font-bold text-center"
              style={{ textShadow: "0 0 24px rgba(34,211,238,0.2)" }}
            >
              Come funziona.
            </h2>
          </Reveal>

          {[
            {
              n: "1",
              title: "Ci parli del tuo progetto",
              text: <>Una <strong style={STRONG_STYLE}>chiacchierata senza impegno</strong>. Ascoltiamo cosa hai in mente e ti aiutiamo a trovare la strada giusta.</>,
            },
            {
              n: "2",
              title: "Definiamo insieme il prodotto",
              text: <>Ti diciamo esattamente cosa costruiamo e come. <strong style={STRONG_STYLE}>Nessuna sorpresa</strong>.</>,
            },
            {
              n: "3",
              title: "Ti consegniamo il risultato",
              text: <><strong style={STRONG_STYLE}>Veloce, testato, pronto all'uso</strong>. E restiamo al tuo fianco anche dopo la consegna.</>,
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
                    style={{ color: "#c9d6ea" }}
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
              style={{ color: "#c9d6ea" }}
            >
              Raccontaci il tuo progetto. Troveremo insieme la soluzione più adatta a te.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex justify-center">
              <CtaButton>Raccontaci il tuo progetto →</CtaButton>
            </div>
            <p className="mt-4 text-sm" style={{ color: "#6677aa" }}>
              ✓ Nessun impegno · ✓ Risposta in 24h · ✓ Solo soluzioni concrete
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
