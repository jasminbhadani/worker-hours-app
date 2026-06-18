"use client";

export default function ExportButton({
  entries,
}: {
  entries: any[];
}) {
  const downloadCSV = () => {
    const headers = [
      "Worker",
      "Job Site",
      "Date",
      "Hours",
      "Shift",
    ];

    const rows = entries.map((entry) => [
      entry.workers?.name || "",
      entry.projects?.name || "",
      new Date(entry.work_date).toLocaleDateString(
        "en-US",
        {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }
      ),
      entry.hours_worked,
      entry.shift,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `work-entries-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    link.click();
  };

  return (
    <button
      onClick={downloadCSV}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Export CSV
    </button>
  );
}
