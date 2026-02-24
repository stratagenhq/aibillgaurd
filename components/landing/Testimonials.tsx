const testimonials = [
  {
    quote:
      "I had NO idea my summarization feature was using GPT-4o instead of mini. AI Bill Guard flagged it in the first week and saved us $400/month instantly.",
    name: "Marcus K.",
    role: "Indie hacker, AI writing tool",
  },
  {
    quote:
      "We have 5 devs using 3 providers. Before this, our billing reconciliation took 4 hours on the last day of every month. Now it's a 5 second glance.",
    name: "Sarah L.",
    role: "CTO, 8-person AI agency",
  },
  {
    quote:
      "The anomaly alert caught a runaway loop at 11pm on a Saturday. Saved me from waking up to a $2k surprise. Paid for itself in the first 3 days.",
    name: "Raj P.",
    role: "Solo founder, SaaS startup",
  },
];

export default function Testimonials() {
  return (
    <section
      className="px-6 py-20"
      style={{
        background: "var(--bg2)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            TESTIMONIALS
          </p>
          <h2
            className="font-light tracking-tight"
            style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              letterSpacing: "-1px",
            }}
          >
            Founders who stopped the bleeding
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl p-6 flex flex-col"
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-sm leading-relaxed mb-6 flex-1"
                style={{ color: "var(--text)" }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text)" }}
                >
                  {t.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
