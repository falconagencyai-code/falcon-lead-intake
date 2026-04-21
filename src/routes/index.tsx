import { createFileRoute, Link } from "@tanstack/react-router";
import { FalconMascot } from "@/components/FalconMascot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Falcon Agency — AI-first agency" },
      { name: "description", content: "Costruiamo piattaforme AI, agenti, automazioni e gestionali su misura." },
    ],
  }),
  component: ComingSoon,
});

function ComingSoon() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6" style={{ background: "#070b14" }}>
      {/* Ambient blobs */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: "rgba(26,40,112,0.25)" }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "rgba(0,212,255,0.06)" }} />
        <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] rounded-full blur-3xl" style={{ background: "rgba(26,40,112,0.18)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: "rgba(0,212,255,0.04)" }} />
      </div>
      <div className="absolute inset-0 circuit-bg pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl">
        <div className="flex justify-center">
          <FalconMascot step={0} size={320} />
        </div>
        <p className="mt-8 text-[13px] tracking-[0.3em] uppercase font-medium" style={{ color: "#00d4ff" }}>
          Falcon Agency
        </p>
        <h1
          className="mt-4 font-bold tracking-tight text-white"
          style={{
            fontSize: "clamp(48px, 9vw, 80px)",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            textShadow: "0 0 32px rgba(0,212,255,0.35), 0 0 64px rgba(0,212,255,0.18)",
          }}
        >
          Coming soon
        </h1>
        <p className="mt-6 text-lg" style={{ color: "#6677aa" }}>
          Stiamo costruendo qualcosa di potente. Nel frattempo, parla con il tuo Falcon.
        </p>
        <Link
          to="/form-contatto-1"
          className="btn-primary inline-flex mt-10 items-center gap-2 animate-pulse-glow"
        >
          Inizia il tuo progetto →
        </Link>
      </div>
    </main>
  );
}
