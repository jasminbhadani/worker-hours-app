"use client";

import { approveExpense, rejectExpense } from "./actions";
import { useTransition } from "react";

type Props = {
  id: string;
};

export default function ApprovalButtons({
  id,
}: Props) {
  const [pending, startTransition] = useTransition();

  const handleApprove = () => {
    if (
      !window.confirm(
        "Approve this expense?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      await approveExpense(id);
    });
  };

  const handleReject = () => {
    if (
      !window.confirm(
        "Reject this expense?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      await rejectExpense(id);
    });
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleApprove}
        disabled={pending}
        title="Approve Expense"
        className="rounded px-2 py-1 text-green-600 hover:bg-green-50 disabled:opacity-50"
      >
        ✓
      </button>

      <button
        type="button"
        onClick={handleReject}
        disabled={pending}
        title="Reject Expense"
        className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  );
}