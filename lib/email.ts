import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "AI Bill Guard <noreply@aibillguard.ai>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.trim() === "re_") {
    console.warn("[email] RESEND_API_KEY not configured — skipping send");
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[email] send error:", error);
  } catch (err) {
    console.error("[email] unexpected error:", err);
  }
}
