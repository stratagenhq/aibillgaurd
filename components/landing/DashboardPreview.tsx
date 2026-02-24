"use client";

import { useState } from "react";

const stats = [
  {
    label: "This Month",
    value: "$3,284",
    sub: "↑ 23% vs last month",
    subColor: "#ef4444",
  },
  {
    label: "Projected",
    value: "$4,920",
    sub: "↑ on track to overshoot",
    subColor: "#f5a623",
  },
  {
    label: "Tokens Used",
    value: "84.2M",
    sub: "across 6 providers",
    subColor: "#7c7b8a",
  },
  {
    label: "Waste Score",
    value: "67",
    sub: "High – action needed",
    subColor: "#ef4444",
  },
];

const chartData = [
  580, 920, 840, 1100, 1380, 1240, 1640, 1480, 1820, 2040, 1960, 2280, 2480,
  2180,
];

const providers = [
  {
    name: "GPT-4o",
    color: "#22c55e",
    cost: "$1,840",
    pct: 90,
    waste: "HIGH",
    wasteColor: "#ef4444",
  },
  {
    name: "Claude Opus",
    color: "#e8431a",
    cost: "$940",
    pct: 46,
    waste: "MED",
    wasteColor: "#f5a623",
  },
  {
    name: "Groq Llama-70B",
    color: "#f5a623",
    cost: "$89",
    pct: 15,
    waste: "LOW",
    wasteColor: "#22c55e",
  },
];

export default function DashboardPreview() {
  const [showOptimize, setShowOptimize] = useState(false);
  const max = Math.max(...chartData);

  return (
    <section id="dashboard-preview" className="px-6 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            LIVE PREVIEW
          </p>
          <h2
            className="font-light tracking-tight"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              letterSpacing: "-1px",
            }}
          >
            Your unified AI spend dashboard
          </h2>
        </div>

        {/* Dashboard Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            boxShadow: "0 40px 120px rgba(0,0,0,0.6)",
          }}
        >
          {/* Window chrome */}
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--bg3)",
            }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#f5a623" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
            <span
              className="ml-3 text-xs"
              style={{
                color: "var(--muted)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}
            >
              aibillguard.ai/dashboard
            </span>
          </div>

          <div className="p-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
                    {s.label}
                  </p>
                  <p
                    className="text-xl font-semibold mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs" style={{ color: s.subColor }}>
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div
              className="rounded-xl p-4 mb-4"
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
                14-day spend trend
              </p>
              <div className="flex items-end gap-1 h-20">
                {chartData.map((val, i) => {
                  const isRecent = i >= chartData.length - 4;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${(val / max) * 100}%`,
                        background: isRecent
                          ? "linear-gradient(to top, #e8431a, #f5a623)"
                          : "rgba(255,255,255,0.08)",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Provider table */}
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="grid grid-cols-4 px-4 py-2 text-xs"
                style={{ background: "var(--bg3)", color: "var(--muted)" }}
              >
                <span>Model</span>
                <span>Cost</span>
                <span>Volume</span>
                <span>Waste</span>
              </div>
              {providers.map((p) => (
                <div
                  key={p.name}
                  className="grid grid-cols-4 px-4 py-3 text-sm items-center"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: p.color }}
                    />
                    <span style={{ color: "var(--text)" }}>{p.name}</span>
                  </span>
                  <span style={{ color: "var(--text)" }}>{p.cost}</span>
                  <div
                    className="h-1.5 rounded-full w-4/5"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.pct}%`, background: p.color }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded w-fit"
                    style={{
                      color: p.wasteColor,
                      background: `${p.wasteColor}1a`,
                    }}
                  >
                    {p.waste}
                  </span>
                </div>
              ))}
            </div>

            {/* Optimize banner */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "rgba(232,67,26,0.07)",
                border: "1px solid rgba(232,67,26,0.2)",
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm" style={{ color: "var(--text)" }}>
                  💡 AI found{" "}
                  <strong>3 optimization opportunities</strong> — estimated
                  savings{" "}
                  <strong style={{ color: "var(--accent)" }}>$680/mo</strong>
                </p>
                <button
                  onClick={() => setShowOptimize(!showOptimize)}
                  className="text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {showOptimize ? "Hide results" : "Optimize this month →"}
                </button>
              </div>

              {showOptimize && (
                <div className="mt-4 space-y-3">
                  <div
                    className="rounded-lg p-4"
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="text-xs px-2 py-1 rounded font-medium shrink-0 mt-0.5"
                        style={{
                          background: "rgba(34,197,94,0.15)",
                          color: "#22c55e",
                        }}
                      >
                        QUICK WIN
                      </span>
                      <div>
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "var(--text)" }}
                        >
                          Swap GPT-4o → GPT-4o-mini for summarization
                        </p>
                        <p
                          className="text-xs mb-2"
                          style={{ color: "var(--muted)" }}
                        >
                          Task complexity low, GPT-4o-mini has 94% quality
                          parity
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--green)" }}
                        >
                          −$420/mo savings
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-lg p-4"
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="text-xs px-2 py-1 rounded font-medium shrink-0 mt-0.5"
                        style={{
                          background: "rgba(245,166,35,0.15)",
                          color: "#f5a623",
                        }}
                      >
                        MEDIUM
                      </span>
                      <div>
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "var(--text)" }}
                        >
                          Enable semantic caching on FAQ responses
                        </p>
                        <p
                          className="text-xs mb-2"
                          style={{ color: "var(--muted)" }}
                        >
                          1,240 near-duplicates detected — 31% cost reduction
                          possible
                        </p>
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--green)" }}
                        >
                          −$260/mo savings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
