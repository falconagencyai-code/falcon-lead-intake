import type { ToolModule } from "../types.ts";
import { createUserClient } from "../supabase.ts";

const PIPELINE_STAGES = [
  "nuovo",
  "contattato",
  "call_schedulata",
  "call_effettuata",
  "preventivo_inviato",
  "chiuso_vinto",
  "chiuso_perso",
] as const;

export const leadList: ToolModule = {
  definition: {
    name: "falcon_lead_list",
    description:
      "Lista lead Falcon con filtri opzionali per pipeline_stage, source e periodo. Ritorna max 50 lead, ordinati dal più recente. Usa questo tool quando l'utente chiede 'mostrami i lead', 'quanti lead nello stage X', 'ultimi lead di questa settimana'.",
    inputSchema: {
      type: "object",
      properties: {
        stage: {
          type: "string",
          enum: PIPELINE_STAGES,
          description: "Filtra per pipeline_stage. Omesso = tutti gli stage.",
        },
        source: {
          type: "string",
          description: "Filtra per source (es. 'facebook_ads', 'referral'). Match esatto.",
        },
        since: {
          type: "string",
          format: "date",
          description: "Data ISO (YYYY-MM-DD): include solo lead creati da questa data in poi.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 20,
          description: "Numero massimo di lead da ritornare (1-50).",
        },
      },
      additionalProperties: false,
    },
  },
  handler: async (args, ctx) => {
    const stage = typeof args.stage === "string" ? args.stage : undefined;
    const source = typeof args.source === "string" ? args.source : undefined;
    const since = typeof args.since === "string" ? args.since : undefined;
    const limit = typeof args.limit === "number" ? Math.min(50, Math.max(1, args.limit)) : 20;

    const jwt = ctx.env ? extractJwtFromCtx(ctx) : "";
    const sb = createUserClient(ctx.env, jwt);

    let query = sb
      .from("leads")
      .select("id, full_name, email, phone, company, pipeline_stage, source, created_at, lost_reason")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (stage) query = query.eq("pipeline_stage", stage);
    if (source) query = query.eq("source", source);
    if (since) query = query.gte("created_at", since);

    const { data, error } = await query;
    if (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Errore lettura leads: ${error.message}` }],
      };
    }

    const rows = data ?? [];
    const summary =
      rows.length === 0
        ? "Nessun lead trovato con questi filtri."
        : `${rows.length} lead trovati${stage ? ` (stage=${stage})` : ""}${source ? ` (source=${source})` : ""}.`;

    return {
      content: [{ type: "text", text: summary }],
      structuredContent: { count: rows.length, leads: rows },
    };
  },
};

function extractJwtFromCtx(ctx: { env: unknown }): string {
  // JWT is injected via ctx by the dispatcher (see mcp-server.ts).
  return (ctx as unknown as { jwt?: string }).jwt ?? "";
}
