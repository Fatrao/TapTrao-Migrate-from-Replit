import type { LcFields, LcDocument, CheckResultItem, LcCheckSummary, CheckSeverity } from "@shared/schema";
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
  };
}

function compareQuantities(lcQty: number, docQty: number, docType: string): CheckResultItem {
  if (docQty === 0) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: "Not specified",
      documentType: docType,
      severity: "AMBER",
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: "Quantity not specified on this document.",
    };
  }
  const diff = Math.abs(docQty - lcQty) / lcQty;
  if (diff === 0) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: String(docQty),
      documentType: docType,
      severity: "GREEN",
      ucpRule: "UCP 600 Art. 14(d)",
      explanation: "Quantity matches LC terms exactly.",
    };
  }
  if (diff <= 0.05) {
    return {
      fieldName: "Quantity",
      lcValue: String(lcQty),
      documentValue: String(docQty),
      documentType: docType,
      severity: "AMBER",
      ucpRule: "ISBP 745",
      explanation: `Quantity difference is ${(diff * 100).toFixed(1)}% (within +/-5%). ISBP 745 tolerance may apply for bulk goods. Check LC for tolerance clause.`,
    };
  }
  return {
    fieldName: "Quantity",
    lcValue: String(lcQty),
    documentValue: String(docQty),
    documentType: docType,
    severity: "RED",
    ucpRule: "UCP 600 Art. 14(d)",
    explanation: `Quantity difference is ${(diff * 100).toFixed(1)}% (exceeds 5% tolerance). Documents are inconsistent. Bank will reject.`,
  };
}

function docTypeLabel(dt: string): string {
  const labels: Record<string, string> = {
    commercial_invoice: "Commercial Invoice",
    bill_of_lading: "Bill of Lading",
    certificate_of_origin: "Certificate of Origin",
    phytosanitary_certificate: "Phytosanitary Certificate",
    packing_list: "Packing List",
    other: "Other Document",
  };
  return labels[dt] || dt;
}

export function runLcCrossCheck(lcFields: LcFields, documents: LcDocument[]): { results: CheckResultItem[]; summary: LcCheckSummary } {
  const results: CheckResultItem[] = [];

  if (!lcFields.lcReference || lcFields.lcReference.trim() === "") {
    results.push({
      fieldName: "LC Reference",
      lcValue: "(empty)",
      documentValue: "N/A",
      documentType: "LC Terms",
      severity: "AMBER",
      ucpRule: "General",
      explanation: "LC reference number is empty. Ensure this is populated for traceability.",
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
        });
      }

      const invAmount = parseNumber(doc.fields.totalAmount || "");
      results.push(compareAmounts(lcFields.totalAmount, invAmount, dtLabel));

      const invQty = parseNumber(doc.fields.quantity || "");
      if (invQty > 0) {
        results.push(compareQuantities(lcFields.quantity, invQty, dtLabel));
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
        });
      }

      const blQty = parseNumber(doc.fields.quantity || "");
      if (blQty > 0) {
        results.push(compareQuantities(lcFields.quantity, blQty, dtLabel));
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
        });
      }
    }

    if (doc.documentType === "packing_list") {
      const plQty = parseNumber(doc.fields.quantity || "");
      if (plQty > 0) {
        results.push(compareQuantities(lcFields.quantity, plQty, dtLabel));
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
        });
      }
    }
  }

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
  emailLines.push(`Subject: URGENT — Document Discrepancies Found — Please Amend`);
  emailLines.push("");
  emailLines.push(`Dear ${lcFields.beneficiaryName},`);
  emailLines.push("");
  emailLines.push(`We have reviewed the documents submitted against LC reference ${lcFields.lcReference || "(not specified)"} and found the following critical discrepancies that will cause the bank to reject the presentation:`);
  emailLines.push("");
  criticals.forEach((c, i) => {
    emailLines.push(`${i + 1}. ${c.documentType} — ${c.fieldName}`);
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
  waLines.push(`*URGENT — Document Discrepancies*`);
  waLines.push(`LC Ref: ${lcFields.lcReference || "(not specified)"}`);
  waLines.push("");
  criticals.forEach((c, i) => {
    waLines.push(`${i + 1}. *${c.documentType}* — ${c.fieldName}`);
    waLines.push(`   Shows: ${c.documentValue}`);
    waLines.push(`   LC requires: ${c.lcValue}`);
    waLines.push(`   _Please amend and reissue._`);
  });
  waLines.push("");
  waLines.push("Please correct and resend ASAP.");

  return { email: emailLines.join("\n"), whatsapp: waLines.join("\n") };
}
