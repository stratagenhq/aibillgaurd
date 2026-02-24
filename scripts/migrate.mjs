/**
 * Migration script using undici Agent with custom DNS lookup
 * to bypass ISP DNS blocks on Neon hostnames.
 */
import { readFileSync } from "node:fs";
import dns from "node:dns";
import { fetch as undiciFetch, Agent } from "node:undici";
import { neon, neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Neon c-4 cluster — resolved via 8.8.8.8
const NEON_IP = "54.86.249.90";

const agent = new Agent({
  connect: {
    lookup: (hostname, opts, callback) => {
      if (hostname.includes("neon.tech")) {
        callback(null, NEON_IP, 4);
      } else {
        dns.lookup(hostname, opts, callback);
      }
    },
  },
});

neonConfig.fetchFunction = (url, options) =>
  undiciFetch(url, { ...options, dispatcher: agent });

const sql = neon(process.env.DATABASE_URL);

const migration = readFileSync(
  "./lib/db/migrations/0000_tough_red_ghost.sql",
  "utf8"
);

const statements = migration
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Applying ${statements.length} statements to Neon...\n`);

for (const statement of statements) {
  process.stdout.write(
    `  → ${statement.slice(0, 72).replace(/\n/g, " ")}...\n`
  );
  await sql.query(statement);
}

console.log("\n✓ Migration complete! All tables created in Neon.");
