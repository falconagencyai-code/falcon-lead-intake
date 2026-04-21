import { useEffect, useState } from "react";
import frame1 from "@/assets/frames/frame1_wings_up.png";
import frame2 from "@/assets/frames/frame2_wings_mid.png";
import frame3 from "@/assets/frames/frame3_wings_spread.png";
import frame4 from "@/assets/frames/frame4_wings_down.png";
import frame5 from "@/assets/frames/frame5_wings_low.png";

// Wing cycle: up → mid → spread → down → low → down → spread → mid → up
const HOVER_CYCLE = [frame1, frame2, frame3, frame4, frame5, frame4, frame3, frame2];
const HOVER_FPS = 100; // ms per frame — ~10fps, smooth flap

interface Props {
  step: number;
  celebrate?: boolean;
  size?: number;
}

export function FalconMascot({ celebrate = false, size = 380 }: Props) {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIdx((i) => (i + 1) % HOVER_CYCLE.length);
    }, HOVER_FPS);
    return () => clearInterval(interval);
  }, []);

  const src = HOVER_CYCLE[frameIdx];

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
            "radial-gradient(ellipse at 50% 55%, rgba(0,212,255,0.07) 0%, transparent 70%)",
          transform: "scale(1.3)",
        }}
      />

      {/* Slow vertical float wrapper */}
      <div
        className={celebrate ? "animate-celebrate" : "animate-falcon-float"}
        style={{ background: "none" }}
      >
        <img
          key={src}
          src={src}
          alt="Falcon Agency mascot"
          draggable={false}
          className="w-full h-auto block"
          style={{
            filter:
              "drop-shadow(0 0 20px rgba(0,212,255,0.45)) drop-shadow(0 6px 24px rgba(0,100,200,0.25))",
            background: "none",
          }}
        />

        {/* Ground glow — pulses with the float */}
        <div
          aria-hidden
          className="mx-auto -mt-4 animate-falcon-glow"
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
