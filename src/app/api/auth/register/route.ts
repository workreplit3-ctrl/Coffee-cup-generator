import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { hashPassword, setSession, publicUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || String(password).length < 6) {
      return NextResponse.json(
        { error: "Укажите email и пароль (минимум 6 символов)." },
        { status: 400 }
      );
    }
    const db = await getDb();
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, String(email).toLowerCase()))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже есть." },
        { status: 409 }
      );
    }
    const inserted = await db
      .insert(schema.users)
      .values({
        email: String(email).toLowerCase(),
        passwordHash: hashPassword(String(password)),
        name: name ? String(name) : null,
      })
      .returning();
    const user = inserted[0];
    await setSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сервера." }, { status: 500 });
  }
}
