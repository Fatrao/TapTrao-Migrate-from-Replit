import PDFDocument from "pdfkit";
import { createHash } from "crypto";
import type { CompanyProfile, ComplianceResult, RequirementDetail, DocumentStatus, TradeEvent, SupplierUpload } from "@shared/schema";

const FOREST_GREEN = "#1A3D2B";
const CREAM = "#F2EDE4";
const GREY = "#888888";
const RED = "#DC2626";
const GREEN = "#1B7340";
const AMBER = "#F39C12";
const PURPLE = "#7C3AED";

type DocStatuses = Record<number, DocumentStatus>;

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function statusDot(status: DocumentStatus): { color: string; label: string } {
  switch (status) {
    case "READY": return { color: GREEN, label: "Ready" };
    case "RISK_ACCEPTED": return { color: AMBER, label: "Risk Accepted" };
    default: return { color: GREY, label: "Pending" };
  }
}

function dueName(d: string): string {
  switch (d) {
    case "BEFORE_LOADING": return "Before loading";
    case "BEFORE_ARRIVAL": return "Before arrival";
    case "POST_ARRIVAL": return "Post-arrival";
    default: return d;
  }
}

function ownerName(o: string): string {
  switch (o) {
    case "IMPORTER": return "You";
    case "SUPPLIER": return "Supplier";
    case "BROKER": return "Broker";
    default: return o;
  }
}

function verdictLabel(v: string): string {
  if (v === "GREEN") return "LOW RISK";
  if (v === "AMBER") return "MODERATE RISK";
  return "HIGH RISK";
}

function eventLabel(eventType: string): { label: string; color: string } {
  switch (eventType) {
    case "compliance_check": return { label: "Compliance Check", color: FOREST_GREEN };
    case "supplier_link_created": return { label: "Supplier Link Created", color: FOREST_GREEN };
    case "supplier_doc_uploaded": return { label: "Document Uploaded", color: GREEN };
    case "supplier_submission_complete": return { label: "Supplier Submission Complete", color: GREEN };
    case "buyer_doc_uploaded": return { label: "Document Uploaded (Buyer)", color: PURPLE };
    case "status_change": return { label: "Status Changed", color: "#555" };
    case "doc_verified": return { label: "Document Verified", color: GREEN };
    case "doc_flagged": return { label: "Document Flagged", color: RED };
    case "doc_ai_scanned": return { label: "AI Document Scan", color: PURPLE };
    case "twinlog_generated": return { label: "TwinLog Generated", color: FOREST_GREEN };
    case "lc_check": return { label: "LC Check", color: FOREST_GREEN };
    default: return { label: eventType.replace(/_/g, " "), color: "#555" };
  }
}

function drawHr(doc: PDFKit.PDFDocument, y: number): number {
  doc.save();
  doc.moveTo(50, y).lineTo(545, y).strokeColor("#D0D0D0").lineWidth(0.5).stroke();
  doc.restore();
  return y + 12;
}

function pageFooter(doc: PDFKit.PDFDocument, ref: string, companyName: string) {
  doc.save();
  doc.fontSize(7).fillColor(GREY).font("Helvetica")
    .text(`TwinLog Trail  |  ${ref}  |  ${companyName}`, 50, 770, { align: "center", width: 495 });
  doc.restore();
}

/** Draw label: value pair. Returns the new y after this field. */
function drawField(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  y: number,
  opts?: { valueColor?: string; fontSize?: number },
): number {
  const fs = opts?.fontSize ?? 10;
  const labelX = 50;
  const valueX = 170;
  const valueWidth = 375;
  const color = opts?.valueColor ?? "#333";

  doc.font("Helvetica-Bold").fontSize(fs).fillColor("#333");
  doc.text(label + ":", labelX, y);

  doc.font("Helvetica").fontSize(fs).fillColor(color);
  const valH = doc.heightOfString(value, { width: valueWidth });
  doc.text(value, valueX, y, { width: valueWidth });

  return y + Math.max(fs + 4, valH) + 4;
}

/** Check if we need a new page, add one if so. Returns current y. */
function checkPage(doc: PDFKit.PDFDocument, y: number, needed: number, ref: string, companyName: string): number {
  if (y + needed > 740) {
    pageFooter(doc, ref, companyName);
    doc.addPage();
    return 50;
  }
  return y;
}

export function generateTwinlogPdf(
  result: ComplianceResult,
  profile: CompanyProfile,
  docStatuses: DocStatuses,
  integrityHash: string | null,
  reference: string,
  lookupTimestamp: string,
  auditTrail: TradeEvent[] = [],
  supplierUploads: SupplierUpload[] = [],
  chainValid: boolean = true,
): { stream: PDFKit.PDFDocument; hashPromise: Promise<string> } {
  const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
  const now = new Date();
  const allDocs = result.requirementsDetailed || [];

  const hash = createHash("sha256");
  doc.on("data", (chunk: Buffer) => hash.update(chunk));
  const hashPromise = new Promise<string>((resolve) => {
    doc.on("end", () => resolve(hash.digest("hex")));
  });

  // ── PAGE 1 -- Cover ──────────────────────────────────────────────

  doc.fontSize(10).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("TapTrao", 50, 55);

  doc.fontSize(26).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("TWINLOG TRAIL", 50, 120);
  doc.fontSize(13).fillColor(GREY).font("Helvetica")
    .text("Compliance Record", 50, 152);

  let y = drawHr(doc, 180);

  y = drawField(doc, "Commodity", `${result.commodity.name}  (HS ${result.commodity.hsCode})`, y);
  y = drawField(doc, "Origin", `${result.origin.countryName} (${result.origin.iso2})`, y);
  y = drawField(doc, "Destination", `${result.destination.countryName} (${result.destination.iso2})`, y);
  y = drawField(doc, "Trade corridor", `${result.origin.iso2}  >>  ${result.destination.iso2}`, y);

  y = drawHr(doc, y + 6);

  y = drawField(doc, "Prepared by", profile.companyName, y);
  y = drawField(doc, "Address", profile.registeredAddress, y);
  y = drawField(doc, "EORI", profile.eoriNumber || "NOT PROVIDED", y, {
    valueColor: profile.eoriNumber ? "#333" : AMBER,
  });
  y = drawField(doc, "VAT", profile.vatNumber || "NOT PROVIDED", y, {
    valueColor: profile.vatNumber ? "#333" : AMBER,
  });

  y += 4;
  y = drawField(doc, "Generated", formatDate(now), y);
  y = drawField(doc, "Reference", reference, y);

  y = drawHr(doc, y + 10);

  doc.fontSize(9).fillColor(FOREST_GREEN).font("Helvetica-Bold")
    .text("TwinLog Trail  --  Generated by TapTrao", 50, y);
  doc.fontSize(8).fillColor(GREY).font("Helvetica")
    .text("Verified compliance record for regulatory audit and bank submission.", 50, y + 16);

  pageFooter(doc, reference, profile.companyName);

  // ── PAGE 2 -- TwinLog Score ──────────────────────────────────────

  doc.addPage();
  doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("TWINLOG SCORE", 50, 50);

  const rs = result.readinessScore;
  const factors = rs.factors;

  y = 85;
  doc.fontSize(8).fillColor(GREY).font("Helvetica-Bold");
  doc.text("Factor", 50, y, { width: 180 });
  doc.text("Penalty", 235, y, { width: 50, align: "right" });
  doc.text("Max", 295, y, { width: 40, align: "right" });
  doc.text("Notes", 350, y, { width: 195 });
  y += 16;
  y = drawHr(doc, y);

  const scoreRows = [
    ["Regulatory Complexity", factors.regulatory_complexity.penalty, factors.regulatory_complexity.max, `${factors.regulatory_complexity.overlay_count} active overlay(s)`],
    ["Known Hazard Exposure", factors.hazard_exposure.penalty, factors.hazard_exposure.max, factors.hazard_exposure.primary_hazard || "None"],
    ["Document Volume", factors.document_volume.penalty, factors.document_volume.max, `${factors.document_volume.document_count} documents required`],
    ["Trade Restrictions", factors.trade_restriction.penalty, factors.trade_restriction.max, factors.trade_restriction.stop_triggered ? "Stop flag triggered" : "No restrictions"],
  ];

  doc.font("Helvetica").fillColor("#333").fontSize(9);
  for (const [label, penalty, max, notes] of scoreRows) {
    doc.fillColor("#333").text(String(label), 50, y, { width: 180 });
    doc.text(String(penalty), 235, y, { width: 50, align: "right" });
    doc.text(String(max), 295, y, { width: 40, align: "right" });
    doc.text(String(notes), 350, y, { width: 195 });
    y += 20;
  }

  y += 4;
  y = drawHr(doc, y);

  doc.font("Helvetica-Bold").fontSize(9).fillColor("#333");
  doc.text("Total penalty", 50, y, { width: 180 });
  doc.text(String(factors.total_penalty), 235, y, { width: 50, align: "right" });
  y += 28;

  doc.fontSize(12).fillColor(FOREST_GREEN).font("Helvetica-Bold");
  doc.text(`TwinLog Score: ${rs.score} / 100`, 50, y);
  y += 16;
  const verdictColor = rs.verdict === "GREEN" ? GREEN : rs.verdict === "AMBER" ? AMBER : RED;
  doc.fontSize(10).fillColor(verdictColor).font("Helvetica-Bold");
  doc.text(verdictLabel(rs.verdict), 50, y);
  y += 28;

  const summaryHeight = doc.heightOfString(rs.summary, { width: 475, font: "Helvetica-Oblique", fontSize: 9 }) + 20;
  doc.roundedRect(50, y, 495, summaryHeight, 4).fillAndStroke(CREAM, "#D0D0D0");
  doc.fillColor("#333").fontSize(9).font("Helvetica-Oblique")
    .text(rs.summary, 60, y + 10, { width: 475 });

  pageFooter(doc, reference, profile.companyName);

  // ── PAGE 3 -- Importer Requirements ──────────────────────────────

  doc.addPage();
  doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("IMPORTER REQUIREMENTS", 50, 50);
  doc.fontSize(9).fillColor(GREY).font("Helvetica")
    .text("Documents and actions required of the importing party.", 50, 70);

  y = 100;
  doc.fontSize(8).fillColor(GREY).font("Helvetica-Bold");
  doc.text("Document", 50, y, { width: 190 });
  doc.text("Owner", 245, y, { width: 65 });
  doc.text("Due By", 315, y, { width: 95 });
  doc.text("Status", 420, y, { width: 125 });
  y += 16;
  y = drawHr(doc, y);

  let importerReady = 0;
  const allDocsWithOrigIdx = allDocs.map((d, i) => ({ d, i }));
  const importerWithIdx = allDocsWithOrigIdx.filter(x => !x.d.isSupplierSide);

  doc.fontSize(9).font("Helvetica");
  for (const { d: rq, i: origIdx } of importerWithIdx) {
    const st = docStatuses[origIdx] || "PENDING";
    if (st !== "PENDING") importerReady++;
    const s = statusDot(st);

    const titleH = doc.heightOfString(rq.title, { width: 190 });
    const rowH = Math.max(titleH, 14) + 6;

    y = checkPage(doc, y, rowH, reference, profile.companyName);
    doc.fillColor("#333").font("Helvetica").fontSize(9);
    doc.text(rq.title, 50, y, { width: 190 });
    doc.text(ownerName(rq.owner), 245, y, { width: 65 });
    doc.text(dueName(rq.due_by), 315, y, { width: 95 });
    doc.fillColor(s.color).text(`* ${s.label}`, 420, y, { width: 125 });
    y += rowH;
  }

  y += 12;
  doc.fontSize(8).fillColor(GREY).font("Helvetica-Oblique")
    .text(`${importerReady} of ${importerWithIdx.length} importer requirements marked ready at time of download.`, 50, y);

  pageFooter(doc, reference, profile.companyName);

  // ── PAGE 4 -- Supplier Requirements ──────────────────────────────

  doc.addPage();
  doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("SUPPLIER REQUIREMENTS", 50, 50);
  doc.fontSize(9).fillColor(GREY).font("Helvetica")
    .text("Documents the supplier must provide. Issuing authorities named.", 50, 70);

  y = 100;
  doc.fontSize(8).fillColor(GREY).font("Helvetica-Bold");
  doc.text("Document", 50, y, { width: 165 });
  doc.text("Issuing Authority", 220, y, { width: 130 });
  doc.text("Due By", 355, y, { width: 80 });
  doc.text("Status", 440, y, { width: 105 });
  y += 16;
  y = drawHr(doc, y);

  let supplierReady = 0;
  const supplierWithIdx = allDocsWithOrigIdx.filter(x => x.d.isSupplierSide);

  doc.fontSize(9).font("Helvetica");
  for (const { d: rq, i: origIdx } of supplierWithIdx) {
    const st = docStatuses[origIdx] || "PENDING";
    if (st !== "PENDING") supplierReady++;
    const s = statusDot(st);

    const titleH = doc.heightOfString(rq.title, { width: 165 });
    const issuerH = doc.heightOfString(rq.issuedBy, { width: 130 });
    const rowH = Math.max(titleH, issuerH, 14) + 6;

    y = checkPage(doc, y, rowH, reference, profile.companyName);
    doc.fillColor("#333").font("Helvetica").fontSize(9);
    doc.text(rq.title, 50, y, { width: 165 });
    doc.text(rq.issuedBy, 220, y, { width: 130 });
    doc.text(dueName(rq.due_by), 355, y, { width: 80 });
    doc.fillColor(s.color).text(`* ${s.label}`, 440, y, { width: 105 });
    y += rowH;
  }

  y += 12;
  doc.fontSize(8).fillColor(GREY).font("Helvetica-Oblique")
    .text(`${supplierReady} of ${supplierWithIdx.length} supplier requirements marked ready at time of download.`, 50, y);

  pageFooter(doc, reference, profile.companyName);

  // ── PAGE 5 -- Supplier Documents Received ────────────────────────

  if (supplierUploads.length > 0) {
    doc.addPage();
    doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("SUPPLIER DOCUMENTS RECEIVED", 50, 50);
    doc.fontSize(9).fillColor(GREY).font("Helvetica")
      .text(`${supplierUploads.length} document(s) uploaded to this trade.`, 50, 70);

    y = 100;
    doc.fontSize(8).fillColor(GREY).font("Helvetica-Bold");
    doc.text("Document Type", 50, y, { width: 130 });
    doc.text("Filename", 185, y, { width: 165 });
    doc.text("Source", 355, y, { width: 55 });
    doc.text("Verified", 415, y, { width: 55 });
    doc.text("Finding", 475, y, { width: 70 });
    y += 16;
    y = drawHr(doc, y);

    doc.fontSize(8).font("Helvetica");
    for (const upload of supplierUploads) {
      const titleH = doc.heightOfString(upload.docType, { width: 130 });
      const fnH = doc.heightOfString(upload.originalFilename, { width: 165 });
      const rowH = Math.max(titleH, fnH, 12) + 6;

      y = checkPage(doc, y, rowH, reference, profile.companyName);

      doc.fillColor("#333").text(upload.docType, 50, y, { width: 130 });
      doc.fillColor("#555").text(upload.originalFilename, 185, y, { width: 165 });

      const source = upload.uploadedBy === "buyer" ? "Buyer" : "Supplier";
      doc.fillColor(upload.uploadedBy === "buyer" ? PURPLE : "#333").text(source, 355, y, { width: 55 });

      if (upload.verified === true) {
        doc.fillColor(GREEN).text("Yes", 415, y, { width: 55 });
      } else if (upload.verified === false && upload.finding) {
        doc.fillColor(RED).text("Flagged", 415, y, { width: 55 });
      } else {
        doc.fillColor(GREY).text("Pending", 415, y, { width: 55 });
      }

      doc.fillColor("#555").text(upload.finding || "-", 475, y, { width: 70 });
      y += rowH;
    }

    // Show flagged findings in detail
    const flagged = supplierUploads.filter(u => u.verified === false && u.finding);
    if (flagged.length > 0) {
      y += 12;
      y = checkPage(doc, y, 40, reference, profile.companyName);
      doc.fontSize(10).fillColor(RED).font("Helvetica-Bold").text("FLAGGED DOCUMENTS", 50, y);
      y += 18;

      for (const f of flagged) {
        y = checkPage(doc, y, 40, reference, profile.companyName);
        doc.fontSize(9).fillColor("#333").font("Helvetica-Bold");
        doc.text(f.docType, 50, y);
        y += 14;
        doc.fontSize(8).fillColor(RED).font("Helvetica");
        doc.text(`Finding: ${f.finding}`, 70, y, { width: 475 });
        y += 12;
        if (f.ucpRule) {
          doc.fillColor("#555").text(`UCP Rule: ${f.ucpRule}`, 70, y, { width: 475 });
          y += 12;
        }
        y += 6;
      }
    }

    pageFooter(doc, reference, profile.companyName);
  }

  // ── PAGE 6 -- Regulatory Overlays & Risk Flags ───────────────────

  doc.addPage();

  const hasStop = result.stopFlags && Object.keys(result.stopFlags).length > 0;
  y = 50;

  if (hasStop) {
    doc.roundedRect(50, y, 495, 40, 4).fillAndStroke("#FEE2E2", RED);
    doc.fontSize(10).fillColor(RED).font("Helvetica-Bold")
      .text("STOP FLAG -- Trade may be prohibited or require special authorisation", 60, y + 12, { width: 475 });
    y += 55;
  }

  doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("REGULATORY OVERLAYS", 50, y);
  y += 28;

  doc.fontSize(8).fillColor(GREY).font("Helvetica-Bold");
  doc.text("Regulation", 50, y, { width: 200 });
  doc.text("Status", 255, y, { width: 75 });
  doc.text("Notes", 335, y, { width: 210 });
  y += 16;
  y = drawHr(doc, y);

  const triggers = result.triggers;
  const overlayRows: [string, boolean, string][] = [
    ["SPS - Sanitary & Phytosanitary", triggers.sps, "IPAFFS/TRACES pre-notification required"],
    ["EUDR - EU Deforestation Regulation", triggers.eudr, "Geolocation data and due diligence required"],
    ["CBAM - Carbon Border Adjustment", triggers.cbam, "Carbon reporting obligations apply"],
    ["Kimberley Process", triggers.kimberley, "Kimberley Process Certificate required"],
    ["Conflict Minerals", triggers.conflict, "OECD due diligence guidelines apply"],
    ["IUU - Illegal Fishing", triggers.iuu, "Catch certificate required"],
    ["CITES - Endangered Species", triggers.cites, "CITES permit required"],
    ["CSDDD - Corporate Due Diligence", triggers.csddd, "Supply chain due diligence required"],
  ];

  doc.fontSize(9).font("Helvetica");
  for (const [reg, active, notes] of overlayRows) {
    const regH = doc.heightOfString(reg, { width: 200 });
    const notesH = active ? doc.heightOfString(notes, { width: 210 }) : 14;
    const rowH = Math.max(regH, notesH, 14) + 6;

    doc.fillColor("#333").text(reg, 50, y, { width: 200 });
    doc.fillColor(active ? GREEN : GREY).text(active ? "Active" : "Not triggered", 255, y, { width: 75 });
    doc.fillColor("#333").text(active ? notes : "-", 335, y, { width: 210 });
    y += rowH;
  }

  y += 20;
  doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("KNOWN HAZARDS", 50, y);
  y += 28;

  if (result.hazards.length > 0) {
    doc.fontSize(8).fillColor(GREY).font("Helvetica-Bold");
    doc.text("Hazard", 50, y, { width: 200 });
    doc.text("Severity", 255, y, { width: 75 });
    doc.text("Mitigation", 335, y, { width: 210 });
    y += 16;
    y = drawHr(doc, y);

    doc.fontSize(9).font("Helvetica").fillColor("#333");
    for (const h of result.hazards) {
      doc.fillColor("#333").text(h, 50, y, { width: 200 });
      doc.fillColor(AMBER).text("MEDIUM", 255, y, { width: 75 });
      doc.fillColor("#333").text("See compliance requirements for mitigation details", 335, y, { width: 210 });
      y += 20;
    }
  } else {
    doc.fontSize(9).fillColor(GREY).font("Helvetica").text("No known hazards for this commodity.", 50, y);
  }

  pageFooter(doc, reference, profile.companyName);

  // ── TRADE EVENT TIMELINE ─────────────────────────────────────────

  if (auditTrail.length > 0) {
    doc.addPage();
    doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("TRADE EVENT TIMELINE", 50, 50);
    doc.fontSize(9).fillColor(GREY).font("Helvetica")
      .text(`${auditTrail.length} event(s) recorded  |  Hash chain: ${chainValid ? "VALID" : "BROKEN"}`, 50, 70);

    y = 100;

    // Table header
    doc.fontSize(7).fillColor(GREY).font("Helvetica-Bold");
    doc.text("#", 50, y, { width: 20 });
    doc.text("Timestamp", 70, y, { width: 100 });
    doc.text("Event", 175, y, { width: 120 });
    doc.text("Details", 300, y, { width: 150 });
    doc.text("Hash", 455, y, { width: 90 });
    y += 14;
    y = drawHr(doc, y);

    for (let i = 0; i < auditTrail.length; i++) {
      const ev = auditTrail[i];
      const evInfo = eventLabel(ev.eventType);
      const evData = ev.eventData as Record<string, any>;

      // Build a detail string from event data
      let detail = "";
      if (ev.eventType === "status_change") {
        detail = `${evData.from || "?"} >> ${evData.to || "?"}`;
      } else if (ev.eventType === "supplier_doc_uploaded" || ev.eventType === "buyer_doc_uploaded") {
        detail = evData.docType || evData.filename || "";
      } else if (ev.eventType === "doc_verified" || ev.eventType === "doc_flagged") {
        detail = evData.docType || "";
        if (evData.finding) detail += `: ${evData.finding}`.substring(0, 50);
      } else if (ev.eventType === "twinlog_generated") {
        detail = evData.ref || "";
      } else if (ev.eventType === "compliance_check") {
        detail = evData.corridor || evData.ref || "";
      } else if (ev.eventType === "doc_ai_scanned") {
        detail = `${evData.docType || ""} (${evData.confidence || ""})`;
      } else {
        // Generic: show first key-value
        const keys = Object.keys(evData);
        if (keys.length > 0) {
          const firstVal = String(evData[keys[0]]);
          detail = firstVal.length > 40 ? firstVal.substring(0, 40) + "..." : firstVal;
        }
      }

      const hashShort = ev.eventHash.substring(0, 8);
      const ts = ev.createdAt ? formatDateShort(new Date(ev.createdAt)) : "-";

      // Calculate row height
      const detailH = doc.fontSize(7).font("Helvetica").heightOfString(detail, { width: 150 });
      const rowH = Math.max(detailH, 12) + 5;

      y = checkPage(doc, y, rowH, reference, profile.companyName);
      if (y === 50) {
        // Re-draw header on new page
        doc.fontSize(7).fillColor(GREY).font("Helvetica-Bold");
        doc.text("#", 50, y, { width: 20 });
        doc.text("Timestamp", 70, y, { width: 100 });
        doc.text("Event", 175, y, { width: 120 });
        doc.text("Details", 300, y, { width: 150 });
        doc.text("Hash", 455, y, { width: 90 });
        y += 14;
        y = drawHr(doc, y);
      }

      // Row number
      doc.fontSize(7).fillColor(GREY).font("Helvetica");
      doc.text(String(i + 1), 50, y, { width: 20 });

      // Timestamp
      doc.fillColor("#555").text(ts, 70, y, { width: 100 });

      // Event type (colored)
      doc.fillColor(evInfo.color).font("Helvetica-Bold").text(evInfo.label, 175, y, { width: 120 });

      // Details
      doc.fillColor("#333").font("Helvetica").text(detail, 300, y, { width: 150 });

      // Hash (monospace-style, shortened)
      doc.fillColor(GREY).text(hashShort, 455, y, { width: 90 });

      y += rowH;
    }

    // Chain integrity note
    y += 12;
    y = checkPage(doc, y, 30, reference, profile.companyName);
    if (chainValid) {
      doc.fontSize(8).fillColor(GREEN).font("Helvetica-Bold")
        .text(`Hash chain integrity: VERIFIED (${auditTrail.length} events)`, 50, y);
    } else {
      doc.fontSize(8).fillColor(RED).font("Helvetica-Bold")
        .text("WARNING: Hash chain integrity check FAILED -- possible tampering detected", 50, y);
    }

    pageFooter(doc, reference, profile.companyName);
  }

  // ── AUDIT RECORD (final page) ────────────────────────────────────

  doc.addPage();
  doc.fontSize(14).fillColor(FOREST_GREEN).font("Helvetica-Bold").text("AUDIT RECORD", 50, 50);
  y = 85;

  doc.fontSize(9).fillColor("#333").font("Helvetica")
    .text("This document was generated by TapTrao (taptrao.com) on behalf of:", 50, y);
  y += 24;

  doc.font("Helvetica-Bold").text(profile.companyName, 70, y);
  y += 16;
  doc.font("Helvetica");
  const addrH = doc.heightOfString(profile.registeredAddress, { width: 450 });
  doc.text(profile.registeredAddress, 70, y, { width: 450 });
  y += addrH + 6;
  doc.text(`EORI:  ${profile.eoriNumber || "NOT PROVIDED"}`, 70, y);
  y += 16;
  doc.text(`VAT:   ${profile.vatNumber || "NOT PROVIDED"}`, 70, y);
  y += 30;

  const auditRows: [string, string][] = [
    ["Compliance check reference", reference],
    ["Integrity hash (SHA-256)", integrityHash ? `sha256:${integrityHash}` : "N/A"],
    ["Lookup timestamp", lookupTimestamp],
    ["PDF generated", now.toISOString()],
    ["Audit trail events", `${auditTrail.length} event(s) recorded`],
    ["Hash chain integrity", chainValid ? "VERIFIED" : "FAILED"],
  ];

  for (const [label, val] of auditRows) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#333");
    doc.text(label + ":", 50, y);
    y += 14;
    doc.font("Helvetica").fontSize(9).fillColor("#555");
    const valH = doc.heightOfString(val, { width: 475 });
    doc.text(val, 70, y, { width: 475 });
    y += valH + 8;
  }

  y += 16;
  doc.fontSize(8).fillColor(GREY).font("Helvetica")
    .text("This record reflects the compliance status of the above trade corridor at the time of generation. Regulatory requirements are subject to change. TapTrao recommends running a fresh compliance lookup before each shipment.", 50, y, { width: 495 });
  y += 45;
  doc.text("TapTrao is a compliance information tool. This record does not constitute legal advice. The importing party remains responsible for ensuring all regulatory requirements are met.", 50, y, { width: 495 });

  pageFooter(doc, reference, profile.companyName);

  doc.end();
  return { stream: doc, hashPromise };
}
