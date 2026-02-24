import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageSnapshots, providers } from "@/lib/db/schema";
import { PROVIDER_META } from "@/lib/providers";
import { formatCurrency, formatTokens } from "@/lib/utils";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage() {
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

  // Group by day for the export table
  const byDay: Record<string, { cost: number; tokens: number; requests: number }> = {};
  for (const s of snaps) {
    if (!byDay[s.date]) byDay[s.date] = { cost: 0, tokens: 0, requests: 0 };
    byDay[s.date].cost += parseFloat(s.costUsd ?? "0");
    byDay[s.date].tokens += s.totalTokens ?? 0;
    byDay[s.date].requests += s.requestCount ?? 0;
  }

  const dailyRows = Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 30);

  const totalCost = dailyRows.reduce((sum, [, r]) => sum + r.cost, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
            Reports
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Daily cost summary · Last 30 days
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            CSV export — Pro
          </span>
        </div>
      </div>

      {dailyRows.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No data to report yet. Connect and sync a provider first.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
                {["Date", "Cost", "Tokens", "Requests"].map((h) => (
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
              {dailyRows.map(([date, row], i) => (
                <tr
                  key={date}
                  style={{
                    borderBottom: i < dailyRows.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text)" }}>
                    {date}
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
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--muted)" }}>
                  TOTAL
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: "var(--text)" }}>
                  {formatCurrency(totalCost)}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: "var(--muted)" }}>
                  {formatTokens(dailyRows.reduce((s, [, r]) => s + r.tokens, 0))}
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: "var(--muted)" }}>
                  {dailyRows.reduce((s, [, r]) => s + r.requests, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
