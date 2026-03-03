import type { LcFields, LcDocument, CheckResultItem, LcCheckSummary, CheckSeverity, CheckCategory } from "@shared/schema";
import { createHash } from "crypto";

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b(ltd|limited)\b/gi, "limited")
    .replace(/\b(sarl|s\.a\.r\.l\.?|s\.a\.r\.l)\b/gi, "sarl")
    .replace(/\b(inc|incorporated)\b/gi, "incorporated")
    .replace(/\b(corp|corporation)\b/gi, "corporation")
    .replace(/\b(co|company)\b/gi, "company")
    .replace(/\b(plc|p\.l\.c\.?)\b/gi, "plc")
    .replace(/&/g, "and")
    .replace(/[.,\-'"()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compareNames(lcName: string, docName: string): { severity: CheckSeverity; explanation: string } {
  if (!docName || !docName.trim()) {
    return { severity: "RED", explanation: "Document field is empty. Bank will reject — UCP 600 Art. 14(d) requires consistency across documents." };
  }
  if (lcName.trim() === docName.trim()) {
    return { severity: "GREEN", explanation: "Exact match with LC terms." };
  }
  if (lcName.trim().toLowerCase() === docName.trim().toLowerCase()) {
    return { severity: "GREEN", explanation: "Case-insensitive match — acceptable under UCP 600 Art. 14(d)." };
  }
  const normLc = normalizeName(lcName);
  const normDoc = normalizeName(docName);
  if (normLc === normDoc) {
    return { severity: "GREEN", explanation: "Match after normalizing common business abbreviations (Ltd/Limited, &/and, SARL, etc.)." };
  }
  if (normLc.includes(normDoc) || normDoc.includes(normLc)) {
    return { severity: "AMBER", explanation: "Partial match detected. Names are similar but not identical. Bank may query — review carefully per UCP 600 Art. 14(d)." };
  }
  return { severity: "RED", explanation: "Name MISMATCH. The name on this document does not match the LC beneficiary. Bank will almost certainly reject — UCP 600 Art. 14(d)." };
}

function parseNumber(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[,\s]/g, "")) || 0;
}

function compareAmounts(lcAmount: number, docAmount: number, docType: string): CheckResultItem {
  if (docAmount === 0) {
    return {
      fieldName: "Total Amount",
      lcValue: String(lcAmount),
      documentValue: "Not specified",
      documentType: docType,
      severity: "RED",
      ucpRule: "UCP 600 Art. 18(a)",
      explanation: "Invoice amount is missing or zero. Cannot verify against LC amount.",
      checkCategory: "lc_validation",
    };
  }
  if (docAmount > lcAmount) {
    return {
      fieldName: "Total Amount",
      lcValue: String(lcAmount),
      documentValue: String(docAmount),
      documentType: docType,
      severity: "RED",
      ucpRule: "UCP 600 Art. 18(a)",
      explanation: `Invoice amount (${docAmount}) exceeds LC amount (${lcAmount}). The amount drawn must not exceed the credit amount. Bank will reject.`,
      checkCategory: "lc_validation",
    };
  }
  return {
    fieldName: "Total Amount",
    lcValue: String(lcAmount),
    documentValue: String(docAmount),
    documentType: docType,
    severity: "GREEN",
    ucpRule: "UCP 600 Art. 18(a)",
    explanation: "Invoice amount does not exceed LC amount.",
    checkCategory: "lc_validation",
  };
}

function compareQuantities(lcQty: number, docQty: number, docType: string, tolerancePct: number = 5): CheckResultItem {
  if (docQty === 0) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: "Not specified",
      documentType: docType,
      severity: "AMBER",
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: "Quantity not specified on this document.",
      checkCategory: "lc_validation",
    };
  }
  const diff = lcQty > 0 ? Math.abs(docQty - lcQty) / lcQty : 0;
  if (diff === 0) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: String(docQty),
      documentType: docType,
      severity: "GREEN",
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: "Quantity matches LC terms exactly.",
      checkCategory: "lc_validation",
    };
  }
  const tolFraction = tolerancePct / 100;
  if (diff <= tolFraction) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: String(docQty),
      documentType: docType,
      severity: "AMBER",
      ucpRule: "ISBP 745",
      explanation: `Quantity difference is ${(diff * 100).toFixed(1)}% (within \u00b1${tolerancePct}% tolerance). ISBP 745 tolerance may apply for bulk goods.`,
      checkCategory: "lc_validation",
    };
  }
  return {
    fieldName: "Quantity",
    lcValue: String(lcQty),
    documentValue: String(docQty),
    documentType: docType,
    severity: "RED",
    ucpRule: "UCP 600 Art. 14(d)",
    explanation: `Quantity difference is ${(diff * 100).toFixed(1)}% (exceeds \u00b1${tolerancePct}% tolerance). Documents are inconsistent. Bank will reject.`,
    checkCategory: "lc_validation",
  };
}

// ── Phase 2 Helper Functions ──

function parseNumericValue(str: string): number {
  if (!str) return 0;
  // Strip unit suffixes (kg, MT, lbs, etc.) and parse
  return parseFloat(str.replace(/[,\s]/g, "").replace(/\s*(kg|mt|lbs?|tonnes?|pieces?|bags?|cartons?|drums?|litres?|cbm)\s*$/i, "")) || 0;
}

function compareGoodsDescription(descA: string, descB: string): { severity: CheckSeverity; explanation: string } {
  const a = (descA || "").trim().toLowerCase();
  const b = (descB || "").trim().toLowerCase();
  if (!a || !b) {
    return { severity: "AMBER", explanation: "Goods description is missing on one document. Cannot verify consistency." };
  }
  if (a === b) {
    return { severity: "GREEN", explanation: "Goods descriptions match exactly across documents." };
  }
  if (a.includes(b) || b.includes(a)) {
    return { severity: "GREEN", explanation: "Goods descriptions substantially correspond across documents." };
  }
  const wordsA = a.split(/\s+/).filter(w => w.length > 2);
  const wordsSetB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  const overlap = wordsA.filter(w => wordsSetB.has(w)).length;
  const similarity = wordsA.length > 0 ? overlap / wordsA.length : 0;
  if (similarity >= 0.5) {
    return { severity: "AMBER", explanation: "Goods descriptions partially match. Review wording carefully — UCP 600 Art. 14(d) requires data must not conflict." };
  }
  return { severity: "RED", explanation: "Goods descriptions do not match across documents. Bank will reject — UCP 600 Art. 14(d)." };
}

function compareCountryOfOrigin(countryA: string, countryB: string): { severity: CheckSeverity; explanation: string } {
  const a = (countryA || "").trim().toLowerCase();
  const b = (countryB || "").trim().toLowerCase();
  if (!a || !b) {
    return { severity: "AMBER", explanation: "Country of origin is missing on one document." };
  }
  if (a === b || a.includes(b) || b.includes(a)) {
    return { severity: "GREEN", explanation: "Country of origin matches across documents." };
  }
  return { severity: "RED", explanation: "Country of origin MISMATCH across documents. Bank will reject — UCP 600 Art. 14(d)." };
}

function comparePortNames(portA: string, portB: string): { severity: CheckSeverity; explanation: string } {
  const normalize = (p: string) => (p || "").trim().toLowerCase().replace(/^port\s+(of\s+)?/i, "").trim();
  const a = normalize(portA);
  const b = normalize(portB);
  if (!a || !b) {
    return { severity: "AMBER", explanation: "Port name is missing on one document." };
  }
  if (a === b) {
    return { severity: "GREEN", explanation: "Port names match across documents." };
  }
  if (a.includes(b) || b.includes(a)) {
    return { severity: "AMBER", explanation: "Port names partially match. Verify consistency across documents." };
  }
  return { severity: "RED", explanation: "Port names do not match across documents. Bank will reject — UCP 600 Art. 14(d)." };
}

function compareNumericWithTolerance(valA: number, valB: number, tolerancePct: number): { severity: CheckSeverity; diffPct: number; explanation: string } {
  if (valA === 0 && valB === 0) {
    return { severity: "GREEN", diffPct: 0, explanation: "Both values are zero or not specified." };
  }
  if (valA === 0 || valB === 0) {
    return { severity: "AMBER", diffPct: 100, explanation: "One value is missing or zero. Cannot compare." };
  }
  const diff = Math.abs(valA - valB);
  const base = Math.max(valA, valB);
  const diffPct = (diff / base) * 100;
  if (diffPct === 0) {
    return { severity: "GREEN", diffPct: 0, explanation: "Values match exactly across documents." };
  }
  if (diffPct <= tolerancePct) {
    return { severity: "AMBER", diffPct, explanation: `Difference is ${diffPct.toFixed(1)}% (within ±${tolerancePct}% tolerance). Check if this variance is acceptable.` };
  }
  return { severity: "RED", diffPct, explanation: `Difference is ${diffPct.toFixed(1)}% (exceeds ±${tolerancePct}% tolerance). Documents are inconsistent — bank will reject.` };
}

function crossDocLabel(typeA: string, typeB: string): string {
  const shortNames: Record<string, string> = {
    commercial_invoice: "Invoice",
    bill_of_lading: "B/L",
    certificate_of_origin: "CoO",
    phytosanitary_certificate: "Phyto Cert",
    packing_list: "Packing List",
    insurance_certificate: "Insurance",
    quality_certificate: "Quality Cert",
    weight_certificate: "Weight Cert",
    eudr_declaration: "EUDR",
    cbam_declaration: "CBAM",
    traceability_certificate: "Traceability",
  };
  return `${shortNames[typeA] || typeA} \u2194 ${shortNames[typeB] || typeB}`;
}

// ── Phase 2: LC vs New Document Type Validations ──

function validateLcVsInsurance(lcFields: LcFields, insurance: LcDocument, results: CheckResultItem[]): void {
  const f = insurance.fields;
  const dtLabel = "Insurance Certificate";

  // 1. Insured party vs beneficiary
  const insuredParty = f.insuredParty || "";
  if (insuredParty) {
    const nameResult = compareNames(lcFields.beneficiaryName, insuredParty);
    results.push({
      fieldName: "Insured Party (vs Beneficiary)",
      lcValue: lcFields.beneficiaryName,
      documentValue: insuredParty,
      documentType: dtLabel,
      severity: nameResult.severity,
      ucpRule: "UCP 600 Art. 28(d)",
      explanation: nameResult.explanation,
      checkCategory: "lc_validation",
    });
  }

  // 2. Coverage amount >= 110% for CIF/CIP, >= 100% for others
  const coverageAmt = parseNumber(f.coverageAmount || "");
  if (coverageAmt > 0 && lcFields.totalAmount > 0) {
    const incotermsUpper = lcFields.incoterms.toUpperCase().trim();
    const isCifCip = incotermsUpper === "CIF" || incotermsUpper === "CIP";
    const requiredPct = isCifCip ? 110 : 100;
    const requiredAmount = lcFields.totalAmount * (requiredPct / 100);
    if (coverageAmt >= requiredAmount) {
      results.push({
        fieldName: "Insurance Coverage Amount",
        lcValue: `${requiredPct}% of ${lcFields.totalAmount} = ${requiredAmount.toFixed(2)}`,
        documentValue: String(coverageAmt),
        documentType: dtLabel,
        severity: "GREEN",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: `Insurance coverage (${coverageAmt}) meets the minimum ${requiredPct}% requirement${isCifCip ? " for CIF/CIP terms" : ""}.`,
        checkCategory: "lc_validation",
      });
    } else {
      results.push({
        fieldName: "Insurance Coverage Amount",
        lcValue: `Min ${requiredPct}% of ${lcFields.totalAmount} = ${requiredAmount.toFixed(2)}`,
        documentValue: String(coverageAmt),
        documentType: dtLabel,
        severity: "RED",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: `Insurance coverage (${coverageAmt}) is BELOW the minimum ${requiredPct}% of LC amount (${requiredAmount.toFixed(2)})${isCifCip ? " required for CIF/CIP terms" : ""}. Bank will reject.`,
        checkCategory: "lc_validation",
      });
    }
  }

  // 3. Currency match
  const insCurrency = (f.currency || "").toUpperCase().trim();
  const lcCurrency = lcFields.currency.toUpperCase().trim();
  if (insCurrency && lcCurrency) {
    if (insCurrency !== lcCurrency) {
      results.push({
        fieldName: "Insurance Currency",
        lcValue: lcCurrency,
        documentValue: insCurrency,
        documentType: dtLabel,
        severity: "RED",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: `Insurance currency (${insCurrency}) does not match LC currency (${lcCurrency}). Bank will reject.`,
        checkCategory: "lc_validation",
      });
    } else {
      results.push({
        fieldName: "Insurance Currency",
        lcValue: lcCurrency,
        documentValue: insCurrency,
        documentType: dtLabel,
        severity: "GREEN",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: "Insurance currency matches LC terms.",
        checkCategory: "lc_validation",
      });
    }
  }

  // 4. Voyage from vs port of loading
  const voyageFrom = f.voyageFrom || "";
  if (voyageFrom && lcFields.portOfLoading) {
    const portResult = comparePortNames(voyageFrom, lcFields.portOfLoading);
    results.push({
      fieldName: "Voyage From (vs Port of Loading)",
      lcValue: lcFields.portOfLoading,
      documentValue: voyageFrom,
      documentType: dtLabel,
      severity: portResult.severity,
      ucpRule: "UCP 600 Art. 28(f)(ii)",
      explanation: portResult.explanation,
      checkCategory: "lc_validation",
    });
  }

  // 5. Voyage to vs port of discharge
  const voyageTo = f.voyageTo || "";
  if (voyageTo && lcFields.portOfDischarge) {
    const portResult = comparePortNames(voyageTo, lcFields.portOfDischarge);
    results.push({
      fieldName: "Voyage To (vs Port of Discharge)",
      lcValue: lcFields.portOfDischarge,
      documentValue: voyageTo,
      documentType: dtLabel,
      severity: portResult.severity,
      ucpRule: "UCP 600 Art. 28(f)(ii)",
      explanation: portResult.explanation,
      checkCategory: "lc_validation",
    });
  }
}

function validateLcVsQuality(lcFields: LcFields, quality: LcDocument, results: CheckResultItem[]): void {
  const f = quality.fields;
  const dtLabel = "Quality Certificate";

  // 1. Goods description
  const goodsDesc = f.goodsDescription || "";
  if (goodsDesc && lcFields.goodsDescription) {
    const gdResult = compareGoodsDescription(lcFields.goodsDescription, goodsDesc);
    results.push({
      fieldName: "Goods Description",
      lcValue: lcFields.goodsDescription,
      documentValue: goodsDesc,
      documentType: dtLabel,
      severity: gdResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: gdResult.explanation,
      checkCategory: "lc_validation",
    });
  }

  // 2. Exporter vs beneficiary
  const exporterName = f.exporterName || "";
  if (exporterName) {
    const nameResult = compareNames(lcFields.beneficiaryName, exporterName);
    results.push({
      fieldName: "Exporter Name (vs Beneficiary)",
      lcValue: lcFields.beneficiaryName,
      documentValue: exporterName,
      documentType: dtLabel,
      severity: nameResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: nameResult.explanation,
      checkCategory: "lc_validation",
    });
  }
}

function validateLcVsWeight(lcFields: LcFields, weight: LcDocument, results: CheckResultItem[]): void {
  const f = weight.fields;
  const dtLabel = "Weight Certificate";

  const goodsDesc = f.goodsDescription || "";
  if (goodsDesc && lcFields.goodsDescription) {
    const gdResult = compareGoodsDescription(lcFields.goodsDescription, goodsDesc);
    results.push({
      fieldName: "Goods Description",
      lcValue: lcFields.goodsDescription,
      documentValue: goodsDesc,
      documentType: dtLabel,
      severity: gdResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: gdResult.explanation,
      checkCategory: "lc_validation",
    });
  }
}

function validateLcVsEudr(lcFields: LcFields, eudr: LcDocument, results: CheckResultItem[]): void {
  const f = eudr.fields;
  const dtLabel = "EUDR Declaration";

  // 1. HS code — first 4 digits must match
  const eudrHs = (f.hsCode || "").replace(/\D/g, "").substring(0, 4);
  const lcHs = (lcFields.hsCode || "").replace(/\D/g, "").substring(0, 4);
  if (eudrHs && lcHs) {
    if (eudrHs === lcHs) {
      results.push({
        fieldName: "HS Code (heading)",
        lcValue: lcFields.hsCode,
        documentValue: f.hsCode || "",
        documentType: dtLabel,
        severity: "GREEN",
        ucpRule: "EU Reg. 2023/1115",
        explanation: "HS code heading matches LC terms.",
        checkCategory: "lc_validation",
      });
    } else {
      results.push({
        fieldName: "HS Code (heading)",
        lcValue: lcFields.hsCode,
        documentValue: f.hsCode || "",
        documentType: dtLabel,
        severity: "RED",
        ucpRule: "EU Reg. 2023/1115",
        explanation: `EUDR HS heading (${eudrHs}) does not match LC HS heading (${lcHs}). Product classification mismatch.`,
        checkCategory: "lc_validation",
      });
    }
  }

  // 2. Country of origin
  const eudrCountry = f.countryOfOrigin || "";
  if (eudrCountry && lcFields.countryOfOrigin) {
    const coResult = compareCountryOfOrigin(lcFields.countryOfOrigin, eudrCountry);
    results.push({
      fieldName: "Country of Origin",
      lcValue: lcFields.countryOfOrigin,
      documentValue: eudrCountry,
      documentType: dtLabel,
      severity: coResult.severity,
      ucpRule: "EU Reg. 2023/1115",
      explanation: coResult.explanation,
      checkCategory: "lc_validation",
    });
  }

  // 3. Operator vs beneficiary
  const operatorName = f.operatorName || "";
  if (operatorName) {
    const nameResult = compareNames(lcFields.beneficiaryName, operatorName);
    results.push({
      fieldName: "Operator Name (vs Beneficiary)",
      lcValue: lcFields.beneficiaryName,
      documentValue: operatorName,
      documentType: dtLabel,
      severity: nameResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: nameResult.explanation,
      checkCategory: "lc_validation",
    });
  }
}

function validateLcVsCbam(lcFields: LcFields, cbam: LcDocument, results: CheckResultItem[]): void {
  const f = cbam.fields;
  const dtLabel = "CBAM Declaration";

  // 1. HS code — first 4 digits must match
  const cbamHs = (f.hsCode || "").replace(/\D/g, "").substring(0, 4);
  const lcHs = (lcFields.hsCode || "").replace(/\D/g, "").substring(0, 4);
  if (cbamHs && lcHs) {
    if (cbamHs === lcHs) {
      results.push({
        fieldName: "HS Code (heading)",
        lcValue: lcFields.hsCode,
        documentValue: f.hsCode || "",
        documentType: dtLabel,
        severity: "GREEN",
        ucpRule: "EU Reg. 2023/956 (CBAM)",
        explanation: "HS code heading matches LC terms.",
        checkCategory: "lc_validation",
      });
    } else {
      results.push({
        fieldName: "HS Code (heading)",
        lcValue: lcFields.hsCode,
        documentValue: f.hsCode || "",
        documentType: dtLabel,
        severity: "RED",
        ucpRule: "EU Reg. 2023/956 (CBAM)",
        explanation: `CBAM HS heading (${cbamHs}) does not match LC HS heading (${lcHs}). Product classification mismatch.`,
        checkCategory: "lc_validation",
      });
    }
  }

  // 2. Declarant vs beneficiary
  const declarantName = f.declarantName || "";
  if (declarantName) {
    const nameResult = compareNames(lcFields.beneficiaryName, declarantName);
    results.push({
      fieldName: "Declarant Name (vs Beneficiary)",
      lcValue: lcFields.beneficiaryName,
      documentValue: declarantName,
      documentType: dtLabel,
      severity: nameResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: nameResult.explanation,
      checkCategory: "lc_validation",
    });
  }
}

// ── Phase 2: Cross-Document Validation Functions ──

function crossValidateInvoiceVsBl(invoice: LcDocument, bl: LcDocument, tolerancePct: number, results: CheckResultItem[]): void {
  const label = crossDocLabel("commercial_invoice", "bill_of_lading");

  // 1. Quantity match
  const invQty = parseNumericValue(invoice.fields.quantity || "");
  const blQty = parseNumericValue(bl.fields.quantity || "");
  if (invQty > 0 && blQty > 0) {
    const qtyResult = compareNumericWithTolerance(invQty, blQty, tolerancePct);
    results.push({
      fieldName: "Quantity",
      lcValue: invoice.fields.quantity || "",
      documentValue: bl.fields.quantity || "",
      documentType: label,
      severity: qtyResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: qtyResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 2. Goods description (relaxed — B/L may use general terms per Art. 20(a)(vi))
  const invGoods = invoice.fields.goodsDescription || "";
  const blGoods = bl.fields.goodsDescription || "";
  if (invGoods && blGoods) {
    const gdResult = compareGoodsDescription(invGoods, blGoods);
    // Relax: if RED, downgrade to AMBER because B/L may use general terms
    const severity = gdResult.severity === "RED" ? "AMBER" as CheckSeverity : gdResult.severity;
    const explanation = gdResult.severity === "RED"
      ? "B/L goods description differs from invoice. Note: per UCP 600 Art. 20(a)(vi), B/L may use general terms. Review if descriptions conflict."
      : gdResult.explanation;
    results.push({
      fieldName: "Goods Description",
      lcValue: invGoods,
      documentValue: blGoods,
      documentType: label,
      severity,
      ucpRule: "UCP 600 Art. 20(a)(vi)",
      explanation,
      checkCategory: "cross_document",
    });
  }

  // 3. Shipper vs invoice beneficiary
  const shipperName = bl.fields.shipperName || "";
  const invBeneficiary = invoice.fields.beneficiaryName || "";
  if (shipperName && invBeneficiary) {
    const nameResult = compareNames(invBeneficiary, shipperName);
    results.push({
      fieldName: "Shipper (vs Invoice Beneficiary)",
      lcValue: invBeneficiary,
      documentValue: shipperName,
      documentType: label,
      severity: nameResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: nameResult.explanation,
      checkCategory: "cross_document",
    });
  }
}

function crossValidateInvoiceVsPackingList(invoice: LcDocument, pl: LcDocument, tolerancePct: number, results: CheckResultItem[]): void {
  const label = crossDocLabel("commercial_invoice", "packing_list");

  // 1. Quantity match
  const invQty = parseNumericValue(invoice.fields.quantity || "");
  const plQty = parseNumericValue(pl.fields.quantity || "");
  if (invQty > 0 && plQty > 0) {
    const qtyResult = compareNumericWithTolerance(invQty, plQty, tolerancePct);
    results.push({
      fieldName: "Quantity",
      lcValue: invoice.fields.quantity || "",
      documentValue: pl.fields.quantity || "",
      documentType: label,
      severity: qtyResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: qtyResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 2. Number of packages consistency
  const invPackages = parseNumericValue(invoice.fields.numberOfPackages || "");
  const plPackages = parseNumericValue(pl.fields.numberOfPackages || "");
  if (invPackages > 0 && plPackages > 0) {
    if (invPackages === plPackages) {
      results.push({
        fieldName: "Number of Packages",
        lcValue: invoice.fields.numberOfPackages || String(invPackages),
        documentValue: pl.fields.numberOfPackages || String(plPackages),
        documentType: label,
        severity: "GREEN",
        ucpRule: "ISBP 745",
        explanation: "Number of packages matches between invoice and packing list.",
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "Number of Packages",
        lcValue: invoice.fields.numberOfPackages || String(invPackages),
        documentValue: pl.fields.numberOfPackages || String(plPackages),
        documentType: label,
        severity: "AMBER",
        ucpRule: "ISBP 745",
        explanation: "Number of packages differs between invoice and packing list. Packing list is the authoritative source — review.",
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateBlVsPackingList(bl: LcDocument, pl: LcDocument, tolerancePct: number, results: CheckResultItem[]): void {
  const label = crossDocLabel("bill_of_lading", "packing_list");

  // 1. Quantity match
  const blQty = parseNumericValue(bl.fields.quantity || "");
  const plQty = parseNumericValue(pl.fields.quantity || "");
  if (blQty > 0 && plQty > 0) {
    const qtyResult = compareNumericWithTolerance(blQty, plQty, tolerancePct);
    results.push({
      fieldName: "Quantity",
      lcValue: bl.fields.quantity || "",
      documentValue: pl.fields.quantity || "",
      documentType: label,
      severity: qtyResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: qtyResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 2. Gross weight consistency (3% tolerance for weight)
  const blWeight = parseNumericValue(bl.fields.grossWeight || "");
  const plWeight = parseNumericValue(pl.fields.grossWeight || "");
  if (blWeight > 0 && plWeight > 0) {
    const wtResult = compareNumericWithTolerance(blWeight, plWeight, 3);
    results.push({
      fieldName: "Gross Weight",
      lcValue: bl.fields.grossWeight || "",
      documentValue: pl.fields.grossWeight || "",
      documentType: label,
      severity: wtResult.severity,
      ucpRule: "ISBP 745",
      explanation: wtResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 3. Number of packages (exact match required)
  const blPackages = parseNumericValue(bl.fields.numberOfPackages || "");
  const plPackages = parseNumericValue(pl.fields.numberOfPackages || "");
  if (blPackages > 0 && plPackages > 0) {
    if (blPackages === plPackages) {
      results.push({
        fieldName: "Number of Packages",
        lcValue: bl.fields.numberOfPackages || String(blPackages),
        documentValue: pl.fields.numberOfPackages || String(plPackages),
        documentType: label,
        severity: "GREEN",
        ucpRule: "UCP 600 Art. 14(d)",
        explanation: "Number of packages matches between B/L and packing list.",
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "Number of Packages",
        lcValue: bl.fields.numberOfPackages || String(blPackages),
        documentValue: pl.fields.numberOfPackages || String(plPackages),
        documentType: label,
        severity: "RED",
        ucpRule: "UCP 600 Art. 14(d)",
        explanation: `Package count mismatch: B/L shows ${blPackages}, packing list shows ${plPackages}. Bank will reject — UCP 600 Art. 14(d).`,
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateInvoiceVsInsurance(invoice: LcDocument, insurance: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("commercial_invoice", "insurance_certificate");

  // 1. Currency match
  const invCurrency = (invoice.fields.currency || "").toUpperCase().trim();
  const insCurrency = (insurance.fields.currency || "").toUpperCase().trim();
  if (invCurrency && insCurrency) {
    if (invCurrency !== insCurrency) {
      results.push({
        fieldName: "Currency",
        lcValue: invCurrency,
        documentValue: insCurrency,
        documentType: label,
        severity: "RED",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: `Invoice currency (${invCurrency}) does not match insurance currency (${insCurrency}). Bank will reject.`,
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "Currency",
        lcValue: invCurrency,
        documentValue: insCurrency,
        documentType: label,
        severity: "GREEN",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: "Currency matches between invoice and insurance certificate.",
        checkCategory: "cross_document",
      });
    }
  }

  // 2. Coverage >= invoice amount
  const invAmount = parseNumber(invoice.fields.totalAmount || "");
  const coverageAmt = parseNumber(insurance.fields.coverageAmount || "");
  if (invAmount > 0 && coverageAmt > 0) {
    if (coverageAmt >= invAmount) {
      results.push({
        fieldName: "Coverage vs Invoice Amount",
        lcValue: String(invAmount),
        documentValue: String(coverageAmt),
        documentType: label,
        severity: "GREEN",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: `Insurance coverage (${coverageAmt}) covers the invoice amount (${invAmount}).`,
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "Coverage vs Invoice Amount",
        lcValue: String(invAmount),
        documentValue: String(coverageAmt),
        documentType: label,
        severity: "RED",
        ucpRule: "UCP 600 Art. 28(b)",
        explanation: `Insurance coverage (${coverageAmt}) is LESS than invoice amount (${invAmount}). Goods are under-insured.`,
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateBlVsInsurance(bl: LcDocument, insurance: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("bill_of_lading", "insurance_certificate");

  // 1. Voyage from vs port of loading
  const voyageFrom = insurance.fields.voyageFrom || "";
  const portOfLoading = bl.fields.portOfLoading || "";
  if (voyageFrom && portOfLoading) {
    const portResult = comparePortNames(voyageFrom, portOfLoading);
    results.push({
      fieldName: "Voyage From (vs Port of Loading)",
      lcValue: portOfLoading,
      documentValue: voyageFrom,
      documentType: label,
      severity: portResult.severity,
      ucpRule: "UCP 600 Art. 28(f)(ii)",
      explanation: portResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 2. Voyage to vs port of discharge
  const voyageTo = insurance.fields.voyageTo || "";
  const portOfDischarge = bl.fields.portOfDischarge || "";
  if (voyageTo && portOfDischarge) {
    const portResult = comparePortNames(voyageTo, portOfDischarge);
    results.push({
      fieldName: "Voyage To (vs Port of Discharge)",
      lcValue: portOfDischarge,
      documentValue: voyageTo,
      documentType: label,
      severity: portResult.severity,
      ucpRule: "UCP 600 Art. 28(f)(ii)",
      explanation: portResult.explanation,
      checkCategory: "cross_document",
    });
  }
}

function crossValidateCooVsPhyto(coo: LcDocument, phyto: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("certificate_of_origin", "phytosanitary_certificate");

  // 1. Origin country match
  const cooOrigin = coo.fields.originCountry || "";
  const phytoOrigin = phyto.fields.originCountry || "";
  if (cooOrigin && phytoOrigin) {
    const coResult = compareCountryOfOrigin(cooOrigin, phytoOrigin);
    results.push({
      fieldName: "Country of Origin",
      lcValue: cooOrigin,
      documentValue: phytoOrigin,
      documentType: label,
      severity: coResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: coResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 2. Exporter name match
  const cooExporter = coo.fields.exporterName || "";
  const phytoExporter = phyto.fields.exporterName || "";
  if (cooExporter && phytoExporter) {
    const nameResult = compareNames(cooExporter, phytoExporter);
    results.push({
      fieldName: "Exporter Name",
      lcValue: cooExporter,
      documentValue: phytoExporter,
      documentType: label,
      severity: nameResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: nameResult.explanation,
      checkCategory: "cross_document",
    });
  }
}

function crossValidateCooVsEudr(coo: LcDocument, eudr: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("certificate_of_origin", "eudr_declaration");

  const cooOrigin = coo.fields.originCountry || "";
  const eudrOrigin = eudr.fields.countryOfOrigin || "";
  if (cooOrigin && eudrOrigin) {
    const coResult = compareCountryOfOrigin(cooOrigin, eudrOrigin);
    results.push({
      fieldName: "Country of Origin",
      lcValue: cooOrigin,
      documentValue: eudrOrigin,
      documentType: label,
      severity: coResult.severity,
      ucpRule: "EU Reg. 2023/1115",
      explanation: coResult.explanation,
      checkCategory: "cross_document",
    });
  }
}

function crossValidateEudrVsTraceability(eudr: LcDocument, trace: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("eudr_declaration", "traceability_certificate");

  // 1. GPS coordinates
  const eudrGps = (eudr.fields.gpsCoordinates || "").trim();
  const traceGps = (trace.fields.gpsCoordinates || "").trim();
  if (eudrGps && traceGps) {
    const eudrNorm = eudrGps.toLowerCase().replace(/\s+/g, "");
    const traceNorm = traceGps.toLowerCase().replace(/\s+/g, "");
    if (eudrNorm === traceNorm) {
      results.push({
        fieldName: "GPS Coordinates",
        lcValue: eudrGps,
        documentValue: traceGps,
        documentType: label,
        severity: "GREEN",
        ucpRule: "EU Reg. 2023/1115 Art. 9",
        explanation: "GPS coordinates match between EUDR declaration and traceability certificate.",
        checkCategory: "cross_document",
      });
    } else if (eudrNorm.includes(traceNorm) || traceNorm.includes(eudrNorm)) {
      results.push({
        fieldName: "GPS Coordinates",
        lcValue: eudrGps,
        documentValue: traceGps,
        documentType: label,
        severity: "AMBER",
        ucpRule: "EU Reg. 2023/1115 Art. 9",
        explanation: "GPS coordinates partially overlap. Verify geolocation data is consistent.",
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "GPS Coordinates",
        lcValue: eudrGps,
        documentValue: traceGps,
        documentType: label,
        severity: "RED",
        ucpRule: "EU Reg. 2023/1115 Art. 9",
        explanation: "GPS coordinates do NOT match between EUDR declaration and traceability certificate. Geolocation data is inconsistent.",
        checkCategory: "cross_document",
      });
    }
  }

  // 2. Country of origin
  const eudrCountry = eudr.fields.countryOfOrigin || "";
  const traceCountry = trace.fields.countryOfOrigin || "";
  if (eudrCountry && traceCountry) {
    const coResult = compareCountryOfOrigin(eudrCountry, traceCountry);
    results.push({
      fieldName: "Country of Origin",
      lcValue: eudrCountry,
      documentValue: traceCountry,
      documentType: label,
      severity: coResult.severity,
      ucpRule: "EU Reg. 2023/1115",
      explanation: coResult.explanation,
      checkCategory: "cross_document",
    });
  }

  // 3. Plot identifiers (compare as sets)
  const eudrPlots = (eudr.fields.plotIdentifiers || "").trim();
  const tracePlots = (trace.fields.plotIdentifiers || "").trim();
  if (eudrPlots && tracePlots) {
    const eudrSet = new Set(eudrPlots.split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean));
    const traceSet = new Set(tracePlots.split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(Boolean));
    const intersection = Array.from(eudrSet).filter(p => traceSet.has(p));
    if (eudrSet.size === traceSet.size && intersection.length === eudrSet.size) {
      results.push({
        fieldName: "Plot Identifiers",
        lcValue: eudrPlots,
        documentValue: tracePlots,
        documentType: label,
        severity: "GREEN",
        ucpRule: "EU Reg. 2023/1115 Art. 9",
        explanation: "Plot identifiers match exactly between EUDR declaration and traceability certificate.",
        checkCategory: "cross_document",
      });
    } else if (intersection.length > 0) {
      results.push({
        fieldName: "Plot Identifiers",
        lcValue: eudrPlots,
        documentValue: tracePlots,
        documentType: label,
        severity: "AMBER",
        ucpRule: "EU Reg. 2023/1115 Art. 9",
        explanation: `Plot identifiers partially overlap (${intersection.length} common out of ${eudrSet.size} EUDR / ${traceSet.size} Traceability). Verify all plots are accounted for.`,
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "Plot Identifiers",
        lcValue: eudrPlots,
        documentValue: tracePlots,
        documentType: label,
        severity: "RED",
        ucpRule: "EU Reg. 2023/1115 Art. 9",
        explanation: "Plot identifiers have NO overlap between EUDR declaration and traceability certificate. Data is inconsistent.",
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateQualityVsWeight(quality: LcDocument, weight: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("quality_certificate", "weight_certificate");

  const qualityGoods = quality.fields.goodsDescription || "";
  const weightGoods = weight.fields.goodsDescription || "";
  if (qualityGoods && weightGoods) {
    const gdResult = compareGoodsDescription(qualityGoods, weightGoods);
    results.push({
      fieldName: "Goods Description",
      lcValue: qualityGoods,
      documentValue: weightGoods,
      documentType: label,
      severity: gdResult.severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: gdResult.explanation,
      checkCategory: "cross_document",
    });
  }
}

function crossValidateBlVsWeight(bl: LcDocument, weight: LcDocument, results: CheckResultItem[]): void {
  const label = crossDocLabel("bill_of_lading", "weight_certificate");

  // 1. Vessel name match
  const blVessel = (bl.fields.vesselName || "").trim();
  const wtVessel = (weight.fields.vesselName || "").trim();
  if (blVessel && wtVessel) {
    if (blVessel.toLowerCase() === wtVessel.toLowerCase()) {
      results.push({
        fieldName: "Vessel Name",
        lcValue: blVessel,
        documentValue: wtVessel,
        documentType: label,
        severity: "GREEN",
        ucpRule: "UCP 600 Art. 14(d)",
        explanation: "Vessel name matches between B/L and weight certificate.",
        checkCategory: "cross_document",
      });
    } else {
      results.push({
        fieldName: "Vessel Name",
        lcValue: blVessel,
        documentValue: wtVessel,
        documentType: label,
        severity: "RED",
        ucpRule: "UCP 600 Art. 14(d)",
        explanation: `Vessel name mismatch: B/L shows "${blVessel}", weight certificate shows "${wtVessel}". Bank will reject.`,
        checkCategory: "cross_document",
      });
    }
  }

  // 2. Goods description (relaxed for B/L)
  const blGoods = bl.fields.goodsDescription || "";
  const wtGoods = weight.fields.goodsDescription || "";
  if (blGoods && wtGoods) {
    const gdResult = compareGoodsDescription(blGoods, wtGoods);
    // Relax: B/L may use general terms
    const severity = gdResult.severity === "RED" ? "AMBER" as CheckSeverity : gdResult.severity;
    const explanation = gdResult.severity === "RED"
      ? "Goods description differs between B/L and weight certificate. B/L may use general terms — review if descriptions conflict."
      : gdResult.explanation;
    results.push({
      fieldName: "Goods Description",
      lcValue: blGoods,
      documentValue: wtGoods,
      documentType: label,
      severity,
      ucpRule: "UCP 600 Art. 14(d)",
      explanation,
      checkCategory: "cross_document",
    });
  }
}

// ── Main Cross-Check Engine ──

function docTypeLabel(dt: string): string {
  const labels: Record<string, string> = {
    commercial_invoice: "Commercial Invoice",
    bill_of_lading: "Bill of Lading",
    certificate_of_origin: "Certificate of Origin",
    phytosanitary_certificate: "Phytosanitary Certificate",
    packing_list: "Packing List",
    insurance_certificate: "Insurance Certificate",
    quality_certificate: "Quality Certificate",
    weight_certificate: "Weight Certificate",
    eudr_declaration: "EUDR Declaration",
    cbam_declaration: "CBAM Declaration",
    traceability_certificate: "Traceability Certificate",
    other: "Other Document",
  };
  return labels[dt] || dt;
}

export function runLcCrossCheck(lcFields: LcFields, documents: LcDocument[]): { results: CheckResultItem[]; summary: LcCheckSummary } {
  const results: CheckResultItem[] = [];
  const tolerancePct = lcFields.tolerancePercent ?? 5;

  if (!lcFields.lcReference || lcFields.lcReference.trim() === "") {
    results.push({
      fieldName: "LC Reference",
      lcValue: "(empty)",
      documentValue: "N/A",
      documentType: "LC Terms",
      severity: "AMBER",
      ucpRule: "General",
      explanation: "LC reference number is empty. Ensure this is populated for traceability.",
      checkCategory: "lc_validation",
    });
  }

  for (const doc of documents) {
    const dtLabel = docTypeLabel(doc.documentType);

    if (doc.documentType === "commercial_invoice") {
      const beneficiary = doc.fields.beneficiaryName || "";
      const nameResult = compareNames(lcFields.beneficiaryName, beneficiary);
      results.push({
        fieldName: "Beneficiary Name",
        lcValue: lcFields.beneficiaryName,
        documentValue: beneficiary || "(empty)",
        documentType: dtLabel,
        severity: nameResult.severity,
        ucpRule: "UCP 600 Art. 14(d)",
        explanation: nameResult.explanation,
        checkCategory: "lc_validation",
      });

      const invCurrency = (doc.fields.currency || "").toUpperCase().trim();
      const lcCurrency = lcFields.currency.toUpperCase().trim();
      if (invCurrency && invCurrency !== lcCurrency) {
        results.push({
          fieldName: "Currency",
          lcValue: lcCurrency,
          documentValue: invCurrency,
          documentType: dtLabel,
          severity: "RED",
          ucpRule: "UCP 600 Art. 18(a)",
          explanation: `Invoice currency (${invCurrency}) does not match LC currency (${lcCurrency}). Bank will reject.`,
          checkCategory: "lc_validation",
        });
      } else if (invCurrency) {
        results.push({
          fieldName: "Currency",
          lcValue: lcCurrency,
          documentValue: invCurrency,
          documentType: dtLabel,
          severity: "GREEN",
          ucpRule: "UCP 600 Art. 18(a)",
          explanation: "Currency matches LC terms.",
          checkCategory: "lc_validation",
        });
      }

      const invAmount = parseNumber(doc.fields.totalAmount || "");
      results.push(compareAmounts(lcFields.totalAmount, invAmount, dtLabel));

      const invQty = parseNumber(doc.fields.quantity || "");
      if (invQty > 0) {
        results.push(compareQuantities(lcFields.quantity, invQty, dtLabel, tolerancePct));
      }

      const invGoods = (doc.fields.goodsDescription || "").trim();
      if (invGoods) {
        const lcGoods = lcFields.goodsDescription.trim().toLowerCase();
        const docGoods = invGoods.toLowerCase();
        if (lcGoods === docGoods) {
          results.push({
            fieldName: "Goods Description",
            lcValue: lcFields.goodsDescription,
            documentValue: invGoods,
            documentType: dtLabel,
            severity: "GREEN",
            ucpRule: "UCP 600 Art. 18(c)",
            explanation: "Goods description on invoice corresponds exactly with LC.",
            checkCategory: "lc_validation",
          });
        } else if (docGoods.includes(lcGoods) || lcGoods.includes(docGoods)) {
          results.push({
            fieldName: "Goods Description",
            lcValue: lcFields.goodsDescription,
            documentValue: invGoods,
            documentType: dtLabel,
            severity: "GREEN",
            ucpRule: "UCP 600 Art. 18(c)",
            explanation: "Goods description on invoice substantially corresponds with LC terms.",
            checkCategory: "lc_validation",
          });
        } else {
          const lcWordsArr = lcGoods.split(/\s+/).filter(w => w.length > 2);
          const docWordsSet = new Set(docGoods.split(/\s+/).filter(w => w.length > 2));
          const overlap = lcWordsArr.filter(w => docWordsSet.has(w)).length;
          const similarity = lcWordsArr.length > 0 ? overlap / lcWordsArr.length : 0;
          if (similarity >= 0.5) {
            results.push({
              fieldName: "Goods Description",
              lcValue: lcFields.goodsDescription,
              documentValue: invGoods,
              documentType: dtLabel,
              severity: "AMBER",
              ucpRule: "UCP 600 Art. 18(c)",
              explanation: "Goods description partially matches LC terms. Invoice must correspond with LC — review wording carefully.",
              checkCategory: "lc_validation",
            });
          } else {
            results.push({
              fieldName: "Goods Description",
              lcValue: lcFields.goodsDescription,
              documentValue: invGoods,
              documentType: dtLabel,
              severity: "RED",
              ucpRule: "UCP 600 Art. 18(c)",
              explanation: "Goods description on invoice does not correspond with LC terms. Bank will reject — Art. 18(c) requires the invoice description to correspond with the credit.",
              checkCategory: "lc_validation",
            });
          }
        }
      }

      const invIncoterms = (doc.fields.incoterms || "").toUpperCase().trim();
      const lcIncoterms = lcFields.incoterms.toUpperCase().trim();
      if (invIncoterms && invIncoterms !== lcIncoterms) {
        results.push({
          fieldName: "Incoterms",
          lcValue: lcFields.incoterms,
          documentValue: doc.fields.incoterms || "",
          documentType: dtLabel,
          severity: "RED",
          ucpRule: "UCP 600 Art. 18(c)",
          explanation: `Invoice Incoterms (${doc.fields.incoterms}) do not match LC Incoterms (${lcFields.incoterms}). This is a critical discrepancy — bank will reject.`,
          checkCategory: "lc_validation",
        });
      } else if (invIncoterms) {
        results.push({
          fieldName: "Incoterms",
          lcValue: lcFields.incoterms,
          documentValue: doc.fields.incoterms || "",
          documentType: dtLabel,
          severity: "GREEN",
          ucpRule: "UCP 600 Art. 18(c)",
          explanation: "Incoterms on invoice match LC terms.",
          checkCategory: "lc_validation",
        });
      }
    }

    if (doc.documentType === "bill_of_lading") {
      const shipperName = doc.fields.shipperName || "";
      if (shipperName) {
        const nameResult = compareNames(lcFields.beneficiaryName, shipperName);
        results.push({
          fieldName: "Shipper Name (vs Beneficiary)",
          lcValue: lcFields.beneficiaryName,
          documentValue: shipperName,
          documentType: dtLabel,
          severity: nameResult.severity,
          ucpRule: "UCP 600 Art. 14(d)",
          explanation: nameResult.explanation,
          checkCategory: "lc_validation",
        });
      }

      const blPort = (doc.fields.portOfLoading || "").trim().toLowerCase();
      const lcPort = lcFields.portOfLoading.trim().toLowerCase();
      if (blPort) {
        if (blPort === lcPort) {
          results.push({
            fieldName: "Port of Loading",
            lcValue: lcFields.portOfLoading,
            documentValue: doc.fields.portOfLoading,
            documentType: dtLabel,
            severity: "GREEN",
            ucpRule: "UCP 600 Art. 20(a)(ii)",
            explanation: "Port of loading matches LC terms.",
            checkCategory: "lc_validation",
          });
        } else if (blPort.includes(lcPort) || lcPort.includes(blPort)) {
          results.push({
            fieldName: "Port of Loading",
            lcValue: lcFields.portOfLoading,
            documentValue: doc.fields.portOfLoading,
            documentType: dtLabel,
            severity: "AMBER",
            ucpRule: "UCP 600 Art. 20(a)(ii)",
            explanation: "Port of loading partially matches. Verify the port name is consistent with LC terms.",
            checkCategory: "lc_validation",
          });
        } else {
          results.push({
            fieldName: "Port of Loading",
            lcValue: lcFields.portOfLoading,
            documentValue: doc.fields.portOfLoading,
            documentType: dtLabel,
            severity: "RED",
            ucpRule: "UCP 600 Art. 20(a)(ii)",
            explanation: "Port of loading on B/L does not match LC. Bank will reject.",
            checkCategory: "lc_validation",
          });
        }
      }

      const blPortDischarge = (doc.fields.portOfDischarge || "").trim().toLowerCase();
      const lcPortDischarge = lcFields.portOfDischarge.trim().toLowerCase();
      if (blPortDischarge) {
        if (blPortDischarge === lcPortDischarge) {
          results.push({
            fieldName: "Port of Discharge",
            lcValue: lcFields.portOfDischarge,
            documentValue: doc.fields.portOfDischarge,
            documentType: dtLabel,
            severity: "GREEN",
            ucpRule: "UCP 600 Art. 20(a)(ii)",
            explanation: "Port of discharge matches LC terms.",
            checkCategory: "lc_validation",
          });
        } else if (blPortDischarge.includes(lcPortDischarge) || lcPortDischarge.includes(blPortDischarge)) {
          results.push({
            fieldName: "Port of Discharge",
            lcValue: lcFields.portOfDischarge,
            documentValue: doc.fields.portOfDischarge,
            documentType: dtLabel,
            severity: "AMBER",
            ucpRule: "UCP 600 Art. 20(a)(ii)",
            explanation: "Port of discharge partially matches. Verify consistency.",
            checkCategory: "lc_validation",
          });
        } else {
          results.push({
            fieldName: "Port of Discharge",
            lcValue: lcFields.portOfDischarge,
            documentValue: doc.fields.portOfDischarge,
            documentType: dtLabel,
            severity: "RED",
            ucpRule: "UCP 600 Art. 20(a)(ii)",
            explanation: "Port of discharge on B/L does not match LC. Bank will reject.",
            checkCategory: "lc_validation",
          });
        }
      }

      const shippedDate = doc.fields.shippedOnBoardDate || "";
      if (shippedDate && lcFields.latestShipmentDate) {
        const shipped = new Date(shippedDate);
        const latest = new Date(lcFields.latestShipmentDate);
        if (!isNaN(shipped.getTime()) && !isNaN(latest.getTime())) {
          if (shipped <= latest) {
            results.push({
              fieldName: "Shipment Date",
              lcValue: lcFields.latestShipmentDate,
              documentValue: shippedDate,
              documentType: dtLabel,
              severity: "GREEN",
              ucpRule: "UCP 600 Art. 14(c)",
              explanation: "B/L shipped date is on or before LC latest shipment date.",
              checkCategory: "lc_validation",
            });
          } else {
            results.push({
              fieldName: "Shipment Date",
              lcValue: lcFields.latestShipmentDate,
              documentValue: shippedDate,
              documentType: dtLabel,
              severity: "RED",
              ucpRule: "UCP 600 Art. 14(c)",
              explanation: `B/L shipped date (${shippedDate}) is AFTER LC latest shipment date (${lcFields.latestShipmentDate}). Late shipment — bank will reject.`,
              checkCategory: "lc_validation",
            });
          }

          const today = new Date();
          const daysSinceShipment = Math.floor((today.getTime() - shipped.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceShipment > 21) {
            results.push({
              fieldName: "Presentation Deadline",
              lcValue: "Within 21 days of shipment",
              documentValue: `${daysSinceShipment} days since shipment`,
              documentType: dtLabel,
              severity: "RED",
              ucpRule: "UCP 600 Art. 14(c)",
              explanation: `Presentation deadline exceeded. ${daysSinceShipment} days have passed since B/L date. UCP 600 Art. 14(c) requires presentation within 21 calendar days of shipment.`,
              checkCategory: "lc_validation",
            });
          } else {
            results.push({
              fieldName: "Presentation Deadline",
              lcValue: "Within 21 days of shipment",
              documentValue: `${daysSinceShipment} days since shipment`,
              documentType: dtLabel,
              severity: "GREEN",
              ucpRule: "UCP 600 Art. 14(c)",
              explanation: `${daysSinceShipment} days since shipment — within 21-day presentation period.`,
              checkCategory: "lc_validation",
            });
          }
        }
      }

      const blNumber = (doc.fields.blNumber || "").trim();
      if (!blNumber) {
        results.push({
          fieldName: "B/L Number",
          lcValue: "Expected",
          documentValue: "(empty)",
          documentType: dtLabel,
          severity: "AMBER",
          ucpRule: "General",
          explanation: "B/L number is empty. Ensure this reference is populated for document tracking.",
          checkCategory: "lc_validation",
        });
      }

      const blQty = parseNumber(doc.fields.quantity || "");
      if (blQty > 0) {
        results.push(compareQuantities(lcFields.quantity, blQty, dtLabel, tolerancePct));
      }
    }

    if (doc.documentType === "certificate_of_origin") {
      const exporterName = doc.fields.exporterName || "";
      if (exporterName) {
        const nameResult = compareNames(lcFields.beneficiaryName, exporterName);
        results.push({
          fieldName: "Exporter Name (vs Beneficiary)",
          lcValue: lcFields.beneficiaryName,
          documentValue: exporterName,
          documentType: dtLabel,
          severity: nameResult.severity,
          ucpRule: "UCP 600 Art. 14(d)",
          explanation: nameResult.explanation,
          checkCategory: "lc_validation",
        });
      }

      const cooOrigin = (doc.fields.originCountry || "").trim().toLowerCase();
      const lcOrigin = lcFields.countryOfOrigin.trim().toLowerCase();
      if (cooOrigin) {
        if (cooOrigin === lcOrigin || cooOrigin.includes(lcOrigin) || lcOrigin.includes(cooOrigin)) {
          results.push({
            fieldName: "Country of Origin",
            lcValue: lcFields.countryOfOrigin,
            documentValue: doc.fields.originCountry,
            documentType: dtLabel,
            severity: "GREEN",
            ucpRule: "UCP 600 Art. 14(d)",
            explanation: "Country of origin on CoO matches LC.",
            checkCategory: "lc_validation",
          });
        } else {
          results.push({
            fieldName: "Country of Origin",
            lcValue: lcFields.countryOfOrigin,
            documentValue: doc.fields.originCountry,
            documentType: dtLabel,
            severity: "RED",
            ucpRule: "UCP 600 Art. 14(d)",
            explanation: "Country of origin on CoO does not match LC. Bank will reject.",
            checkCategory: "lc_validation",
          });
        }
      }
    }

    if (doc.documentType === "phytosanitary_certificate") {
      const exporterName = doc.fields.exporterName || "";
      if (exporterName) {
        const nameResult = compareNames(lcFields.beneficiaryName, exporterName);
        results.push({
          fieldName: "Exporter Name (vs Beneficiary)",
          lcValue: lcFields.beneficiaryName,
          documentValue: exporterName,
          documentType: dtLabel,
          severity: nameResult.severity,
          ucpRule: "UCP 600 Art. 14(d)",
          explanation: nameResult.explanation,
          checkCategory: "lc_validation",
        });
      }
    }

    if (doc.documentType === "packing_list") {
      const plQty = parseNumber(doc.fields.quantity || "");
      if (plQty > 0) {
        results.push(compareQuantities(lcFields.quantity, plQty, dtLabel, tolerancePct));
      }
    }

    const chedRef = doc.fields.chedReference || "";
    if (chedRef) {
      const chedPattern = /^GBCHD\d{4}\.\d{7}$/;
      if (!chedPattern.test(chedRef)) {
        results.push({
          fieldName: "CHED Reference",
          lcValue: "GBCHDYYYY.NNNNNNN",
          documentValue: chedRef,
          documentType: dtLabel,
          severity: "AMBER",
          ucpRule: "General",
          explanation: "CHED reference format appears incorrect. Expected: GBCHDYYYY.NNNNNNN (e.g. GBCHD2026.0012345).",
          checkCategory: "lc_validation",
        });
      } else {
        results.push({
          fieldName: "CHED Reference",
          lcValue: "Valid format",
          documentValue: chedRef,
          documentType: dtLabel,
          severity: "GREEN",
          ucpRule: "General",
          explanation: "CHED reference format is valid.",
          checkCategory: "lc_validation",
        });
      }
    }
  }

  // ── Phase 2: LC vs New Document Types ──
  const insurance = documents.find(d => d.documentType === "insurance_certificate");
  const quality = documents.find(d => d.documentType === "quality_certificate");
  const weight = documents.find(d => d.documentType === "weight_certificate");
  const eudr = documents.find(d => d.documentType === "eudr_declaration");
  const cbam = documents.find(d => d.documentType === "cbam_declaration");

  if (insurance) validateLcVsInsurance(lcFields, insurance, results);
  if (quality) validateLcVsQuality(lcFields, quality, results);
  if (weight) validateLcVsWeight(lcFields, weight, results);
  if (eudr) validateLcVsEudr(lcFields, eudr, results);
  if (cbam) validateLcVsCbam(lcFields, cbam, results);

  // ── Phase 2: Cross-Document Validations ──
  const invoice = documents.find(d => d.documentType === "commercial_invoice");
  const bl = documents.find(d => d.documentType === "bill_of_lading");
  const coo = documents.find(d => d.documentType === "certificate_of_origin");
  const phyto = documents.find(d => d.documentType === "phytosanitary_certificate");
  const pl = documents.find(d => d.documentType === "packing_list");
  const trace = documents.find(d => d.documentType === "traceability_certificate");

  if (invoice && bl) crossValidateInvoiceVsBl(invoice, bl, tolerancePct, results);
  if (invoice && pl) crossValidateInvoiceVsPackingList(invoice, pl, tolerancePct, results);
  if (bl && pl) crossValidateBlVsPackingList(bl, pl, tolerancePct, results);
  if (invoice && insurance) crossValidateInvoiceVsInsurance(invoice, insurance, results);
  if (bl && insurance) crossValidateBlVsInsurance(bl, insurance, results);
  if (coo && phyto) crossValidateCooVsPhyto(coo, phyto, results);
  if (coo && eudr) crossValidateCooVsEudr(coo, eudr, results);
  if (eudr && trace) crossValidateEudrVsTraceability(eudr, trace, results);
  if (quality && weight) crossValidateQualityVsWeight(quality, weight, results);
  if (bl && weight) crossValidateBlVsWeight(bl, weight, results);

  // ── Summary ──
  const matches = results.filter(r => r.severity === "GREEN").length;
  const warnings = results.filter(r => r.severity === "AMBER").length;
  const criticals = results.filter(r => r.severity === "RED").length;
  const totalChecks = results.length;
  const passRate = totalChecks > 0 ? Math.round((matches / totalChecks) * 100) : 0;

  let verdict: LcCheckSummary["verdict"] = "COMPLIANT";
  if (criticals > 0) {
    verdict = "DISCREPANCIES_FOUND";
  } else if (warnings > 0) {
    verdict = "COMPLIANT_WITH_NOTES";
  }

  return {
    results,
    summary: { totalChecks, matches, warnings, criticals, passRate, verdict },
  };
}

export function computeLcHash(lcFields: LcFields, documents: LcDocument[], results: CheckResultItem[], timestamp: string): string {
  const stableObj = { lcFields, documents, results, timestamp };
  return createHash("sha256").update(JSON.stringify(stableObj)).digest("hex");
}

export function generateCorrectionEmail(lcFields: LcFields, results: CheckResultItem[]): { email: string; whatsapp: string } {
  const criticals = results.filter(r => r.severity === "RED");
  if (criticals.length === 0) {
    return { email: "", whatsapp: "" };
  }

  const emailLines: string[] = [];
  emailLines.push(`Subject: URGENT \u2014 Document Discrepancies Found \u2014 Please Amend`);
  emailLines.push("");
  emailLines.push(`Dear ${lcFields.beneficiaryName},`);
  emailLines.push("");
  emailLines.push(`We have reviewed the documents submitted against LC reference ${lcFields.lcReference || "(not specified)"} and found the following critical discrepancies that will cause the bank to reject the presentation:`);
  emailLines.push("");
  criticals.forEach((c, i) => {
    emailLines.push(`${i + 1}. ${c.documentType} \u2014 ${c.fieldName}`);
    emailLines.push(`   Your document shows: ${c.documentValue}`);
    emailLines.push(`   The LC requires: ${c.lcValue}`);
    emailLines.push(`   Rule: ${c.ucpRule}`);
    emailLines.push(`   Please amend and reissue.`);
    emailLines.push("");
  });
  emailLines.push("Please correct these discrepancies and resubmit the amended documents as soon as possible.");
  emailLines.push("");
  emailLines.push("Best regards");

  const waLines: string[] = [];
  waLines.push(`*URGENT \u2014 Document Discrepancies*`);
  waLines.push(`LC Ref: ${lcFields.lcReference || "(not specified)"}`);
  waLines.push("");
  criticals.forEach((c, i) => {
    waLines.push(`${i + 1}. *${c.documentType}* \u2014 ${c.fieldName}`);
    waLines.push(`   Shows: ${c.documentValue}`);
    waLines.push(`   LC requires: ${c.lcValue}`);
    waLines.push(`   _Please amend and reissue._`);
  });
  waLines.push("");
  waLines.push("Please correct and resend ASAP.");

  return { email: emailLines.join("\n"), whatsapp: waLines.join("\n") };
}
