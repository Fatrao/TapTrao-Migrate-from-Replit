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

  const infoRows: [string, string][] = [
    ["Operator", data.companyName],
    ["Statement date", data.statementDate],
    ["Reference", data.reference],
  ];
  doc.fontSize(10).font("Helvetica");
  for (const [label, val] of infoRows) {
    doc.font("Helvetica-Bold").fillColor("#333").text(`${label}:`, 50, y, { continued: true, width: 150 });
    doc.font("Helvetica").text(`  ${val}`, { width: 345 });
    y += 18;
  }

  y = drawHr(doc, y + 8);

  const tradeRows: [string, string][] = [
    ["Commodity", `${data.commodityName} | HS Code: ${data.hsCode}`],
    ["Origin country", data.originCountry],
    ["Destination", data.destination],
    ["Quantity", "As per commercial invoice"],
  ];
  for (const [label, val] of tradeRows) {
    doc.font("Helvetica-Bold").fillColor("#333").text(`${label}:`, 50, y, { continued: true, width: 150 });
    doc.font("Helvetica").text(`  ${val}`, { width: 345 });
    y += 18;
  }

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
  const riskColor = data.riskLevel === "low" ? GREEN : data.riskLevel === "high" ? RED : AMBER;
  doc.fontSize(11).fillColor(riskColor).font("Helvetica-Bold")
    .text(`Risk level: ${data.riskLevel.toUpperCase()}`, 50, y);
  y += 18;
  if (data.riskLevel === "high" && data.highRiskReason) {
    doc.fontSize(9).fillColor("#333").font("Helvetica")
      .text(data.highRiskReason, 50, y, { width: 495 });
    y += 20;
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
