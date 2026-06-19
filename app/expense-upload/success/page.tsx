export default function ExpenseUploadSuccess() {
  return (
    <div className="min-h-screen p-8 bg-slate-100">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold mb-2">Invoice uploaded successfully</h1>
        <p className="text-slate-600 mb-4">Thank you — the invoice was received and will be reviewed by the admin team.</p>
        <a href="/expense-upload" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">Upload Another Invoice</a>
      </div>
    </div>
  );
}
