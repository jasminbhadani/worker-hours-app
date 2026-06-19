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

export async function updateExpenseDetails(
  id: string,
  formData: FormData
) {
  const vendorName = formData.get("vendor_name");
  const invoiceNumber = formData.get("invoice_number");
  const invoiceDate = formData.get("invoice_date");
  const amount = formData.get("amount");
  const taxAmount = formData.get("tax_amount");
  const notes = formData.get("notes");

  const payload = {
    vendor_name:
      typeof vendorName === "string" && vendorName.trim()
        ? vendorName.trim()
        : null,
    invoice_number:
      typeof invoiceNumber === "string" && invoiceNumber.trim()
        ? invoiceNumber.trim()
        : null,
    invoice_date:
      typeof invoiceDate === "string" && invoiceDate.trim()
        ? invoiceDate
        : null,
    amount:
      typeof amount === "string" && amount.trim()
        ? Number(amount)
        : null,
    tax_amount:
      typeof taxAmount === "string" && taxAmount.trim()
        ? Number(taxAmount)
        : null,
    notes:
      typeof notes === "string" && notes.trim()
        ? notes.trim()
        : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseServer
    .from("expenses")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/expenses");
  revalidatePath(`/admin/expenses/${id}`);
}
