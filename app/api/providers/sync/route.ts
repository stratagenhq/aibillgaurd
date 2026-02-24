import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { syncProvider } from "@/lib/sync-engine";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { providerId } = (await req.json()) as { providerId: string };
    if (!providerId) {
      return NextResponse.json({ error: "providerId is required" }, { status: 400 });
    }

    const result = await syncProvider(providerId, userId);

    if (result.error) {
      const isPermissionError = result.error.includes("project key") || result.error.includes("unrestricted key");
      return NextResponse.json(
        { error: result.error },
        { status: isPermissionError ? 422 : 500 }
      );
    }

    return NextResponse.json({ success: true, snapshotsUpserted: result.snapshotsUpserted });
  } catch (err) {
    console.error("Sync provider error:", err);
    return NextResponse.json({ error: "Failed to sync provider" }, { status: 500 });
  }
}
