const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://aibillgaurd.vercel.app";

export function welcomeEmail({ firstName }: { firstName?: string | null }) {
  const name = firstName ?? "there";
  return {
    subject: "Welcome to AI Bill Guard",
    html: layout(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#0f0f10;">
        Hey ${name}, welcome! 👋
      </h1>
      <p style="margin:0 0 20px;color:#555;">
        You just signed up for <strong>AI Bill Guard</strong> — the fastest way to
        track and optimize your AI API spend across every provider.
      </p>
      <p style="margin:0 0 8px;color:#555;">Here's how to get started in 2 minutes:</p>
      <ol style="margin:0 0 24px;padding-left:20px;color:#555;line-height:1.8;">
        <li>Connect your first AI provider (OpenAI, Anthropic, etc.)</li>
        <li>Click <strong>Sync</strong> to pull your last 30 days of usage</li>
        <li>Watch your dashboard light up with spend data</li>
      </ol>
      <a href="${APP_URL}/connections"
         style="display:inline-block;background:#e8431a;color:#fff;text-decoration:none;
                padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        Connect your first provider →
      </a>
      <p style="margin:32px 0 0;color:#888;font-size:13px;">
        Questions? Reply to this email — we read every one.
      </p>
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
        <!-- Logo bar -->
        <tr>
          <td style="padding:0 0 24px;">
            <span style="font-size:15px;font-weight:700;color:#e8431a;letter-spacing:-0.3px;">
              ⚡ AI Bill Guard
            </span>
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background:#fff;border-radius:12px;padding:36px 40px;border:1px solid #e4e4e7;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
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
