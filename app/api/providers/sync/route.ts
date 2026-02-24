import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, usageSnapshots } from "@/lib/db/schema";
import { decryptApiKey } from "@/lib/encryption";
import { fetchOpenAIUsage } from "@/lib/providers/openai";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { providerId } = (await req.json()) as { providerId: string };
    if (!providerId) {
      return NextResponse.json({ error: "providerId is required" }, { status: 400 });
    }

    // Fetch provider (verify ownership)
    const [provider] = await db
      .select()
      .from(providers)
      .where(and(eq(providers.id, providerId), eq(providers.userId, userId)));

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (!provider.encryptedApiKey || !provider.keyIv) {
      return NextResponse.json({ error: "No API key stored" }, { status: 422 });
    }

    const apiKey = decryptApiKey(provider.encryptedApiKey, provider.keyIv);
    let snapshotsUpserted = 0;

    if (provider.providerType === "openai") {
      const usageDays = await fetchOpenAIUsage(apiKey, 30);

      for (const day of usageDays) {
        await db
          .insert(usageSnapshots)
          .values({
            userId,
            providerId: provider.id,
            model: day.model,
            date: day.date,
            inputTokens: day.inputTokens,
            outputTokens: day.outputTokens,
            totalTokens: day.totalTokens,
            costUsd: day.costUsd.toFixed(8),
            requestCount: day.requestCount,
          })
          .onConflictDoUpdate({
            target: [usageSnapshots.providerId, usageSnapshots.model, usageSnapshots.date],
            set: {
              inputTokens: day.inputTokens,
              outputTokens: day.outputTokens,
              totalTokens: day.totalTokens,
              costUsd: day.costUsd.toFixed(8),
              requestCount: day.requestCount,
            },
          });
        snapshotsUpserted++;
      }
    } else {
      // Providers without public usage APIs — key stored, sync not yet supported
      // Return success with 0 snapshots
    }

    // Update lastSyncedAt
    await db
      .update(providers)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(providers.id, providerId));

    return NextResponse.json({ success: true, snapshotsUpserted });
  } catch (err) {
    console.error("Sync provider error:", err);
    return NextResponse.json({ error: "Failed to sync provider" }, { status: 500 });
  }
}
