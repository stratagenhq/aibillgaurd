// Anthropic usage adapter
// Uses GET /v1/usage?start_time=...&end_time=... (per-day, admin key only)
// Standard keys (sk-ant-...) will 404 — silently returns [] so the UI shows
// the "Synced recently — no usage found" empty state rather than an error.

import type { UsageDay } from "@/lib/providers";

// Pricing per 1M tokens (USD), prefix-matched for versioned model names
const MODEL_PRICE_PREFIXES: Array<{
  prefix: string;
  input: number;
  output: number;
}> = [
  { prefix: "claude-opus-4",   input: 15.0, output: 75.0 },
  { prefix: "claude-sonnet-4", input:  3.0, output: 15.0 },
  { prefix: "claude-haiku-4",  input:  0.8, output:  4.0 },
];

const DEFAULT_PRICE = { input: 3.0, output: 15.0 };

function calcCost(model: string, inputTokens: number, outputTokens: number): number {
  const prices =
    MODEL_PRICE_PREFIXES.find((p) => model.startsWith(p.prefix)) ?? DEFAULT_PRICE;
  return (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;
}

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

async function fetchOneDayUsage(
  apiKey: string,
  date: string
): Promise<UsageDay[]> {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDate = nextDay.toISOString().slice(0, 10);

  const url =
    `https://api.anthropic.com/v1/usage` +
    `?start_time=${date}T00:00:00Z&end_time=${nextDate}T00:00:00Z`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
  } catch {
    return [];
  }

  if (!res.ok) return [];

  let json: { data?: Array<{ model: string; input_tokens: number; output_tokens: number }> };
  try {
    json = await res.json();
  } catch {
    return [];
  }

  // Aggregate rows by model within the day
  const byModel = new Map<string, { input: number; output: number }>();
  for (const row of json.data ?? []) {
    const model = row.model ?? "unknown";
    const input = (row.input_tokens as number) ?? 0;
    const output = (row.output_tokens as number) ?? 0;
    if (input + output === 0) continue;
    const existing = byModel.get(model) ?? { input: 0, output: 0 };
    byModel.set(model, {
      input: existing.input + input,
      output: existing.output + output,
    });
  }

  const items: UsageDay[] = [];
  for (const [model, tokens] of byModel) {
    items.push({
      date,
      model,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      totalTokens: tokens.input + tokens.output,
      costUsd: calcCost(model, tokens.input, tokens.output),
      requestCount: 0, // not available in Anthropic usage API
    });
  }
  return items;
}

export async function fetchAnthropicUsage(
  apiKey: string,
  days = 30
): Promise<UsageDay[]> {
  const dates = Array.from({ length: days }, (_, i) => isoDay(i + 1));

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
