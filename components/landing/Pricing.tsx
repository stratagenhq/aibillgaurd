const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "2 providers connected",
      "50k tokens tracked/month",
      "Basic dashboard",
      "7-day history",
    ],
    disabled: ["AI optimization", "Anomaly alerts", "Team seats"],
    cta: "Get started",
    primary: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    badge: "Most Popular",
    features: [
      "Unlimited providers",
      "Unlimited tokens tracked",
      "Full AI optimization",
      "Anomaly alerts (Slack + email)",
      "3 team seats",
      "90-day history + forecasts",
      "CSV/PDF export",
    ],
    disabled: [],
    cta: "Start free trial",
    primary: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    features: [
      "Everything in Pro",
      "Unlimited team seats",
      "SSO / SAML",
      "Priority support",
      "Custom alert rules",
      "API access",
      "SOC2-ready exports",
    ],
    disabled: [],
    cta: "Contact us",
    primary: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}
          >
            PRICING
          </p>
          <h2
            className="font-light tracking-tight mb-3"
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              letterSpacing: "-1px",
            }}
          >
            Simple, honest pricing.
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Profitable to us, saving to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-xl p-6 flex flex-col relative"
              style={{
                background: plan.primary
                  ? "rgba(232,67,26,0.06)"
                  : "var(--bg2)",
                border: plan.primary
                  ? "1px solid rgba(232,67,26,0.3)"
                  : "1px solid var(--border)",
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {plan.badge}
                </span>
              )}

              <div className="mb-6">
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: "var(--muted)" }}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-4xl font-light"
                    style={{ color: "var(--text)" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--text)" }}
                  >
                    <span
                      style={{ color: "var(--green)" }}
                      className="mt-0.5 shrink-0"
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
                {plan.disabled?.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm opacity-30"
                    style={{ color: "var(--muted)" }}
                  >
                    <span className="mt-0.5 shrink-0">✗</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#waitlist"
                className="w-full text-center py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={
                  plan.primary
                    ? { background: "var(--accent)", color: "#fff" }
                    : {
                        background: "var(--bg3)",
                        color: "var(--text)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
          All plans include a 14-day free trial. No credit card required to
          start.
        </p>
      </div>
    </section>
  );
}
