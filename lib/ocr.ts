import { getInvoiceDownloadUrl } from "@/lib/expense-storage";
import { supabaseServer } from "@/lib/supabase-server";

type OCRStatus = "pending" | "processing" | "completed" | "failed";

type OCRExtractionResult = {
  text: string | null;
  confidence: number | null;
  status: OCRStatus;
};

type ParsedInvoiceFields = {
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: number | null;
  tax_amount: number | null;
};

function parseAmount(value: string) {
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDate(value: string) {
  const cleaned = value.trim().replace(/[.,]/g, "/");
  const match = cleaned.match(
    /\b(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})\b/
  );

  if (!match) {
    return null;
  }

  let year = "";
  let month = "";
  let day = "";

  if (match[1].length === 4) {
    year = match[1];
    month = match[2];
    day = match[3];
  } else if (match[3].length === 4) {
    year = match[3];
    month = match[1];
    day = match[2];
  } else {
    return null;
  }

  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : iso;
}

function extractFirstMatch(
  text: string,
  patterns: RegExp[]
) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

export function parseInvoiceFields(
  text: string | null | undefined
): ParsedInvoiceFields {
  if (!text) {
    return {
      vendor_name: null,
      invoice_number: null,
      invoice_date: null,
      amount: null,
      tax_amount: null,
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const invoiceNumber = extractFirstMatch(text, [
    /invoice\s*(?:number|no|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
    /inv\s*(?:number|no|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  ]);

  const invoiceDateValue = extractFirstMatch(text, [
    /invoice\s*date\s*[:\-]?\s*([0-9./-]+)/i,
    /date\s*[:\-]?\s*([0-9./-]+)/i,
  ]);

  const totalAmountValue = extractFirstMatch(text, [
    /total\s*amount\s*[:\-]?\s*([$]?\s?[0-9,]+(?:\.\d{2})?)/i,
    /grand\s*total\s*[:\-]?\s*([$]?\s?[0-9,]+(?:\.\d{2})?)/i,
    /amount\s*due\s*[:\-]?\s*([$]?\s?[0-9,]+(?:\.\d{2})?)/i,
  ]);

  const taxAmountValue = extractFirstMatch(text, [
    /tax\s*amount\s*[:\-]?\s*([$]?\s?[0-9,]+(?:\.\d{2})?)/i,
    /(?:gst|vat|sales tax)\s*[:\-]?\s*([$]?\s?[0-9,]+(?:\.\d{2})?)/i,
  ]);

  const vendorCandidates = lines.filter((line) => {
    const lower = line.toLowerCase();

    if (lower.includes("invoice")) {
      return false;
    }

    if (/[0-9]{2,}/.test(line)) {
      return false;
    }

    return /^[a-z0-9&.,'()\- ]+$/i.test(line);
  });

  return {
    vendor_name: vendorCandidates[0] || null,
    invoice_number: invoiceNumber,
    invoice_date: normalizeDate(invoiceDateValue || ""),
    amount: totalAmountValue ? parseAmount(totalAmountValue) : null,
    tax_amount: taxAmountValue ? parseAmount(taxAmountValue) : null,
  };
}

export async function extractInvoiceText({
  expenseId,
  storagePath,
  mimeType,
  fileName,
}: {
  expenseId: string;
  storagePath: string | null | undefined;
  mimeType: string | null | undefined;
  fileName?: string | null;
}): Promise<OCRExtractionResult> {
  if (!storagePath) {
    console.error("[ocr] Missing storage path", { expenseId });
    return {
      text: null,
      confidence: null,
      status: "failed",
    };
  }

  if (mimeType === "application/pdf") {
    console.warn("[ocr] PDF OCR is not supported in the current pipeline", {
      expenseId,
      storagePath,
    });
    return {
      text: null,
      confidence: null,
      status: "failed",
    };
  }

  try {
    console.log("[ocr] START EXTRACT", {
      expenseId,
      storagePath,
      mimeType,
      fileName,
    });

    const signedUrl = await getInvoiceDownloadUrl(
      storagePath,
      fileName
    );

    console.log("[ocr] SIGNED URL RESULT", {
      hasUrl: !!signedUrl,
      signedUrl,
    });

    if (!signedUrl) {
      return {
        text: null,
        confidence: null,
        status: "failed",
      };
    }

    console.log("[ocr] LOADING TESSERACT");

    const Tesseract = await import("tesseract.js");

    console.log("[ocr] TESSERACT LOADED");

    console.log("[ocr] STARTING RECOGNIZE");

    const result = await Tesseract.recognize(
      signedUrl,
      "eng"
    );

    console.log("[ocr] RECOGNIZE COMPLETE");
    const text = result.data.text?.trim() || null;
    console.log("[ocr] OCR RESULT", {
      confidence: result.data.confidence,
      textLength: text?.length || 0,
      first200Chars: text?.substring(0, 200),
    });
    const confidence = Number.isFinite(result.data.confidence)
      ? Number(result.data.confidence.toFixed(2))
      : null;

    return {
      text,
      confidence,
      status: text ? "completed" : "failed",
    };
  } catch (error) {
    console.error("[ocr] OCR extraction failed", {
      expenseId,
      storagePath,
      error,
    });
    return {
      text: null,
      confidence: null,
      status: "failed",
    };
  }
}

export async function runExpenseOCR(expenseId: string) {
  try {
    await supabaseServer
      .from("expenses")
      .update({
        ocr_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    const { data: expense, error } = await supabaseServer
      .from("expenses")
      .select("id, storage_path, mime_type, file_name")
      .eq("id", expenseId)
      .single();
    
    console.log("[ocr] EXPENSE QUERY RESULT", {
      error,
      expense,
    });
    if (error || !expense) {
      console.error("[ocr] Failed to load expense for OCR", {
        expenseId,
        error,
      });
      return;
    }
    console.log("[ocr] CALLING extractInvoiceText");
    const extraction = await extractInvoiceText({
      expenseId,
      storagePath: expense.storage_path,
      mimeType: expense.mime_type,
      fileName: expense.file_name,
    });
    console.log("[ocr] EXTRACTION RESULT", extraction);
    const parsed = parseInvoiceFields(extraction.text);
    console.log("[ocr] PARSED RESULT", parsed);
    console.log("[ocr] SAVING OCR RESULTS");
    await supabaseServer
      .from("expenses")
      .update({
        vendor_name: parsed.vendor_name,
        invoice_number: parsed.invoice_number,
        invoice_date: parsed.invoice_date,
        amount: parsed.amount,
        tax_amount: parsed.tax_amount,
        ocr_text: extraction.text,
        ocr_confidence: extraction.confidence,
        ocr_status: extraction.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);
  } catch (error) {
    console.error("[ocr] Unexpected OCR pipeline error", {
      expenseId,
      error,
    });

    await supabaseServer
      .from("expenses")
      .update({
        ocr_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);
  }
}
