import { storage } from "./storage";
import type { ComplianceResult, ComplianceReadiness, ReadinessScoreResult, ReadinessFactors, Commodity, OriginCountry, Destination, RegionalFramework, AfcftaRoo, RequirementDetail, DocumentOwner, DocumentDueBy } from "@shared/schema";

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

  const rawDetailed = buildRequirementsDetailed(commodity, origin, destination, framework, triggers, afcftaEligible, roo, { agoaEligible, originFlagged });
  const detailed = rawDetailed.map(r => assignDocumentMeta(r));
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

function getChedType(hsCode: string): "CHED-A" | "CHED-P" | "CHED-PP" | "CHED-D" | null {
  const ch = parseInt(hsCode.substring(0, 2), 10);
  if (ch === 1) return "CHED-A";                                        // Live animals
  if ((ch >= 2 && ch <= 5) || ch === 16 || ch === 41) return "CHED-P";  // Animal products
  if ((ch >= 6 && ch <= 14) || ch === 44) return "CHED-PP";             // Plants/wood
  if (ch === 11 || ch === 15 || (ch >= 17 && ch <= 23)) return "CHED-D"; // Processed food/feed
  return null;
}

function buildRequirementsDetailed(
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

  reqs.push({
    title: `Commercial Invoice with HS Code ${commodity.hsCode} and declared FOB value`,
    description: "A standard commercial invoice detailing the goods, quantity, unit price, total value (FOB), currency, and buyer/seller details. Must reference the correct HS code for customs classification.",
    issuedBy: "Exporter / Seller",
    whenNeeded: "Before shipment — required at time of customs declaration",
    tip: "Ensure the invoice value matches the contract price exactly. Under- or over-invoicing triggers customs audit flags.",
    portalGuide: originPortal,
    documentCode: "N935",
    isSupplierSide: true,
  });

  reqs.push({
    title: "Packing List with weights, marks, and lot numbers",
    description: "Itemised list of all packages in the shipment showing contents, gross/net weight, package dimensions, marks, and lot/batch numbers for traceability.",
    issuedBy: "Exporter / Seller",
    whenNeeded: "Before shipment — accompanies the commercial invoice",
    tip: "Include lot numbers that trace back to production batches for traceability compliance.",
    portalGuide: null,
    documentCode: "N271",
    isSupplierSide: true,
  });

  reqs.push({
    title: "Bill of Lading or Airway Bill",
    description: "Transport document issued by the carrier confirming receipt of goods for shipment. Acts as a receipt, contract of carriage, and document of title.",
    issuedBy: "Shipping Line / Airline / Freight Forwarder",
    whenNeeded: "At loading — original required for customs clearance at destination",
    tip: "Request 3 original B/Ls. Ensure consignee details match the importer's customs registration.",
    portalGuide: null,
    documentCode: "N714",
    isSupplierSide: false,
  });

  reqs.push({
    title: `Certificate of Origin issued by ${origin.cooIssuingBody} (${origin.countryName})`,
    description: `Official certificate confirming that goods originate from ${origin.countryName}. Required for tariff preference eligibility and customs clearance at destination.`,
    issuedBy: origin.cooIssuingBody,
    whenNeeded: "Before shipment — apply at least 5 working days before export",
    tip: "Some destinations require a specific form (EUR.1, Form A, or regional certificate). Check the destination's preference scheme requirements.",
    portalGuide: originPortal,
    documentCode: "C644",
    isSupplierSide: true,
  });

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

  if (triggers.sps) {
    reqs.push({
      title: `Phytosanitary / SPS Certificate issued by ${origin.phytoAuthority} (${origin.countryName})`,
      description: `Official certificate confirming that agricultural products have been inspected and are free from quarantine pests/diseases per International Plant Protection Convention (IPPC) standards.`,
      issuedBy: origin.phytoAuthority,
      whenNeeded: "Before shipment — inspection must occur within 14 days of export",
      tip: "Schedule the phytosanitary inspection at least 3 days before the vessel cut-off. Some products need fumigation certificates in addition.",
      portalGuide: originPortal,
      documentCode: "C085",
      isSupplierSide: true,
    });

    reqs.push({
      title: `SPS compliance per ${destination.spsRegime} (${destination.countryName})`,
      description: `The importing country requires compliance with its SPS regime (${destination.spsRegime}). This may include specific maximum residue limits (MRLs), contaminant levels, and labelling requirements.`,
      issuedBy: `${destination.countryName} import authority`,
      whenNeeded: "At import — goods are checked against SPS requirements upon arrival",
      tip: "Pre-check maximum residue limits for pesticides used in production. Non-compliant shipments face destruction or re-export at the importer's cost.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // EU CHED type-specific notification (CHED-A, CHED-P, CHED-PP, CHED-D)
  if (triggers.sps && destination.iso2 === "EU") {
    const chedType = getChedType(commodity.hsCode);
    if (chedType) {
      const chedDesc: Record<string, string> = {
        "CHED-A": "Common Health Entry Document for Animals — live animal import notification via TRACES NT",
        "CHED-P": "Common Health Entry Document for Products of animal origin — meat, fish, dairy, hides notification via TRACES NT",
        "CHED-PP": "Common Health Entry Document for Plants and plant products — phytosanitary notification via TRACES NT",
        "CHED-D": "Common Health Entry Document for Food/Feed of non-animal origin — processed food notification via TRACES NT",
      };
      reqs.push({
        title: `${chedType} notification via TRACES NT required for EU import`,
        description: `${chedDesc[chedType]}. Must be submitted via the EU TRACES NT system before goods arrive at the EU Border Control Post (BCP). The BCP inspectors verify the consignment against the ${chedType} at the port of entry.`,
        issuedBy: "Importer / EU-based responsible operator via TRACES NT",
        whenNeeded: "Minimum 24 hours before arrival at BCP (Border Control Post)",
        tip: `This commodity requires a ${chedType} form. Register in TRACES NT early — your Border Control Post must be pre-selected. Documentary, identity, and physical checks are risk-based under the EU Official Controls Regulation.`,
        portalGuide: "Submit via TRACES NT — https://webgate.ec.europa.eu/tracesnt",
        documentCode: null,
        isSupplierSide: false,
      });
    }
  }

  // UK IPAFFS notification (mapped from CHED types)
  if (triggers.sps && destination.iso2 === "GB") {
    const chedType = getChedType(commodity.hsCode);
    if (chedType) {
      const ipaffsMap: Record<string, string> = {
        "CHED-A": "IPAFFS notification for live animals",
        "CHED-P": "IPAFFS notification for Products of Animal Origin (POAO)",
        "CHED-PP": "IPAFFS notification for plants and plant products (phytosanitary)",
        "CHED-D": "IPAFFS notification for high-risk food/feed not of animal origin (HRFNAO)",
      };
      reqs.push({
        title: `${ipaffsMap[chedType]} required for UK import`,
        description: `UK equivalent of EU ${chedType}. Submitted via the Import of Products, Animals, Food and Feed System (IPAFFS). Required for pre-notification to Port Health Authorities under the UK Border Target Operating Model (BTOM).`,
        issuedBy: "Importer / UK-based responsible person via IPAFFS",
        whenNeeded: "Before arrival — notification timeline varies by product category and risk level",
        tip: `Register in IPAFFS and ensure your Border Control Post is selected. The UK uses IPAFFS (not TRACES) for all SPS-controlled imports. Risk categorisation under BTOM determines inspection frequency.`,
        portalGuide: "Submit via IPAFFS — https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system",
        documentCode: null,
        isSupplierSide: false,
      });
    }
  }

  if (destination.iso2 === "CH" && triggers.sps) {
    reqs.push({
      title: "FSVO/BLV import notification for food products entering Switzerland",
      description: "Import notification to the Federal Food Safety and Veterinary Office (FSVO/BLV). Switzerland uses its own notification system — not IPAFFS or TRACES.",
      issuedBy: "Importer or Swiss customs agent",
      whenNeeded: "Minimum 24 hours before arrival for food products",
      tip: "Register at blv.admin.ch. Process similar to IPAFFS but separate system. Switzerland is NOT in the EU TRACES system.",
      portalGuide: "Register and submit at FSVO — https://www.blv.admin.ch",
      documentCode: null,
      isSupplierSide: false,
    });

    reqs.push({
      title: "Phytosanitary certificate processed by FPPS/OFAG (Swiss Federal Plant Protection Service)",
      description: "For plant products entering Switzerland, phytosanitary clearance is handled by the Federal Plant Protection Service (FPPS/OFAG) — not via EU TRACES.",
      issuedBy: "Swiss Federal Plant Protection Service (FPPS/OFAG)",
      whenNeeded: "Before goods arrive at Swiss border",
      tip: "Switzerland has its own phytosanitary authority separate from the EU. Ensure your documentation references FPPS/OFAG, not TRACES.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  if (destination.iso2 === "CH" && triggers.cites) {
    reqs.push({
      title: "Swiss CITES permit from FOEN/BAFU (Federal Office for the Environment)",
      description: "Switzerland issues its own CITES permits through FOEN/BAFU, parallel to the EU CITES system but administered separately.",
      issuedBy: "FOEN/BAFU (Federal Office for the Environment)",
      whenNeeded: "Before import — permit must be obtained before goods arrive",
      tip: "Apply through FOEN/BAFU. Processing times may differ from EU CITES authorities.",
      portalGuide: "Submit via FOEN/BAFU — https://www.bafu.admin.ch",
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // EUDR applies to EU and GB (UK Deforestation Regulation mirrors EUDR); CH handled separately below
  if (triggers.eudr && (destination.iso2 === "EU" || destination.iso2 === "GB")) {
    reqs.push({
      title: "EU Deforestation Regulation (EUDR) due-diligence statement with geolocation data for production plot(s)",
      description: "Operators must submit a due-diligence statement demonstrating that commodities were not produced on land deforested after 31 December 2020. Requires GPS coordinates of all production plots.",
      issuedBy: "Exporter / Operator (self-declared, verified by EU authorities)",
      whenNeeded: "Before placing goods on EU market — statement must be submitted via EUDR Information System before customs clearance",
      tip: "Collect GPS polygon data from farms/plantations at sourcing stage. A single missing plot can block the entire shipment.",
      portalGuide: "Submit via EU EUDR Information System — https://environment.ec.europa.eu/topics/forests/deforestation/regulation_en",
      documentCode: "C990",
      isSupplierSide: true,
    });

    reqs.push({
      title: "EUDR operator registration in EU Information System",
      description: "All operators and traders placing EUDR-relevant commodities on the EU market must register in the EU EUDR Information System and obtain a reference number for each due-diligence statement.",
      issuedBy: "EU Member State competent authority",
      whenNeeded: "Before first import — one-time registration, then per-shipment statements",
      tip: "Register early — the approval process can take several weeks. Each due-diligence statement gets a unique reference number that must appear on the customs declaration.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  if (triggers.eudr && destination.iso2 === "CH") {
    reqs.push({
      title: "Swiss Due Diligence Act compliance statement (timber and minerals — EUDR-equivalent commodities pending)",
      description: "Switzerland passed its own Due Diligence Act covering timber and minerals. Cocoa, coffee, and other EUDR commodities are expected to be added. Monitor FOEN/BAFU for updates on scope and timeline.",
      issuedBy: "Importer / Operator (self-declared under Swiss Due Diligence Act)",
      whenNeeded: "Before import — prepare EUDR-equivalent documentation now as requirements will likely mirror the EU",
      tip: "Switzerland's Due Diligence Act currently covers timber and minerals. Monitor FOEN/BAFU (bafu.admin.ch) for confirmation of scope expansion to cocoa, coffee, and other EUDR commodities.",
      portalGuide: "Monitor FOEN/BAFU — https://www.bafu.admin.ch",
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // ── USA-SPECIFIC REQUIREMENTS ──
  if (destination.iso2 === "US") {
    // ISF 10+2 — always required for US-bound ocean freight
    reqs.push({
      title: "ISF 10+2 (Importer Security Filing) — filed 24 hours before vessel loading",
      description: "US Customs and Border Protection (CBP) requires 10 data elements from the importer and 2 from the carrier, filed electronically via ACE at least 24 hours before vessel departure from the foreign port.",
      issuedBy: "Importer / Licensed Customs Broker",
      whenNeeded: "24 hours before vessel loading at foreign port",
      tip: "Late or inaccurate ISF filing incurs a $5,000 penalty per violation. Ensure your broker files on time. Include accurate African supplier address.",
      portalGuide: "File via ACE (Automated Commercial Environment) — https://www.cbp.gov/trade/ace",
      documentCode: null,
      isSupplierSide: false,
    });

    // Customs Bond
    reqs.push({
      title: "US Customs Bond — continuous or single-entry bond guaranteeing duty payment to CBP",
      description: "A customs bond is required to guarantee payment of duties, taxes, and fees to CBP. Continuous bonds cover all imports for 12 months; single-entry bonds cover one shipment.",
      issuedBy: "Surety company / Customs Broker",
      whenNeeded: "Pre-shipment — must be in place before goods arrive",
      tip: "Continuous bonds ($50k+) are more cost-effective for regular importers. Single-entry bonds are priced at 1-3x the duty amount.",
      portalGuide: null,
      documentCode: null,
      isSupplierSide: false,
    });

    // FDA Prior Notice — food/agricultural products
    if (triggers.fdaPriorNotice) {
      reqs.push({
        title: "FDA Prior Notice — food imports must be registered in FDA PNSI system (Bioterrorism Act)",
        description: "All food and feed products entering the US require Prior Notice submitted to the FDA via the Prior Notice System Interface (PNSI). The foreign manufacturing/processing facility must also be registered in FDA FURLS.",
        issuedBy: "Importer / FDA-registered agent",
        whenNeeded: "Before arrival — Water: 8 hours; Air: 4 hours; Truck: 2 hours pre-arrival",
        tip: "Register the foreign food facility first (FDA FURLS), then file Prior Notice (PNSI). Both are mandatory. FSVP documentation must name the African supplier.",
        portalGuide: "FDA Prior Notice System — https://www.fda.gov/food/prior-notice-imported-foods",
        documentCode: null,
        isSupplierSide: false,
      });

      reqs.push({
        title: "FSVP (Foreign Supplier Verification Program) documentation for food safety compliance",
        description: "Under FSMA, US importers must verify that foreign suppliers produce food meeting US safety standards. Requires hazard analysis, supplier evaluation, and corrective action procedures.",
        issuedBy: "Importer (FSVP Importer of record)",
        whenNeeded: "Ongoing — documentation must be maintained and updated per supplier",
        tip: "FSVP enforcement is increasing. Maintain supplier audit records, hazard analyses, and corrective action plans. Name the specific African supplier in FSVP records.",
        portalGuide: null,
        documentCode: null,
        isSupplierSide: false,
      });

      // USDA APHIS phyto for plant-based
      if (triggers.sps) {
        reqs.push({
          title: "USDA APHIS phytosanitary clearance and import permit for plant-based products",
          description: "USDA Animal and Plant Health Inspection Service (APHIS) requires phytosanitary clearance for plant and plant-based products. An import permit may be required depending on the commodity and origin.",
          issuedBy: "USDA APHIS",
          whenNeeded: "Pre-arrival — import permit before shipment; inspection at port of entry",
          tip: "Check USDA PCIT (Phytosanitary Certificate Issuance and Tracking) for commodity-specific requirements from the origin country.",
          portalGuide: "USDA APHIS import requirements — https://www.aphis.usda.gov/plant-health/import-export",
          documentCode: null,
          isSupplierSide: false,
        });
      }
    }

    // Lacey Act — timber/plant products
    if (triggers.laceyAct) {
      reqs.push({
        title: "Lacey Act Declaration — electronic plant/timber import declaration (PPQ 505 eliminated Jan 2026)",
        description: "The Lacey Act requires an import declaration for plants and plant products identifying the scientific name (genus/species), value, quantity, and country of harvest. As of January 2026, paper PPQ 505 forms are eliminated — electronic filing only via ACE/LAWGS.",
        issuedBy: "Importer",
        whenNeeded: "At or before entry — filed electronically with CBP entry",
        tip: "Ensure your supplier provides the species scientific name and country of harvest. Phase VII expanded the scope. Violations carry civil ($10k) and criminal ($250k + 5yrs) penalties.",
        portalGuide: "File via ACE/LAWGS electronic system",
        documentCode: null,
        isSupplierSide: false,
      });
    }

    // AGOA preference
    if (extra?.agoaEligible) {
      reqs.push({
        title: `AGOA duty-free preference available — ${origin.countryName} is AGOA-eligible`,
        description: "The African Growth and Opportunity Act (AGOA) provides duty-free access to the US market for over 1,800 products from 32 eligible Sub-Saharan African countries. Requires 35% value-add and proof of origin. Reauthorized to December 2026.",
        issuedBy: "Importer — claim via HTSUS Chapter 9819",
        whenNeeded: "At entry — claim AGOA preference on customs declaration with Certificate of Origin",
        tip: `AGOA does NOT override reciprocal tariffs (currently ${origin.usTariffRate ?? "10%"} for ${origin.countryName}). Verify the specific product is covered under AGOA tariff lines. AGOA expires Dec 2026 — monitor reauthorization status.`,
        portalGuide: "AGOA information — https://agoa.info",
        documentCode: null,
        isSupplierSide: false,
      });
    }

    // OFAC screening for flagged origins
    if (extra?.originFlagged) {
      reqs.push({
        title: `OFAC sanctions screening REQUIRED — ${origin.countryName} is flagged (${origin.flagReason ?? "Risk"})`,
        description: `The Office of Foreign Assets Control (OFAC) administers US economic and trade sanctions. ${origin.countryName} is flagged: ${origin.flagDetails ?? "Enhanced due diligence required."}. All parties in the transaction must be screened against the SDN List.`,
        issuedBy: "Importer / Compliance team",
        whenNeeded: "Before any transaction — continuous screening required throughout the relationship",
        tip: "Screen ALL parties (supplier, banks, shipping agents, beneficial owners) against the SDN list and relevant country sanctions programs. Document all screening results. Civil penalty: $330k per violation.",
        portalGuide: "OFAC Sanctions Search — https://sanctionssearch.ofac.treas.gov",
        documentCode: null,
        isSupplierSide: false,
      });
    }

    // Reciprocal tariff note
    reqs.push({
      title: `US reciprocal tariff of ${origin.usTariffRate ?? "10%"} applies to imports from ${origin.countryName}`,
      description: `The US applies country-specific reciprocal tariff rates on imports from African countries under Section 122 of the Trade Act. The rate for ${origin.countryName} is ${origin.usTariffRate ?? "10%"}, applied in addition to MFN duty rates. Note: IEEPA authority struck down by SCOTUS Feb 2026; Sec 122 rates currently in effect.`,
      issuedBy: "US CBP — calculated on Entry Summary (Form 7501)",
      whenNeeded: "At import — duty calculated and payable on customs entry",
      tip: "Check the HTS for product-specific MFN duty rates. AGOA-eligible products may qualify for duty-free treatment, but reciprocal tariffs still apply separately. Rates may change — monitor CBP updates.",
      portalGuide: "US HTS search — https://hts.usitc.gov",
      documentCode: null,
      isSupplierSide: false,
    });

    // Hashed audit trail requirement
    reqs.push({
      title: "Maintain hashed audit trail for CBP 'Reasonable Care' standard (retain 5 years)",
      description: "US importers must demonstrate 'Reasonable Care' in their import activity. TapTrao generates SHA-256 hashed compliance records that serve as immutable proof of due diligence at time of import.",
      issuedBy: "Importer (internal compliance / TapTrao TwinLog Trail)",
      whenNeeded: "Post-clearance — retain all records for minimum 5 years per 19 USC 1508",
      tip: "Download the TwinLog Trail PDF for each shipment as your audit-ready compliance record. The integrity hash proves the record hasn't been altered.",
      portalGuide: null,
      documentCode: null,
      isSupplierSide: false,
    });

    // HTSUS classification reminder
    reqs.push({
      title: `HTSUS classification for HS ${commodity.hsCode} — verify US-specific tariff treatment before contract`,
      description: "The US Harmonized Tariff Schedule (HTSUS) may classify products differently than the international HS system at the 6+ digit level. Correct classification determines duty rates, PGA triggers, and quota eligibility.",
      issuedBy: "Customs Broker / Importer",
      whenNeeded: "Pre-contract — classification should be confirmed before quoting landed cost",
      tip: "Use the USITC HTS search tool (hts.usitc.gov) to verify the correct 10-digit HTSUS code. Consider requesting a binding ruling from CBP for complex classifications.",
      portalGuide: "USITC HTS Online — https://hts.usitc.gov",
      documentCode: null,
      isSupplierSide: false,
    });

    // Section 232 tariff — steel and aluminum
    if (triggers.section232) {
      reqs.push({
        title: "US Section 232 tariff applies — 25% on steel, 10% on aluminium (national security tariff)",
        description: "Under Section 232 of the Trade Expansion Act of 1962, the US imposes additional tariffs on steel (25%) and aluminium (10%) imports from most countries. This is in addition to MFN duty rates and any reciprocal tariffs.",
        issuedBy: "US CBP — calculated on Entry Summary (Form 7501)",
        whenNeeded: "At import — tariff applied automatically on customs entry",
        tip: "Section 232 tariffs stack on top of MFN duty and reciprocal tariffs. Verify whether any product-specific exclusion applies via the Section 232 Exclusion Portal. Some African countries may negotiate quota-based exemptions.",
        portalGuide: "Section 232 Exclusion Portal — https://232app.azurewebsites.net",
        documentCode: null,
        isSupplierSide: false,
      });
    }

    // FSIS — meat and poultry inspection (separate from FDA)
    if (triggers.fsis) {
      reqs.push({
        title: "USDA FSIS inspection required — meat, poultry, and egg products must be from an approved country and establishment",
        description: "The USDA Food Safety and Inspection Service (FSIS) regulates imported meat, poultry, and processed egg products. The exporting country must have an equivalent inspection system approved by FSIS, and the specific slaughter/processing establishment must be listed.",
        issuedBy: "USDA FSIS",
        whenNeeded: "Pre-shipment — country equivalence and establishment approval must be in place; re-inspection at US port of entry",
        tip: "Very few African countries currently have FSIS equivalence approval for meat exports to the US. Namibia and Botswana (beef) and South Africa (ostrich) have some approved establishments. Check the FSIS eligible countries list before committing to the trade.",
        portalGuide: "FSIS Import Library — https://www.fsis.usda.gov/inspection/import-export",
        documentCode: null,
        isSupplierSide: false,
      });
    }
  }

  if (triggers.kimberley) {
    reqs.push({
      title: "Kimberley Process Certificate (KPC) — rough diamond shipment must be sealed and accompanied by a valid KPC",
      description: "An internationally recognised certificate confirming the rough diamonds are conflict-free. The shipment must be in a tamper-proof container with a unique KPC number matching the certificate.",
      issuedBy: `${origin.countryName} Kimberley Process Authority`,
      whenNeeded: "Before export — certificate must accompany the sealed shipment",
      tip: "Each KPC has a unique serial number. The importing country's KP authority will verify the seal and certificate number. Broken seals invalidate the shipment.",
      portalGuide: null,
      documentCode: "N853",
      isSupplierSide: true,
    });
  }

  if (triggers.conflict) {
    reqs.push({
      title: "Conflict Minerals due-diligence report per EU Regulation 2017/821 or US Dodd-Frank Section 1502",
      description: "A supply chain due-diligence report demonstrating that tin, tantalum, tungsten, or gold (3TG) were not sourced from conflict-affected or high-risk areas, following OECD Due Diligence Guidance.",
      issuedBy: "Exporter / Smelter (audited by independent third party)",
      whenNeeded: "Annually — report must be current at time of import",
      tip: "Use an RMI-conformant smelter list (Responsible Minerals Initiative). Importers increasingly require CMRT (Conflict Minerals Reporting Template) from suppliers.",
      portalGuide: null,
      documentCode: null,
      isSupplierSide: true,
    });

    reqs.push({
      title: "Supply chain mapping to smelter/refiner level (OECD Due Diligence Guidance)",
      description: "A documented chain-of-custody from mine to export point identifying all smelters/refiners in the supply chain per the OECD 5-step framework.",
      issuedBy: "Exporter (self-declared with audit trail)",
      whenNeeded: "Before first shipment — updated annually or when supply chain changes",
      tip: "Maintain a digital record of each supply chain actor with business licences and mineral origin certificates.",
      portalGuide: null,
      documentCode: null,
      isSupplierSide: true,
    });
  }

  // CBAM is an EU regulation — only applies to EU-bound imports (and GB which may adopt similar)
  if (triggers.cbam && (destination.iso2 === "EU" || destination.iso2 === "GB")) {
    reqs.push({
      title: "EU Carbon Border Adjustment Mechanism (CBAM) embedded-emissions declaration",
      description: "Declaration of the embedded greenhouse gas emissions in the imported goods, covering direct emissions from production and indirect emissions from electricity used.",
      issuedBy: "Producer / Exporter (verified by accredited verifier)",
      whenNeeded: "Quarterly reporting during transitional period; per-shipment from 2026",
      tip: "Start collecting emissions data from production facilities now. Use the EU's default values only as a fallback — actual values usually result in lower CBAM costs.",
      portalGuide: "Submit via CBAM Transitional Registry — https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
      documentCode: null,
      isSupplierSide: true,
    });

    reqs.push({
      title: "CBAM certificate purchase or reporting via CBAM Transitional Registry",
      description: "EU importers must purchase CBAM certificates corresponding to the embedded emissions. During the transitional period (2023-2025), only reporting is required.",
      issuedBy: "EU CBAM Authority / National competent authority",
      whenNeeded: "Before import clearance (post-2025) — quarterly during transition",
      tip: "CBAM certificate prices track the EU ETS carbon price. Budget for price fluctuations.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // CSDDD is an EU directive — applies to EU and GB (similar UK regulations)
  if (triggers.csddd && (destination.iso2 === "EU" || destination.iso2 === "GB")) {
    reqs.push({
      title: "Corporate Sustainability Due Diligence Directive (CSDDD) human-rights & environmental risk assessment",
      description: "Companies must identify, prevent, mitigate, and account for adverse human rights and environmental impacts in their value chains, including supply chains in third countries.",
      issuedBy: "Importing company (self-assessed, subject to regulatory oversight)",
      whenNeeded: "Ongoing — annual reporting with continuous monitoring of supply chain",
      tip: "Map your supply chain to identify high-risk areas. Engage with local suppliers on corrective action plans before regulators request evidence.",
      portalGuide: null,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // REACH — EU/GB chemical substance registration
  if (triggers.reach && (destination.iso2 === "EU" || destination.iso2 === "GB")) {
    reqs.push({
      title: "EU REACH Regulation (EC 1907/2006) — substance registration and authorisation with ECHA",
      description: "Chemical substances imported into the EU/EEA above 1 tonne/year must be registered with the European Chemicals Agency (ECHA). The importer is the REACH registrant and must hold a registration number before placing goods on the market. Products containing Substances of Very High Concern (SVHCs) above 0.1% w/w require notification.",
      issuedBy: "European Chemicals Agency (ECHA) / Importer as registrant",
      whenNeeded: "Before import — registration must be in place before placing substance on the EU market",
      tip: "REACH registration can take 6-18 months and costs EUR 1,600-31,000+ depending on tonnage band. Consider appointing an Only Representative (OR) in the EU to register on behalf of the African exporter. Safety Data Sheet (SDS) must accompany all chemical shipments.",
      portalGuide: "ECHA REACH — https://echa.europa.eu/regulations/reach",
      documentCode: null,
      isSupplierSide: false,
    });
  }

  if (triggers.reach && destination.iso2 === "CH") {
    reqs.push({
      title: "Swiss ChemO (Chemicals Ordinance) — substance notification for chemical imports into Switzerland",
      description: "Switzerland administers its own chemical regulation parallel to EU REACH via the Chemicals Ordinance (ChemO/ChemV). Importers must notify the Swiss Federal Office of Public Health (FOPH/BAG) for new substances not yet in the Swiss inventory.",
      issuedBy: "Swiss FOPH/BAG / Importer",
      whenNeeded: "Before import — notification required for new substances. Safety Data Sheet always required.",
      tip: "Switzerland has mutual recognition agreements with the EU for many standards, but EU REACH registration does NOT automatically transfer to Switzerland. Verify Swiss-specific requirements with FOPH/BAG.",
      portalGuide: "Swiss FOPH/BAG Chemicals — https://www.bag.admin.ch/bag/en/home/gesund-leben/umwelt-und-gesundheit/chemikalien.html",
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // ── CANADA-SPECIFIC REQUIREMENTS ──
  if (destination.iso2 === "CA") {
    // ACI eManifest — equivalent to ISF 10+2
    reqs.push({
      title: "ACI eManifest (Advance Commercial Information) — pre-arrival cargo data filed to CBSA",
      description: "Canada Border Services Agency (CBSA) requires electronic advance cargo information before goods arrive. Carriers and freight forwarders must transmit cargo, conveyance, and crew data electronically before arrival.",
      issuedBy: "Carrier / Freight Forwarder",
      whenNeeded: "Ocean: 24 hours before loading at foreign port. Air: varies by routing (4 hours for short-haul, pre-departure for long-haul)",
      tip: "ACI eManifest is Canada's equivalent of the US ISF 10+2. Ensure your freight forwarder files accurately — non-compliance results in CBSA do-not-load directives and penalties.",
      portalGuide: "CBSA eManifest — https://www.cbsa-asfc.gc.ca/prog/manif/menu-eng.html",
      documentCode: null,
      isSupplierSide: false,
    });

    // CFIA import requirements for food/plant/animal
    if (triggers.sps) {
      reqs.push({
        title: "Canadian Food Inspection Agency (CFIA) import requirements — licence and inspection",
        description: "CFIA regulates the import of food, plants, animals, and related products into Canada. A Safe Food for Canadians (SFC) licence is required for most food imports. All imports must comply with the Safe Food for Canadians Regulations (SFCR). Check CFIA's Automated Import Reference System (AIRS) for commodity-specific requirements.",
        issuedBy: "CFIA (Canadian Food Inspection Agency)",
        whenNeeded: "Before import — SFC licence must be in place; inspection at port of entry. Phytosanitary certificate from origin required.",
        tip: "Register in the CFIA My CFIA portal first. Use the Automated Import Reference System (AIRS) to check specific commodity requirements — including whether an import permit is needed.",
        portalGuide: "CFIA AIRS — https://airs-sari.inspection.gc.ca/",
        documentCode: null,
        isSupplierSide: false,
      });
    }

    // Canada Forced Labour Act (Bill S-211) — supply chain reporting
    reqs.push({
      title: "Canada Fighting Against Forced Labour and Child Labour in Supply Chains Act (Bill S-211) — reporting obligation",
      description: "Canadian entities that import goods and meet the threshold (CA$20M+ revenue or CA$10M+ assets or 250+ employees) must file annual reports on steps taken to prevent forced and child labour in their supply chains. Applies to goods imported into Canada from all origins.",
      issuedBy: "Importing entity (annual report filed to Public Safety Canada)",
      whenNeeded: "Annual report due May 31 each year covering the prior fiscal year",
      tip: "Even if below the reporting threshold, major Canadian buyers increasingly require supply chain transparency documentation. Maintain supplier audit records and due diligence evidence for African supply chains.",
      portalGuide: "Public Safety Canada — https://www.publicsafety.gc.ca/cnt/cntrng-crm/frcd-lbr-en.aspx",
      documentCode: null,
      isSupplierSide: false,
    });

    // CBSA CARM customs entry
    reqs.push({
      title: "CBSA customs declaration via CARM (Canada Assessment and Revenue Management) Client Portal",
      description: "Since October 2024, all commercial accounting declarations must be filed through the CARM Client Portal. This replaces the legacy ACROSS/B3 paper process. Customs brokers file on behalf of importers.",
      issuedBy: "Customs Broker / Importer via CARM Client Portal",
      whenNeeded: "At import — accounting data due within 5 business days of release from CBSA",
      tip: "Register in the CARM Client Portal. Ensure correct tariff classification per the Canadian Customs Tariff. Importers can check GPT (General Preferential Tariff) or LDCT (Least Developed Country Tariff) eligibility for reduced duty on African goods.",
      portalGuide: "CARM Client Portal — https://carm-acram.cbsa-asfc.gc.ca",
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // ── TURKEY-SPECIFIC REQUIREMENTS ──
  if (destination.iso2 === "TR") {
    // Halal certification for food products
    if (triggers.sps && (commodity.commodityType === "agricultural" || commodity.commodityType === "livestock" || commodity.commodityType === "seafood")) {
      reqs.push({
        title: "Halal certification may be required for food products imported into Turkey",
        description: "Turkey's Ministry of Agriculture and Forestry may require halal certification for certain food products, particularly meat, poultry, and processed food. While not universally mandated at customs, major Turkish buyers, retailers, and food service operators typically require it as a commercial prerequisite.",
        issuedBy: "Accredited halal certification body in origin country (recognised by Turkish authorities / Diyanet)",
        whenNeeded: "Before shipment — certificate must accompany the goods",
        tip: "Use a halal certification body accredited by the Turkish Standards Institute (TSE) or recognised by Turkey's Diyanet (Presidency of Religious Affairs). Common African certifiers include national Islamic councils and SANHA (South Africa).",
        portalGuide: null,
        documentCode: null,
        isSupplierSide: true,
      });
    }

    // TSE conformity for industrial/manufactured products
    if (commodity.commodityType === "manufactured" || commodity.commodityType === "mineral") {
      reqs.push({
        title: "TSE (Turkish Standards Institute) conformity assessment may be required for industrial products",
        description: "Industrial products imported into Turkey may require conformity assessment by TSE or a TSE-recognised body. Turkey's technical regulations often align with EU CE marking requirements but are administered separately through the TSE 'G' mark system.",
        issuedBy: "TSE (Türk Standardları Enstitüsü) or recognised conformity assessment body",
        whenNeeded: "Before import — certificate of conformity must be available for customs clearance",
        tip: "Check whether the specific product falls under Turkey's mandatory conformity assessment regime via the TAREKS (Risk-Based Trade Control) system. Many products accept EU CE marking, but some require separate TSE approval.",
        portalGuide: "TSE — https://www.tse.org.tr",
        documentCode: null,
        isSupplierSide: false,
      });
    }

    // Gold import — Borsa Istanbul
    if (commodity.name.toLowerCase().includes("gold")) {
      reqs.push({
        title: "Borsa Istanbul (BIST) membership required for gold imports into Turkey",
        description: "Gold imports into Turkey must be conducted through Borsa Istanbul (formerly Istanbul Gold Exchange). Only authorised member banks and precious metals companies can import gold. Non-members cannot clear gold through Turkish customs.",
        issuedBy: "Borsa Istanbul / CMB (Capital Markets Board of Turkey)",
        whenNeeded: "Before import — BIST membership/authorisation must be in place prior to shipment",
        tip: "This is a significant market access barrier. Only banks and authorised precious metals companies with BIST membership can import gold into Turkey. Arrange the buyer relationship accordingly and verify their BIST membership status.",
        portalGuide: null,
        documentCode: null,
        isSupplierSide: false,
      });
    }
  }

  if (triggers.iuu) {
    reqs.push({
      title: "IUU Fishing catch certificate validated by flag-state authority",
      description: "A catch certificate validated by the flag-state authority of the fishing vessel confirming the fish were legally caught in compliance with applicable fisheries management measures.",
      issuedBy: `Flag-state fisheries authority / ${origin.countryName} fisheries ministry`,
      whenNeeded: "Before export — must be validated before shipment leaves origin port",
      tip: "EU requires advance notification (3-4 working days) via the IUU catch certificate system. Ensure the vessel's IMO number is correctly recorded.",
      portalGuide: destPortal,
      documentCode: "N853",
      isSupplierSide: true,
    });

    reqs.push({
      title: "Processing statement (if re-exported or processed before shipment)",
      description: "If caught fish have been processed (filleted, frozen, canned) before export, a processing statement must accompany the catch certificate linking processed products to the original catch.",
      issuedBy: "Processing facility / Exporter",
      whenNeeded: "Before export — required alongside catch certificate for processed products",
      tip: "The processing statement must reference the original catch certificate number. Maintain batch-level traceability.",
      portalGuide: null,
      documentCode: null,
      isSupplierSide: true,
    });
  }

  if (triggers.cites) {
    reqs.push({
      title: `CITES export permit from ${origin.countryName} CITES Management Authority`,
      description: `An export permit issued under the Convention on International Trade in Endangered Species (CITES). Required for species listed in CITES Appendices I, II, or III.`,
      issuedBy: `${origin.countryName} CITES Management Authority`,
      whenNeeded: "Before export — permit must be obtained before the shipment date",
      tip: "CITES permits are species-specific and may have quotas. Apply well in advance as scientific review is required.",
      portalGuide: originPortal,
      documentCode: null,
      isSupplierSide: true,
    });

    reqs.push({
      title: `CITES import permit from ${destination.countryName} (if Appendix I species)`,
      description: "For CITES Appendix I species, the importing country must issue an import permit before the exporting country can issue the export permit.",
      issuedBy: `${destination.countryName} CITES Management Authority`,
      whenNeeded: "Before export permit is issued — import permit must be obtained first",
      tip: "Appendix I species require both export and import permits. Appendix II species only require an export permit. Check the species listing carefully.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // Skip generic security filing for US and CA — those have dedicated detailed blocks above
  if (destination.iso2 !== "US" && destination.iso2 !== "CA") {
    reqs.push({
      title: `${destination.securityFiling} pre-arrival security filing for ${destination.countryName}`,
      description: `Pre-arrival security declaration required by ${destination.countryName} customs. Includes cargo details, shipper/consignee information, and container/seal numbers.`,
      issuedBy: "Customs Broker / Freight Forwarder",
      whenNeeded: `Before vessel departure — typically 24-48 hours before loading`,
      tip: "File early to avoid port delays. Incorrect data (especially container or seal numbers) can result of inspection holds.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // Generic customs declaration — skip for US (has detailed block) and CA (has CARM block)
  if (destination.iso2 !== "US" && destination.iso2 !== "CA") {
    reqs.push({
      title: `Customs import declaration per ${destination.tariffSource}`,
      description: `Formal import declaration submitted to ${destination.countryName} customs using the applicable tariff schedule (${destination.tariffSource}). Includes HS classification, value, origin, and duty calculation.`,
      issuedBy: "Customs Broker / Importer",
      whenNeeded: "At import — before goods are released from customs control",
      tip: "Double-check the HS code classification against the destination tariff schedule. Misclassification is the most common cause of customs delays and penalties.",
      portalGuide: destPortal,
      documentCode: null,
      isSupplierSide: false,
    });
  }

  // Apply destination special rules (skip for US and CA — coded blocks above are comprehensive)
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

  reqs.push({
    title: `VAT/GST at ${destination.vatRate}% applies on CIF value at ${destination.countryName} port of entry`,
    description: `Import VAT or GST levied on the CIF (Cost, Insurance, Freight) value of goods entering ${destination.countryName}. This is in addition to any customs duty.`,
    issuedBy: `${destination.countryName} tax authority`,
    whenNeeded: "At import — payable before goods are released",
    tip: "VAT paid at import is usually recoverable as input tax credit if the importer is VAT-registered. Keep the customs receipt.",
    portalGuide: destPortal,
    documentCode: null,
    isSupplierSide: false,
  });

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
