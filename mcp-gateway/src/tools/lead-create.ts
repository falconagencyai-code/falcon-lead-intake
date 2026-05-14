import type { ToolModule } from "../types.ts";
import { createUserClient } from "../supabase.ts";

export const leadCreate: ToolModule = {
  definition: {
    name: "falcon_lead_create",
    description:
      "Crea un nuovo lead in Falcon. Usa questo tool quando l'utente dice 'aggiungi un lead', 'nuovo cliente potenziale', 'segna che ho parlato con X'. Lo stage iniziale è sempre 'nuovo'.",
    inputSchema: {
      type: "object",
      properties: {
        full_name: { type: "string", minLength: 1, description: "Nome completo del lead." },
        email: { type: "string", format: "email", description: "Email (opzionale)." },
        phone: { type: "string", description: "Telefono (opzionale)." },
        company: { type: "string", description: "Azienda (opzionale)." },
        source: {
          type: "string",
          description: "Da dove arriva (es. 'facebook_ads', 'referral', 'cold_outreach').",
        },
        note: { type: "string", description: "Nota iniziale, salvata anche in lead_notes." },
      },
      required: ["full_name"],
      additionalProperties: false,
    },
  },
  handler: async (args, ctx) => {
    const fullName = String(args.full_name ?? "").trim();
    if (!fullName) {
      return { isError: true, content: [{ type: "text", text: "full_name è obbligatorio" }] };
    }

    const jwt = (ctx as unknown as { jwt?: string }).jwt ?? "";
    const sb = createUserClient(ctx.env, jwt);

    const insertPayload: Record<string, unknown> = {
      full_name: fullName,
      pipeline_stage: "nuovo",
    };
    if (typeof args.email === "string") insertPayload.email = args.email;
    if (typeof args.phone === "string") insertPayload.phone = args.phone;
    if (typeof args.company === "string") insertPayload.company = args.company;
    if (typeof args.source === "string") insertPayload.source = args.source;

    const { data, error } = await sb
      .from("leads")
      .insert(insertPayload)
      .select("id, full_name, pipeline_stage, created_at")
      .single();

    if (error) {
      return { isError: true, content: [{ type: "text", text: `Errore creazione lead: ${error.message}` }] };
    }

    if (typeof args.note === "string" && args.note.trim()) {
      await sb.from("lead_notes").insert({
        lead_id: data.id,
        note: args.note.trim(),
      });
    }

    return {
      content: [{ type: "text", text: `Lead "${data.full_name}" creato (id ${data.id}).` }],
      structuredContent: { lead: data },
    };
  },
};
