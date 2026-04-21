import { createFileRoute, Link } from "@tanstack/react-router";
import falconMascot from "@/assets/falcon-mascot.png";

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
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 circuit-bg opacity-40" />
      <div className="relative z-10 text-center max-w-2xl">
        <img
          src={falconMascot}
          alt="Falcon Agency mascot"
          className="w-48 h-48 mx-auto animate-float-bob drop-shadow-[0_0_40px_oklch(0.82_0.16_220/0.5)]"
        />
        <p className="mt-6 text-sm tracking-[0.3em] text-primary uppercase">Falcon Agency</p>
        <h1 className="mt-3 text-5xl md:text-7xl font-bold tracking-tight text-glow">
          Coming soon
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Stiamo costruendo qualcosa di potente. Nel frattempo, parla con il tuo Falcon.
        </p>
        <Link
          to="/form-contatto-1"
          className="inline-flex mt-8 items-center gap-2 px-8 py-4 rounded-xl gradient-cyan text-primary-foreground font-semibold animate-pulse-glow hover:scale-105 transition-transform"
        >
          Inizia il tuo progetto →
        </Link>
      </div>
    </main>
  );
}
