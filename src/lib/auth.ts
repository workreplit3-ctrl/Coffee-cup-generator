import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { User } from "@/db/schema";

const SESSION_COOKIE = "cupart_session";
// Sessions are signed with this secret. On Vercel set AUTH_SECRET; a dev
// fallback keeps local runs working.
const SECRET = process.env.AUTH_SECRET || "cupart-dev-secret-change-me";

// --- password hashing (scrypt, no external deps) ---
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  return hashBuf.length === test.length && timingSafeEqual(hashBuf, test);
}

// --- signed session token: "<userId>.<signature>" ---
function sign(value: string): string {
  return createHash("sha256").update(value + SECRET).digest("hex");
}

export function createSessionToken(userId: number): string {
  const v = String(userId);
  return `${v}.${sign(v)}`;
}

export function parseSessionToken(token: string | undefined): number | null {
  if (!token) return null;
  const [v, sig] = token.split(".");
  if (!v || !sig) return null;
  if (sign(v) !== sig) return null;
  const id = Number(v);
  return Number.isInteger(id) ? id : null;
}

export async function setSession(userId: number) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const id = parseSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const db = await getDb();
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return rows[0] ?? null;
}

export function publicUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    plan: u.plan,
    generationsUsed: u.generationsUsed,
  };
}
