"use client";
import UploadForm from './UploadForm';

export default function ClientUploadWrapper({ workers, projects }: any) {
  return <UploadForm workers={workers} projects={projects} />;
}
