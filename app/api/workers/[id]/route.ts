import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const { error } = await supabaseServer
    .from("workers")
    .update({
        day_rate: body.dayRate,
        night_rate: body.nightRate,
        active: body.active,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}