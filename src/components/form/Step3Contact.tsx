import type { FormState } from "./types";

interface Props {
  state: FormState;
  update: (patch: Partial<FormState>) => void;
}

export function Step3Contact({ state, update }: Props) {
  const field = (label: string, key: "fullName" | "email" | "phone" | "company", required: boolean, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      <input
        type={type}
        value={state[key]}
        onChange={(e) => update({ [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg bg-input border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <p className="text-xs tracking-[0.3em] text-primary uppercase">Step 3 / 4</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-bold">I tuoi contatti</h2>
        <p className="mt-2 text-muted-foreground">Il tuo Falcon sta per spiccare il volo.</p>
      </div>

      <div className="space-y-4">
        {field("Nome e cognome", "fullName", true, "text", "Mario Rossi")}
        {field("Email", "email", true, "email", "mario@azienda.it")}
        {field("Telefono", "phone", true, "tel", "+39 333 1234567")}
        {field("Azienda", "company", false, "text", "(opzionale)")}
      </div>
    </div>
  );
}
