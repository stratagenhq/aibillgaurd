import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { SidebarNav } from "@/components/dashboard/SidebarNav";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Upsert user into our DB on every dashboard load (handles webhook race conditions)
  const clerkUser = await currentUser();
  if (clerkUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const fullName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
    await db
      .insert(users)
      .values({ id: clerkUser.id, email, fullName, imageUrl: clerkUser.imageUrl })
      .onConflictDoUpdate({
        target: users.id,
        set: { email, fullName, imageUrl: clerkUser.imageUrl, updatedAt: new Date() },
      });
  }

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-52 shrink-0 px-3 py-5"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        <Link href="/" className="flex items-center gap-2 mb-6 px-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <span className="text-sm font-medium tracking-tight" style={{ color: "var(--text)" }}>
            AI Bill Guard
          </span>
        </Link>

        <SidebarNav />

        <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <UserButton
            appearance={{
              variables: {
                colorPrimary: "#e8431a",
                colorBackground: "#18181d",
                colorText: "#f0eff4",
              },
            }}
          />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header
          className="flex md:hidden items-center justify-between px-4 h-14 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link href="/" className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            <span className="text-sm font-medium">AI Bill Guard</span>
          </Link>
          <UserButton />
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
