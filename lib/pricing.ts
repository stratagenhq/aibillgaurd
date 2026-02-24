// Shared cost calculation used by the ingest endpoint and provider adapters.
// Prices are per 1M tokens in USD.

const OPENAI_PRICES: Record<string, { input: number; output: number }> = {
  "gpt-4o":                  { input: 5.0,  output: 15.0 },
  "gpt-4o-2024-11-20":       { input: 2.5,  output: 10.0 },
  "gpt-4o-2024-08-06":       { input: 2.5,  output: 10.0 },
  "gpt-4o-mini":             { input: 0.15, output: 0.6  },
  "gpt-4o-mini-2024-07-18":  { input: 0.15, output: 0.6  },
  "gpt-4-turbo":             { input: 10.0, output: 30.0 },
  "gpt-4":                   { input: 30.0, output: 60.0 },
  "gpt-3.5-turbo":           { input: 0.5,  output: 1.5  },
  "o1":                      { input: 15.0, output: 60.0 },
  "o1-mini":                 { input: 1.1,  output: 4.4  },
  "o3-mini":                 { input: 1.1,  output: 4.4  },
};

const ANTHROPIC_PREFIXES = [
  { prefix: "claude-opus-4",   input: 15.0, output: 75.0 },
  { prefix: "claude-sonnet-4", input:  3.0, output: 15.0 },
  { prefix: "claude-haiku-4",  input:  0.8, output:  4.0 },
];

export function calcCost(
  providerType: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  if (providerType === "anthropic") {
    const p = ANTHROPIC_PREFIXES.find((x) => model.startsWith(x.prefix))
      ?? { input: 3.0, output: 15.0 };
    return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
  }
  const p = OPENAI_PRICES[model] ?? { input: 5.0, output: 15.0 };
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
