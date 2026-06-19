import { supabaseServer } from "@/lib/supabase-server";

const EXPENSE_BUCKET = "expense-invoices";
const SIGNED_URL_TTL_SECONDS = 3600;

function normalizeStoragePath(path: string | null | undefined) {
  return path?.trim().replace(/^\/+/, "") || null;
}

export function getExpenseBucketName() {
  return EXPENSE_BUCKET;
}

export function getNormalizedStoragePath(path: string | null | undefined) {
  return normalizeStoragePath(path);
}

export async function getInvoiceSignedUrl(
  path: string | null | undefined
) {
  const normalizedPath = normalizeStoragePath(path);

  if (!normalizedPath) {
    console.warn("[expense-storage] Missing storage path for preview");
    return null;
  }

  const listResult = await supabaseServer.storage
  .from(EXPENSE_BUCKET)
  .list("2026/06");

  console.log(
    "LIST RESULT:",
    JSON.stringify(listResult, null, 2)
  );
  
  const { data, error } = await supabaseServer.storage
    .from(EXPENSE_BUCKET)
    .createSignedUrl(normalizedPath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[expense-storage] Failed to create preview URL", {
      bucket: EXPENSE_BUCKET,
      path: normalizedPath,
      message: error.message,
    });
    return null;
  }

  return data.signedUrl;
}

export async function getInvoiceDownloadUrl(
  path: string | null | undefined,
  fileName?: string | null
) {
  const normalizedPath = normalizeStoragePath(path);

  if (!normalizedPath) {
    console.warn("[expense-storage] Missing storage path for download");
    return null;
  }

  const { data, error } = await supabaseServer.storage
    .from(EXPENSE_BUCKET)
    .createSignedUrl(normalizedPath, SIGNED_URL_TTL_SECONDS, {
      download: fileName || true,
    });

  if (error) {
    console.error("[expense-storage] Failed to create download URL", {
      bucket: EXPENSE_BUCKET,
      path: normalizedPath,
      message: error.message,
    });
    return null;
  }

  return data.signedUrl;
}
