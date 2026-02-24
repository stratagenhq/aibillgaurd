"use client";

import { useState } from "react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError(true);
      return;
    }
    setError(false);
    setSubmitted(true);
    // TODO: POST to /api/waitlist
  };

  return (
    <section
      id="waitlist"
      className="px-6 py-24"
      style={{
        background: "var(--bg2)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-xl mx-auto text-center">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-4"
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-jetbrains-mono)",
          }}
        >
          EARLY ACCESS
        </p>
        <h2
          className="font-light tracking-tight mb-4"
          style={{
            fontSize: "clamp(32px, 4vw, 52px)",
            letterSpacing: "-1px",
          }}
        >
          Get in before we open the gates
        </h2>
        <p className="mb-10 text-sm" style={{ color: "var(--muted)" }}>
          Join 340+ founders on the waitlist. First 100 get 3 months of Pro
          free.
        </p>

        {submitted ? (
          <div className="py-6 text-lg" style={{ color: "var(--text)" }}>
            🎉 You&apos;re on the list! We&apos;ll email you when early access
            opens.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(false);
              }}
              placeholder="you@startup.com"
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg3)",
                border: error
                  ? "1px solid var(--red)"
                  : "1px solid var(--border)",
                color: "var(--text)",
              }}
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Get early access →
            </button>
          </form>
        )}

        <p className="text-xs" style={{ color: "var(--muted)" }}>
          No spam. Unsubscribe any time. We hate bad emails too.
        </p>
      </div>
    </section>
  );
}
