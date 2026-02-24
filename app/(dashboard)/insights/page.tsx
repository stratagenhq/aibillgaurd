import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { usageSnapshots, providers } from "@/lib/db/schema";
import { PROVIDER_META } from "@/lib/providers";
import { formatCurrency, formatTokens } from "@/lib/utils";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function InsightsPage() {
  const user = await currentUser();
  if (!user) return null;

  const thirtyDaysAgo = dateOffset(30);

  const snaps = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(
        eq(usageSnapshots.userId, user.id),
        gte(usageSnapshots.date, thirtyDaysAgo)
      )
    );

  const userProviders = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, user.id));

  const providerMap = Object.fromEntries(userProviders.map((p) => [p.id, p]));

  // Aggregate by model + provider
  const modelMap: Record<
    string,
    { model: string; providerType: string; cost: number; tokens: number; requests: number }
  > = {};

  for (const s of snaps) {
    const provider = providerMap[s.providerId];
    const key = `${s.providerId}:${s.model}`;
    if (!modelMap[key]) {
      modelMap[key] = {
        model: s.model,
        providerType: provider?.providerType ?? "unknown",
        cost: 0,
        tokens: 0,
        requests: 0,
      };
    }
    modelMap[key].cost += parseFloat(s.costUsd ?? "0");
    modelMap[key].tokens += s.totalTokens ?? 0;
    modelMap[key].requests += s.requestCount ?? 0;
  }

  const rows = Object.values(modelMap).sort((a, b) => b.cost - a.cost);
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
          Insights
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Per-model breakdown · Last 30 days
        </p>
      </div>

      {rows.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        >
          {userProviders.some((p) => p.lastSyncedAt != null) ? (
            <>
              <p className="text-sm mb-1" style={{ color: "var(--text)" }}>Synced recently — no usage found</p>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                No billed API usage was found in your account for the last 30 days.
                Make sure your API key has actual calls on it.
              </p>
              <Link
                href="/connections"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Check connections →
              </Link>
            </>
          ) : userProviders.length > 0 ? (
            <>
              <p className="text-sm mb-1" style={{ color: "var(--text)" }}>No usage data yet</p>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                Your providers are connected. Click Sync on any provider to pull usage data.
              </p>
              <Link
                href="/connections"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Sync providers →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm mb-1" style={{ color: "var(--text)" }}>No data yet</p>
              <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                Connect and sync a provider to see per-model breakdowns.
              </p>
              <Link
                href="/connections"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                Connect a provider →
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total spend", value: formatCurrency(totalCost) },
              { label: "Total tokens", value: formatTokens(rows.reduce((s, r) => s + r.tokens, 0)) },
              { label: "Models used", value: String(rows.length) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  {item.label}
                </div>
                <div className="text-xl font-semibold" style={{ color: "var(--text)" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Model table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
                  {["Model", "Provider", "Cost", "Tokens", "Requests", "$/1K req"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium"
                      style={{ color: "var(--muted)", fontSize: 11 }}
                    >
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: "var(--bg)" }}>
                {rows.map((row, i) => {
                  const meta = PROVIDER_META[row.providerType as keyof typeof PROVIDER_META];
                  const costPer1KReq =
                    row.requests > 0 ? (row.cost / row.requests) * 1000 : 0;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text)" }}>
                        {row.model}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs"
                          style={{ color: meta?.color ?? "var(--muted)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: meta?.color ?? "var(--muted)" }}
                          />
                          {meta?.label ?? row.providerType}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "var(--text)" }}>
                        {formatCurrency(row.cost)}
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "var(--muted)" }}>
                        {formatTokens(row.tokens)}
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "var(--muted)" }}>
                        {row.requests.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 tabular-nums" style={{ color: "var(--muted)" }}>
                        {row.requests > 0 ? formatCurrency(costPer1KReq) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
