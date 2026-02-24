import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users, providers } from "@/lib/db/schema";
import { encryptApiKey } from "@/lib/encryption";
import { validateOpenAIKey } from "@/lib/providers/openai";
import { PROVIDER_META, type ProviderType } from "@/lib/providers";
import { sendEmail } from "@/lib/email";
import { providerConnectedEmail } from "@/emails/provider-connected";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { providerType, displayName, apiKey } = (await req.json()) as {
      providerType: ProviderType;
      displayName?: string;
      apiKey: string;
    };

    if (!providerType || !apiKey?.trim()) {
      return NextResponse.json({ error: "providerType and apiKey are required" }, { status: 400 });
    }

    // Validate the API key against the provider
    if (providerType === "openai") {
      const valid = await validateOpenAIKey(apiKey.trim());
      if (!valid) {
        return NextResponse.json({ error: "Invalid OpenAI API key" }, { status: 422 });
      }
    }

    // Ensure user exists in our DB (upsert)
    const clerkUser = await currentUser();
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
      await db
        .insert(users)
        .values({ id: userId, email, fullName, imageUrl: clerkUser.imageUrl })
        .onConflictDoNothing();
    }

    // Encrypt and store the API key
    const { encrypted, iv } = encryptApiKey(apiKey.trim());
    const ingestKey = "abg-" + randomBytes(24).toString("hex");

    const [provider] = await db
      .insert(providers)
      .values({
        userId,
        providerType,
        displayName: displayName?.trim() || null,
        encryptedApiKey: encrypted,
        keyIv: iv,
        ingestKey,
        status: "active",
      })
      .returning();

    // Send confirmation email (fire-and-forget)
    if (clerkUser) {
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (email) {
        const meta = PROVIDER_META[providerType as keyof typeof PROVIDER_META];
        const { subject, html } = providerConnectedEmail({
          firstName: clerkUser.firstName,
          providerLabel: meta?.label ?? providerType,
          syncSupported: meta?.syncSupported ?? false,
        });
        sendEmail({ to: email, subject, html }).catch(() => {});
      }
    }

    return NextResponse.json({ provider: { ...provider, ingestKey } });
  } catch (err) {
    console.error("Connect provider error:", err);
    return NextResponse.json({ error: "Failed to connect provider" }, { status: 500 });
  }
}
