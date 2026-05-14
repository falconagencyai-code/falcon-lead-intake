import type { ToolModule } from "../types.ts";
import { createUserClient } from "../supabase.ts";

/**
 * Implements the patDelta logic from CLAUDE.md memory:
 *   - fixed_expenses pro-rated since periodStart (or start_date)
 *   - one_time_expenses since periodStart
 *   - transactions since periodStart
 *
 * Pat-positive => Pat is a creditor.
 */
export const balanceCompute: ToolModule = {
  definition: {
    name: "falcon_balance_compute",
    description:
      "Calcola il saldo divisorio Pat/Stefano per un periodo. Logica patDelta: spese fisse pro-rata + one-time expenses + transactions. Usa questo tool quando l'utente chiede 'quanto deve Stefano', 'qual è il saldo del mese', 'situazione contabile'.",
    inputSchema: {
      type: "object",
      properties: {
        period_start: {
          type: "string",
          format: "date",
          description: "Data ISO inizio periodo (YYYY-MM-DD). Default: primo del mese corrente.",
        },
        period_end: {
          type: "string",
          format: "date",
          description: "Data ISO fine periodo (YYYY-MM-DD). Default: oggi.",
        },
      },
      additionalProperties: false,
    },
  },
  handler: async (args, ctx) => {
    const today = new Date();
    const periodStart =
      typeof args.period_start === "string"
        ? new Date(args.period_start)
        : new Date(today.getFullYear(), today.getMonth(), 1);
    const periodEnd = typeof args.period_end === "string" ? new Date(args.period_end) : today;

    const jwt = (ctx as unknown as { jwt?: string }).jwt ?? "";
    const sb = createUserClient(ctx.env, jwt);

    const periodStartIso = periodStart.toISOString().slice(0, 10);

    const [fixedRes, oneTimeRes, txRes] = await Promise.all([
      sb.from("fixed_expenses").select("amount, paid_by, start_date, active").eq("active", true),
      sb.from("one_time_expenses").select("amount, paid_by, date").gte("date", periodStartIso),
      sb.from("transactions").select("amount, type, paid_by, date").gte("date", periodStartIso),
    ]);

    if (fixedRes.error) {
      return { isError: true, content: [{ type: "text", text: `Errore fixed_expenses: ${fixedRes.error.message}` }] };
    }
    if (oneTimeRes.error) {
      return { isError: true, content: [{ type: "text", text: `Errore one_time_expenses: ${oneTimeRes.error.message}` }] };
    }
    if (txRes.error) {
      return { isError: true, content: [{ type: "text", text: `Errore transactions: ${txRes.error.message}` }] };
    }

    let patDelta = 0;
    const breakdown: { category: string; pat: number; stefano: number }[] = [];

    // 1) Fixed expenses, pro-rated by months elapsed
    let fixedPat = 0;
    let fixedStefano = 0;
    for (const fe of fixedRes.data ?? []) {
      const amount = Number(fe.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const startBase = fe.start_date ? new Date(fe.start_date) : periodStart;
      const effStart = startBase > periodStart ? startBase : periodStart;
      if (effStart > periodEnd) continue;
      const days = (periodEnd.getTime() - effStart.getTime()) / (1000 * 60 * 60 * 24);
      const elapsed = Math.max(0, days / 30);
      const total = amount * elapsed;
      if (fe.paid_by === "pat") {
        patDelta += total / 2;
        fixedPat += total;
      } else if (fe.paid_by === "stefano") {
        patDelta -= total / 2;
        fixedStefano += total;
      }
    }
    breakdown.push({ category: "fixed_expenses", pat: fixedPat, stefano: fixedStefano });

    // 2) One-time expenses
    let otPat = 0;
    let otStefano = 0;
    for (const ot of oneTimeRes.data ?? []) {
      const amount = Number(ot.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      if (ot.paid_by === "pat") {
        patDelta += amount / 2;
        otPat += amount;
      } else if (ot.paid_by === "stefano") {
        patDelta -= amount / 2;
        otStefano += amount;
      }
    }
    breakdown.push({ category: "one_time_expenses", pat: otPat, stefano: otStefano });

    // 3) Transactions (income inverts the sign)
    let txExpensePat = 0;
    let txExpenseStefano = 0;
    let txIncomePat = 0;
    let txIncomeStefano = 0;
    for (const tx of txRes.data ?? []) {
      const amount = Number(tx.amount);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      if (tx.type === "expense") {
        if (tx.paid_by === "pat") {
          patDelta += amount / 2;
          txExpensePat += amount;
        } else if (tx.paid_by === "stefano") {
          patDelta -= amount / 2;
          txExpenseStefano += amount;
        }
      } else if (tx.type === "income") {
        if (tx.paid_by === "pat") {
          patDelta -= amount / 2;
          txIncomePat += amount;
        } else if (tx.paid_by === "stefano") {
          patDelta += amount / 2;
          txIncomeStefano += amount;
        }
      }
    }
    breakdown.push({ category: "transactions_expense", pat: txExpensePat, stefano: txExpenseStefano });
    breakdown.push({ category: "transactions_income", pat: txIncomePat, stefano: txIncomeStefano });

    const patNet = round(patDelta);
    const stefanoNet = -patNet;

    const direction =
      patNet > 0
        ? `Stefano deve a Pat €${patNet.toFixed(2)}`
        : patNet < 0
          ? `Pat deve a Stefano €${Math.abs(patNet).toFixed(2)}`
          : "Pari";

    return {
      content: [
        {
          type: "text",
          text: `Saldo periodo ${periodStartIso} → ${periodEnd.toISOString().slice(0, 10)}: ${direction}`,
        },
      ],
      structuredContent: {
        period: { start: periodStartIso, end: periodEnd.toISOString().slice(0, 10) },
        pat_net: patNet,
        stefano_net: round(stefanoNet),
        direction,
        breakdown,
      },
    };
  },
};

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
