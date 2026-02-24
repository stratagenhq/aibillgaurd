const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://aibillgaurd.vercel.app";

export function providerConnectedEmail({
  firstName,
  providerLabel,
  syncSupported,
}: {
  firstName?: string | null;
  providerLabel: string;
  syncSupported: boolean;
}) {
  const name = firstName ?? "there";
  return {
    subject: `${providerLabel} connected to AI Bill Guard`,
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#0f0f10;">
        ${providerLabel} is connected ✓
      </h1>
      <p style="margin:0 0 20px;color:#555;">
        Hey ${name}, your <strong>${providerLabel}</strong> API key has been
        securely stored with AES-256 encryption.
      </p>
      ${syncSupported ? `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;color:#166534;font-size:14px;">
          <strong>Next step:</strong> head to Connections and click
          <strong>Sync now</strong> to pull your last 30 days of usage data.
        </p>
      </div>
      ` : `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          <strong>Heads up:</strong> ${providerLabel} doesn't have a public
          usage API yet. Your key is stored — we'll enable syncing as soon as
          it's available.
        </p>
      </div>
      `}
      <a href="${APP_URL}/connections"
         style="display:inline-block;background:#e8431a;color:#fff;text-decoration:none;
                padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        ${syncSupported ? "Sync usage data →" : "View connections →"}
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
