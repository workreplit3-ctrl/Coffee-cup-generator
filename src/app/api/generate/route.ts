import { NextRequest, NextResponse } from "next/server";
import { sql, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { planLimit } from "@/lib/plans";
import { generateDesign } from "@/lib/design";

// Records a generation server-side and enforces the plan's monthly limit.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Войдите в аккаунт, чтобы генерировать дизайн." },
      { status: 401 }
    );
  }

  const limit = planLimit(user.plan);
  if (user.generationsUsed >= limit) {
    return NextResponse.json(
      {
        error: `Лимит генераций исчерпан (${user.generationsUsed}/${limit}). Обновите тариф, чтобы продолжить.`,
        limitReached: true,
        used: user.generationsUsed,
        limit,
      },
      { status: 403 }
    );
  }

  const { prompt, seed, logo } = await req
    .json()
    .catch(() => ({ prompt: "" }));
  const design = generateDesign(String(prompt || "").slice(0, 120), seed);
  // Attach the user's logo (data URL) so history re-renders it. Guard the size
  // so a huge upload can't bloat the row (client already resizes to ~512px).
  if (typeof logo === "string" && logo.startsWith("data:image") && logo.length < 400_000) {
    design.logo = logo;
  }

  const db = await getDb();
  await db.insert(schema.generations).values({
    userId: user.id,
    prompt: design.prompt,
    design,
  });
  const updated = await db
    .update(schema.users)
    .set({ generationsUsed: sql`${schema.users.generationsUsed} + 1` })
    .where(eq(schema.users.id, user.id))
    .returning();

  return NextResponse.json({
    design,
    used: updated[0].generationsUsed,
    limit,
  });
}
