import * as schema from "@shared/schema";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

let db: any;
let pool: any;

if (process.env.DATABASE_URL) {
  // Production / remote database via node-postgres
  const { Pool } = await import("pg");
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { drizzle: drizzlePg } = await import("drizzle-orm/node-postgres");
  db = drizzlePg(pool, { schema });
} else {
  // Local development fallback — embedded PGlite (no external PostgreSQL needed)
  console.log("⚡ No DATABASE_URL — using embedded PGlite for local development");
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const client = new PGlite("./pglite-data");
  pool = null;
  db = drizzlePglite(client, { schema });

  // Auto-apply schema on first run: execute migration SQL if tables don't exist
  try {
    await client.query(`SELECT 1 FROM "destinations" LIMIT 1`);
  } catch {
    console.log("📦 Creating database schema via migration...");
    const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
    const migrationsDir = join(rootDir, "migrations");
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
}

export { db, pool };
