import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { error } = await supabaseServer
    .from("projects")
    .insert([
      {
        name: body.name,
        active: true,
      },
    ]);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}