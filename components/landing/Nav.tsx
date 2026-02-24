import Link from "next/link";

export default function Nav() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-[60px]"
      style={{
        background: "rgba(10,10,11,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <span
          className="pulse-dot w-2 h-2 rounded-full inline-block"
          style={{ background: "var(--accent)" }}
        />
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
          AI Bill Guard
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm">
        <a href="#features" className="nav-link">Features</a>
        <a href="#how-it-works" className="nav-link">How it works</a>
        <a href="#pricing" className="nav-link">Pricing</a>
      </div>

      <a
        href="#waitlist"
        className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Join waitlist →
      </a>
    </nav>
  );
}
