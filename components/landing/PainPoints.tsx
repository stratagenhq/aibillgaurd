const problems = [
  {
    icon: "💸",
    title: "Fragmented across 8+ tools",
    desc: "OpenAI, Anthropic, Groq, Midjourney, ElevenLabs — each with their own dashboard, billing cycle, and metric. Nobody sees the full picture.",
  },
  {
    icon: "🕳️",
    title: "No per-feature attribution",
    desc: "You know you spent $3k last month. But was it the chatbot? The image pipeline? The marketing tool? No idea. Budgets are guesses.",
  },
  {
    icon: "⏰",
    title: "You find out too late",
    desc: "The invoice hits your card. Not 3 days ago when costs started spiking. By then the damage is done and the month is over.",
  },
  {
    icon: "🧠",
    title: "You're leaving $$$ on the table",
    desc: "Using GPT-4o for tasks that GPT-4o-mini handles fine. No caching. No prompt compression. Easy wins invisible to busy founders.",
  },
];

export default function PainPoints() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            THE PROBLEM
          </p>
          <h2
            className="font-light tracking-tight"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              letterSpacing: "-1px",
            }}
          >
            Your AI costs are a black box.{" "}
            <span style={{ color: "var(--muted)" }}>Until now.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map((p) => (
            <div
              key={p.title}
              className="pain-card rounded-xl p-6 transition-colors"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-2xl mb-4 block">{p.icon}</span>
              <h3
                className="font-medium mb-2"
                style={{ fontSize: "18px", color: "var(--text)" }}
              >
                {p.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
