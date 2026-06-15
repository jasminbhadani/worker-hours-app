"use client";

export default function PayrollExportButton({
  payroll,
}: {
  payroll: any[];
}) {
  const downloadCSV = () => {
    const headers = [
      "Worker",
      "Day Hours",
      "Day Rate",
      "Night Hours",
      "Night Rate",
      "Total Hours",
      "Amount",
    ];

    const rows = payroll.map((row) => [
      row.name,
      row.dayHours.toFixed(2),
      row.dayRate.toFixed(2),
      row.nightHours.toFixed(2),
      row.nightRate.toFixed(2),
      row.totalHours.toFixed(2),
      row.amount.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `payroll-${
      new Date()
        .toISOString()
        .split("T")[0]
    }.csv`;

    link.click();
  };

  return (
    <button
      onClick={downloadCSV}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Export Payroll CSV
    </button>
  );
}