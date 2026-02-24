# AI Bill Guard – Launch Checklist

## 🎯 One-Line Positioning

> "Stop getting surprised by your AI bill."

Longer version: "The unified spend intelligence platform for AI teams — connect once, see everything, cut waste with AI."

---

## ✅ Pre-Launch Checklist

### Infrastructure (done)
- [x] Neon DB setup + Drizzle migrations (all 6 tables + ingest_key column)
- [x] Clerk auth configured (Google OAuth working)
- [x] Vercel deployment live → https://aibillgaurd.vercel.app
- [x] ENCRYPTION_KEY set in Vercel env
- [x] Vercel cron: auto-sync every 5 min + weekly digest Mon 9am
- [x] Resend email integration (welcome, provider-connected, weekly digest)
- [x] AES-256-GCM encryption for stored API keys

### Still needed before public launch
- [ ] Stripe products (Free / Pro / Business) + copy price IDs to .env
- [ ] Stripe webhook endpoint registered in Stripe dashboard → `/api/webhooks/stripe`
- [ ] Implement Stripe webhook handler (`app/api/webhooks/stripe/route.ts`)
- [ ] Clerk webhook svix verification (`app/api/webhooks/clerk/route.ts`)
- [ ] Resend sending domain verified (currently sending from noreply@aibillguard.ai)
- [ ] PostHog analytics snippet added
- [ ] Test full flow: signup → connect provider → SDK setup → see live data → upgrade
- [ ] Review CSP headers

### Content
- [ ] Record 2min Loom demo (show SDK setup → live dashboard update)
- [ ] Write "How it works" Twitter/X thread
- [ ] Prepare Product Hunt gallery (5 screenshots + 1 GIF)
- [ ] Draft IndieHackers post

---

## 🚀 Launch Sequence

### Day 0 — Soft launch
1. Deploy with waitlist / invite-only
2. Share with 20 founder friends
3. Goal: 50 early testers who connect a real provider

### Day 1 — IndieHackers
Post: "Show IH: I built a live AI spend tracker after getting a surprise $3,800 OpenAI bill"
- Lead with the pain story
- Show the 2-line SDK setup → dashboard screenshot
- Offer free Pro for first 10 commenters

### Day 2 — X/Twitter Thread
```
1/ I got a $3,847 OpenAI bill last month from a loop I forgot about.

I couldn't figure out WHICH feature caused it.
Or which team member spun it up.
Or which model was being called.

So I built AI Bill Guard — add 2 lines, see every AI call in real time.

Here's how it works: 🧵
```

### Day 3 — Reddit
- r/SaaS, r/MachineLearning, r/webdev
- r/ChatGPTPro, r/ClaudeAI

### Day 7 — Product Hunt
Best days: Tuesday–Thursday, post at 12:01am PST
- Tagline: "Stop getting surprised by your AI bill"
- Reply to every comment within the first 2 hours

---

## 💰 90-Day Revenue Model

### Month 1: Validate ($580 MRR target)
- 20 Pro users
- Focus: time from signup → first live data point (target: <5 min)

### Month 2: Growth ($2,320 MRR target)
- 80 Pro users
- Add Slack/email alerts for spend spikes
- Collect 10 testimonials with dollar figures

### Month 3: Scale ($6,780 MRR target)
- 200 Pro + 10 Business
- Team features, SSO
- Agency channel partnerships

---

## 🔑 Key Metrics to Track (PostHog)

1. Signup → first provider connected (target: <5 min)
2. Connected → SDK setup completed (target: same session)
3. SDK active → first live data point (target: <1 min after first API call)
4. Free → Pro conversion (target: 8%+)
5. WAU, providers per user (target: 3+ = sticky)

---

## 🛠️ Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16 + Tailwind v4 |
| Auth | Clerk |
| DB | Neon (Postgres) + Drizzle ORM |
| Payments | Stripe |
| Email | Resend |
| AI analysis | Claude Sonnet 4.6 |
| Deploy | Vercel |
| Analytics | PostHog (TODO) |
| SDK (JS) | `packages/sdk-js` → npm `aibillguard` |
| SDK (Python) | `packages/sdk-python` → PyPI `aibillguard` |
