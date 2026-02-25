# AI Bill Guard — Project Handoff Document

> Last updated: 2026-02-25.
> Purpose: A developer or AI model who has never seen this project should be able to
> read this file and know exactly what exists, what works, what is broken, and what
> to build next.

---

## 1. PROJECT OVERVIEW

### What It Is
AI Bill Guard is a SaaS web application that gives founders, indie hackers, and small
AI teams a unified dashboard to track their AI API spending across multiple providers
(OpenAI, Anthropic, Groq, Gemini, etc.). Users connect their API keys, optionally add
2 lines of SDK code to their app, and see a consolidated spend view with per-model
breakdowns, trend charts, and AI-generated cost optimization recommendations.

### Core Value Proposition
"Stop getting surprised by your AI bill." — Users get a $3,847 OpenAI shock because
there's no native cross-provider spend view. AI Bill Guard connects once and shows
exactly where every dollar goes, with waste scoring and savings suggestions.

### Target Users
- AI/SaaS founders using multiple LLM providers
- Indie hackers building AI-powered products
- Small engineering teams without dedicated FinOps

### Deployment URLs
- **Production**: https://aibillgaurd.vercel.app (note: typo in domain — "guard" spelled
  "gaurd" everywhere in the Vercel project and GitHub repo — this is intentional/permanent)
- **GitHub repo**: https://github.com/stratagenhq/aibillgaurd
- **Vercel project ID**: `prj_9Ohmza0aexkx9DyUfk4j1npnpf5a`
- **Vercel org**: `team_9Mdk2ifqg4FcR3TUNTlI4ftY`
- **Vercel project name**: `aibillgaurd`

---

## 2. TECH STACK

| Technology | Version | Why |
|---|---|---|
| Next.js | 16.1.6 | App Router, RSC, API routes. React Compiler enabled (`reactCompiler: true`). |
| React | 19.2.3 | Required by Next 16 |
| TypeScript | ^5 | Strict mode enabled (`"strict": true` in tsconfig) |
| Tailwind CSS | ^4 | Configured via `@tailwindcss/postcss`. Uses `@import "tailwindcss"` syntax (NOT `@tailwind base`). |
| Clerk | ^6.38.2 | Auth. Sign-in/up, Google OAuth, UserButton, `currentUser()`, `auth()`. Test keys configured. |
| Drizzle ORM | ^0.45.1 | Type-safe queries. Schema in `lib/db/schema.ts`. |
| drizzle-kit | ^0.31.9 | Migration generator/runner |
| `@neondatabase/serverless` | ^1.0.2 | Neon Postgres driver (HTTP mode for edge/serverless). `neon-http` adapter. |
| Anthropic SDK | ^0.78.0 | AI optimization analysis. Model: `claude-sonnet-4-6`. |
| Resend | ^6.9.2 | Transactional email. Sending from `noreply@aibillguard.ai`. |
| Stripe | ^20.3.1 | Payments (installed but NOT implemented yet) |
| `@stripe/stripe-js` | ^8.8.0 | Client-side Stripe (installed but NOT implemented yet) |
| Recharts | ^3.7.0 | 30-day bar chart on dashboard |
| lucide-react | ^0.575.0 | All icons throughout the app |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | `cn()` utility for conditional classes |
| Radix UI | various | Installed, NONE currently used in the app |
| react-hook-form + zod | ^7.71.2 / ^4.3.6 | Installed but NOT used yet |
| posthog-js | ^1.353.0 | Installed but NOT integrated yet |
| date-fns | ^4.1.0 | Installed but NOT currently used |
| class-variance-authority | ^0.7.1 | Installed, not used |

### Infrastructure
- **Database**: Neon PostgreSQL (serverless). Connection string includes pooler endpoint.
- **Hosting**: Vercel (auto-deploys from `main` branch on GitHub push)
- **Middleware**: `proxy.ts` at project root (Next.js 16 convention — NOT `middleware.ts`)
- **Cron**: Vercel Cron (configured in `vercel.json`) — 2 jobs:
  - `GET /api/providers/auto-sync` every 5 minutes (provider usage pull-sync)
  - `GET /api/cron/weekly-digest` every Monday at 9am UTC

---

## 3. HOW DATA GETS INTO THE SYSTEM

Two separate paths — both write to `usage_snapshots`.

### Path A — Pull Sync (admin keys only)
- Vercel cron hits `GET /api/providers/auto-sync` every 5 minutes
- `lib/sync-engine.ts` → `syncAllUsers()` → `syncProvider()` per provider
- **OpenAI**: `lib/providers/openai.ts` — fetches 30 days via `GET /v1/usage?date=YYYY-MM-DD` in parallel batches of 5. Requires an **organization-level API key** (project-scoped keys return empty data, not an error).
- **Anthropic**: `lib/providers/anthropic.ts` — fetches via `GET /v1/usage?start_date=`. `requestCount` is always 0 (not available in Anthropic's API).
- All other providers: not yet implemented (`syncSupported: false`)
- `lastSyncedAt` updated on the provider row on success

### Path B — SDK Ingest (any key — recommended for most users)
- User wraps their client: `wrapOpenAI(client, { key: "abg-..." })`
- SDK reads `usage` from the API response object (already present in every OpenAI/Anthropic response)
- Fires `POST /api/ingest` with `{ model, input_tokens, output_tokens }` in the background
- Auth: `Authorization: Bearer abg-...` header (the provider's `ingest_key`)
- **Increments** `usage_snapshots` row for today — does NOT replace
- Zero latency impact; fire-and-forget; zero external dependencies in the SDK packages

---

## 4. WHAT HAS BEEN BUILT

### Root Config Files

| File | State | What it does |
|---|---|---|
| `proxy.ts` | ✅ Complete | Next.js 16 middleware. Clerk auth protection on all non-public routes. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`. |
| `next.config.ts` | ✅ Complete | Enables React Compiler (`reactCompiler: true`). |
| `tsconfig.json` | ✅ Complete | Strict TypeScript. Path alias `@/*` → project root. |
| `drizzle.config.ts` | ✅ Complete | Points to `./lib/db/schema.ts`, outputs to `./lib/db/migrations`, loads `.env.local`. |
| `vercel.json` | ✅ Complete | 2 cron jobs: auto-sync every 5 min + weekly-digest Mon 9am UTC. |
| `.env.local` | ⚠️ Partial | Real: Clerk, DB, ENCRYPTION_KEY. Placeholders: Resend, Anthropic, Stripe. |

### App Directory

#### Root Layout
**`app/layout.tsx`** — ✅ Complete
- Wraps entire app in `<ClerkProvider>`
- Loads 3 Google Fonts: Instrument Serif, DM Sans, JetBrains Mono
- Font variables: `--font-instrument-serif`, `--font-dm-sans`, `--font-jetbrains-mono`

**`app/globals.css`** — ✅ Complete
- CSS custom properties: `--bg: #0a0a0b`, `--bg2: #111114`, `--bg3: #18181d`
- `--border: rgba(255,255,255,0.07)`, `--border-bright: rgba(255,255,255,0.14)`
- `--text: #f0eff4`, `--muted: #7c7b8a`, `--accent: #e8431a`, `--accent2: #f5a623`
- Noise texture overlay, animations: `ticker`, `fadeUp`, `pulseDot`

**`app/page.tsx`** — ✅ Complete
- Public landing page. 11 sections: Nav → Hero → Ticker → DashboardPreview → PainPoints → HowItWorks → Providers → Testimonials → Pricing → Waitlist → Footer

#### Auth Routes (group: `(auth)`)
- **`sign-in/[[...sign-in]]/page.tsx`** — Clerk `<SignIn>` with dark theme
- **`sign-up/[[...sign-up]]/page.tsx`** — Clerk `<SignUp>` with dark theme

#### Dashboard Routes (group: `(dashboard)`)

**`app/(dashboard)/layout.tsx`** — ✅ Complete
- **Critical**: Upserts Clerk user into `users` DB table on every load (reliable sync without needing webhook)
- Sidebar nav (hidden on mobile) + mobile top bar

**`app/(dashboard)/dashboard/page.tsx`** — ✅ Complete
- Stat cards: This Month, Projected, Total Tokens, Waste Score
- 30-day Recharts bar chart, AI OptimizeBanner, per-model ModelTable
- Two empty states: no providers → connect CTA; providers but no data → sync CTA

**`app/(dashboard)/connections/page.tsx`** — ✅ Complete
- Fetches providers + month-to-date cost per provider
- `ConnectedProvider` shape: `{ id, providerType, displayName, status, lastSyncedAt, monthCost, syncSupported, ingestKey }`

**`app/(dashboard)/insights/page.tsx`** — ✅ Complete
- Per-model breakdown: Model | Provider | Cost | Tokens | Requests | $/1K req
- Empty state with "Connect a provider →" CTA

**`app/(dashboard)/reports/page.tsx`** — ✅ Complete
- Daily cost summary table. CSV Export is a disabled `<span>` with "Pro" label — not functional.

**`app/(dashboard)/settings/page.tsx`** — ✅ Complete
- Account info, plan badge, AES-256 status. Upgrade button is `disabled` — Stripe NOT wired.

### API Routes

**`app/api/webhooks/clerk/route.ts`** — ⚠️ Partial (NO svix verification)
- Handles `user.created` / `user.updated`. Upserts user + sends welcome email.
- **Security gap**: no Svix signature verification. Any POST is processed.

**`app/api/providers/connect/route.ts`** — ✅ Complete
- `POST { providerType, displayName?, apiKey }`
- Validates OpenAI keys via `GET /v1/models`
- Encrypts API key with AES-256-GCM
- **Generates `ingestKey = "abg-" + randomBytes(24).toString("hex")`** and stores on the provider row
- Sends provider-connected email (fire-and-forget)
- Returns `{ provider: { ...provider, ingestKey } }`

**`app/api/providers/auto-sync/route.ts`** — ✅ Complete
- `POST { providerId? }` — manual "Sync now" (requires Clerk auth)
- `GET` — called by Vercel cron (auth via `CRON_SECRET` header)
- Delegates to `lib/sync-engine.ts`

**`app/api/providers/[providerId]/route.ts`** — ✅ Complete
- `DELETE`: removes provider + cascades usage_snapshots. Verifies ownership.
- `PATCH`: updates provider fields.

**`app/api/ingest/route.ts`** — ✅ Complete (NEW)
- `POST` — receives SDK usage events
- Auth: `Authorization: Bearer abg-...` header matched against `providers.ingest_key`
- Body: `{ model: string, input_tokens: number, output_tokens: number }`
- Calls `calcCost()` from `lib/pricing.ts` to compute USD cost
- **Upserts** `usage_snapshots` with INCREMENT on conflict (not replace):
  `input_tokens + N`, `output_tokens + N`, `cost_usd + N`, `request_count + 1`
- Returns `{ ok: true }`

**`app/api/ai/optimize/route.ts`** — ✅ Complete (requires `ANTHROPIC_API_KEY`)
- Calls `claude-sonnet-4-6`, returns 3 recommendations as structured JSON
- Types: `QUICK_WIN`, `MEDIUM`, `ADVANCED`

**`app/api/cron/weekly-digest/route.ts`** — ✅ Complete (requires `RESEND_API_KEY`)
- `GET` — Vercel cron, every Monday 9am UTC
- Sends weekly digest email to all users with data this week

### Library Files

**`lib/db/schema.ts`** — ✅ Complete
- 6 tables + 5 enums. Key table details:
- `providers`: `..., encrypted_api_key, key_iv, ingest_key (text, unique), status, last_synced_at`
  - `ingest_key` format: `abg-` + 48 hex chars, unique, set on insert
- `usage_snapshots`: unique on `(provider_id, model, date)` — enforces one row per provider+model+day

**`lib/db/migrations/`** — ✅ Both applied to production Neon DB
- `0000_tough_red_ghost.sql` — initial schema (6 tables, enums, indexes)
- `0001_ingest_keys.sql` — adds `ingest_key` column + backfills existing rows + unique index

**`lib/sync-engine.ts`** — ✅ Complete
- `syncProvider(provider)` — single provider sync via typed adapter
- `syncAllProvidersForUser(userId)` — all providers for one user
- `syncAllUsers()` — iterates all users (used by cron)
- Uses `PROVIDER_ADAPTERS` map: `{ openai: OpenAIAdapter, anthropic: AnthropicAdapter }`

**`lib/pricing.ts`** — ✅ Complete (NEW)
- `calcCost(providerType, model, inputTokens, outputTokens): number`
- OpenAI: exact model-name lookup (11 models). Unknown → fallback `{ input: 5.0, output: 15.0 }`
- Anthropic: prefix-based lookup (`claude-opus-4`, `claude-sonnet-4`, `claude-haiku-4`). Unknown → `{ input: 3.0, output: 15.0 }`
- Prices in USD per 1M tokens

**`lib/encryption.ts`** — ✅ Complete
- AES-256-GCM. `encryptApiKey(plaintext)` / `decryptApiKey(encrypted, iv)`
- Key from `ENCRYPTION_KEY` env var (must be 64 hex chars = 32 bytes). **Never rotate without migrating all stored keys first.**

**`lib/email.ts`** — ✅ Complete
- Resend wrapper. Guard: if `RESEND_API_KEY` starts with `re_` (placeholder), no-op silently.

**`lib/providers/index.ts`** — ✅ Complete
- `PROVIDER_META`: configs for all 11 providers. `syncSupported: true` for `openai` and `anthropic`.
- `ALL_PROVIDERS`: flat array

**`lib/providers/openai.ts`** — ✅ Complete
- `validateOpenAIKey()`, `fetchOpenAIUsage(apiKey, days)`
- Uses legacy `/v1/usage?date=YYYY-MM-DD` endpoint — requires organization-level key

**`lib/providers/anthropic.ts`** — ✅ Complete
- `fetchAnthropicUsage(apiKey, days)`
- Uses `/v1/usage?start_date=` — `requestCount` always 0 (not available in API)

**`lib/utils.ts`** — ✅ Complete
- `cn()`, `formatCurrency()`, `formatTokens()`, `formatRelativeTime()`, `getDaysInMonth()`

### Email Templates

| File | Status | Content |
|---|---|---|
| `emails/welcome.ts` | ✅ | Subject: "Welcome to AI Bill Guard". Onboarding steps, CTA to /connections. |
| `emails/provider-connected.ts` | ✅ | Subject: "{Provider} connected". Sync instructions if supported. |
| `emails/weekly-digest.ts` | ✅ | Subject: "Your AI spend this week — $X". Week total, MoM delta, top 5 models. |

### SDK Packages

**`packages/sdk-js/`** — ✅ Complete (npm package: `aibillguard`)
- `src/index.ts`: `wrapOpenAI<T>(client, { key })` and `wrapAnthropic<T>(client, { key })`
- Patches `.chat.completions.create` / `.messages.create` — reads `usage` from response
- Fire-and-forget `fetch` to `POST /api/ingest` — never throws, never blocks caller
- Zero dependencies. Build: `tsc` → `dist/`

**`packages/sdk-python/`** — ✅ Complete (PyPI package: `aibillguard`)
- `aibillguard/__init__.py`: `wrap_openai(client, key)` and `wrap_anthropic(client, key)`
- Uses `threading.Thread(daemon=True)` + stdlib `urllib` — zero external dependencies
- Patches `client.chat.completions.create` / `client.messages.create`

### Components — Dashboard

**`components/dashboard/SidebarNav.tsx`** — ✅ `usePathname()` active highlighting. 5 nav items.
**`components/dashboard/StatCard.tsx`** — ✅ Server-renderable. Props: `{ label, value, sub?, subColor?, icon? }`.
**`components/dashboard/SpendChart.tsx`** — ✅ Recharts BarChart. High-cost bars in `#e8431a`. Custom tooltip.
**`components/dashboard/ModelTable.tsx`** — ✅ Per-model table with waste badge heuristic (HIGH/MED/LOW).
**`components/dashboard/OptimizeBanner.tsx`** — ✅ AI optimization UI. `sessionStorage` cache (24h TTL). States: idle/loading/done/error.
**`components/dashboard/ProviderTable.tsx`** — ⚠️ Built but NOT used (dead code).

### Components — Connections

**`components/connections/ProviderGrid.tsx`** — ✅ Complete (`"use client"`)
- 3-col responsive grid of all 11 providers
- Connected card: green border, month cost, Sync button, Remove button
- **"Track live" button** (accordion) — expands SDK Setup panel:
  - Step 1: Install (pip/npm, language tab selector)
  - Step 2: Wrap your client (pre-filled snippet with ingest key, copy button)
  - Step 3: That's it (explains method call unchanged)
  - Footer: full ingest key + copy + security note
- Non-connected: "Connect →" opens modal
- Modal: display name (optional) + API key field → connecting → syncing → done states

**`components/connections/ProviderCard.tsx`** — ⚠️ Dead code (not imported anywhere)
**`components/connections/ConnectProviderForm.tsx`** — ⚠️ Dead code (not imported anywhere)

### Landing Components (all in `components/landing/`)

| Component | State | Notes |
|---|---|---|
| `Nav.tsx` | ✅ | Fixed top nav. "Join waitlist →" links to `#waitlist` (NOT /sign-up). |
| `Hero.tsx` | ✅ | "Stop getting surprised by your AI bill" headline. CTAs → #waitlist. |
| `Ticker.tsx` | ✅ | Auto-scrolling provider names. Pauses on hover. |
| `DashboardPreview.tsx` | ✅ | Static HTML mock. |
| `PainPoints.tsx` | ✅ | Pain point cards. |
| `HowItWorks.tsx` | ✅ | 3-step: Connect → Track → See savings. |
| `Providers.tsx` | ✅ | Grid of 11 provider logos/names. |
| `Testimonials.tsx` | ✅ | Placeholder testimonials. |
| `Pricing.tsx` | ✅ | Free/Pro/Business table. All CTAs → #waitlist. |
| `Waitlist.tsx` | ⚠️ Broken | Sets `submitted = true` locally only. No API call. No emails stored. |
| `Footer.tsx` | ✅ | |

---

## 5. WHAT IS WORKING RIGHT NOW

### Fully Functional End-to-End
- ✅ **Auth**: Sign-up, sign-in, Google OAuth, sign-out via Clerk
- ✅ **User sync to DB**: Layout upsert on every dashboard load
- ✅ **Landing page**: All sections render at https://aibillgaurd.vercel.app
- ✅ **Connect API key**: OpenAI validation + AES-256-GCM encryption + ingest key generation
- ✅ **SDK ingest**: `POST /api/ingest` auth, upsert, increment — fully functional
- ✅ **SDK packages**: `packages/sdk-js` and `packages/sdk-python` built, ready to publish
- ✅ **"Track live" panel**: shows in each connected provider card with copy snippet
- ✅ **Pull sync**: OpenAI (org keys) + Anthropic via `lib/sync-engine.ts`
- ✅ **Auto-sync cron**: Vercel cron every 5 min → `GET /api/providers/auto-sync`
- ✅ **Delete provider**: Removes provider + cascaded usage_snapshots
- ✅ **Dashboard**: stat cards, chart, model table — all real data
- ✅ **Insights**: per-model breakdown table
- ✅ **Reports**: daily cost summary table

### Partially Working
- ⚠️ **OpenAI pull-sync**: Works for org-level keys only. Project-scoped keys return empty data (no error).
- ⚠️ **Anthropic pull-sync**: Works but `requestCount` is always 0.
- ⚠️ **AI Optimization**: Code complete. Requires real `ANTHROPIC_API_KEY` in Vercel.
- ⚠️ **Email system**: All templates built. Requires real `RESEND_API_KEY` + verified domain.
- ⚠️ **Weekly digest cron**: Registered in vercel.json. Requires `RESEND_API_KEY`.

---

## 6. WHAT IS NOT WORKING / BROKEN

1. **AI Optimization returns 422** — `ANTHROPIC_API_KEY=sk-ant-` placeholder in Vercel. Set real key.
2. **All emails silently dropped** — `RESEND_API_KEY=re_` placeholder. Set real key + verify domain.
3. **Stripe not implemented** — packages installed, zero routes built, upgrade button disabled.
4. **Waitlist form does nothing** — `Waitlist.tsx` sets local `submitted` state only. No `/api/waitlist` route exists.
5. **Clerk webhook has no signature verification** — any POST to `/api/webhooks/clerk` is processed. Fix: install `svix`, add `CLERK_WEBHOOK_SECRET`.
6. **SDK packages not yet published** — `packages/sdk-js` and `packages/sdk-python` are ready but not on npm/PyPI yet.
7. **Mobile navigation broken** — sidebar hidden on mobile, no mobile nav links. Users can't navigate between pages on mobile.
8. **Landing CTAs link to #waitlist not /sign-up** — Nav, Hero, Pricing all link to `#waitlist`.
9. **Initial connect doesn't surface sync errors** — `handleConnect()` in ProviderGrid silently ignores sync 422 errors.
10. **Dead code** — `ProviderCard.tsx`, `ConnectProviderForm.tsx`, `ProviderTable.tsx` are built but unused.
11. **`CRON_SECRET` not set** — `/api/providers/auto-sync` GET accepts any request without auth.

---

## 7. ENVIRONMENT & SERVICES STATUS

| Variable | `.env.local` | Vercel | Status |
|---|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Real test key | ✅ Set | ✅ Working |
| `CLERK_SECRET_KEY` | Real test key | ✅ Set | ✅ Working |
| `DATABASE_URL` | Real Neon URL | ✅ Set | ✅ Working |
| `ENCRYPTION_KEY` | Real 64-char hex | ✅ Set | ✅ Working |
| `ANTHROPIC_API_KEY` | `sk-ant-` | Placeholder/unset | ❌ Not configured |
| `RESEND_API_KEY` | `re_` | Not set | ❌ Not configured |
| `CRON_SECRET` | Empty | Not set | ⚠️ Unprotected cron |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Needs prod URL | ⚠️ Wrong in Vercel |
| `STRIPE_SECRET_KEY` | `sk_test_` | Not set | ❌ Not configured |
| `STRIPE_WEBHOOK_SECRET` | `whsec_` | Not set | ❌ Not configured |
| `STRIPE_PRO_PRICE_ID` | `price_` | Not set | ❌ Not configured |
| `STRIPE_BUSINESS_PRICE_ID` | `price_` | Not set | ❌ Not configured |

---

## 8. IMMEDIATE NEXT STEPS (Priority Ordered)

### #1 — Publish SDK packages (1 hour)
**Why**: Users need `pip install aibillguard` / `npm install aibillguard` to work.
```bash
# npm
cd packages/sdk-js && npm run build && npm publish

# PyPI
cd packages/sdk-python && pip install build && python -m build && twine upload dist/*
```

### #2 — Activate AI Optimization (15 min)
- Add real `ANTHROPIC_API_KEY` to Vercel env vars → redeploy

### #3 — Activate Emails (30 min)
1. Sign up at resend.com
2. Add + verify `aibillguard.ai` domain
3. Create API key → add `RESEND_API_KEY` to Vercel
4. Set `NEXT_PUBLIC_APP_URL=https://aibillgaurd.vercel.app` in Vercel
5. Set `CRON_SECRET=<random hex>` in Vercel

### #4 — Fix Waitlist Form (30 min)
- Create `app/api/waitlist/route.ts` — `POST { email }` → save to DB or Resend contact list
- Update `Waitlist.tsx` to call it

### #5 — Fix Clerk Webhook Verification (45 min)
- `npm install svix`
- Add `CLERK_WEBHOOK_SECRET` to Vercel
- Update `app/api/webhooks/clerk/route.ts` to verify Svix signature

### #6 — Stripe Billing (3-5 hours)
- Create Stripe products + copy price IDs to Vercel
- Build `/api/billing/checkout/route.ts`, `/api/billing/portal/route.ts`, `/api/webhooks/stripe/route.ts`
- Wire up Settings upgrade button

### #7 — Mobile Navigation (30 min)
- Add mobile bottom nav bar to `app/(dashboard)/layout.tsx`

### #8 — Fix Landing CTAs (15 min)
- Change Nav, Hero, Pricing CTAs from `#waitlist` to `/sign-up`

---

## 9. FULL FEATURE ROADMAP

### MVP — Must Have Before Monetizing

| Feature | Status |
|---|---|
| Auth | ✅ Done |
| API key encryption + storage | ✅ Done |
| SDK-based live usage tracking | ✅ Done (packages need publishing) |
| OpenAI pull-sync | ✅ Done (org keys only) |
| Anthropic pull-sync | ✅ Done (requestCount = 0) |
| Unified dashboard | ✅ Done |
| AI optimization suggestions | ✅ Built (needs real API key) |
| Email system | ✅ Built (needs real API key + domain) |
| Waitlist capture | ❌ Broken |
| Stripe billing | ❌ Not built |
| Feature gating by plan | ❌ Not built |

### Post-Launch

| Feature | Priority |
|---|---|
| Publish SDK to npm + PyPI | HIGH |
| Budget alerts (email + Slack) | HIGH |
| Groq, Gemini, Mistral sync | HIGH |
| PostHog analytics | MEDIUM |
| CSV/PDF export (Pro) | MEDIUM |
| Team seats / multi-user | MEDIUM |
| Anomaly detection | MEDIUM |
| Usage limits (Free: 2 providers, 50k tokens) | HIGH |
| 7-day history enforcement for free tier | HIGH |
| SSO / SAML | LOW |

---

## 10. HOW TO RESUME WITH A NEW MODEL

### Critical Context
1. **`proxy.ts` is the middleware** — NOT `middleware.ts`. Do not rename it.
2. **Path alias `@/`** maps to project root, NOT `src/`.
3. **Tailwind v4** — `@import "tailwindcss"`, not `@tailwind base/components/utilities`.
4. **Migrations are applied** — `0000` and `0001` are live on Neon. Don't re-run. New changes: `npm run db:generate` then apply the new file.
5. **`ENCRYPTION_KEY` is sacred** — never rotate without decrypting + re-encrypting all `providers.encrypted_api_key` rows first.
6. **SDK ingest uses `ingest_key`** — `providers.ingest_key` (`abg-...`), NOT the provider's API key. Generated on connect. Used by SDK to authenticate ingest calls.
7. **Ingest upsert is INCREMENT-based** — conflict on `(provider_id, model, date)` adds to existing values, never replaces.
8. **The deployment URL has a typo** — `aibillgaurd.vercel.app` (gaurd not guard). Permanent.
9. **No test framework** — if adding tests, use Vitest.
10. **React Compiler is ON** — don't add manual `useMemo`/`useCallback`.

### Dev Commands
```bash
npm run dev          # localhost:3000
npm run build        # production build check
npm run lint
npm run db:generate  # generate migration from schema change
npm run db:push      # push schema directly (dev only)
npm run db:studio    # visual DB viewer
```

### Deploy
```bash
git add <files> && git commit -m "message" && git push
# Vercel auto-deploys from main
```

### Running Migrations (DNS workaround — local DNS blocks *.neon.tech)
```bash
# Get Neon API IP via Google DNS
dig @8.8.8.8 api.c-4.us-east-1.aws.neon.tech +short

# Run SQL via Neon HTTP API with --resolve flag
DB_URL=$(grep DATABASE_URL .env.local | cut -d= -f2-)
curl --resolve "api.c-4.us-east-1.aws.neon.tech:443:<IP>" \
  -X POST "https://api.c-4.us-east-1.aws.neon.tech/sql" \
  -H "Content-Type: application/json" \
  -H "Neon-Connection-String: $DB_URL" \
  -d '{"query": "YOUR SQL HERE", "params": []}'
```

---

## 11. COPY-PASTE RESUME PROMPT

```
I'm building AI Bill Guard — a SaaS app that tracks AI API spending across providers
(OpenAI, Anthropic, etc.) for founders and indie hackers.

## Stack
- Next.js 16.1.6 (App Router), React 19, TypeScript 5 strict
- Tailwind CSS v4 (`@import "tailwindcss"` syntax, NOT v3)
- Clerk v6 for auth
- Drizzle ORM + Neon PostgreSQL (HTTP driver via @neondatabase/serverless)
- Resend for email, Anthropic SDK (claude-sonnet-4-6) for AI optimization
- Stripe (installed, not implemented)
- Deployed on Vercel at https://aibillgaurd.vercel.app ("gaurd" typo is permanent)

## Key architectural notes
- Middleware is `proxy.ts` (NOT `middleware.ts`) — Next.js 16 convention
- Path alias `@/` maps to project root (no `src/` directory)
- API keys encrypted with AES-256-GCM in `lib/encryption.ts`
- User upserted into DB on every dashboard layout load
- Two data ingestion paths:
  1. Pull sync (org-level keys): `lib/sync-engine.ts` → OpenAI + Anthropic adapters
  2. SDK ingest: `POST /api/ingest` authenticated by `providers.ingest_key` (`abg-...`)
     Upserts with INCREMENT semantics — adds to existing snapshot, never replaces

## Database (Neon, migrations applied)
Tables: users, subscriptions, providers, usage_snapshots, projects, alerts
- providers: encrypted_api_key + key_iv + ingest_key (abg-... unique)
- usage_snapshots: unique(provider_id, model, date) — daily aggregates

## What's built and working
- Full auth (Clerk, Google OAuth)
- Landing page (11 sections)
- Dashboard: stat cards + 30-day chart + model table + AI optimization
- Connections: all 11 providers, connect/sync/delete, "Track live" SDK panel
- Insights: per-model breakdown, Anthropic sync
- Reports: daily cost summary
- SDK packages: packages/sdk-js (wrapOpenAI/wrapAnthropic) + packages/sdk-python (wrap_openai/wrap_anthropic)
- Ingest endpoint: POST /api/ingest
- Sync engine: lib/sync-engine.ts (OpenAI + Anthropic adapters)
- Email: welcome, provider-connected, weekly digest
- Cron: auto-sync every 5min + weekly digest Mon 9am

## What's not working
1. ANTHROPIC_API_KEY = placeholder → AI optimization 422
2. RESEND_API_KEY = placeholder → all emails dropped
3. Stripe = not configured, not built
4. Waitlist form = no backend, emails lost
5. Clerk webhook = no svix verification
6. SDK packages = not published to npm/PyPI yet
7. Mobile nav = broken (no links on mobile)
8. Landing CTAs → #waitlist not /sign-up

## Current task
[DESCRIBE WHAT YOU WANT TO BUILD NEXT HERE]

Before touching any file, read it first. Codebase at:
/Volumes/Others/Idea/AiBillGaurd/aibillguard
```
