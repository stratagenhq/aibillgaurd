export default function Footer() {
  return (
    <footer
      className="px-6 py-10"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text)" }}
          >
            AI Bill Guard
          </span>
        </div>

        <div
          className="flex items-center gap-6 text-sm"
          style={{ color: "var(--muted)" }}
        >
          <a href="#" className="nav-link">Privacy</a>
          <a href="#" className="nav-link">Terms</a>
          <a href="#" className="nav-link">Security</a>
          <a
            href="mailto:hi@aibillguard.ai"
            className="nav-link"
          >
            hi@aibillguard.ai
          </a>
        </div>

        <p className="text-sm" style={{ color: "var(--muted)" }}>
          © 2026 AI Bill Guard. Built for AI builders.
        </p>
      </div>
    </footer>
  );
}
