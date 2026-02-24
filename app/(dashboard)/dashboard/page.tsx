import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte, lte } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { providers, usageSnapshots } from "@/lib/db/schema";
import { StatCard } from "@/components/dashboard/StatCard";
import { SpendChart } from "@/components/dashboard/SpendChart";
import { ModelTable } from "@/components/dashboard/ModelTable";
import { OptimizeBanner } from "@/components/dashboard/OptimizeBanner";
import { formatCurrency, formatTokens, getDaysInMonth } from "@/lib/utils";
import { PROVIDER_META } from "@/lib/providers";
import { DollarSign, TrendingUp, Cpu, AlertTriangle } from "lucide-react";
import type { ModelRow } from "@/components/dashboard/ModelTable";

/* ── date helpers ─────────────────────────────────────── */
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function shortLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── waste score heuristic ────────────────────────────── */
function calcWasteScore(models: ModelRow[]) {
  const total = models.reduce((s, m) => s + m.cost, 0);
  if (total === 0) return null;

  const premiumModels = [
    "gpt-4o",
    "gpt-4-turbo",
    "gpt-4-",
    "claude-3-opus",
    "o1-2024",
    "o1-preview",
  ];
  const premiumCost = models
    .filter(
      (m) =>
        premiumModels.some((p) => m.model.toLowerCase().includes(p)) &&
        !m.model.toLowerCase().includes("mini")
    )
    .reduce((s, m) => s + m.cost, 0);

  const pct = (premiumCost / total) * 100;
  if (pct >= 65) return { score: Math.round(55 + pct * 0.45), label: "HIGH", color: "#ef4444" };
  if (pct >= 30) return { score: Math.round(30 + pct * 0.7), label: "MED", color: "#f5a623" };
  return { score: Math.round(Math.max(pct * 0.5, 5)), label: "LOW", color: "#22c55e" };
}

/* ══════════════════════════════════════════════════════ */

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return null;
  const userId = user.id;

  /* Providers */
  const userProviders = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, userId));

  /* Empty state */
  if (userProviders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1
            className="text-2xl font-light tracking-tight mb-1"
            style={{ color: "var(--text)" }}
          >
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
          <p
            className="text-sm mb-6 max-w-sm mx-auto"
            style={{ color: "var(--muted)" }}
          >
            Connect your first AI provider to see your unified spend dashboard.
            Takes 2 minutes.
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

  /* Date ranges */
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth());
  const thisMonthStart = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = isoDate(now);

  const lastMonthStart = isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = isoDate(new Date(now.getFullYear(), now.getMonth(), 0));

  const thirtyDaysAgo = isoDate(daysAgo(30));

  /* Snapshots */
  const [snaps30, lastMonthSnaps] = await Promise.all([
    db
      .select()
      .from(usageSnapshots)
      .where(
        and(
          eq(usageSnapshots.userId, userId),
          gte(usageSnapshots.date, thirtyDaysAgo)
        )
      ),
    db
      .select()
      .from(usageSnapshots)
      .where(
        and(
          eq(usageSnapshots.userId, userId),
          gte(usageSnapshots.date, lastMonthStart),
          lte(usageSnapshots.date, lastMonthEnd)
        )
      ),
  ]);

  const thisMonthSnaps = snaps30.filter(
    (s) => s.date >= thisMonthStart && s.date <= today
  );

  /* Aggregated stats */
  const thisMonthCost = thisMonthSnaps.reduce(
    (sum, s) => sum + parseFloat(s.costUsd ?? "0"),
    0
  );
  const lastMonthCost = lastMonthSnaps.reduce(
    (sum, s) => sum + parseFloat(s.costUsd ?? "0"),
    0
  );
  const projectedCost =
    dayOfMonth > 0 ? (thisMonthCost / dayOfMonth) * daysInMonth : 0;
  const totalTokens = thisMonthSnaps.reduce(
    (sum, s) => sum + (s.totalTokens ?? 0),
    0
  );

  /* Month-over-month */
  const moMPct =
    lastMonthCost > 0
      ? ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100
      : null;

  /* 30-day chart */
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = daysAgo(29 - i);
    const dateStr = isoDate(d);
    const cost = snaps30
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + parseFloat(s.costUsd ?? "0"), 0);
    return { date: shortLabel(d), cost };
  });

  /* Model breakdown (this month) */
  const providerMap = Object.fromEntries(userProviders.map((p) => [p.id, p]));
  const modelAgg: Record<
    string,
    { model: string; providerType: string; cost: number; tokens: number; requests: number }
  > = {};
  for (const s of thisMonthSnaps) {
    const key = `${s.providerId}::${s.model}`;
    const pType =
      providerMap[s.providerId]?.providerType ?? "openai";
    if (!modelAgg[key]) {
      modelAgg[key] = { model: s.model, providerType: pType, cost: 0, tokens: 0, requests: 0 };
    }
    modelAgg[key].cost += parseFloat(s.costUsd ?? "0");
    modelAgg[key].tokens += s.totalTokens ?? 0;
    modelAgg[key].requests += s.requestCount ?? 0;
  }
  const modelRows: ModelRow[] = Object.values(modelAgg)
    .sort((a, b) => b.cost - a.cost)
    .map((m) => ({
      ...m,
      percentOfTotal: thisMonthCost > 0 ? (m.cost / thisMonthCost) * 100 : 0,
    }));

  /* Waste score */
  const waste = calcWasteScore(modelRows);

  /* Active providers count */
  const activeCount = userProviders.filter((p) => p.status === "active").length;

  const hasCostData = thisMonthCost > 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-light tracking-tight mb-1"
            style={{ color: "var(--text)" }}
          >
            Overview
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            {" · "}
            {activeCount} provider{activeCount !== 1 ? "s" : ""} connected
          </p>
        </div>
        <Link
          href="/connections"
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          + Manage providers
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="This Month"
          value={formatCurrency(thisMonthCost)}
          sub={
            moMPct !== null
              ? `${moMPct >= 0 ? "↑" : "↓"} ${Math.abs(moMPct).toFixed(0)}% vs last month`
              : `Day ${dayOfMonth} of ${daysInMonth}`
          }
          subColor={
            moMPct !== null && moMPct > 10
              ? "#ef4444"
              : moMPct !== null && moMPct < -5
              ? "#22c55e"
              : "var(--muted)"
          }
          icon={<DollarSign size={14} />}
        />
        <StatCard
          label="Projected"
          value={formatCurrency(projectedCost)}
          sub={
            projectedCost > thisMonthCost * 1.15
              ? `+${formatCurrency(projectedCost - thisMonthCost)} over pace`
              : "On track"
          }
          subColor={
            projectedCost > thisMonthCost * 1.15 ? "#f5a623" : "#22c55e"
          }
          icon={<TrendingUp size={14} />}
        />
        <StatCard
          label="Total Tokens"
          value={formatTokens(totalTokens)}
          sub={`across ${modelRows.length} model${modelRows.length !== 1 ? "s" : ""}`}
          icon={<Cpu size={14} />}
        />
        <StatCard
          label="Waste Score"
          value={waste ? `${waste.score}/100` : "—"}
          sub={waste ? `${waste.label} — ${waste.label === "HIGH" ? "action needed" : waste.label === "MED" ? "room to improve" : "well optimized"}` : "No data yet"}
          subColor={waste?.color ?? "var(--muted)"}
          icon={<AlertTriangle size={14} />}
        />
      </div>

      {/* Spend chart */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              Daily spend
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              Last 30 days
            </p>
          </div>
          {hasCostData && (
            <div className="text-right">
              <div
                className="text-sm font-semibold"
                style={{ color: "var(--text)" }}
              >
                {formatCurrency(chartData.reduce((s, d) => s + d.cost, 0))}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                30-day total
              </div>
            </div>
          )}
        </div>
        {hasCostData ? (
          <SpendChart data={chartData} />
        ) : (
          <div className="h-44 flex flex-col items-center justify-center gap-2">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No spend data yet
            </p>
            <Link
              href="/connections"
              className="text-xs"
              style={{ color: "var(--accent)" }}
            >
              Sync a provider to see your data →
            </Link>
          </div>
        )}
      </div>

      {/* AI Optimize banner */}
      <div className="mb-6">
        <OptimizeBanner hasData={hasCostData} />
      </div>

      {/* Model breakdown */}
      {modelRows.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Model breakdown
            </h2>
            <Link
              href="/insights"
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              Full insights →
            </Link>
          </div>
          <ModelTable rows={modelRows} />
        </div>
      )}

      {/* No data nudge */}
      {!hasCostData && (
        <div
          className="rounded-xl p-8 text-center mt-4"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--text)" }}>
            Providers connected — now sync usage data
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Go to Connections and click &quot;Sync&quot; to pull the last 30 days of usage.
          </p>
          <Link
            href="/connections"
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Sync now →
          </Link>
        </div>
      )}
    </div>
  );
}
