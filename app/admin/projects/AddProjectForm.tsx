"use client";

import { useState } from "react";

export default function AddProjectForm() {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        active: true,
      }),
    });

    if (res.ok) {
      setName("");
      window.location.reload();
    } else {
      alert("Failed to add project");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 mb-6"
    >
      <input
        type="text"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded-lg px-3 py-2 w-72"
        required
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Add Project
      </button>
    </form>
  );
}