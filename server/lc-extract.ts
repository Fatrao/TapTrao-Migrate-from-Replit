import { readFileSync, unlinkSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";

// ── Types ──

export type FieldConfidence = "high" | "medium" | "low";

export type ExtractedField = {
  value: string | number | boolean;
  confidence: FieldConfidence;
  sourceSnippet?: string;
};

export type ExtractionResult = {
  fields: Record<string, ExtractedField> | null;
  overallConfidence: FieldConfidence | null;
  warnings: string[];
  rawText: string | null;
  error: string | null;
};

// ── PDF Text Extraction ──

export async function extractTextFromPdf(filePath: string): Promise<string> {
  // pdf-parse has no default export in all module systems; handle both
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default ?? mod;
  const buffer = readFileSync(filePath);
  const data = await (pdfParse as any)(buffer);
  return (data.text ?? "").trim();
}

// ── PDF → Images (for scanned docs) ──

export async function pdfToImages(filePath: string): Promise<Buffer[]> {
  const { pdf } = await import("pdf-to-img");
  const images: Buffer[] = [];
  const document = await pdf(filePath, { scale: 2 });
  for await (const page of document) {
    images.push(Buffer.from(page));
  }
  return images;
}

// ── Field Schemas for Prompts ──

const LC_TERMS_FIELDS: Record<string, string> = {
  beneficiaryName: "The seller/exporter/beneficiary name exactly as printed on the LC",
  applicantName: "The buyer/importer/applicant name exactly as printed",
  goodsDescription: "Full goods description including crop year, grade, or quality if present",
  hsCode: "HS/tariff code (format: XXXX.XX or XXXXXX)",
  quantity: "Numeric quantity value only (no unit). Return as a number.",
  quantityUnit: "Unit of measurement. MUST be one of: kg, MT, bags, pieces, cartons, drums, litres, CBM",
  unitPrice: "Price per unit, numeric only (no currency symbols). Return as a number.",
  currency: "3-letter currency code. MUST be one of: USD, EUR, GBP, CNY, AED, TRY, XOF, ZAR, GHS, NGN, KES",
  totalAmount: "Total LC amount, numeric only (no currency symbols). Return as a number.",
  countryOfOrigin: "Country of origin, full name",
  portOfLoading: "Port of loading/shipment",
  portOfDischarge: "Port of discharge/destination",
  latestShipmentDate: "Latest date for shipment. Convert to YYYY-MM-DD format.",
  lcExpiryDate: "LC expiry date. Convert to YYYY-MM-DD format.",
  incoterms: "Incoterms. MUST be one of: FOB, CIF, CFR, FCA, EXW, DDP, DAP, CPT, CIP, FAS",
  partialShipmentsAllowed: "true if partial shipments are allowed/permitted, false if prohibited/not allowed. Return boolean.",
  transhipmentAllowed: "true if transhipment is allowed/permitted, false if prohibited/not allowed. Return boolean.",
  lcReference: "The LC reference number/document number as printed on the document",
  issuingBank: "The name of the issuing bank (the bank that opened/issued the LC). Often found in the letterhead, header, or confirmation section.",
  advisingBank: "The name of the advising or confirming bank, if present",
  issuingBankSwift: "SWIFT/BIC code of the issuing bank (format: 8 or 11 alphanumeric characters)",
  advisingBankSwift: "SWIFT/BIC code of the advising/confirming bank, if present",
};

const DOC_FIELDS: Record<string, Record<string, string>> = {
  commercial_invoice: {
    beneficiaryName: "Beneficiary/seller name",
    goodsDescription: "Goods description",
    quantity: "Quantity (numeric)",
    unitPrice: "Unit price (numeric)",
    totalAmount: "Total amount (numeric)",
    currency: "Currency code (3-letter)",
    incoterms: "Incoterms (FOB, CIF, etc.)",
    chedReference: "CHED reference number if present (format: GBCHDYYYY.NNNNNNN)",
  },
  bill_of_lading: {
    shipperName: "Shipper/exporter name",
    consignee: "Consignee name",
    portOfLoading: "Port of loading",
    portOfDischarge: "Port of discharge",
    shippedOnBoardDate: "Shipped on board date (YYYY-MM-DD)",
    vesselName: "Vessel name",
    blNumber: "Bill of Lading number",
    quantity: "Quantity description",
    chedReference: "CHED reference number if present",
  },
  certificate_of_origin: {
    exporterName: "Exporter name",
    originCountry: "Country of origin",
    goodsDescription: "Goods description",
    languageOfDocument: "Language the document is written in",
    chedReference: "CHED reference number if present",
  },
  phytosanitary_certificate: {
    exporterName: "Exporter name",
    originCountry: "Country of origin",
    commodityDescription: "Commodity/product description",
    chedReference: "CHED reference number if present",
  },
  packing_list: {
    quantity: "Total quantity",
    grossWeight: "Gross weight with unit",
    netWeight: "Net weight with unit",
    numberOfPackages: "Number of packages/cartons",
    chedReference: "CHED reference number if present",
  },
};

// ── Claude Extraction ──

function buildExtractionPrompt(fields: Record<string, string>, documentLabel: string): string {
  const fieldList = Object.entries(fields)
    .map(([key, desc]) => `- ${key}: ${desc}`)
    .join("\n");

  return `You are a trade finance document specialist. Extract the following fields from this ${documentLabel}.

For each field you find, provide:
- "value": the extracted value. Use exact text from the document for names and descriptions. Convert dates to YYYY-MM-DD. Convert numbers to plain numeric values (no currency symbols, no commas). Convert booleans to true/false.
- "confidence": "high" if the value is clearly and unambiguously stated, "medium" if inferred from context or formatting, "low" if uncertain or partially readable.
- "sourceSnippet": the exact text fragment (max 60 chars) from the document that you extracted the value from.

If a field is NOT found in the document, OMIT it entirely from the output.

Fields to extract:
${fieldList}

Respond with ONLY valid JSON. No markdown, no backticks, no explanation. Schema:
{
  "fields": {
    "<fieldName>": { "value": <extracted_value>, "confidence": "high"|"medium"|"low", "sourceSnippet": "..." }
  },
  "overallConfidence": "high"|"medium"|"low",
  "warnings": ["any issues, ambiguities, or notable observations about the document"]
}`;
}

export async function extractFields(
  text: string | null,
  images: Buffer[] | null,
  documentType: string,
): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      fields: null,
      overallConfidence: null,
      warnings: [],
      rawText: text,
      error: "AI extraction not configured. Set ANTHROPIC_API_KEY to enable.",
    };
  }

  const isLcTerms = documentType === "lc_terms";
  const fieldSchema = isLcTerms ? LC_TERMS_FIELDS : (DOC_FIELDS[documentType] ?? DOC_FIELDS.commercial_invoice);
  const docLabel = isLcTerms ? "Letter of Credit" : documentType.replace(/_/g, " ");
  const systemPrompt = buildExtractionPrompt(fieldSchema, docLabel);

  const client = new Anthropic({ apiKey });

  // Build message content: either text or images
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  if (images && images.length > 0) {
    // Vision mode for scanned PDFs
    for (const img of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: img.toString("base64"),
        },
      });
    }
    content.push({
      type: "text",
      text: "Extract the fields from the document shown in the image(s) above.",
    });
  } else if (text) {
    content.push({
      type: "text",
      text: `DOCUMENT TEXT:\n---\n${text.slice(0, 15000)}\n---\n\nExtract the fields from the document text above.`,
    });
  } else {
    return {
      fields: null,
      overallConfidence: null,
      warnings: [],
      rawText: null,
      error: "No text or images could be extracted from the document.",
    };
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      return {
        fields: null,
        overallConfidence: null,
        warnings: [],
        rawText: text,
        error: "Unexpected response format from AI.",
      };
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = block.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    return {
      fields: parsed.fields ?? null,
      overallConfidence: parsed.overallConfidence ?? null,
      warnings: parsed.warnings ?? [],
      rawText: text,
      error: null,
    };
  } catch (err: any) {
    console.error("LC extraction error:", err.message);

    if (err.message?.includes("JSON")) {
      return {
        fields: null,
        overallConfidence: null,
        warnings: [],
        rawText: text,
        error: "Could not parse extraction results. Please enter fields manually.",
      };
    }

    return {
      fields: null,
      overallConfidence: null,
      warnings: [],
      rawText: text,
      error: `AI extraction failed: ${err.message?.substring(0, 100)}`,
    };
  }
}

// ── Convenience: full pipeline from file ──

export async function extractFromPdf(
  filePath: string,
  documentType: string,
): Promise<ExtractionResult & { llmTokensUsed?: number; processingTimeMs: number }> {
  const start = Date.now();

  // Step 1: try text extraction
  let text: string | null = null;
  try {
    text = await extractTextFromPdf(filePath);
  } catch {
    // PDF parse failed — will try vision below
  }

  // Step 2: if text is too short, try image conversion
  let images: Buffer[] | null = null;
  if (!text || text.length < 50) {
    try {
      images = await pdfToImages(filePath);
    } catch (err: any) {
      if (!text) {
        return {
          fields: null,
          overallConfidence: null,
          warnings: [],
          rawText: null,
          error: "Could not read PDF. The file may be corrupted or password-protected.",
          processingTimeMs: Date.now() - start,
        };
      }
      // Text exists but image conversion failed — proceed with text
    }
  }

  // Step 3: call Claude
  const result = await extractFields(
    images && images.length > 0 ? null : text,
    images && images.length > 0 ? images : null,
    documentType,
  );

  // Attach raw text even for vision results
  if (!result.rawText && text) {
    result.rawText = text;
  }

  return {
    ...result,
    processingTimeMs: Date.now() - start,
  };
}

// ── Cleanup helper ──

export function cleanupTempFile(filePath: string): void {
  try {
    unlinkSync(filePath);
  } catch {
    // Ignore cleanup errors
  }
}
