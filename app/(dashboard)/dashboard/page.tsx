import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { providers, usageSnapshots } from "@/lib/db/schema";
import { StatCard } from "@/components/dashboard/StatCard";
import { SpendChart } from "@/components/dashboard/SpendChart";
import { ProviderTable } from "@/components/dashboard/ProviderTable";
import { formatCurrency, formatTokens, getDaysInMonth } from "@/lib/utils";
import { DollarSign, TrendingUp, Cpu, Zap } from "lucide-react";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const user = await currentUser();
  const userId = user?.id;
  if (!userId) return null;

  // Fetch user's providers
  const userProviders = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, userId));

  // Empty state
  if (userProviders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
            Welcome back{user.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Connect your first AI provider to start tracking costs.
          </p>
        </div>
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        >
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-lg font-medium mb-2" style={{ color: "var(--text)" }}>
            No providers connected
          </h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
            Connect your first AI provider to see your unified spend dashboard. Takes 2 minutes.
          </p>
          <Link
            href="/connections"
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Connect a provider →
          </Link>
        </div>
      </div>
    );
  }

  // Date helpers
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const thirtyDaysAgo = dateOffset(30);

  // Fetch all snapshots for last 30 days
  const snapshots = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(
        eq(usageSnapshots.userId, userId),
        gte(usageSnapshots.date, thirtyDaysAgo)
      )
    );

  // This-month snapshots (subset)
  const thisMonthSnapshots = snapshots.filter(
    (s) => s.date >= monthStart && s.date <= today
  );

  // Stats
  const thisMonthCost = thisMonthSnapshots.reduce(
    (sum, s) => sum + parseFloat(s.costUsd ?? "0"),
    0
  );
  const projectedCost =
    dayOfMonth > 0 ? (thisMonthCost / dayOfMonth) * daysInMonth : 0;
  const totalTokens = thisMonthSnapshots.reduce(
    (sum, s) => sum + (s.totalTokens ?? 0),
    0
  );
  const activeProviders = userProviders.filter((p) => p.status === "active").length;

  // 30-day chart data
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = dateOffset(29 - i);
    const label = formatDate(29 - i);
    const dayCost = snapshots
      .filter((s) => s.date === date)
      .reduce((sum, s) => sum + parseFloat(s.costUsd ?? "0"), 0);
    return { date: label, cost: dayCost };
  });

  // Provider breakdown
  const providerRows = userProviders
    .map((p) => {
      const pSnaps = thisMonthSnapshots.filter((s) => s.providerId === p.id);
      const cost = pSnaps.reduce((sum, s) => sum + parseFloat(s.costUsd ?? "0"), 0);
      const tokens = pSnaps.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0);
      return {
        id: p.id,
        providerType: p.providerType,
        displayName: p.displayName,
        cost,
        tokens,
        percentOfTotal: thisMonthCost > 0 ? (cost / thisMonthCost) * 100 : 0,
      };
    })
    .sort((a, b) => b.cost - a.cost);

  const hasCostData = thisMonthCost > 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
            Overview
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/connections"
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)", color: "var(--muted)" }}
        >
          + Add provider
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="This Month"
          value={formatCurrency(thisMonthCost)}
          sub={`Day ${dayOfMonth} of ${daysInMonth}`}
          icon={<DollarSign size={15} />}
        />
        <StatCard
          label="Projected"
          value={formatCurrency(projectedCost)}
          sub={
            projectedCost > thisMonthCost
              ? `+${formatCurrency(projectedCost - thisMonthCost)} over pace`
              : "On track"
          }
          subColor={projectedCost > thisMonthCost * 1.2 ? "#ef4444" : "var(--muted)"}
          icon={<TrendingUp size={15} />}
        />
        <StatCard
          label="Total Tokens"
          value={formatTokens(totalTokens)}
          sub="this month"
          icon={<Cpu size={15} />}
        />
        <StatCard
          label="Active Providers"
          value={String(activeProviders)}
          sub={`of ${userProviders.length} connected`}
          icon={<Zap size={15} />}
        />
      </div>

      {/* Spend chart */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Daily spend
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Last 30 days</p>
          </div>
        </div>
        {hasCostData ? (
          <SpendChart data={chartData} />
        ) : (
          <div className="h-44 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No spend data yet.{" "}
              <Link href="/connections" style={{ color: "var(--accent)" }}>
                Sync a provider →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Provider breakdown */}
      {hasCostData && (
        <div className="mb-2">
          <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text)" }}>
            Provider breakdown
          </h2>
          <ProviderTable rows={providerRows} totalCost={thisMonthCost} />
        </div>
      )}
    </div>
  );
}
