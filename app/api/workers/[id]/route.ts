import { supabaseServer } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const contractorName = body.name?.trim();

  if (!contractorName) {
    return NextResponse.json(
      {
        error: "Contractor name is required",
      },
      { status: 400 }
    );
  }

  // Duplicate name check
  const { data: existingWorker } =
    await supabaseServer
      .from("workers")
      .select("id")
      .ilike("name", contractorName)
      .neq("id", id)
      .maybeSingle();

  if (existingWorker) {
    return NextResponse.json(
      {
        error:
          "A contractor with this name already exists.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("workers")
    .update({
      name: contractorName,
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

  return NextResponse.json({
    success: true,
  });
}