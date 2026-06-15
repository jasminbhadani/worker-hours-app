import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  console.log("ENV PASSWORD:", process.env.ADMIN_PASSWORD);
  console.log("ENTERED PASSWORD:", password);

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();

    cookieStore.set("admin", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Invalid password" },
    { status: 401 }
  );
}