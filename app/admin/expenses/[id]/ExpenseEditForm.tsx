"use client";

import { useActionState } from "react";
import { updateExpenseDetails } from "@/app/admin/expenses/actions";

type ExpenseEditFormProps = {
  expense: {
    id: string;
    vendor_name?: string | null;
    invoice_number?: string | null;
    invoice_date?: string | null;
    amount?: number | null;
    tax_amount?: number | null;
    notes?: string | null;
  };
};

export default function ExpenseEditForm({
  expense,
}: ExpenseEditFormProps) {
  const boundAction = updateExpenseDetails.bind(null, expense.id);
  const [state, formAction, pending] = useActionState(
    async (_: { error: string | null; success: boolean }, formData: FormData) => {
      try {
        await boundAction(formData);
        return { error: null, success: true };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to save expense updates.",
          success: false,
        };
      }
    },
    { error: null, success: false }
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-500">
            Vendor Name
          </span>
          <input
            type="text"
            name="vendor_name"
            defaultValue={expense.vendor_name || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-500">
            Invoice Number
          </span>
          <input
            type="text"
            name="invoice_number"
            defaultValue={expense.invoice_number || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-500">
            Invoice Date
          </span>
          <input
            type="date"
            name="invoice_date"
            defaultValue={expense.invoice_date || ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-500">
            Amount
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            defaultValue={expense.amount ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-slate-500">
            Tax Amount
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            name="tax_amount"
            defaultValue={expense.tax_amount ?? ""}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm text-slate-500">
          Notes
        </span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={expense.notes || ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Expense details saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Updates"}
      </button>
    </form>
  );
}
