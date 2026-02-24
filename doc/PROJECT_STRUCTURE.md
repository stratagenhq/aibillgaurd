# AI Bill Guard – Project Structure

## Folder Layout

```
aibillguard/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard shell (sidebar + topbar); upserts Clerk user into DB
│   │   ├── dashboard/page.tsx      # Stat cards + 30-day bar chart + provider breakdown table
│   │   ├── connections/page.tsx    # Add/sync/delete providers; SDK setup per card
│   │   ├── insights/page.tsx       # Per-model token/cost/request breakdown
│   │   ├── reports/page.tsx        # Daily cost summary table (CSV export = Pro)
│   │   └── settings/page.tsx       # Account info, plan, AES-256 status
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── stripe/route.ts     # Stripe webhook handler (TODO: implement)
│   │   │   └── clerk/route.ts      # Clerk user sync (svix verification TODO)
│   │   ├── providers/
│   │   │   ├── connect/route.ts    # Encrypt + store API key; generate ingest key
│   │   │   ├── sync/route.ts       # Pull usage from provider APIs (legacy)
│   │   │   ├── auto-sync/route.ts  # POST = manual sync (Clerk auth); GET = cron (CRON_SECRET)
│   │   │   └── [providerId]/route.ts  # DELETE provider
│   │   ├── ingest/route.ts         # SDK ingest — receives {model, input_tokens, output_tokens}
│   │   ├── ai/
│   │   │   └── optimize/route.ts   # "Optimize This Month" Claude analysis
│   │   └── cron/
│   │       └── weekly-digest/route.ts  # Resend weekly email digest
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Public landing page
├── components/
│   ├── connections/
│   │   └── ProviderGrid.tsx        # Provider cards with connect form, sync, SDK setup
│   ├── dashboard/
│   │   ├── StatCards.tsx
│   │   ├── SpendChart.tsx          # Recharts 30-day bar chart
│   │   └── ProviderTable.tsx
│   ├── insights/
│   │   └── InsightsTable.tsx       # Per-model breakdown table
│   └── landing/                    # Public landing page sections
├── lib/
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema (all 6 tables)
│   │   ├── migrations/
│   │   │   ├── 0000_tough_red_ghost.sql   # Initial schema
│   │   │   ├── 0001_ingest_keys.sql       # Add ingest_key to providers
│   │   │   └── meta/_journal.json
│   │   └── index.ts                # Neon + Drizzle client
│   ├── providers/
│   │   ├── openai.ts               # OpenAI usage API adapter
│   │   ├── anthropic.ts            # Anthropic usage API adapter
│   │   └── index.ts                # PROVIDER_META registry, ProviderType enum
│   ├── sync-engine.ts              # syncProvider(), syncAllProvidersForUser(), syncAllUsers()
│   ├── pricing.ts                  # calcCost(providerType, model, input, output) — shared
│   ├── encryption.ts               # AES-256-GCM key encryption/decryption
│   ├── email.ts                    # Resend client + sendEmail()
│   └── utils.ts                    # formatCurrency, formatRelativeTime, cn()
├── emails/
│   ├── provider-connected.ts       # Transactional: provider connected confirmation
│   └── weekly-digest.ts            # Weekly spend summary email
├── packages/
│   ├── sdk-js/                     # npm package: aibillguard
│   │   ├── src/index.ts            # wrapOpenAI(), wrapAnthropic() — zero deps
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── sdk-python/                 # PyPI package: aibillguard
│       ├── aibillguard/__init__.py # wrap_openai(), wrap_anthropic() — stdlib only
│       └── pyproject.toml
├── doc/                            # Project documentation
├── .env.local                      # All secrets (never committed)
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── vercel.json                     # Cron jobs: auto-sync (5min) + weekly-digest (Mon 9am)
└── package.json
```

## Key Architectural Decisions

### Security
- Provider API keys encrypted with AES-256-GCM before DB storage (`lib/encryption.ts`)
- Encryption key in env — never logged, never sent to client
- Ingest keys (`abg-...`) identify SDK connections — scoped per provider, not per user
- Row-level data isolation via `userId` FK on all queries

### Data Model
- `users` → Clerk user_id FK; upserted on every dashboard layout load
- `providers` → encrypted api_key + IV, provider type, status, `ingest_key` (unique `abg-...`)
- `usage_snapshots` → daily aggregated token/cost per provider+model (unique on providerId+model+date)
- `projects` → user-defined cost tags
- `alerts` → anomaly + budget alert configs
- `subscriptions` → Stripe subscription state

### Two Ways Data Gets In

**1. Pull sync (admin keys only)**
- Vercel cron hits `GET /api/providers/auto-sync` every 5 minutes
- Each provider has a typed adapter in `lib/providers/`
- OpenAI: fetches 30 days via `/v1/usage?date=` in parallel batches of 5
- Anthropic: fetches via `/v1/usage?start_date=`
- Requires organization-level API keys — standard keys return 403/404

**2. SDK ingest (any key — recommended)**
- User wraps their existing client with `wrapOpenAI()` / `wrapAnthropic()`
- SDK reads token counts from the response object (already present in every API response)
- Fires `POST /api/ingest` with `{model, input_tokens, output_tokens}` in the background
- Ingest endpoint authenticates via `Authorization: Bearer abg-...` header
- Upserts into `usage_snapshots` with INCREMENT semantics (not replace)
- Zero latency impact on the caller; fire-and-forget; zero external dependencies in SDK

### Pricing
- `lib/pricing.ts` exports `calcCost(providerType, model, inputTokens, outputTokens)`
- Used by the ingest endpoint to compute cost per request
- OpenAI: exact model-name lookup; Anthropic: prefix-based (claude-opus-4, claude-sonnet-4, etc.)
- Fallback prices used when model is unrecognised

### AI Analysis
- Uses Claude Sonnet 4.6 via Anthropic SDK
- Receives aggregated usage stats (NO raw prompts)
- Returns structured JSON with cost-reduction recommendations
- Endpoint: `POST /api/ai/optimize`
