# AI Bill Guard – Launch Checklist + Naming Guide

## 🏷️ Name Suggestions (Pick Your Favorite)

| Name | Domain | Vibe |
|------|--------|------|
| **AI Bill Guard** | aibillguard.ai | Clear, specific, SEO-friendly |
| **Costora** | costora.ai | Clean SaaS sound, brandable |
| **Drainwatch** | drainwatch.io | Visceral, pain-first naming |
| **AIBudget** | aibudget.app | Direct, searchable |
| **LLMGuard** | llmguard.io | Slightly technical, security angle |
| **SpendPilot** | spendpilot.ai | Action-oriented, control angle |
| **Parsec** | parsec.ai | Elegant, but probably taken |

**Recommendation:** `aibillguard.ai` or `costora.ai`

---

## 🎯 One-Line Positioning

> "The unified spend intelligence platform for AI teams — connect once, see everything, cut waste with AI."

Shorter version: "Stop getting surprised by your AI bill."

---

## ✅ Pre-Launch Checklist

### Tech (before shipping)
- [ ] Set up Supabase/Neon DB + run migrations
- [ ] Configure Clerk (auth) + add domains
- [ ] Add Stripe products (Free/Pro/Business) + copy price IDs to .env
- [ ] Set ENCRYPTION_KEY in production env (32 bytes, never rotate without migration plan)
- [ ] Set up Vercel cron for provider sync (`/api/cron/sync`)
- [ ] Configure Resend + verify sending domain
- [ ] Add PostHog for analytics
- [ ] Set up Stripe webhook endpoint in Stripe dashboard → `/api/webhooks/stripe`
- [ ] Enable Clerk webhook → `/api/webhooks/clerk` (user.created event)
- [ ] Test full flow: signup → connect OpenAI → see dashboard → upgrade
- [ ] Test Stripe checkout + webhook receipt
- [ ] Enable RLS on all Supabase tables
- [ ] Review CSP headers + remove `unsafe-eval` if not needed

### Content
- [ ] Record 2min Loom demo video
- [ ] Write "How it works" Twitter thread
- [ ] Prepare Product Hunt gallery (5 screenshots + 1 GIF)
- [ ] Draft IndieHackers post: "I built X to solve my own Y problem"
- [ ] Screenshot your own $4k bill that inspired this 😅

---

## 🚀 Launch Sequence

### Day 0 (soft launch – waitlist)
1. Deploy landing page with waitlist form
2. Post in private channels / DMs to 20 founder friends
3. Goal: 100 waitlist signups before hard launch

### Day 1 – IndieHackers
Post: "Show IH: I built a unified AI spend tracker after getting a $3,800 surprise OpenAI bill"
- Lead with the pain story (your personal experience)
- Show the dashboard screenshot
- Offer free Pro for first 10 commenters

### Day 2 – X/Twitter Thread
```
1/ I got a $3,847 OpenAI bill last month from a loop I forgot about.

I couldn't figure out WHICH feature caused it.
Or which team member spun it up.
Or which model was being called.

So I built AI Bill Guard – a unified AI spend dashboard.

Here's what it does: 🧵
```

### Day 3 – Reddit
- r/SaaS: "Show HN-style: built a tool to track AI API costs"
- r/MachineLearning: costs discussion thread
- r/ChatGPTPro / r/ClaudeAI
- r/webdev if you show the tech stack

### Day 7 – Product Hunt
Best days: Tuesday–Thursday, post at 12:01am PST
- Ask 50 people to upvote in advance (friends, waitlist)
- Reply to EVERY comment within the first 2 hours
- Tagline: "Stop getting surprised by your AI bill"

### Ongoing
- Weekly "AI Cost Report" newsletter (use your own data + industry trends)
- Cold outreach to founders who tweet about high AI bills
- Add a "$X saved" counter to the landing page once you have data

---

## 💰 90-Day Revenue Model

### Month 1: Validate
- Target: 20 Pro users ($580 MRR)
- Focus: Onboarding quality, "aha moment" speed
- Metric: Time from signup → first $saved insight

### Month 2: Growth
- Target: 80 Pro users ($2,320 MRR)
- Add Slack integration for alerts
- Collect 10 testimonials with dollar figures

### Month 3: Scale
- Target: 200 Pro + 10 Business ($6,780 MRR)
- Add team features, SSO
- Consider agency channel partnerships

### ARR target at month 3: ~$81k/yr
### ARR target at month 6: $100k+

---

## 🔑 Key Metrics to Track (PostHog)

1. Signup → first provider connected (target: <5 min)
2. Connected → first dashboard view (target: same session)
3. Dashboard → "Optimize" clicked (target: first week)
4. Free → Pro conversion (target: 8%+)
5. WAU (weekly active users)
6. Providers per user (target: 3+ = sticky)

---

## 🛠️ Stack Summary

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 15 + Tailwind | Speed + ecosystem |
| Auth | Clerk | Best DX, handles everything |
| DB | Supabase/Neon | Postgres + edge-ready |
| ORM | Drizzle | Type-safe, fast |
| Payments | Stripe | Industry standard |
| Email | Resend | Best deliverability |
| AI | Claude Sonnet 4.5 | Best at structured analysis |
| Deploy | Vercel | Zero-config, edge-ready |
| Analytics | PostHog | Privacy-friendly, free |
