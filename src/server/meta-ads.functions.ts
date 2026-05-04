import { createServerFn } from "@tanstack/react-start";

type Range = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export type MetaCampaign = {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number;
  ctr: number;
};

export type MetaAdsData = {
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    leads: number;
    cpl: number;
    ctr: number;
  };
  campaigns: MetaCampaign[];
  currency: string;
  error: string | null;
};

const datePresetMap: Record<Exclude<Range, "custom">, string> = {
  today: "today",
  yesterday: "yesterday",
  "7d": "last_7d",
  "30d": "last_30d",
  "90d": "last_90d",
};

export const getMetaAds = createServerFn({ method: "GET" })
  .inputValidator((data: { range?: Range; since?: string; until?: string }) => ({
    range: data?.range ?? "30d",
    since: data?.since,
    until: data?.until,
  }))
  .handler(async ({ data }): Promise<MetaAdsData> => {
    const empty: MetaAdsData = {
      totals: { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 },
      campaigns: [],
      currency: "EUR",
      error: null,
    };

    const token = process.env.META_ACCESS_TOKEN;
    let accountId = process.env.META_AD_ACCOUNT_ID;
    if (!token || !accountId) {
      return { ...empty, error: "Credenziali Meta non configurate." };
    }
    if (!accountId.startsWith("act_")) accountId = `act_${accountId}`;

    const preset = datePresetMap[data.range];
    const fields = [
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "actions",
    ].join(",");

    const url =
      `https://graph.facebook.com/v21.0/${accountId}/insights` +
      `?level=campaign&date_preset=${preset}&fields=${fields}&limit=200&access_token=${encodeURIComponent(token)}`;

    try {
      const res = await fetch(url);
      const json = (await res.json()) as {
        data?: Array<{
          campaign_id: string;
          campaign_name: string;
          spend?: string;
          impressions?: string;
          clicks?: string;
          ctr?: string;
          actions?: Array<{ action_type: string; value: string }>;
        }>;
        error?: { message?: string };
      };

      if (!res.ok || json.error) {
        return { ...empty, error: json.error?.message ?? `Meta API error ${res.status}` };
      }

      const rows = json.data ?? [];

      // Fetch campaign statuses in one call
      let statusMap: Record<string, string> = {};
      try {
        const statusUrl =
          `https://graph.facebook.com/v21.0/${accountId}/campaigns` +
          `?fields=id,effective_status&limit=200&access_token=${encodeURIComponent(token)}`;
        const sRes = await fetch(statusUrl);
        const sJson = (await sRes.json()) as {
          data?: Array<{ id: string; effective_status: string }>;
        };
        statusMap = Object.fromEntries((sJson.data ?? []).map((c) => [c.id, c.effective_status]));
      } catch {
        // ignore
      }

      const campaigns: MetaCampaign[] = rows.map((r) => {
        const spend = parseFloat(r.spend ?? "0") || 0;
        const impressions = parseInt(r.impressions ?? "0", 10) || 0;
        const clicks = parseInt(r.clicks ?? "0", 10) || 0;
        const ctr = parseFloat(r.ctr ?? "0") || 0;
        const leadAction = (r.actions ?? []).find((a) =>
          ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped"].includes(
            a.action_type
          )
        );
        const leads = leadAction ? parseInt(leadAction.value, 10) || 0 : 0;
        const cpl = leads > 0 ? spend / leads : 0;
        return {
          id: r.campaign_id,
          name: r.campaign_name,
          status: statusMap[r.campaign_id] ?? "UNKNOWN",
          spend,
          impressions,
          clicks,
          leads,
          cpl,
          ctr,
        };
      });

      const totals = campaigns.reduce(
        (acc, c) => {
          acc.spend += c.spend;
          acc.impressions += c.impressions;
          acc.clicks += c.clicks;
          acc.leads += c.leads;
          return acc;
        },
        { spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: 0, ctr: 0 }
      );
      totals.cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
      totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

      return { totals, campaigns, currency: "EUR", error: null };
    } catch (e) {
      console.error("Meta Ads fetch failed:", e);
      return { ...empty, error: e instanceof Error ? e.message : "Errore sconosciuto" };
    }
  });
