import "dotenv/config";
import * as schema from "./schema";

// -----------------------------------------------------------------------------
// Dual database driver.
//
//  • On Vercel (or anywhere a real Postgres is available) set DATABASE_URL and
//    we connect with node-postgres — production ready, Neon / Vercel Postgres.
//  • Locally / in the preview sandbox there is no Postgres server, so we fall
//    back to PGlite: a full Postgres compiled to WASM that runs in-process and
//    persists to ./.pglite. Same SQL, same Drizzle code, zero setup.
//
// The schema is created lazily on first access so the app boots even on a fresh
// database.
// -----------------------------------------------------------------------------

type DrizzleDb = import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> &
  { $client?: unknown };

let dbPromise: Promise<DrizzleDb> | null = null;

const CREATE_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    generations_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS generations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    design JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`;

async function init(): Promise<DrizzleDb> {
  const url = process.env.DATABASE_URL;

  if (url && !url.includes("127.0.0.1") && !url.includes("localhost")) {
    // ---- Real Postgres (production / Vercel) ----
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      ssl: url.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    });
    await pool.query(CREATE_SQL);
    return drizzle(pool, { schema }) as DrizzleDb;
  }

  // ---- PGlite fallback (local / preview) ----
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite("./.pglite");
  await client.exec(CREATE_SQL);
  return drizzle(client, { schema }) as unknown as DrizzleDb;
}

export function getDb(): Promise<DrizzleDb> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}

export { schema };
