"use client";

import { useState, useEffect } from "react";
import { Loader2, Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Recommendation {
  type: "QUICK_WIN" | "MEDIUM" | "ADVANCED";
  title: string;
  description: string;
  savings_per_month: number;
}

interface OptimizeResult {
  savings_estimate: number;
  recommendations: Recommendation[];
}

const TYPE_CONFIG = {
  QUICK_WIN: { label: "Quick Win", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  MEDIUM: { label: "Medium", color: "#f5a623", bg: "rgba(245,166,35,0.12)" },
  ADVANCED: { label: "Advanced", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
};

const CACHE_KEY = "aibg_optimize_result";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function OptimizeBanner({ hasData }: { hasData: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Load from cache on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: OptimizeResult; ts: number };
        if (Date.now() - ts < CACHE_TTL_MS) {
          setResult(data);
          setState("done");
        }
      }
    } catch {
      // ignore
    }
  }, []);

  async function runAnalysis() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/ai/optimize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Analysis failed");
        setState("error");
        return;
      }
      setResult(data as OptimizeResult);
      setState("done");
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, ts: Date.now() })
        );
      } catch {
        // ignore storage errors
      }
    } catch {
      setErrorMsg("Network error — please try again");
      setState("error");
    }
  }

  function clearCache() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
    setResult(null);
    setState("idle");
  }

  if (!hasData) return null;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "rgba(232,67,26,0.06)",
        border: "1px solid rgba(232,67,26,0.2)",
      }}
    >
      {/* Banner header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          {state === "done" && result ? (
            <p className="text-sm" style={{ color: "var(--text)" }}>
              AI found{" "}
              <strong>{result.recommendations.length} optimization opportunities</strong>{" "}
              — estimated savings{" "}
              <strong style={{ color: "var(--accent)" }}>
                {formatCurrency(result.savings_estimate)}/mo
              </strong>
            </p>
          ) : state === "loading" ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Analyzing your usage patterns…
            </p>
          ) : state === "error" ? (
            <p className="text-sm" style={{ color: "#ef4444" }}>
              {errorMsg}
            </p>
          ) : (
            <p className="text-sm" style={{ color: "var(--text)" }}>
              <strong>AI optimization</strong> — analyze your spend to find savings
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {state === "done" && result && (
            <>
              <button
                onClick={clearCache}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg"
                style={{ color: "var(--muted)" }}
                title="Re-run analysis"
              >
                <RefreshCw size={11} />
              </button>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {expanded ? "Hide" : "View recommendations"}
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </>
          )}

          {(state === "idle" || state === "error") && (
            <button
              onClick={runAnalysis}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Optimize this month →
            </button>
          )}

          {state === "loading" && (
            <Loader2
              size={18}
              className="animate-spin"
              style={{ color: "var(--accent)" }}
            />
          )}
        </div>
      </div>

      {/* Recommendations */}
      {state === "done" && result && expanded && (
        <div className="mt-4 flex flex-col gap-3">
          {result.recommendations.map((rec, i) => {
            const cfg = TYPE_CONFIG[rec.type] ?? TYPE_CONFIG.MEDIUM;
            return (
              <div
                key={i}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="text-xs px-2 py-1 rounded font-medium shrink-0 mt-0.5"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium mb-1"
                    style={{ color: "var(--text)" }}
                  >
                    {rec.title}
                  </p>
                  <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                    {rec.description}
                  </p>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#22c55e" }}
                  >
                    −{formatCurrency(rec.savings_per_month)}/mo savings
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
