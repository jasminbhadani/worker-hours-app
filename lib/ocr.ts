import { getInvoiceSignedUrl } from "@/lib/expense-storage";
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

type OCRSpaceWord = {
  WordText?: string;
  Confidence?: number;
};

type OCRSpaceLine = {
  Words?: OCRSpaceWord[];
};

type OCRSpaceParsedResult = {
  ParsedText?: string;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  TextOverlay?: {
    Lines?: OCRSpaceLine[];
  };
};

type OCRSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string | string[];
  ParsedResults?: OCRSpaceParsedResult[];
};

function getErrorText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(" | ");
  }

  return value || null;
}

function getAverageConfidence(
  parsedResults: OCRSpaceParsedResult[] | undefined
) {
  const values =
    parsedResults?.flatMap((result) =>
      result.TextOverlay?.Lines?.flatMap((line) =>
        line.Words?.flatMap((word) =>
          typeof word.Confidence === "number"
            ? [word.Confidence]
            : []
        ) || []
      ) || []
    ) || [];

  if (values.length === 0) {
    return null;
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(2));
}

async function markExpenseOCRFailed(
  expenseId: string,
  reason: string,
  error?: unknown
) {
  console.error("[ocr] FAILED", {
    expenseId,
    reason,
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

function parseAmount(value: string) {
  const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeYear(value: string) {
  if (value.length === 4) {
    return value;
  }

  if (value.length === 2) {
    const numericYear = Number.parseInt(value, 10);

    if (Number.isNaN(numericYear)) {
      return null;
    }

    return `${numericYear >= 70 ? 19 : 20}${value}`;
  }

  return null;
}

function normalizeDate(value: string) {
  const cleaned = value.trim().replace(/[.,]/g, "/");
  const match = cleaned.match(
    /\b(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})\b/
  );

  if (!match) {
    return null;
  }

  let year: string | null = null;
  let month = "";
  let day = "";

  if (match[1].length === 4) {
    year = normalizeYear(match[1]);
    month = match[2];
    day = match[3];
  } else if (match[3].length === 4 || match[3].length === 2) {
    year = normalizeYear(match[3]);
    const first = Number.parseInt(match[1], 10);
    const second = Number.parseInt(match[2], 10);

    if (Number.isNaN(first) || Number.isNaN(second)) {
      return null;
    }

    if (first > 12 && second <= 12) {
      day = match[1];
      month = match[2];
    } else {
      month = match[1];
      day = match[2];
    }
  } else {
    return null;
  }

  if (!year) {
    return null;
  }

  const numericMonth = Number.parseInt(month, 10);
  const numericDay = Number.parseInt(day, 10);

  if (
    Number.isNaN(numericMonth) ||
    Number.isNaN(numericDay) ||
    numericMonth < 1 ||
    numericMonth > 12 ||
    numericDay < 1 ||
    numericDay > 31
  ) {
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

function extractAmountFromLine(line: string) {
  const matches = [...line.matchAll(/([$]?\s?-?[0-9][0-9,]*(?:\.\d{2})?)/g)];

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const value = parseAmount(matches[index][1]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function extractDateFromLines(lines: string[]) {
  for (const line of lines) {
    const match = line.match(
      /\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b/
    );

    if (!match) {
      continue;
    }

    const normalized = normalizeDate(match[0]);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function extractInvoiceNumber(text: string) {
  return extractFirstMatch(text, [
    /invoice\s*(?:number|no|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
    /inv\s*(?:number|no|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
    /receipt\s*(?:number|no|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
    /order\s*#\s*[:\-]?\s*([A-Z0-9\-\/]+)/i,
  ]);
}

function extractTotalAmount(lines: string[]) {
  const priorityPatterns = [
    /\bgrand\s+total\b/i,
    /\bamount\s+due\b/i,
    /(?:^|\b)total(?:\b|:)/i,
  ];

  for (const pattern of priorityPatterns) {
    for (const line of lines) {
      const lower = line.toLowerCase();

      if (!pattern.test(line)) {
        continue;
      }

      if (
        lower.includes("subtotal") ||
        lower.includes("sub total")
      ) {
        continue;
      }

      const amount = extractAmountFromLine(line);

      if (amount !== null) {
        return amount;
      }
    }
  }

  return null;
}

function extractTaxAmount(lines: string[]) {
  const taxPatterns = [
    /\bgst\b/i,
    /\bsales\s+tax\b/i,
    /\btax\b/i,
    /\bvat\b/i,
  ];

  for (const pattern of taxPatterns) {
    for (const line of lines) {
      if (!pattern.test(line)) {
        continue;
      }

      const amount = extractAmountFromLine(line);

      if (amount !== null) {
        return amount;
      }
    }
  }

  return null;
}

function isLikelyVendorLine(line: string) {
  const normalized = line.trim();
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return false;
  }

  if (normalized.length < 3) {
    return false;
  }

  if (/[0-9]{3,}/.test(normalized)) {
    return false;
  }

  if (
    /\b(gstin|invoice|receipt|date|tax|total|subtotal|amount due|grand total|phone|tel|mobile|address|cash|card|balance|order)\b/i.test(
      lower
    )
  ) {
    return false;
  }

  if (/^\+?[0-9()\-\s]+$/.test(normalized)) {
    return false;
  }

  return /^[A-Z0-9&.,'()\-\/ ]+$/i.test(normalized);
}

function extractVendorName(lines: string[]) {
  for (const line of lines) {
    if (isLikelyVendorLine(line)) {
      return line;
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

  const invoiceNumber = extractInvoiceNumber(text);
  const invoiceDate = extractDateFromLines(lines);
  const totalAmount = extractTotalAmount(lines);
  const taxAmount = extractTaxAmount(lines);
  const vendorName = extractVendorName(lines);

  return {
    vendor_name: vendorName,
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    amount: totalAmount,
    tax_amount: taxAmount,
  };
}

export async function extractInvoiceText({
  expenseId,
  storagePath,
  mimeType,
}: {
  expenseId: string;
  storagePath: string | null | undefined;
  mimeType: string | null | undefined;
}): Promise<OCRExtractionResult> {
  if (!storagePath) {
    console.error("[ocr] FAILED", {
      expenseId,
      reason: "Missing storage path",
    });
    return {
      text: null,
      confidence: null,
      status: "failed",
    };
  }

  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    console.error("[ocr] FAILED", {
      expenseId,
      reason: "OCR_SPACE_API_KEY is missing",
    });
    return {
      text: null,
      confidence: null,
      status: "failed",
    };
  }

  try {
    console.log("[ocr] START", {
      expenseId,
      storagePath,
      mimeType,
    });

    const signedUrl = await getInvoiceSignedUrl(storagePath);

    if (!signedUrl) {
      console.error("[ocr] FAILED", {
        expenseId,
        reason: "Signed URL could not be created",
      });
      return {
        text: null,
        confidence: null,
        status: "failed",
      };
    }

    console.log("[ocr] SIGNED URL CREATED", {
      expenseId,
      hasUrl: true,
    });

    const payloadFields = {
      url: signedUrl,
      language: "eng",
      isOverlayRequired: "true",
      OCREngine: "2",
      scale: "true",
      isTable: "false",
      filetype:
        mimeType === "application/pdf" ? "PDF" : "JPG",
    };

    const body = new FormData();

    for (const [key, value] of Object.entries(payloadFields)) {
      body.append(key, value);
    }

    const endpoint = "https://api.ocr.space/parse/image";

    console.log("[ocr] OCR API REQUEST", {
      expenseId,
      endpoint,
      method: "POST",
      mimeType,
      payloadFormat: "multipart/form-data",
      payload: payloadFields,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: apiKey,
      },
      body,
      cache: "no-store",
    });

    const responseHeaders = Object.fromEntries(
      response.headers.entries()
    );
    const rawBody = await response.text();

    console.log("[ocr] RAW OCR RESPONSE", {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: rawBody.slice(0, 1000),
    });

    const contentType =
      response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("application/json")) {
      console.error("[ocr] FAILED", {
        expenseId,
        reason: "OCR.Space returned a non-JSON or non-OK response",
        endpoint,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        rawBody: rawBody.slice(0, 1000),
      });
      return {
        text: null,
        confidence: null,
        status: "failed",
      };
    }

    let payload: OCRSpaceResponse;

    try {
      payload = JSON.parse(rawBody) as OCRSpaceResponse;
    } catch (error) {
      console.error("[ocr] FAILED", {
        expenseId,
        reason: "OCR.Space JSON parsing failed",
        endpoint,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        rawBody: rawBody.slice(0, 1000),
        error,
      });
      return {
        text: null,
        confidence: null,
        status: "failed",
      };
    }

    console.log("[ocr] OCR API RESPONSE", {
      expenseId,
      ok: response.ok,
      errored: payload.IsErroredOnProcessing,
      parsedCount: payload.ParsedResults?.length || 0,
    });

    const responseError =
      getErrorText(payload.ErrorMessage) ||
      getErrorText(payload.ErrorDetails);

    const parsedResultError = payload.ParsedResults
      ?.map((result) =>
        [
          getErrorText(result.ErrorMessage),
          result.ErrorDetails || null,
        ]
          .filter(Boolean)
          .join(" | ")
      )
      .filter(Boolean)
      .join(" | ");

    if (
      !response.ok ||
      payload.IsErroredOnProcessing ||
      responseError ||
      parsedResultError
    ) {
      console.error("[ocr] FAILED", {
        expenseId,
        reason:
          responseError ||
          parsedResultError ||
          `OCR.Space request failed with status ${response.status}`,
      });
      return {
        text: null,
        confidence: null,
        status: "failed",
      };
    }

    const text = payload.ParsedResults
      ?.map((result) => result.ParsedText?.trim() || "")
      .filter(Boolean)
      .join("\n\n")
      .trim() || null;

    const confidence = getAverageConfidence(
      payload.ParsedResults
    );

    console.log("[ocr] OCR TEXT EXTRACTED", {
      expenseId,
      textLength: text?.length || 0,
      confidence,
    });

    return {
      text,
      confidence,
      status: text ? "completed" : "failed",
    };
  } catch (error) {
    console.error("[ocr] FAILED", {
      expenseId,
      reason: "OCR extraction request threw",
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
    console.log("[ocr] START", { expenseId });

    const { error: processingError } = await supabaseServer
      .from("expenses")
      .update({
        ocr_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    if (processingError) {
      throw processingError;
    }

    const { data: expense, error } = await supabaseServer
      .from("expenses")
      .select("id, storage_path, mime_type, file_name")
      .eq("id", expenseId)
      .single();

    if (error || !expense) {
      await markExpenseOCRFailed(
        expenseId,
        "Expense could not be loaded",
        error
      );
      return;
    }

    console.log("[ocr] EXPENSE LOADED", {
      expenseId,
      storagePath: expense.storage_path,
      mimeType: expense.mime_type,
      fileName: expense.file_name,
    });

    const extraction = await extractInvoiceText({
      expenseId,
      storagePath: expense.storage_path,
      mimeType: expense.mime_type,
    });

    if (extraction.status === "failed") {
      await markExpenseOCRFailed(
        expenseId,
        "OCR extraction failed"
      );
      return;
    }

    const parsed = parseInvoiceFields(extraction.text);

    console.log("[ocr] PARSED RESULT", {
      expenseId,
      parsed,
    });

    const { error: saveError } = await supabaseServer
      .from("expenses")
      .update({
        vendor_name: parsed.vendor_name,
        invoice_number: parsed.invoice_number,
        invoice_date: parsed.invoice_date,
        ocr_text: extraction.text,
        ocr_confidence: extraction.confidence,
        ocr_status: extraction.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId);

    if (saveError) {
      throw saveError;
    }

    console.log("[ocr] SAVE COMPLETE", {
      expenseId,
      status: extraction.status,
    });
  } catch (error) {
    await markExpenseOCRFailed(
      expenseId,
      "Unexpected OCR pipeline error",
      error
    );
  }
}
