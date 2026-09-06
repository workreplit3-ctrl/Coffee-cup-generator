import type { Config } from "drizzle-kit";

// Used only when pushing schema to a real Postgres (e.g. Vercel/Neon).
// Locally the app auto-creates tables via PGlite, so this is optional.
export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
} satisfies Config;
