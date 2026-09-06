import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { planLimit } from "@/lib/plans";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const db = await getDb();
  const history = await db
    .select()
    .from(schema.generations)
    .where(eq(schema.generations.userId, user.id))
    .orderBy(desc(schema.generations.createdAt))
    .limit(12);
  return NextResponse.json({
    user: publicUser(user),
    limit: planLimit(user.plan),
    history,
  });
}
