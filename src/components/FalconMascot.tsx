import { useEffect, useState } from "react";
import frame1 from "@/assets/frames/frame1_wings_up.png";
import frame2 from "@/assets/frames/frame2_wings_mid.png";
import frame3 from "@/assets/frames/frame3_wings_spread.png";
import frame4 from "@/assets/frames/frame4_wings_down.png";
import frame5 from "@/assets/frames/frame5_wings_low.png";

// Symmetric wing cycle: up → mid → spread → down → low → down → spread → mid → up
const FRAMES = [frame1, frame2, frame3, frame4, frame5, frame4, frame3, frame2];
const FRAME_MS = 110; // ms per frame

interface Props {
  step: number;
  celebrate?: boolean;
  size?: number;
}

export function FalconMascot({ celebrate = false, size = 380 }: Props) {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(1);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % FRAMES.length);
        setNext((n) => (n + 1) % FRAMES.length);
        setFading(false);
      }, FRAME_MS * 0.4); // crossfade at 40% of frame duration
    }, FRAME_MS);
    return () => clearInterval(interval);
  }, []);

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
        style={{ background: "none", position: "relative" }}
      >
        {/* Current frame */}
        <img
          src={FRAMES[current]}
          alt="Falcon Agency mascot"
          draggable={false}
          className="w-full h-auto block"
          style={{
            position: "absolute",
            top: 0, left: 0,
            opacity: fading ? 0 : 1,
            transition: `opacity ${FRAME_MS * 0.4}ms ease-in-out`,
            filter: "drop-shadow(0 0 20px rgba(0,212,255,0.45)) drop-shadow(0 6px 24px rgba(0,100,200,0.25))",
          }}
        />
        {/* Next frame (crossfade target) */}
        <img
          src={FRAMES[next]}
          alt=""
          aria-hidden
          draggable={false}
          className="w-full h-auto block"
          style={{
            opacity: fading ? 1 : 0,
            transition: `opacity ${FRAME_MS * 0.4}ms ease-in-out`,
            filter: "drop-shadow(0 0 20px rgba(0,212,255,0.45)) drop-shadow(0 6px 24px rgba(0,100,200,0.25))",
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
            background: "radial-gradient(ellipse at center, rgba(0,212,255,0.45) 0%, rgba(0,212,255,0) 70%)",
          }}
        />
      </div>
    </div>
  );
}
