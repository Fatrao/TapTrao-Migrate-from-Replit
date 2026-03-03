import type { LcDocumentType } from "@shared/schema";
import { DOC_TYPES } from "./constants";

export function getDocFields(docType: LcDocumentType): { key: string; label: string; type: string }[] {
  switch (docType) {
    case "commercial_invoice":
      return [
        { key: "beneficiaryName", label: "Beneficiary Name", type: "text" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "unitPrice", label: "Unit Price", type: "text" },
        { key: "totalAmount", label: "Total Amount", type: "text" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "incoterms", label: "Incoterms", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "bill_of_lading":
      return [
        { key: "shipperName", label: "Shipper Name", type: "text" },
        { key: "consignee", label: "Consignee", type: "text" },
        { key: "portOfLoading", label: "Port of Loading", type: "text" },
        { key: "portOfDischarge", label: "Port of Discharge", type: "text" },
        { key: "shippedOnBoardDate", label: "Shipped on Board Date", type: "date" },
        { key: "vesselName", label: "Vessel Name", type: "text" },
        { key: "blNumber", label: "B/L Number", type: "text" },
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "certificate_of_origin":
      return [
        { key: "exporterName", label: "Exporter Name", type: "text" },
        { key: "originCountry", label: "Origin Country", type: "text" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "languageOfDocument", label: "Language of Document", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "phytosanitary_certificate":
      return [
        { key: "exporterName", label: "Exporter Name", type: "text" },
        { key: "originCountry", label: "Origin Country", type: "text" },
        { key: "commodityDescription", label: "Commodity Description", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "packing_list":
      return [
        { key: "quantity", label: "Quantity", type: "text" },
        { key: "grossWeight", label: "Gross Weight", type: "text" },
        { key: "netWeight", label: "Net Weight", type: "text" },
        { key: "numberOfPackages", label: "Number of Packages", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
    case "insurance_certificate":
      return [
        { key: "insuredParty", label: "Insured Party", type: "text" },
        { key: "coverageAmount", label: "Coverage Amount", type: "text" },
        { key: "currency", label: "Currency", type: "text" },
        { key: "coverageType", label: "Coverage Type", type: "text" },
        { key: "voyageFrom", label: "Voyage From", type: "text" },
        { key: "voyageTo", label: "Voyage To", type: "text" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "warAndStrikesClause", label: "War & Strikes Clause", type: "text" },
        { key: "policyNumber", label: "Policy Number", type: "text" },
        { key: "issuingCompany", label: "Issuing Company", type: "text" },
        { key: "issueDate", label: "Issue Date", type: "date" },
        { key: "claimsPayableAt", label: "Claims Payable At", type: "text" },
      ];
    case "quality_certificate":
      return [
        { key: "issuingBody", label: "Issuing Body", type: "text" },
        { key: "grade", label: "Grade / Classification", type: "text" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "quantityInspected", label: "Quantity Inspected", type: "text" },
        { key: "quantityUnit", label: "Unit", type: "text" },
        { key: "inspectionDate", label: "Inspection Date", type: "date" },
        { key: "certificateNumber", label: "Certificate Number", type: "text" },
        { key: "exporterName", label: "Exporter Name", type: "text" },
        { key: "countryOfOrigin", label: "Country of Origin", type: "text" },
      ];
    case "weight_certificate":
      return [
        { key: "issuingBody", label: "Issuing Body", type: "text" },
        { key: "netWeight", label: "Net Weight", type: "text" },
        { key: "grossWeight", label: "Gross Weight", type: "text" },
        { key: "weightUnit", label: "Weight Unit", type: "text" },
        { key: "numberOfPackages", label: "Number of Packages", type: "text" },
        { key: "certificateNumber", label: "Certificate Number", type: "text" },
        { key: "weighingDate", label: "Weighing Date", type: "date" },
        { key: "goodsDescription", label: "Goods Description", type: "text" },
        { key: "vesselName", label: "Vessel Name", type: "text" },
        { key: "containerNumbers", label: "Container Numbers", type: "text" },
      ];
    case "eudr_declaration":
      return [
        { key: "operatorName", label: "Operator Name", type: "text" },
        { key: "productDescription", label: "Product Description", type: "text" },
        { key: "hsCode", label: "HS Code", type: "text" },
        { key: "countryOfOrigin", label: "Country of Origin", type: "text" },
        { key: "gpsCoordinates", label: "GPS Coordinates", type: "text" },
        { key: "plotIdentifiers", label: "Plot Identifiers", type: "text" },
        { key: "deforestationFreeDate", label: "Deforestation-Free Date", type: "date" },
        { key: "supplierName", label: "Supplier Name", type: "text" },
        { key: "evidenceType", label: "Evidence Type", type: "text" },
        { key: "evidenceReference", label: "Evidence Reference", type: "text" },
        { key: "riskAssessment", label: "Risk Assessment", type: "text" },
      ];
    case "cbam_declaration":
      return [
        { key: "productDescription", label: "Product Description", type: "text" },
        { key: "hsCode", label: "HS Code", type: "text" },
        { key: "embeddedEmissions", label: "Embedded Emissions (tCO2e)", type: "text" },
        { key: "emissionsUnit", label: "Emissions Unit", type: "text" },
        { key: "verifierName", label: "Verifier Name", type: "text" },
        { key: "verifierAccreditation", label: "Verifier Accreditation", type: "text" },
        { key: "installationName", label: "Installation Name", type: "text" },
        { key: "installationCountry", label: "Installation Country", type: "text" },
        { key: "reportingPeriod", label: "Reporting Period", type: "text" },
        { key: "declarantName", label: "Declarant Name", type: "text" },
        { key: "cbamReferenceNumber", label: "CBAM Reference Number", type: "text" },
      ];
    case "traceability_certificate":
      return [
        { key: "gpsCoordinates", label: "GPS Coordinates", type: "text" },
        { key: "plotIdentifiers", label: "Plot Identifiers", type: "text" },
        { key: "productionDate", label: "Production Date", type: "date" },
        { key: "supplyChainActors", label: "Supply Chain Actors", type: "text" },
        { key: "commodityDescription", label: "Commodity Description", type: "text" },
        { key: "certifyingBody", label: "Certifying Body", type: "text" },
        { key: "certificateNumber", label: "Certificate Number", type: "text" },
        { key: "traceabilityScheme", label: "Traceability Scheme", type: "text" },
        { key: "countryOfOrigin", label: "Country of Origin", type: "text" },
        { key: "exporterName", label: "Exporter Name", type: "text" },
      ];
    default:
      return [
        { key: "description", label: "Description", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
  }
}

export function mapDocNameToType(docName: string): LcDocumentType {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial") || lower.includes("facture")) return "commercial_invoice";
  if (lower.includes("bill of lading") || lower.includes("b/l") || lower.includes("connaissement")) return "bill_of_lading";
  if (lower.includes("certificate of origin") || lower.includes("origin cert") || lower.includes("certificat d'origine")) return "certificate_of_origin";
  if (lower.includes("phytosanitary") || lower.includes("sps") || lower.includes("phytosanitaire")) return "phytosanitary_certificate";
  if (lower.includes("packing list") || lower.includes("colisage")) return "packing_list";
  if (lower.includes("insurance") || lower.includes("assurance")) return "insurance_certificate";
  if (lower.includes("quality") || lower.includes("inspection") || lower.includes("qualite")) return "quality_certificate";
  if (lower.includes("weight") || lower.includes("poids")) return "weight_certificate";
  if (lower.includes("eudr") || lower.includes("deforestation")) return "eudr_declaration";
  if (lower.includes("cbam") || lower.includes("carbon")) return "cbam_declaration";
  if (lower.includes("traceability") || lower.includes("tracabilite") || lower.includes("trace")) return "traceability_certificate";
  return "other";
}

export function getDocEmoji(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial") || lower.includes("facture")) return "\u{1F4C4}";
  if (lower.includes("origin") || lower.includes("coo")) return "\u{1F30D}";
  if (lower.includes("phyto") || lower.includes("sps")) return "\u{1F33F}";
  if (lower.includes("packing") || lower.includes("colisage")) return "\u{1F4E6}";
  if (lower.includes("bill of lading") || lower.includes("b/l") || lower.includes("connaissement")) return "\u{1F6A2}";
  if (lower.includes("insurance") || lower.includes("assurance")) return "\u{1F6E1}";
  if (lower.includes("quality") || lower.includes("inspection") || lower.includes("qualite")) return "\u{2705}";
  if (lower.includes("weight") || lower.includes("poids")) return "\u{2696}";
  if (lower.includes("eudr") || lower.includes("deforestation")) return "\u{1F33F}";
  if (lower.includes("cbam") || lower.includes("carbon")) return "\u{1F3ED}";
  if (lower.includes("traceability") || lower.includes("tracabilite")) return "\u{1F4CD}";
  return "\u{1F4CB}";
}

export function getDocIssuer(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("facture")) return "Exporter";
  if (lower.includes("origin")) return "Chamber of Commerce";
  if (lower.includes("phyto")) return "Plant Protection Authority";
  if (lower.includes("packing") || lower.includes("colisage")) return "Exporter";
  if (lower.includes("bill of lading") || lower.includes("connaissement")) return "Shipping Line";
  if (lower.includes("insurance") || lower.includes("assurance")) return "Insurance Company";
  if (lower.includes("quality") || lower.includes("inspection") || lower.includes("qualite")) return "Inspection Authority";
  if (lower.includes("weight") || lower.includes("poids")) return "Weighing Authority";
  if (lower.includes("eudr") || lower.includes("deforestation")) return "Competent Authority";
  if (lower.includes("cbam") || lower.includes("carbon")) return "CBAM Declarant";
  if (lower.includes("traceability") || lower.includes("tracabilite")) return "Certification Body";
  if (lower.includes("export license")) return "Trade Ministry";
  return "Issuing Authority";
}

export function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function docTypeLabel(dt: string): string {
  return DOC_TYPES.find(d => d.value === dt)?.label || dt;
}
