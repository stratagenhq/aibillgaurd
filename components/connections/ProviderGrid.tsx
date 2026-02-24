"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PROVIDERS, PROVIDER_META } from "@/lib/providers";
import type { ProviderType } from "@/lib/providers";
import { Eye, EyeOff, Loader2, RefreshCw, Trash2, X, CheckCircle, ExternalLink } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface ConnectedProvider {
  id: string;
  providerType: string;
  displayName: string | null;
  status: string;
  lastSyncedAt: Date | string | null;
  monthCost: number;
  syncSupported: boolean;
}

interface ProviderGridProps {
  connected: ConnectedProvider[];
}

type FormStep = "idle" | "connecting" | "syncing" | "done";

function getSyncStatusDot(status: string, lastSyncedAt: Date | string | null): {
  color: string;
  label: string;
} {
  if (status === "error") return { color: "#ef4444", label: "Sync error" };
  if (!lastSyncedAt) return { color: "#ef4444", label: "Never synced" };

  const syncedMs = new Date(lastSyncedAt).getTime();
  const ageMin = (Date.now() - syncedMs) / 60_000;

  if (ageMin <= 5) return { color: "#22c55e", label: "Just synced" };
  if (ageMin <= 60) return { color: "#f59e0b", label: "Synced recently" };
  return { color: "#ef4444", label: "Sync outdated" };
}

export function ProviderGrid({ connected }: ProviderGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProviderType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [step, setStep] = useState<FormStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<Record<string, { count: number; error?: string } | null>>({});

  const connectedMap = Object.fromEntries(connected.map((p) => [p.providerType, p]));
  const selectedMeta = selected ? PROVIDER_META[selected] : null;

  function openForm(type: ProviderType) {
    setSelected(type);
    setStep("idle");
    setError(null);
    setApiKey("");
    setDisplayName("");
    setShowKey(false);
  }

  function closeForm() {
    setSelected(null);
    setStep("idle");
    setError(null);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setStep("connecting");

    try {
      const connectRes = await fetch("/api/providers/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerType: selected,
          displayName: displayName.trim() || undefined,
          apiKey: apiKey.trim(),
        }),
      });
      const data = await connectRes.json();
      if (!connectRes.ok) {
        setError(data.error ?? "Failed to connect");
        setStep("idle");
        return;
      }

      setStep("syncing");
      await fetch("/api/providers/auto-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: data.provider.id }),
      });

      setStep("done");
      setTimeout(() => {
        router.refresh();
        closeForm();
      }, 1000);
    } catch {
      setError("Network error — please try again");
      setStep("idle");
    }
  }

  async function handleSync(providerId: string) {
    setSyncingId(providerId);
    setSyncResult((prev) => ({ ...prev, [providerId]: null }));
    try {
      const res = await fetch("/api/providers/auto-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json().catch(() => ({}));
      const count: number = data.synced ?? 0;
      const errors: string[] = data.errors ?? [];
      setSyncResult((prev) => ({
        ...prev,
        [providerId]: { count, error: errors[0] },
      }));
      setTimeout(
        () => setSyncResult((prev) => ({ ...prev, [providerId]: null })),
        5000
      );
      router.refresh();
    } finally {
      setSyncingId(null);
    }
  }

  async function handleDelete(providerId: string, label: string) {
    if (!confirm(`Remove ${label}? This will also delete all its usage data.`)) return;
    setDeletingId(providerId);
    try {
      await fetch(`/api/providers/${providerId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Provider grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_PROVIDERS.map((p) => {
          const conn = connectedMap[p.type];
          const isConnected = !!conn;
          const isDeleting = conn && deletingId === conn.id;
          const isSyncing = conn && syncingId === conn.id;
          const dot = isConnected ? getSyncStatusDot(conn.status, conn.lastSyncedAt) : null;

          return (
            <div
              key={p.type}
              className="rounded-xl p-4 flex flex-col gap-3 transition-all"
              style={{
                background: "var(--bg2)",
                border: `1px solid ${isConnected ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: p.bgColor, color: p.color }}
                  >
                    {p.label.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {conn?.displayName || p.label}
                    </div>
                    {isConnected && dot ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <CheckCircle size={10} style={{ color: "#22c55e" }} />
                        <span className="text-xs" style={{ color: "#22c55e" }}>Connected</span>
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full ml-1"
                          style={{ background: dot.color }}
                          title={dot.label}
                        />
                        {conn.lastSyncedAt && (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            {formatRelativeTime(conn.lastSyncedAt)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        Not connected
                      </div>
                    )}
                  </div>
                </div>

                {isConnected && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {formatCurrency(conn.monthCost)}
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>this month</div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                    {conn.syncSupported ? (
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={!!isSyncing}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        style={{
                          background: "var(--bg3)",
                          color: isSyncing ? "var(--muted)" : "var(--text)",
                        }}
                      >
                        {isSyncing ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <RefreshCw size={11} />
                        )}
                        {isSyncing ? "Syncing…" : "Sync"}
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Sync not supported for this provider yet"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs cursor-not-allowed"
                        style={{ background: "var(--bg3)", color: "var(--muted)", opacity: 0.5 }}
                      >
                        <RefreshCw size={11} />
                        Sync
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(conn.id, conn.displayName || p.label)}
                      disabled={!!isDeleting}
                      className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                      style={{ color: "#ef4444" }}
                    >
                      {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      Remove
                    </button>
                  </div>
                  {syncResult[conn.id] && (
                    <div
                      className="text-xs px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: syncResult[conn.id]!.error
                          ? "rgba(239,68,68,0.1)"
                          : syncResult[conn.id]!.count > 0
                          ? "rgba(34,197,94,0.1)"
                          : "rgba(245,158,11,0.1)",
                        color: syncResult[conn.id]!.error
                          ? "#ef4444"
                          : syncResult[conn.id]!.count > 0
                          ? "#22c55e"
                          : "#f59e0b",
                      }}
                    >
                      {syncResult[conn.id]!.error
                        ? syncResult[conn.id]!.error
                        : syncResult[conn.id]!.count > 0
                        ? `Synced ${syncResult[conn.id]!.count} records ✓`
                        : "No usage found in last 30 days"}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => openForm(p.type)}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg3)", color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Connect →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Connection drawer */}
      {selected && selectedMeta && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "var(--bg2)", border: "1px solid var(--border-bright)" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                  style={{ background: selectedMeta.bgColor, color: selectedMeta.color }}
                >
                  {selectedMeta.label.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium" style={{ color: "var(--text)" }}>
                    Connect {selectedMeta.label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {selectedMeta.syncSupported ? "Usage sync supported" : "Key stored, sync coming soon"}
                  </div>
                </div>
              </div>
              <button onClick={closeForm} style={{ color: "var(--muted)" }}>
                <X size={18} />
              </button>
            </div>

            {step === "done" ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle size={32} style={{ color: "#22c55e" }} />
                <p className="font-medium" style={{ color: "var(--text)" }}>Connected!</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {selectedMeta.syncSupported ? "Usage data synced." : "API key saved securely."}
                </p>
              </div>
            ) : step === "connecting" || step === "syncing" ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {step === "connecting" ? "Validating API key…" : "Syncing usage data (30 days)…"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="flex flex-col gap-4">
                {/* Display name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                    Display name <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={`e.g. "Production ${selectedMeta.label}"`}
                    className="rounded-lg px-3 py-2.5 text-sm"
                    style={{
                      background: "var(--bg3)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      outline: "none",
                    }}
                  />
                </div>

                {/* API key */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                      {selectedMeta.apiKeyLabel}
                    </label>
                    <a
                      href={selectedMeta.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      Get key <ExternalLink size={10} />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={selectedMeta.apiKeyPlaceholder}
                      required
                      autoFocus
                      className="w-full rounded-lg px-3 py-2.5 text-sm pr-10 font-mono"
                      style={{
                        background: "var(--bg3)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--muted)" }}
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Encrypted with AES-256-GCM before storage. Never logged or exposed.
                  </p>
                </div>

                {error && (
                  <div
                    className="rounded-lg px-3 py-2.5 text-xs"
                    style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Connect {selectedMeta.label}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2.5 rounded-lg text-sm"
                    style={{ background: "var(--bg3)", color: "var(--muted)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
