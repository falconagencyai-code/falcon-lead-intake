const FALCON_VIDEO_URL =
  "https://tpzpydnvcbcdkuthyweh.supabase.co/storage/v1/object/public/assets/falcon-loop.webm";

interface Props {
  step?: number;
  celebrate?: boolean;
  size?: number;
}

export function FalconMascot({ celebrate = false, size = 300 }: Props) {
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
          background:
            "radial-gradient(ellipse at 50% 55%, rgba(0,212,255,0.08) 0%, transparent 70%)",
          transform: "scale(1.3)",
        }}
      />

      {/* Float / celebrate wrapper */}
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
            filter:
              "drop-shadow(0 0 28px rgba(0,212,255,0.55)) drop-shadow(0 0 12px rgba(0,212,255,0.3)) drop-shadow(0 6px 20px rgba(0,100,200,0.3))",
          }}
        >
          <source src={FALCON_VIDEO_URL} type="video/webm" />
        </video>

        {/* Ground glow */}
        <div
          aria-hidden
          className="mx-auto animate-falcon-glow"
          style={{
            width: "50%",
            height: "16px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0) 70%)",
          }}
        />
      </div>
    </div>
  );
}
