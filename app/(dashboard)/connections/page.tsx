import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, usageSnapshots } from "@/lib/db/schema";
import { PROVIDER_META } from "@/lib/providers";
import { ProviderGrid } from "@/components/connections/ProviderGrid";

function monthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function ConnectionsPage() {
  const user = await currentUser();
  if (!user) return null;

  const userProviders = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, user.id));

  const snaps = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(
        eq(usageSnapshots.userId, user.id),
        gte(usageSnapshots.date, monthStart())
      )
    );

  const connected = userProviders.map((p) => {
    const monthCost = snaps
      .filter((s) => s.providerId === p.id)
      .reduce((sum, s) => sum + parseFloat(s.costUsd ?? "0"), 0);
    const meta = PROVIDER_META[p.providerType as keyof typeof PROVIDER_META];
    return {
      id: p.id,
      providerType: p.providerType,
      displayName: p.displayName,
      status: p.status,
      lastSyncedAt: p.lastSyncedAt,
      monthCost,
      syncSupported: meta?.syncSupported ?? false,
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
          Connections
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Connect AI provider API keys to start tracking spend.
          {connected.length > 0 && (
            <span> · {connected.length} connected</span>
          )}
        </p>
      </div>

      <ProviderGrid connected={connected} />
    </div>
  );
}
