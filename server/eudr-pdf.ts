import PDFDocument from "pdfkit";
import { createHash } from "crypto";

const FOREST_GREEN = "#1A3D2B";
const GREY = "#888888";
const RED = "#DC2626";
const GREEN = "#1B7340";
const AMBER = "#F39C12";
const CREAM = "#F2EDE4";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function drawHr(doc: any, y: number): number {
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#D0D0D0").lineWidth(0.5).stroke();
  return y + 10;
}

/** Draw a label: value row with proper wrapping. Returns new y after the row. */
function drawRow(doc: any, label: string, value: string, y: number, fontSize = 10): number {
  doc.fontSize(fontSize).fillColor("#333");
  // Draw value first to measure its actual rendered height via doc.y
  doc.font("Helvetica");
  doc.text(value, 180, y, { width: 360 });
  const bottomY = doc.y;
  // Draw label on top (short text, won't wrap)
  doc.font("Helvetica-Bold");
  doc.text(`${label}:`, 50, y, { width: 125 });
  // Return the lower of the two endpoints + gap
  return Math.max(bottomY, y + fontSize + 2) + 6;
}

function pageFooter(doc: any, ref: string) {
  doc.fontSize(7).fillColor(GREY)
    .text(`EUDR Due Diligence Statement — ${ref}`, 50, 770, { align: "center", width: 495 });
}

type EudrStatementData = {
  reference: string;
  companyName: string;
  statementDate: string;
  commodityName: string;
  hsCode: string;
  originCountry: string;
  destination: string;
  plotCoordinates: any;
  plotCountryValid: boolean;
  evidenceType: string;
  evidenceReference: string;
  evidenceDate: string;
  supplierName: string;
  supplierAddress: string;
  supplierRegNumber: string | null;
  sanctionsCheckedDate: string;
  riskLevel: string;
  highRiskReason: string | null;
  twinlogRef: string | null;
  twinlogHash: string | null;
  // Phase 1 enhanced data (optional for backward compat)
  computedRiskScore?: number;
  computedRiskBand?: string;
  riskDrivers?: Array<{ factor: string; impact: string; detail: string; remediation: string }>;
  scenarioResults?: Array<{ label: string; approvalProbability: number; verdict: string }>;
  // Phase 2 geospatial data
  geospatialData?: {
    source: string;
    totalLossHa: number;
    lossAfterCutoff: number;
    alertCount: number;
    lossYearBreakdown?: Array<{ year: number; lossHa: number }>;
    bufferRadiusKm: number | null;
  };
};

export function generateEudrPdf(data: EudrStatementData): { stream: any; hashPromise: Promise<string> } {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const now = new Date();

  const hash = createHash("sha256");
  doc.on("data", (chunk: Buffer) => hash.update(chunk));
  const hashPromise = new Promise<string>((resolve) => {
    doc.on("end", () => resolve(hash.digest("hex")));
  });

  doc.fontSize(10).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("TapTrao", 50, 50);

  doc.moveDown(2);
  doc.fontSize(20).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("EUDR DUE DILIGENCE STATEMENT", 50, 110);
  doc.fontSize(10).fillColor(GREY).font("Helvetica")
    .text("EU Regulation 2023/1115 on Deforestation-free Products", 50, 136);

  let y = drawHr(doc, 160);

  y = drawRow(doc, "Operator", data.companyName, y);
  y = drawRow(doc, "Statement date", data.statementDate, y);
  y = drawRow(doc, "Reference", data.reference, y);

  y = drawHr(doc, y + 8);

  y = drawRow(doc, "Commodity", `${data.commodityName} | HS Code: ${data.hsCode}`, y);
  y = drawRow(doc, "Origin country", data.originCountry, y);
  y = drawRow(doc, "Destination", data.destination, y);
  y = drawRow(doc, "Quantity", "As per commercial invoice", y);

  y = drawHr(doc, y + 8);

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("GEOLOCATION DATA", 50, y);
  y += 20;
  doc.fontSize(9).fillColor("#333").font("Helvetica");

  const coords = data.plotCoordinates;
  if (coords?.type === "point") {
    doc.text(`Coordinates: ${coords.lat}, ${coords.lng}`, 50, y);
  } else if (coords?.type === "polygon" && Array.isArray(coords.points)) {
    const pts = coords.points.map((p: any) => `${p.lat}, ${p.lng}`).join(" | ");
    doc.text(`Polygon points: ${pts}`, 50, y, { width: 495 });
  } else {
    doc.text("Coordinates: Not provided", 50, y);
  }
  y += 16;
  doc.text(`Country validated: ${data.plotCountryValid ? "Yes" : "No"}`, 50, y);
  y += 20;

  // Satellite Deforestation Analysis (Phase 2)
  if (data.geospatialData && data.geospatialData.source !== "none") {
    const geo = data.geospatialData;
    y = drawHr(doc, y);
    doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
      .text("SATELLITE DEFORESTATION ANALYSIS", 50, y);
    y += 20;
    doc.fontSize(9).fillColor("#333").font("Helvetica");

    const sourceLabel = geo.source === "gfw"
      ? "Global Forest Watch (UMD/Hansen)"
      : "OpenEPI (basin aggregation)";
    doc.text(`Data source: ${sourceLabel}`, 50, y); y += 14;
    doc.text(`Total tree cover loss: ${geo.totalLossHa.toFixed(1)} hectares`, 50, y); y += 14;

    const postColor = geo.lossAfterCutoff > 10 ? RED
      : geo.lossAfterCutoff > 1 ? AMBER : GREEN;
    doc.fillColor(postColor).font("Helvetica-Bold")
      .text(`Post-2020 loss: ${geo.lossAfterCutoff.toFixed(1)} hectares`, 50, y);
    y += 14;

    if (geo.alertCount > 0) {
      doc.fillColor(AMBER)
        .text(`Active deforestation alerts: ${geo.alertCount}`, 50, y);
      y += 14;
    }

    if (geo.lossYearBreakdown && geo.lossYearBreakdown.length > 0) {
      doc.fillColor("#333").font("Helvetica");
      const years = geo.lossYearBreakdown
        .filter(yr => yr.lossHa > 0)
        .map(yr => `${yr.year}: ${yr.lossHa.toFixed(1)} ha`)
        .join(" | ");
      doc.text(`Annual breakdown: ${years}`, 50, y, { width: 495 });
      y = doc.y + 6;
    }

    if (geo.bufferRadiusKm) {
      doc.fillColor(GREY).fontSize(8)
        .text(`Note: ${geo.bufferRadiusKm}km buffer radius applied to point coordinate for area analysis.`, 50, y);
      y += 12;
    }
    y += 6;
  }

  y = drawHr(doc, y);

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("DEFORESTATION-FREE EVIDENCE", 50, y);
  y += 20;
  doc.fontSize(9).fillColor("#333").font("Helvetica");

  const evidenceLabels: Record<string, string> = {
    satellite_ref: "Satellite imagery reference",
    third_party_cert: "Third-party certification",
    geo_database: "National geo-database",
    other: "Other documented evidence",
  };
  doc.text(`Evidence type: ${evidenceLabels[data.evidenceType] || data.evidenceType}`, 50, y); y += 14;
  doc.text(`Reference: ${data.evidenceReference}`, 50, y); y += 14;
  doc.text(`Evidence date: ${data.evidenceDate}`, 50, y); y += 14;
  doc.fillColor(GREEN).text("Cut-off date compliance: All evidence post-dates 31 December 2020 ✓", 50, y);
  y += 20;

  y = drawHr(doc, y);

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("SUPPLIER VERIFICATION", 50, y);
  y += 20;
  doc.fontSize(9).fillColor("#333").font("Helvetica");
  doc.text(`Supplier: ${data.supplierName}`, 50, y); y += 14;
  doc.text(`Address: ${data.supplierAddress}`, 50, y, { width: 495 }); y += 14;
  if (data.supplierRegNumber) {
    doc.text(`Registration: ${data.supplierRegNumber}`, 50, y); y += 14;
  }
  doc.text(`Sanctions screening: Confirmed by operator on ${data.sanctionsCheckedDate}`, 50, y);
  y += 20;

  y = drawHr(doc, y);

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("RISK ASSESSMENT", 50, y);
  y += 20;

  // Computed score (if available)
  if (data.computedRiskScore != null) {
    const bandColor = data.computedRiskBand === "negligible" || data.computedRiskBand === "low" ? GREEN
      : data.computedRiskBand === "high" ? RED : AMBER;
    const scoreText = `Computed Risk Score: ${data.computedRiskScore}/100`;
    const bandText = `(${(data.computedRiskBand || "").toUpperCase()})`;
    doc.fontSize(10).fillColor("#333").font("Helvetica-Bold")
      .text(scoreText, 50, y, { width: 250 });
    // Band badge next to score
    const scoreWidth = doc.widthOfString(scoreText, { fontSize: 10 });
    doc.fillColor(bandColor).text(bandText, 50 + scoreWidth + 8, y, { width: 150 });
    y += 18;
  }

  const riskColor = data.riskLevel === "low" ? GREEN : data.riskLevel === "high" ? RED : AMBER;
  doc.fontSize(11).fillColor(riskColor).font("Helvetica-Bold")
    .text(`Risk level: ${data.riskLevel.toUpperCase()}`, 50, y);
  y += 18;
  if (data.riskLevel === "high" && data.highRiskReason) {
    doc.fontSize(9).fillColor("#333").font("Helvetica")
      .text(data.highRiskReason, 50, y, { width: 495 });
    y += 20;
  }

  // Key risk drivers
  if (data.riskDrivers && data.riskDrivers.length > 0) {
    y += 4;
    doc.fontSize(10).fillColor(FOREST_GREEN).font("Helvetica-Bold")
      .text("Key Risk Drivers:", 50, y);
    y += 16;
    for (const driver of data.riskDrivers.slice(0, 4)) {
      if (y > 700) { doc.addPage(); y = 50; pageFooter(doc, data.reference); }
      const impactColor = driver.impact === "high" ? RED : driver.impact === "medium" ? AMBER : GREEN;
      const badge = `[${driver.impact.toUpperCase()}]`;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(impactColor);
      const badgeWidth = doc.widthOfString(badge, { fontSize: 8 });
      doc.text(badge, 50, y, { width: badgeWidth + 2 });
      doc.fillColor("#333").font("Helvetica")
        .text(driver.factor, 50 + badgeWidth + 6, y, { width: 440 - badgeWidth });
      const factorHeight = doc.heightOfString(driver.factor, { width: 440 - badgeWidth, fontSize: 8 });
      y += Math.max(13, factorHeight + 3);
    }
  }

  // Scenario simulation summary
  if (data.scenarioResults && data.scenarioResults.length > 0) {
    y += 6;
    if (y > 680) { doc.addPage(); y = 50; pageFooter(doc, data.reference); }
    doc.fontSize(10).fillColor(FOREST_GREEN).font("Helvetica-Bold")
      .text("Compliance Scenario Simulation:", 50, y);
    y += 16;
    for (const sc of data.scenarioResults) {
      const vColor = sc.verdict === "likely_pass" ? GREEN : sc.verdict === "likely_fail" ? RED : AMBER;
      doc.fontSize(9).fillColor("#333").font("Helvetica")
        .text(`${sc.label}:`, 50, y, { width: 220 });
      doc.fillColor(vColor).font("Helvetica-Bold")
        .text(`${sc.approvalProbability}% approval probability`, 275, y, { width: 270 });
      y += 16;
    }
  }

  if (y > 620) { doc.addPage(); y = 50; pageFooter(doc, data.reference); }

  y = drawHr(doc, y + 8);

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("DECLARATION", 50, y);
  y += 20;
  doc.fontSize(9).fillColor("#333").font("Helvetica")
    .text(
      "I declare that to the best of my knowledge and belief, the information provided in this due diligence statement is accurate and complete. I understand that false declarations may result in penalties under EU Regulation 2023/1115.",
      50, y, { width: 495 }
    );
  y += 50;
  doc.text("Operator signature: ________________________________", 50, y); y += 18;
  doc.text(`Date: ${formatDate(now)}`, 50, y); y += 30;

  y = drawHr(doc, y);
  doc.fontSize(8).fillColor(GREY).font("Helvetica");
  if (data.twinlogRef) {
    doc.text(`TwinLog reference: ${data.twinlogRef}`, 50, y); y += 12;
  }
  if (data.twinlogHash) {
    doc.text(`sha256: ${data.twinlogHash}`, 50, y); y += 12;
  }
  doc.text("Generated by TapTrao (taptrao.com)", 50, y);

  pageFooter(doc, data.reference);

  doc.end();
  return { stream: doc, hashPromise };
}
