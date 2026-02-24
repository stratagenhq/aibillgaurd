import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1
          className="text-2xl font-light mb-1 tracking-tight"
          style={{ color: "var(--text)" }}
        >
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Connect your first AI provider to start tracking costs.
        </p>
      </div>

      {/* Empty state */}
      <div
        className="rounded-2xl p-12 text-center"
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="text-4xl mb-4">⚡</div>
        <h2
          className="text-lg font-medium mb-2"
          style={{ color: "var(--text)" }}
        >
          No providers connected yet
        </h2>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
          Connect your first AI provider to see your unified spend dashboard.
          Takes 2 minutes.
        </p>
        <a
          href="/connections"
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          Connect a provider →
        </a>
      </div>
    </div>
  );
}
