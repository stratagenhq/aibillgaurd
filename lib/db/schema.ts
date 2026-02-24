import {
  pgTable,
  pgEnum,
  text,
  uuid,
  timestamp,
  boolean,
  numeric,
  bigint,
  integer,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "pro", "business"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "incomplete",
]);

export const providerTypeEnum = pgEnum("provider_type", [
  "openai",
  "anthropic",
  "groq",
  "gemini",
  "azure_openai",
  "fireworks",
  "together",
  "mistral",
  "midjourney",
  "elevenlabs",
  "perplexity",
]);

export const providerStatusEnum = pgEnum("provider_status", [
  "active",
  "error",
  "disabled",
]);

export const alertTypeEnum = pgEnum("alert_type", ["anomaly", "budget"]);

// ─── Users ────────────────────────────────────────────────────────────────────
// Synced from Clerk via webhook (user.created / user.updated)

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
// One-to-one with users, synced from Stripe webhooks

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(), // Stripe subscription ID
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").unique(),
  plan: planEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Providers ────────────────────────────────────────────────────────────────
// AI provider connections — API key stored encrypted (AES-256-GCM)

export const providers = pgTable(
  "providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerType: providerTypeEnum("provider_type").notNull(),
    displayName: text("display_name"),
    encryptedApiKey: text("encrypted_api_key"), // AES-256-GCM ciphertext
    keyIv: text("key_iv"),                       // IV for decryption
    ingestKey: text("ingest_key").unique(),
    status: providerStatusEnum("status").notNull().default("active"),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("providers_user_id_idx").on(t.userId)]
);

// ─── Usage Snapshots ──────────────────────────────────────────────────────────
// Append-only daily aggregated token/cost data per provider + model

export const usageSnapshots = pgTable(
  "usage_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    date: date("date").notNull(),
    inputTokens: bigint("input_tokens", { mode: "number" }).default(0),
    outputTokens: bigint("output_tokens", { mode: "number" }).default(0),
    totalTokens: bigint("total_tokens", { mode: "number" }).default(0),
    costUsd: numeric("cost_usd", { precision: 12, scale: 8 }).default("0"),
    requestCount: integer("request_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("snapshots_user_date_idx").on(t.userId, t.date),
    index("snapshots_provider_date_idx").on(t.providerId, t.date),
    // Prevent duplicate snapshots for same provider+model+day
    uniqueIndex("snapshots_unique_idx").on(t.providerId, t.model, t.date),
  ]
);

// ─── Projects ─────────────────────────────────────────────────────────────────
// User-defined cost tags / feature labels

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#e8431a"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Alerts ───────────────────────────────────────────────────────────────────
// Anomaly detection + budget threshold alerts

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: alertTypeEnum("type").notNull(),
  threshold: numeric("threshold", { precision: 10, scale: 2 }),
  providerId: uuid("provider_id").references(() => providers.id, {
    onDelete: "cascade",
  }),
  slackWebhookUrl: text("slack_webhook_url"),
  emailEnabled: boolean("email_enabled").default(true),
  isActive: boolean("is_active").default(true),
  triggeredAt: timestamp("triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  providers: many(providers),
  usageSnapshots: many(usageSnapshots),
  projects: many(projects),
  alerts: many(alerts),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  user: one(users, { fields: [providers.userId], references: [users.id] }),
  usageSnapshots: many(usageSnapshots),
  alerts: many(alerts),
}));

export const usageSnapshotsRelations = relations(usageSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [usageSnapshots.userId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [usageSnapshots.providerId],
    references: [providers.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
  provider: one(providers, {
    fields: [alerts.providerId],
    references: [providers.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type UsageSnapshot = typeof usageSnapshots.$inferSelect;
export type NewUsageSnapshot = typeof usageSnapshots.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
