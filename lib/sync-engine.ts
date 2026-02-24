// Central sync engine — delegates to per-provider adapters and upserts into usage_snapshots

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, usageSnapshots, users } from "@/lib/db/schema";
import { decryptApiKey } from "@/lib/encryption";
import { fetchOpenAIUsage } from "@/lib/providers/openai";

export async function syncProvider(
  providerId: string,
  userId: string
): Promise<{ snapshotsUpserted: number; error?: string }> {
  // Fetch provider row (verify ownership)
  const [provider] = await db
    .select()
    .from(providers)
    .where(and(eq(providers.id, providerId), eq(providers.userId, userId)));

  if (!provider) {
    return { snapshotsUpserted: 0, error: "Provider not found" };
  }

  if (!provider.encryptedApiKey || !provider.keyIv) {
    return { snapshotsUpserted: 0, error: "No API key stored" };
  }

  const apiKey = decryptApiKey(provider.encryptedApiKey, provider.keyIv);
  let snapshotsUpserted = 0;
  let syncError: string | undefined;

  try {
    let usageDays: Awaited<ReturnType<typeof fetchOpenAIUsage>> = [];

    if (provider.providerType === "openai") {
      try {
        usageDays = await fetchOpenAIUsage(apiKey, 30);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch usage";
        if (msg.startsWith("PERMISSION_ERROR:")) {
          syncError = msg.replace("PERMISSION_ERROR: ", "");
        } else {
          syncError = msg;
        }
      }
    } else {
      // Provider type not yet supported — update timestamp but no data
      await db
        .update(providers)
        .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
        .where(eq(providers.id, providerId));
      return { snapshotsUpserted: 0 };
    }

    // Upsert each day sequentially (avoid connection limit spikes under cron load)
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
  } catch (err) {
    syncError = err instanceof Error ? err.message : "Unknown error";
  }

  // Update lastSyncedAt and status
  await db
    .update(providers)
    .set({
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
      status: syncError ? "error" : "active",
    })
    .where(eq(providers.id, providerId));

  return { snapshotsUpserted, error: syncError };
}

export async function syncAllProvidersForUser(
  userId: string
): Promise<{ snapshotsUpserted: number; errors: string[] }> {
  const userProviders = await db
    .select()
    .from(providers)
    .where(and(eq(providers.userId, userId), eq(providers.status, "active")));

  let totalUpserted = 0;
  const errors: string[] = [];

  // Sequential to avoid rate-limit storms
  for (const provider of userProviders) {
    const result = await syncProvider(provider.id, userId);
    totalUpserted += result.snapshotsUpserted;
    if (result.error) {
      errors.push(`${provider.providerType}(${provider.id}): ${result.error}`);
    }
  }

  return { snapshotsUpserted: totalUpserted, errors };
}

export async function syncAllUsers(): Promise<{
  synced: number;
  errors: string[];
}> {
  const allUsers = await db.select({ id: users.id }).from(users);

  let totalSynced = 0;
  const errors: string[] = [];

  for (const user of allUsers) {
    const result = await syncAllProvidersForUser(user.id);
    totalSynced += result.snapshotsUpserted;
    errors.push(...result.errors);
  }

  return { synced: totalSynced, errors };
}
