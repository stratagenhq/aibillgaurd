const trustItems = [
  "Zero prompt data stored",
  "Works in 2 minutes",
  "Free forever plan",
];

export default function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6"
      style={{ minHeight: "100svh", paddingTop: "120px", paddingBottom: "80px" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,67,26,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div
        className="fade-up relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8"
        style={{
          background: "var(--bg3)",
          border: "1px solid var(--border-bright)",
          color: "var(--muted)",
        }}
      >
        <span>🔥</span>
        <span>For AI founders &amp; indie hackers</span>
      </div>

      {/* Heading */}
      <h1
        className="fade-up delay-1 relative font-light leading-tight mb-6"
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "clamp(46px, 7vw, 88px)",
          letterSpacing: "-2px",
          color: "var(--text)",
        }}
      >
        Stop getting surprised
        <br />
        by your{" "}
        <em
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontStyle: "italic",
            color: "var(--accent)",
            fontWeight: 400,
          }}
        >
          AI bill
        </em>
      </h1>

      {/* Subheading */}
      <p
        className="fade-up delay-2 relative max-w-xl mx-auto mb-10 leading-relaxed"
        style={{ color: "var(--muted)", fontSize: "16px" }}
      >
        Connect once. See exactly where every dollar goes across OpenAI,
        Anthropic, Groq, Gemini, and 10+ more. Get AI-powered savings
        suggestions. Never get a $4k shock again.
      </p>

      {/* CTAs */}
      <div className="fade-up delay-3 relative flex flex-wrap items-center justify-center gap-4 mb-10">
        <a
          href="#waitlist"
          className="px-6 py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Join the waitlist — free →
        </a>
        <a
          href="#dashboard-preview"
          className="px-6 py-3 rounded-lg text-sm font-medium"
          style={{
            background: "var(--bg3)",
            color: "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          ▶ See demo
        </a>
      </div>

      {/* Trust indicators */}
      <div
        className="fade-up delay-4 relative flex flex-wrap items-center justify-center gap-6 text-sm"
        style={{ color: "var(--muted)" }}
      >
        {trustItems.map((item) => (
          <span key={item} className="flex items-center gap-1.5">
            <span style={{ color: "var(--green)" }}>✓</span>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
