interface Props {
  step?: number;
  celebrate?: boolean;
  size?: number;
}

export function FalconMascot({ size = 300 }: Props) {
  return (
    <div
      className="relative pointer-events-none select-none"
      style={{ width: size, maxWidth: "100%" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 55%, rgba(0,212,255,0.08) 0%, transparent 70%)",
          transform: "scale(1.3)",
        }}
      />
      <img
        src="https://tpzpydnvcbcdkuthyweh.supabase.co/storage/v1/object/public/assets/falcon-wings-open.png"
        alt="Falcon Agency"
        className="w-full h-auto block"
        style={{
          filter: "drop-shadow(0 0 28px rgba(0,212,255,0.55)) drop-shadow(0 0 12px rgba(0,212,255,0.3)) drop-shadow(0 6px 20px rgba(0,100,200,0.3))",
        }}
      />
      <div
        aria-hidden
        className="mx-auto"
        style={{
          width: "50%",
          height: "16px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(0,212,255,0.4) 0%, rgba(0,212,255,0) 70%)",
        }}
      />
    </div>
  );
}
