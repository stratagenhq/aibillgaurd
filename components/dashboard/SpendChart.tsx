"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartPoint {
  date: string;
  cost: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border-bright)",
        color: "var(--text)",
      }}
    >
      <div style={{ color: "var(--muted)" }}>{label}</div>
      <div className="font-semibold mt-0.5">
        ${payload[0].value.toFixed(2)}
      </div>
    </div>
  );
}

export function SpendChart({ data }: { data: ChartPoint[] }) {
  const maxCost = Math.max(...data.map((d) => d.cost), 0.01);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barSize={14} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--muted)" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.cost >= maxCost * 0.7 ? "#e8431a" : "rgba(255,255,255,0.12)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
