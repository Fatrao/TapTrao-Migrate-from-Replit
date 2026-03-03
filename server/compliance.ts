import { storage } from "./storage";
import type { ComplianceResult, ComplianceReadiness, ReadinessScoreResult, ReadinessFactors, Commodity, OriginCountry, Destination, RegionalFramework, AfcftaRoo, RequirementDetail, DocumentOwner, DocumentDueBy, ComplianceRule } from "@shared/schema";

export async function runComplianceCheck(
  commodityId: string,
  originId: string,
  destinationId: string
): Promise<ComplianceResult> {
  const [commodity, origin, destination] = await Promise.all([
    storage.getCommodityById(commodityId),
    storage.getOriginCountryById(originId),
    storage.getDestinationById(destinationId),
  ]);

  if (!commodity) throw new Error("Commodity not found");
  if (!origin) throw new Error("Origin country not found");
  if (!destination) throw new Error("Destination not found");

  let framework: RegionalFramework | null = null;
  if (origin.frameworkId) {
    framework = (await storage.getRegionalFrameworkById(origin.frameworkId)) ?? null;
  }

  const triggers = {
    sps: commodity.triggersSps,
    eudr: commodity.triggersEudr,
    kimberley: commodity.triggersKimberley,
    conflict: commodity.triggersConflict,
    cbam: commodity.triggersCbam,
    csddd: commodity.triggersCsddd,
    iuu: commodity.triggersIuu,
    cites: commodity.triggersCites,
    laceyAct: commodity.triggersLaceyAct,
    fdaPriorNotice: commodity.triggersFdaPriorNotice,
    reach: commodity.triggersReach,
    section232: commodity.triggersSection232,
    fsis: commodity.triggersFsis,
  };

  const hazards = commodity.knownHazards ?? [];
  const stopFlags = (commodity.stopFlags as Record<string, string> | null) ?? null;
  const afcftaEligible = origin.isAfcftaMember && destination.isAfcftaMember;
  const agoaEligible = destination.iso2 === "US" && origin.agoaStatus === "Eligible";
  const originFlagged = origin.status === "FLAG";
  const originFlagReason = origin.flagReason ?? null;
  const originFlagDetails = origin.flagDetails ?? null;

  const hsHeading = commodity.hsCode.substring(0, 4);
  let roo: AfcftaRoo | null = null;
  if (afcftaEligible) {
    roo = (await storage.getAfcftaRooByHsHeading(hsHeading)) ?? null;
  }

  const detailed = await buildRequirementsFromDB(commodity, origin, destination, framework, triggers, afcftaEligible, roo, { agoaEligible, originFlagged });

  const requirements = detailed.map(d => d.title);

  const complianceReadiness = evaluateComplianceReadiness({
    triggers,
    hazards,
    stopFlags,
    requirementsDetailed: detailed,
  });

  const readinessScore = computeReadinessScore({
    triggers,
    hazards,
    stopFlags,
    requirementsDetailed: detailed,
  });

  return {
    commodity,
    origin: { ...origin, framework },
    destination,
    triggers,
    hazards,
    stopFlags,
    requirements,
    requirementsDetailed: detailed,
    afcftaEligible,
    afcftaRoo: roo,
    complianceReadiness,
    readinessScore,
    agoaEligible,
    originFlagged,
    originFlagReason,
    originFlagDetails,
  };
}

function portalGuideForDestination(dest: Destination): string | null {
  const iso = dest.iso2;
  if (iso === "GB") return "Submit via IPAFFS (Import of Products, Animals, Food and Feed System) — https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system";
  if (iso === "EU") return "Submit via TRACES NT (Trade Control and Expert System) — https://webgate.ec.europa.eu/tracesnt";
  if (iso === "CH") return "Submit via Swiss e-dec electronic customs declaration system — https://www.bazg.admin.ch/bazg/en/home.html";
  if (iso === "US") return "File via ACE (Automated Commercial Environment) — https://www.cbp.gov/trade/ace";
  return null;
}

function portalGuideForOrigin(origin: OriginCountry): string | null {
  const iso = origin.iso2;
  if (iso === "CI") return "Submit via GUCE (Guichet Unique du Commerce Extérieur) — https://www.guce.gouv.ci";
  return null;
}

type RawRequirement = Omit<RequirementDetail, "status" | "owner" | "due_by">;

function assignDocumentMeta(r: RawRequirement): RequirementDetail {
  const titleLower = r.title.toLowerCase();

  let owner: DocumentOwner;
  if (r.isSupplierSide) {
    owner = "SUPPLIER";
  } else if (titleLower.includes("customs") && (titleLower.includes("declaration") || titleLower.includes("import declaration"))) {
    owner = "BROKER";
  } else if (titleLower.includes("security filing")) {
    owner = "BROKER";
  } else {
    owner = "IMPORTER";
  }

  let due_by: DocumentDueBy;
  if (titleLower.includes("customs") && titleLower.includes("declaration")) {
    due_by = "BEFORE_ARRIVAL";
  } else if (titleLower.includes("ipaffs") || titleLower.includes("traces") || titleLower.includes("ched") || titleLower.includes("fsvo") || titleLower.includes("blv")) {
    due_by = "BEFORE_ARRIVAL";
  } else if (titleLower.includes("port health") || titleLower.includes("sps compliance")) {
    due_by = "POST_ARRIVAL";
  } else if (titleLower.includes("vat") || titleLower.includes("gst")) {
    due_by = "POST_ARRIVAL";
  } else if (titleLower.includes("security filing") || titleLower.includes("isf 10+2")) {
    due_by = "BEFORE_ARRIVAL";
  } else if (titleLower.includes("fda") || titleLower.includes("prior notice") || titleLower.includes("fsvp")) {
    due_by = "BEFORE_ARRIVAL";
  } else if (titleLower.includes("lacey act")) {
    due_by = "BEFORE_ARRIVAL";
  } else if (titleLower.includes("ofac")) {
    due_by = "BEFORE_LOADING";
  } else if (titleLower.includes("customs bond") || titleLower.includes("htsus classification")) {
    due_by = "BEFORE_LOADING";
  } else if (titleLower.includes("audit trail") || titleLower.includes("reasonable care")) {
    due_by = "POST_ARRIVAL";
  } else {
    due_by = "BEFORE_LOADING";
  }

  return { ...r, status: "PENDING", owner, due_by };
}

// ── Phase 3: Template Engine, Extra Conditions Evaluator, DB-driven Requirements ──

const SUPPORTED_EXTRA_CONDITION_KEYS = new Set([
  "hs_chapters", "agoa_eligible", "origin_flagged", "afcfta_eligible",
  "has_framework", "commodity_name_contains", "exclude_destinations",
  "second_trigger", "commodity_types",
]);

function validateExtraConditions(ec: unknown): boolean {
  if (ec === null || ec === undefined) return true;
  if (typeof ec !== "object" || Array.isArray(ec)) {
    console.warn("[Phase3] extra_conditions is not a plain object:", ec);
    return false;
  }
  const obj = ec as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!SUPPORTED_EXTRA_CONDITION_KEYS.has(key)) {
      console.warn(`[Phase3] Unknown extra_condition key: "${key}" — will be ignored`);
    }
  }
  return true;
}

type TemplateContext = {
  commodity: { name: string; hsCode: string; commodityType: string };
  origin: {
    countryName: string; iso2: string; phytoAuthority: string;
    cooIssuingBody: string; customsAdmin: string;
    usTariffRate: string | null; flagReason: string | null; flagDetails: string | null;
  };
  destination: {
    countryName: string; iso2: string; vatRate: string;
    spsRegime: string; securityFiling: string; tariffSource: string;
  };
  framework: { name: string; cooType: string; customsCode: string } | null;
  portalGuide: { origin: string | null; destination: string | null };
};

function buildTemplateContext(
  commodity: Commodity,
  origin: OriginCountry,
  destination: Destination,
  framework: RegionalFramework | null
): TemplateContext {
  return {
    commodity: {
      name: commodity.name,
      hsCode: commodity.hsCode,
      commodityType: commodity.commodityType,
    },
    origin: {
      countryName: origin.countryName,
      iso2: origin.iso2,
      phytoAuthority: origin.phytoAuthority,
      cooIssuingBody: origin.cooIssuingBody,
      customsAdmin: origin.customsAdmin,
      usTariffRate: origin.usTariffRate ?? null,
      flagReason: origin.flagReason ?? null,
      flagDetails: origin.flagDetails ?? null,
    },
    destination: {
      countryName: destination.countryName,
      iso2: destination.iso2,
      vatRate: String(destination.vatRate),
      spsRegime: destination.spsRegime,
      securityFiling: destination.securityFiling,
      tariffSource: destination.tariffSource,
    },
    framework: framework
      ? { name: framework.name, cooType: framework.cooType, customsCode: framework.customsCode }
      : null,
    portalGuide: {
      origin: portalGuideForOrigin(origin),
      destination: portalGuideForDestination(destination),
    },
  };
}

function renderTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, entity: string, property: string) => {
    const section = (ctx as Record<string, unknown>)[entity];
    if (section === null || section === undefined) return "";
    if (typeof section === "object") {
      const value = (section as Record<string, unknown>)[property];
      if (value === null || value === undefined) return "";
      return String(value);
    }
    return "";
  });
}

type ExtraConditionsContext = {
  hsChapter: number;
  commodityName: string;
  agoaEligible: boolean;
  originFlagged: boolean;
  afcftaEligible: boolean;
  hasFramework: boolean;
  destinationIso2: string;
  triggerFlags: Record<string, boolean>;
  commodityType?: string;
};

function evaluateExtraConditions(rule: ComplianceRule, ecCtx: ExtraConditionsContext): boolean {
  const ec = rule.extraConditions as Record<string, unknown> | null;
  if (!ec) return true;
  if (!validateExtraConditions(ec)) return true; // pass through on invalid shape

  // hs_chapters: commodity HS chapter (first 2 digits as number) must be in the array
  if (ec.hs_chapters !== undefined) {
    const chapters = ec.hs_chapters as number[];
    if (!chapters.includes(ecCtx.hsChapter)) return false;
  }

  // agoa_eligible: must match
  if (ec.agoa_eligible !== undefined) {
    if (ecCtx.agoaEligible !== ec.agoa_eligible) return false;
  }

  // origin_flagged: must match
  if (ec.origin_flagged !== undefined) {
    if (ecCtx.originFlagged !== ec.origin_flagged) return false;
  }

  // afcfta_eligible: must match
  if (ec.afcfta_eligible !== undefined) {
    if (ecCtx.afcftaEligible !== ec.afcfta_eligible) return false;
  }

  // has_framework: must match
  if (ec.has_framework !== undefined) {
    if (ecCtx.hasFramework !== ec.has_framework) return false;
  }

  // commodity_name_contains: commodity name (lowercase) must contain the string
  if (ec.commodity_name_contains !== undefined) {
    const needle = String(ec.commodity_name_contains).toLowerCase();
    if (!ecCtx.commodityName.toLowerCase().includes(needle)) return false;
  }

  // exclude_destinations: destination iso2 must NOT be in the array
  if (ec.exclude_destinations !== undefined) {
    const excluded = ec.exclude_destinations as string[];
    if (excluded.includes(ecCtx.destinationIso2)) return false;
  }

  // second_trigger: the named trigger must also be active
  if (ec.second_trigger !== undefined) {
    const triggerName = String(ec.second_trigger);
    if (!ecCtx.triggerFlags[triggerName]) return false;
  }

  // commodity_types: commodity type must be in the array
  if (ec.commodity_types !== undefined) {
    const types = ec.commodity_types as string[];
    if (ecCtx.commodityType && !types.includes(ecCtx.commodityType)) return false;
  }

  return true;
}

function buildDynamicRequirements(
  commodity: Commodity,
  origin: OriginCountry,
  destination: Destination,
  framework: RegionalFramework | null,
  triggers: ComplianceResult["triggers"],
  afcftaEligible: boolean,
  roo: AfcftaRoo | null,
  extra?: { agoaEligible?: boolean; originFlagged?: boolean }
): RawRequirement[] {
  const reqs: RawRequirement[] = [];
  const destPortal = portalGuideForDestination(destination);
  const originPortal = portalGuideForOrigin(origin);

  // Framework clearance
  if (framework) {
    reqs.push({
      title: `${framework.name} regional export clearance (${framework.cooType} certificate, customs code: ${framework.customsCode})`,
      description: `Regional trade bloc clearance under ${framework.name}. This certifies the goods meet the common external tariff (CET) classification and regional transit requirements.`,
      issuedBy: `${framework.name} Secretariat / National Customs`,
      whenNeeded: "Before export — required alongside national Certificate of Origin",
      tip: `Use customs code ${framework.customsCode} on all declarations. Goods transiting other ${framework.name} member states may need a T1 transit document.`,
      portalGuide: originPortal,
      documentCode: null,
      isSupplierSide: true,
    });
  }

  // Destination special rules (skip for US/CA)
  if (destination.iso2 !== "US" && destination.iso2 !== "CA") {
    const destSpecial = destination.specialRules as Record<string, string> | null;
    if (destSpecial) {
      for (const [key, desc] of Object.entries(destSpecial)) {
        if (shouldApplySpecialRule(key, commodity)) {
          reqs.push({
            title: desc,
            description: `Special rule applicable to ${destination.countryName} for this commodity type.`,
            issuedBy: `${destination.countryName} regulatory authority`,
            whenNeeded: "At import — verified during customs clearance",
            tip: "Check with your customs broker whether this special rule applies to your specific product variant.",
            portalGuide: destPortal,
            documentCode: null,
            isSupplierSide: false,
          });
        }
      }
    }
  }

  // Preference schemes
  const destPrefs = destination.preferenceSchemes as Record<string, string> | null;
  if (destPrefs && afcftaEligible) {
    for (const [, desc] of Object.entries(destPrefs)) {
      reqs.push({
        title: desc,
        description: "Preferential tariff scheme that may reduce or eliminate import duties for eligible goods.",
        issuedBy: `${destination.countryName} customs authority`,
        whenNeeded: "At import — claim preference on the customs declaration",
        tip: "Preference claims require a valid Certificate of Origin. Keep documentation for post-clearance audit (typically 3-5 years).",
        portalGuide: destPortal,
        documentCode: null,
        isSupplierSide: false,
      });
    }
  }

  // VAT/GST — now in DB as `always_vat_gst`, removed from dynamic requirements

  // AfCFTA Certificate of Origin
  if (afcftaEligible) {
    reqs.push({
      title: "AfCFTA Certificate of Origin may qualify shipment for preferential tariff rates",
      description: "Under the African Continental Free Trade Area agreement, goods meeting the Rules of Origin criteria can benefit from reduced or zero tariff rates when traded between AfCFTA member states.",
      issuedBy: origin.cooIssuingBody,
      whenNeeded: "Before shipment — must accompany goods for preferential treatment",
      tip: "Ensure the product meets the specific Rule of Origin for its HS heading. The AfCFTA certificate uses a standardised format agreed by member states.",
      portalGuide: originPortal,
      documentCode: "C644",
      isSupplierSide: true,
    });

    // AfCFTA RoO detail
    if (roo) {
      const ruleLabels: Record<string, string> = {
        WHOLLY_OBTAINED: "Wholly Obtained",
        VALUE_ADD: "Value Addition",
        CTH: "Change of Tariff Heading (CTH)",
        CTSH: "Change of Tariff Sub-Heading (CTSH)",
        SPECIFIC_PROCESS: "Specific Process",
      };
      const ruleLabel = ruleLabels[roo.generalRule] || roo.generalRule;
      let rooTitle = `AfCFTA Rule of Origin for HS ${roo.hsHeading}: ${ruleLabel}`;
      if (roo.minValueAddPct) {
        rooTitle += ` with minimum ${roo.minValueAddPct}% value addition`;
      }
      if (roo.specificProcess) {
        rooTitle += ` — ${roo.specificProcess}`;
      }
      reqs.push({
        title: rooTitle,
        description: `Under the AfCFTA Protocol on Rules of Origin (Annex 2), this commodity must satisfy the ${ruleLabel} criterion to qualify for preferential treatment.`,
        issuedBy: `${origin.countryName} customs / AfCFTA Secretariat`,
        whenNeeded: "At export — evidence of origin status must be documented",
        tip: "Maintain production records and input sourcing documentation. Customs may request verification of origin status post-clearance.",
        portalGuide: originPortal,
        documentCode: null,
        isSupplierSide: true,
      });

      const altCriteria = roo.alternativeCriteria as Record<string, string> | null;
      if (altCriteria) {
        for (const [, desc] of Object.entries(altCriteria)) {
          reqs.push({
            title: `Alternative criteria: ${desc}`,
            description: "An alternative Rule of Origin criterion that can be used if the primary criterion cannot be met.",
            issuedBy: `${origin.countryName} customs`,
            whenNeeded: "At export — when primary RoO criterion is not met",
            tip: "Alternative criteria provide flexibility. Document which criterion you are claiming on the Certificate of Origin.",
            portalGuide: originPortal,
            documentCode: null,
            isSupplierSide: true,
          });
        }
      }
    }
  }

  return reqs;
}

async function buildRequirementsFromDB(
  commodity: Commodity,
  origin: OriginCountry,
  destination: Destination,
  framework: RegionalFramework | null,
  triggers: ComplianceResult["triggers"],
  afcftaEligible: boolean,
  roo: AfcftaRoo | null,
  extra?: { agoaEligible?: boolean; originFlagged?: boolean }
): Promise<RequirementDetail[]> {
  // 1. Build trigger flags array
  const triggerFlags = Object.entries(triggers)
    .filter(([, v]) => v)
    .map(([k]) => k);

  // 2. Query DB
  const candidateRules = await storage.getMatchingComplianceRules({
    destinationIso2: destination.iso2,
    triggerFlags,
    hsCode: commodity.hsCode,
    commodityType: commodity.commodityType,
  });

  // 3. Build contexts
  const ctx = buildTemplateContext(commodity, origin, destination, framework);
  const hsChapter = parseInt(commodity.hsCode.substring(0, 2), 10);
  const ecCtx: ExtraConditionsContext = {
    hsChapter,
    commodityName: commodity.name,
    agoaEligible: extra?.agoaEligible ?? false,
    originFlagged: extra?.originFlagged ?? false,
    afcftaEligible,
    hasFramework: !!framework,
    destinationIso2: destination.iso2,
    triggerFlags: Object.fromEntries(Object.entries(triggers)),
    commodityType: commodity.commodityType,
  };

  // 4. Filter + render
  const dbRequirements: RequirementDetail[] = candidateRules
    .filter(rule => evaluateExtraConditions(rule, ecCtx))
    .map(rule => ({
      title: renderTemplate(rule.titleTemplate, ctx),
      description: renderTemplate(rule.descriptionTemplate, ctx),
      issuedBy: renderTemplate(rule.issuedByTemplate, ctx),
      whenNeeded: rule.whenNeeded,
      tip: renderTemplate(rule.tipTemplate, ctx),
      portalGuide: rule.portalGuideTemplate ? renderTemplate(rule.portalGuideTemplate, ctx) : null,
      documentCode: rule.documentCode,
      isSupplierSide: rule.isSupplierSide,
      status: "PENDING" as const,
      owner: rule.owner as DocumentOwner,
      due_by: rule.dueBy as DocumentDueBy,
    }));

  // 5. Dynamic supplements
  const dynamicRaw = buildDynamicRequirements(
    commodity, origin, destination, framework, triggers,
    afcftaEligible, roo, extra
  );
  const dynamicRequirements = dynamicRaw.map(r => assignDocumentMeta(r));

  // 6. Merge
  return [...dbRequirements, ...dynamicRequirements];
}

function evaluateComplianceReadiness(params: {
  triggers: ComplianceResult["triggers"];
  hazards: string[];
  stopFlags: Record<string, string> | null;
  requirementsDetailed: RequirementDetail[];
}): ComplianceReadiness {
  const { triggers, hazards, stopFlags, requirementsDetailed } = params;
  const rationale: string[] = [];

  let overall_status: ComplianceReadiness["overall_status"] = "READY";
  let border_clearance: ComplianceReadiness["border_clearance"] = "READY";
  let finance_ready: ComplianceReadiness["finance_ready"] = "YES";
  let audit_exposure_24m: ComplianceReadiness["audit_exposure_24m"] = "LOW";

  const hasStopFlags = stopFlags && Object.keys(stopFlags).length > 0;
  if (hasStopFlags) {
    overall_status = "NOT_READY";
    border_clearance = "BLOCKED";
    rationale.push("Trade prohibited or restricted for this corridor");
  }

  if (triggers.sps || hazards.length > 0) {
    if (border_clearance !== "BLOCKED") {
      border_clearance = "CONDITIONAL";
    }
    rationale.push("Sanitary/Phytosanitary inspection likely at destination");
  }

  if (hasStopFlags) {
    finance_ready = "NO";
    rationale.push("Missing documents may cause LC or bank rejection");
  } else {
    const lcSensitiveTitles = ["Certificate of Origin", "Phytosanitary", "Bill of Lading"];
    const allTitles = requirementsDetailed.map(r => r.title);
    const missingLcDocs = lcSensitiveTitles.filter(
      lcDoc => !allTitles.some(t => t.includes(lcDoc))
    );
    if (missingLcDocs.length > 0) {
      finance_ready = "NO";
      rationale.push("Missing documents may cause LC or bank rejection");
    }
  }

  const audrTriggers = [triggers.eudr, triggers.cbam, triggers.csddd].filter(Boolean).length;
  if (audrTriggers > 1) {
    audit_exposure_24m = "HIGH";
    rationale.push("Multiple regulatory audit frameworks apply (EUDR, CBAM, CSDDD)");
  } else if (audrTriggers === 1) {
    audit_exposure_24m = "MEDIUM";
    rationale.push("Regulatory audit framework applies — maintain evidence for 24 months");
  }

  if (overall_status !== "NOT_READY") {
    if (border_clearance === "CONDITIONAL" || audit_exposure_24m !== "LOW") {
      overall_status = "CONDITIONAL";
    }
  }

  return { overall_status, border_clearance, finance_ready, audit_exposure_24m, rationale };
}

const HIGH_HAZARDS = new Set([
  "aflatoxin", "salmonella", "histamine", "BSE", "FMD",
  "avian_influenza", "cyanide", "radioactive",
]);
const MEDIUM_HAZARDS = new Set([
  "pesticide_residues", "heavy_metals", "chrome_VI", "antibiotics",
  "cadmium", "3-MCPD", "mercury_contamination", "fruit_fly", "ethylene_oxide",
]);

export function computeReadinessScore(params: {
  triggers: ComplianceResult["triggers"];
  hazards: string[];
  stopFlags: Record<string, string> | null;
  requirementsDetailed: RequirementDetail[];
}): ReadinessScoreResult {
  const { triggers, hazards, stopFlags, requirementsDetailed } = params;

  const overlays = [
    triggers.eudr, triggers.cbam, triggers.csddd,
    triggers.kimberley, triggers.conflict, triggers.iuu, triggers.cites,
    triggers.laceyAct, triggers.fdaPriorNotice,
    triggers.reach, triggers.section232, triggers.fsis,
  ].filter(Boolean).length;

  let regPenalty = 0;
  if (overlays >= 3) regPenalty = 30;
  else if (overlays === 2) regPenalty = 16;
  else if (overlays === 1) regPenalty = 8;

  let hazardPenalty = 0;
  let primaryHazard: string | null = null;
  let highestHazardScore = 0;
  const significantHazards = hazards.filter(h => h !== "none_significant" && h !== "none");
  for (const h of significantHazards) {
    let pts = 0;
    if (HIGH_HAZARDS.has(h)) pts = 15;
    else if (MEDIUM_HAZARDS.has(h)) pts = 8;
    else pts = 3;
    hazardPenalty += pts;
    if (pts > highestHazardScore) {
      highestHazardScore = pts;
      primaryHazard = h;
    }
  }
  hazardPenalty = Math.min(hazardPenalty, 30);

  const docCount = requirementsDetailed.length;
  let docPenalty = 0;
  if (docCount >= 11) docPenalty = 20;
  else if (docCount >= 8) docPenalty = 14;
  else if (docCount >= 5) docPenalty = 8;

  const hasStop = stopFlags && Object.keys(stopFlags).length > 0;
  const stopPenalty = hasStop ? 20 : 0;

  const totalPenalty = regPenalty + hazardPenalty + docPenalty + stopPenalty;
  const score = Math.max(0, 100 - totalPenalty);

  const factorPenalties: Record<string, number> = {
    regulatory_complexity: regPenalty,
    hazard_exposure: hazardPenalty,
    document_volume: docPenalty,
    trade_restriction: stopPenalty,
  };
  const primaryRiskFactor = Object.entries(factorPenalties)
    .sort((a, b) => b[1] - a[1])[0][0];

  let verdict: "GREEN" | "AMBER" | "RED";
  if (hasStop) {
    verdict = "RED";
  } else if (score >= 80) {
    verdict = "GREEN";
  } else if (score >= 50) {
    verdict = "AMBER";
  } else {
    verdict = "RED";
  }

  let summary: string;
  if (verdict === "GREEN") {
    summary = "This trade has low regulatory complexity. Standard documents apply.";
  } else if (primaryRiskFactor === "trade_restriction") {
    summary = "This trade is subject to a restriction. Review the STOP warning below before proceeding.";
  } else if (primaryRiskFactor === "hazard_exposure" && primaryHazard) {
    summary = `Known hazard exposure to ${primaryHazard.replace(/_/g, " ")} requires pre-shipment testing and documented results.`;
  } else if (primaryRiskFactor === "regulatory_complexity") {
    summary = "Multiple overlapping regulations apply — verify all compliance requirements before committing.";
  } else if (primaryRiskFactor === "document_volume") {
    summary = "High document count increases discrepancy risk — run an LC check before finalising.";
  } else {
    summary = "This trade requires careful attention before proceeding.";
  }

  const factors: ReadinessFactors = {
    regulatory_complexity: { penalty: regPenalty, max: 30, overlay_count: overlays },
    hazard_exposure: { penalty: hazardPenalty, max: 30, primary_hazard: primaryHazard },
    document_volume: { penalty: docPenalty, max: 20, document_count: docCount },
    trade_restriction: { penalty: stopPenalty, max: 20, stop_triggered: !!hasStop },
    total_penalty: totalPenalty,
    score,
    primary_risk_factor: primaryRiskFactor,
  };

  return { score, verdict, summary, factors };
}

function shouldApplySpecialRule(ruleKey: string, commodity: Commodity): boolean {
  const key = ruleKey.toLowerCase();
  const type = commodity.commodityType;
  const name = commodity.name.toLowerCase();

  if (key.includes("agri") && type === "agricultural") return true;
  if (key.includes("mineral") && type === "mineral") return true;
  if (key.includes("timber") && type === "forestry") return true;
  if (key.includes("forest") && type === "forestry") return true;
  if (key.includes("fish") && (type === "seafood" || commodity.triggersIuu)) return true;
  if (key.includes("seafood") && type === "seafood") return true;
  if (key.includes("livestock") && type === "livestock") return true;
  if (key.includes("gold") && name.includes("gold")) return true;
  if (key.includes("diamond") && name.includes("diamond")) return true;
  if (key.includes("cbam") && commodity.triggersCbam) return true;
  if (key.includes("eudr") && commodity.triggersEudr) return true;
  if (key.includes("conflict") && commodity.triggersConflict) return true;

  // Default: do NOT apply unrecognised rules — prevents catch-all dumping
  return false;
}
