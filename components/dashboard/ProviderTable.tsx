import { PROVIDER_META } from "@/lib/providers";
import { formatCurrency, formatTokens } from "@/lib/utils";

interface ProviderRow {
  id: string;
  providerType: string;
  displayName: string | null;
  cost: number;
  tokens: number;
  percentOfTotal: number;
}

export function ProviderTable({
  rows,
  totalCost,
}: {
  rows: ProviderRow[];
  totalCost: number;
}) {
  if (rows.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
            <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted)", fontSize: 11 }}>
              PROVIDER
            </th>
            <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted)", fontSize: 11 }}>
              THIS MONTH
            </th>
            <th className="hidden sm:table-cell text-right px-4 py-3 font-medium" style={{ color: "var(--muted)", fontSize: 11 }}>
              TOKENS
            </th>
            <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted)", fontSize: 11 }}>
              SHARE
            </th>
          </tr>
        </thead>
        <tbody style={{ background: "var(--bg)" }}>
          {rows.map((row, i) => {
            const meta = PROVIDER_META[row.providerType as keyof typeof PROVIDER_META];
            const label = row.displayName || meta?.label || row.providerType;
            return (
              <tr
                key={row.id}
                style={{
                  borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: meta?.color ?? "#7c7b8a" }}
                    />
                    <span style={{ color: "var(--text)" }}>{label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right" style={{ color: "var(--text)" }}>
                  {formatCurrency(row.cost)}
                </td>
                <td className="hidden sm:table-cell px-4 py-3 text-right" style={{ color: "var(--muted)" }}>
                  {formatTokens(row.tokens)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="hidden sm:block h-1 w-16 rounded-full overflow-hidden"
                      style={{ background: "var(--bg3)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.percentOfTotal}%`,
                          background: meta?.color ?? "#e8431a",
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                      {row.percentOfTotal.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
