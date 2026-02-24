import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { providerId } = await params;

  try {
    const deleted = await db
      .delete(providers)
      .where(and(eq(providers.id, providerId), eq(providers.userId, userId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete provider error:", err);
    return NextResponse.json({ error: "Failed to delete provider" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { providerId } = await params;
  const body = await req.json();

  try {
    const [updated] = await db
      .update(providers)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(providers.id, providerId), eq(providers.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider: updated });
  } catch (err) {
    console.error("Update provider error:", err);
    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
  }
}
