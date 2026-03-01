import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

let db: any;
let pool: any = null;

if (process.env.DATABASE_URL) {
  // Production: synchronous initialization with static imports
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

/**
 * Run incremental column migrations that are safe (IF NOT EXISTS).
 * Works for both production (pg Pool) and local (PGlite).
 */
async function runIncrementalMigrations(queryFn: (sql: string) => Promise<any>): Promise<void> {
  const columnMigrations = [
    `ALTER TABLE "lookups" ADD COLUMN IF NOT EXISTS "trade_value" text`,
    `ALTER TABLE "lookups" ADD COLUMN IF NOT EXISTS "trade_value_currency" varchar(3) DEFAULT 'USD'`,
    // Feature requests table
    `CREATE TABLE IF NOT EXISTS "feature_requests" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "session_id" text NOT NULL,
      "title" text NOT NULL,
      "description" text,
      "status" text NOT NULL DEFAULT 'new',
      "admin_note" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS "feature_requests_session_idx" ON "feature_requests" ("session_id")`,
  ];
  for (const stmt of columnMigrations) {
    try {
      await queryFn(stmt);
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        console.warn(`⚠ Column migration warning: ${e.message?.substring(0, 120)}`);
      }
    }
  }
}

/**
 * Initialize PGlite for local development (no DATABASE_URL needed).
 * Must be called and awaited before any database access.
 * In production (DATABASE_URL set), only runs incremental migrations.
 */
export async function initLocalDb(): Promise<void> {
  if (db && pool) {
    // Production: run incremental migrations on the real database
    await runIncrementalMigrations((sql) => pool.query(sql));
    return;
  }
  if (db) return; // Already initialized by a previous call

  console.log("⚡ No DATABASE_URL — using embedded PGlite for local development");
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite("./pglite-data");
  db = drizzlePglite(client, { schema });

  // Auto-apply schema on first run: execute migration SQL if tables don't exist
  try {
    await client.query(`SELECT 1 FROM "destinations" LIMIT 1`);
  } catch {
    console.log("📦 Creating database schema via migration...");
    const migrationsDir = join(process.cwd(), "migrations");
    if (existsSync(migrationsDir)) {
      const files = readdirSync(migrationsDir)
        .filter((f: string) => f.endsWith(".sql"))
        .sort();
      for (const file of files) {
        const sql = readFileSync(join(migrationsDir, file), "utf-8");
        // Drizzle-kit uses "--> statement-breakpoint" as delimiter
        const statements = sql
          .split("--> statement-breakpoint")
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0);
        for (const stmt of statements) {
          try {
            await client.query(stmt);
          } catch (e: any) {
            if (!e.message?.includes("already exists")) {
              console.warn(`⚠ Migration warning: ${e.message?.substring(0, 120)}`);
            }
          }
        }
      }
      console.log("✅ Schema created successfully");
    } else {
      console.error("❌ No migrations directory found. Run: DATABASE_URL=postgres://unused npx drizzle-kit generate");
    }
  }

  // Incremental column migrations for existing databases
  await runIncrementalMigrations((sql) => client.query(sql));
}

export { db, pool };
