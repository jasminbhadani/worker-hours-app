"use client";
import UploadForm from "./UploadForm";

type WorkerOption = {
  id: string;
  name: string;
};

type ProjectOption = {
  id: string;
  name: string;
};

export default function ClientUploadWrapper({
  workers,
  projects,
}: {
  workers: WorkerOption[];
  projects: ProjectOption[];
}) {
  return <UploadForm workers={workers} projects={projects} />;
}
