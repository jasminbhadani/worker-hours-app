"use client";

import { useState } from "react";

export default function EditWorkerButton({
  worker,
}: {
  worker: any;
}) {
  const [open, setOpen] = useState(false);

  const [dayRate, setDayRate] = useState(
    worker.day_rate
  );

  const [nightRate, setNightRate] = useState(
    worker.night_rate
  );

  const [active, setActive] = useState(
    worker.active
  );

  const [loading, setLoading] =
    useState(false);

  async function handleSave() {
    setLoading(true);

    const res = await fetch(
      `/api/workers/${worker.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          dayRate,
          nightRate,
          active,
        }),
      }
    );

    setLoading(false);

    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.error || "Update failed");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-xl font-bold">
            Edit Worker
            </h2>

            <p className="text-sm text-slate-500 mb-4">
            Worker:{" "}
            <span className="font-semibold text-slate-700">
                {worker.name}
            </span>
            </p>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Day Rate
              </label>

              <input
                type="number"
                value={dayRate}
                onChange={(e) =>
                  setDayRate(
                    Number(e.target.value)
                  )
                }
                className="border w-full p-2 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                Night Rate
              </label>

              <input
                type="number"
                value={nightRate}
                onChange={(e) =>
                  setNightRate(
                    Number(e.target.value)
                  )
                }
                className="border w-full p-2 rounded"
              />
            </div>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) =>
                  setActive(
                    e.target.checked
                  )
                }
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setOpen(false)
                }
                className="border px-3 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
              >
                {loading
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}