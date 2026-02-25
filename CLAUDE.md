# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Bill Guard is a Next.js SaaS application for AI-powered bill management and analysis. It uses the App Router (not Pages Router).

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test framework is configured yet. When adding one, prefer Vitest.

## Architecture

**Stack:**
- Next.js 16 with App Router, React 19, TypeScript 5 (strict)
- Tailwind CSS v4 (configured via `@tailwindcss/postcss`)
- React Compiler enabled (`reactCompiler: true` in `next.config.ts`)

**Path alias:** `@/*` maps to the project root.

**Planned integrations** (env vars configured in `.env.local`, packages not yet installed):
- **Auth:** Clerk — sign-in at `/sign-in`, sign-up at `/sign-up`, redirects to `/dashboard`
- **Database:** PostgreSQL via `DATABASE_URL` (Prisma ORM expected)
- **AI:** Anthropic API (`ANTHROPIC_API_KEY`)
- **Payments:** Stripe with Pro and Business price tiers; webhook secret configured
- **Email:** Resend, sending from `noreply@aibillguard.ai`
- **Encryption:** `ENCRYPTION_KEY` available for sensitive data at rest

**App structure:** All routes live under `app/`. API routes go in `app/api/`. The project currently has only the default boilerplate — feature implementation is pending.

## Environment Variables

All required keys are in `.env.local`. When adding new integrations, add the corresponding env var there and document its purpose inline.

## "update doc" Command

When the user says "update doc" (in any project), always update `PROJECT_HANDOFF.md` in the project root to reflect everything built in the current session. If `PROJECT_HANDOFF.md` does not exist, create it from scratch. This applies to every project, not just this one.

`PROJECT_HANDOFF.md` must contain:
- What was built (files created/modified, features added)
- What is working vs broken
- Immediate next steps
- A copy-paste resume prompt for a new model to pick up where we left off
