import falconVideo from "@/assets/falcon-loop.mp4";

interface Props {
  step?: number;
  celebrate?: boolean;
  size?: number;
}

export function FalconMascot({ celebrate = false, size = 380 }: Props) {
  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ width: size, maxWidth: "100%", background: "none" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 55%, rgba(0,212,255,0.09) 0%, transparent 70%)",
          transform: "scale(1.4)",
        }}
      />

      {/* Float + celebrate wrapper */}
      <div
        className={celebrate ? "animate-celebrate" : "animate-falcon-float"}
        style={{ position: "relative" }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto block"
          style={{
            mixBlendMode: "screen",
            maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            filter:
              "drop-shadow(0 0 28px rgba(0,212,255,0.5)) drop-shadow(0 4px 20px rgba(0,100,200,0.35))",
          }}
        >
          <source src={falconVideo} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
