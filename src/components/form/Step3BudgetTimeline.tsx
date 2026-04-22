const budgets = ["< €1.000", "€1.000–€5.000", "€5.000–€15.000", "€15.000+"];
const timelines = ["Prima possibile", "1-3 mesi", "3-6 mesi", "Non ho fretta"];

function OptionGrid({
  items,
  value,
  onSelect,
}: {
  items: string[];
  value: string | null | undefined;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`glass glass-hover px-4 py-4 text-sm font-medium text-white text-left ${active ? "glass-active" : ""}`}
            style={active ? { color: "#00d4ff" } : undefined}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

interface Props {
  budget: string | null;
  timeline: string | null;
  setBudget: (v: string) => void;
  setTimeline: (v: string) => void;
}

export function Step3BudgetTimeline({ budget, timeline, setBudget, setTimeline }: Props) {
  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <p className="label-section">Investimento</p>
        <h2
          className="mt-3 font-bold text-white"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}
        >
          Budget & Timing
        </h2>
        <p className="mt-3 text-base" style={{ color: "#6677aa" }}>
          Aiutaci a calibrare la proposta giusta per te.
        </p>
      </div>

      <div className="space-y-7">
        <div>
          <label className="label-section block mb-3">Budget indicativo</label>
          <OptionGrid items={budgets} value={budget} onSelect={setBudget} />
        </div>
        <div>
          <label className="label-section block mb-3">Quando vuoi iniziare?</label>
          <OptionGrid items={timelines} value={timeline} onSelect={setTimeline} />
        </div>
      </div>
    </div>
  );
}
