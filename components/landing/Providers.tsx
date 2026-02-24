const providers = [
  "OpenAI",
  "Anthropic",
  "Groq",
  "Google Gemini",
  "Azure OpenAI",
  "Fireworks AI",
  "Together AI",
  "Mistral",
  "Midjourney",
  "ElevenLabs",
  "Perplexity",
  "+ more coming",
];

export default function Providers() {
  return (
    <section className="px-6 py-20 text-center">
      <div className="max-w-4xl mx-auto">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-4"
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          INTEGRATIONS
        </p>
        <h2
          className="font-light tracking-tight mb-12"
          style={{
            fontSize: "clamp(28px, 3.5vw, 44px)",
            letterSpacing: "-1px",
          }}
        >
          Works with every provider you already use
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          {providers.map((p) => (
            <span
              key={p}
              className="provider-card px-4 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
                color: p.startsWith("+") ? "var(--muted)" : "var(--text)",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
