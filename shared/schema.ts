import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  uuid,
  boolean,
  jsonb,
  integer,
  timestamp,
  date,
  index,
  uniqueIndex,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const commodityTypeEnum = pgEnum("commodity_type", [
  "agricultural",
  "mineral",
  "forestry",
  "seafood",
  "livestock",
  "manufactured",
]);

export const generalRuleEnum = pgEnum("general_rule", [
  "WHOLLY_OBTAINED",
  "VALUE_ADD",
  "CTH",
  "CTSH",
  "SPECIFIC_PROCESS",
]);

export const destinations = pgTable(
  "destinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryName: text("country_name").notNull(),
    iso2: varchar("iso2", { length: 2 }).notNull().unique(),
    tariffSource: text("tariff_source").notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull(),
    spsRegime: text("sps_regime").notNull(),
    securityFiling: text("security_filing").notNull(),
    specialRules: jsonb("special_rules"),
    preferenceSchemes: jsonb("preference_schemes"),
    isAfcftaMember: boolean("is_afcfta_member").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("destinations_iso2_idx").on(table.iso2)]
);

export const regionalFrameworks = pgTable("regional_frameworks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  memberCountries: text("member_countries").array().notNull(),
  cetBands: jsonb("cet_bands"),
  cooType: text("coo_type").notNull(),
  exportProcedures: text("export_procedures"),
  customsCode: text("customs_code").notNull(),
});

export const originCountries = pgTable(
  "origin_countries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryName: text("country_name").notNull(),
    iso2: varchar("iso2", { length: 2 }).notNull().unique(),
    frameworkId: uuid("framework_id").references(() => regionalFrameworks.id),
    phytoAuthority: text("phyto_authority").notNull(),
    cooIssuingBody: text("coo_issuing_body").notNull(),
    customsAdmin: text("customs_admin").notNull(),
    tradePortalUrl: text("trade_portal_url"),
    commodityCouncils: jsonb("commodity_councils"),
    operationalNotes: text("operational_notes"),
    isAfcftaMember: boolean("is_afcfta_member").default(true).notNull(),
    status: text("status").default("INCLUDE"),
    flagReason: text("flag_reason"),
    flagDetails: text("flag_details"),
    agoaStatus: text("agoa_status"),
    agoaReason: text("agoa_reason"),
    usTariffRate: text("us_tariff_rate"),
    keyRegulations: text("key_regulations"),
    primaryExportRisk: text("primary_export_risk"),
    region: text("region"),
  },
  (table) => [index("origin_countries_iso2_idx").on(table.iso2)]
);

export const commodities = pgTable(
  "commodities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    hsCode: varchar("hs_code", { length: 10 }).notNull(),
    commodityType: commodityTypeEnum("commodity_type").notNull(),
    triggersSps: boolean("triggers_sps").default(false).notNull(),
    triggersEudr: boolean("triggers_eudr").default(false).notNull(),
    triggersKimberley: boolean("triggers_kimberley").default(false).notNull(),
    triggersConflict: boolean("triggers_conflict").default(false).notNull(),
    triggersCbam: boolean("triggers_cbam").default(false).notNull(),
    triggersCsddd: boolean("triggers_csddd").default(false).notNull(),
    triggersIuu: boolean("triggers_iuu").default(false).notNull(),
    triggersCites: boolean("triggers_cites").default(false).notNull(),
    triggersLaceyAct: boolean("triggers_lacey_act").default(false).notNull(),
    triggersFdaPriorNotice: boolean("triggers_fda_prior_notice").default(false).notNull(),
    triggersReach: boolean("triggers_reach").default(false).notNull(),
    triggersSection232: boolean("triggers_section_232").default(false).notNull(),
    triggersFsis: boolean("triggers_fsis").default(false).notNull(),
    knownHazards: text("known_hazards").array(),
    stopFlags: jsonb("stop_flags"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("commodities_hs_code_idx").on(table.hsCode)]
);

export const afcftaRoo = pgTable(
  "afcfta_roo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hsHeading: varchar("hs_heading", { length: 10 }).notNull(),
    generalRule: generalRuleEnum("general_rule").notNull(),
    minValueAddPct: integer("min_value_add_pct"),
    alternativeCriteria: jsonb("alternative_criteria"),
    specificProcess: text("specific_process"),
    notes: text("notes"),
    sourceRef: text("source_ref").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("afcfta_roo_hs_heading_idx").on(table.hsHeading)]
);

export const tradeStatusEnum = pgEnum("trade_status", [
  "active",
  "in_transit",
  "arrived",
  "cleared",
  "closed",
  "archived",
]);

export const lookups = pgTable("lookups", {
  id: uuid("id").primaryKey().defaultRandom(),
  commodityId: uuid("commodity_id").notNull(),
  originId: uuid("origin_id").notNull(),
  destinationId: uuid("destination_id").notNull(),
  commodityName: text("commodity_name").notNull(),
  originName: text("origin_name").notNull(),
  destinationName: text("destination_name").notNull(),
  hsCode: varchar("hs_code", { length: 10 }).notNull(),
  riskLevel: text("risk_level").notNull(),
  resultJson: jsonb("result_json").notNull(),
  integrityHash: text("integrity_hash"),
  readinessScore: integer("readiness_score"),
  readinessVerdict: varchar("readiness_verdict", { length: 10 }),
  readinessFactors: jsonb("readiness_factors"),
  readinessSummary: text("readiness_summary"),
  twinlogRef: text("twinlog_ref"),
  twinlogHash: text("twinlog_hash"),
  twinlogLockedAt: timestamp("twinlog_locked_at"),
  eudrComplete: boolean("eudr_complete").default(false),
  sessionId: text("session_id"),
  tradeStatus: tradeStatusEnum("trade_status").default("active"),
  archivedAt: timestamp("archived_at"),
  closedAt: timestamp("closed_at"),
  estimatedArrival: date("estimated_arrival"),
  actualArrival: date("actual_arrival"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("lookups_session_idx").on(table.sessionId),
]);

export const insertLookupSchema = createInsertSchema(lookups).omit({
  id: true,
  createdAt: true,
});

export type InsertLookup = z.infer<typeof insertLookupSchema>;
export type Lookup = typeof lookups.$inferSelect;

export const tokenTransactionTypeEnum = pgEnum("token_transaction_type", [
  "PURCHASE",
  "SPEND",
]);

export const userTokens = pgTable("user_tokens", {
  sessionId: text("session_id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  lcBalance: integer("lc_balance").notNull().default(0),
  freeLookupUsed: boolean("free_lookup_used").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserTokens = typeof userTokens.$inferSelect;

export const tokenTransactions = pgTable("token_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  type: tokenTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    name: text("name").notNull(),
    commodityId: uuid("commodity_id").notNull(),
    originIso2: varchar("origin_iso2", { length: 2 }).notNull(),
    destIso2: varchar("dest_iso2", { length: 2 }).notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    regVersionHash: text("reg_version_hash").notNull(),
    lastUsedAt: timestamp("last_used_at"),
    timesUsed: integer("times_used").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("templates_session_idx").on(table.sessionId)]
);

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  lastUsedAt: true,
  timesUsed: true,
  createdAt: true,
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

export const lcVerdictEnum = pgEnum("lc_verdict", [
  "COMPLIANT",
  "COMPLIANT_WITH_NOTES",
  "DISCREPANCIES_FOUND",
]);

export const lcCaseStatusEnum = pgEnum("lc_case_status", [
  "checking",
  "all_clear",
  "discrepancy",
  "pending_correction",
  "rechecking",
  "resolved",
  "closed",
]);

export const lcChecks = pgTable("lc_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  lcFieldsJson: jsonb("lc_fields_json").notNull(),
  documentsJson: jsonb("documents_json").notNull(),
  resultsJson: jsonb("results_json").notNull(),
  summary: jsonb("summary").notNull(),
  verdict: lcVerdictEnum("verdict").notNull(),
  correctionEmail: text("correction_email"),
  correctionWhatsApp: text("correction_whatsapp"),
  commsLog: jsonb("comms_log"),
  integrityHash: text("integrity_hash"),
  sourceLookupId: uuid("source_lookup_id"),
  sessionId: text("session_id"),
  caseId: uuid("case_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lcCases = pgTable(
  "lc_cases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    sourceLookupId: uuid("source_lookup_id"),
    status: lcCaseStatusEnum("status").notNull().default("checking"),
    initialCheckId: uuid("initial_check_id"),
    latestCheckId: uuid("latest_check_id"),
    recheckCount: integer("recheck_count").notNull().default(0),
    maxFreeRechecks: integer("max_free_rechecks").notNull().default(3),
    lcReference: text("lc_reference"),
    beneficiaryName: text("beneficiary_name"),
    correctionRequests: jsonb("correction_requests").notNull().default([]),
    checkHistory: jsonb("check_history").notNull().default([]),
    parkedAt: timestamp("parked_at"),
    closedAt: timestamp("closed_at"),
    closedReason: text("closed_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_lc_cases_session").on(table.sessionId),
    index("idx_lc_cases_lookup").on(table.sourceLookupId),
  ]
);

export const insertLcCheckSchema = createInsertSchema(lcChecks).omit({
  id: true,
  createdAt: true,
});

export type InsertLcCheck = z.infer<typeof insertLcCheckSchema>;
export type LcCheck = typeof lcChecks.$inferSelect;

export const insertLcCaseSchema = createInsertSchema(lcCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLcCase = z.infer<typeof insertLcCaseSchema>;
export type LcCase = typeof lcCases.$inferSelect;
export type LcCaseStatus = "checking" | "all_clear" | "discrepancy" | "pending_correction" | "rechecking" | "resolved" | "closed";

export type CorrectionRequestEntry = {
  sentAt: string;
  channel: "email" | "whatsapp" | "link";
  discrepancyCount: number;
};

export type CheckHistoryEntry = {
  checkId: string;
  verdict: "COMPLIANT" | "COMPLIANT_WITH_NOTES" | "DISCREPANCIES_FOUND";
  createdAt: string;
  recheckNumber: number;
  summary: string;
};

export const lcFieldsSchema = z.object({
  beneficiaryName: z.string().min(1),
  applicantName: z.string().min(1),
  goodsDescription: z.string().min(1),
  hsCode: z.string(),
  quantity: z.number(),
  quantityUnit: z.string(),
  unitPrice: z.number(),
  currency: z.string(),
  totalAmount: z.number().min(0),
  countryOfOrigin: z.string(),
  portOfLoading: z.string(),
  portOfDischarge: z.string(),
  latestShipmentDate: z.string(),
  lcExpiryDate: z.string(),
  incoterms: z.string(),
  partialShipmentsAllowed: z.boolean(),
  transhipmentAllowed: z.boolean(),
  lcReference: z.string(),
  issuingBank: z.string().optional().default(""),
  advisingBank: z.string().optional().default(""),
  issuingBankSwift: z.string().optional().default(""),
  advisingBankSwift: z.string().optional().default(""),
});

export type LcFields = z.infer<typeof lcFieldsSchema>;

export type LcDocumentType =
  | "commercial_invoice"
  | "bill_of_lading"
  | "certificate_of_origin"
  | "phytosanitary_certificate"
  | "packing_list"
  | "other";

export const lcDocumentSchema = z.object({
  documentType: z.enum(["commercial_invoice", "bill_of_lading", "certificate_of_origin", "phytosanitary_certificate", "packing_list", "other"]),
  fields: z.record(z.string()),
});

export type LcDocument = z.infer<typeof lcDocumentSchema>;

export const lcCheckRequestSchema = z.object({
  lcFields: lcFieldsSchema,
  documents: z.array(lcDocumentSchema).min(1),
  sourceLookupId: z.string().uuid().optional(),
});

export type CheckSeverity = "GREEN" | "AMBER" | "RED";

export type CheckResultItem = {
  fieldName: string;
  lcValue: string;
  documentValue: string;
  documentType: string;
  severity: CheckSeverity;
  ucpRule: string;
  explanation: string;
};

export type LcCheckSummary = {
  totalChecks: number;
  matches: number;
  warnings: number;
  criticals: number;
  passRate: number;
  verdict: "COMPLIANT" | "COMPLIANT_WITH_NOTES" | "DISCREPANCIES_FOUND";
};

export const insertDestinationSchema = createInsertSchema(destinations).omit({
  id: true,
  createdAt: true,
});
export const insertRegionalFrameworkSchema = createInsertSchema(
  regionalFrameworks
).omit({ id: true });
export const insertOriginCountrySchema = createInsertSchema(
  originCountries
).omit({ id: true });
export const insertCommoditySchema = createInsertSchema(commodities).omit({
  id: true,
  createdAt: true,
});
export const insertAfcftaRooSchema = createInsertSchema(afcftaRoo).omit({
  id: true,
  updatedAt: true,
});

export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinations.$inferSelect;
export type InsertRegionalFramework = z.infer<
  typeof insertRegionalFrameworkSchema
>;
export type RegionalFramework = typeof regionalFrameworks.$inferSelect;
export type InsertOriginCountry = z.infer<typeof insertOriginCountrySchema>;
export type OriginCountry = typeof originCountries.$inferSelect;
export type InsertCommodity = z.infer<typeof insertCommoditySchema>;
export type Commodity = typeof commodities.$inferSelect;
export type InsertAfcftaRoo = z.infer<typeof insertAfcftaRooSchema>;
export type AfcftaRoo = typeof afcftaRoo.$inferSelect;

export const companyProfiles = pgTable("company_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull().unique(),
  companyName: text("company_name").notNull(),
  registeredAddress: text("registered_address").notNull(),
  countryIso2: varchar("country_iso2", { length: 2 }).notNull(),
  vatNumber: text("vat_number"),
  eoriNumber: text("eori_number"),
  contactEmail: text("contact_email"),
  profileComplete: boolean("profile_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
  profileComplete: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;

export const twinlogDownloads = pgTable("twinlog_downloads", {
  id: uuid("id").primaryKey().defaultRandom(),
  lookupId: uuid("lookup_id"),
  sessionId: text("session_id"),
  companyName: text("company_name"),
  eoriNumber: text("eori_number"),
  documentStatuses: jsonb("document_statuses"),
  pdfHash: text("pdf_hash"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export type TwinlogDownload = typeof twinlogDownloads.$inferSelect;

export const supplierRequests = pgTable(
  "supplier_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lookupId: uuid("lookup_id").references(() => lookups.id, { onDelete: "cascade" }),
    userSessionId: text("user_session_id").notNull(),
    supplierName: text("supplier_name").notNull().default("Supplier"),
    supplierEmail: text("supplier_email"),
    supplierWhatsapp: text("supplier_whatsapp"),
    uploadToken: uuid("upload_token").unique().defaultRandom(),
    uploadExpiresAt: timestamp("upload_expires_at").notNull(),
    status: text("status").notNull().default("waiting"),
    docsRequired: jsonb("docs_required").notNull().default([]),
    docsReceived: jsonb("docs_received").notNull().default([]),
    sentVia: text("sent_via").array().default([]),
    lastSentAt: timestamp("last_sent_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_supplier_requests_session").on(table.userSessionId),
    index("idx_supplier_requests_token").on(table.uploadToken),
  ]
);

export const insertSupplierRequestSchema = createInsertSchema(supplierRequests).omit({
  id: true,
  uploadToken: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupplierRequest = z.infer<typeof insertSupplierRequestSchema>;
export type SupplierRequest = typeof supplierRequests.$inferSelect;

export const supplierUploads = pgTable(
  "supplier_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id").references(() => supplierRequests.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(),
    originalFilename: text("original_filename").notNull(),
    fileKey: text("file_key").notNull(),
    filesizeBytes: integer("filesize_bytes"),
    mimeType: text("mime_type"),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
    uploadedBy: text("uploaded_by").default("supplier"),
    verified: boolean("verified").default(false),
    finding: text("finding"),
    ucpRule: text("ucp_rule"),
  },
  (table) => [index("idx_supplier_uploads_request").on(table.requestId)]
);

export type SupplierUpload = typeof supplierUploads.$inferSelect;

export const alertSubscriptions = pgTable(
  "alert_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userSessionId: text("user_session_id").notNull(),
    commodityId: uuid("commodity_id").references(() => commodities.id),
    destIso2: varchar("dest_iso2", { length: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("alert_sub_unique_idx").on(table.userSessionId, table.commodityId, table.destIso2),
  ]
);

export const insertAlertSubscriptionSchema = createInsertSchema(alertSubscriptions).omit({
  id: true,
  createdAt: true,
});
export type InsertAlertSubscription = z.infer<typeof insertAlertSubscriptionSchema>;
export type AlertSubscription = typeof alertSubscriptions.$inferSelect;

export const regulatoryAlerts = pgTable("regulatory_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull().default("MANUAL"),
  hsCodesAffected: text("hs_codes_affected").array().default([]),
  destIso2Affected: varchar("dest_iso2_affected", { length: 2 }).array(),
  summary: text("summary").notNull(),
  sourceUrl: text("source_url"),
  effectiveDate: date("effective_date"),
  isDeadline: boolean("is_deadline").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRegulatoryAlertSchema = createInsertSchema(regulatoryAlerts).omit({
  id: true,
  createdAt: true,
});
export type InsertRegulatoryAlert = z.infer<typeof insertRegulatoryAlertSchema>;
export type RegulatoryAlert = typeof regulatoryAlerts.$inferSelect;

export const alertReads = pgTable(
  "alert_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userSessionId: text("user_session_id").notNull(),
    alertId: uuid("alert_id").references(() => regulatoryAlerts.id),
    readAt: timestamp("read_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("alert_reads_unique_idx").on(table.userSessionId, table.alertId),
  ]
);

export type AlertRead = typeof alertReads.$inferSelect;

export const eudrRecords = pgTable(
  "eudr_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lookupId: uuid("lookup_id").references(() => lookups.id, { onDelete: "cascade" }),
    userSessionId: text("user_session_id").notNull(),
    commodityId: uuid("commodity_id").references(() => commodities.id),
    originIso2: varchar("origin_iso2", { length: 2 }),
    destIso2: varchar("dest_iso2", { length: 2 }),
    plotCoordinates: jsonb("plot_coordinates"),
    plotCountryIso2: varchar("plot_country_iso2", { length: 2 }),
    plotCountryValid: boolean("plot_country_valid"),
    cutoffDate: date("cutoff_date").default("2020-12-31"),
    evidenceType: text("evidence_type"),
    evidenceReference: text("evidence_reference"),
    evidenceDate: date("evidence_date"),
    supplierName: text("supplier_name"),
    supplierAddress: text("supplier_address"),
    supplierRegNumber: text("supplier_reg_number"),
    sanctionsChecked: boolean("sanctions_checked").default(false),
    sanctionsClear: boolean("sanctions_clear"),
    riskLevel: text("risk_level"),
    riskFactors: jsonb("risk_factors").default([]),
    highRiskReason: text("high_risk_reason"),
    statementJson: jsonb("statement_json"),
    statementPdfKey: text("statement_pdf_key"),
    status: text("status").default("draft"),
    retentionUntil: date("retention_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_eudr_lookup").on(table.lookupId),
    index("idx_eudr_session").on(table.userSessionId),
  ]
);

export const insertEudrRecordSchema = createInsertSchema(eudrRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEudrRecord = z.infer<typeof insertEudrRecordSchema>;
export type EudrRecord = typeof eudrRecords.$inferSelect;

export type DocumentStatus = "PENDING" | "READY" | "RISK_ACCEPTED";
export type DocumentOwner = "IMPORTER" | "SUPPLIER" | "BROKER";
export type DocumentDueBy = "BEFORE_LOADING" | "BEFORE_ARRIVAL" | "POST_ARRIVAL";

export type RequirementDetail = {
  title: string;
  description: string;
  issuedBy: string;
  whenNeeded: string;
  tip: string;
  portalGuide: string | null;
  documentCode: string | null;
  isSupplierSide: boolean;
  status: DocumentStatus;
  owner: DocumentOwner;
  due_by: DocumentDueBy;
};

export type ComplianceReadiness = {
  overall_status: "READY" | "CONDITIONAL" | "NOT_READY";
  border_clearance: "READY" | "CONDITIONAL" | "BLOCKED";
  finance_ready: "YES" | "NO";
  audit_exposure_24m: "LOW" | "MEDIUM" | "HIGH";
  rationale: string[];
};

export type ReadinessFactors = {
  regulatory_complexity: { penalty: number; max: number; overlay_count: number };
  hazard_exposure: { penalty: number; max: number; primary_hazard: string | null };
  document_volume: { penalty: number; max: number; document_count: number };
  trade_restriction: { penalty: number; max: number; stop_triggered: boolean };
  total_penalty: number;
  score: number;
  primary_risk_factor: string;
};

export type ReadinessScoreResult = {
  score: number;
  verdict: "GREEN" | "AMBER" | "RED";
  summary: string;
  factors: ReadinessFactors;
};

export type ComplianceResult = {
  commodity: Commodity;
  origin: OriginCountry & { framework?: RegionalFramework | null };
  destination: Destination;
  triggers: {
    sps: boolean;
    eudr: boolean;
    kimberley: boolean;
    conflict: boolean;
    cbam: boolean;
    csddd: boolean;
    iuu: boolean;
    cites: boolean;
    laceyAct: boolean;
    fdaPriorNotice: boolean;
    reach: boolean;
    section232: boolean;
    fsis: boolean;
  };
  hazards: string[];
  stopFlags: Record<string, string> | null;
  requirements: string[];
  requirementsDetailed: RequirementDetail[];
  afcftaEligible: boolean;
  afcftaRoo: AfcftaRoo | null;
  complianceReadiness: ComplianceReadiness;
  readinessScore: ReadinessScoreResult;
  agoaEligible?: boolean;
  originFlagged?: boolean;
  originFlagReason?: string | null;
  originFlagDetails?: string | null;
};

/* ── Promo Codes ── */
export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  tradeTokens: integer("trade_tokens").notNull().default(0),
  lcCredits: integer("lc_credits").notNull().default(0),
  maxRedemptions: integer("max_redemptions").notNull().default(1),
  currentRedemptions: integer("current_redemptions").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;

export const promoRedemptions = pgTable(
  "promo_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    promoCodeId: uuid("promo_code_id").notNull(),
    sessionId: text("session_id").notNull(),
    redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("promo_redemption_unique_idx").on(table.promoCodeId, table.sessionId),
  ]
);

export type PromoRedemption = typeof promoRedemptions.$inferSelect;

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;

/* ── Document Extractions (LC auto-extraction audit log) ── */
export const documentExtractions = pgTable(
  "document_extractions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: text("session_id").notNull(),
    documentType: text("document_type").notNull(),
    originalFilename: text("original_filename").notNull(),
    extractedText: text("extracted_text"),
    extractionJson: jsonb("extraction_json"),
    overallConfidence: text("overall_confidence"),
    llmModel: text("llm_model"),
    llmTokensUsed: integer("llm_tokens_used"),
    processingTimeMs: integer("processing_time_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_doc_extractions_session").on(table.sessionId)]
);

export type DocumentExtraction = typeof documentExtractions.$inferSelect;

/* ── Users (Auth) ── */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    sessionId: text("session_id").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_session_idx").on(table.sessionId),
  ]
);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/* ── Trade Events (TwinLog Audit Chain) ── */
export const tradeEvents = pgTable(
  "trade_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lookupId: uuid("lookup_id").notNull().references(() => lookups.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data").notNull(),
    previousHash: text("previous_hash"),
    eventHash: text("event_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("trade_events_lookup_idx").on(table.lookupId, table.createdAt),
    index("trade_events_session_idx").on(table.sessionId),
  ]
);

export type TradeEvent = typeof tradeEvents.$inferSelect;
export type InsertTradeEvent = typeof tradeEvents.$inferInsert;

export type TradeStatus = "active" | "in_transit" | "arrived" | "cleared" | "closed" | "archived";
