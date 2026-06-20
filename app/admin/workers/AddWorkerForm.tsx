"use client";

import { useState } from "react";

export default function AddWorkerForm() {
  const [name, setName] = useState("");
  const [dayRate, setDayRate] = useState("");
  const [nightRate, setNightRate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const res = await fetch("/api/workers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        dayRate: Number(dayRate),
        nightRate: Number(nightRate),
      }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.reload();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add worker");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow p-4 mb-6"
    >
      <h2 className="text-lg font-semibold mb-4">
        Add New Contractor
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          placeholder="Contractor Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded p-2"
          required
        />

        <input
          type="number"
          placeholder="Day Rate"
          value={dayRate}
          onChange={(e) => setDayRate(e.target.value)}
          className="border rounded p-2"
          required
        />

        <input
          type="number"
          placeholder="Night Rate"
          value={nightRate}
          onChange={(e) => setNightRate(e.target.value)}
          className="border rounded p-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Contractor"}
        </button>
      </div>
    </form>
  );
}