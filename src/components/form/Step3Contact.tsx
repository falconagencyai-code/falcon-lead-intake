import type { FormState } from "./types";

interface Props {
  state: FormState;
  update: (patch: Partial<FormState>) => void;
}

export function Step3Contact({ state, update }: Props) {
  const field = (
    label: string,
    key: "fullName" | "email" | "phone" | "company",
    required: boolean,
    type = "text",
    placeholder = "",
  ) => (
    <div>
      <label className="label-section block mb-2">
        {label} {required && <span style={{ color: "#00d4ff" }}>*</span>}
      </label>
      <input
        type={type}
        value={state[key]}
        onChange={(e) => update({ [key]: e.target.value })}
        placeholder={placeholder}
        className="input-premium"
      />
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <p className="label-section">Contatti</p>
        <h2 className="mt-3 font-bold text-white" style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          I tuoi contatti
        </h2>
        <p className="mt-3 text-base" style={{ color: "#6677aa" }}>
          Il tuo Falcon sta per spiccare il volo.
        </p>
      </div>

      <div className="space-y-5">
        {field("Nome e cognome", "fullName", true, "text", "Mario Rossi")}
        {field("Email", "email", true, "email", "mario@azienda.it")}
        {field("Telefono", "phone", true, "tel", "+39 333 1234567")}
        {field("Azienda", "company", false, "text", "(opzionale)")}
      </div>
    </div>
  );
}
