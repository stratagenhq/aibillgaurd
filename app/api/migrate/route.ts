import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

// One-time migration endpoint — DELETE THIS FILE after running
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-migrate-secret");
  if (authHeader !== process.env.MIGRATION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const migration = `CREATE TYPE "public"."alert_type" AS ENUM('anomaly', 'budget');
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'business');
CREATE TYPE "public"."provider_status" AS ENUM('active', 'error', 'disabled');
CREATE TYPE "public"."provider_type" AS ENUM('openai', 'anthropic', 'groq', 'gemini', 'azure_openai', 'fireworks', 'together', 'mistral', 'midjourney', 'elevenlabs', 'perplexity');
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'incomplete');
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "alert_type" NOT NULL,
	"threshold" numeric(10, 2),
	"provider_id" uuid,
	"slack_webhook_url" text,
	"email_enabled" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT '#e8431a',
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider_type" "provider_type" NOT NULL,
	"display_name" text,
	"encrypted_api_key" text,
	"key_iv" text,
	"status" "provider_status" DEFAULT 'active' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
CREATE TABLE "usage_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" uuid NOT NULL,
	"model" text NOT NULL,
	"date" date NOT NULL,
	"input_tokens" bigint DEFAULT 0,
	"output_tokens" bigint DEFAULT 0,
	"total_tokens" bigint DEFAULT 0,
	"cost_usd" numeric(12, 8) DEFAULT '0',
	"request_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "usage_snapshots" ADD CONSTRAINT "usage_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "usage_snapshots" ADD CONSTRAINT "usage_snapshots_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "providers_user_id_idx" ON "providers" USING btree ("user_id");
CREATE INDEX "snapshots_user_date_idx" ON "usage_snapshots" USING btree ("user_id","date");
CREATE INDEX "snapshots_provider_date_idx" ON "usage_snapshots" USING btree ("provider_id","date");
CREATE UNIQUE INDEX "snapshots_unique_idx" ON "usage_snapshots" USING btree ("provider_id","model","date");`;

  const statements = migration
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const results: { statement: string; status: string; error?: string }[] = [];

  for (const statement of statements) {
    const preview = statement.slice(0, 80).replace(/\n/g, " ");
    try {
      await sql.query(statement);
      results.push({ statement: preview, status: "ok" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      // Ignore "already exists" errors so migration is idempotent
      if (
        message.includes("already exists") ||
        message.includes("duplicate")
      ) {
        results.push({ statement: preview, status: "skipped (already exists)" });
      } else {
        results.push({ statement: preview, status: "error", error: message });
      }
    }
  }

  const errors = results.filter((r) => r.status === "error");
  return NextResponse.json(
    { success: errors.length === 0, results },
    { status: errors.length === 0 ? 200 : 500 }
  );
}
