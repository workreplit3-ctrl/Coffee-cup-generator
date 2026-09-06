import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// --- Users --------------------------------------------------------------
// Minimal auth: email + password hash. `plan` references one of the tariff
// ids defined in src/lib/plans.ts. `generationsUsed` is the running counter
// enforced against the plan's monthly limit.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  plan: text("plan").notNull().default("free"),
  generationsUsed: integer("generations_used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Generations --------------------------------------------------------
// Every design a user renders is stored so they get a history feed. The
// `design` column holds the parameters (colors, text, pattern, seed) that
// let us re-render the exact same cup deterministically.
export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  design: jsonb("design").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
