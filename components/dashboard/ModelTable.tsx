import { PROVIDER_META } from "@/lib/providers";
import { formatCurrency, formatTokens } from "@/lib/utils";

export interface ModelRow {
  model: string;
  providerType: string;
  cost: number;
  tokens: number;
  requests: number;
  percentOfTotal: number;
}

function wasteLabel(model: string): { label: string; color: string; bg: string } {
  const m = model.toLowerCase();
  // High waste: expensive flagship models — could often be swapped for cheaper alternatives
  if (
    (m.includes("gpt-4o") && !m.includes("mini")) ||
    m.includes("gpt-4-turbo") ||
    m.startsWith("gpt-4") ||
    m.includes("claude-3-opus") ||
    (m.startsWith("o1") && !m.includes("mini"))
  ) {
    return { label: "HIGH", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  }
  // Medium waste: capable but mid-tier
  if (
    m.includes("claude-3-5-sonnet") ||
    m.includes("claude-3-sonnet") ||
    m.includes("o1-mini") ||
    m.includes("o3-mini") ||
    m.includes("mistral-large") ||
    m.includes("llama-3.1-70b")
  ) {
    return { label: "MED", color: "#f5a623", bg: "rgba(245,166,35,0.12)" };
  }
  // Low waste: already efficient models
  return { label: "LOW", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
}

export function ModelTable({ rows }: { rows: ModelRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--bg2)",
            }}
          >
            {["Model", "Provider", "Cost", "Tokens", "Requests", "Waste"].map(
              (h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-medium"
                  style={{ color: "var(--muted)", fontSize: 11 }}
                >
                  {h.toUpperCase()}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody style={{ background: "var(--bg)" }}>
          {rows.map((row, i) => {
            const meta =
              PROVIDER_META[row.providerType as keyof typeof PROVIDER_META];
            const waste = wasteLabel(row.model);
            return (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                {/* Model */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-3 shrink-0 rounded-sm"
                      style={{
                        width: `${Math.max(row.percentOfTotal, 3)}%`,
                        maxWidth: 48,
                        background: meta?.color ?? "#7c7b8a",
                        opacity: 0.7,
                      }}
                    />
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--text)" }}
                    >
                      {row.model}
                    </span>
                  </div>
                </td>
                {/* Provider */}
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs"
                    style={{ color: meta?.color ?? "var(--muted)" }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: meta?.color ?? "var(--muted)" }}
                    />
                    {meta?.label ?? row.providerType}
                  </span>
                </td>
                {/* Cost */}
                <td
                  className="px-4 py-3 tabular-nums"
                  style={{ color: "var(--text)" }}
                >
                  {formatCurrency(row.cost)}
                </td>
                {/* Tokens */}
                <td
                  className="px-4 py-3 tabular-nums"
                  style={{ color: "var(--muted)" }}
                >
                  {formatTokens(row.tokens)}
                </td>
                {/* Requests */}
                <td
                  className="px-4 py-3 tabular-nums"
                  style={{ color: "var(--muted)" }}
                >
                  {row.requests.toLocaleString()}
                </td>
                {/* Waste */}
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{ color: waste.color, background: waste.bg }}
                  >
                    {waste.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
