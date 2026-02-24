const steps = [
  {
    num: "01",
    title: "Connect your providers",
    desc: "Paste your API keys (encrypted AES-256-GCM, never logged) or forward billing emails. Takes 2 minutes. Works with 10+ AI providers.",
  },
  {
    num: "02",
    title: "See your unified dashboard",
    desc: "Every provider. Every model. Every project. One beautiful real-time view. Spend by feature, by team member, by day — crystal clear.",
  },
  {
    num: "03",
    title: "Let AI find your savings",
    desc: 'Hit "Optimize This Month." Our AI analyzes your patterns and serves up specific, copy-paste recommendations with estimated dollar savings.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-6 py-20"
      style={{
        background: "var(--bg2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            HOW IT WORKS
          </p>
          <h2
            className="font-light tracking-tight"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              letterSpacing: "-1px",
            }}
          >
            Connect once, understand everything
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div
                className="text-6xl font-light mb-5"
                style={{
                  fontFamily: "var(--font-instrument-serif)",
                  color: "var(--accent)",
                  opacity: 0.5,
                  letterSpacing: "-2px",
                }}
              >
                {s.num}
              </div>
              <h3
                className="font-medium mb-3 text-lg"
                style={{ color: "var(--text)" }}
              >
                {s.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
