# AI Bill Guard – Project Structure

## Folder Layout

```
aibillguard/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell (sidebar + topbar)
│   │   ├── dashboard/page.tsx      # Main overview
│   │   ├── connections/page.tsx    # API key + provider management
│   │   ├── insights/page.tsx       # Deep analytics
│   │   ├── reports/page.tsx        # Export + reports
│   │   └── settings/page.tsx       # Account, team, billing
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts     # Stripe webhook handler
│   │   │   └── clerk/route.ts      # Clerk user sync
│   │   ├── providers/
│   │   │   ├── connect/route.ts    # Encrypt + store API key
│   │   │   ├── sync/route.ts       # Pull usage from provider APIs
│   │   │   └── [providerId]/route.ts
│   │   ├── ai/
│   │   │   ├── optimize/route.ts   # "Optimize This Month" analysis
│   │   │   └── anomalies/route.ts  # Anomaly detection
│   │   └── billing/
│   │       ├── portal/route.ts
│   │       └── checkout/route.ts
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # PUBLIC landing page
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard/
│   │   ├── SpendOverview.tsx
│   │   ├── ProviderBreakdown.tsx
│   │   ├── WasteScore.tsx
│   │   ├── CostDriverCards.tsx
│   │   ├── SparklineChart.tsx
│   │   └── AnomalyAlert.tsx
│   ├── connections/
│   │   ├── ProviderCard.tsx
│   │   ├── APIKeyInput.tsx
│   │   └── EmailConnect.tsx
│   ├── insights/
│   │   ├── ForecastChart.tsx
│   │   ├── ModelTable.tsx
│   │   └── OptimizeButton.tsx
│   └── landing/
│       ├── Hero.tsx
│       ├── PainPoints.tsx
│       ├── FeatureShowcase.tsx
│       ├── Pricing.tsx
│       └── Waitlist.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── migrations/
│   │   └── index.ts
│   ├── providers/
│   │   ├── openai.ts               # OpenAI usage API
│   │   ├── anthropic.ts            # Anthropic usage API
│   │   ├── groq.ts
│   │   ├── gemini.ts
│   │   └── index.ts               # Provider registry
│   ├── encryption.ts               # AES-256-GCM key encryption
│   ├── ai-analysis.ts              # LLM optimization logic
│   ├── stripe.ts                   # Stripe client + helpers
│   └── utils.ts
├── hooks/
│   ├── useSpend.ts
│   ├── useProviders.ts
│   └── useOptimization.ts
├── types/
│   └── index.ts
├── public/
│   └── og-image.png
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## Key Architectural Decisions

### Security
- API keys encrypted with AES-256-GCM before DB storage
- Encryption key stored in env (rotate via KMS in prod)
- Keys never logged, never sent to client
- RLS on all Supabase tables (userId isolation)

### Data Model
- `users` → Clerk user_id FK
- `providers` → encrypted api_key, provider type, status
- `usage_snapshots` → daily aggregated token/cost data per provider+model
- `projects` → user-defined cost tags
- `alerts` → anomaly + budget alert configs
- `subscriptions` → Stripe subscription state

### Provider Sync
- Cron job (Vercel cron or Supabase pg_cron) runs every 15min
- Each provider has a typed adapter in /lib/providers/
- Usage stored as immutable snapshots (append-only)

### AI Analysis
- Uses Claude 3.5 Sonnet or Grok-4 via API
- Receives: aggregated usage stats (NO raw prompts)
- Returns: structured JSON with recommendations
- Results cached 24h per user
