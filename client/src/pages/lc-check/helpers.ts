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
    default:
      return [
        { key: "description", label: "Description", type: "text" },
        { key: "chedReference", label: "CHED Reference (if applicable)", type: "text" },
      ];
  }
}

export function mapDocNameToType(docName: string): LcDocumentType {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial")) return "commercial_invoice";
  if (lower.includes("bill of lading") || lower.includes("b/l")) return "bill_of_lading";
  if (lower.includes("certificate of origin") || lower.includes("origin cert")) return "certificate_of_origin";
  if (lower.includes("phytosanitary") || lower.includes("sps")) return "phytosanitary_certificate";
  if (lower.includes("packing list")) return "packing_list";
  return "other";
}

export function getDocEmoji(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial")) return "\u{1F4C4}";
  if (lower.includes("origin") || lower.includes("coo")) return "\u{1F30D}";
  if (lower.includes("phyto") || lower.includes("sps")) return "\u{1F33F}";
  if (lower.includes("packing")) return "\u{1F4E6}";
  if (lower.includes("bill of lading") || lower.includes("b/l")) return "\u{1F6A2}";
  return "\u{1F4CB}";
}

export function getDocIssuer(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice")) return "Exporter";
  if (lower.includes("origin")) return "Chamber of Commerce";
  if (lower.includes("phyto")) return "Plant Protection Authority";
  if (lower.includes("packing")) return "Exporter";
  if (lower.includes("bill of lading")) return "Shipping Line";
  if (lower.includes("eudr")) return "Competent Authority";
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
