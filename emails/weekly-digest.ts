const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://aibillgaurd.vercel.app";

interface ModelSummary {
  model: string;
  cost: number;
  requests: number;
}

export function weeklyDigestEmail({
  firstName,
  weekCost,
  prevWeekCost,
  topModels,
  monthCost,
}: {
  firstName?: string | null;
  weekCost: number;
  prevWeekCost: number;
  topModels: ModelSummary[];
  monthCost: number;
}) {
  const name = firstName ?? "there";
  const fmt = (n: number) =>
    n < 0.01 ? "<$0.01" : `$${n.toFixed(n < 1 ? 4 : 2)}`;

  const diff = weekCost - prevWeekCost;
  const diffPct = prevWeekCost > 0 ? Math.abs((diff / prevWeekCost) * 100) : null;
  const trendColor = diff > 0 ? "#dc2626" : "#16a34a";
  const trendArrow = diff > 0 ? "↑" : "↓";
  const trendLabel =
    diffPct !== null
      ? `${trendArrow} ${diffPct.toFixed(0)}% vs last week`
      : "First week of data";

  const modelRows = topModels
    .slice(0, 5)
    .map(
      (m) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;font-family:monospace;font-size:13px;color:#374151;">
          ${m.model}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-size:13px;color:#111;font-weight:600;">
          ${fmt(m.cost)}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;text-align:right;font-size:12px;color:#888;">
          ${m.requests.toLocaleString()} req
        </td>
      </tr>`
    )
    .join("");

  return {
    subject: `Your AI spend this week — ${fmt(weekCost)}`,
    html: layout(`
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:600;color:#0f0f10;">
        Weekly AI spend digest
      </h1>
      <p style="margin:0 0 28px;color:#888;font-size:14px;">
        Hey ${name}, here's your spending summary.
      </p>

      <!-- Big stat -->
      <div style="background:#f9fafb;border-radius:10px;padding:20px 24px;margin:0 0 24px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">This week</p>
          <p style="margin:0;font-size:32px;font-weight:700;color:#0f0f10;">${fmt(weekCost)}</p>
          <p style="margin:4px 0 0;font-size:13px;color:${trendColor};">${trendLabel}</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0 0 4px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Month to date</p>
          <p style="margin:0;font-size:20px;font-weight:600;color:#374151;">${fmt(monthCost)}</p>
        </div>
      </div>

      ${
        modelRows
          ? `<!-- Top models -->
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
        Top models this week
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
        ${modelRows}
      </table>`
          : ""
      }

      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#e8431a;color:#fff;text-decoration:none;
                padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        View full dashboard →
      </a>
    `),
  };
}

function layout(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="padding:0 0 24px;">
            <span style="font-size:15px;font-weight:700;color:#e8431a;letter-spacing:-0.3px;">
              ⚡ AI Bill Guard
            </span>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;border-radius:12px;padding:36px 40px;border:1px solid #e4e4e7;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 0 0;text-align:center;color:#a1a1aa;font-size:12px;">
            AI Bill Guard · Stop getting surprised by your AI bill<br>
            <a href="${APP_URL}/settings" style="color:#a1a1aa;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
