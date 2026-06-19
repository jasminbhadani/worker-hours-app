"use client";

import React, { useRef, useState, useCallback } from "react";

type Worker = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

interface UploadFormProps {
  workers: Worker[];
  projects: Project[];
}

export default function UploadForm({
  workers = [],
  projects = [],
}: UploadFormProps) {
  const [workerId, setWorkerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("Material");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (selectedFile: File | null) => {
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setError("File size cannot exceed 10 MB.");
      return;
    }

    const allowed =
      selectedFile.type.startsWith("image/") ||
      selectedFile.type === "application/pdf";

    if (!allowed) {
      setError("Only JPG, PNG, WEBP and PDF files are allowed.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    console.log("FORM SUBMIT STARTED");

    setError("");

    if (!workerId) {
      setError("Please select a worker.");
      return;
    }

    if (!projectId) {
      setError("Please select a project.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (!file) {
      setError("Please upload an invoice.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("invoice_file", file);
      formData.append("worker_id", workerId);
      formData.append("project_id", projectId);
      formData.append("category", category);
      formData.append("notes", notes);

      console.log("Sending upload request...");

      const response = await fetch("/api/expenses/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      console.log("Response status:", response.status);
      console.log("Response body:", result);

      if (!response.ok) {
        throw new Error(
          result?.details ||
            result?.error ||
            "Upload failed"
        );
      }

      window.location.href =
        result?.redirect || "/expense-upload/success";
    } catch (err) {
      console.error("Upload Error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Worker */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Worker
        </label>

        <select
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        >
          <option value="">Select Worker</option>

          {workers.map((worker) => (
            <option
              key={worker.id}
              value={worker.id}
            >
              {worker.name}
            </option>
          ))}
        </select>
      </div>

      {/* Project */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Project
        </label>

        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        >
          <option value="">Select Project</option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Category
        </label>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        >
          <option value="Material">Material</option>
          <option value="Tools">Tools</option>
          <option value="Fuel">Fuel</option>
          <option value="Misc">Misc</option>
        </select>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center"
      >
        <div className="mb-3 text-5xl">📷</div>

        <h3 className="font-semibold">
          Upload Invoice
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          JPG, PNG, WEBP, PDF
          <br />
          Maximum 10 MB
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 rounded-lg border px-4 py-2"
        >
          Choose File / Take Photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          className="hidden"
          onChange={(e) =>
            handleFileSelect(
              e.target.files?.[0] ?? null
            )
          }
        />
      </div>

      {file && (
        <div className="rounded-lg border p-4">
          <div className="font-medium">
            {file.name}
          </div>

          <div className="text-sm text-slate-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Notes
        </label>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-lg border p-3"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
      >
        {uploading
          ? "Uploading..."
          : "Submit Invoice"}
      </button>
    </form>
  );
}