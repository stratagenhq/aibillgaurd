import { currentUser } from "@clerk/nextjs/server";
import { eq, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, usageSnapshots } from "@/lib/db/schema";
import { ProviderCard } from "@/components/connections/ProviderCard";
import { ConnectProviderForm } from "@/components/connections/ConnectProviderForm";

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

  // Get this-month cost per provider
  const snaps = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(
        eq(usageSnapshots.userId, user.id),
        gte(usageSnapshots.date, monthStart())
      )
    );

  const providerCosts = userProviders.reduce<Record<string, number>>((acc, p) => {
    const cost = snaps
      .filter((s) => s.providerId === p.id)
      .reduce((sum, s) => sum + parseFloat(s.costUsd ?? "0"), 0);
    acc[p.id] = cost;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
            Connections
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Connect AI provider API keys to track spend.
          </p>
        </div>
        <ConnectProviderForm />
      </div>

      {userProviders.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--text)" }}>
            No providers connected yet
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Click "Add Provider" to connect your first AI API key.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {userProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              monthCost={providerCosts[provider.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
