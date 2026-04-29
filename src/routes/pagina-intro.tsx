import { createFileRoute, Link } from "@tanstack/react-router";

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

function PaginaIntro() {
  return (
    <main
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-6"
      style={{ background: "#070b14" }}
    >
      {/* Ambient blobs — cyan only */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
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
      <div className="absolute inset-0 circuit-bg pointer-events-none" />

      <div className="relative z-10 text-center max-w-3xl">
        <p
          className="text-[13px] tracking-[0.3em] uppercase font-medium"
          style={{ color: "#22d3ee" }}
        >
          Falcon Agency
        </p>
        <h1
          className="mt-4 font-bold tracking-tight text-white"
          style={{
            fontSize: "clamp(44px, 8vw, 76px)",
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
        <p
          className="mt-6 text-lg max-w-2xl mx-auto"
          style={{ color: "#8a9bbf" }}
        >
          Siti web, gestionali su misura e automazioni intelligenti.
          Per qualsiasi tipo di attività.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            to="/form-contatto-1"
            className="btn-primary inline-flex items-center gap-2 animate-pulse-glow"
          >
            Raccontaci il tuo progetto →
          </Link>
        </div>
      </div>
    </main>
  );
}
