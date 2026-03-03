/**
 * Regulatory Assessment Engine — EUDR + CBAM
 *
 * Shared scoring framework with domain-specific deterministic checks.
 * Pure computation, no DB access — all data is passed in.
 *
 * Architecture: one engine, domain filtering, same scoring function.
 * Scales to FDA / sanctions / dual-use by adding checks + domain.
 */

import type {
  Lookup,
  EudrRecord,
  CbamRecord,
  RegulatoryCheckResult,
  RegulatoryScoreBreakdown,
  RegulatoryTopDriver,
  RegulatoryRiskBand,
} from "@shared/schema";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MAX_DETAIL_LENGTH = 300;

/** EU member state ISO2 codes */
export const EU_COUNTRIES = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
  "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK",
  "SI","ES","SE",
]);

/** EUDR-regulated HS prefixes (Regulation 2023/1115) */
export const EUDR_HS_PREFIXES = [
  "1801","1802","1803","1804","1805",   // cocoa
  "0901",                                // coffee
  "1511","1513",                         // palm oil
  "4001","4005","4006","4007",           // rubber
  "1201","1507",                         // soya
  "0102",                                // cattle
  "4403","4407","4408","4410","4412",    // timber
  "4401","4703","9401","9403",           // wood products / furniture
];

/** CBAM-regulated HS prefixes (transitional phase) */
export const CBAM_HS_PREFIXES = [
  "72","73",    // iron & steel
  "76",         // aluminum
  "31",         // fertilizers
  "28",         // hydrogen (specific codes)
  "25",         // cement (specific codes)
  "2716",       // electricity
];

/** Country bounding boxes (heuristic, for EUDR geolocation check) */
export const COUNTRY_BOUNDING_BOXES: Record<string, { minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  GH: { minLat: 4.73, maxLat: 11.17, minLon: -3.26, maxLon: 1.20 },
  CI: { minLat: 4.36, maxLat: 10.74, minLon: -8.60, maxLon: -2.49 },
  ET: { minLat: 3.40, maxLat: 14.89, minLon: 32.99, maxLon: 47.99 },
  KE: { minLat: -4.68, maxLat: 5.02, minLon: 33.91, maxLon: 41.91 },
  TZ: { minLat: -11.75, maxLat: -0.99, minLon: 29.33, maxLon: 40.44 },
  UG: { minLat: -1.48, maxLat: 4.23, minLon: 29.57, maxLon: 35.04 },
  NG: { minLat: 4.27, maxLat: 13.89, minLon: 2.69, maxLon: 14.68 },
  CM: { minLat: 1.65, maxLat: 13.08, minLon: 8.49, maxLon: 16.19 },
  CD: { minLat: -13.46, maxLat: 5.39, minLon: 12.18, maxLon: 31.31 },
  MZ: { minLat: -26.87, maxLat: -10.47, minLon: 30.22, maxLon: 40.85 },
  ZA: { minLat: -34.84, maxLat: -22.13, minLon: 16.34, maxLon: 32.89 },
  SN: { minLat: 12.31, maxLat: 16.69, minLon: -17.54, maxLon: -11.36 },
  ML: { minLat: 10.16, maxLat: 25.00, minLon: -12.24, maxLon: 4.27 },
  BF: { minLat: 9.39, maxLat: 15.08, minLon: -5.52, maxLon: 2.41 },
  GN: { minLat: 7.19, maxLat: 12.68, minLon: -15.08, maxLon: -7.64 },
  SL: { minLat: 6.93, maxLat: 10.00, minLon: -13.30, maxLon: -10.27 },
  LR: { minLat: 4.35, maxLat: 8.55, minLon: -11.49, maxLon: -7.37 },
  TG: { minLat: 6.10, maxLat: 11.14, minLon: -0.15, maxLon: 1.81 },
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function cap(s: string): string {
  return s.length > MAX_DETAIL_LENGTH ? s.slice(0, MAX_DETAIL_LENGTH - 3) + "..." : s;
}

function isEuDestination(iso2: string): boolean {
  return EU_COUNTRIES.has(iso2?.toUpperCase());
}

function hsMatchesAny(hs: string | null, prefixes: string[]): boolean {
  if (!hs) return false;
  const clean = hs.replace(/\./g, "").trim();
  return prefixes.some(p => clean.startsWith(p));
}

type Coord = { lat: number; lng: number };

function parseCoords(plotCoordinates: unknown): Coord[] {
  if (!plotCoordinates) return [];
  if (Array.isArray(plotCoordinates)) {
    return plotCoordinates
      .map((p: any) => ({ lat: Number(p.lat ?? p.latitude), lng: Number(p.lng ?? p.lon ?? p.longitude) }))
      .filter(c => !isNaN(c.lat) && !isNaN(c.lng));
  }
  // Single point object
  const p = plotCoordinates as any;
  if (p.lat !== undefined && p.lng !== undefined) {
    const c = { lat: Number(p.lat), lng: Number(p.lng) };
    return isNaN(c.lat) || isNaN(c.lng) ? [] : [c];
  }
  // Nested { type, points } format
  if (p.points && Array.isArray(p.points)) return parseCoords(p.points);
  if (p.type === "point" && p.lat !== undefined) {
    const c = { lat: Number(p.lat), lng: Number(p.lng) };
    return isNaN(c.lat) || isNaN(c.lng) ? [] : [c];
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════
// SHARED SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════

export function computeRegulatoryScore(checks: RegulatoryCheckResult[]): {
  score: number;
  band: RegulatoryRiskBand;
  breakdown: RegulatoryScoreBreakdown;
  topDrivers: RegulatoryTopDriver[];
} {
  let bucketB = 0; // deterministic integrity
  const failedChecks: { id: string; points: number; severity: "critical" | "warning"; detail: string; fix: string }[] = [];

  for (const c of checks) {
    if (c.passed) continue;
    const pts = (c.severity === "critical" ? 12 : 6) * c.weight;
    bucketB += pts;
    failedChecks.push({ id: c.id, points: pts, severity: c.severity, detail: c.detail, fix: c.fixSuggestion ?? "Review the relevant documents." });
  }

  const cappedB = Math.min(30, bucketB);
  // For now, buckets A/C/D are folded into B via the check weights.
  // When cross-doc pairwise data is available, split them out.
  const breakdown: RegulatoryScoreBreakdown = {
    completeness: 0,
    deterministic: cappedB,
    crossDocument: 0,
    mentions: 0,
  };

  const raw = 5 + cappedB;
  const score = Math.min(100, Math.round(raw));

  const band: RegulatoryRiskBand =
    score < 20 ? "negligible"
    : score < 40 ? "low"
    : score < 70 ? "medium"
    : "high";

  const topDrivers: RegulatoryTopDriver[] = failedChecks
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map(f => ({
      reason: cap(f.detail),
      severity: f.severity,
      points: Math.round(f.points * 10) / 10,
      fix: cap(f.fix),
    }));

  return { score, band, breakdown, topDrivers };
}

// ═══════════════════════════════════════════════════════════════
// EUDR CHECKS
// ═══════════════════════════════════════════════════════════════

function mk(
  id: string, domain: "eudr" | "cbam", group: string, label: string,
  severity: "critical" | "warning", weight: number,
  passed: boolean, detail: string, fixSuggestion?: string,
): RegulatoryCheckResult {
  return { id, domain, group, label, severity, weight, passed, detail: cap(detail), fixSuggestion: fixSuggestion ? cap(fixSuggestion) : undefined };
}

function runEudrPlotChecks(eudr: EudrRecord | null): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];
  const coords = parseCoords(eudr?.plotCoordinates);

  // 1. Geolocation present
  results.push(mk(
    "eudr_geolocation_present", "eudr", "plot", "Geolocation data present",
    "critical", 2.0,
    coords.length > 0,
    coords.length > 0
      ? `${coords.length} coordinate point(s) found.`
      : "No geolocation coordinates provided. Annex II requires plot geolocation.",
    "Enter plot coordinates in the Geolocation section.",
  ));

  // 2. Format valid
  if (coords.length > 0) {
    const allValid = coords.every(c => c.lat >= -90 && c.lat <= 90 && c.lng >= -180 && c.lng <= 180);
    const polygonOk = coords.length < 3 || coords.length >= 3; // point or valid polygon
    results.push(mk(
      "eudr_geolocation_format_valid", "eudr", "plot", "Coordinate format valid",
      "critical", 1.5,
      allValid && polygonOk,
      allValid
        ? "All coordinates have valid lat/lon ranges."
        : "One or more coordinates have invalid ranges (lat must be -90 to 90, lon -180 to 180).",
      "Correct coordinate values in the Geolocation section.",
    ));
  }

  // 3. Country consistency (heuristic bounding box)
  if (coords.length > 0 && eudr?.plotCountryIso2) {
    const box = COUNTRY_BOUNDING_BOXES[eudr.plotCountryIso2.toUpperCase()];
    if (box) {
      const outside = coords.filter(c =>
        c.lat < box.minLat || c.lat > box.maxLat || c.lng < box.minLon || c.lng > box.maxLon
      );
      results.push(mk(
        "eudr_geolocation_country_consistency", "eudr", "plot", "Coordinates within declared country",
        "critical", 1.5,
        outside.length === 0,
        outside.length === 0
          ? `All coordinates fall within ${eudr.plotCountryIso2} bounding box.`
          : `${outside.length} coordinate(s) appear outside ${eudr.plotCountryIso2} bounding box (heuristic — please verify).`,
        "Verify that plot coordinates match the declared country of production.",
      ));
    }
  }

  // 4. Duplicate plot detection
  if (coords.length > 1) {
    const seen = new Set<string>();
    let dupes = 0;
    for (const c of coords) {
      const key = `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
      if (seen.has(key)) dupes++;
      seen.add(key);
    }
    results.push(mk(
      "eudr_duplicate_plot_detection", "eudr", "plot", "No duplicate plot coordinates",
      "warning", 1.0,
      dupes === 0,
      dupes === 0
        ? "No duplicate coordinates detected."
        : `${dupes} duplicate coordinate(s) found — may indicate poor traceability.`,
      "Review plot data for duplicates.",
    ));
  }

  return results;
}

function runEudrTimelineChecks(eudr: EudrRecord | null, lookup: Lookup): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // 5. Production/evidence date not in future
  if (eudr?.evidenceDate) {
    const notFuture = eudr.evidenceDate <= today;
    results.push(mk(
      "eudr_production_date_not_future", "eudr", "timeline", "Evidence date not in future",
      "critical", 1.0,
      notFuture,
      notFuture
        ? `Evidence date ${eudr.evidenceDate} is valid.`
        : `Evidence date ${eudr.evidenceDate} is in the future.`,
      "Correct the evidence date.",
    ));
  } else {
    results.push(mk(
      "eudr_production_date_not_future", "eudr", "timeline", "Evidence date not in future",
      "critical", 1.0, false,
      "No evidence date provided.",
      "Enter an evidence date in the Evidence section.",
    ));
  }

  // 6. Deforestation cutoff valid (deforestation-free since ≤ 2020-12-31)
  if (eudr?.cutoffDate) {
    const cutoffOk = eudr.cutoffDate <= "2020-12-31";
    results.push(mk(
      "eudr_deforestation_cutoff_valid", "eudr", "timeline", "Deforestation-free cutoff valid",
      "critical", 1.5,
      cutoffOk,
      cutoffOk
        ? `Cutoff date ${eudr.cutoffDate} meets EUDR baseline (≤ 31 Dec 2020).`
        : `Cutoff date ${eudr.cutoffDate} is after the EUDR baseline of 31 Dec 2020.`,
      "The deforestation-free date must be on or before 31 December 2020.",
    ));
  } else {
    results.push(mk(
      "eudr_deforestation_cutoff_valid", "eudr", "timeline", "Deforestation-free cutoff valid",
      "critical", 1.5, false,
      "No deforestation cutoff date set.",
      "Verify the cutoff date in the EUDR record.",
    ));
  }

  // 7. Evidence date before trade/shipment date
  if (eudr?.evidenceDate && lookup.createdAt) {
    const tradeDate = new Date(lookup.createdAt).toISOString().slice(0, 10);
    const ok = eudr.evidenceDate <= tradeDate;
    results.push(mk(
      "eudr_production_before_shipment", "eudr", "timeline", "Evidence predates trade",
      "critical", 1.0,
      ok,
      ok
        ? "Evidence date is before or on the trade date."
        : `Evidence date ${eudr.evidenceDate} is after trade date ${tradeDate}.`,
      "Ensure evidence is obtained before the shipment.",
    ));
  }

  // 8. DDS created before trade (warning)
  if (eudr?.createdAt && lookup.createdAt) {
    const ddsDate = new Date(eudr.createdAt).toISOString().slice(0, 10);
    const tradeDate = new Date(lookup.createdAt).toISOString().slice(0, 10);
    const ok = ddsDate <= tradeDate;
    results.push(mk(
      "eudr_dds_issue_before_shipment", "eudr", "timeline", "DDS issued before shipment",
      "warning", 1.0,
      ok,
      ok
        ? "DDS record created before or on the trade date."
        : `DDS created ${ddsDate} after trade date ${tradeDate}.`,
      "Due diligence should be completed before shipment.",
    ));
  }

  return results;
}

function runEudrIdentityChecks(eudr: EudrRecord | null, crossChecks: any[]): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 9. Operator matches LC — look for cross-check results with EUDR operator
  const operatorCheck = crossChecks.find((c: any) =>
    c.documentType?.toLowerCase?.()?.includes?.("eudr") &&
    c.fieldName?.toLowerCase?.()?.includes?.("operator")
  );
  if (operatorCheck) {
    const passed = operatorCheck.severity === "GREEN";
    results.push(mk(
      "eudr_operator_matches_lc", "eudr", "identity", "Operator matches LC applicant",
      "critical", 1.0,
      passed,
      passed
        ? "Operator name matches LC applicant."
        : `Operator mismatch: LC "${operatorCheck.lcValue}" vs DDS "${operatorCheck.documentValue}".`,
      "Ensure the DDS operator matches the LC applicant name.",
    ));
  }

  // 10. Exporter matches COO
  const exporterCheck = crossChecks.find((c: any) =>
    c.documentType?.toLowerCase?.()?.includes?.("eudr") &&
    c.fieldName?.toLowerCase?.()?.includes?.("exporter")
  );
  if (exporterCheck) {
    const passed = exporterCheck.severity === "GREEN";
    results.push(mk(
      "eudr_exporter_matches_coo", "eudr", "identity", "Exporter matches COO",
      "critical", 1.5,
      passed,
      passed
        ? "Exporter name is consistent with Certificate of Origin."
        : `Exporter mismatch: COO "${exporterCheck.lcValue}" vs DDS "${exporterCheck.documentValue}".`,
      "Verify exporter identity across DDS and Certificate of Origin.",
    ));
  }

  // 11. Supply chain continuity (supplier declared)
  const hasSupplier = !!eudr?.supplierName?.trim();
  results.push(mk(
    "eudr_supply_chain_continuity", "eudr", "identity", "Supplier identity declared",
    "warning", 1.0,
    hasSupplier,
    hasSupplier
      ? `Supplier: ${eudr!.supplierName}`
      : "No supplier name declared. Supply chain traceability is incomplete.",
    "Enter supplier details in the Supplier section.",
  ));

  return results;
}

function runEudrProductChecks(lookup: Lookup, crossChecks: any[]): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 12. HS code match across documents
  const hsCheck = crossChecks.find((c: any) =>
    c.documentType?.toLowerCase?.()?.includes?.("eudr") &&
    c.fieldName?.toLowerCase?.()?.includes?.("hs")
  );
  if (hsCheck) {
    const passed = hsCheck.severity === "GREEN";
    results.push(mk(
      "eudr_hs_code_match", "eudr", "product", "HS code consistent across documents",
      "critical", 1.5,
      passed,
      passed
        ? `HS code matches: ${hsCheck.lcValue}`
        : `HS mismatch: LC "${hsCheck.lcValue}" vs DDS "${hsCheck.documentValue}".`,
      "Ensure the same HS code is declared on all documents.",
    ));
  } else {
    // No cross-check available — check if HS is EUDR-regulated
    const inScope = hsMatchesAny(lookup.hsCode, EUDR_HS_PREFIXES);
    results.push(mk(
      "eudr_hs_code_match", "eudr", "product", "HS code in EUDR scope",
      "critical", 1.5,
      inScope,
      inScope
        ? `HS ${lookup.hsCode} is within EUDR-regulated categories.`
        : `HS ${lookup.hsCode} may not be EUDR-regulated. Verify applicability.`,
      "Confirm the HS code against EUDR Annex I.",
    ));
  }

  // 13. Product description consistency
  const descCheck = crossChecks.find((c: any) =>
    c.documentType?.toLowerCase?.()?.includes?.("eudr") &&
    c.fieldName?.toLowerCase?.()?.includes?.("description")
  );
  if (descCheck) {
    const passed = descCheck.severity === "GREEN";
    results.push(mk(
      "eudr_product_description_consistency", "eudr", "product", "Product description consistent",
      "warning", 1.0,
      passed,
      passed
        ? "Product descriptions match across documents."
        : `Description variance detected between documents.`,
      "Review product descriptions for consistency.",
    ));
  }

  return results;
}

function runEudrQuantityChecks(eudr: EudrRecord | null, crossChecks: any[]): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 14. Quantity consistency (from cross-checks, 2% tolerance)
  const qtyCheck = crossChecks.find((c: any) =>
    c.fieldName?.toLowerCase?.()?.includes?.("quantity") &&
    c.checkCategory === "cross_document"
  );
  if (qtyCheck) {
    const passed = qtyCheck.severity === "GREEN";
    results.push(mk(
      "eudr_quantity_consistency", "eudr", "quantity", "Quantity consistent across documents",
      "critical", 1.5,
      passed,
      passed
        ? "Quantity values match within tolerance."
        : `Quantity discrepancy: "${qtyCheck.lcValue}" vs "${qtyCheck.documentValue}".`,
      "Ensure declared quantities are consistent (within 2% tolerance).",
    ));
  }

  // 15. Plot quantity plausibility
  const coords = parseCoords(eudr?.plotCoordinates);
  if (coords.length > 0 && qtyCheck) {
    // Heuristic: very large quantity with very few plots
    const qtyStr = (qtyCheck.lcValue ?? "").replace(/[^0-9.]/g, "");
    const qty = parseFloat(qtyStr);
    if (!isNaN(qty) && qty > 500000 && coords.length <= 1) {
      results.push(mk(
        "eudr_plot_quantity_plausibility", "eudr", "quantity", "Plot count vs quantity plausible",
        "warning", 1.0, false,
        `Large quantity (${qty} kg) declared with only ${coords.length} plot — may indicate insufficient traceability.`,
        "Provide additional plot coordinates for large shipments.",
      ));
    } else {
      results.push(mk(
        "eudr_plot_quantity_plausibility", "eudr", "quantity", "Plot count vs quantity plausible",
        "warning", 1.0, true,
        `${coords.length} plot(s) for declared quantity — appears plausible.`,
      ));
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// CBAM CHECKS
// ═══════════════════════════════════════════════════════════════

function runCbamEmissionsChecks(cbam: CbamRecord | null): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 2. Embedded emissions declared
  const hasEmissions = cbam?.embeddedEmissions != null && cbam.embeddedEmissions !== "";
  results.push(mk(
    "cbam_embedded_emissions_declared", "cbam", "emissions", "Embedded emissions declared",
    "critical", 2.0,
    hasEmissions,
    hasEmissions
      ? `Embedded emissions: ${cbam!.embeddedEmissions} tCO₂e/ton`
      : "No embedded emissions value declared. This is the core CBAM data requirement.",
    "Enter the embedded emissions (tCO₂e per ton) in the Emissions section.",
  ));

  // 3. Emissions numeric and positive
  if (hasEmissions) {
    const val = parseFloat(String(cbam!.embeddedEmissions));
    const ok = !isNaN(val) && val > 0;
    results.push(mk(
      "cbam_emissions_numeric_positive", "cbam", "emissions", "Emissions value valid",
      "critical", 1.5,
      ok,
      ok
        ? `Emissions value ${val} tCO₂e/ton is valid.`
        : `Emissions value "${cbam!.embeddedEmissions}" is not a valid positive number.`,
      "Ensure emissions are a positive numeric value.",
    ));
  }

  return results;
}

function runCbamQuantityChecks(cbam: CbamRecord | null): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 4. Quantity declared
  const hasQty = cbam?.quantity != null && cbam.quantity !== "";
  const qty = hasQty ? parseFloat(String(cbam!.quantity)) : NaN;
  results.push(mk(
    "cbam_quantity_declared", "cbam", "quantity", "Quantity declared",
    "critical", 1.5,
    hasQty && !isNaN(qty) && qty > 0,
    hasQty && !isNaN(qty) && qty > 0
      ? `Quantity: ${qty} tons`
      : "No valid quantity declared.",
    "Enter the shipment quantity (in tons) in the Emissions section.",
  ));

  // 5. Emissions × quantity plausibility
  if (hasQty && cbam?.embeddedEmissions) {
    const emissions = parseFloat(String(cbam.embeddedEmissions));
    if (!isNaN(emissions) && !isNaN(qty) && qty > 0 && emissions > 0) {
      const total = emissions * qty;
      // Rough plausibility: steel ~1.5-2.5 tCO₂e/ton, aluminum ~5-15 tCO₂e/ton
      // Flag if total > 1M tCO₂e (extremely large) or emissions > 50 tCO₂e/ton
      const suspicious = emissions > 50 || total > 1000000;
      results.push(mk(
        "cbam_emissions_quantity_plausibility", "cbam", "quantity", "Emissions × quantity plausible",
        "critical", 1.5,
        !suspicious,
        !suspicious
          ? `Total embedded emissions: ${total.toFixed(1)} tCO₂e (${emissions} × ${qty}) — within plausible range.`
          : `Total embedded emissions: ${total.toFixed(1)} tCO₂e appears unusually high. Verify values.`,
        "Review emissions per ton and quantity for accuracy.",
      ));
    }
  }

  return results;
}

function runCbamInstallationChecks(cbam: CbamRecord | null, originIso2: string): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 6. Installation identified
  const hasInstallation = !!cbam?.installationName?.trim();
  results.push(mk(
    "cbam_installation_identified", "cbam", "installation", "Production installation identified",
    "warning", 1.2,
    hasInstallation,
    hasInstallation
      ? `Installation: ${cbam!.installationName}`
      : "No production installation identified. Required for full CBAM reporting.",
    "Enter the production installation name and country.",
  ));

  // 7. Production country match
  if (cbam?.installationCountry && originIso2) {
    const match = cbam.installationCountry.toUpperCase() === originIso2.toUpperCase();
    results.push(mk(
      "cbam_production_country_match", "cbam", "identity", "Installation country matches origin",
      "critical", 1.5,
      match,
      match
        ? `Installation country ${cbam.installationCountry} matches trade origin.`
        : `Installation country ${cbam.installationCountry} differs from trade origin ${originIso2}.`,
      "Verify that the production installation country matches the country of origin.",
    ));
  }

  // 8. Reporting period declared
  const hasPeriod = !!cbam?.reportingPeriod?.trim();
  results.push(mk(
    "cbam_reporting_period_declared", "cbam", "timeline", "Reporting period declared",
    "warning", 1.0,
    hasPeriod,
    hasPeriod
      ? `Reporting period: ${cbam!.reportingPeriod}`
      : "No reporting period specified.",
    "Enter the CBAM reporting quarter (e.g. 2026-Q1).",
  ));

  return results;
}

function runCbamFinancialChecks(cbam: CbamRecord | null): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 9. Carbon price declared
  const hasPrice = cbam?.carbonPricePaid != null && cbam.carbonPricePaid !== "";
  results.push(mk(
    "cbam_carbon_price_declared", "cbam", "financial", "Carbon price declared",
    "warning", 1.0,
    hasPrice,
    hasPrice
      ? `Carbon price paid: ${cbam!.carbonPricePaid} ${cbam!.carbonPriceCurrency ?? "EUR"}/tCO₂e`
      : "No carbon price declared. If a carbon price was paid in the country of origin, it should be reported.",
    "Declare the carbon price paid in the country of origin, if applicable.",
  ));

  return results;
}

function runCbamDocConsistencyCheck(lookup: Lookup, crossChecks: any[]): RegulatoryCheckResult[] {
  const results: RegulatoryCheckResult[] = [];

  // 10. Document consistency (HS + quantity across invoice/BL)
  const hsIssues = crossChecks.filter((c: any) =>
    c.fieldName?.toLowerCase?.()?.includes?.("hs") && c.severity !== "GREEN"
  );
  const qtyIssues = crossChecks.filter((c: any) =>
    c.fieldName?.toLowerCase?.()?.includes?.("quantity") &&
    c.checkCategory === "cross_document" &&
    c.severity !== "GREEN"
  );

  const hasIssues = hsIssues.length > 0 || qtyIssues.length > 0;
  results.push(mk(
    "cbam_document_consistency", "cbam", "product", "HS and quantity consistent across documents",
    "critical", 1.5,
    !hasIssues,
    !hasIssues
      ? "HS code and quantity are consistent across supporting documents."
      : `${hsIssues.length} HS issue(s) and ${qtyIssues.length} quantity issue(s) found in cross-document checks.`,
    "Review HS codes and quantities across invoice, bill of lading, and emissions documentation.",
  ));

  return results;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINTS
// ═══════════════════════════════════════════════════════════════

export type EudrAssessmentInput = {
  lookup: Lookup;
  eudrRecord: EudrRecord | null;
  lcCheck: any | null;                   // LcCheck (using any to avoid circular import)
  crossCheckResults: any[];              // CheckResultItem[]
  commodityTriggersEudr: boolean;
  destinationIso2: string;
};

export type AssessmentOutput = {
  applicable: boolean;
  score: number | null;
  band: RegulatoryRiskBand | null;
  canConcludeNegligibleRisk: boolean;
  breakdown: RegulatoryScoreBreakdown | null;
  topDrivers: RegulatoryTopDriver[];
  checksRun: RegulatoryCheckResult[];
};

export function runEudrAssessment(input: EudrAssessmentInput): AssessmentOutput {
  const { lookup, eudrRecord, crossCheckResults, commodityTriggersEudr, destinationIso2 } = input;

  // Applicability: commodity triggers EUDR + destination is EU
  const applicable = commodityTriggersEudr && (isEuDestination(destinationIso2) || destinationIso2?.toUpperCase() === "GB");
  if (!applicable) {
    return { applicable: false, score: null, band: null, canConcludeNegligibleRisk: false, breakdown: null, topDrivers: [], checksRun: [] };
  }

  // Run all 15 checks
  const checks: RegulatoryCheckResult[] = [
    ...runEudrPlotChecks(eudrRecord),
    ...runEudrTimelineChecks(eudrRecord, lookup),
    ...runEudrIdentityChecks(eudrRecord, crossCheckResults),
    ...runEudrProductChecks(lookup, crossCheckResults),
    ...runEudrQuantityChecks(eudrRecord, crossCheckResults),
  ];

  const { score, band, breakdown, topDrivers } = computeRegulatoryScore(checks);

  // Cannot conclude negligible risk if any critical check fails
  const canConcludeNegligibleRisk = !checks.some(c => c.severity === "critical" && !c.passed);

  return { applicable: true, score, band, canConcludeNegligibleRisk, breakdown, topDrivers, checksRun: checks };
}

export type CbamAssessmentInput = {
  lookup: Lookup;
  cbamRecord: CbamRecord | null;
  lcCheck: any | null;
  crossCheckResults: any[];
  commodityTriggersCbam: boolean;
  destinationIso2: string;
};

export function runCbamAssessment(input: CbamAssessmentInput): AssessmentOutput & { canConcludeCbamCompliant: boolean } {
  const { lookup, cbamRecord, crossCheckResults, commodityTriggersCbam, destinationIso2 } = input;

  // Applicability: CBAM scope + EU destination
  const applicable = commodityTriggersCbam && isEuDestination(destinationIso2);
  if (!applicable) {
    return { applicable: false, score: null, band: null, canConcludeNegligibleRisk: false, canConcludeCbamCompliant: false, breakdown: null, topDrivers: [], checksRun: [] };
  }

  // Resolve origin ISO2 for installation country check
  const originIso2 = (lookup as any).originIso2 ?? "";

  // 1. HS in scope
  const hsInScope = hsMatchesAny(lookup.hsCode, CBAM_HS_PREFIXES);
  const hsCheck = mk(
    "cbam_hs_in_scope", "cbam", "product", "HS code in CBAM scope",
    "critical", 1.5,
    hsInScope,
    hsInScope
      ? `HS ${lookup.hsCode} is within CBAM-regulated categories.`
      : `HS ${lookup.hsCode} may not be in CBAM scope. Verify applicability.`,
    "Confirm the HS code against CBAM Annex I.",
  );

  const checks: RegulatoryCheckResult[] = [
    hsCheck,
    ...runCbamEmissionsChecks(cbamRecord),
    ...runCbamQuantityChecks(cbamRecord),
    ...runCbamInstallationChecks(cbamRecord, originIso2),
    ...runCbamFinancialChecks(cbamRecord),
    ...runCbamDocConsistencyCheck(lookup, crossCheckResults),
  ];

  const { score, band, breakdown, topDrivers } = computeRegulatoryScore(checks);

  const canConcludeCbamCompliant = !checks.some(c => c.severity === "critical" && !c.passed);

  return {
    applicable: true, score, band,
    canConcludeNegligibleRisk: canConcludeCbamCompliant,
    canConcludeCbamCompliant,
    breakdown, topDrivers, checksRun: checks,
  };
}
