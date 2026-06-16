import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabaseServer
    .from("workers")
    .insert([
      {
        name: body.name,
        day_rate: body.dayRate,
        night_rate: body.nightRate,
        active: true,
      },
    ]);

  if (error) {
    // PostgreSQL unique constraint
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: `Worker "${body.name}" already exists. Please use a different name.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}