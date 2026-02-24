import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/connections", label: "Connections" },
  { href: "/insights", label: "Insights" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 px-4 py-6"
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--bg2)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5 mb-8 px-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
            AI Bill Guard
          </span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm transition-colors nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

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
        {/* Top bar (mobile) */}
        <header
          className="flex md:hidden items-center justify-between px-4 h-14"
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

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
