const HOST = "https://aibillguard.ai";

function report(model: string, input: number, output: number, key: string) {
  fetch(`${HOST}/api/ingest`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, input_tokens: input, output_tokens: output }),
  }).catch(() => {}); // fire-and-forget, never throws, never blocks
}

export function wrapOpenAI<T extends object>(client: T, { key }: { key: string }): T {
  const c = (client as Record<string, unknown> & { chat?: { completions?: { create: (...args: unknown[]) => unknown } } }).chat?.completions;
  if (!c) return client;
  const orig = c.create.bind(c);
  c.create = async (...args: unknown[]) => {
    const res = await orig(...args) as { model?: string; usage?: { prompt_tokens?: number; completion_tokens?: number } } | null;
    if (res?.usage) report(res.model ?? "", res.usage.prompt_tokens ?? 0, res.usage.completion_tokens ?? 0, key);
    return res;
  };
  return client;
}

export function wrapAnthropic<T extends object>(client: T, { key }: { key: string }): T {
  const m = (client as Record<string, unknown> & { messages?: { create: (...args: unknown[]) => unknown } }).messages;
  if (!m) return client;
  const orig = m.create.bind(m);
  m.create = async (...args: unknown[]) => {
    const res = await orig(...args) as { model?: string; usage?: { input_tokens?: number; output_tokens?: number } } | null;
    if (res?.usage) report(res.model ?? "", res.usage.input_tokens ?? 0, res.usage.output_tokens ?? 0, key);
    return res;
  };
  return client;
}
