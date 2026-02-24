import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers, usageSnapshots } from "@/lib/db/schema";
import { calcCost } from "@/lib/pricing";

export async function POST(req: Request) {
  // 1. Auth
  const ingestKey = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!ingestKey?.startsWith("abg-"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Lookup provider
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.ingestKey, ingestKey));
  if (!provider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Parse + validate body
  const body = await req.json();
  const { model, input_tokens, output_tokens } = body;
  if (
    !model ||
    typeof input_tokens !== "number" ||
    typeof output_tokens !== "number"
  )
    return NextResponse.json(
      { error: "model, input_tokens, output_tokens required" },
      { status: 400 }
    );

  // 4. Cost + date
  const costUsd = calcCost(provider.providerType, model, input_tokens, output_tokens);
  const today = new Date().toISOString().slice(0, 10);

  // 5. Upsert — INCREMENT existing values (not replace)
  await db
    .insert(usageSnapshots)
    .values({
      userId: provider.userId,
      providerId: provider.id,
      model,
      date: today,
      inputTokens: input_tokens,
      outputTokens: output_tokens,
      totalTokens: input_tokens + output_tokens,
      costUsd: costUsd.toFixed(8),
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: [usageSnapshots.providerId, usageSnapshots.model, usageSnapshots.date],
      set: {
        inputTokens:  sql`${usageSnapshots.inputTokens}  + ${input_tokens}`,
        outputTokens: sql`${usageSnapshots.outputTokens} + ${output_tokens}`,
        totalTokens:  sql`${usageSnapshots.totalTokens}  + ${input_tokens + output_tokens}`,
        costUsd:      sql`${usageSnapshots.costUsd}::numeric + ${costUsd.toFixed(8)}::numeric`,
        requestCount: sql`${usageSnapshots.requestCount} + 1`,
      },
    });

  return NextResponse.json({ ok: true });
}
