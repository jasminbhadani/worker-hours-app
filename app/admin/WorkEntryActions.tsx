"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  deleteWorkEntry,
  updateWorkEntry,
  type WorkEntryActionResult,
} from "./work-entry-actions";

type Option = {
  id: string;
  name: string;
  active?: boolean;
};

type WorkEntry = {
  id: string;
  worker_id: string;
  project_id: string;
  work_date: string;
  hours_worked: number;
  shift: string;
};

type FormValues = {
  workerId: string;
  projectId: string;
  workDate: string;
  hoursWorked: string;
  shift: string;
};

type FieldErrors = Partial<
  Record<keyof FormValues, string>
>;

const PAGE_SIZE = 10;

function getInitialValues(
  entry: WorkEntry
): FormValues {
  return {
    workerId: entry.worker_id,
    projectId: entry.project_id,
    workDate: entry.work_date,
    hoursWorked: String(entry.hours_worked),
    shift: entry.shift,
  };
}

export default function WorkEntryActions({
  entry,
  workers,
  projects,
  currentPage,
  search,
  project,
  from,
  to,
}: {
  entry: WorkEntry;
  workers: Option[];
  projects: Option[];
  currentPage: number;
  search: string;
  project: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isEditOpen, setIsEditOpen] =
    useState(false);
  const [isDeleteOpen, setIsDeleteOpen] =
    useState(false);
  const [serverError, setServerError] =
    useState("");
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});
  const [formValues, setFormValues] = useState(
    getInitialValues(entry)
  );

  const [isPending, startTransition] =
    useTransition();

  function resetForm() {
    setFormValues(getInitialValues(entry));
    setFieldErrors({});
    setServerError("");
  }

  function buildUrl(
    result: WorkEntryActionResult
  ) {
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (project) {
      params.set("project", project);
    }

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    if ((result.page || 1) > 1) {
      params.set(
        "page",
        String(result.page)
      );
    }

    params.set(
      "status",
      result.success ? "success" : "error"
    );
    params.set("message", result.message);

    const query = params.toString();

    return query
      ? `${pathname}?${query}`
      : pathname;
  }

  function validateForm() {
    const nextErrors: FieldErrors = {};
    const hours = Number(formValues.hoursWorked);

    if (!formValues.workerId) {
      nextErrors.workerId =
        "Worker is required.";
    }

    if (!formValues.projectId) {
      nextErrors.projectId =
        "Project is required.";
    }

    if (!formValues.workDate) {
      nextErrors.workDate =
        "Date is required.";
    }

    if (
      Number.isNaN(hours) ||
      hours <= 0
    ) {
      nextErrors.hoursWorked =
        "Hours must be greater than 0.";
    }

    if (!formValues.shift) {
      nextErrors.shift =
        "Shift is required.";
    }

    setFieldErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleFieldChange(
    field: keyof FormValues,
    value: string
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
    setServerError("");
  }

  function handleActionResult(
    result: WorkEntryActionResult
  ) {
    if (!result.success) {
      setServerError(result.message);
      setFieldErrors(
        result.fieldErrors || {}
      );

      return;
    }

    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setServerError("");

    router.replace(buildUrl(result));
    router.refresh();
  }

  function handleEditSave() {
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = await updateWorkEntry({
        id: entry.id,
        workerId: formValues.workerId,
        projectId: formValues.projectId,
        workDate: formValues.workDate,
        hoursWorked: Number(
          formValues.hoursWorked
        ),
        shift: formValues.shift,
        currentPage,
        pageSize: PAGE_SIZE,
      });

      handleActionResult(result);
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const result = await deleteWorkEntry({
        id: entry.id,
        currentPage,
        pageSize: PAGE_SIZE,
      });

      handleActionResult(result);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsEditOpen(true);
          }}
          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => {
            setServerError("");
            setIsDeleteOpen(true);
          }}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">
              Edit Work Entry
            </h2>

            <p className="mb-4 text-sm text-slate-500">
              Update the worker, project, date,
              shift, or hours for this entry.
            </p>

            {serverError && (
              <div className="mb-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium">
                  Worker
                </label>

                <select
                  value={formValues.workerId}
                  onChange={(event) =>
                    handleFieldChange(
                      "workerId",
                      event.target.value
                    )
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="">
                    Select worker
                  </option>

                  {workers.map((worker) => (
                    <option
                      key={worker.id}
                      value={worker.id}
                    >
                      {worker.active === false
                        ? `${worker.name} (Inactive)`
                        : worker.name}
                    </option>
                  ))}
                </select>

                {fieldErrors.workerId && (
                  <p className="mt-1 text-sm text-red-500">
                    {fieldErrors.workerId}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Project
                </label>

                <select
                  value={formValues.projectId}
                  onChange={(event) =>
                    handleFieldChange(
                      "projectId",
                      event.target.value
                    )
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="">
                    Select project
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.active === false
                        ? `${project.name} (Inactive)`
                        : project.name}
                    </option>
                  ))}
                </select>

                {fieldErrors.projectId && (
                  <p className="mt-1 text-sm text-red-500">
                    {fieldErrors.projectId}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Date
                </label>

                <input
                  type="date"
                  value={formValues.workDate}
                  onChange={(event) =>
                    handleFieldChange(
                      "workDate",
                      event.target.value
                    )
                  }
                  className="w-full rounded border p-2"
                />

                {fieldErrors.workDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {fieldErrors.workDate}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Shift
                </label>

                <select
                  value={formValues.shift}
                  onChange={(event) =>
                    handleFieldChange(
                      "shift",
                      event.target.value
                    )
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="">
                    Select shift
                  </option>
                  <option value="Day">
                    Day
                  </option>
                  <option value="Night">
                    Night
                  </option>
                </select>

                {fieldErrors.shift && (
                  <p className="mt-1 text-sm text-red-500">
                    {fieldErrors.shift}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-medium">
                  Hours
                </label>

                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={formValues.hoursWorked}
                  onChange={(event) =>
                    handleFieldChange(
                      "hoursWorked",
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "e" ||
                      event.key === "E" ||
                      event.key === "+" ||
                      event.key === "-"
                    ) {
                      event.preventDefault();
                    }
                  }}
                  className="w-full rounded border p-2"
                />

                {fieldErrors.hoursWorked && (
                  <p className="mt-1 text-sm text-red-500">
                    {fieldErrors.hoursWorked}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  resetForm();
                }}
                className="rounded border px-3 py-2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleEditSave}
                disabled={isPending}
                className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-800">
              Delete Work Entry
            </h2>

            <p className="mt-3 text-slate-600">
              Are you sure you want to delete
              this work entry?
            </p>

            {serverError && (
              <div className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setServerError("");
                }}
                className="rounded border px-3 py-2"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
