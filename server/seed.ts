import { db } from "./db";
import {
  destinations,
  regionalFrameworks,
  originCountries,
  commodities,
  afcftaRoo,
  complianceRules,
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { log } from "./index";

export async function seedPrompt2() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(destinations);
  if (Number(existing.count) > 0) {
    log("Seed data already exists, skipping Prompt 2 seed", "seed");
    return;
  }

  try {
    await db.transaction(async (tx: any) => {
      // ── DESTINATIONS (6) ──
      await tx.insert(destinations).values([
        {
          countryName: "United Kingdom",
          iso2: "GB",
          tariffSource: "UK Trade Tariff API",
          vatRate: "20.0",
          spsRegime: "IPAFFS + Port Health",
          securityFiling: "CHIEF/CDS customs entry",
          specialRules: {},
          preferenceSchemes: ["GSP", "EPA", "DCTS"],
          isAfcftaMember: false,
        },
        {
          countryName: "European Union",
          iso2: "EU",
          tariffSource: "TARIC",
          vatRate: "21.0",
          spsRegime: "TRACES/CHED",
          securityFiling: "ENS",
          specialRules: {},
          preferenceSchemes: ["GSP", "EPA", "EBA"],
          isAfcftaMember: false,
        },
        {
          countryName: "Turkey",
          iso2: "TR",
          tariffSource: "Turkey Customs Tariff",
          vatRate: "20.0",
          spsRegime: "Turkey food safety authority",
          securityFiling: "NCTS",
          specialRules: {},
          preferenceSchemes: [],
          isAfcftaMember: false,
        },
        {
          countryName: "United Arab Emirates",
          iso2: "AE",
          tariffSource: "UAE Federal Customs",
          vatRate: "5.0",
          spsRegime: "MOCCAE import permit",
          securityFiling: "Dubai Trade portal",
          specialRules: {
            esma_conformity: "ESMA (Emirates Authority for Standardization) conformity certificate required for regulated products — aligned with GCC technical regulations (GSO standards).",
            moccae_import_permit: "MOCCAE (Ministry of Climate Change & Environment) import permit required for agricultural, plant, and animal products.",
            halal_certificate: "Halal certification required for all food, meat, and cosmetic products. Must be issued by a UAE-recognised certification body (e.g., EIAC-accredited).",
            dubai_trade_declaration: "Dubai Trade portal electronic import declaration required. All customs clearance processed via Dubai Customs Mirsal 2 system.",
            ecas_marking: "Emirates Conformity Assessment Scheme (ECAS) marking required for certain consumer products (toys, electrical, building materials).",
            gcc_customs_union: "GCC Common External Tariff applies. Goods entering via any GCC port may transit to UAE under GCC customs union provisions.",
          },
          preferenceSchemes: ["GCC CET"],
          isAfcftaMember: false,
        },
        {
          countryName: "Canada",
          iso2: "CA",
          tariffSource: "CBSA Customs Tariff",
          vatRate: "5.0",
          spsRegime: "CFIA import requirements",
          securityFiling: "ACI eManifest",
          specialRules: {},
          preferenceSchemes: ["GPT", "LDCT"],
          isAfcftaMember: false,
        },
        {
          countryName: "Switzerland",
          iso2: "CH",
          tariffSource: "Swiss Federal Customs Administration — TARES (tares.admin.ch)",
          vatRate: "8.1",
          spsRegime: "Swiss Federal Food Safety and Veterinary Office (FSVO/BLV) — import notification via e-dec",
          securityFiling: "Swiss customs declaration via e-dec or NCTS for transit",
          specialRules: {
            sps_authority: "Federal Food Safety and Veterinary Office (FSVO/BLV)",
            phyto_authority: "Federal Plant Protection Service (FPPS/OFAG)",
            not_in_traces: "Switzerland is not in the EU TRACES system. Use Swiss e-dec for import notifications.",
            not_in_ipaffs: "Switzerland has its own notification system — not IPAFFS.",
            agricultural_tariffs: "Switzerland maintains high agricultural protection. Many food commodities face specific duties (CHF per kg) rather than ad valorem. Verify via TARES before quoting landed cost.",
            labelling: "Product labelling must comply with Swiss law — similar to EU but some differences in language requirements (all 4 national languages may be required for food).",
            bilateral_agreements: "CH-EU bilateral agreements cover mutual recognition of many standards. Products meeting EU standards generally accepted but separate Swiss declaration still required.",
            eudr_equivalent: "Switzerland passed its own Due Diligence Act covering timber and minerals. Cocoa and coffee expected to follow. Monitor Federal Office for the Environment (FOEN/BAFU) for updates.",
          },
          preferenceSchemes: ["GSP (Swiss Generalized System of Preferences)", "Various bilateral FTAs", "Partial agricultural preferences for ACP countries"],
          isAfcftaMember: false,
        },
      ]);
      log("Inserted 6 destinations", "seed");

      // ── REGIONAL FRAMEWORKS (5) ──
      const frameworkRows = await tx
        .insert(regionalFrameworks)
        .values([
          {
            name: "ECOWAS/WAEMU",
            memberCountries: [
              "BJ","BF","CV","CI","GM","GH","GN","GW","LR","ML","NE","NG","SN","SL","TG",
            ],
            cetBands: { band_0: 0, band_1: 5, band_2: 10, band_3: 20, band_4: 35 },
            cooType: "ECOWAS Certificate of Origin",
            exportProcedures: "Standard ECOWAS export procedures",
            customsCode: "ECOWAS CET",
          },
          {
            name: "CEMAC",
            memberCountries: ["CM", "CF", "TD", "CG", "GQ", "GA"],
            cetBands: { band_0: 5, band_1: 10, band_2: 20, band_3: 30 },
            cooType: "CEMAC Certificate of Origin",
            exportProcedures: "Standard CEMAC export procedures",
            customsCode: "CEMAC Common Tariff",
          },
          {
            name: "EAC",
            memberCountries: ["BI", "CD", "KE", "RW", "SS", "TZ", "UG", "SO"],
            cetBands: { band_0: 0, band_1: 10, band_2: 25 },
            cooType: "EAC Certificate of Origin",
            exportProcedures: "Standard EAC export procedures",
            customsCode: "EAC CET",
          },
          {
            name: "SADC/SACU",
            memberCountries: [
              "AO","BW","CD","SZ","LS","MG","MW","MU","MZ","NA","SC","ZA","TZ","ZM","ZW","KM",
            ],
            cetBands: {},
            cooType: "SADC Certificate of Origin",
            exportProcedures: "Standard SADC export procedures",
            customsCode: "SADC FTA Tariff",
          },
          {
            name: "UMA",
            memberCountries: ["DZ", "LY", "MR", "MA", "TN"],
            cetBands: {},
            cooType: "National CoO + EUR.1 for EU",
            exportProcedures: "National export procedures",
            customsCode: "National tariff + EU Association",
          },
        ])
        .returning();
      log("Inserted 5 regional frameworks", "seed");

      const fwMap: Record<string, string> = {};
      for (const fw of frameworkRows) {
        fwMap[fw.name] = fw.id;
      }

      // ── ORIGIN COUNTRIES (18) ──
      await tx.insert(originCountries).values([
        {
          countryName: "Côte d'Ivoire",
          iso2: "CI",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "LANADA/DPVCQ",
          cooIssuingBody: "Chambre de Commerce et d'Industrie de Côte d'Ivoire",
          customsAdmin: "Direction Générale des Douanes",
          commodityCouncils: {
            cocoa: "Conseil du Café-Cacao (CCC)",
            cashew: "Conseil du Coton et de l'Anacarde (CCA)",
          },
          isAfcftaMember: true,
        },
        {
          countryName: "Ghana",
          iso2: "GH",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "Plant Protection and Regulatory Services Directorate (PPRSD)",
          cooIssuingBody: "Ghana National Chamber of Commerce",
          customsAdmin: "Ghana Revenue Authority – Customs Division",
          commodityCouncils: { cocoa: "COCOBOD", gold: "Minerals Commission" },
          isAfcftaMember: true,
        },
        {
          countryName: "Nigeria",
          iso2: "NG",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "NAQS (Nigeria Agricultural Quarantine Service)",
          cooIssuingBody: "Nigerian Association of Chambers of Commerce (NACCIMA)",
          customsAdmin: "Nigeria Customs Service",
          commodityCouncils: { oil: "DPR/NUPRC" },
          isAfcftaMember: true,
        },
        {
          countryName: "Senegal",
          iso2: "SN",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "Direction de la Protection des Végétaux (DPV)",
          cooIssuingBody: "Chambre de Commerce de Dakar",
          customsAdmin: "Direction Générale des Douanes",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Cameroon",
          iso2: "CM",
          frameworkId: fwMap["CEMAC"],
          phytoAuthority: "MINADER/DRCQ",
          cooIssuingBody: "Chambre de Commerce du Cameroun",
          customsAdmin: "Direction Générale des Douanes",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Kenya",
          iso2: "KE",
          frameworkId: fwMap["EAC"],
          phytoAuthority: "KEPHIS (Kenya Plant Health Inspectorate Service)",
          cooIssuingBody: "Kenya National Chamber of Commerce and Industry",
          customsAdmin: "Kenya Revenue Authority – Customs",
          commodityCouncils: {
            tea: "Tea Board of Kenya",
            flowers: "Kenya Flower Council",
          },
          isAfcftaMember: true,
        },
        {
          countryName: "Tanzania",
          iso2: "TZ",
          frameworkId: fwMap["EAC"],
          phytoAuthority: "TPRI (Tropical Pesticides Research Institute)",
          cooIssuingBody: "Tanzania Chamber of Commerce",
          customsAdmin: "Tanzania Revenue Authority",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Uganda",
          iso2: "UG",
          frameworkId: fwMap["EAC"],
          phytoAuthority: "MAAIF",
          cooIssuingBody: "Uganda National Chamber of Commerce",
          customsAdmin: "Uganda Revenue Authority",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Ethiopia",
          iso2: "ET",
          frameworkId: null,
          phytoAuthority: "Ethiopian Institute of Agricultural Research (EIAR)",
          cooIssuingBody: "Ethiopian Chamber of Commerce",
          customsAdmin: "Ethiopian Customs Commission",
          commodityCouncils: { coffee: "Ethiopian Coffee and Tea Authority" },
          operationalNotes: "Observer AfCFTA status",
          isAfcftaMember: true,
        },
        {
          countryName: "South Africa",
          iso2: "ZA",
          frameworkId: fwMap["SADC/SACU"],
          phytoAuthority: "DALRRD (Dept of Agriculture, Land Reform and Rural Development)",
          cooIssuingBody: "SARS via RLA",
          customsAdmin: "SARS Customs",
          commodityCouncils: {
            wine: "SAWIS",
            citrus: "Citrus Growers Association",
          },
          isAfcftaMember: true,
        },
        {
          countryName: "Morocco",
          iso2: "MA",
          frameworkId: fwMap["UMA"],
          phytoAuthority: "ONSSA",
          cooIssuingBody: "Chambre de Commerce du Maroc",
          customsAdmin: "Administration des Douanes et Impôts Indirects",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Tunisia",
          iso2: "TN",
          frameworkId: fwMap["UMA"],
          phytoAuthority: "Direction Générale de la Santé Végétale",
          cooIssuingBody: "Chambre de Commerce de Tunis",
          customsAdmin: "Douane Tunisienne",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Democratic Republic of Congo",
          iso2: "CD",
          frameworkId: fwMap["EAC"],
          phytoAuthority: "SENASEM",
          cooIssuingBody: "Fédération des Entreprises du Congo",
          customsAdmin: "DGDA",
          operationalNotes: "Also SADC member",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Burkina Faso",
          iso2: "BF",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "DPVC",
          cooIssuingBody: "Chambre de Commerce du Burkina Faso",
          customsAdmin: "Direction Générale des Douanes",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Mali",
          iso2: "ML",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "Direction Nationale de l'Agriculture",
          cooIssuingBody: "Chambre de Commerce du Mali",
          customsAdmin: "Direction Générale des Douanes",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Guinea",
          iso2: "GN",
          frameworkId: fwMap["ECOWAS/WAEMU"],
          phytoAuthority: "Service National de la Protection des Végétaux",
          cooIssuingBody: "Chambre de Commerce de Guinée",
          customsAdmin: "Direction Nationale des Douanes",
          commodityCouncils: { bauxite: "Ministry of Mines" },
          isAfcftaMember: true,
        },
        {
          countryName: "Mozambique",
          iso2: "MZ",
          frameworkId: fwMap["SADC/SACU"],
          phytoAuthority: "IIAM",
          cooIssuingBody: "Mozambique Chamber of Commerce",
          customsAdmin: "Autoridade Tributária de Moçambique",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
        {
          countryName: "Rwanda",
          iso2: "RW",
          frameworkId: fwMap["EAC"],
          phytoAuthority: "RAB (Rwanda Agriculture Board)",
          cooIssuingBody: "Rwanda Chamber of Commerce",
          customsAdmin: "Rwanda Revenue Authority",
          commodityCouncils: {},
          isAfcftaMember: true,
        },
      ]);
      log("Inserted 18 origin countries", "seed");
    });

    log("Prompt 2 seed completed successfully (transaction committed)", "seed");
  } catch (error: any) {
    log(`Seed FAILED — transaction rolled back: ${error.message}`, "seed");
    throw error;
  }
}

export async function seedPrompt3A() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commodities);
  if (Number(existing.count) > 0) {
    log("Commodities already exist, skipping Prompt 3A seed", "seed");
    return;
  }

  try {
    await db.transaction(async (tx: any) => {
      await tx.insert(commodities).values([
        { name: "Raw Cashew Nuts", hsCode: "0801.31", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin", "moisture_damage"] },
        { name: "Shelled Cashew Nuts", hsCode: "0801.32", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Cocoa Beans", hsCode: "1801.00", commodityType: "agricultural", triggersSps: true, triggersEudr: true, triggersCsddd: true, knownHazards: ["cadmium", "ochratoxin"] },
        { name: "Cocoa Butter", hsCode: "1804.00", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["cadmium"] },
        { name: "Cocoa Powder", hsCode: "1805.00", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["cadmium"] },
        { name: "Cocoa Paste", hsCode: "1803.10", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["cadmium"] },
        { name: "Coffee (green/unroasted)", hsCode: "0901.11", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["ochratoxin", "pesticide_residues"] },
        { name: "Coffee (roasted)", hsCode: "0901.21", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["ochratoxin"] },
        { name: "Coffee (instant/soluble)", hsCode: "2101.11", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["ochratoxin"] },
        { name: "Sesame Seeds", hsCode: "1207.40", commodityType: "agricultural", triggersSps: true, knownHazards: ["salmonella", "ethylene_oxide"] },
        { name: "Shea Nuts", hsCode: "1207.99", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Shea Butter", hsCode: "1515.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Cotton (raw lint)", hsCode: "5201.00", commodityType: "agricultural", triggersSps: true, triggersCsddd: true, knownHazards: ["pesticide_residues"] },
        { name: "Cotton Seed", hsCode: "1207.21", commodityType: "agricultural", triggersSps: true, knownHazards: ["gossypol"] },
        { name: "Cotton Seed Oil", hsCode: "1512.21", commodityType: "agricultural", triggersSps: true, knownHazards: ["gossypol"] },
        { name: "Groundnuts (in shell)", hsCode: "1202.41", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Groundnuts (shelled)", hsCode: "1202.42", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Groundnut Oil", hsCode: "1508.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Palm Oil (crude)", hsCode: "1511.10", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["3-MCPD", "mineral_oil"] },
        { name: "Palm Oil (refined)", hsCode: "1511.90", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["3-MCPD"] },
        { name: "Palm Kernel Oil", hsCode: "1513.21", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Coconut Oil", hsCode: "1513.11", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Rubber (natural latex)", hsCode: "4001.10", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Rubber (smoked sheets)", hsCode: "4001.21", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Rubber (technically specified)", hsCode: "4001.22", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Soya Beans", hsCode: "1201.90", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["pesticide_residues"] },
        { name: "Soya Bean Oil", hsCode: "1507.10", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Tea (black)", hsCode: "0902.30", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues", "heavy_metals"] },
        { name: "Tea (green)", hsCode: "0902.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues", "heavy_metals"] },
        { name: "Tobacco (unmanufactured)", hsCode: "2401.10", commodityType: "agricultural", triggersSps: true, triggersCsddd: true, knownHazards: ["pesticide_residues"] },
        { name: "Tobacco (manufactured)", hsCode: "2402.20", commodityType: "agricultural", triggersSps: true, triggersCsddd: true, knownHazards: ["none_significant"] },
        { name: "Vanilla Beans", hsCode: "0905.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Cloves", hsCode: "0907.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Ginger (fresh)", hsCode: "0910.11", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Ginger (dried)", hsCode: "0910.12", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues", "aflatoxin"] },
        { name: "Chilli Peppers (dried)", hsCode: "0904.21", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin", "sudan_dyes"] },
        { name: "Black Pepper", hsCode: "0904.11", commodityType: "agricultural", triggersSps: true, knownHazards: ["salmonella", "pesticide_residues"] },
        { name: "Turmeric", hsCode: "0910.30", commodityType: "agricultural", triggersSps: true, knownHazards: ["lead", "sudan_dyes"] },
        { name: "Cinnamon", hsCode: "0906.11", commodityType: "agricultural", triggersSps: true, knownHazards: ["coumarin"] },
        { name: "Mangoes (fresh)", hsCode: "0804.50", commodityType: "agricultural", triggersSps: true, knownHazards: ["fruit_fly"] },
        { name: "Pineapples (fresh)", hsCode: "0804.30", commodityType: "agricultural", triggersSps: true, knownHazards: ["fruit_fly"] },
        { name: "Avocados", hsCode: "0804.40", commodityType: "agricultural", triggersSps: true, knownHazards: ["fruit_fly"] },
        { name: "Bananas (fresh)", hsCode: "0803.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Citrus Fruits (oranges)", hsCode: "0805.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["citrus_black_spot", "pesticide_residues"] },
        { name: "Citrus Fruits (lemons)", hsCode: "0805.50", commodityType: "agricultural", triggersSps: true, knownHazards: ["citrus_black_spot"] },
        { name: "Passion Fruit", hsCode: "0810.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["fruit_fly"] },
        { name: "Papaya", hsCode: "0807.20", commodityType: "agricultural", triggersSps: true, knownHazards: ["fruit_fly"] },
        { name: "Lychees", hsCode: "0810.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["sulphur_dioxide"] },
        { name: "Dried Fruits (mixed)", hsCode: "0813.40", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin", "sulphur_dioxide"] },
        { name: "Dates", hsCode: "0804.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Cassava (fresh)", hsCode: "0714.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["cyanide"] },
        { name: "Cassava (dried chips)", hsCode: "0714.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["cyanide"] },
        { name: "Cassava Flour", hsCode: "1106.20", commodityType: "agricultural", triggersSps: true, knownHazards: ["cyanide"] },
        { name: "Cassava Starch", hsCode: "1108.14", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Yams", hsCode: "0714.40", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Sweet Potatoes", hsCode: "0714.20", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Plantains", hsCode: "0803.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Maize/Corn", hsCode: "1005.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin", "fumonisin"] },
        { name: "Sorghum", hsCode: "1007.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Millet", hsCode: "1008.21", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Rice (paddy)", hsCode: "1006.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["arsenic", "heavy_metals"] },
        { name: "Rice (milled)", hsCode: "1006.30", commodityType: "agricultural", triggersSps: true, knownHazards: ["arsenic"] },
        { name: "Wheat", hsCode: "1001.99", commodityType: "agricultural", triggersSps: true, knownHazards: ["mycotoxins"] },
        { name: "Sugar (raw cane)", hsCode: "1701.14", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Sugar (refined)", hsCode: "1701.99", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Honey", hsCode: "0409.00", commodityType: "agricultural", triggersSps: true, knownHazards: ["antibiotics", "pesticide_residues"] },
        { name: "Beeswax", hsCode: "1521.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Cut Flowers (roses)", hsCode: "0603.11", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues", "thrips"] },
        { name: "Cut Flowers (other)", hsCode: "0603.19", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues", "thrips"] },
        { name: "Live Plants", hsCode: "0602.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["invasive_species", "plant_diseases"] },
        { name: "Essential Oils (general)", hsCode: "3301.29", commodityType: "agricultural", triggersSps: true, knownHazards: ["adulteration"] },
        { name: "Ylang-Ylang Oil", hsCode: "3301.29", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Jojoba Oil", hsCode: "1515.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Argan Oil", hsCode: "1515.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Karite (Shea) Products", hsCode: "1515.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Gum Arabic", hsCode: "1301.20", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Kola Nuts", hsCode: "0813.40", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Moringa (leaves/powder)", hsCode: "1211.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Hibiscus (dried flowers)", hsCode: "1211.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Fonio", hsCode: "1008.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Teff", hsCode: "1008.90", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Chickpeas", hsCode: "0713.20", commodityType: "agricultural", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Cowpeas/Black-Eyed Peas", hsCode: "0713.35", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Pigeon Peas", hsCode: "0713.60", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Lentils", hsCode: "0713.40", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Sunflower Seeds", hsCode: "1206.00", commodityType: "agricultural", triggersSps: true, knownHazards: ["aflatoxin"] },
        { name: "Sunflower Oil", hsCode: "1512.11", commodityType: "agricultural", triggersSps: true, knownHazards: ["mineral_oil"] },
        { name: "Macadamia Nuts", hsCode: "0802.62", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Cashew Nut Shell Liquid", hsCode: "1302.19", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Cocoa Shell/Husk", hsCode: "1802.00", commodityType: "agricultural", triggersSps: true, triggersEudr: true, knownHazards: ["cadmium"] },
        { name: "Sisal Fibre", hsCode: "5304.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Kenaf Fibre", hsCode: "5303.10", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Pyrethrum Extract", hsCode: "1302.19", commodityType: "agricultural", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Tobacco Stems", hsCode: "2401.30", commodityType: "agricultural", triggersSps: true, triggersCsddd: true, knownHazards: ["none_significant"] },
      ]);
      log("Inserted 94 agricultural commodities", "seed");
    });

    log("Prompt 3A seed completed successfully (transaction committed)", "seed");
  } catch (error: any) {
    log(`Prompt 3A seed FAILED — transaction rolled back: ${error.message}`, "seed");
    throw error;
  }
}

export async function seedPrompt3B() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commodities);
  if (Number(existing.count) >= 128) {
    log("Seafood/livestock/forestry commodities already exist, skipping Prompt 3B seed", "seed");
    return;
  }

  try {
    await db.transaction(async (tx: any) => {
      await tx.insert(commodities).values([
        // ── SEAFOOD (13) — commodity_type = "seafood", triggers_sps = true, triggers_iuu = true ──
        { name: "Tuna (fresh/chilled)", hsCode: "0302.35", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["histamine", "mercury"] },
        { name: "Tuna (frozen)", hsCode: "0303.45", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["histamine", "mercury"] },
        { name: "Tuna (canned)", hsCode: "1604.14", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["histamine"] },
        { name: "Shrimp/Prawns (frozen)", hsCode: "0306.17", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["antibiotics", "heavy_metals"] },
        { name: "Octopus (frozen)", hsCode: "0307.51", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["heavy_metals"] },
        { name: "Squid/Cuttlefish", hsCode: "0307.43", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["heavy_metals"] },
        { name: "Nile Perch (frozen fillets)", hsCode: "0304.59", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["none_significant"] },
        { name: "Tilapia (frozen)", hsCode: "0303.23", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["antibiotics"] },
        { name: "Sardines/Pilchards", hsCode: "1604.13", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["histamine"] },
        { name: "Crab", hsCode: "0306.14", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["heavy_metals"] },
        { name: "Lobster", hsCode: "0306.12", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["none_significant"] },
        { name: "Seaweed/Algae", hsCode: "1212.21", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["heavy_metals", "iodine"] },
        { name: "Dried Fish (stockfish)", hsCode: "0305.59", commodityType: "seafood", triggersSps: true, triggersIuu: true, knownHazards: ["histamine"] },

        // ── LIVESTOCK (11) — commodity_type = "livestock", triggers_sps = true ──
        { name: "Cattle (live)", hsCode: "0102.29", commodityType: "livestock", triggersSps: true, triggersEudr: true, knownHazards: ["FMD", "BSE"] },
        { name: "Goats (live)", hsCode: "0104.20", commodityType: "livestock", triggersSps: true, knownHazards: ["PPR"] },
        { name: "Sheep (live)", hsCode: "0104.10", commodityType: "livestock", triggersSps: true, knownHazards: ["FMD"] },
        { name: "Poultry (live)", hsCode: "0105.11", commodityType: "livestock", triggersSps: true, knownHazards: ["avian_influenza", "newcastle_disease"] },
        { name: "Goat Hides (raw)", hsCode: "4103.20", commodityType: "livestock", triggersSps: true, knownHazards: ["chrome_VI"] },
        { name: "Bovine Hides (raw)", hsCode: "4101.20", commodityType: "livestock", triggersSps: true, knownHazards: ["anthrax"] },
        { name: "Leather (finished bovine)", hsCode: "4107.19", commodityType: "livestock", triggersSps: true, knownHazards: ["chrome_VI"] },
        { name: "Leather (finished goat)", hsCode: "4106.22", commodityType: "livestock", triggersSps: true, knownHazards: ["chrome_VI"] },
        { name: "Wool (greasy)", hsCode: "5101.11", commodityType: "livestock", triggersSps: true, knownHazards: ["pesticide_residues"] },
        { name: "Bone Meal", hsCode: "0506.90", commodityType: "livestock", triggersSps: true, knownHazards: ["BSE"] },
        { name: "Animal Casings", hsCode: "0504.00", commodityType: "livestock", triggersSps: true, knownHazards: ["salmonella"] },

        // ── FORESTRY (10) — commodity_type = "forestry", triggers_sps = true ──
        { name: "Timber (tropical sawn)", hsCode: "4407.29", commodityType: "forestry", triggersSps: true, triggersEudr: true, triggersCites: true, knownHazards: ["invasive_species"] },
        { name: "Timber (logs)", hsCode: "4403.49", commodityType: "forestry", triggersSps: true, triggersEudr: true, triggersCites: true, knownHazards: ["invasive_species"] },
        { name: "Timber (plywood)", hsCode: "4412.31", commodityType: "forestry", triggersSps: true, triggersEudr: true, knownHazards: ["formaldehyde"] },
        { name: "Timber (veneer)", hsCode: "4408.39", commodityType: "forestry", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Charcoal (wood)", hsCode: "4402.90", commodityType: "forestry", triggersSps: true, stopFlags: { SO_charcoal: "UN Security Council sanctions prohibit charcoal exports from Somalia" }, knownHazards: ["none"] },
        { name: "Bamboo (raw)", hsCode: "1401.10", commodityType: "forestry", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Rattan (raw)", hsCode: "1401.20", commodityType: "forestry", triggersSps: true, knownHazards: ["none_significant"] },
        { name: "Wood Chips", hsCode: "4401.21", commodityType: "forestry", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Paper Pulp (wood)", hsCode: "4703.21", commodityType: "forestry", triggersSps: true, triggersEudr: true, knownHazards: ["none_significant"] },
        { name: "Furniture (wooden)", hsCode: "9403.60", commodityType: "forestry", triggersSps: true, triggersEudr: true, knownHazards: ["formaldehyde"] },
      ]);
      log("Inserted 34 commodities (13 seafood, 11 livestock, 10 forestry)", "seed");
    });

    log("Prompt 3B seed completed successfully (transaction committed)", "seed");
  } catch (error: any) {
    log(`Prompt 3B seed FAILED — transaction rolled back: ${error.message}`, "seed");
    throw error;
  }
}

export async function seedPrompt3C() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commodities);
  if (Number(existing.count) >= 154) {
    log("Mineral commodities already exist, skipping Prompt 3C seed", "seed");
    return;
  }

  try {
    await db.transaction(async (tx: any) => {
      await tx.insert(commodities).values([
        { name: "Gold (unwrought)", hsCode: "7108.12", commodityType: "mineral", triggersSps: false, triggersConflict: true, stopFlags: { gold_to_TR: "Borsa Istanbul membership required for gold imports to Turkey" }, knownHazards: ["mercury_contamination"] },
        { name: "Gold (semi-manufactured)", hsCode: "7108.13", commodityType: "mineral", triggersSps: false, triggersConflict: true, knownHazards: ["none"] },
        { name: "Rough Diamonds", hsCode: "7102.10", commodityType: "mineral", triggersSps: false, triggersKimberley: true, knownHazards: ["none"] },
        { name: "Polished Diamonds", hsCode: "7102.39", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Copper Ore/Concentrates", hsCode: "2603.00", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Copper (refined)", hsCode: "7403.11", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Iron Ore", hsCode: "2601.11", commodityType: "mineral", triggersSps: false, triggersCbam: true, knownHazards: ["none"] },
        { name: "Iron/Steel (semi-finished)", hsCode: "7207.11", commodityType: "mineral", triggersSps: false, triggersCbam: true, knownHazards: ["none"] },
        { name: "Cobalt Ore", hsCode: "2605.00", commodityType: "mineral", triggersSps: false, triggersConflict: true, triggersCsddd: true, knownHazards: ["none"] },
        { name: "Cobalt (refined)", hsCode: "8105.20", commodityType: "mineral", triggersSps: false, triggersConflict: true, triggersCsddd: true, knownHazards: ["none"] },
        { name: "Tin Ore (cassiterite)", hsCode: "2609.00", commodityType: "mineral", triggersSps: false, triggersConflict: true, knownHazards: ["none"] },
        { name: "Tin (refined)", hsCode: "8001.10", commodityType: "mineral", triggersSps: false, triggersConflict: true, knownHazards: ["none"] },
        { name: "Tantalum Ore (coltan)", hsCode: "2615.90", commodityType: "mineral", triggersSps: false, triggersConflict: true, knownHazards: ["none"] },
        { name: "Tungsten Ore (wolframite)", hsCode: "2611.00", commodityType: "mineral", triggersSps: false, triggersConflict: true, knownHazards: ["none"] },
        { name: "Bauxite", hsCode: "2606.00", commodityType: "mineral", triggersSps: false, triggersCbam: true, knownHazards: ["none"] },
        { name: "Aluminium (unwrought)", hsCode: "7601.10", commodityType: "mineral", triggersSps: false, triggersCbam: true, knownHazards: ["none"] },
        { name: "Manganese Ore", hsCode: "2602.00", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Chromite Ore", hsCode: "2610.00", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Phosphate Rock", hsCode: "2510.10", commodityType: "mineral", triggersSps: false, knownHazards: ["cadmium"] },
        { name: "Uranium Ore", hsCode: "2612.10", commodityType: "mineral", triggersSps: false, stopFlags: { uranium: "IAEA safeguards required. Nuclear non-proliferation controls apply." }, knownHazards: ["radioactive"] },
        { name: "Lithium Ore (spodumene)", hsCode: "2530.90", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Zinc Ore", hsCode: "2608.00", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Nickel Ore", hsCode: "2604.00", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Platinum Group Metals", hsCode: "7110.11", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Graphite (natural)", hsCode: "2504.10", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
        { name: "Cement (Portland)", hsCode: "2523.29", commodityType: "mineral", triggersSps: false, triggersCbam: true, knownHazards: ["none"] },
      ]);
      log("Inserted 26 mineral commodities", "seed");
    });

    log("Prompt 3C seed completed successfully (transaction committed)", "seed");
  } catch (error: any) {
    log(`Prompt 3C seed FAILED — transaction rolled back: ${error.message}`, "seed");
    throw error;
  }
}

export async function seedPrompt5() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(afcftaRoo);
  if (Number(existing.count) > 0) {
    log("AfCFTA RoO already exist, skipping Prompt 5 seed", "seed");
    return;
  }

  const REF = "AfCFTA Protocol on Rules of Origin, Annex 2";

  try {
    await db.transaction(async (tx: any) => {
      await tx.insert(afcftaRoo).values([
        // ── AGRICULTURAL RAW (WHOLLY_OBTAINED) ──
        { hsHeading: "0102", generalRule: "WHOLLY_OBTAINED", notes: "Live cattle must be born and raised in an AfCFTA State Party", sourceRef: REF },
        { hsHeading: "0104", generalRule: "WHOLLY_OBTAINED", notes: "Live sheep/goats born and raised in territory", sourceRef: REF },
        { hsHeading: "0105", generalRule: "WHOLLY_OBTAINED", notes: "Live poultry hatched and raised in territory", sourceRef: REF },
        { hsHeading: "0302", generalRule: "WHOLLY_OBTAINED", notes: "Fish caught in territorial waters or EEZ of a State Party", sourceRef: REF },
        { hsHeading: "0303", generalRule: "WHOLLY_OBTAINED", notes: "Frozen fish from vessels registered in a State Party", sourceRef: REF },
        { hsHeading: "0304", generalRule: "WHOLLY_OBTAINED", notes: "Fish fillets from fish wholly obtained in territory", sourceRef: REF },
        { hsHeading: "0305", generalRule: "WHOLLY_OBTAINED", notes: "Dried fish from fish wholly obtained in territory", sourceRef: REF },
        { hsHeading: "0306", generalRule: "WHOLLY_OBTAINED", notes: "Crustaceans caught in territorial waters of a State Party", sourceRef: REF },
        { hsHeading: "0307", generalRule: "WHOLLY_OBTAINED", notes: "Molluscs caught in territorial waters of a State Party", sourceRef: REF },
        { hsHeading: "0409", generalRule: "WHOLLY_OBTAINED", notes: "Natural honey harvested in territory", sourceRef: REF },
        { hsHeading: "0504", generalRule: "WHOLLY_OBTAINED", notes: "Animal guts/casings from animals raised in territory", sourceRef: REF },
        { hsHeading: "0506", generalRule: "WHOLLY_OBTAINED", notes: "Bones from animals raised and slaughtered in territory", sourceRef: REF },
        { hsHeading: "0602", generalRule: "WHOLLY_OBTAINED", notes: "Live plants grown in territory of a State Party", sourceRef: REF },
        { hsHeading: "0603", generalRule: "WHOLLY_OBTAINED", notes: "Cut flowers grown in territory", sourceRef: REF },
        { hsHeading: "0713", generalRule: "WHOLLY_OBTAINED", notes: "Dried leguminous vegetables harvested in territory", sourceRef: REF },
        { hsHeading: "0714", generalRule: "WHOLLY_OBTAINED", notes: "Roots and tubers harvested in territory of a State Party", sourceRef: REF },
        { hsHeading: "0801", generalRule: "WHOLLY_OBTAINED", notes: "Cashew nuts harvested in territory", sourceRef: REF },
        { hsHeading: "0802", generalRule: "WHOLLY_OBTAINED", notes: "Other nuts harvested in territory", sourceRef: REF },
        { hsHeading: "0803", generalRule: "WHOLLY_OBTAINED", notes: "Bananas/plantains harvested in territory", sourceRef: REF },
        { hsHeading: "0804", generalRule: "WHOLLY_OBTAINED", notes: "Tropical fruits harvested in territory", sourceRef: REF },
        { hsHeading: "0805", generalRule: "WHOLLY_OBTAINED", notes: "Citrus fruit harvested in territory", sourceRef: REF },
        { hsHeading: "0807", generalRule: "WHOLLY_OBTAINED", notes: "Melons and papaya harvested in territory", sourceRef: REF },
        { hsHeading: "0810", generalRule: "WHOLLY_OBTAINED", notes: "Other fruit harvested in territory", sourceRef: REF },
        { hsHeading: "0813", generalRule: "WHOLLY_OBTAINED", notes: "Dried fruit from fruit wholly obtained in territory", sourceRef: REF },
        { hsHeading: "0901", generalRule: "WHOLLY_OBTAINED", notes: "Coffee harvested in territory of a State Party", sourceRef: REF },
        { hsHeading: "0902", generalRule: "WHOLLY_OBTAINED", notes: "Tea harvested in territory", sourceRef: REF },
        { hsHeading: "0904", generalRule: "WHOLLY_OBTAINED", notes: "Pepper harvested in territory", sourceRef: REF },
        { hsHeading: "0905", generalRule: "WHOLLY_OBTAINED", notes: "Vanilla harvested in territory", sourceRef: REF },
        { hsHeading: "0906", generalRule: "WHOLLY_OBTAINED", notes: "Cinnamon harvested in territory", sourceRef: REF },
        { hsHeading: "0907", generalRule: "WHOLLY_OBTAINED", notes: "Cloves harvested in territory", sourceRef: REF },
        { hsHeading: "0910", generalRule: "WHOLLY_OBTAINED", notes: "Ginger, turmeric and spices harvested in territory", sourceRef: REF },
        { hsHeading: "1001", generalRule: "WHOLLY_OBTAINED", notes: "Wheat harvested in territory", sourceRef: REF },
        { hsHeading: "1005", generalRule: "WHOLLY_OBTAINED", notes: "Maize harvested in territory", sourceRef: REF },
        { hsHeading: "1006", generalRule: "WHOLLY_OBTAINED", notes: "Rice harvested in territory", sourceRef: REF },
        { hsHeading: "1007", generalRule: "WHOLLY_OBTAINED", notes: "Sorghum harvested in territory", sourceRef: REF },
        { hsHeading: "1008", generalRule: "WHOLLY_OBTAINED", notes: "Buckwheat, millet, fonio, teff harvested in territory", sourceRef: REF },
        { hsHeading: "1201", generalRule: "WHOLLY_OBTAINED", notes: "Soya beans harvested in territory", sourceRef: REF },
        { hsHeading: "1202", generalRule: "WHOLLY_OBTAINED", notes: "Groundnuts harvested in territory", sourceRef: REF },
        { hsHeading: "1206", generalRule: "WHOLLY_OBTAINED", notes: "Sunflower seeds harvested in territory", sourceRef: REF },
        { hsHeading: "1207", generalRule: "WHOLLY_OBTAINED", notes: "Other oil seeds (sesame, shea, cotton seed) harvested in territory", sourceRef: REF },
        { hsHeading: "1211", generalRule: "WHOLLY_OBTAINED", notes: "Plants for pharmacy/perfumery (moringa, hibiscus) harvested in territory", sourceRef: REF },
        { hsHeading: "1212", generalRule: "WHOLLY_OBTAINED", notes: "Seaweed and algae harvested in territorial waters", sourceRef: REF },
        { hsHeading: "1301", generalRule: "WHOLLY_OBTAINED", notes: "Natural gums (gum arabic) harvested in territory", sourceRef: REF },
        { hsHeading: "1401", generalRule: "WHOLLY_OBTAINED", notes: "Vegetable plaiting materials (bamboo, rattan) harvested in territory", sourceRef: REF },
        { hsHeading: "1801", generalRule: "WHOLLY_OBTAINED", notes: "Cocoa beans harvested in territory", sourceRef: REF },
        { hsHeading: "2401", generalRule: "WHOLLY_OBTAINED", notes: "Unmanufactured tobacco harvested in territory", sourceRef: REF },
        { hsHeading: "4001", generalRule: "WHOLLY_OBTAINED", notes: "Natural rubber harvested/tapped in territory", sourceRef: REF },
        { hsHeading: "4101", generalRule: "WHOLLY_OBTAINED", notes: "Raw bovine hides from animals raised in territory", sourceRef: REF },
        { hsHeading: "4103", generalRule: "WHOLLY_OBTAINED", notes: "Raw goat hides from animals raised in territory", sourceRef: REF },
        { hsHeading: "5101", generalRule: "WHOLLY_OBTAINED", notes: "Wool shorn from animals raised in territory", sourceRef: REF },
        { hsHeading: "5201", generalRule: "WHOLLY_OBTAINED", notes: "Cotton not carded or combed, harvested in territory", sourceRef: REF },
        { hsHeading: "5303", generalRule: "WHOLLY_OBTAINED", notes: "Jute/kenaf fibre harvested in territory", sourceRef: REF },
        { hsHeading: "5304", generalRule: "WHOLLY_OBTAINED", notes: "Sisal fibre harvested in territory", sourceRef: REF },

        // ── MINERAL ORES (WHOLLY_OBTAINED) ──
        { hsHeading: "2504", generalRule: "WHOLLY_OBTAINED", notes: "Natural graphite extracted in territory", sourceRef: REF },
        { hsHeading: "2510", generalRule: "WHOLLY_OBTAINED", notes: "Phosphate rock mined in territory", sourceRef: REF },
        { hsHeading: "2530", generalRule: "WHOLLY_OBTAINED", notes: "Lithium ore mined in territory", sourceRef: REF },
        { hsHeading: "2601", generalRule: "WHOLLY_OBTAINED", notes: "Iron ore mined in territory", sourceRef: REF },
        { hsHeading: "2602", generalRule: "WHOLLY_OBTAINED", notes: "Manganese ore mined in territory", sourceRef: REF },
        { hsHeading: "2603", generalRule: "WHOLLY_OBTAINED", notes: "Copper ore mined in territory", sourceRef: REF },
        { hsHeading: "2604", generalRule: "WHOLLY_OBTAINED", notes: "Nickel ore mined in territory", sourceRef: REF },
        { hsHeading: "2605", generalRule: "WHOLLY_OBTAINED", notes: "Cobalt ore mined in territory", sourceRef: REF },
        { hsHeading: "2606", generalRule: "WHOLLY_OBTAINED", notes: "Bauxite mined in territory", sourceRef: REF },
        { hsHeading: "2608", generalRule: "WHOLLY_OBTAINED", notes: "Zinc ore mined in territory", sourceRef: REF },
        { hsHeading: "2609", generalRule: "WHOLLY_OBTAINED", notes: "Tin ore (cassiterite) mined in territory", sourceRef: REF },
        { hsHeading: "2610", generalRule: "WHOLLY_OBTAINED", notes: "Chromite ore mined in territory", sourceRef: REF },
        { hsHeading: "2611", generalRule: "WHOLLY_OBTAINED", notes: "Tungsten ore mined in territory", sourceRef: REF },
        { hsHeading: "2612", generalRule: "WHOLLY_OBTAINED", notes: "Uranium ore mined in territory", sourceRef: REF },
        { hsHeading: "2615", generalRule: "WHOLLY_OBTAINED", notes: "Tantalum ore (coltan) mined in territory", sourceRef: REF },

        // ── FORESTRY RAW (WHOLLY_OBTAINED) ──
        { hsHeading: "4401", generalRule: "WHOLLY_OBTAINED", notes: "Fuel wood and wood chips from trees grown in territory", sourceRef: REF },
        { hsHeading: "4402", generalRule: "WHOLLY_OBTAINED", notes: "Charcoal from wood grown in territory", sourceRef: REF },
        { hsHeading: "4403", generalRule: "WHOLLY_OBTAINED", notes: "Wood in the rough, from trees felled in territory", sourceRef: REF },

        // ── PROCESSED AGRICULTURAL (VALUE_ADD or CTH) ──
        { hsHeading: "1106", generalRule: "CTH", minValueAddPct: 30, notes: "Flour must be manufactured from materials of a different HS heading", sourceRef: REF },
        { hsHeading: "1108", generalRule: "CTH", minValueAddPct: 30, notes: "Starch manufactured from materials of a different heading", sourceRef: REF },
        { hsHeading: "1302", generalRule: "VALUE_ADD", minValueAddPct: 30, notes: "Vegetable extracts with min 30% value added in territory", sourceRef: REF },
        { hsHeading: "1507", generalRule: "CTH", minValueAddPct: 30, notes: "Soya bean oil: CTH from raw beans + min 30% value addition", sourceRef: REF },
        { hsHeading: "1508", generalRule: "CTH", minValueAddPct: 30, notes: "Groundnut oil: CTH from raw nuts + min 30% value addition", sourceRef: REF },
        { hsHeading: "1511", generalRule: "CTH", minValueAddPct: 30, notes: "Palm oil: CTH from fresh fruit bunches + min 30% value addition", sourceRef: REF },
        { hsHeading: "1512", generalRule: "CTH", minValueAddPct: 30, notes: "Cotton seed/sunflower oil: CTH + min 30% value addition", sourceRef: REF },
        { hsHeading: "1513", generalRule: "CTH", minValueAddPct: 30, notes: "Coconut/palm kernel oil: CTH + min 30% value addition", sourceRef: REF },
        { hsHeading: "1515", generalRule: "CTH", minValueAddPct: 30, notes: "Fixed vegetable fats/oils: CTH + min 30% value addition", sourceRef: REF },
        { hsHeading: "1521", generalRule: "VALUE_ADD", minValueAddPct: 30, notes: "Beeswax with min 30% value added in processing", sourceRef: REF },
        { hsHeading: "1604", generalRule: "CTH", minValueAddPct: 40, alternativeCriteria: { alt: "Fish wholly obtained in territory + processing in territory" }, notes: "Prepared fish: CTH + 40% value add, or fish wholly obtained + processing", sourceRef: REF },
        { hsHeading: "1701", generalRule: "CTH", minValueAddPct: 30, notes: "Sugar: CTH from cane/beet harvested in territory + 30% value addition", sourceRef: REF },
        { hsHeading: "1802", generalRule: "VALUE_ADD", minValueAddPct: 30, notes: "Cocoa shells from cocoa beans wholly obtained", sourceRef: REF },
        { hsHeading: "1803", generalRule: "CTH", minValueAddPct: 30, notes: "Cocoa paste: CTH from cocoa beans + min 30% value addition", sourceRef: REF },
        { hsHeading: "1804", generalRule: "CTH", minValueAddPct: 30, notes: "Cocoa butter: CTH from cocoa beans + min 30% value addition", sourceRef: REF },
        { hsHeading: "1805", generalRule: "CTH", minValueAddPct: 30, notes: "Cocoa powder: CTH from cocoa beans + min 30% value addition", sourceRef: REF },
        { hsHeading: "2101", generalRule: "CTH", minValueAddPct: 30, notes: "Instant coffee: CTH from green coffee + min 30% value addition", sourceRef: REF },
        { hsHeading: "2402", generalRule: "CTH", minValueAddPct: 40, notes: "Manufactured tobacco: CTH from leaf tobacco + 40% value addition", sourceRef: REF },
        { hsHeading: "3301", generalRule: "VALUE_ADD", minValueAddPct: 35, notes: "Essential oils with min 35% value added through distillation in territory", sourceRef: REF },

        // ── PROCESSED MINERALS / METALS (CTH or VALUE_ADD) ──
        { hsHeading: "2523", generalRule: "CTH", minValueAddPct: 40, notes: "Cement: CTH from clinker/limestone + 40% value addition", sourceRef: REF },
        { hsHeading: "7102", generalRule: "SPECIFIC_PROCESS", specificProcess: "Cutting and polishing performed in territory of a State Party", notes: "Diamonds: cutting/polishing must occur in territory", sourceRef: REF },
        { hsHeading: "7108", generalRule: "CTH", minValueAddPct: 30, notes: "Gold: smelting and refining in territory + 30% value addition", sourceRef: REF },
        { hsHeading: "7110", generalRule: "CTH", minValueAddPct: 30, notes: "PGMs: refining in territory + 30% value addition", sourceRef: REF },
        { hsHeading: "7207", generalRule: "CTH", minValueAddPct: 40, alternativeCriteria: { alt: "Smelting from ore wholly obtained in territory" }, notes: "Semi-finished iron/steel: CTH + 40% value add, or smelted from domestic ore", sourceRef: REF },
        { hsHeading: "7403", generalRule: "CTH", minValueAddPct: 35, notes: "Refined copper: smelting and refining in territory + 35% value addition", sourceRef: REF },
        { hsHeading: "7601", generalRule: "CTH", minValueAddPct: 40, alternativeCriteria: { alt: "Smelting from bauxite wholly obtained in territory" }, notes: "Aluminium: CTH + 40% value add, or smelted from domestic bauxite", sourceRef: REF },
        { hsHeading: "8001", generalRule: "CTH", minValueAddPct: 35, notes: "Tin: smelting and refining in territory + 35% value addition", sourceRef: REF },
        { hsHeading: "8105", generalRule: "CTH", minValueAddPct: 35, notes: "Cobalt: refining in territory + 35% value addition", sourceRef: REF },

        // ── PROCESSED HIDES / LEATHER (CTH) ──
        { hsHeading: "4106", generalRule: "CTH", minValueAddPct: 35, notes: "Finished goat leather: tanning performed in territory + 35% value addition", sourceRef: REF },
        { hsHeading: "4107", generalRule: "CTH", minValueAddPct: 35, notes: "Finished bovine leather: tanning in territory + 35% value addition", sourceRef: REF },

        // ── PROCESSED WOOD / FORESTRY (CTH) ──
        { hsHeading: "4407", generalRule: "CTH", minValueAddPct: 30, notes: "Sawn timber: sawing from logs of heading 4403 + 30% value addition", sourceRef: REF },
        { hsHeading: "4408", generalRule: "CTH", minValueAddPct: 30, notes: "Veneer: slicing/peeling from logs + 30% value addition", sourceRef: REF },
        { hsHeading: "4412", generalRule: "CTH", minValueAddPct: 35, notes: "Plywood: manufacture from veneer/sawn wood + 35% value addition", sourceRef: REF },
        { hsHeading: "4703", generalRule: "CTH", minValueAddPct: 30, notes: "Chemical wood pulp: pulping process in territory + 30% value addition", sourceRef: REF },
        { hsHeading: "9403", generalRule: "CTH", minValueAddPct: 40, notes: "Wooden furniture: manufacture from domestic wood + 40% value addition", sourceRef: REF },
      ]);
      log("Inserted 107 AfCFTA Rules of Origin records", "seed");
    });

    log("Prompt 5 seed completed successfully (transaction committed)", "seed");
  } catch (error: any) {
    log(`Prompt 5 seed FAILED — transaction rolled back: ${error.message}`, "seed");
    throw error;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PROMPT 6 — USA destination + All 54 African countries + commodity trigger updates
   ═══════════════════════════════════════════════════════════════════ */

export async function seedPrompt6() {
  // Guard: check if USA destination already exists
  const [usExists] = await db
    .select({ count: sql<number>`count(*)` })
    .from(destinations)
    .where(sql`iso2 = 'US'`);
  if (Number(usExists.count) > 0) {
    log("Prompt 6 seed: USA destination already exists, checking origins...", "seed");
  } else {
    // ── ADD USA DESTINATION ──
    await db.insert(destinations).values({
      countryName: "United States",
      iso2: "US",
      tariffSource: "USITC Harmonized Tariff Schedule (HTS) — hts.usitc.gov",
      vatRate: "0.0",
      spsRegime: "FDA / USDA APHIS",
      securityFiling: "ISF 10+2 (Importer Security Filing) — 24h before loading",
      specialRules: {
        isf_10_2: "CBP requires 10 data elements from the importer and 2 from the carrier, filed electronically 24 hours before vessel departure. $5,000 penalty per violation.",
        fda_prior_notice: "FDA Prior Notice required for all food/feed imports via PNSI system. Water: 8h pre-arrival; Air: 4h. Facility registration (FDA FURLS) also required.",
        usda_phyto: "USDA APHIS requires phytosanitary clearance for plant and animal products. Import permits may be required. Inspected at port of entry.",
        lacey_act: "Lacey Act requires import declaration for timber, plant products, and wildlife — genus/species, country of harvest. Electronic filing only since Jan 2026 (PPQ 505 eliminated).",
        dodd_frank: "Dodd-Frank Section 1502 — conflict minerals (3TG) due diligence. RCOI + SEC Form SD filing for publicly traded companies.",
        kimberley_process: "Clean Diamond Trade Act — Kimberley Process Certificate required for rough diamond imports in tamper-proof container.",
        agoa: "African Growth and Opportunity Act — duty-free access for 1,800+ products from 32 eligible SSA countries. 35% value-add + Proof of Origin required. Reauthorized to Dec 2026. Does NOT override reciprocal tariffs.",
        reciprocal_tariffs: "Country-specific reciprocal tariff rates (10%-32%). IEEPA struck down by SCOTUS Feb 2026; 10% Sec 122 baseline currently in effect. Rates may change.",
        fcpa: "Foreign Corrupt Practices Act — anti-bribery compliance required for all dealings involving foreign officials.",
        ofac_sanctions: "OFAC (Treasury) sanctions screening mandatory. Screen all parties against SDN List + sectoral programs pre-transaction. Civil penalty: $330k/violation; Criminal: $1M + 20yrs.",
        cbp_entry: "CBP Entry Summary (Form 7501) required within 10 working days of entry. All PGA flags must be addressed.",
        customs_bond: "Continuous or single-entry customs bond required to guarantee duty payment.",
      },
      preferenceSchemes: ["AGOA", "GSP"],
      isAfcftaMember: false,
    });
    log("Inserted USA destination", "seed");
  }

  // ── UPDATE EXISTING 18 ORIGINS WITH NEW FIELDS ──
  const existingUpdates: Array<{ iso2: string; status: string; flagReason?: string; flagDetails?: string; agoaStatus: string; agoaReason?: string; usTariffRate: string; keyRegulations: string; primaryExportRisk: string; region: string }> = [
    { iso2: "CI", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Cocoa); Local: CCA", primaryExportRisk: "Cocoa", region: "West Africa" },
    { iso2: "GH", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Cocoa); COCOBOD checks", primaryExportRisk: "Cocoa, Gold", region: "West Africa" },
    { iso2: "NG", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "14%", keyRegulations: "Off EU high-risk list Jan 2026", primaryExportRisk: "Oil", region: "West Africa" },
    { iso2: "SN", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Migration-related oversight", primaryExportRisk: "Fish, Nuts", region: "West Africa" },
    { iso2: "CM", status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "Human rights", usTariffRate: "11%", keyRegulations: "EUDR (Timber/Cocoa) - High Priority", primaryExportRisk: "Cocoa, Timber", region: "Central Africa" },
    { iso2: "KE", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Coffee); UK EPA", primaryExportRisk: "Tea, Coffee", region: "East Africa" },
    { iso2: "TZ", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Coffee); Off high-risk list", primaryExportRisk: "Coffee, Cashews", region: "East Africa" },
    { iso2: "UG", status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "Human rights", usTariffRate: "10%", keyRegulations: "EUDR (Coffee) - Critical", primaryExportRisk: "Coffee, Tea", region: "East Africa" },
    { iso2: "ET", status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "Human rights", usTariffRate: "10%", keyRegulations: "EUDR (Coffee) - Critical", primaryExportRisk: "Coffee", region: "East Africa" },
    { iso2: "ZA", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "30%", keyRegulations: "Off EU high-risk list Jan 2026", primaryExportRisk: "General", region: "Southern Africa" },
    { iso2: "MA", status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "North Africa", usTariffRate: "10%", keyRegulations: "Association Agreement; ONSSA", primaryExportRisk: "Agri, Textiles", region: "North Africa" },
    { iso2: "TN", status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "North Africa", usTariffRate: "28%", keyRegulations: "Association Agreement", primaryExportRisk: "General", region: "North Africa" },
    { iso2: "CD", status: "FLAG", flagReason: "Conflict Minerals", flagDetails: "Eastern DRC conflict zones. UN Group of Experts monitoring active. Dodd-Frank 3TG due diligence mandatory for tin, tantalum, tungsten, and gold. Enhanced due diligence required.", agoaStatus: "Eligible", usTariffRate: "11%", keyRegulations: "Dodd-Frank Conflict Minerals; UN/EU EDD", primaryExportRisk: "Minerals", region: "Central Africa" },
    { iso2: "BF", status: "FLAG", flagReason: "Military Government", flagDetails: "ECOWAS suspended membership following coup. Enhanced due diligence required. Off EU high-risk list Jan 2026.", agoaStatus: "Ineligible", agoaReason: "Rule of law", usTariffRate: "10%", keyRegulations: "EDD; ECOWAS suspended; Off EU high-risk list Jan 2026", primaryExportRisk: "Cotton, Gold", region: "West Africa" },
    { iso2: "ML", status: "FLAG", flagReason: "Military Government", flagDetails: "EU restrictive measures in place. ECOWAS membership suspended. Enhanced due diligence required for all transactions.", agoaStatus: "Ineligible", agoaReason: "HR/rule of law", usTariffRate: "10%", keyRegulations: "EU restrictive; ECOWAS suspended", primaryExportRisk: "Gold, Cotton", region: "West Africa" },
    { iso2: "GN", status: "FLAG", flagReason: "Military Government", flagDetails: "Political instability following 2021 coup. ECOWAS suspended. Enhanced due diligence required.", agoaStatus: "Ineligible", agoaReason: "Rule of law", usTariffRate: "10%", keyRegulations: "Political instability; EDD required", primaryExportRisk: "Bauxite", region: "West Africa" },
    { iso2: "MZ", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Off EU high-risk list Jan 2026", primaryExportRisk: "Gas, Aluminium", region: "East Africa" },
    { iso2: "RW", status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Coffee)", primaryExportRisk: "Tea, Coffee", region: "East Africa" },
  ];

  for (const u of existingUpdates) {
    await db.execute(sql`
      UPDATE origin_countries SET
        status = ${u.status},
        flag_reason = ${u.flagReason ?? null},
        flag_details = ${u.flagDetails ?? null},
        agoa_status = ${u.agoaStatus},
        agoa_reason = ${u.agoaReason ?? null},
        us_tariff_rate = ${u.usTariffRate},
        key_regulations = ${u.keyRegulations},
        primary_export_risk = ${u.primaryExportRisk},
        region = ${u.region}
      WHERE iso2 = ${u.iso2}
    `);
  }
  log("Updated 18 existing origin countries with new fields", "seed");

  // ── ADD MISSING 36 AFRICAN COUNTRIES ──
  // First get framework IDs
  const frameworks = await db.select().from(regionalFrameworks);
  const fwMap: Record<string, string> = {};
  for (const fw of frameworks) fwMap[fw.name] = fw.id;

  // Check how many origins we have already
  const [originCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(originCountries);
  if (Number(originCount.count) >= 50) {
    log("Prompt 6 seed: 50+ origins already exist, skipping new inserts", "seed");
  } else {
    const newOrigins = [
      // ── WEST AFRICA (ECOWAS) ──
      { countryName: "Algeria", iso2: "DZ", frameworkId: fwMap["UMA"], phytoAuthority: "Direction de la Protection des Végétaux (DPV)", cooIssuingBody: "Chambre Algérienne de Commerce et d'Industrie", customsAdmin: "Direction Générale des Douanes", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "North Africa", usTariffRate: "30%", keyRegulations: "Standard AML; Turkey import duty checks", primaryExportRisk: "Oil, Gas, Dates", region: "North Africa" },
      { countryName: "Angola", iso2: "AO", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Instituto de Desenvolvimento Agrário (IDA)", cooIssuingBody: "Câmara de Comércio e Indústria de Angola", customsAdmin: "Administração Geral Tributária", commodityCouncils: { oil: "Sonangol" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "32%", keyRegulations: "Anti-Corruption (FCPA/UKBA) screening", primaryExportRisk: "Oil", region: "Southern Africa" },
      { countryName: "Benin", iso2: "BJ", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Direction de l'Agriculture (DA)", cooIssuingBody: "Chambre de Commerce et d'Industrie du Bénin", customsAdmin: "Direction Générale des Douanes et Droits Indirects", commodityCouncils: { cotton: "Association Interprofessionnelle du Coton (AIC)" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Cotton); Canada Child Labor Act", primaryExportRisk: "Cotton, Cashews", region: "West Africa" },
      { countryName: "Botswana", iso2: "BW", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Department of Crop Production", cooIssuingBody: "Botswana Unified Revenue Service", customsAdmin: "Botswana Unified Revenue Service (BURS)", commodityCouncils: { diamonds: "Diamond Hub" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "15%", keyRegulations: "Kimberley Process for diamonds", primaryExportRisk: "Diamonds, Beef", region: "Southern Africa" },
      { countryName: "Burundi", iso2: "BI", frameworkId: fwMap["EAC"], phytoAuthority: "Institut des Sciences Agronomiques du Burundi (ISABU)", cooIssuingBody: "Chambre Fédérale de Commerce et d'Industrie du Burundi", customsAdmin: "Office Burundais des Recettes (OBR)", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "EU/UK Restrictive Measures", flagDetails: "EU and UK restrictive measures targeting specific individuals. Sanctions screening required for all counterparties. Enhanced due diligence mandatory.", agoaStatus: "Ineligible", agoaReason: "Political violence", usTariffRate: "10%", keyRegulations: "Sanctions screening for listed individuals", primaryExportRisk: "Coffee, Tea", region: "East Africa" },
      { countryName: "Cabo Verde", iso2: "CV", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Instituto Nacional de Investigação e Desenvolvimento Agrário (INIDA)", cooIssuingBody: "Câmara de Comércio de Cabo Verde", customsAdmin: "Alfândegas de Cabo Verde", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "GSP+ Preference eligibility", primaryExportRisk: "General", region: "West Africa" },
      { countryName: "Central African Republic", iso2: "CF", frameworkId: fwMap["CEMAC"], phytoAuthority: "Ministère de l'Agriculture", cooIssuingBody: "Chambre de Commerce de Centrafrique", customsAdmin: "Direction Générale des Douanes", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "UN/EU Sanctions", flagDetails: "UN arms embargo and asset freeze in effect. EU restrictive measures. Conflict-affected country. All transactions require comprehensive sanctions screening and enhanced due diligence.", agoaStatus: "Ineligible", agoaReason: "Human rights", usTariffRate: "10%", keyRegulations: "Arms embargo & Asset freeze checks", primaryExportRisk: "Diamonds, Timber", region: "Central Africa" },
      { countryName: "Chad", iso2: "TD", frameworkId: fwMap["CEMAC"], phytoAuthority: "Direction de la Protection des Végétaux et du Conditionnement", cooIssuingBody: "Chambre de Commerce du Tchad", customsAdmin: "Direction Générale des Douanes et Droits Indirects", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "France: CIAN-aligned compliance", primaryExportRisk: "Oil, Cotton", region: "Central Africa" },
      { countryName: "Comoros", iso2: "KM", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Direction Nationale de la Stratégie Agricole", cooIssuingBody: "Chambre de Commerce des Comores", customsAdmin: "Direction Générale des Douanes", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Food safety & Phyto-certificate", primaryExportRisk: "Vanilla, Cloves", region: "East Africa" },
      { countryName: "Republic of Congo", iso2: "CG", frameworkId: fwMap["CEMAC"], phytoAuthority: "Direction Générale de l'Agriculture", cooIssuingBody: "Chambre de Commerce de Brazzaville", customsAdmin: "Direction Générale des Douanes et Droits Indirects", commodityCouncils: { oil: "SNPC" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Timber) - Geolocation required", primaryExportRisk: "Oil, Timber", region: "Central Africa" },
      { countryName: "Djibouti", iso2: "DJ", frameworkId: null, phytoAuthority: "Ministère de l'Agriculture", cooIssuingBody: "Chambre de Commerce de Djibouti", customsAdmin: "Direction des Douanes et Droits Indirects", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Port security & Transshipment risk", primaryExportRisk: "Logistics Hub", region: "East Africa" },
      { countryName: "Egypt", iso2: "EG", frameworkId: null, phytoAuthority: "Central Administration of Plant Quarantine (CAPQ)", cooIssuingBody: "Federation of Egyptian Chambers of Commerce", customsAdmin: "Egyptian Customs Authority", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "North Africa", usTariffRate: "10%", keyRegulations: "Association Agreement tariff verification", primaryExportRisk: "General", region: "North Africa" },
      { countryName: "Equatorial Guinea", iso2: "GQ", frameworkId: fwMap["CEMAC"], phytoAuthority: "Ministerio de Agricultura", cooIssuingBody: "Cámara de Comercio de Guinea Ecuatorial", customsAdmin: "Dirección General de Aduanas", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "Income graduation", usTariffRate: "10%", keyRegulations: "AML focus", primaryExportRisk: "Oil", region: "Central Africa" },
      { countryName: "Eritrea", iso2: "ER", frameworkId: null, phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "Eritrea Chamber of Commerce", customsAdmin: "Eritrean Customs", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "EU Restrictive Measures", flagDetails: "EU restrictive measures targeting specific individuals and entities. Limited trade infrastructure. Enhanced due diligence required for all counterparties.", agoaStatus: "Ineligible", agoaReason: "Human rights", usTariffRate: "10%", keyRegulations: "Restrictive measures on individuals", primaryExportRisk: "Minerals", region: "East Africa" },
      { countryName: "Eswatini", iso2: "SZ", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "Eswatini Chamber of Commerce", customsAdmin: "Eswatini Revenue Authority", commodityCouncils: { sugar: "Eswatini Sugar Association" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "SADC EPA", primaryExportRisk: "Sugar", region: "Southern Africa" },
      { countryName: "Gabon", iso2: "GA", frameworkId: fwMap["CEMAC"], phytoAuthority: "Direction Générale de l'Agriculture", cooIssuingBody: "Chambre de Commerce du Gabon", customsAdmin: "Direction Générale des Douanes", commodityCouncils: { timber: "Société Nationale des Bois du Gabon" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "Rule of law", usTariffRate: "10%", keyRegulations: "EUDR (Timber)", primaryExportRisk: "Timber, Manganese", region: "Central Africa" },
      { countryName: "The Gambia", iso2: "GM", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Department of Agriculture", cooIssuingBody: "Gambia Chamber of Commerce and Industry", customsAdmin: "Gambia Revenue Authority", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Visa-related monitoring (not trade)", primaryExportRisk: "General", region: "West Africa" },
      { countryName: "Guinea-Bissau", iso2: "GW", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Ministério da Agricultura", cooIssuingBody: "Câmara de Comércio da Guiné-Bissau", customsAdmin: "Direcção Geral das Alfândegas", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "UN Sanctions", flagDetails: "UN Peacebuilding Commission monitoring. Political instability. Arms embargo and travel ban in effect. Enhanced due diligence required.", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Arms embargo & Travel ban", primaryExportRisk: "Cashews", region: "West Africa" },
      { countryName: "Lesotho", iso2: "LS", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Department of Agricultural Research", cooIssuingBody: "Lesotho Chamber of Commerce", customsAdmin: "Lesotho Revenue Authority", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "15%", keyRegulations: "AGOA critical; SADC EPA", primaryExportRisk: "Textiles", region: "Southern Africa" },
      { countryName: "Liberia", iso2: "LR", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "Liberia Chamber of Commerce", customsAdmin: "Liberia Revenue Authority", commodityCouncils: { rubber: "Liberia Rubber Planters Association" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Timber/Rubber)", primaryExportRisk: "Rubber, Timber", region: "West Africa" },
      { countryName: "Libya", iso2: "LY", frameworkId: fwMap["UMA"], phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "Libyan Chamber of Commerce", customsAdmin: "Libyan Customs Authority", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "UN/EU Embargo", flagDetails: "UN arms embargo in effect. EU asset freezes on listed individuals and entities. Ongoing conflict. Very high risk — comprehensive sanctions screening and enhanced due diligence mandatory for all transactions.", agoaStatus: "Ineligible", agoaReason: "North Africa", usTariffRate: "30%", keyRegulations: "Asset freeze & individual screening", primaryExportRisk: "Oil", region: "North Africa" },
      { countryName: "Madagascar", iso2: "MG", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Direction de la Protection des Végétaux (DPV)", cooIssuingBody: "Chambre de Commerce et d'Industrie d'Antananarivo", customsAdmin: "Direction Générale des Douanes", commodityCouncils: { vanilla: "Groupement National Vanille" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "15%", keyRegulations: "EUDR (Cocoa); Food Safety", primaryExportRisk: "Vanilla, Cocoa", region: "East Africa" },
      { countryName: "Malawi", iso2: "MW", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Department of Agricultural Research Services", cooIssuingBody: "Malawi Confederation of Chambers of Commerce", customsAdmin: "Malawi Revenue Authority", commodityCouncils: { tobacco: "Tobacco Commission" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "Canada Forced Labor (Tobacco)", primaryExportRisk: "Tea, Tobacco", region: "East Africa" },
      { countryName: "Mauritania", iso2: "MR", frameworkId: fwMap["UMA"], phytoAuthority: "Direction de l'Agriculture", cooIssuingBody: "Chambre de Commerce de Mauritanie", customsAdmin: "Direction Générale des Douanes", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EU Fisheries Partnership", primaryExportRisk: "Iron, Fish", region: "West Africa" },
      { countryName: "Mauritius", iso2: "MU", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "National Plant Protection Office (NPPO)", cooIssuingBody: "Mauritius Chamber of Commerce and Industry", customsAdmin: "Mauritius Revenue Authority", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "15%", keyRegulations: "EPA; FATF monitoring", primaryExportRisk: "General", region: "East Africa" },
      { countryName: "Namibia", iso2: "NA", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Directorate of Agricultural Research and Training", cooIssuingBody: "Namibia Chamber of Commerce and Industry", customsAdmin: "Namibia Revenue Agency (NamRA)", commodityCouncils: { beef: "Meat Board of Namibia" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "SADC EPA; AGOA", primaryExportRisk: "Beef, Minerals", region: "Southern Africa" },
      { countryName: "Niger", iso2: "NE", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Direction de la Protection des Végétaux", cooIssuingBody: "Chambre de Commerce du Niger", customsAdmin: "Direction Générale des Douanes", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "Military Government", flagDetails: "ECOWAS membership suspended following 2023 coup. Enhanced due diligence required. Political instability ongoing.", agoaStatus: "Ineligible", agoaReason: "Rule of law", usTariffRate: "10%", keyRegulations: "EDD; ECOWAS suspended", primaryExportRisk: "Uranium, Oil", region: "West Africa" },
      { countryName: "São Tomé and Príncipe", iso2: "ST", frameworkId: null, phytoAuthority: "Direcção de Agricultura", cooIssuingBody: "Câmara de Comércio de São Tomé", customsAdmin: "Direcção das Alfândegas", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Cocoa)", primaryExportRisk: "Cocoa", region: "Central Africa" },
      { countryName: "Seychelles", iso2: "SC", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Seychelles Agricultural Agency", cooIssuingBody: "Seychelles Chamber of Commerce and Industry", customsAdmin: "Seychelles Revenue Commission", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Ineligible", agoaReason: "Income graduation", usTariffRate: "10%", keyRegulations: "Tax transparency & AML", primaryExportRisk: "Fish", region: "East Africa" },
      { countryName: "Sierra Leone", iso2: "SL", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "Sierra Leone Chamber of Commerce", customsAdmin: "National Revenue Authority", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Cocoa)", primaryExportRisk: "Minerals, Cocoa", region: "West Africa" },
      { countryName: "Somalia", iso2: "SO", frameworkId: fwMap["EAC"], phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "Somali Chamber of Commerce", customsAdmin: "Customs Authority", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "UN Sanctions", flagDetails: "UN arms embargo in effect. Al-Shabaab-controlled areas. Charcoal export ban under UN Security Council resolution. OFAC restrictions apply. Very high risk — comprehensive screening required.", agoaStatus: "Ineligible", agoaReason: "Not reviewed", usTariffRate: "10%", keyRegulations: "Charcoal ban; Arms embargo", primaryExportRisk: "Livestock", region: "East Africa" },
      { countryName: "South Sudan", iso2: "SS", frameworkId: fwMap["EAC"], phytoAuthority: "Ministry of Agriculture", cooIssuingBody: "South Sudan Chamber of Commerce", customsAdmin: "Customs Service", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "UN/EU Embargo", flagDetails: "UN arms embargo in effect. EU asset freezes and travel bans on listed individuals. Ongoing civil conflict. Very high risk — comprehensive sanctions screening and enhanced due diligence mandatory.", agoaStatus: "Ineligible", agoaReason: "Political violence", usTariffRate: "10%", keyRegulations: "High-risk EDD; Conflict monitoring", primaryExportRisk: "Oil", region: "East Africa" },
      { countryName: "Sudan", iso2: "SD", frameworkId: null, phytoAuthority: "Plant Protection Directorate", cooIssuingBody: "Sudan Chamber of Commerce", customsAdmin: "Sudan Customs Authority", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "Civil Conflict", flagDetails: "Ongoing armed conflict between SAF and RSF. US sanctions history. EU restrictive measures. Very high risk — most trade effectively blocked. Comprehensive vetting required.", agoaStatus: "Ineligible", agoaReason: "Not reviewed", usTariffRate: "10%", keyRegulations: "Very high risk; Conflict vetting", primaryExportRisk: "Gum Arabic", region: "East Africa" },
      { countryName: "Togo", iso2: "TG", frameworkId: fwMap["ECOWAS/WAEMU"], phytoAuthority: "Direction de la Protection des Végétaux", cooIssuingBody: "Chambre de Commerce et d'Industrie du Togo", customsAdmin: "Office Togolais des Recettes", commodityCouncils: {}, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "10%", keyRegulations: "EUDR (Coffee)", primaryExportRisk: "Coffee, Cotton", region: "West Africa" },
      { countryName: "Zambia", iso2: "ZM", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Zambia Agriculture Research Institute (ZARI)", cooIssuingBody: "Zambia Chamber of Commerce and Industry", customsAdmin: "Zambia Revenue Authority", commodityCouncils: { copper: "Zambia Chamber of Mines" }, isAfcftaMember: true, status: "INCLUDE", agoaStatus: "Eligible", usTariffRate: "17%", keyRegulations: "Forced labor risk (mining)", primaryExportRisk: "Copper, Cobalt", region: "Southern Africa" },
      { countryName: "Zimbabwe", iso2: "ZW", frameworkId: fwMap["SADC/SACU"], phytoAuthority: "Plant Quarantine Services Institute", cooIssuingBody: "Zimbabwe National Chamber of Commerce", customsAdmin: "Zimbabwe Revenue Authority (ZIMRA)", commodityCouncils: {}, isAfcftaMember: true, status: "FLAG", flagReason: "EU Embargo", flagDetails: "EU restrictive measures (arms embargo to Feb 2027). Targeted sanctions on specific individuals and entities. Enhanced due diligence required.", agoaStatus: "Ineligible", agoaReason: "Not eligible", usTariffRate: "15%", keyRegulations: "Arms embargo to Feb 2027", primaryExportRisk: "Tobacco, Minerals", region: "Southern Africa" },
    ];

    for (const o of newOrigins) {
      const [exists] = await db
        .select({ count: sql<number>`count(*)` })
        .from(originCountries)
        .where(sql`iso2 = ${o.iso2}`);
      if (Number(exists.count) === 0) {
        await db.insert(originCountries).values(o as any);
      }
    }
    log(`Inserted up to ${newOrigins.length} new origin countries`, "seed");
  }

  // ── UPDATE COMMODITY TRIGGERS (Lacey Act + FDA Prior Notice) ──
  await db.execute(sql`UPDATE commodities SET triggers_lacey_act = true WHERE commodity_type = 'forestry'`);
  await db.execute(sql`UPDATE commodities SET triggers_fda_prior_notice = true WHERE commodity_type IN ('agricultural', 'seafood', 'livestock')`);
  log("Updated commodity triggers: Lacey Act (forestry), FDA Prior Notice (food/agri)", "seed");

  log("Prompt 6 seed completed", "seed");
}

export async function seedPrompt7() {
  // Guard: skip if commodities already include the new batch
  const [{ count: commodityCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commodities);
  if (Number(commodityCount) >= 190) {
    log("Prompt 7 seed: commodities already at 190+, skipping", "seed");
    return;
  }

  log("Seeding new commodity categories (textiles, leather, chemicals, metals, petroleum, paper, vehicles, consumer products)...", "seed");

  await db.transaction(async (tx: any) => {
    await tx.insert(commodities).values([
      // ── TEXTILES & GARMENTS (HS 50-63) ──
      { name: "Cotton Yarn", hsCode: "5205.11", commodityType: "manufactured", triggersSps: false, triggersCsddd: true, knownHazards: ["none_significant"] },
      { name: "Woven Cotton Fabrics", hsCode: "5208.11", commodityType: "manufactured", triggersSps: false, triggersCsddd: true, knownHazards: ["none_significant"] },
      { name: "Knitted Garments", hsCode: "6109.10", commodityType: "manufactured", triggersSps: false, triggersCsddd: true, knownHazards: ["none_significant"] },
      { name: "Woven Garments", hsCode: "6203.42", commodityType: "manufactured", triggersSps: false, triggersCsddd: true, knownHazards: ["none_significant"] },
      { name: "Used Clothing", hsCode: "6309.00", commodityType: "manufactured", triggersSps: false, knownHazards: ["none_significant"] },
      { name: "Sisal / Jute Sacks", hsCode: "6305.10", commodityType: "manufactured", triggersSps: false, knownHazards: ["none_significant"] },

      // ── LEATHER & HIDES (HS 41-43) ──
      { name: "Raw Cattle Hides", hsCode: "4101.20", commodityType: "livestock", triggersSps: true, triggersEudr: true, knownHazards: ["FMD"] },
      { name: "Leather Bags & Articles", hsCode: "4202.21", commodityType: "manufactured", triggersSps: false, knownHazards: ["chrome_VI"] },
      { name: "Sheepskin (tanned)", hsCode: "4105.30", commodityType: "livestock", triggersSps: true, knownHazards: ["chrome_VI"] },

      // ── CHEMICALS, COSMETICS & FERTILIZERS (HS 25, 28-38) ──
      { name: "Phosphoric Acid", hsCode: "2809.20", commodityType: "manufactured", triggersSps: false, triggersReach: true, knownHazards: ["none_significant"] },
      { name: "Argan Cosmetics", hsCode: "3304.91", commodityType: "manufactured", triggersSps: false, triggersReach: true, knownHazards: ["none_significant"] },
      { name: "Shea Cosmetics", hsCode: "3304.99", commodityType: "manufactured", triggersSps: false, triggersReach: true, knownHazards: ["none_significant"] },
      { name: "Soap (manufactured)", hsCode: "3401.11", commodityType: "manufactured", triggersSps: false, triggersReach: true, knownHazards: ["none_significant"] },
      { name: "Fertilizers (phosphate-based)", hsCode: "3103.10", commodityType: "manufactured", triggersSps: false, triggersCbam: true, triggersReach: true, knownHazards: ["cadmium"] },
      { name: "Fertilizers (nitrogen-based)", hsCode: "3102.10", commodityType: "manufactured", triggersSps: false, triggersCbam: true, triggersReach: true, knownHazards: ["none_significant"] },

      // ── METALS & ARTICLES (HS 72-76) ──
      { name: "Steel Billets", hsCode: "7207.19", commodityType: "mineral", triggersSps: false, triggersCbam: true, triggersSection232: true, knownHazards: ["none"] },
      { name: "Steel Bars / Rods", hsCode: "7213.10", commodityType: "mineral", triggersSps: false, triggersCbam: true, triggersSection232: true, knownHazards: ["none"] },
      { name: "Steel Flat-Rolled Products", hsCode: "7208.10", commodityType: "mineral", triggersSps: false, triggersCbam: true, triggersSection232: true, knownHazards: ["none"] },
      { name: "Aluminium Bars / Rods", hsCode: "7604.10", commodityType: "mineral", triggersSps: false, triggersCbam: true, triggersSection232: true, knownHazards: ["none"] },
      { name: "Copper Wire", hsCode: "7408.11", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },

      // ── PETROLEUM & GAS (HS 27) ──
      { name: "Crude Petroleum Oil", hsCode: "2709.00", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
      { name: "Natural Gas (LNG)", hsCode: "2711.11", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },
      { name: "Coal", hsCode: "2701.12", commodityType: "mineral", triggersSps: false, knownHazards: ["none"] },

      // ── PAPER & PULP (HS 47-48) — EUDR SCOPE ──
      { name: "Wood Pulp", hsCode: "4703.21", commodityType: "forestry", triggersSps: false, triggersEudr: true, triggersLaceyAct: true, knownHazards: ["none_significant"] },
      { name: "Paper / Cardboard", hsCode: "4804.11", commodityType: "forestry", triggersSps: false, triggersEudr: true, triggersLaceyAct: true, knownHazards: ["none_significant"] },

      // ── VEHICLES & MACHINERY (HS 84-87) ──
      { name: "Motor Vehicles (assembled)", hsCode: "8703.23", commodityType: "manufactured", triggersSps: false, knownHazards: ["none_significant"] },
      { name: "Auto Parts & Components", hsCode: "8708.29", commodityType: "manufactured", triggersSps: false, knownHazards: ["none_significant"] },
      { name: "Mining / Construction Equipment", hsCode: "8429.52", commodityType: "manufactured", triggersSps: false, knownHazards: ["none_significant"] },

      // ── CONSUMER PRODUCTS (HS 64, 69, 94) ──
      { name: "Footwear (leather)", hsCode: "6403.59", commodityType: "manufactured", triggersSps: false, knownHazards: ["chrome_VI"] },
      { name: "Ceramics (tableware)", hsCode: "6911.10", commodityType: "manufactured", triggersSps: false, knownHazards: ["lead"] },
      { name: "Furniture (non-wood)", hsCode: "9401.61", commodityType: "manufactured", triggersSps: false, knownHazards: ["formaldehyde"] },

      // ── BEVERAGES (HS 22) ──
      { name: "Wine", hsCode: "2204.21", commodityType: "agricultural", triggersSps: true, triggersFdaPriorNotice: true, knownHazards: ["sulphites"] },
      { name: "Spirits / Liquor", hsCode: "2208.40", commodityType: "agricultural", triggersSps: true, triggersFdaPriorNotice: true, knownHazards: ["methanol"] },
      { name: "Beer", hsCode: "2203.00", commodityType: "agricultural", triggersSps: true, triggersFdaPriorNotice: true, knownHazards: ["none_significant"] },

      // ── MEAT — with FSIS trigger for US (HS 02) ──
      { name: "Beef (frozen boneless)", hsCode: "0202.30", commodityType: "livestock", triggersSps: true, triggersFsis: true, triggersFdaPriorNotice: true, knownHazards: ["FMD", "BSE"] },
      { name: "Goat Meat (frozen)", hsCode: "0204.50", commodityType: "livestock", triggersSps: true, triggersFsis: true, triggersFdaPriorNotice: true, knownHazards: ["FMD"] },
      { name: "Poultry Meat (frozen)", hsCode: "0207.14", commodityType: "livestock", triggersSps: true, triggersFsis: true, triggersFdaPriorNotice: true, knownHazards: ["avian_influenza", "salmonella"] },
    ]);
    log("Inserted 37 new commodities (textiles, leather, chemicals, metals, petroleum, paper, vehicles, consumer, beverages, meat)", "seed");
  });

  // ── UPDATE EXISTING COMMODITY TRIGGERS FOR NEW FLAGS ──
  // Section 232 on existing steel/aluminum commodities
  await db.execute(sql`UPDATE commodities SET triggers_section_232 = true WHERE (hs_code LIKE '72%' OR hs_code LIKE '73%' OR hs_code LIKE '76%') AND triggers_section_232 = false`);
  log("Updated triggers_section_232 on existing steel/aluminum commodities", "seed");

  // FSIS on existing meat commodities (HS 02xx livestock type)
  await db.execute(sql`UPDATE commodities SET triggers_fsis = true WHERE hs_code LIKE '02%' AND commodity_type = 'livestock' AND triggers_fsis = false`);
  log("Updated triggers_fsis on existing meat commodities", "seed");

  log("Prompt 7 seed completed", "seed");
}

/* ═══════════════════════════════════════════════════════════════════
   COMPLIANCE RULES SEED — Extracts ~52 hardcoded compliance rules
   from server/compliance.ts buildRequirementsDetailed() into the
   compliance_rules table.
   ═══════════════════════════════════════════════════════════════════ */

export async function seedComplianceRules() {
  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(complianceRules);
  if (Number(existing.count) > 0) {
    log("Compliance rules already exist, upserting seed rules...", "seed");
  }

  const rules: Array<{
    ruleKey: string;
    destinationIso2?: string | null;
    triggerFlag?: string | null;
    hsCodePrefix?: string | null;
    commodityType?: string | null;
    transportMode?: string | null;
    minValue?: string | null;
    extraConditions?: Record<string, unknown> | null;
    titleTemplate: string;
    descriptionTemplate: string;
    issuedByTemplate: string;
    whenNeeded: string;
    tipTemplate: string;
    portalGuideTemplate?: string | null;
    documentCode?: string | null;
    isSupplierSide: boolean;
    owner: string;
    dueBy: string;
    regulationRef?: string | null;
    sortOrder: number;
    validationSpec?: Record<string, unknown> | null;
  }> = [
    // ── 1. Commercial Invoice (always required) ──
    {
      ruleKey: "always_commercial_invoice",
      titleTemplate: "Commercial Invoice with HS Code {{commodity.hsCode}} and declared FOB value",
      descriptionTemplate: "A standard commercial invoice detailing the goods, quantity, unit price, total value (FOB), currency, and buyer/seller details. Must reference the correct HS code for customs classification.",
      issuedByTemplate: "Exporter / Seller",
      whenNeeded: "Before shipment — required at time of customs declaration",
      tipTemplate: "Ensure the invoice value matches the contract price exactly. Under- or over-invoicing triggers customs audit flags.",
      portalGuideTemplate: "{{portalGuide.origin}}",
      documentCode: "N935",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 10,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["invoice", "facture", "factura"],
          rejectIfContainsAny: ["bill of lading", "packing list", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          { name: "beneficiaryName", description: "Seller/exporter name", required: true, severityIfMissing: "critical" },
          { name: "totalAmount", description: "Total invoice amount", required: true, severityIfMissing: "critical" },
          { name: "currency", description: "Currency code (USD, EUR, etc.)", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Quantity of goods", required: false, severityIfMissing: "warning" },
          { name: "hsCode", description: "HS/tariff code", required: false, severityIfMissing: "warning" },
          { name: "incoterms", description: "Incoterms (FOB, CIF, etc.)", required: false, severityIfMissing: "warning" },
          { name: "goodsDescription", description: "Description of goods", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
          { type: "numeric_positive", severity: "warning", message: "Invoice amounts must be positive values." },
        ],
        minimumAcceptable: { mustHave: ["beneficiaryName", "totalAmount"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 2. Packing List (always required) ──
    {
      ruleKey: "always_packing_list",
      titleTemplate: "Packing List with weights, marks, and lot numbers",
      descriptionTemplate: "Itemised list of all packages in the shipment showing contents, gross/net weight, package dimensions, marks, and lot/batch numbers for traceability.",
      issuedByTemplate: "Exporter / Seller",
      whenNeeded: "Before shipment — accompanies the commercial invoice",
      tipTemplate: "Include lot numbers that trace back to production batches for traceability compliance.",
      portalGuideTemplate: null,
      documentCode: "N271",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 11,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["packing list", "colisage", "liste de colisage"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "quantity", description: "Total quantity of items", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross weight with unit", required: false, severityIfMissing: "warning" },
          { name: "netWeight", description: "Net weight with unit", required: false, severityIfMissing: "warning" },
          { name: "numberOfPackages", description: "Number of packages/cartons", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "warning", message: "Weights and quantities must be positive." },
        ],
        minimumAcceptable: { mustHave: ["quantity"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 3. Bill of Lading (always required) ──
    {
      ruleKey: "always_bill_of_lading",
      titleTemplate: "Bill of Lading or Airway Bill",
      descriptionTemplate: "Transport document issued by the carrier confirming receipt of goods for shipment. Acts as a receipt, contract of carriage, and document of title.",
      issuedByTemplate: "Shipping Line / Airline / Freight Forwarder",
      whenNeeded: "At loading — original required for customs clearance at destination",
      tipTemplate: "Request 3 original B/Ls. Ensure consignee details match the importer's customs registration.",
      portalGuideTemplate: null,
      documentCode: "N714",
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 12,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["bill of lading", "B/L", "connaissement", "airway bill", "AWB"],
          rejectIfContainsAny: ["invoice", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "shipperName", description: "Shipper/exporter name", required: true, severityIfMissing: "critical" },
          { name: "consignee", description: "Consignee name", required: true, severityIfMissing: "critical" },
          { name: "portOfLoading", description: "Port of loading", required: false, severityIfMissing: "warning" },
          { name: "portOfDischarge", description: "Port of discharge", required: false, severityIfMissing: "warning" },
          { name: "shippedOnBoardDate", description: "Shipped on board date", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "critical", message: "Shipped on board date cannot be in the future." },
          { type: "origin_country_match", severity: "warning", message: "Port of loading does not match expected origin." },
        ],
        minimumAcceptable: { mustHave: ["shipperName", "consignee"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 4. Certificate of Origin (always required) ──
    {
      ruleKey: "always_certificate_of_origin",
      titleTemplate: "Certificate of Origin issued by {{origin.cooIssuingBody}} ({{origin.countryName}})",
      descriptionTemplate: "Official certificate confirming that goods originate from {{origin.countryName}}. Required for tariff preference eligibility and customs clearance at destination.",
      issuedByTemplate: "{{origin.cooIssuingBody}}",
      whenNeeded: "Before shipment — apply at least 5 working days before export",
      tipTemplate: "Some destinations require a specific form (EUR.1, Form A, or regional certificate). Check the destination's preference scheme requirements.",
      portalGuideTemplate: "{{portalGuide.origin}}",
      documentCode: "C644",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 13,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["certificate of origin", "certificat d'origine", "EUR.1", "Form A"],
          rejectIfContainsAny: ["invoice", "packing list", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "exporterName", description: "Exporter/seller name", required: true, severityIfMissing: "critical" },
          { name: "originCountry", description: "Country of origin", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "critical", message: "Origin country does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["exporterName", "originCountry"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 5. Phytosanitary / SPS Certificate (trigger: sps) ──
    {
      ruleKey: "sps_phyto_certificate",
      triggerFlag: "sps",
      titleTemplate: "Phytosanitary / SPS Certificate issued by {{origin.phytoAuthority}} ({{origin.countryName}})",
      descriptionTemplate: "Official certificate confirming that agricultural products have been inspected and are free from quarantine pests/diseases per International Plant Protection Convention (IPPC) standards.",
      issuedByTemplate: "{{origin.phytoAuthority}}",
      whenNeeded: "Before shipment — inspection must occur within 14 days of export",
      tipTemplate: "Schedule the phytosanitary inspection at least 3 days before the vessel cut-off. Some products need fumigation certificates in addition.",
      portalGuideTemplate: "{{portalGuide.origin}}",
      documentCode: "C085",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 20,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["phytosanitary", "plant health", "SPS", "certificat phytosanitaire", "IPPC"],
          rejectIfContainsAny: ["invoice", "packing list", "bill of lading"],
        },
        expectedFields: [
          { name: "exporterName", description: "Exporter/applicant name", required: true, severityIfMissing: "critical" },
          { name: "originCountry", description: "Country of origin", required: true, severityIfMissing: "critical" },
          { name: "issuingAuthority", description: "Issuing authority (NPPO)", required: true, severityIfMissing: "critical" },
          { name: "commodityDescription", description: "Commodity/product description", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "critical", message: "Origin country does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["exporterName", "issuingAuthority"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 6. SPS compliance at destination (trigger: sps) ──
    {
      ruleKey: "sps_destination_compliance",
      triggerFlag: "sps",
      titleTemplate: "SPS compliance per {{destination.spsRegime}} ({{destination.countryName}})",
      descriptionTemplate: "The importing country requires compliance with its SPS regime ({{destination.spsRegime}}). This may include specific maximum residue limits (MRLs), contaminant levels, and labelling requirements.",
      issuedByTemplate: "{{destination.countryName}} import authority",
      whenNeeded: "At import — goods are checked against SPS requirements upon arrival",
      tipTemplate: "Pre-check maximum residue limits for pesticides used in production. Non-compliant shipments face destruction or re-export at the importer's cost.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 21,
    },
    // ── 7. EU CHED-A (trigger: sps, dest: EU) ──
    {
      ruleKey: "eu_ched_a",
      destinationIso2: "EU",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [1] },
      titleTemplate: "CHED-A notification via TRACES NT required for EU import",
      descriptionTemplate: "Common Health Entry Document for Animals — live animal import notification via TRACES NT. Must be submitted via the EU TRACES NT system before goods arrive at the EU Border Control Post (BCP). The BCP inspectors verify the consignment against the CHED-A at the port of entry.",
      issuedByTemplate: "Importer / EU-based responsible operator via TRACES NT",
      whenNeeded: "Minimum 24 hours before arrival at BCP (Border Control Post)",
      tipTemplate: "This commodity requires a CHED-A form. Register in TRACES NT early — your Border Control Post must be pre-selected. Documentary, identity, and physical checks are risk-based under the EU Official Controls Regulation.",
      portalGuideTemplate: "Submit via TRACES NT — https://webgate.ec.europa.eu/tracesnt",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 40,
    },
    // ── 8. EU CHED-P (trigger: sps, dest: EU) ──
    {
      ruleKey: "eu_ched_p",
      destinationIso2: "EU",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [2, 3, 4, 5, 16, 41] },
      titleTemplate: "CHED-P notification via TRACES NT required for EU import",
      descriptionTemplate: "Common Health Entry Document for Products of animal origin — meat, fish, dairy, hides notification via TRACES NT. Must be submitted via the EU TRACES NT system before goods arrive at the EU Border Control Post (BCP). The BCP inspectors verify the consignment against the CHED-P at the port of entry.",
      issuedByTemplate: "Importer / EU-based responsible operator via TRACES NT",
      whenNeeded: "Minimum 24 hours before arrival at BCP (Border Control Post)",
      tipTemplate: "This commodity requires a CHED-P form. Register in TRACES NT early — your Border Control Post must be pre-selected. Documentary, identity, and physical checks are risk-based under the EU Official Controls Regulation.",
      portalGuideTemplate: "Submit via TRACES NT — https://webgate.ec.europa.eu/tracesnt",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 41,
    },
    // ── 9. EU CHED-PP (trigger: sps, dest: EU) ──
    {
      ruleKey: "eu_ched_pp",
      destinationIso2: "EU",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [6, 7, 8, 9, 10, 12, 13, 14, 44] },
      titleTemplate: "CHED-PP notification via TRACES NT required for EU import",
      descriptionTemplate: "Common Health Entry Document for Plants and plant products — phytosanitary notification via TRACES NT. Must be submitted via the EU TRACES NT system before goods arrive at the EU Border Control Post (BCP). The BCP inspectors verify the consignment against the CHED-PP at the port of entry.",
      issuedByTemplate: "Importer / EU-based responsible operator via TRACES NT",
      whenNeeded: "Minimum 24 hours before arrival at BCP (Border Control Post)",
      tipTemplate: "This commodity requires a CHED-PP form. Register in TRACES NT early — your Border Control Post must be pre-selected. Documentary, identity, and physical checks are risk-based under the EU Official Controls Regulation.",
      portalGuideTemplate: "Submit via TRACES NT — https://webgate.ec.europa.eu/tracesnt",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 42,
    },
    // ── 10. EU CHED-D (trigger: sps, dest: EU) ──
    {
      ruleKey: "eu_ched_d",
      destinationIso2: "EU",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [11, 15, 17, 18, 19, 20, 21, 22, 23] },
      titleTemplate: "CHED-D notification via TRACES NT required for EU import",
      descriptionTemplate: "Common Health Entry Document for Food/Feed of non-animal origin — processed food notification via TRACES NT. Must be submitted via the EU TRACES NT system before goods arrive at the EU Border Control Post (BCP). The BCP inspectors verify the consignment against the CHED-D at the port of entry.",
      issuedByTemplate: "Importer / EU-based responsible operator via TRACES NT",
      whenNeeded: "Minimum 24 hours before arrival at BCP (Border Control Post)",
      tipTemplate: "This commodity requires a CHED-D form. Register in TRACES NT early — your Border Control Post must be pre-selected. Documentary, identity, and physical checks are risk-based under the EU Official Controls Regulation.",
      portalGuideTemplate: "Submit via TRACES NT — https://webgate.ec.europa.eu/tracesnt",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 43,
    },
    // ── 11. UK IPAFFS — live animals (trigger: sps, dest: GB) ──
    {
      ruleKey: "gb_ipaffs_animals",
      destinationIso2: "GB",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [1] },
      titleTemplate: "IPAFFS notification for live animals required for UK import",
      descriptionTemplate: "UK equivalent of EU CHED-A. Submitted via the Import of Products, Animals, Food and Feed System (IPAFFS). Required for pre-notification to Port Health Authorities under the UK Border Target Operating Model (BTOM).",
      issuedByTemplate: "Importer / UK-based responsible person via IPAFFS",
      whenNeeded: "Before arrival — notification timeline varies by product category and risk level",
      tipTemplate: "Register in IPAFFS and ensure your Border Control Post is selected. The UK uses IPAFFS (not TRACES) for all SPS-controlled imports. Risk categorisation under BTOM determines inspection frequency.",
      portalGuideTemplate: "Submit via IPAFFS — https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 50,
    },
    // ── 12. UK IPAFFS — products of animal origin (trigger: sps, dest: GB) ──
    {
      ruleKey: "gb_ipaffs_poao",
      destinationIso2: "GB",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [2, 3, 4, 5, 16, 41] },
      titleTemplate: "IPAFFS notification for Products of Animal Origin (POAO) required for UK import",
      descriptionTemplate: "UK equivalent of EU CHED-P. Submitted via the Import of Products, Animals, Food and Feed System (IPAFFS). Required for pre-notification to Port Health Authorities under the UK Border Target Operating Model (BTOM).",
      issuedByTemplate: "Importer / UK-based responsible person via IPAFFS",
      whenNeeded: "Before arrival — notification timeline varies by product category and risk level",
      tipTemplate: "Register in IPAFFS and ensure your Border Control Post is selected. The UK uses IPAFFS (not TRACES) for all SPS-controlled imports. Risk categorisation under BTOM determines inspection frequency.",
      portalGuideTemplate: "Submit via IPAFFS — https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 51,
    },
    // ── 13. UK IPAFFS — plants (trigger: sps, dest: GB) ──
    {
      ruleKey: "gb_ipaffs_plants",
      destinationIso2: "GB",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [6, 7, 8, 9, 10, 12, 13, 14, 44] },
      titleTemplate: "IPAFFS notification for plants and plant products (phytosanitary) required for UK import",
      descriptionTemplate: "UK equivalent of EU CHED-PP. Submitted via the Import of Products, Animals, Food and Feed System (IPAFFS). Required for pre-notification to Port Health Authorities under the UK Border Target Operating Model (BTOM).",
      issuedByTemplate: "Importer / UK-based responsible person via IPAFFS",
      whenNeeded: "Before arrival — notification timeline varies by product category and risk level",
      tipTemplate: "Register in IPAFFS and ensure your Border Control Post is selected. The UK uses IPAFFS (not TRACES) for all SPS-controlled imports. Risk categorisation under BTOM determines inspection frequency.",
      portalGuideTemplate: "Submit via IPAFFS — https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 52,
    },
    // ── 14. UK IPAFFS — high-risk food/feed (trigger: sps, dest: GB) ──
    {
      ruleKey: "gb_ipaffs_hrfnao",
      destinationIso2: "GB",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [11, 15, 17, 18, 19, 20, 21, 22, 23] },
      titleTemplate: "IPAFFS notification for high-risk food/feed not of animal origin (HRFNAO) required for UK import",
      descriptionTemplate: "UK equivalent of EU CHED-D. Submitted via the Import of Products, Animals, Food and Feed System (IPAFFS). Required for pre-notification to Port Health Authorities under the UK Border Target Operating Model (BTOM).",
      issuedByTemplate: "Importer / UK-based responsible person via IPAFFS",
      whenNeeded: "Before arrival — notification timeline varies by product category and risk level",
      tipTemplate: "Register in IPAFFS and ensure your Border Control Post is selected. The UK uses IPAFFS (not TRACES) for all SPS-controlled imports. Risk categorisation under BTOM determines inspection frequency.",
      portalGuideTemplate: "Submit via IPAFFS — https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 53,
    },
    // ── 15. Swiss FSVO (trigger: sps, dest: CH) ──
    {
      ruleKey: "ch_fsvo_notification",
      destinationIso2: "CH",
      triggerFlag: "sps",
      titleTemplate: "FSVO/BLV import notification for food products entering Switzerland",
      descriptionTemplate: "Import notification to the Federal Food Safety and Veterinary Office (FSVO/BLV). Switzerland uses its own notification system — not IPAFFS or TRACES.",
      issuedByTemplate: "Importer or Swiss customs agent",
      whenNeeded: "Minimum 24 hours before arrival for food products",
      tipTemplate: "Register at blv.admin.ch. Process similar to IPAFFS but separate system. Switzerland is NOT in the EU TRACES system.",
      portalGuideTemplate: "Register and submit at FSVO — https://www.blv.admin.ch",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 60,
    },
    // ── 16. Swiss FPPS (trigger: sps, dest: CH) ──
    {
      ruleKey: "ch_fpps_phyto",
      destinationIso2: "CH",
      triggerFlag: "sps",
      titleTemplate: "Phytosanitary certificate processed by FPPS/OFAG (Swiss Federal Plant Protection Service)",
      descriptionTemplate: "For plant products entering Switzerland, phytosanitary clearance is handled by the Federal Plant Protection Service (FPPS/OFAG) — not via EU TRACES.",
      issuedByTemplate: "Swiss Federal Plant Protection Service (FPPS/OFAG)",
      whenNeeded: "Before goods arrive at Swiss border",
      tipTemplate: "Switzerland has its own phytosanitary authority separate from the EU. Ensure your documentation references FPPS/OFAG, not TRACES.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 61,
    },
    // ── 17. Swiss CITES (trigger: cites, dest: CH) ──
    {
      ruleKey: "ch_cites_foen",
      destinationIso2: "CH",
      triggerFlag: "cites",
      titleTemplate: "Swiss CITES permit from FOEN/BAFU (Federal Office for the Environment)",
      descriptionTemplate: "Switzerland issues its own CITES permits through FOEN/BAFU, parallel to the EU CITES system but administered separately.",
      issuedByTemplate: "FOEN/BAFU (Federal Office for the Environment)",
      whenNeeded: "Before import — permit must be obtained before goods arrive",
      tipTemplate: "Apply through FOEN/BAFU. Processing times may differ from EU CITES authorities.",
      portalGuideTemplate: "Submit via FOEN/BAFU — https://www.bafu.admin.ch",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 92,
    },
    // ── 18. EUDR due-diligence statement (dest: EU) ──
    {
      ruleKey: "eudr_due_diligence_eu",
      destinationIso2: "EU",
      triggerFlag: "eudr",
      titleTemplate: "EU Deforestation Regulation (EUDR) due-diligence statement with geolocation data for production plot(s)",
      descriptionTemplate: "Operators must submit a due-diligence statement demonstrating that commodities were not produced on land deforested after 31 December 2020. Requires GPS coordinates of all production plots.",
      issuedByTemplate: "Exporter / Operator (self-declared, verified by EU authorities)",
      whenNeeded: "Before placing goods on EU market — statement must be submitted via EUDR Information System before customs clearance",
      tipTemplate: "Collect GPS polygon data from farms/plantations at sourcing stage. A single missing plot can block the entire shipment.",
      portalGuideTemplate: "Submit via EU EUDR Information System — https://environment.ec.europa.eu/topics/forests/deforestation/regulation_en",
      documentCode: "C990",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 80,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["TRACES", "due diligence statement", "EUDR", "Regulation (EU) 2023/1115"],
          shouldContainAny: ["Annex II", "deforestation-free", "negligible risk", "geolocation"],
          rejectIfContainsAny: ["fumigation", "bill of lading", "commercial invoice", "packing list"],
        },
        expectedFields: [
          { name: "hs_code", description: "HS/CN code for relevant product(s)", required: true, severityIfMissing: "critical" },
          { name: "product_description", description: "Free-text product description incl. trade name", required: true, severityIfMissing: "critical" },
          { name: "scientific_name", description: "Scientific name where applicable", required: false, severityIfMissing: "warning" },
          { name: "quantity_net_mass_kg", description: "Quantity in kg net mass", required: true, severityIfMissing: "critical" },
          { name: "country_of_production", description: "Country of production for commodities/products", required: true, severityIfMissing: "critical" },
          { name: "geolocation_plots", description: "Geolocation for all production plots (point or polygon)", required: true, severityIfMissing: "critical" },
          { name: "supplier_identity", description: "Name + postal address + email of supplier(s)", required: true, severityIfMissing: "critical" },
          { name: "customer_identity", description: "Name + postal address + email of customer(s)", required: true, severityIfMissing: "critical" },
          { name: "deforestation_free_evidence", description: "Conclusive info products are deforestation-free", required: true, severityIfMissing: "critical" },
          { name: "legality_evidence", description: "Info commodities comply with country-of-production legislation", required: true, severityIfMissing: "critical" },
          { name: "operator_declaration", description: "Declaration due diligence exercised, no/negligible risk", required: true, severityIfMissing: "critical" },
          { name: "traces_reference_number", description: "TRACES NT reference number", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity/HS context." },
          { type: "quantity_is_numeric_and_kg", severity: "critical", message: "Quantity must include numeric value and unit kg (net mass)." },
          { type: "geolocation_has_points_or_polygons", severity: "critical", message: "Geolocation must be present for all plots." },
          { type: "emails_present_for_supplier_and_customer", severity: "critical", message: "Supplier/customer email(s) missing." },
          { type: "traces_reference_format", severity: "warning", message: "TRACES NT reference number format unclear — verify." },
        ],
        acceptedForms: ["pdf", "scan", "screenshot", "email", "portal_export"],
        minimumAcceptable: {
          mustHave: ["traces_reference_number", "operator_declaration"],
          ifMissing: "ISSUES_FOUND",
        },
        outputHints: {
          extractGeolocationAs: "geojson_or_latlon_list",
          maxEvidenceSnippets: 6,
        },
      },
    },
    // ── 19. EUDR due-diligence statement (dest: GB) ──
    {
      ruleKey: "eudr_due_diligence_gb",
      destinationIso2: "GB",
      triggerFlag: "eudr",
      titleTemplate: "EU Deforestation Regulation (EUDR) due-diligence statement with geolocation data for production plot(s)",
      descriptionTemplate: "Operators must submit a due-diligence statement demonstrating that commodities were not produced on land deforested after 31 December 2020. Requires GPS coordinates of all production plots.",
      issuedByTemplate: "Exporter / Operator (self-declared, verified by EU authorities)",
      whenNeeded: "Before placing goods on EU market — statement must be submitted via EUDR Information System before customs clearance",
      tipTemplate: "Collect GPS polygon data from farms/plantations at sourcing stage. A single missing plot can block the entire shipment.",
      portalGuideTemplate: "Submit via EU EUDR Information System — https://environment.ec.europa.eu/topics/forests/deforestation/regulation_en",
      documentCode: "C990",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 80,
    },
    // ── 20. EUDR operator registration (dest: EU) ──
    {
      ruleKey: "eudr_operator_registration_eu",
      destinationIso2: "EU",
      triggerFlag: "eudr",
      titleTemplate: "EUDR operator registration in EU Information System",
      descriptionTemplate: "All operators and traders placing EUDR-relevant commodities on the EU market must register in the EU EUDR Information System and obtain a reference number for each due-diligence statement.",
      issuedByTemplate: "EU Member State competent authority",
      whenNeeded: "Before first import — one-time registration, then per-shipment statements",
      tipTemplate: "Register early — the approval process can take several weeks. Each due-diligence statement gets a unique reference number that must appear on the customs declaration.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 81,
    },
    // ── 21. EUDR operator registration (dest: GB) ──
    {
      ruleKey: "eudr_operator_registration_gb",
      destinationIso2: "GB",
      triggerFlag: "eudr",
      titleTemplate: "EUDR operator registration in EU Information System",
      descriptionTemplate: "All operators and traders placing EUDR-relevant commodities on the EU market must register in the EU EUDR Information System and obtain a reference number for each due-diligence statement.",
      issuedByTemplate: "EU Member State competent authority",
      whenNeeded: "Before first import — one-time registration, then per-shipment statements",
      tipTemplate: "Register early — the approval process can take several weeks. Each due-diligence statement gets a unique reference number that must appear on the customs declaration.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 81,
    },
    // ── 22. EUDR Swiss Due Diligence Act (dest: CH) ──
    {
      ruleKey: "eudr_ch_due_diligence",
      destinationIso2: "CH",
      triggerFlag: "eudr",
      titleTemplate: "Swiss Due Diligence Act compliance statement (timber and minerals — EUDR-equivalent commodities pending)",
      descriptionTemplate: "Switzerland passed its own Due Diligence Act covering timber and minerals. Cocoa, coffee, and other EUDR commodities are expected to be added. Monitor FOEN/BAFU for updates on scope and timeline.",
      issuedByTemplate: "Importer / Operator (self-declared under Swiss Due Diligence Act)",
      whenNeeded: "Before import — prepare EUDR-equivalent documentation now as requirements will likely mirror the EU",
      tipTemplate: "Switzerland's Due Diligence Act currently covers timber and minerals. Monitor FOEN/BAFU (bafu.admin.ch) for confirmation of scope expansion to cocoa, coffee, and other EUDR commodities.",
      portalGuideTemplate: "Monitor FOEN/BAFU — https://www.bafu.admin.ch",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 82,
    },
    // ── 23. US ISF 10+2 (dest: US) ──
    {
      ruleKey: "us_isf_10_2",
      destinationIso2: "US",
      titleTemplate: "ISF 10+2 (Importer Security Filing) — filed 24 hours before vessel loading",
      descriptionTemplate: "US Customs and Border Protection (CBP) requires 10 data elements from the importer and 2 from the carrier, filed electronically via ACE at least 24 hours before vessel departure from the foreign port.",
      issuedByTemplate: "Importer / Licensed Customs Broker",
      whenNeeded: "24 hours before vessel loading at foreign port",
      tipTemplate: "Late or inaccurate ISF filing incurs a $5,000 penalty per violation. Ensure your broker files on time. Include accurate African supplier address.",
      portalGuideTemplate: "File via ACE (Automated Commercial Environment) — https://www.cbp.gov/trade/ace",
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 200,
    },
    // ── 24. US Customs Bond (dest: US) ──
    {
      ruleKey: "us_customs_bond",
      destinationIso2: "US",
      titleTemplate: "US Customs Bond — continuous or single-entry bond guaranteeing duty payment to CBP",
      descriptionTemplate: "A customs bond is required to guarantee payment of duties, taxes, and fees to CBP. Continuous bonds cover all imports for 12 months; single-entry bonds cover one shipment.",
      issuedByTemplate: "Surety company / Customs Broker",
      whenNeeded: "Pre-shipment — must be in place before goods arrive",
      tipTemplate: "Continuous bonds ($50k+) are more cost-effective for regular importers. Single-entry bonds are priced at 1-3x the duty amount.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 201,
    },
    // ── 25. US FDA Prior Notice (dest: US, trigger: fda_prior_notice) ──
    {
      ruleKey: "us_fda_prior_notice",
      destinationIso2: "US",
      triggerFlag: "fdaPriorNotice",
      titleTemplate: "FDA Prior Notice — food imports must be registered in FDA PNSI system (Bioterrorism Act)",
      descriptionTemplate: "All food and feed products entering the US require Prior Notice submitted to the FDA via the Prior Notice System Interface (PNSI). The foreign manufacturing/processing facility must also be registered in FDA FURLS.",
      issuedByTemplate: "Importer / FDA-registered agent",
      whenNeeded: "Before arrival — Water: 8 hours; Air: 4 hours; Truck: 2 hours pre-arrival",
      tipTemplate: "Register the foreign food facility first (FDA FURLS), then file Prior Notice (PNSI). Both are mandatory. FSVP documentation must name the African supplier.",
      portalGuideTemplate: "FDA Prior Notice System — https://www.fda.gov/food/prior-notice-imported-foods",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 210,
    },
    // ── 26. US FSVP (dest: US, trigger: fda_prior_notice) ──
    {
      ruleKey: "us_fsvp",
      destinationIso2: "US",
      triggerFlag: "fdaPriorNotice",
      titleTemplate: "FSVP (Foreign Supplier Verification Program) documentation for food safety compliance",
      descriptionTemplate: "Under FSMA, US importers must verify that foreign suppliers produce food meeting US safety standards. Requires hazard analysis, supplier evaluation, and corrective action procedures.",
      issuedByTemplate: "Importer (FSVP Importer of record)",
      whenNeeded: "Ongoing — documentation must be maintained and updated per supplier",
      tipTemplate: "FSVP enforcement is increasing. Maintain supplier audit records, hazard analyses, and corrective action plans. Name the specific African supplier in FSVP records.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 211,
    },
    // ── 27. US USDA APHIS (dest: US, trigger: fda_prior_notice + sps) ──
    {
      ruleKey: "us_usda_aphis",
      destinationIso2: "US",
      triggerFlag: "fdaPriorNotice",
      extraConditions: { second_trigger: "sps" },
      titleTemplate: "USDA APHIS phytosanitary clearance and import permit for plant-based products",
      descriptionTemplate: "USDA Animal and Plant Health Inspection Service (APHIS) requires phytosanitary clearance for plant and plant-based products. An import permit may be required depending on the commodity and origin.",
      issuedByTemplate: "USDA APHIS",
      whenNeeded: "Pre-arrival — import permit before shipment; inspection at port of entry",
      tipTemplate: "Check USDA PCIT (Phytosanitary Certificate Issuance and Tracking) for commodity-specific requirements from the origin country.",
      portalGuideTemplate: "USDA APHIS import requirements — https://www.aphis.usda.gov/plant-health/import-export",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 212,
    },
    // ── 28. US Lacey Act (dest: US, trigger: lacey_act) ──
    {
      ruleKey: "us_lacey_act",
      destinationIso2: "US",
      triggerFlag: "laceyAct",
      extraConditions: { commodity_types: ["forestry", "agricultural"] },
      titleTemplate: "Lacey Act Declaration — electronic plant/timber import declaration (PPQ 505 eliminated Jan 2026)",
      descriptionTemplate: "The Lacey Act requires an import declaration for plants and plant products identifying the scientific name (genus/species), value, quantity, and country of harvest. As of January 2026, paper PPQ 505 forms are eliminated — electronic filing only via ACE/LAWGS.",
      issuedByTemplate: "Importer",
      whenNeeded: "At or before entry — filed electronically with CBP entry",
      tipTemplate: "Ensure your supplier provides the species scientific name and country of harvest. Phase VII expanded the scope. Violations carry civil ($10k) and criminal ($250k + 5yrs) penalties.",
      portalGuideTemplate: "File via ACE/LAWGS electronic system",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 215,
    },
    // ── 29. US AGOA (dest: US, extraConditions: agoa_eligible) ──
    {
      ruleKey: "us_agoa_preference",
      destinationIso2: "US",
      extraConditions: { agoa_eligible: true },
      titleTemplate: "AGOA duty-free preference available — {{origin.countryName}} is AGOA-eligible",
      descriptionTemplate: "The African Growth and Opportunity Act (AGOA) provides duty-free access to the US market for over 1,800 products from 32 eligible Sub-Saharan African countries. Requires 35% value-add and proof of origin. Reauthorized to December 2026.",
      issuedByTemplate: "Importer — claim via HTSUS Chapter 9819",
      whenNeeded: "At entry — claim AGOA preference on customs declaration with Certificate of Origin",
      tipTemplate: "AGOA does NOT override reciprocal tariffs (currently {{origin.usTariffRate}} for {{origin.countryName}}). Verify the specific product is covered under AGOA tariff lines. AGOA expires Dec 2026 — monitor reauthorization status.",
      portalGuideTemplate: "AGOA information — https://agoa.info",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 220,
    },
    // ── 30. US OFAC (dest: US, extraConditions: origin_flagged) ──
    {
      ruleKey: "us_ofac_screening",
      destinationIso2: "US",
      extraConditions: { origin_flagged: true },
      titleTemplate: "OFAC sanctions screening REQUIRED — {{origin.countryName}} is flagged ({{origin.flagReason}})",
      descriptionTemplate: "The Office of Foreign Assets Control (OFAC) administers US economic and trade sanctions. {{origin.countryName}} is flagged: {{origin.flagDetails}}. All parties in the transaction must be screened against the SDN List.",
      issuedByTemplate: "Importer / Compliance team",
      whenNeeded: "Before any transaction — continuous screening required throughout the relationship",
      tipTemplate: "Screen ALL parties (supplier, banks, shipping agents, beneficial owners) against the SDN list and relevant country sanctions programs. Document all screening results. Civil penalty: $330k per violation.",
      portalGuideTemplate: "OFAC Sanctions Search — https://sanctionssearch.ofac.treas.gov",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 225,
    },
    // ── 31. US reciprocal tariff (dest: US) ──
    {
      ruleKey: "us_reciprocal_tariff",
      destinationIso2: "US",
      titleTemplate: "US reciprocal tariff of {{origin.usTariffRate}} applies to imports from {{origin.countryName}}",
      descriptionTemplate: "The US applies country-specific reciprocal tariff rates on imports from African countries under Section 122 of the Trade Act. The rate for {{origin.countryName}} is {{origin.usTariffRate}}, applied in addition to MFN duty rates. Note: IEEPA authority struck down by SCOTUS Feb 2026; Sec 122 rates currently in effect.",
      issuedByTemplate: "US CBP — calculated on Entry Summary (Form 7501)",
      whenNeeded: "At import — duty calculated and payable on customs entry",
      tipTemplate: "Check the HTS for product-specific MFN duty rates. AGOA-eligible products may qualify for duty-free treatment, but reciprocal tariffs still apply separately. Rates may change — monitor CBP updates.",
      portalGuideTemplate: "US HTS search — https://hts.usitc.gov",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 230,
    },
    // ── 32. US audit trail (dest: US) ──
    {
      ruleKey: "us_audit_trail",
      destinationIso2: "US",
      titleTemplate: "Maintain hashed audit trail for CBP 'Reasonable Care' standard (retain 5 years)",
      descriptionTemplate: "US importers must demonstrate 'Reasonable Care' in their import activity. TapTrao generates SHA-256 hashed compliance records that serve as immutable proof of due diligence at time of import.",
      issuedByTemplate: "Importer (internal compliance / TapTrao TwinLog Trail)",
      whenNeeded: "Post-clearance — retain all records for minimum 5 years per 19 USC 1508",
      tipTemplate: "Download the TwinLog Trail PDF for each shipment as your audit-ready compliance record. The integrity hash proves the record hasn't been altered.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 240,
    },
    // ── 33. US HTSUS classification (dest: US) ──
    {
      ruleKey: "us_htsus_classification",
      destinationIso2: "US",
      titleTemplate: "HTSUS classification for HS {{commodity.hsCode}} — verify US-specific tariff treatment before contract",
      descriptionTemplate: "The US Harmonized Tariff Schedule (HTSUS) may classify products differently than the international HS system at the 6+ digit level. Correct classification determines duty rates, PGA triggers, and quota eligibility.",
      issuedByTemplate: "Customs Broker / Importer",
      whenNeeded: "Pre-contract — classification should be confirmed before quoting landed cost",
      tipTemplate: "Use the USITC HTS search tool (hts.usitc.gov) to verify the correct 10-digit HTSUS code. Consider requesting a binding ruling from CBP for complex classifications.",
      portalGuideTemplate: "USITC HTS Online — https://hts.usitc.gov",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 241,
    },
    // ── 34. US Section 232 (dest: US, trigger: section_232) ──
    {
      ruleKey: "us_section_232",
      destinationIso2: "US",
      triggerFlag: "section232",
      titleTemplate: "US Section 232 tariff applies — 25% on steel, 10% on aluminium (national security tariff)",
      descriptionTemplate: "Under Section 232 of the Trade Expansion Act of 1962, the US imposes additional tariffs on steel (25%) and aluminium (10%) imports from most countries. This is in addition to MFN duty rates and any reciprocal tariffs.",
      issuedByTemplate: "US CBP — calculated on Entry Summary (Form 7501)",
      whenNeeded: "At import — tariff applied automatically on customs entry",
      tipTemplate: "Section 232 tariffs stack on top of MFN duty and reciprocal tariffs. Verify whether any product-specific exclusion applies via the Section 232 Exclusion Portal. Some African countries may negotiate quota-based exemptions.",
      portalGuideTemplate: "Section 232 Exclusion Portal — https://232app.azurewebsites.net",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 250,
    },
    // ── 35. US FSIS (dest: US, trigger: fsis) ──
    {
      ruleKey: "us_fsis",
      destinationIso2: "US",
      triggerFlag: "fsis",
      titleTemplate: "USDA FSIS inspection required — meat, poultry, and egg products must be from an approved country and establishment",
      descriptionTemplate: "The USDA Food Safety and Inspection Service (FSIS) regulates imported meat, poultry, and processed egg products. The exporting country must have an equivalent inspection system approved by FSIS, and the specific slaughter/processing establishment must be listed.",
      issuedByTemplate: "USDA FSIS",
      whenNeeded: "Pre-shipment — country equivalence and establishment approval must be in place; re-inspection at US port of entry",
      tipTemplate: "Very few African countries currently have FSIS equivalence approval for meat exports to the US. Namibia and Botswana (beef) and South Africa (ostrich) have some approved establishments. Check the FSIS eligible countries list before committing to the trade.",
      portalGuideTemplate: "FSIS Import Library — https://www.fsis.usda.gov/inspection/import-export",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 260,
    },
    // ── 36. Kimberley Process (trigger: kimberley, commodityType: mineral) ──
    {
      ruleKey: "kimberley_process_certificate",
      triggerFlag: "kimberley",
      commodityType: "mineral",
      titleTemplate: "Kimberley Process Certificate (KPC) — rough diamond shipment must be sealed and accompanied by a valid KPC",
      descriptionTemplate: "An internationally recognised certificate confirming the rough diamonds are conflict-free. The shipment must be in a tamper-proof container with a unique KPC number matching the certificate.",
      issuedByTemplate: "{{origin.countryName}} Kimberley Process Authority",
      whenNeeded: "Before export — certificate must accompany the sealed shipment",
      tipTemplate: "Each KPC has a unique serial number. The importing country's KP authority will verify the seal and certificate number. Broken seals invalidate the shipment.",
      portalGuideTemplate: null,
      documentCode: "N853",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 100,
    },
    // ── 37. Conflict Minerals report (trigger: conflict, commodityType: mineral) ──
    {
      ruleKey: "conflict_minerals_report",
      triggerFlag: "conflict",
      commodityType: "mineral",
      titleTemplate: "Conflict Minerals due-diligence report per EU Regulation 2017/821 or US Dodd-Frank Section 1502",
      descriptionTemplate: "A supply chain due-diligence report demonstrating that tin, tantalum, tungsten, or gold (3TG) were not sourced from conflict-affected or high-risk areas, following OECD Due Diligence Guidance.",
      issuedByTemplate: "Exporter / Smelter (audited by independent third party)",
      whenNeeded: "Annually — report must be current at time of import",
      tipTemplate: "Use an RMI-conformant smelter list (Responsible Minerals Initiative). Importers increasingly require CMRT (Conflict Minerals Reporting Template) from suppliers.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 102,
    },
    // ── 38. Supply chain mapping (trigger: conflict, commodityType: mineral) ──
    {
      ruleKey: "conflict_minerals_supply_chain_mapping",
      triggerFlag: "conflict",
      commodityType: "mineral",
      titleTemplate: "Supply chain mapping to smelter/refiner level (OECD Due Diligence Guidance)",
      descriptionTemplate: "A documented chain-of-custody from mine to export point identifying all smelters/refiners in the supply chain per the OECD 5-step framework.",
      issuedByTemplate: "Exporter (self-declared with audit trail)",
      whenNeeded: "Before first shipment — updated annually or when supply chain changes",
      tipTemplate: "Maintain a digital record of each supply chain actor with business licences and mineral origin certificates.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 103,
    },
    // ── 39. CBAM emissions declaration EU (trigger: cbam, dest: EU) ──
    {
      ruleKey: "cbam_emissions_eu",
      destinationIso2: "EU",
      triggerFlag: "cbam",
      titleTemplate: "EU Carbon Border Adjustment Mechanism (CBAM) embedded-emissions declaration",
      descriptionTemplate: "Declaration of the embedded greenhouse gas emissions in the imported goods, covering direct emissions from production and indirect emissions from electricity used.",
      issuedByTemplate: "Producer / Exporter (verified by accredited verifier)",
      whenNeeded: "Quarterly reporting during transitional period; per-shipment from 2026",
      tipTemplate: "Start collecting emissions data from production facilities now. Use the EU's default values only as a fallback — actual values usually result in lower CBAM costs.",
      portalGuideTemplate: "Submit via CBAM Transitional Registry — https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 110,
    },
    // ── 40. CBAM emissions declaration GB (trigger: cbam, dest: GB) ──
    {
      ruleKey: "cbam_emissions_gb",
      destinationIso2: "GB",
      triggerFlag: "cbam",
      titleTemplate: "EU Carbon Border Adjustment Mechanism (CBAM) embedded-emissions declaration",
      descriptionTemplate: "Declaration of the embedded greenhouse gas emissions in the imported goods, covering direct emissions from production and indirect emissions from electricity used.",
      issuedByTemplate: "Producer / Exporter (verified by accredited verifier)",
      whenNeeded: "Quarterly reporting during transitional period; per-shipment from 2026",
      tipTemplate: "Start collecting emissions data from production facilities now. Use the EU's default values only as a fallback — actual values usually result in lower CBAM costs.",
      portalGuideTemplate: "Submit via CBAM Transitional Registry — https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en",
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 111,
    },
    // ── 41. CBAM certificate purchase EU (trigger: cbam, dest: EU) ──
    {
      ruleKey: "cbam_certificate_eu",
      destinationIso2: "EU",
      triggerFlag: "cbam",
      titleTemplate: "CBAM certificate purchase or reporting via CBAM Transitional Registry",
      descriptionTemplate: "EU importers must purchase CBAM certificates corresponding to the embedded emissions. During the transitional period (2023-2025), only reporting is required.",
      issuedByTemplate: "EU CBAM Authority / National competent authority",
      whenNeeded: "Before import clearance (post-2025) — quarterly during transition",
      tipTemplate: "CBAM certificate prices track the EU ETS carbon price. Budget for price fluctuations.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 112,
    },
    // ── 42. CBAM certificate purchase GB (trigger: cbam, dest: GB) ──
    {
      ruleKey: "cbam_certificate_gb",
      destinationIso2: "GB",
      triggerFlag: "cbam",
      titleTemplate: "CBAM certificate purchase or reporting via CBAM Transitional Registry",
      descriptionTemplate: "EU importers must purchase CBAM certificates corresponding to the embedded emissions. During the transitional period (2023-2025), only reporting is required.",
      issuedByTemplate: "EU CBAM Authority / National competent authority",
      whenNeeded: "Before import clearance (post-2025) — quarterly during transition",
      tipTemplate: "CBAM certificate prices track the EU ETS carbon price. Budget for price fluctuations.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 113,
    },
    // ── 43. CSDDD EU (trigger: csddd, dest: EU) ──
    {
      ruleKey: "csddd_eu",
      destinationIso2: "EU",
      triggerFlag: "csddd",
      titleTemplate: "Corporate Sustainability Due Diligence Directive (CSDDD) human-rights & environmental risk assessment",
      descriptionTemplate: "Companies must identify, prevent, mitigate, and account for adverse human rights and environmental impacts in their value chains, including supply chains in third countries.",
      issuedByTemplate: "Importing company (self-assessed, subject to regulatory oversight)",
      whenNeeded: "Ongoing — annual reporting with continuous monitoring of supply chain",
      tipTemplate: "Map your supply chain to identify high-risk areas. Engage with local suppliers on corrective action plans before regulators request evidence.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 120,
    },
    // ── 44. CSDDD GB (trigger: csddd, dest: GB) ──
    {
      ruleKey: "csddd_gb",
      destinationIso2: "GB",
      triggerFlag: "csddd",
      titleTemplate: "Corporate Sustainability Due Diligence Directive (CSDDD) human-rights & environmental risk assessment",
      descriptionTemplate: "Companies must identify, prevent, mitigate, and account for adverse human rights and environmental impacts in their value chains, including supply chains in third countries.",
      issuedByTemplate: "Importing company (self-assessed, subject to regulatory oversight)",
      whenNeeded: "Ongoing — annual reporting with continuous monitoring of supply chain",
      tipTemplate: "Map your supply chain to identify high-risk areas. Engage with local suppliers on corrective action plans before regulators request evidence.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 121,
    },
    // ── 45. REACH ECHA EU (trigger: reach, dest: EU) ──
    {
      ruleKey: "reach_echa_eu",
      destinationIso2: "EU",
      triggerFlag: "reach",
      titleTemplate: "EU REACH Regulation (EC 1907/2006) — substance registration and authorisation with ECHA",
      descriptionTemplate: "Chemical substances imported into the EU/EEA above 1 tonne/year must be registered with the European Chemicals Agency (ECHA). The importer is the REACH registrant and must hold a registration number before placing goods on the market. Products containing Substances of Very High Concern (SVHCs) above 0.1% w/w require notification.",
      issuedByTemplate: "European Chemicals Agency (ECHA) / Importer as registrant",
      whenNeeded: "Before import — registration must be in place before placing substance on the EU market",
      tipTemplate: "REACH registration can take 6-18 months and costs EUR 1,600-31,000+ depending on tonnage band. Consider appointing an Only Representative (OR) in the EU to register on behalf of the African exporter. Safety Data Sheet (SDS) must accompany all chemical shipments.",
      portalGuideTemplate: "ECHA REACH — https://echa.europa.eu/regulations/reach",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 130,
    },
    // ── 46. REACH ECHA GB (trigger: reach, dest: GB) ──
    {
      ruleKey: "reach_echa_gb",
      destinationIso2: "GB",
      triggerFlag: "reach",
      titleTemplate: "EU REACH Regulation (EC 1907/2006) — substance registration and authorisation with ECHA",
      descriptionTemplate: "Chemical substances imported into the EU/EEA above 1 tonne/year must be registered with the European Chemicals Agency (ECHA). The importer is the REACH registrant and must hold a registration number before placing goods on the market. Products containing Substances of Very High Concern (SVHCs) above 0.1% w/w require notification.",
      issuedByTemplate: "European Chemicals Agency (ECHA) / Importer as registrant",
      whenNeeded: "Before import — registration must be in place before placing substance on the EU market",
      tipTemplate: "REACH registration can take 6-18 months and costs EUR 1,600-31,000+ depending on tonnage band. Consider appointing an Only Representative (OR) in the EU to register on behalf of the African exporter. Safety Data Sheet (SDS) must accompany all chemical shipments.",
      portalGuideTemplate: "ECHA REACH — https://echa.europa.eu/regulations/reach",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 131,
    },
    // ── 47. REACH ChemO CH (trigger: reach, dest: CH) ──
    {
      ruleKey: "reach_chemo_ch",
      destinationIso2: "CH",
      triggerFlag: "reach",
      titleTemplate: "Swiss ChemO (Chemicals Ordinance) — substance notification for chemical imports into Switzerland",
      descriptionTemplate: "Switzerland administers its own chemical regulation parallel to EU REACH via the Chemicals Ordinance (ChemO/ChemV). Importers must notify the Swiss Federal Office of Public Health (FOPH/BAG) for new substances not yet in the Swiss inventory.",
      issuedByTemplate: "Swiss FOPH/BAG / Importer",
      whenNeeded: "Before import — notification required for new substances. Safety Data Sheet always required.",
      tipTemplate: "Switzerland has mutual recognition agreements with the EU for many standards, but EU REACH registration does NOT automatically transfer to Switzerland. Verify Swiss-specific requirements with FOPH/BAG.",
      portalGuideTemplate: "Swiss FOPH/BAG Chemicals — https://www.bag.admin.ch/bag/en/home/gesund-leben/umwelt-und-gesundheit/chemikalien.html",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 132,
    },
    // ── 48. CA ACI eManifest (dest: CA) ──
    {
      ruleKey: "ca_aci_emanifest",
      destinationIso2: "CA",
      titleTemplate: "ACI eManifest (Advance Commercial Information) — pre-arrival cargo data filed to CBSA",
      descriptionTemplate: "Canada Border Services Agency (CBSA) requires electronic advance cargo information before goods arrive. Carriers and freight forwarders must transmit cargo, conveyance, and crew data electronically before arrival.",
      issuedByTemplate: "Carrier / Freight Forwarder",
      whenNeeded: "Ocean: 24 hours before loading at foreign port. Air: varies by routing (4 hours for short-haul, pre-departure for long-haul)",
      tipTemplate: "ACI eManifest is Canada's equivalent of the US ISF 10+2. Ensure your freight forwarder files accurately — non-compliance results in CBSA do-not-load directives and penalties.",
      portalGuideTemplate: "CBSA eManifest — https://www.cbsa-asfc.gc.ca/prog/manif/menu-eng.html",
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 300,
    },
    // ── 49. CA CFIA (dest: CA, trigger: sps) ──
    {
      ruleKey: "ca_cfia_import",
      destinationIso2: "CA",
      triggerFlag: "sps",
      titleTemplate: "Canadian Food Inspection Agency (CFIA) import requirements — licence and inspection",
      descriptionTemplate: "CFIA regulates the import of food, plants, animals, and related products into Canada. A Safe Food for Canadians (SFC) licence is required for most food imports. All imports must comply with the Safe Food for Canadians Regulations (SFCR). Check CFIA's Automated Import Reference System (AIRS) for commodity-specific requirements.",
      issuedByTemplate: "CFIA (Canadian Food Inspection Agency)",
      whenNeeded: "Before import — SFC licence must be in place; inspection at port of entry. Phytosanitary certificate from origin required.",
      tipTemplate: "Register in the CFIA My CFIA portal first. Use the Automated Import Reference System (AIRS) to check specific commodity requirements — including whether an import permit is needed.",
      portalGuideTemplate: "CFIA AIRS — https://airs-sari.inspection.gc.ca/",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 310,
    },
    // ── 50. CA Bill S-211 (dest: CA) ──
    {
      ruleKey: "ca_bill_s211",
      destinationIso2: "CA",
      titleTemplate: "Canada Fighting Against Forced Labour and Child Labour in Supply Chains Act (Bill S-211) — reporting obligation",
      descriptionTemplate: "Canadian entities that import goods and meet the threshold (CA$20M+ revenue or CA$10M+ assets or 250+ employees) must file annual reports on steps taken to prevent forced and child labour in their supply chains. Applies to goods imported into Canada from all origins.",
      issuedByTemplate: "Importing entity (annual report filed to Public Safety Canada)",
      whenNeeded: "Annual report due May 31 each year covering the prior fiscal year",
      tipTemplate: "Even if below the reporting threshold, major Canadian buyers increasingly require supply chain transparency documentation. Maintain supplier audit records and due diligence evidence for African supply chains.",
      portalGuideTemplate: "Public Safety Canada — https://www.publicsafety.gc.ca/cnt/cntrng-crm/frcd-lbr-en.aspx",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 320,
    },
    // ── 51. CA CBSA CARM (dest: CA) ──
    {
      ruleKey: "ca_cbsa_carm",
      destinationIso2: "CA",
      titleTemplate: "CBSA customs declaration via CARM (Canada Assessment and Revenue Management) Client Portal",
      descriptionTemplate: "Since October 2024, all commercial accounting declarations must be filed through the CARM Client Portal. This replaces the legacy ACROSS/B3 paper process. Customs brokers file on behalf of importers.",
      issuedByTemplate: "Customs Broker / Importer via CARM Client Portal",
      whenNeeded: "At import — accounting data due within 5 business days of release from CBSA",
      tipTemplate: "Register in the CARM Client Portal. Ensure correct tariff classification per the Canadian Customs Tariff. Importers can check GPT (General Preferential Tariff) or LDCT (Least Developed Country Tariff) eligibility for reduced duty on African goods.",
      portalGuideTemplate: "CARM Client Portal — https://carm-acram.cbsa-asfc.gc.ca",
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 330,
    },
    // ── 52. TR Halal (dest: TR, trigger: sps) ──
    {
      ruleKey: "tr_halal_certification",
      destinationIso2: "TR",
      triggerFlag: "sps",
      extraConditions: { commodity_types: ["agricultural", "livestock", "seafood"] },
      titleTemplate: "Halal certification may be required for food products imported into Turkey",
      descriptionTemplate: "Turkey's Ministry of Agriculture and Forestry may require halal certification for certain food products, particularly meat, poultry, and processed food. While not universally mandated at customs, major Turkish buyers, retailers, and food service operators typically require it as a commercial prerequisite.",
      issuedByTemplate: "Accredited halal certification body in origin country (recognised by Turkish authorities / Diyanet)",
      whenNeeded: "Before shipment — certificate must accompany the goods",
      tipTemplate: "Use a halal certification body accredited by the Turkish Standards Institute (TSE) or recognised by Turkey's Diyanet (Presidency of Religious Affairs). Common African certifiers include national Islamic councils and SANHA (South Africa).",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 350,
    },
    // ── 53. TR TSE conformity (dest: TR) ──
    {
      ruleKey: "tr_tse_conformity",
      destinationIso2: "TR",
      extraConditions: { commodity_types: ["manufactured", "mineral"] },
      titleTemplate: "TSE (Turkish Standards Institute) conformity assessment may be required for industrial products",
      descriptionTemplate: "Industrial products imported into Turkey may require conformity assessment by TSE or a TSE-recognised body. Turkey's technical regulations often align with EU CE marking requirements but are administered separately through the TSE 'G' mark system.",
      issuedByTemplate: "TSE (Türk Standardları Enstitüsü) or recognised conformity assessment body",
      whenNeeded: "Before import — certificate of conformity must be available for customs clearance",
      tipTemplate: "Check whether the specific product falls under Turkey's mandatory conformity assessment regime via the TAREKS (Risk-Based Trade Control) system. Many products accept EU CE marking, but some require separate TSE approval.",
      portalGuideTemplate: "TSE — https://www.tse.org.tr",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 360,
    },
    // ── 54. TR Borsa Istanbul gold (dest: TR) ──
    {
      ruleKey: "tr_borsa_istanbul_gold",
      destinationIso2: "TR",
      extraConditions: { commodity_name_contains: "gold" },
      titleTemplate: "Borsa Istanbul (BIST) membership required for gold imports into Turkey",
      descriptionTemplate: "Gold imports into Turkey must be conducted through Borsa Istanbul (formerly Istanbul Gold Exchange). Only authorised member banks and precious metals companies can import gold. Non-members cannot clear gold through Turkish customs.",
      issuedByTemplate: "Borsa Istanbul / CMB (Capital Markets Board of Turkey)",
      whenNeeded: "Before import — BIST membership/authorisation must be in place prior to shipment",
      tipTemplate: "This is a significant market access barrier. Only banks and authorised precious metals companies with BIST membership can import gold into Turkey. Arrange the buyer relationship accordingly and verify their BIST membership status.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 370,
    },
    // ── 55. AE ESMA conformity (dest: AE) ──
    {
      ruleKey: "ae_esma_conformity",
      destinationIso2: "AE",
      extraConditions: { commodity_types: ["manufactured", "mineral"] },
      titleTemplate: "ESMA / GSO conformity certificate required for industrial products imported into UAE",
      descriptionTemplate: "The Emirates Authority for Standardization and Metrology (ESMA) requires conformity assessment for regulated products. UAE technical regulations align with Gulf Cooperation Council (GCC) standards set by GSO (Gulf Standardization Organization).",
      issuedByTemplate: "ESMA-accredited conformity assessment body / GSO",
      whenNeeded: "Before import — certificate of conformity must accompany the goods for customs clearance",
      tipTemplate: "Check the ECAS (Emirates Conformity Assessment Scheme) product list to determine if your product requires mandatory conformity assessment. Many industrial products (electrical, building materials, chemicals) fall under ECAS.",
      portalGuideTemplate: "ESMA — https://www.esma.gov.ae",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 380,
    },
    // ── 56. AE Halal certification (dest: AE, trigger: sps) ──
    {
      ruleKey: "ae_halal_certification",
      destinationIso2: "AE",
      triggerFlag: "sps",
      extraConditions: { commodity_types: ["agricultural", "livestock", "seafood"] },
      titleTemplate: "Halal certification required for food products imported into UAE",
      descriptionTemplate: "UAE requires halal certification for all food, meat, and cosmetic products. The certificate must be issued by a certification body accredited by the Emirates International Accreditation Centre (EIAC) or recognised by UAE authorities.",
      issuedByTemplate: "EIAC-accredited halal certification body in origin country",
      whenNeeded: "Before shipment — certificate must accompany the goods and be presented at customs",
      tipTemplate: "Ensure the halal certification body is accredited by EIAC (Emirates International Accreditation Centre). UAE enforces halal requirements strictly — non-compliant shipments will be rejected at port. Meat products require additional slaughter-method documentation.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 381,
    },
    // ── 57. AE MOCCAE import permit (dest: AE, trigger: sps) ──
    {
      ruleKey: "ae_moccae_import_permit",
      destinationIso2: "AE",
      triggerFlag: "sps",
      extraConditions: { commodity_types: ["agricultural", "forestry"] },
      titleTemplate: "MOCCAE import permit required for agricultural and plant products entering UAE",
      descriptionTemplate: "The Ministry of Climate Change and Environment (MOCCAE) requires an import permit for agricultural products, plants, and animal products. The permit ensures compliance with UAE phytosanitary and food safety standards.",
      issuedByTemplate: "MOCCAE (Ministry of Climate Change and Environment)",
      whenNeeded: "Before shipment — permit must be obtained prior to loading; inspection at UAE port of entry",
      tipTemplate: "Apply for the MOCCAE import permit via the ministry's online portal. Agricultural products are subject to inspection at the port of entry. Ensure phytosanitary certificates from the origin country are current.",
      portalGuideTemplate: "MOCCAE — https://www.moccae.gov.ae",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 382,
    },
    // ── 58. AE ECAS marking (dest: AE) ──
    {
      ruleKey: "ae_ecas_marking",
      destinationIso2: "AE",
      extraConditions: { commodity_types: ["manufactured"] },
      titleTemplate: "ECAS (Emirates Conformity Assessment Scheme) marking required for regulated consumer products",
      descriptionTemplate: "The Emirates Conformity Assessment Scheme (ECAS) requires certain consumer products to carry the ECAS quality mark before being sold in the UAE market. Products include toys, low-voltage electrical equipment, building materials, and personal protective equipment.",
      issuedByTemplate: "ESMA / ECAS-designated conformity assessment body",
      whenNeeded: "Before import — ECAS certificate and product marking must be in place prior to shipment",
      tipTemplate: "ECAS operates under a product registration system. Register the product on the ECAS portal, obtain testing from an accredited laboratory, and affix the ECAS mark to the product before shipping.",
      portalGuideTemplate: "ECAS portal — https://ecas.esma.gov.ae",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 383,
    },
    // ── 59. AE Dubai Trade declaration (dest: AE) ──
    {
      ruleKey: "ae_dubai_trade_declaration",
      destinationIso2: "AE",
      titleTemplate: "Dubai Trade portal electronic import declaration via Mirsal 2 customs system",
      descriptionTemplate: "All imports into UAE (via Dubai) must be declared electronically through the Dubai Trade portal using the Mirsal 2 customs management system. The declaration covers customs duties (5% standard GCC CET), cargo manifests, and regulatory clearances.",
      issuedByTemplate: "Importer / Licensed customs broker via Dubai Trade portal",
      whenNeeded: "Before arrival — electronic declaration filed prior to vessel arrival at UAE port",
      tipTemplate: "Register on Dubai Trade (www.dubaitrade.ae) for electronic customs processing. Abu Dhabi uses the TAMM system instead. Ensure the correct GCC CET tariff code is used — standard rate is 5% on most goods.",
      portalGuideTemplate: "Dubai Trade — https://www.dubaitrade.ae",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 384,
    },
    // ── 60. IUU catch certificate (trigger: iuu) ──
    {
      ruleKey: "iuu_catch_certificate",
      triggerFlag: "iuu",
      titleTemplate: "IUU Fishing catch certificate validated by flag-state authority",
      descriptionTemplate: "A catch certificate validated by the flag-state authority of the fishing vessel confirming the fish were legally caught in compliance with applicable fisheries management measures.",
      issuedByTemplate: "Flag-state fisheries authority / {{origin.countryName}} fisheries ministry",
      whenNeeded: "Before export — must be validated before shipment leaves origin port",
      tipTemplate: "EU requires advance notification (3-4 working days) via the IUU catch certificate system. Ensure the vessel's IMO number is correctly recorded.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: "N853",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 140,
    },
    // ── 56. IUU processing statement (trigger: iuu) ──
    {
      ruleKey: "iuu_processing_statement",
      triggerFlag: "iuu",
      titleTemplate: "Processing statement (if re-exported or processed before shipment)",
      descriptionTemplate: "If caught fish have been processed (filleted, frozen, canned) before export, a processing statement must accompany the catch certificate linking processed products to the original catch.",
      issuedByTemplate: "Processing facility / Exporter",
      whenNeeded: "Before export — required alongside catch certificate for processed products",
      tipTemplate: "The processing statement must reference the original catch certificate number. Maintain batch-level traceability.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 141,
    },
    // ── 57. CITES export permit (trigger: cites) ──
    {
      ruleKey: "cites_export_permit",
      triggerFlag: "cites",
      titleTemplate: "CITES export permit from {{origin.countryName}} CITES Management Authority",
      descriptionTemplate: "An export permit issued under the Convention on International Trade in Endangered Species (CITES). Required for species listed in CITES Appendices I, II, or III.",
      issuedByTemplate: "{{origin.countryName}} CITES Management Authority",
      whenNeeded: "Before export — permit must be obtained before the shipment date",
      tipTemplate: "CITES permits are species-specific and may have quotas. Apply well in advance as scientific review is required.",
      portalGuideTemplate: "{{portalGuide.origin}}",
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 90,
    },
    // ── 58. CITES import permit (trigger: cites) ──
    {
      ruleKey: "cites_import_permit",
      triggerFlag: "cites",
      titleTemplate: "CITES import permit from {{destination.countryName}} (if Appendix I species)",
      descriptionTemplate: "For CITES Appendix I species, the importing country must issue an import permit before the exporting country can issue the export permit.",
      issuedByTemplate: "{{destination.countryName}} CITES Management Authority",
      whenNeeded: "Before export permit is issued — import permit must be obtained first",
      tipTemplate: "Appendix I species require both export and import permits. Appendix II species only require an export permit. Check the species listing carefully.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 91,
    },
    // ── 59. Security filing generic (exclude US, CA) ──
    {
      ruleKey: "generic_security_filing",
      extraConditions: { exclude_destinations: ["US", "CA"] },
      titleTemplate: "{{destination.securityFiling}} pre-arrival security filing for {{destination.countryName}}",
      descriptionTemplate: "Pre-arrival security declaration required by {{destination.countryName}} customs. Includes cargo details, shipper/consignee information, and container/seal numbers.",
      issuedByTemplate: "Customs Broker / Freight Forwarder",
      whenNeeded: "Before vessel departure — typically 24-48 hours before loading",
      tipTemplate: "File early to avoid port delays. Incorrect data (especially container or seal numbers) can result of inspection holds.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 400,
    },
    // ── 60. Customs import declaration generic (exclude US, CA) ──
    {
      ruleKey: "generic_customs_declaration",
      extraConditions: { exclude_destinations: ["US", "CA"] },
      titleTemplate: "Customs import declaration per {{destination.tariffSource}}",
      descriptionTemplate: "Formal import declaration submitted to {{destination.countryName}} customs using the applicable tariff schedule ({{destination.tariffSource}}). Includes HS classification, value, origin, and duty calculation.",
      issuedByTemplate: "Customs Broker / Importer",
      whenNeeded: "At import — before goods are released from customs control",
      tipTemplate: "Double-check the HS code classification against the destination tariff schedule. Misclassification is the most common cause of customs delays and penalties.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "BEFORE_ARRIVAL",
      sortOrder: 410,
    },
    // ── 61. VAT/GST (always, all destinations) ──
    {
      ruleKey: "always_vat_gst",
      titleTemplate: "VAT/GST at {{destination.vatRate}}% applies on CIF value at {{destination.countryName}} port of entry",
      descriptionTemplate: "Import VAT or GST levied on the CIF (Cost, Insurance, Freight) value of goods entering {{destination.countryName}}. This is in addition to any customs duty.",
      issuedByTemplate: "{{destination.countryName}} tax authority",
      whenNeeded: "At import — payable before goods are released",
      tipTemplate: "VAT paid at import is usually recoverable as input tax credit if the importer is VAT-registered. Keep the customs receipt.",
      portalGuideTemplate: "{{portalGuide.destination}}",
      documentCode: null,
      isSupplierSide: false,
      owner: "IMPORTER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 500,
    },
  ];

  // Upsert each rule: INSERT ... ON CONFLICT(rule_key) DO UPDATE ... WHERE rule_category = 'seed'
  let inserted = 0;
  let updated = 0;
  for (const r of rules) {
    const result = await db.execute(sql`
      INSERT INTO compliance_rules (
        rule_key,
        destination_iso2,
        trigger_flag,
        hs_code_prefix,
        commodity_type,
        transport_mode,
        min_value,
        extra_conditions,
        title_template,
        description_template,
        issued_by_template,
        when_needed,
        tip_template,
        portal_guide_template,
        document_code,
        is_supplier_side,
        owner,
        due_by,
        rule_category,
        regulation_ref,
        sort_order,
        is_active,
        effective_date,
        validation_spec
      ) VALUES (
        ${r.ruleKey},
        ${r.destinationIso2 ?? null},
        ${r.triggerFlag ?? null},
        ${r.hsCodePrefix ?? null},
        ${r.commodityType ?? null},
        ${r.transportMode ?? null},
        ${r.minValue ?? null},
        ${r.extraConditions ? sql`${JSON.stringify(r.extraConditions)}::jsonb` : sql`NULL`},
        ${r.titleTemplate},
        ${r.descriptionTemplate},
        ${r.issuedByTemplate},
        ${r.whenNeeded},
        ${r.tipTemplate},
        ${r.portalGuideTemplate ?? null},
        ${r.documentCode ?? null},
        ${r.isSupplierSide},
        ${r.owner},
        ${r.dueBy},
        'seed',
        ${r.regulationRef ?? null},
        ${r.sortOrder},
        true,
        CURRENT_DATE,
        ${r.validationSpec ? sql`${JSON.stringify(r.validationSpec)}::jsonb` : sql`NULL`}
      )
      ON CONFLICT (rule_key) DO UPDATE SET
        destination_iso2 = EXCLUDED.destination_iso2,
        trigger_flag = EXCLUDED.trigger_flag,
        hs_code_prefix = EXCLUDED.hs_code_prefix,
        commodity_type = EXCLUDED.commodity_type,
        transport_mode = EXCLUDED.transport_mode,
        min_value = EXCLUDED.min_value,
        extra_conditions = EXCLUDED.extra_conditions,
        title_template = EXCLUDED.title_template,
        description_template = EXCLUDED.description_template,
        issued_by_template = EXCLUDED.issued_by_template,
        when_needed = EXCLUDED.when_needed,
        tip_template = EXCLUDED.tip_template,
        portal_guide_template = EXCLUDED.portal_guide_template,
        document_code = EXCLUDED.document_code,
        is_supplier_side = EXCLUDED.is_supplier_side,
        owner = EXCLUDED.owner,
        due_by = EXCLUDED.due_by,
        regulation_ref = EXCLUDED.regulation_ref,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active,
        effective_date = EXCLUDED.effective_date,
        validation_spec = EXCLUDED.validation_spec,
        updated_at = NOW()
      WHERE compliance_rules.rule_category = 'seed'
    `);
    // rowCount > 0 means either inserted or updated
    if (result.rowCount && result.rowCount > 0) {
      // Check if this was an insert (new row) vs update — we approximate via simple count
      updated++;
    }
  }

  log(`Seeded ${rules.length} compliance rules (upserted ${updated} rows)`, "seed");
}
