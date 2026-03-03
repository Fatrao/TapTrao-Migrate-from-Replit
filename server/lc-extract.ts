import { unlinkSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { extractTextFromPdf, pdfToImages } from "./file-extract";

// Re-export low-level utilities for backward compatibility
export { extractTextFromPdf, pdfToImages } from "./file-extract";

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

export type ClassifyAndExtractResult = ExtractionResult & {
  detectedDocumentType: string;
  classificationConfidence: FieldConfidence;
};

// ── All supported document types ──

export const ALL_DOC_TYPES = [
  "lc_terms",
  "commercial_invoice",
  "bill_of_lading",
  "certificate_of_origin",
  "phytosanitary_certificate",
  "packing_list",
  "insurance_certificate",
  "quality_certificate",
  "weight_certificate",
  "eudr_declaration",
  "cbam_declaration",
  "traceability_certificate",
] as const;

export type DocumentType = (typeof ALL_DOC_TYPES)[number];

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

  // ── Phase 1: New document types ──

  insurance_certificate: {
    insuredParty: "Name of the insured party (usually the buyer/applicant)",
    coverageAmount: "Coverage amount (numeric, no currency symbols). Return as a number.",
    currency: "3-letter currency code (USD, EUR, GBP, etc.)",
    coverageType: "Type of coverage. MUST be one of: All Risks, FPA, WA, ICC(A), ICC(B), ICC(C), or other description if different.",
    voyageFrom: "Port/place of departure for the insured voyage",
    voyageTo: "Port/place of destination for the insured voyage",
    goodsDescription: "Description of insured goods",
    warAndStrikesClause: "true if War and Strikes clause is included, false if not. Return boolean.",
    policyNumber: "Insurance policy/certificate number",
    issuingCompany: "Name of the insurance company or underwriter",
    issueDate: "Date of issue. Convert to YYYY-MM-DD.",
    claimsPayableAt: "Location where claims are payable, if stated",
  },
  quality_certificate: {
    issuingBody: "Name of the organization/body that issued the certificate",
    grade: "Quality grade or classification assigned to the goods",
    goodsDescription: "Description of the goods inspected",
    quantityInspected: "Quantity inspected (numeric). Return as a number.",
    quantityUnit: "Unit of measurement (kg, MT, bags, etc.)",
    inspectionDate: "Date of inspection. Convert to YYYY-MM-DD.",
    certificateNumber: "Certificate reference number",
    exporterName: "Name of the exporter/shipper, if present",
    countryOfOrigin: "Country of origin of the goods, if stated",
  },
  weight_certificate: {
    issuingBody: "Name of the weighing authority/organization",
    netWeight: "Net weight (numeric). Return as a number.",
    grossWeight: "Gross weight (numeric). Return as a number.",
    weightUnit: "Unit of weight. MUST be one of: kg, MT, lbs",
    numberOfPackages: "Number of packages/bags/containers (numeric). Return as a number.",
    certificateNumber: "Certificate/reference number",
    weighingDate: "Date of weighing. Convert to YYYY-MM-DD.",
    goodsDescription: "Description of the goods weighed",
    vesselName: "Name of the vessel, if stated",
    containerNumbers: "Container number(s), if present",
  },
  eudr_declaration: {
    operatorName: "Name of the operator/importer making the declaration",
    productDescription: "Product/commodity described in the declaration",
    hsCode: "HS/tariff code (format: XXXX.XX or XXXXXX)",
    countryOfOrigin: "Country of origin/production",
    gpsCoordinates: "GPS coordinates of production/harvest plots (latitude, longitude pairs). Return as a JSON array of {lat, lng} objects if multiple.",
    plotIdentifiers: "Plot or farm identifiers/reference numbers. Return as a comma-separated string.",
    deforestationFreeDate: "Deforestation-free cutoff date. Convert to YYYY-MM-DD.",
    supplierName: "Name of the direct supplier",
    evidenceType: "Type of evidence provided (satellite imagery, certification, field audit, etc.)",
    evidenceReference: "Reference number for the supporting evidence document",
    riskAssessment: "Risk level stated in the declaration. MUST be one of: low, standard, high, or the text as stated.",
  },
  cbam_declaration: {
    productDescription: "Product/goods described in the declaration",
    hsCode: "HS/tariff code (format: XXXX.XX or XXXXXX)",
    embeddedEmissions: "Total embedded emissions value (numeric, in tonnes CO2e). Return as a number.",
    emissionsUnit: "Unit of emissions measurement (e.g. tCO2e, kgCO2e)",
    verifierName: "Name of the third-party verifier, if stated",
    verifierAccreditation: "Accreditation number or reference of the verifier",
    installationName: "Name of the production installation/facility",
    installationCountry: "Country where the production installation is located",
    reportingPeriod: "Reporting period covered by the declaration",
    declarantName: "Name of the CBAM declarant (importer)",
    cbamReferenceNumber: "CBAM declaration reference number, if present",
  },
  traceability_certificate: {
    gpsCoordinates: "GPS coordinates of production plots. Return as a JSON array of {lat, lng} objects if multiple.",
    plotIdentifiers: "Plot IDs or farm reference numbers. Return as a comma-separated string.",
    productionDate: "Date of production/harvest. Convert to YYYY-MM-DD.",
    supplyChainActors: "Names of supply chain actors (farmer, collector, processor, exporter). Return as a comma-separated string.",
    commodityDescription: "Description of the commodity/product traced",
    certifyingBody: "Name of the organization issuing the traceability certificate",
    certificateNumber: "Certificate reference number",
    traceabilityScheme: "Name of the traceability scheme or standard (e.g. Rainforest Alliance, UTZ, RSPO)",
    countryOfOrigin: "Country of origin/production",
    exporterName: "Name of the exporter, if stated",
  },
};

// Human-readable labels for auto-detection prompt
const DOC_TYPE_LABELS: Record<string, string> = {
  lc_terms: "Letter of Credit (LC / SWIFT MT700 / Documentary Credit)",
  commercial_invoice: "Commercial Invoice (Facture Commerciale)",
  bill_of_lading: "Bill of Lading (Connaissement Maritime)",
  certificate_of_origin: "Certificate of Origin (Certificat d'Origine)",
  phytosanitary_certificate: "Phytosanitary Certificate (Certificat Phytosanitaire)",
  packing_list: "Packing List (Liste de Colisage)",
  insurance_certificate: "Insurance Policy / Certificate (Police d'Assurance)",
  quality_certificate: "Quality / Inspection Certificate (Certificat de Qualite)",
  weight_certificate: "Weight Certificate (Certificat de Poids)",
  eudr_declaration: "EUDR Due Diligence Declaration (Declaration EUDR)",
  cbam_declaration: "CBAM Declaration (Carbon Border Adjustment Mechanism)",
  traceability_certificate: "Traceability Certificate (Certificat de Tracabilite)",
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

// ── Auto-Detection: Classify + Extract in One Call ──

function buildClassifyAndExtractPrompt(): string {
  // Build the type list
  const typeList = ALL_DOC_TYPES
    .map((t) => `- ${t}: ${DOC_TYPE_LABELS[t] || t}`)
    .join("\n");

  // Build all field schemas grouped by type
  const fieldSections = ALL_DOC_TYPES.map((docType) => {
    const fields = docType === "lc_terms" ? LC_TERMS_FIELDS : DOC_FIELDS[docType];
    if (!fields) return "";
    const fieldList = Object.entries(fields)
      .map(([key, desc]) => `    - ${key}: ${desc}`)
      .join("\n");
    return `  If documentType is "${docType}":\n${fieldList}`;
  })
    .filter(Boolean)
    .join("\n\n");

  return `You are a trade finance document specialist. Your task has two steps:

STEP 1 — CLASSIFY THE DOCUMENT
Identify the document type. It MUST be one of:
${typeList}

If you cannot confidently match any type, use "unknown".

STEP 2 — EXTRACT FIELDS
Based on the document type you identified in Step 1, extract the relevant fields listed below.

For each field you find, provide:
- "value": the extracted value. Use exact text from the document for names and descriptions. Convert dates to YYYY-MM-DD. Convert numbers to plain numeric values (no currency symbols, no commas). Convert booleans to true/false.
- "confidence": "high" if clearly stated, "medium" if inferred, "low" if uncertain.
- "sourceSnippet": exact text fragment (max 60 chars) from the document.

If a field is NOT found, OMIT it from the output.

FIELD SCHEMAS BY DOCUMENT TYPE:

${fieldSections}

Respond with ONLY valid JSON. No markdown, no backticks, no explanation. Schema:
{
  "documentType": "<detected_type>",
  "classificationConfidence": "high"|"medium"|"low",
  "fields": {
    "<fieldName>": { "value": <extracted_value>, "confidence": "high"|"medium"|"low", "sourceSnippet": "..." }
  },
  "overallConfidence": "high"|"medium"|"low",
  "warnings": ["any issues, ambiguities, or notable observations"]
}`;
}

export async function classifyAndExtract(
  text: string | null,
  images: Buffer[] | null,
): Promise<ClassifyAndExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      detectedDocumentType: "unknown",
      classificationConfidence: "low",
      fields: null,
      overallConfidence: null,
      warnings: [],
      rawText: text,
      error: "AI extraction not configured. Set ANTHROPIC_API_KEY to enable.",
    };
  }

  const systemPrompt = buildClassifyAndExtractPrompt();
  const client = new Anthropic({ apiKey });

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  if (images && images.length > 0) {
    // Limit to first 5 pages for classification to keep prompt reasonable
    for (const img of images.slice(0, 5)) {
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
      text: "Classify this document and extract its fields from the image(s) above.",
    });
  } else if (text) {
    content.push({
      type: "text",
      text: `DOCUMENT TEXT:\n---\n${text.slice(0, 15000)}\n---\n\nClassify this document and extract its fields from the text above.`,
    });
  } else {
    return {
      detectedDocumentType: "unknown",
      classificationConfidence: "low",
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
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const block = response.content[0];
    if (block.type !== "text") {
      return {
        detectedDocumentType: "unknown",
        classificationConfidence: "low",
        fields: null,
        overallConfidence: null,
        warnings: [],
        rawText: text,
        error: "Unexpected response format from AI.",
      };
    }

    let jsonStr = block.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate detected type
    const detectedType = (ALL_DOC_TYPES as readonly string[]).includes(parsed.documentType)
      ? parsed.documentType
      : "unknown";

    return {
      detectedDocumentType: detectedType,
      classificationConfidence: parsed.classificationConfidence ?? "low",
      fields: parsed.fields ?? null,
      overallConfidence: parsed.overallConfidence ?? null,
      warnings: parsed.warnings ?? [],
      rawText: text,
      error: null,
    };
  } catch (err: any) {
    console.error("Auto-detect extraction error:", err.message);

    if (err.message?.includes("JSON")) {
      return {
        detectedDocumentType: "unknown",
        classificationConfidence: "low",
        fields: null,
        overallConfidence: null,
        warnings: [],
        rawText: text,
        error: "Could not parse extraction results. Please enter fields manually.",
      };
    }

    return {
      detectedDocumentType: "unknown",
      classificationConfidence: "low",
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

// ── Auto-detect pipeline from file ──

export async function extractFromPdfWithAutoDetect(
  filePath: string,
): Promise<ClassifyAndExtractResult & { processingTimeMs: number }> {
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
          detectedDocumentType: "unknown",
          classificationConfidence: "low",
          fields: null,
          overallConfidence: null,
          warnings: [],
          rawText: null,
          error: "Could not read PDF. The file may be corrupted or password-protected.",
          processingTimeMs: Date.now() - start,
        };
      }
    }
  }

  // Step 3: classify + extract in one call
  const result = await classifyAndExtract(
    images && images.length > 0 ? null : text,
    images && images.length > 0 ? images : null,
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
