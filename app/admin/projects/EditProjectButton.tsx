"use client";

import { useState } from "react";

export default function EditProjectButton({
  project,
}: {
  project: any;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [active, setActive] = useState(project.active);

  async function handleSave() {
    const res = await fetch(
      `/api/projects/${project.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          active,
        }),
      }
    );

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
        className="bg-yellow-500 text-white px-3 py-1 rounded"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="text-xl font-bold mb-4">
              Edit Project
            </h2>

            <input
              className="border w-full p-2 rounded mb-4"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) =>
                  setActive(e.target.checked)
                }
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="border px-3 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-3 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}