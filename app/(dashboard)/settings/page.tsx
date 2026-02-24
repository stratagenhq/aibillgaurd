import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) return null;

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id));

  const plan = sub?.plan ?? "free";
  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-tight mb-1" style={{ color: "var(--text)" }}>
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Account and subscription details.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Account */}
        <Section title="Account">
          <Row label="Name" value={fullName} />
          <Row label="Email" value={email} />
          <Row
            label="Plan"
            value={
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background:
                    plan === "pro"
                      ? "rgba(232,67,26,0.15)"
                      : plan === "business"
                      ? "rgba(96,165,250,0.15)"
                      : "var(--bg3)",
                  color:
                    plan === "pro"
                      ? "var(--accent)"
                      : plan === "business"
                      ? "#60a5fa"
                      : "var(--muted)",
                }}
              >
                {plan.charAt(0).toUpperCase() + plan.slice(1)}
              </span>
            }
          />
        </Section>

        {/* Subscription */}
        <Section title="Subscription">
          {plan === "free" ? (
            <div className="px-5 py-4">
              <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
                You&apos;re on the Free plan. Upgrade to Pro to unlock unlimited providers,
                AI optimization insights, and 90-day history.
              </p>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: "var(--accent)", color: "#fff" }}
                disabled
              >
                Upgrade to Pro — $29/mo (coming soon)
              </button>
            </div>
          ) : (
            <div className="px-5 py-4">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                You&apos;re on the <strong style={{ color: "var(--text)" }}>{plan}</strong> plan.
                {sub?.currentPeriodEnd && (
                  <> Renews on{" "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  .</>
                )}
              </p>
            </div>
          )}
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            label="API key encryption"
            value={
              <span className="text-xs" style={{ color: "#22c55e" }}>
                AES-256-GCM enabled
              </span>
            }
          />
          <Row label="Auth provider" value="Clerk" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}
      >
        <h2 className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          {title}
        </h2>
      </div>
      <div style={{ background: "var(--bg)" }}>{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-sm" style={{ color: "var(--muted)" }}>{label}</span>
      <span className="text-sm" style={{ color: "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
