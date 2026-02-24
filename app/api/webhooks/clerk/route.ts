import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// Clerk webhook — syncs user.created / user.updated into our DB
// TODO: add svix signature verification before production
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body as {
      type: string;
      data: {
        id: string;
        email_addresses: Array<{ email_address: string; id: string }>;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };
    };

    if (type === "user.created" || type === "user.updated") {
      const email = data.email_addresses?.[0]?.email_address ?? "";
      const fullName =
        [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

      await db
        .insert(users)
        .values({
          id: data.id,
          email,
          fullName,
          imageUrl: data.image_url,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: { email, fullName, imageUrl: data.image_url, updatedAt: new Date() },
        });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Clerk webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
