"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

export async function approveExpense(id: string) {
  const { error } = await supabaseServer
    .from("expenses")
    .update({
      approval_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("approval_status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/expenses");
  revalidatePath(`/admin/expenses/${id}`);
}

export async function rejectExpense(id: string) {
  const { error } = await supabaseServer
    .from("expenses")
    .update({
      approval_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("approval_status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/expenses");
  revalidatePath(`/admin/expenses/${id}`);
}