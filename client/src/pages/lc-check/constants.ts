import type { LcDocumentType, CheckResultItem, LcCheckSummary, SupplierRequest } from "@shared/schema";

export const INCOTERMS = ["FOB", "CIF", "CFR", "FCA", "EXW", "DDP", "DAP", "CPT", "CIP", "FAS"];
export const CURRENCIES = ["USD", "EUR", "GBP", "CNY", "AED", "TRY", "XOF", "ZAR", "GHS", "NGN", "KES"];
export const QUANTITY_UNITS = ["kg", "MT", "bags", "pieces", "cartons", "drums", "litres", "CBM"];

export const DOC_TYPES: { value: LcDocumentType; label: string }[] = [
  { value: "commercial_invoice", label: "Commercial Invoice" },
  { value: "bill_of_lading", label: "Bill of Lading" },
  { value: "certificate_of_origin", label: "Certificate of Origin" },
  { value: "phytosanitary_certificate", label: "Phytosanitary Certificate" },
  { value: "packing_list", label: "Packing List" },
  { value: "other", label: "Other" },
];

export const WORKFLOW_STEPS = ["Lookup", "LC Check", "TwinLog Trail", "Archive"];
export const LC_TABS = ["Check", "Supplier docs", "TwinLog Trail", "Corrections"];
export const LC_STEP_LABELS = ["LC Terms", "Supplier Docs", "Review", "Results"];

export type LcCheckResponse = {
  id: string;
  results: CheckResultItem[];
  summary: LcCheckSummary;
  integrityHash: string;
  timestamp: string;
  correctionEmail: string;
  correctionWhatsApp: string;
  caseId: string | null;
  recheckNumber: number;
  freeRechecksRemaining: number;
};

export type LcPrefillData = {
  lookup_id: string;
  commodity_name: string;
  hs_code: string;
  origin_iso2: string;
  origin_name: string;
  dest_iso2: string;
  dest_name: string;
  incoterms: string;
  required_docs: string[];
};

export type TwinlogData = {
  lookup: {
    id: string;
    commodityId: string;
    commodityName: string;
    originName: string;
    destinationName: string;
    hsCode: string;
    resultJson: any;
    twinlogRef: string | null;
    twinlogHash: string | null;
    twinlogLockedAt: string | null;
    readinessScore: number | null;
    readinessVerdict: string | null;
    readinessFactors: any | null;
    readinessSummary: string | null;
    integrityHash: string | null;
    createdAt: string;
  };
  lcCheck: { id: string; verdict: string; createdAt: string } | null;
  supplierRequest: { id: string; docsRequired: string[]; docsReceived: string[]; status: string } | null;
  timeline: { event: string; timestamp: string }[];
};

export type UploadedFile = { file: File; name: string; size: number };

export type SupplierDocsResponse = {
  requestId: string;
  uploadToken: string;
  uploadUrl: string;
  supplierRequest: SupplierRequest;
};
