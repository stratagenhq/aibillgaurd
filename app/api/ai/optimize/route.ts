import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { eq, and, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { usageSnapshots } from "@/lib/db/schema";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "sk-ant-" || apiKey.trim() === "") {
    return NextResponse.json(
      { error: "Anthropic API key not configured" },
      { status: 422 }
    );
  }

  // Fetch last 30 days
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const dateStr = d.toISOString().slice(0, 10);

  const snaps = await db
    .select()
    .from(usageSnapshots)
    .where(
      and(eq(usageSnapshots.userId, userId), gte(usageSnapshots.date, dateStr))
    );

  if (snaps.length === 0) {
    return NextResponse.json({ error: "No usage data to analyze" }, { status: 422 });
  }

  // Aggregate by model
  const modelMap: Record<string, { cost: number; tokens: number; requests: number }> = {};
  for (const s of snaps) {
    if (!modelMap[s.model]) modelMap[s.model] = { cost: 0, tokens: 0, requests: 0 };
    modelMap[s.model].cost += parseFloat(s.costUsd ?? "0");
    modelMap[s.model].tokens += s.totalTokens ?? 0;
    modelMap[s.model].requests += s.requestCount ?? 0;
  }

  const totalCost = Object.values(modelMap).reduce((s, m) => s + m.cost, 0);
  const modelSummary = Object.entries(modelMap)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 10)
    .map(
      ([model, data]) =>
        `- ${model}: $${data.cost.toFixed(2)} (${data.requests.toLocaleString()} requests, ${(data.tokens / 1000).toFixed(0)}K tokens)`
    )
    .join("\n");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an AI cost optimization expert. Analyze this LLM API usage data and return 3 specific, actionable recommendations to reduce costs.

Usage data (last 30 days):
Total spend: $${totalCost.toFixed(2)}
Model breakdown:
${modelSummary}

Return ONLY valid JSON — no markdown, no explanation, just the JSON object:
{
  "savings_estimate": <number: realistic total monthly USD savings if all followed>,
  "recommendations": [
    {
      "type": "QUICK_WIN",
      "title": "<short action title, max 8 words>",
      "description": "<1-2 sentences: why this saves money and how to do it>",
      "savings_per_month": <number: estimated monthly USD savings>
    }
  ]
}

Use types: QUICK_WIN (easy, high confidence), MEDIUM (requires some work), ADVANCED (significant effort).
Focus on the highest-cost models. Be realistic — don't suggest impossible savings.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  try {
    // Strip any markdown code fences if present
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const result = JSON.parse(clean);
    return NextResponse.json(result);
  } catch {
    console.error("Failed to parse AI response:", text);
    return NextResponse.json(
      { error: "Failed to parse AI response" },
      { status: 500 }
    );
  }
}
