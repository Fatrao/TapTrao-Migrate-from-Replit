import PDFDocument from "pdfkit";
import { createHash } from "crypto";
import type { CbamLevyBreakdown, CbamDeadlineInfo, CbamCostScenario } from "./regulatory-assess";

const FOREST_GREEN = "#1A3D2B";
const GREY = "#888888";
const RED = "#DC2626";
const GREEN = "#1B7340";
const AMBER = "#F39C12";
const BLUE = "#2563EB";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function drawHr(doc: any, y: number): number {
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#D0D0D0").lineWidth(0.5).stroke();
  return y + 10;
}

function drawRow(doc: any, label: string, value: string, y: number, fontSize = 10): number {
  doc.fontSize(fontSize).fillColor("#333");
  doc.font("Helvetica");
  doc.text(value, 180, y, { width: 360 });
  const bottomY = doc.y;
  doc.font("Helvetica-Bold");
  doc.text(`${label}:`, 50, y, { width: 125 });
  return Math.max(bottomY, y + fontSize + 2) + 6;
}

function pageFooter(doc: any, ref: string) {
  doc.fontSize(7).fillColor(GREY)
    .text(`CBAM Compliance Statement — ${ref}`, 50, 770, { align: "center", width: 495 });
}

export type CbamStatementData = {
  reference: string;
  companyName: string;
  statementDate: string;
  commodityName: string;
  hsCode: string;
  originCountry: string;
  destination: string;
  // Emissions
  embeddedEmissions: number | null;
  emissionsSource: "actual" | "default";
  quantity: number | null;
  totalEmissions: number | null;
  // Installation
  installationName: string | null;
  installationCountry: string | null;
  reportingPeriod: string;
  // Levy
  levyBreakdown: CbamLevyBreakdown | null;
  // Deadlines
  deadlines: CbamDeadlineInfo | null;
  // Assessment
  computedScore?: number;
  computedBand?: string;
  canConcludeCbamCompliant?: boolean;
  riskDrivers?: Array<{ reason: string; severity: string; points: number; fix: string }>;
  // Cost scenarios
  costScenarios?: CbamCostScenario[] | null;
  // Integrity
  twinlogRef: string | null;
  twinlogHash: string | null;
};

export function generateCbamPdf(data: CbamStatementData): { stream: any; hashPromise: Promise<string> } {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const now = new Date();

  const hash = createHash("sha256");
  doc.on("data", (chunk: Buffer) => hash.update(chunk));
  const hashPromise = new Promise<string>((resolve) => {
    doc.on("end", () => resolve(hash.digest("hex")));
  });

  // ── Header ──
  doc.fontSize(10).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("TapTrao", 50, 50);

  doc.moveDown(2);
  doc.fontSize(20).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("CBAM COMPLIANCE STATEMENT", 50, 110);
  doc.fontSize(10).fillColor(GREY).font("Helvetica")
    .text("EU Regulation 2023/956 — Carbon Border Adjustment Mechanism", 50, 136);

  let y = drawHr(doc, 160);

  // ── 1. Operator ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("1. Operator / Declarant", 50, y);
  y += 18;
  y = drawRow(doc, "Company", data.companyName, y);
  y = drawRow(doc, "Statement date", data.statementDate, y);
  y = drawRow(doc, "Reference", data.reference, y);
  y = drawHr(doc, y + 4);

  // ── 2. Product ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("2. Product Details", 50, y);
  y += 18;
  y = drawRow(doc, "Commodity", data.commodityName, y);
  y = drawRow(doc, "HS Code", data.hsCode, y);
  y = drawRow(doc, "Origin", data.originCountry, y);
  y = drawRow(doc, "Destination", data.destination, y);
  if (data.quantity != null) {
    y = drawRow(doc, "Quantity", `${data.quantity.toLocaleString()} tons`, y);
  }
  y = drawHr(doc, y + 4);

  // ── 3. Embedded Emissions ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("3. Embedded Emissions", 50, y);
  y += 18;
  if (data.embeddedEmissions != null) {
    y = drawRow(doc, "Emissions factor", `${data.embeddedEmissions} tCO₂e/ton`, y);
    y = drawRow(doc, "Data source", data.emissionsSource === "actual" ? "Actual supplier data" : "Default factor (CBAM Annex III)", y);
    if (data.totalEmissions != null) {
      y = drawRow(doc, "Total emissions", `${data.totalEmissions.toLocaleString()} tCO₂e`, y);
    }
  } else {
    doc.fontSize(10).fillColor(GREY).font("Helvetica")
      .text("No emissions data declared.", 50, y);
    y += 14;
  }
  y = drawHr(doc, y + 4);

  // ── 4. Installation ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("4. Installation Details", 50, y);
  y += 18;
  y = drawRow(doc, "Installation", data.installationName || "Not specified", y);
  y = drawRow(doc, "Country", data.installationCountry || "Not specified", y);
  y = drawRow(doc, "Reporting period", data.reportingPeriod, y);
  y = drawHr(doc, y + 4);

  // ── 5. Carbon Levy Calculation ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("5. Carbon Levy Calculation", 50, y);
  y += 18;

  if (data.levyBreakdown) {
    const lb = data.levyBreakdown;
    y = drawRow(doc, "EU ETS price", `€${lb.etsPrice}/tCO₂e (as of ${lb.etsPriceDate})`, y);
    y = drawRow(doc, "Gross levy", `€${lb.grossLevy.toLocaleString()}`, y);

    if (lb.originCarbonCredit > 0) {
      y = drawRow(doc, "Origin carbon credit", `–€${lb.originCarbonCredit.toLocaleString()} (${lb.originCountryIso2} @ €${lb.originCarbonPrice}/tCO₂e)`, y);
    }

    // Net levy — bold and larger
    doc.fontSize(11).fillColor(FOREST_GREEN).font("Helvetica-Bold")
      .text("Net levy payable:", 50, y);
    doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold")
      .text(`€${lb.netLevy.toLocaleString()}`, 180, y - 2);
    y += 22;

    y = drawRow(doc, "Per ton", `€${lb.perTonLevy}/ton`, y);
  } else {
    doc.fontSize(10).fillColor(GREY).font("Helvetica")
      .text("Levy calculation requires emissions data and quantity.", 50, y);
    y += 14;
  }
  y = drawHr(doc, y + 4);

  // ── 6. Reporting Deadlines ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("6. Reporting Deadlines", 50, y);
  y += 18;

  if (data.deadlines) {
    y = drawRow(doc, "Quarterly report", data.deadlines.quarterlyReportDue, y);
    y = drawRow(doc, "Annual declaration", data.deadlines.annualDeclarationDue, y);
    if (data.deadlines.ukCbamNote) {
      doc.fontSize(9).fillColor(AMBER).font("Helvetica")
        .text(`UK: ${data.deadlines.ukCbamNote}`, 50, y, { width: 495 });
      y = doc.y + 8;
    }
  } else {
    y = drawRow(doc, "Quarterly report", "Not determined", y);
  }
  y = drawHr(doc, y + 4);

  // ── 7. Risk Assessment ──
  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("7. Compliance Assessment", 50, y);
  y += 18;

  if (data.computedScore != null) {
    const bandColor = data.computedBand === "negligible" ? GREEN : data.computedBand === "low" ? AMBER : data.computedBand === "medium" ? AMBER : RED;
    y = drawRow(doc, "Compliance score", `${data.computedScore} / 100`, y);

    doc.fontSize(10).fillColor(bandColor).font("Helvetica-Bold")
      .text(`Band: ${(data.computedBand || "").toUpperCase()}`, 180, y);
    y += 16;

    if (data.canConcludeCbamCompliant != null) {
      const verdict = data.canConcludeCbamCompliant ? "COMPLIANT" : "COMPLIANCE ISSUES DETECTED";
      const verdictColor = data.canConcludeCbamCompliant ? GREEN : RED;
      doc.fontSize(11).fillColor(verdictColor).font("Helvetica-Bold")
        .text(verdict, 180, y);
      y += 18;
    }

    // Top risk drivers
    if (data.riskDrivers && data.riskDrivers.length > 0) {
      y += 4;
      doc.fontSize(10).fillColor("#333").font("Helvetica-Bold")
        .text("Key risk drivers:", 50, y);
      y += 14;
      for (const driver of data.riskDrivers.slice(0, 4)) {
        const impactColor = driver.severity === "critical" ? RED : AMBER;
        doc.fontSize(9).fillColor(impactColor).font("Helvetica-Bold")
          .text(`[${driver.severity.toUpperCase()}]`, 60, y);
        doc.fontSize(9).fillColor("#333").font("Helvetica")
          .text(`${driver.reason} — ${driver.fix}`, 130, y, { width: 415 });
        y = doc.y + 6;
      }
    }
  } else {
    doc.fontSize(10).fillColor(GREY).font("Helvetica")
      .text("Assessment not yet completed.", 50, y);
    y += 14;
  }
  y = drawHr(doc, y + 4);

  // ── 8. Cost Scenarios ──
  if (data.costScenarios && data.costScenarios.length > 0) {
    // Check if we need a new page
    if (y > 600) {
      doc.addPage();
      pageFooter(doc, data.reference);
      y = 50;
    }

    doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
      .text("8. Cost Sensitivity Scenarios", 50, y);
    y += 18;

    for (const sc of data.costScenarios) {
      const deltaStr = sc.delta >= 0 ? `+€${sc.delta.toLocaleString()} (+${sc.deltaPercent}%)` : `–€${Math.abs(sc.delta).toLocaleString()} (${sc.deltaPercent}%)`;
      const color = sc.delta > 0 ? RED : sc.delta < 0 ? GREEN : "#333";
      doc.fontSize(9).fillColor("#333").font("Helvetica-Bold")
        .text(sc.label, 60, y, { width: 140 });
      doc.fontSize(9).fillColor("#333").font("Helvetica")
        .text(`€${sc.netLevy.toLocaleString()}`, 200, y, { width: 80 });
      doc.fontSize(9).fillColor(color).font("Helvetica")
        .text(deltaStr, 290, y, { width: 120 });
      doc.fontSize(9).fillColor(GREY).font("Helvetica")
        .text(sc.probability, 420, y, { width: 80 });
      y += 14;
    }
    y = drawHr(doc, y + 4);
  }

  // ── 9. Declaration ──
  if (y > 650) {
    doc.addPage();
    pageFooter(doc, data.reference);
    y = 50;
  }

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("Declaration", 50, y);
  y += 18;

  doc.fontSize(9).fillColor("#333").font("Helvetica")
    .text(
      "I hereby declare that the information provided in this CBAM compliance statement is complete and accurate " +
      "to the best of my knowledge. The embedded emissions data, installation details, and carbon levy calculations " +
      "have been prepared in accordance with EU Regulation 2023/956 (Carbon Border Adjustment Mechanism) and the " +
      "applicable implementing regulations. Where default emission factors have been used, this is clearly indicated.",
      50, y, { width: 495, lineGap: 2 }
    );
  y = doc.y + 20;

  // Signature lines
  doc.fontSize(9).fillColor("#333").font("Helvetica")
    .text("Authorised signatory: ______________________________", 50, y);
  y += 16;
  doc.text("Date: ______________________________", 50, y);
  y += 16;
  doc.text("Position: ______________________________", 50, y);
  y += 24;

  y = drawHr(doc, y);

  // ── 10. Footer — TwinLog + SHA-256 ──
  if (data.twinlogRef) {
    doc.fontSize(8).fillColor(GREY).font("Helvetica")
      .text(`TwinLog Reference: ${data.twinlogRef}`, 50, y);
    y += 12;
  }
  if (data.twinlogHash) {
    doc.fontSize(8).fillColor(GREY).font("Helvetica")
      .text(`TwinLog Hash: ${data.twinlogHash}`, 50, y);
    y += 12;
  }

  doc.fontSize(7).fillColor(GREY).font("Helvetica")
    .text(`Generated by TapTrao — ${formatDate(now)}`, 50, y);

  pageFooter(doc, data.reference);
  doc.end();

  return { stream: doc, hashPromise };
}
