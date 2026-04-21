import { useEffect, useState } from "react";
import falconMascot from "@/assets/falcon-mascot.png";

interface Props {
  step: number;
  celebrate?: boolean;
}

export function FalconMascot({ step, celebrate = false }: Props) {
  const [flutter, setFlutter] = useState(false);

  useEffect(() => {
    setFlutter(true);
    const t = setTimeout(() => setFlutter(false), 800);
    return () => clearTimeout(t);
  }, [step]);

  const animClass = celebrate
    ? "animate-celebrate"
    : flutter
      ? "animate-wing-flutter"
      : "animate-float-bob";

  return (
    <div className="relative pointer-events-none select-none">
      <div className="absolute inset-0 -z-10 blur-3xl opacity-50 gradient-cyan rounded-full" />
      <img
        src={falconMascot}
        alt="Falcon Agency mascot"
        draggable={false}
        className={`w-full max-w-[420px] drop-shadow-[0_0_50px_oklch(0.82_0.16_220/0.55)] ${animClass}`}
      />
    </div>
  );
}
