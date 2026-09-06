import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { verifyPassword, setSession, publicUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
    }
    const db = await getDb();
    const rows = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, String(email).toLowerCase()))
      .limit(1);
    const user = rows[0];
    if (!user || !verifyPassword(String(password), user.passwordHash)) {
      return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
    }
    await setSession(user.id);
    return NextResponse.json({ user: publicUser(user) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ошибка сервера." }, { status: 500 });
  }
}
