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
      style={{ width: size, maxWidth: "100%" }}
    >
      {/* Floating wrapper */}
      <div className={celebrate ? "animate-celebrate" : "animate-falcon-float"}>
        <img
          src={falconMascot}
          alt="Falcon Agency mascot"
          draggable={false}
          className="w-full h-auto block animate-falcon-wings"
          style={{
            transformOrigin: "50% 65%",
            filter: "drop-shadow(0 0 30px rgba(0, 212, 255, 0.35))",
          }}
        />
        {/* Soft cyan ground glow */}
        <div
          aria-hidden
          className="mx-auto -mt-4 animate-falcon-glow"
          style={{
            width: "70%",
            height: "24px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.35) 0%, rgba(0,212,255,0) 70%)",
            boxShadow: "0 20px 60px rgba(0,212,255,0.2)",
          }}
        />
      </div>
    </div>
  );
}
