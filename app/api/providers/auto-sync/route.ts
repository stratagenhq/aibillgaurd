import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncProvider, syncAllProvidersForUser, syncAllUsers } from "@/lib/sync-engine";

// GET — Vercel cron job (every 5 min)
// Must be called with Authorization: Bearer {CRON_SECRET}
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 401 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllUsers();
    return NextResponse.json({ synced: result.synced, errors: result.errors });
  } catch (err) {
    console.error("[auto-sync] Cron error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

// POST — Manual "Sync now" button from the UI
// Body: { providerId?: string }
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { providerId?: string };

    if (body.providerId) {
      const result = await syncProvider(body.providerId, userId);
      return NextResponse.json({
        synced: result.snapshotsUpserted,
        errors: result.error ? [result.error] : [],
      });
    } else {
      const result = await syncAllProvidersForUser(userId);
      return NextResponse.json({ synced: result.snapshotsUpserted, errors: result.errors });
    }
  } catch (err) {
    console.error("[auto-sync] Manual sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
