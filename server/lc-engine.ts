import type { LcFields, LcDocument, CheckResultItem, LcCheckSummary, CheckSeverity, CheckCategory } from "@shared/schema";
import { createHash } from "crypto";
import { t } from "./locales";

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

function compareNames(lcName: string, docName: string, locale: string): { severity: CheckSeverity; explanation: string } {
  if (!docName || !docName.trim()) {
    return { severity: "RED", explanation: t("lc.name_empty", locale) };
  }
  if (lcName.trim() === docName.trim()) {
    return { severity: "GREEN", explanation: t("lc.name_exact_match", locale) };
  }
  if (lcName.trim().toLowerCase() === docName.trim().toLowerCase()) {
    return { severity: "GREEN", explanation: t("lc.name_case_insensitive", locale) };
  }
  const normLc = normalizeName(lcName);
  const normDoc = normalizeName(docName);
  if (normLc === normDoc) {
    return { severity: "GREEN", explanation: t("lc.name_normalized_match", locale) };
  }
  if (normLc.includes(normDoc) || normDoc.includes(normLc)) {
    return { severity: "AMBER", explanation: t("lc.name_partial_match", locale) };
  }
  return { severity: "RED", explanation: t("lc.name_mismatch", locale) };
}

function parseNumber(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace(/[,\s]/g, "")) || 0;
}

function compareAmounts(lcAmount: number, docAmount: number, docType: string, locale: string): CheckResultItem {
  if (docAmount === 0) {
    return {
      fieldName: "Total Amount",
      lcValue: String(lcAmount),
      documentValue: "Not specified",
      documentType: docType,
      severity: "RED",
      ucpRule: "UCP 600 Art. 18(a)",
      explanation: t("lc.amount_missing", locale),
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
      explanation: t("lc.amount_exceeds", locale, { docAmount, lcAmount }),
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
    explanation: t("lc.amount_ok", locale),
    checkCategory: "lc_validation",
  };
}

function compareQuantities(lcQty: number, docQty: number, docType: string, locale: string, tolerancePct: number = 5): CheckResultItem {
  if (docQty === 0) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: "Not specified",
      documentType: docType,
      severity: "AMBER",
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: t("lc.qty_not_specified", locale),
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
      explanation: t("lc.qty_exact_match", locale),
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
      explanation: t("lc.qty_within_tolerance", locale, { diffPct: (diff * 100).toFixed(1), tolerancePct }),
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
      explanation: t("lc.qty_exceeds_tolerance", locale, { diffPct: (diff * 100).toFixed(1), tolerancePct }),
    checkCategory: "lc_validation",
  };
}

// ── Phase 2 Helper Functions ──

function parseNumericValue(str: string): number {
  if (!str) return 0;
  // Strip unit suffixes (kg, MT, lbs, etc.) and parse
  return parseFloat(str.replace(/[,\s]/g, "").replace(/\s*(kg|mt|lbs?|tonnes?|pieces?|bags?|cartons?|drums?|litres?|cbm)\s*$/i, "")) || 0;
}

function compareGoodsDescription(descA: string, descB: string, locale: string): { severity: CheckSeverity; explanation: string } {
  const a = (descA || "").trim().toLowerCase();
  const b = (descB || "").trim().toLowerCase();
  if (!a || !b) {
    return { severity: "AMBER", explanation: t("lc.goods_missing", locale) };
  }
  if (a === b) {
    return { severity: "GREEN", explanation: t("lc.goods_exact_match", locale) };
  }
  if (a.includes(b) || b.includes(a)) {
    return { severity: "GREEN", explanation: t("lc.goods_substantial", locale) };
  }
  const wordsA = a.split(/\s+/).filter(w => w.length > 2);
  const wordsSetB = new Set(b.split(/\s+/).filter(w => w.length > 2));
  const overlap = wordsA.filter(w => wordsSetB.has(w)).length;
  const similarity = wordsA.length > 0 ? overlap / wordsA.length : 0;
  if (similarity >= 0.5) {
    return { severity: "AMBER", explanation: t("lc.goods_partial", locale) };
  }
  return { severity: "RED", explanation: t("lc.goods_mismatch", locale) };
}

function compareCountryOfOrigin(countryA: string, countryB: string, locale: string): { severity: CheckSeverity; explanation: string } {
  const a = (countryA || "").trim().toLowerCase();
  const b = (countryB || "").trim().toLowerCase();
  if (!a || !b) {
    return { severity: "AMBER", explanation: t("lc.country_missing", locale) };
  }
  if (a === b || a.includes(b) || b.includes(a)) {
    return { severity: "GREEN", explanation: t("lc.country_match", locale) };
  }
  return { severity: "RED", explanation: t("lc.country_mismatch", locale) };
}

function comparePortNames(portA: string, portB: string, locale: string): { severity: CheckSeverity; explanation: string } {
  const normalize = (p: string) => (p || "").trim().toLowerCase().replace(/^port\s+(of\s+)?/i, "").trim();
  const a = normalize(portA);
  const b = normalize(portB);
  if (!a || !b) {
    return { severity: "AMBER", explanation: t("lc.port_missing", locale) };
  }
  if (a === b) {
    return { severity: "GREEN", explanation: t("lc.port_match", locale) };
  }
  if (a.includes(b) || b.includes(a)) {
    return { severity: "AMBER", explanation: t("lc.port_partial", locale) };
  }
  return { severity: "RED", explanation: t("lc.port_mismatch", locale) };
}

function compareNumericWithTolerance(valA: number, valB: number, tolerancePct: number, locale: string): { severity: CheckSeverity; diffPct: number; explanation: string } {
  if (valA === 0 && valB === 0) {
    return { severity: "GREEN", diffPct: 0, explanation: t("lc.numeric_both_zero", locale) };
  }
  if (valA === 0 || valB === 0) {
    return { severity: "AMBER", diffPct: 100, explanation: t("lc.numeric_one_missing", locale) };
  }
  const diff = Math.abs(valA - valB);
  const base = Math.max(valA, valB);
  const diffPct = (diff / base) * 100;
  if (diffPct === 0) {
    return { severity: "GREEN", diffPct: 0, explanation: t("lc.numeric_exact_match", locale) };
  }
  if (diffPct <= tolerancePct) {
    return { severity: "AMBER", diffPct, explanation: t("lc.numeric_within_tolerance", locale, { diffPct: diffPct.toFixed(1), tolerancePct }) };
  }
  return { severity: "RED", diffPct, explanation: t("lc.numeric_exceeds_tolerance", locale, { diffPct: diffPct.toFixed(1), tolerancePct }) };
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

function validateLcVsInsurance(lcFields: LcFields, insurance: LcDocument, results: CheckResultItem[], locale: string): void {
  const f = insurance.fields;
  const dtLabel = "Insurance Certificate";

  // 1. Insured party vs beneficiary
  const insuredParty = f.insuredParty || "";
  if (insuredParty) {
    const nameResult = compareNames(lcFields.beneficiaryName, insuredParty, locale);
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
        explanation: t("lc.insurance_coverage_ok", locale, { coverageAmt, requiredPct, cifCipSuffix: isCifCip ? t("lc.cif_cip_suffix", locale) : "" }),
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
        explanation: t("lc.insurance_coverage_below", locale, { coverageAmt, requiredPct, requiredAmount: requiredAmount.toFixed(2), cifCipSuffix: isCifCip ? t("lc.cif_cip_required_suffix", locale) : "" }),
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
        explanation: t("lc.insurance_currency_mismatch", locale, { insCurrency, lcCurrency }),
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
        explanation: t("lc.insurance_currency_match", locale),
        checkCategory: "lc_validation",
      });
    }
  }

  // 4. Voyage from vs port of loading
  const voyageFrom = f.voyageFrom || "";
  if (voyageFrom && lcFields.portOfLoading) {
    const portResult = comparePortNames(voyageFrom, lcFields.portOfLoading, locale);
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
    const portResult = comparePortNames(voyageTo, lcFields.portOfDischarge, locale);
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

function validateLcVsQuality(lcFields: LcFields, quality: LcDocument, results: CheckResultItem[], locale: string): void {
  const f = quality.fields;
  const dtLabel = "Quality Certificate";

  // 1. Goods description
  const goodsDesc = f.goodsDescription || "";
  if (goodsDesc && lcFields.goodsDescription) {
    const gdResult = compareGoodsDescription(lcFields.goodsDescription, goodsDesc, locale);
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
    const nameResult = compareNames(lcFields.beneficiaryName, exporterName, locale);
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

function validateLcVsWeight(lcFields: LcFields, weight: LcDocument, results: CheckResultItem[], locale: string): void {
  const f = weight.fields;
  const dtLabel = "Weight Certificate";

  const goodsDesc = f.goodsDescription || "";
  if (goodsDesc && lcFields.goodsDescription) {
    const gdResult = compareGoodsDescription(lcFields.goodsDescription, goodsDesc, locale);
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

function validateLcVsEudr(lcFields: LcFields, eudr: LcDocument, results: CheckResultItem[], locale: string): void {
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
        explanation: t("lc.hs_heading_match", locale),
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
        explanation: t("lc.hs_heading_mismatch_eudr", locale, { docHs: eudrHs, lcHs }),
        checkCategory: "lc_validation",
      });
    }
  }

  // 2. Country of origin
  const eudrCountry = f.countryOfOrigin || "";
  if (eudrCountry && lcFields.countryOfOrigin) {
    const coResult = compareCountryOfOrigin(lcFields.countryOfOrigin, eudrCountry, locale);
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
    const nameResult = compareNames(lcFields.beneficiaryName, operatorName, locale);
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

function validateLcVsCbam(lcFields: LcFields, cbam: LcDocument, results: CheckResultItem[], locale: string): void {
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
        explanation: t("lc.hs_heading_match", locale),
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
        explanation: t("lc.hs_heading_mismatch_cbam", locale, { docHs: cbamHs, lcHs }),
        checkCategory: "lc_validation",
      });
    }
  }

  // 2. Declarant vs beneficiary
  const declarantName = f.declarantName || "";
  if (declarantName) {
    const nameResult = compareNames(lcFields.beneficiaryName, declarantName, locale);
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

function crossValidateInvoiceVsBl(invoice: LcDocument, bl: LcDocument, tolerancePct: number, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("commercial_invoice", "bill_of_lading");

  // 1. Quantity match
  const invQty = parseNumericValue(invoice.fields.quantity || "");
  const blQty = parseNumericValue(bl.fields.quantity || "");
  if (invQty > 0 && blQty > 0) {
    const qtyResult = compareNumericWithTolerance(invQty, blQty, tolerancePct, locale);
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
    const gdResult = compareGoodsDescription(invGoods, blGoods, locale);
    // Relax: if RED, downgrade to AMBER because B/L may use general terms
    const severity = gdResult.severity === "RED" ? "AMBER" as CheckSeverity : gdResult.severity;
    const explanation = gdResult.severity === "RED"
      ? t("lc.bl_goods_relaxed", locale)
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
    const nameResult = compareNames(invBeneficiary, shipperName, locale);
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

function crossValidateInvoiceVsPackingList(invoice: LcDocument, pl: LcDocument, tolerancePct: number, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("commercial_invoice", "packing_list");

  // 1. Quantity match
  const invQty = parseNumericValue(invoice.fields.quantity || "");
  const plQty = parseNumericValue(pl.fields.quantity || "");
  if (invQty > 0 && plQty > 0) {
    const qtyResult = compareNumericWithTolerance(invQty, plQty, tolerancePct, locale);
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
        explanation: t("lc.packages_match_inv_pl", locale),
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
        explanation: t("lc.packages_differ_inv_pl", locale),
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateBlVsPackingList(bl: LcDocument, pl: LcDocument, tolerancePct: number, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("bill_of_lading", "packing_list");

  // 1. Quantity match
  const blQty = parseNumericValue(bl.fields.quantity || "");
  const plQty = parseNumericValue(pl.fields.quantity || "");
  if (blQty > 0 && plQty > 0) {
    const qtyResult = compareNumericWithTolerance(blQty, plQty, tolerancePct, locale);
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
    const wtResult = compareNumericWithTolerance(blWeight, plWeight, 3, locale);
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
        explanation: t("lc.packages_match_bl_pl", locale),
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
        explanation: t("lc.packages_mismatch_bl_pl", locale, { blPackages, plPackages }),
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateInvoiceVsInsurance(invoice: LcDocument, insurance: LcDocument, results: CheckResultItem[], locale: string): void {
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
        explanation: t("lc.cross_currency_mismatch_inv_ins", locale, { invCurrency, insCurrency }),
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
        explanation: t("lc.cross_currency_match_inv_ins", locale),
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
        explanation: t("lc.coverage_covers_invoice", locale, { coverageAmt, invAmount }),
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
        explanation: t("lc.coverage_below_invoice", locale, { coverageAmt, invAmount }),
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateBlVsInsurance(bl: LcDocument, insurance: LcDocument, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("bill_of_lading", "insurance_certificate");

  // 1. Voyage from vs port of loading
  const voyageFrom = insurance.fields.voyageFrom || "";
  const portOfLoading = bl.fields.portOfLoading || "";
  if (voyageFrom && portOfLoading) {
    const portResult = comparePortNames(voyageFrom, portOfLoading, locale);
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
    const portResult = comparePortNames(voyageTo, portOfDischarge, locale);
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

function crossValidateCooVsPhyto(coo: LcDocument, phyto: LcDocument, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("certificate_of_origin", "phytosanitary_certificate");

  // 1. Origin country match
  const cooOrigin = coo.fields.originCountry || "";
  const phytoOrigin = phyto.fields.originCountry || "";
  if (cooOrigin && phytoOrigin) {
    const coResult = compareCountryOfOrigin(cooOrigin, phytoOrigin, locale);
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
    const nameResult = compareNames(cooExporter, phytoExporter, locale);
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

function crossValidateCooVsEudr(coo: LcDocument, eudr: LcDocument, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("certificate_of_origin", "eudr_declaration");

  const cooOrigin = coo.fields.originCountry || "";
  const eudrOrigin = eudr.fields.countryOfOrigin || "";
  if (cooOrigin && eudrOrigin) {
    const coResult = compareCountryOfOrigin(cooOrigin, eudrOrigin, locale);
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

function crossValidateEudrVsTraceability(eudr: LcDocument, trace: LcDocument, results: CheckResultItem[], locale: string): void {
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
        explanation: t("lc.gps_match", locale),
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
        explanation: t("lc.gps_partial", locale),
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
        explanation: t("lc.gps_mismatch", locale),
        checkCategory: "cross_document",
      });
    }
  }

  // 2. Country of origin
  const eudrCountry = eudr.fields.countryOfOrigin || "";
  const traceCountry = trace.fields.countryOfOrigin || "";
  if (eudrCountry && traceCountry) {
    const coResult = compareCountryOfOrigin(eudrCountry, traceCountry, locale);
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
        explanation: t("lc.plots_match", locale),
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
        explanation: t("lc.plots_partial", locale, { intersection: intersection.length, eudrSize: eudrSet.size, traceSize: traceSet.size }),
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
        explanation: t("lc.plots_mismatch", locale),
        checkCategory: "cross_document",
      });
    }
  }
}

function crossValidateQualityVsWeight(quality: LcDocument, weight: LcDocument, results: CheckResultItem[], locale: string): void {
  const label = crossDocLabel("quality_certificate", "weight_certificate");

  const qualityGoods = quality.fields.goodsDescription || "";
  const weightGoods = weight.fields.goodsDescription || "";
  if (qualityGoods && weightGoods) {
    const gdResult = compareGoodsDescription(qualityGoods, weightGoods, locale);
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

function crossValidateBlVsWeight(bl: LcDocument, weight: LcDocument, results: CheckResultItem[], locale: string): void {
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
        explanation: t("lc.vessel_match", locale),
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
        explanation: t("lc.vessel_mismatch", locale, { blVessel, wtVessel }),
        checkCategory: "cross_document",
      });
    }
  }

  // 2. Goods description (relaxed for B/L)
  const blGoods = bl.fields.goodsDescription || "";
  const wtGoods = weight.fields.goodsDescription || "";
  if (blGoods && wtGoods) {
    const gdResult = compareGoodsDescription(blGoods, wtGoods, locale);
    // Relax: B/L may use general terms
    const severity = gdResult.severity === "RED" ? "AMBER" as CheckSeverity : gdResult.severity;
    const explanation = gdResult.severity === "RED"
      ? t("lc.bl_weight_goods_relaxed", locale)
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

export function runLcCrossCheck(lcFields: LcFields, documents: LcDocument[], locale: string = "en"): { results: CheckResultItem[]; summary: LcCheckSummary } {
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
      explanation: t("lc.lc_ref_empty", locale),
      checkCategory: "lc_validation",
    });
  }

  for (const doc of documents) {
    const dtLabel = docTypeLabel(doc.documentType);

    if (doc.documentType === "commercial_invoice") {
      const beneficiary = doc.fields.beneficiaryName || "";
      const nameResult = compareNames(lcFields.beneficiaryName, beneficiary, locale);
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
          explanation: t("lc.currency_mismatch", locale, { invCurrency, lcCurrency }),
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
          explanation: t("lc.currency_match", locale),
          checkCategory: "lc_validation",
        });
      }

      const invAmount = parseNumber(doc.fields.totalAmount || "");
      results.push(compareAmounts(lcFields.totalAmount, invAmount, dtLabel, locale));

      const invQty = parseNumber(doc.fields.quantity || "");
      if (invQty > 0) {
        results.push(compareQuantities(lcFields.quantity, invQty, dtLabel, locale, tolerancePct));
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
            explanation: t("lc.goods_invoice_exact", locale),
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
            explanation: t("lc.goods_invoice_substantial", locale),
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
              explanation: t("lc.goods_invoice_partial", locale),
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
              explanation: t("lc.goods_invoice_mismatch", locale),
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
          explanation: t("lc.incoterms_mismatch", locale, { docIncoterms: doc.fields.incoterms, lcIncoterms: lcFields.incoterms }),
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
          explanation: t("lc.incoterms_match", locale),
          checkCategory: "lc_validation",
        });
      }
    }

    if (doc.documentType === "bill_of_lading") {
      const shipperName = doc.fields.shipperName || "";
      if (shipperName) {
        const nameResult = compareNames(lcFields.beneficiaryName, shipperName, locale);
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
            explanation: t("lc.port_loading_match", locale),
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
            explanation: t("lc.port_loading_partial", locale),
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
            explanation: t("lc.port_loading_mismatch", locale),
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
            explanation: t("lc.port_discharge_match", locale),
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
            explanation: t("lc.port_discharge_partial", locale),
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
            explanation: t("lc.port_discharge_mismatch", locale),
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
              explanation: t("lc.shipment_date_ok", locale),
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
              explanation: t("lc.shipment_date_late", locale, { shippedDate, latestDate: lcFields.latestShipmentDate }),
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
              explanation: t("lc.presentation_exceeded", locale, { days: daysSinceShipment }),
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
              explanation: t("lc.presentation_ok", locale, { days: daysSinceShipment }),
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
          explanation: t("lc.bl_number_empty", locale),
          checkCategory: "lc_validation",
        });
      }

      const blQty = parseNumber(doc.fields.quantity || "");
      if (blQty > 0) {
        results.push(compareQuantities(lcFields.quantity, blQty, dtLabel, locale, tolerancePct));
      }
    }

    if (doc.documentType === "certificate_of_origin") {
      const exporterName = doc.fields.exporterName || "";
      if (exporterName) {
        const nameResult = compareNames(lcFields.beneficiaryName, exporterName, locale);
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
            explanation: t("lc.coo_origin_match", locale),
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
            explanation: t("lc.coo_origin_mismatch", locale),
            checkCategory: "lc_validation",
          });
        }
      }
    }

    if (doc.documentType === "phytosanitary_certificate") {
      const exporterName = doc.fields.exporterName || "";
      if (exporterName) {
        const nameResult = compareNames(lcFields.beneficiaryName, exporterName, locale);
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
        results.push(compareQuantities(lcFields.quantity, plQty, dtLabel, locale, tolerancePct));
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
          explanation: t("lc.ched_format_invalid", locale),
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
          explanation: t("lc.ched_format_valid", locale),
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

  if (insurance) validateLcVsInsurance(lcFields, insurance, results, locale);
  if (quality) validateLcVsQuality(lcFields, quality, results, locale);
  if (weight) validateLcVsWeight(lcFields, weight, results, locale);
  if (eudr) validateLcVsEudr(lcFields, eudr, results, locale);
  if (cbam) validateLcVsCbam(lcFields, cbam, results, locale);

  // ── Phase 2: Cross-Document Validations ──
  const invoice = documents.find(d => d.documentType === "commercial_invoice");
  const bl = documents.find(d => d.documentType === "bill_of_lading");
  const coo = documents.find(d => d.documentType === "certificate_of_origin");
  const phyto = documents.find(d => d.documentType === "phytosanitary_certificate");
  const pl = documents.find(d => d.documentType === "packing_list");
  const trace = documents.find(d => d.documentType === "traceability_certificate");

  if (invoice && bl) crossValidateInvoiceVsBl(invoice, bl, tolerancePct, results, locale);
  if (invoice && pl) crossValidateInvoiceVsPackingList(invoice, pl, tolerancePct, results, locale);
  if (bl && pl) crossValidateBlVsPackingList(bl, pl, tolerancePct, results, locale);
  if (invoice && insurance) crossValidateInvoiceVsInsurance(invoice, insurance, results, locale);
  if (bl && insurance) crossValidateBlVsInsurance(bl, insurance, results, locale);
  if (coo && phyto) crossValidateCooVsPhyto(coo, phyto, results, locale);
  if (coo && eudr) crossValidateCooVsEudr(coo, eudr, results, locale);
  if (eudr && trace) crossValidateEudrVsTraceability(eudr, trace, results, locale);
  if (quality && weight) crossValidateQualityVsWeight(quality, weight, results, locale);
  if (bl && weight) crossValidateBlVsWeight(bl, weight, results, locale);

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

export function generateCorrectionEmail(lcFields: LcFields, results: CheckResultItem[], locale: string = "en"): { email: string; whatsapp: string } {
  const criticals = results.filter(r => r.severity === "RED");
  if (criticals.length === 0) {
    return { email: "", whatsapp: "" };
  }

  const emailLines: string[] = [];
  emailLines.push(t("lc.correction_subject", locale));
  emailLines.push("");
  emailLines.push(t("lc.correction_greeting", locale, { beneficiary: lcFields.beneficiaryName }));
  emailLines.push("");
  emailLines.push(t("lc.correction_intro", locale, { lcRef: lcFields.lcReference || "(not specified)" }));
  emailLines.push("");
  criticals.forEach((c, i) => {
    emailLines.push(`${i + 1}. ${c.documentType} \u2014 ${c.fieldName}`);
    emailLines.push(t("lc.correction_item_doc_shows", locale, { value: c.documentValue }));
    emailLines.push(t("lc.correction_item_lc_requires", locale, { value: c.lcValue }));
    emailLines.push(t("lc.correction_item_rule", locale, { rule: c.ucpRule }));
    emailLines.push(t("lc.correction_item_amend", locale));
    emailLines.push("");
  });
  emailLines.push(t("lc.correction_closing", locale));
  emailLines.push("");
  emailLines.push(t("lc.correction_regards", locale));

  const waLines: string[] = [];
  waLines.push(t("lc.correction_wa_header", locale));
  waLines.push(`LC Ref: ${lcFields.lcReference || "(not specified)"}`);
  waLines.push("");
  criticals.forEach((c, i) => {
    waLines.push(`${i + 1}. *${c.documentType}* \u2014 ${c.fieldName}`);
    waLines.push(t("lc.correction_wa_shows", locale, { value: c.documentValue }));
    waLines.push(t("lc.correction_wa_lc_requires", locale, { value: c.lcValue }));
    waLines.push(t("lc.correction_wa_amend", locale));
  });
  waLines.push("");
  waLines.push(t("lc.correction_wa_closing", locale));

  return { email: emailLines.join("\n"), whatsapp: waLines.join("\n") };
}
