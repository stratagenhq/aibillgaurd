"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PROVIDERS } from "@/lib/providers";
import type { ProviderType } from "@/lib/providers";
import { ChevronDown, Eye, EyeOff, Loader2, Plus, X } from "lucide-react";

export function ConnectProviderForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "connecting" | "syncing" | "done">("form");
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  const [providerType, setProviderType] = useState<ProviderType>("openai");
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");

  const selectedMeta = ALL_PROVIDERS.find((p) => p.type === providerType);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep("connecting");

    try {
      // Connect (validate + encrypt + store)
      const connectRes = await fetch("/api/providers/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerType, displayName: displayName || undefined, apiKey }),
      });
      const connectData = await connectRes.json();
      if (!connectRes.ok) {
        setError(connectData.error ?? "Failed to connect");
        setStep("form");
        return;
      }

      const providerId = connectData.provider.id;

      // Sync usage (non-blocking for non-OpenAI providers)
      setStep("syncing");
      await fetch("/api/providers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });

      setStep("done");
      setTimeout(() => {
        router.refresh();
        setOpen(false);
        setStep("form");
        setApiKey("");
        setDisplayName("");
      }, 1200);
    } catch {
      setError("Network error — please try again");
      setStep("form");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        <Plus size={15} />
        Add Provider
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-medium" style={{ color: "var(--text)" }}>
          Connect a provider
        </h3>
        <button
          onClick={() => { setOpen(false); setError(null); setStep("form"); }}
          style={{ color: "var(--muted)" }}
        >
          <X size={16} />
        </button>
      </div>

      {(step === "connecting" || step === "syncing" || step === "done") ? (
        <div className="flex flex-col items-center gap-3 py-8">
          {step === "done" ? (
            <>
              <div className="text-2xl">✓</div>
              <p className="text-sm" style={{ color: "var(--text)" }}>
                Provider connected!
              </p>
            </>
          ) : (
            <>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {step === "connecting" ? "Validating API key…" : "Syncing usage data…"}
              </p>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Provider type select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Provider
            </label>
            <div className="relative">
              <select
                value={providerType}
                onChange={(e) => setProviderType(e.target.value as ProviderType)}
                className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm pr-8"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none",
                }}
              >
                {ALL_PROVIDERS.map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.label}
                    {p.syncSupported ? "" : " (key stored, sync coming soon)"}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--muted)" }}
              />
            </div>
          </div>

          {/* Display name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
              Display name <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={`e.g. "Production ${selectedMeta?.label}"`}
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
                {selectedMeta?.apiKeyLabel ?? "API Key"}
              </label>
              {selectedMeta?.docsUrl && (
                <a
                  href={selectedMeta.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                  style={{ color: "var(--accent)" }}
                >
                  Get key →
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedMeta?.apiKeyPlaceholder ?? "Your API key"}
                required
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
              Encrypted with AES-256-GCM. Never logged or exposed.
            </p>
          </div>

          {error && (
            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
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
              Connect
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="px-4 py-2.5 rounded-lg text-sm"
              style={{ background: "var(--bg3)", color: "var(--muted)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
