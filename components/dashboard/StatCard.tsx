interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, subColor = "var(--muted)", icon }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "var(--muted)" }}>
          {label}
        </span>
        {icon && <span style={{ color: "var(--muted)" }}>{icon}</span>}
      </div>
      <div className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: subColor }}>
          {sub}
        </div>
      )}
    </div>
  );
}
