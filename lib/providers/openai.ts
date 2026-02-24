// OpenAI usage adapter
// Uses GET /v1/usage?date=YYYY-MM-DD (standard API key, per-day usage)

import type { UsageDay } from "@/lib/providers";
export type { UsageDay };

// Pricing per 1M tokens (USD), as of early 2026
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
  "gpt-4o-2024-08-06": { input: 2.5, output: 10.0 },
  "gpt-4o-2024-05-13": { input: 5.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4-turbo-2024-04-09": { input: 10.0, output: 30.0 },
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  "o1": { input: 15.0, output: 60.0 },
  "o1-2024-12-17": { input: 15.0, output: 60.0 },
  "o1-mini": { input: 1.1, output: 4.4 },
  "o1-mini-2024-09-12": { input: 1.1, output: 4.4 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "text-embedding-3-large": { input: 0.13, output: 0 },
};

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const prices = MODEL_PRICES[model];
  if (!prices) {
    // Default to gpt-4o pricing for unknown models
    return (inputTokens * 5.0 + outputTokens * 15.0) / 1_000_000;
  }
  return (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;
}

function dateOffsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchOneDayUsage(apiKey: string, date: string): Promise<UsageDay[]> {
  const res = await fetch(
    `https://api.openai.com/v1/usage?date=${date}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const items: UsageDay[] = [];
  for (const row of json.data ?? []) {
    if (row.operation !== "completion") continue;
    const model = row.snapshot_id as string;
    const inputTokens = (row.n_context_tokens_total as number) ?? 0;
    const outputTokens = (row.n_generated_tokens_total as number) ?? 0;
    if (inputTokens + outputTokens === 0) continue;
    items.push({
      date,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      costUsd: calcCost(model, inputTokens, outputTokens),
      requestCount: (row.n_requests as number) ?? 0,
    });
  }
  return items;
}

export async function fetchOpenAIUsage(
  apiKey: string,
  days = 30
): Promise<UsageDay[]> {
  const dates = Array.from({ length: days }, (_, i) => dateOffsetDays(i + 1));

  // Probe the most recent date to detect permission errors early
  const probeRes = await fetch(
    `https://api.openai.com/v1/usage?date=${dates[0]}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (probeRes.status === 401 || probeRes.status === 403) {
    throw new Error(
      "PERMISSION_ERROR: This API key cannot access usage data. Use an unrestricted key (not a project key) with 'All' permissions from platform.openai.com/api-keys."
    );
  }
  if (!probeRes.ok) {
    throw new Error(`OpenAI usage API returned ${probeRes.status}`);
  }

  // Fetch all dates in parallel batches of 5 to avoid rate limits
  const results: UsageDay[] = [];
  for (let i = 0; i < dates.length; i += 5) {
    const batch = dates.slice(i, i + 5);
    const batchResults = await Promise.allSettled(
      batch.map((date) => fetchOneDayUsage(apiKey, date))
    );
    for (const r of batchResults) {
      if (r.status === "fulfilled") results.push(...r.value);
    }
  }
  return results;
}
