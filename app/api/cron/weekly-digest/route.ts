import { NextResponse } from "next/server";
import { gte, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, usageSnapshots } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { weeklyDigestEmail } from "@/emails/weekly-digest";

// Vercel cron: runs every Monday at 9am UTC
// Configured in vercel.json

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  // Verify the request is from Vercel Cron (or our own secret for manual triggers)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeekStart = isoDate(sevenDaysAgo);
  const prevWeekStart = isoDate(fourteenDaysAgo);
  const prevWeekEnd = isoDate(sevenDaysAgo);
  const monthStartStr = isoDate(monthStart);

  // Fetch all users
  const allUsers = await db.select().from(users);

  // Fetch all snapshots from the last 14 days + month-to-date in one query
  const snaps = await db
    .select()
    .from(usageSnapshots)
    .where(gte(usageSnapshots.date, prevWeekStart));

  let sent = 0;
  let skipped = 0;

  for (const user of allUsers) {
    const userSnaps = snaps.filter((s) => s.userId === user.id);

    // Skip users with no data this week
    const thisWeekSnaps = userSnaps.filter((s) => s.date >= thisWeekStart);
    if (thisWeekSnaps.length === 0) {
      skipped++;
      continue;
    }

    const weekCost = thisWeekSnaps.reduce(
      (sum, s) => sum + parseFloat(s.costUsd ?? "0"),
      0
    );

    const prevWeekSnaps = userSnaps.filter(
      (s) => s.date >= prevWeekStart && s.date < prevWeekEnd
    );
    const prevWeekCost = prevWeekSnaps.reduce(
      (sum, s) => sum + parseFloat(s.costUsd ?? "0"),
      0
    );

    const monthSnaps = userSnaps.filter((s) => s.date >= monthStartStr);
    const monthCost = monthSnaps.reduce(
      (sum, s) => sum + parseFloat(s.costUsd ?? "0"),
      0
    );

    // Aggregate by model for this week
    const modelMap: Record<string, { cost: number; requests: number }> = {};
    for (const s of thisWeekSnaps) {
      if (!modelMap[s.model]) modelMap[s.model] = { cost: 0, requests: 0 };
      modelMap[s.model].cost += parseFloat(s.costUsd ?? "0");
      modelMap[s.model].requests += s.requestCount ?? 0;
    }
    const topModels = Object.entries(modelMap)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 5)
      .map(([model, data]) => ({ model, ...data }));

    // Extract first name from fullName
    const firstName = user.fullName?.split(" ")[0] ?? null;

    const { subject, html } = weeklyDigestEmail({
      firstName,
      weekCost,
      prevWeekCost,
      topModels,
      monthCost,
    });

    await sendEmail({ to: user.email, subject, html });
    sent++;
  }

  return NextResponse.json({ sent, skipped });
}
