// Anthropic usage adapter
// Uses GET https://api.anthropic.com/v1/usage

import type { UsageDay } from "@/lib/providers";

// Pricing per 1M tokens (USD), as of early 2026
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  "claude-3-sonnet-20240229": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
  "claude-haiku-4-5": { input: 0.8, output: 4.0 },
  "claude-2.1": { input: 8.0, output: 24.0 },
  "claude-2.0": { input: 8.0, output: 24.0 },
  "claude-instant-1.2": { input: 0.8, output: 2.4 },
};

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const prices = MODEL_PRICES[model];
  if (!prices) {
    // Default to claude-3-5-sonnet pricing for unknown models
    return (inputTokens * 3.0 + outputTokens * 15.0) / 1_000_000;
  }
  return (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;
}

interface AnthropicUsageRow {
  timestamp: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

export async function fetchAnthropicUsage(
  apiKey: string,
  days = 30
): Promise<UsageDay[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `https://api.anthropic.com/v1/usage?start_date=${startDateStr}`,
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    if (res.status === 401 || res.status === 403) {
      console.warn(`[anthropic] Auth error ${res.status} — skipping sync`);
      return [];
    }

    if (!res.ok) {
      console.warn(`[anthropic] Usage API returned ${res.status} — skipping sync`);
      return [];
    }

    const json = (await res.json()) as { data?: AnthropicUsageRow[] };
    const rows = json.data ?? [];

    // Group by date + model
    const grouped: Record<
      string,
      { inputTokens: number; outputTokens: number }
    > = {};

    for (const row of rows) {
      const date = row.timestamp.slice(0, 10); // YYYY-MM-DD
      const key = `${date}::${row.model}`;
      if (!grouped[key]) {
        grouped[key] = { inputTokens: 0, outputTokens: 0 };
      }
      grouped[key].inputTokens += row.input_tokens ?? 0;
      grouped[key].outputTokens += row.output_tokens ?? 0;
    }

    const result: UsageDay[] = [];
    for (const [key, agg] of Object.entries(grouped)) {
      const [date, model] = key.split("::");
      const totalTokens = agg.inputTokens + agg.outputTokens;
      if (totalTokens === 0) continue;
      result.push({
        date,
        model,
        inputTokens: agg.inputTokens,
        outputTokens: agg.outputTokens,
        totalTokens,
        costUsd: calcCost(model, agg.inputTokens, agg.outputTokens),
        requestCount: 0, // Not available in Anthropic usage API
      });
    }

    return result;
  } catch (err) {
    console.warn("[anthropic] Network error fetching usage:", err);
    return [];
  }
}
