import frame1 from "@/assets/frames/frame1_wings_up.png";

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
          background: "radial-gradient(ellipse at 50% 55%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          transform: "scale(1.3)",
        }}
      />

      {/* Float wrapper */}
      <div
        className={celebrate ? "animate-celebrate" : "animate-falcon-float"}
        style={{ position: "relative" }}
      >
        <img
          src={frame1}
          alt="Falcon Agency mascot"
          draggable={false}
          className="w-full h-auto block animate-falcon-wings"
          style={{
            filter:
              "drop-shadow(0 0 24px rgba(0,212,255,0.5)) drop-shadow(0 6px 28px rgba(0,100,200,0.3))",
          }}
        />

        {/* Ground glow */}
        <div
          aria-hidden
          className="mx-auto animate-falcon-glow"
          style={{
            width: "50%",
            height: "16px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.45) 0%, rgba(0,212,255,0) 70%)",
          }}
        />
      </div>
    </div>
  );
}
