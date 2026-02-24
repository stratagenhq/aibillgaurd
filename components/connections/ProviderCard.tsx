"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROVIDER_META } from "@/lib/providers";
import { formatRelativeTime } from "@/lib/utils";
import { RefreshCw, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { Provider } from "@/lib/db/schema";

interface ProviderCardProps {
  provider: Provider;
  monthCost: number;
}

export function ProviderCard({ provider, monthCost }: ProviderCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const meta = PROVIDER_META[provider.providerType as keyof typeof PROVIDER_META];
  const label = provider.displayName || meta?.label || provider.providerType;

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/providers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.id }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.snapshotsUpserted === 0) {
          setSyncError(
            "No usage data found. This usually means your API key doesn't have usage permissions. " +
            "Delete this connection and reconnect with a key that has 'All' permissions (not a restricted project key)."
          );
        } else {
          setSyncResult(`Synced ${data.snapshotsUpserted} day${data.snapshotsUpserted !== 1 ? "s" : ""} of usage data`);
        }
        router.refresh();
      } else {
        setSyncError(data.error ?? "Sync failed");
      }
    } catch {
      setSyncError("Network error — please try again");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Remove ${label}? This will also delete all its usage data.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/providers/${provider.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  const statusColor =
    provider.status === "active"
      ? "#22c55e"
      : provider.status === "error"
      ? "#ef4444"
      : "var(--muted)";

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: meta?.bgColor ?? "var(--bg3)", color: meta?.color ?? "var(--text)" }}
          >
            {label.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{label}</div>
            <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: "var(--muted)" }}>
              {provider.status === "active" ? (
                <CheckCircle size={11} style={{ color: statusColor }} />
              ) : (
                <AlertCircle size={11} style={{ color: statusColor }} />
              )}
              <span style={{ color: statusColor }}>
                {provider.status === "active" ? "Active" : provider.status}
              </span>
              {provider.lastSyncedAt && (
                <span style={{ color: "var(--muted)" }}>
                  · Synced {formatRelativeTime(provider.lastSyncedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            ${monthCost.toFixed(2)}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>this month</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
        {meta?.syncSupported && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: "var(--bg3)",
              color: syncing ? "var(--muted)" : "var(--text)",
              cursor: syncing ? "not-allowed" : "pointer",
            }}
          >
            {syncing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        )}

        {!meta?.syncSupported && (
          <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--bg3)", color: "var(--muted)" }}>
            Auto-sync coming soon
          </span>
        )}

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ color: "#ef4444", cursor: deleting ? "not-allowed" : "pointer" }}
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          Remove
        </button>
      </div>

      {syncResult && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: "#22c55e" }}>
          <CheckCircle size={11} />
          {syncResult}
        </p>
      )}
      {syncError && (
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <p className="text-xs flex items-start gap-1.5" style={{ color: "#ef4444" }}>
            <AlertCircle size={11} className="shrink-0 mt-0.5" />
            {syncError}
          </p>
          {provider.providerType === "openai" && (
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mt-1.5 inline-block"
              style={{ color: "var(--accent)" }}
            >
              Create a new key with full permissions →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
