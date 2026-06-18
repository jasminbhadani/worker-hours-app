"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase-server";

type WorkEntryField =
  | "workerId"
  | "projectId"
  | "workDate"
  | "hoursWorked"
  | "shift";

type WorkEntryFieldErrors = Partial<
  Record<WorkEntryField, string>
>;

export type WorkEntryActionResult = {
  success: boolean;
  message: string;
  page?: number;
  fieldErrors?: WorkEntryFieldErrors;
};

type ActionContext = {
  currentPage: number;
  pageSize: number;
};

export type UpdateWorkEntryInput = ActionContext & {
  id: string;
  workerId: string;
  projectId: string;
  workDate: string;
  hoursWorked: number;
  shift: string;
};

export type DeleteWorkEntryInput = ActionContext & {
  id: string;
};

function getValidPage(
  count: number | null,
  currentPage: number,
  pageSize: number
) {
  const totalPages = Math.max(
    1,
    Math.ceil((count || 0) / pageSize)
  );

  return Math.min(
    Math.max(currentPage, 1),
    totalPages
  );
}

function validateWorkEntry(
  input: UpdateWorkEntryInput
): WorkEntryFieldErrors {
  const fieldErrors: WorkEntryFieldErrors = {};

  if (!input.workerId) {
    fieldErrors.workerId =
      "Worker is required.";
  }

  if (!input.projectId) {
    fieldErrors.projectId =
      "Project is required.";
  }

  if (!input.workDate) {
    fieldErrors.workDate =
      "Date is required.";
  }

  if (
    Number.isNaN(input.hoursWorked) ||
    input.hoursWorked <= 0
  ) {
    fieldErrors.hoursWorked =
      "Hours must be greater than 0.";
  }

  if (!input.shift) {
    fieldErrors.shift =
      "Shift is required.";
  }

  return fieldErrors;
}

function revalidateAdminData() {
  revalidatePath("/admin");
  revalidatePath("/admin/payroll");
}

export async function updateWorkEntry(
  input: UpdateWorkEntryInput
): Promise<WorkEntryActionResult> {
  const fieldErrors =
    validateWorkEntry(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message:
        "Please correct the highlighted fields.",
      fieldErrors,
      page: Math.max(input.currentPage, 1),
    };
  }

  try {
    const {
      data,
      error,
    } = await supabaseServer
      .from("work_entries")
      .update({
        worker_id: input.workerId,
        project_id: input.projectId,
        work_date: input.workDate,
        hours_worked: input.hoursWorked,
        shift: input.shift,
      })
      .eq("id", input.id)
      .select("id");

    if (error) {
      return {
        success: false,
        message: error.message,
        page: Math.max(input.currentPage, 1),
      };
    }

    if (!data || data.length !== 1) {
      return {
        success: false,
        message:
          "Work entry not found or update not permitted.",
        page: Math.max(input.currentPage, 1),
      };
    }

    const {
      count,
      error: countError,
    } = await supabaseServer
      .from("work_entries")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (countError) {
      return {
        success: false,
        message: countError.message,
        page: Math.max(input.currentPage, 1),
      };
    }

    revalidateAdminData();

    return {
      success: true,
      message:
        "Work entry updated successfully.",
      page: getValidPage(
        count,
        input.currentPage,
        input.pageSize
      ),
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message:
        "Unable to update the work entry.",
      page: Math.max(input.currentPage, 1),
    };
  }
}

export async function deleteWorkEntry(
  input: DeleteWorkEntryInput
): Promise<WorkEntryActionResult> {
  try {
    const {
      data,
      error,
    } = await supabaseServer
      .from("work_entries")
      .delete()
      .eq("id", input.id)
      .select("id");

    if (error) {
      return {
        success: false,
        message: error.message,
        page: Math.max(input.currentPage, 1),
      };
    }

    if (!data || data.length !== 1) {
      return {
        success: false,
        message:
          "Work entry not found or delete not permitted.",
        page: Math.max(input.currentPage, 1),
      };
    }

    const {
      count,
      error: countError,
    } = await supabaseServer
      .from("work_entries")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (countError) {
      return {
        success: false,
        message: countError.message,
        page: Math.max(input.currentPage, 1),
      };
    }

    revalidateAdminData();

    return {
      success: true,
      message:
        "Work entry deleted successfully.",
      page: getValidPage(
        count,
        input.currentPage,
        input.pageSize
      ),
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message:
        "Unable to delete the work entry.",
      page: Math.max(input.currentPage, 1),
    };
  }
}
