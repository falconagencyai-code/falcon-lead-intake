import falconMascot from "@/assets/falcon-mascot.png";

interface Props {
  step: number;
  celebrate?: boolean;
  size?: number;
}

export function FalconMascot({ celebrate = false, size = 380 }: Props) {
  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ width: size, maxWidth: "100%", background: "none" }}
    >
      {/* Outer ambient glow — non tocca l'immagine */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 60%, rgba(0,212,255,0.08) 0%, transparent 70%)",
          transform: "scale(1.2)",
        }}
      />

      {/* Floating wrapper */}
      <div
        className={celebrate ? "animate-celebrate" : "animate-falcon-float"}
        style={{ background: "none" }}
      >
        <img
          src={falconMascot}
          alt="Falcon Agency mascot"
          draggable={false}
          className="w-full h-auto block animate-falcon-wings"
          style={{
            transformOrigin: "50% 40%",
            filter:
              "drop-shadow(0 0 18px rgba(0,212,255,0.5)) drop-shadow(0 8px 32px rgba(0,100,200,0.3))",
            background: "none",
          }}
        />

        {/* Ground glow */}
        <div
          aria-hidden
          className="mx-auto -mt-6 animate-falcon-glow"
          style={{
            width: "55%",
            height: "18px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0) 70%)",
          }}
        />
      </div>
    </div>
  );
}
