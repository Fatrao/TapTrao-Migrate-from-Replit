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
          // Seller/buyer identification (UCP 600 Art. 18 + customs requirements)
          { name: "sellerName", description: "Full legal name of seller/exporter", required: true, severityIfMissing: "critical" },
          { name: "sellerAddress", description: "Full postal address of seller/exporter", required: true, severityIfMissing: "critical" },
          { name: "buyerName", description: "Full legal name of buyer/importer (applicant under UCP 600)", required: true, severityIfMissing: "critical" },
          { name: "buyerAddress", description: "Full postal address of buyer/importer", required: true, severityIfMissing: "warning" },
          { name: "taxId", description: "Tax/VAT/EORI number of seller or buyer", required: false, severityIfMissing: "warning" },
          // Invoice identifiers
          { name: "invoiceNumber", description: "Unique invoice number", required: true, severityIfMissing: "critical" },
          { name: "invoiceDate", description: "Date of invoice", required: true, severityIfMissing: "critical" },
          // Goods description (UCP 600 Art. 18(c) — must correspond to credit description)
          { name: "goodsDescription", description: "Detailed description of goods (not generic terms per ICS2)", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS/CN code (min 6 digits; 8-10 for EU/US)", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Quantity of goods with unit of measure", required: true, severityIfMissing: "critical" },
          { name: "unitPrice", description: "Unit price per item/unit", required: true, severityIfMissing: "critical" },
          { name: "totalAmount", description: "Total invoice amount", required: true, severityIfMissing: "critical" },
          { name: "currency", description: "Currency code (USD, EUR, GBP, etc.)", required: true, severityIfMissing: "critical" },
          // Weights
          { name: "netWeight", description: "Net weight in kg", required: false, severityIfMissing: "warning" },
          { name: "grossWeight", description: "Gross weight in kg", required: false, severityIfMissing: "warning" },
          // Trade terms
          { name: "incoterms", description: "Incoterms 2020 with named place (e.g., FOB Abidjan)", required: true, severityIfMissing: "warning" },
          { name: "countryOfOrigin", description: "Country where goods were manufactured/produced", required: true, severityIfMissing: "critical" },
          // Payment & shipping
          { name: "paymentTerms", description: "Payment terms (e.g., L/C, T/T, CAD)", required: false, severityIfMissing: "info" },
          { name: "purchaseOrderNumber", description: "Buyer's PO or contract reference number", required: false, severityIfMissing: "info" },
          // Declaration
          { name: "declarationStatement", description: "Declaration confirming invoice accuracy and value correctness", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
          { type: "numeric_positive", severity: "warning", message: "Invoice amounts must be positive values." },
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "weight_net_less_than_gross", severity: "critical", message: "Net weight cannot exceed gross weight." },
          { type: "price_per_kg_in_range", severity: "warning", message: "Price per kg is outside expected range — verify declared value." },
          { type: "incoterms_valid", severity: "warning", message: "Incoterms term not recognized — must be valid Incoterms 2020." },
          { type: "currency_code_valid", severity: "warning", message: "Currency code not recognized — must be valid ISO 4217." },
        ],
        minimumAcceptable: { mustHave: ["sellerName", "totalAmount", "goodsDescription"], ifMissing: "ISSUES_FOUND" },
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
          // Parties
          { name: "shipperName", description: "Shipper/exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Consignee/receiver name and address", required: true, severityIfMissing: "warning" },
          // References
          { name: "packingListDate", description: "Date of packing list", required: true, severityIfMissing: "warning" },
          { name: "invoiceReference", description: "Reference to corresponding commercial invoice number", required: false, severityIfMissing: "info" },
          // Package details
          { name: "numberOfPackages", description: "Total number of packages/cartons/bags/drums", required: true, severityIfMissing: "critical" },
          { name: "packageType", description: "Type of packaging (box, crate, drum, bag, carton, pallet)", required: true, severityIfMissing: "warning" },
          { name: "shippingMarks", description: "Shipping marks and numbers on each package", required: true, severityIfMissing: "warning" },
          // Contents per package
          { name: "goodsDescription", description: "Description of contents for each package", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS code for goods", required: false, severityIfMissing: "warning" },
          { name: "quantity", description: "Quantity per item/package with unit of measure", required: true, severityIfMissing: "critical" },
          // Weights
          { name: "netWeight", description: "Net weight per package and total (in kg)", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross weight per package and total (in kg)", required: true, severityIfMissing: "critical" },
          // Dimensions
          { name: "dimensions", description: "Dimensions per package (L × W × H) in cm or inches", required: false, severityIfMissing: "warning" },
          // Traceability
          { name: "lotOrBatchNumber", description: "Lot/batch numbers for traceability", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "warning", message: "Weights and quantities must be positive." },
          { type: "weight_net_less_than_gross", severity: "critical", message: "Net weight cannot exceed gross weight." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["quantity", "netWeight", "numberOfPackages"], ifMissing: "ISSUES_FOUND" },
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
          mustContainAny: ["bill of lading", "B/L", "connaissement", "airway bill", "AWB", "waybill"],
          rejectIfContainsAny: ["invoice", "packing list", "certificate of origin"],
        },
        expectedFields: [
          // Parties (Hague-Visby Rules Art. III)
          { name: "shipperName", description: "Shipper/exporter full name and address", required: true, severityIfMissing: "critical" },
          { name: "consignee", description: "Consignee full name and address (or 'To Order')", required: true, severityIfMissing: "critical" },
          { name: "notifyParty", description: "Notify party name and address", required: false, severityIfMissing: "warning" },
          // B/L identifiers
          { name: "blNumber", description: "Bill of Lading number (unique reference)", required: true, severityIfMissing: "critical" },
          { name: "bookingReference", description: "Booking or contract number", required: false, severityIfMissing: "info" },
          // Carrier
          { name: "carrierName", description: "Carrier/shipping line name", required: true, severityIfMissing: "warning" },
          { name: "vesselName", description: "Vessel/flight name and voyage number", required: true, severityIfMissing: "warning" },
          // Ports and routing
          { name: "portOfLoading", description: "Port of loading", required: true, severityIfMissing: "critical" },
          { name: "portOfDischarge", description: "Port of discharge/destination", required: true, severityIfMissing: "critical" },
          { name: "placeOfDelivery", description: "Final place of delivery (if different from port)", required: false, severityIfMissing: "info" },
          // Cargo details (Hague-Visby Art. III §3 — marks, number, quantity, weight)
          { name: "goodsDescription", description: "Description of goods/commodity", required: true, severityIfMissing: "critical" },
          { name: "numberOfPackages", description: "Number of packages, pieces, or containers", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross weight of cargo", required: true, severityIfMissing: "critical" },
          { name: "shippingMarks", description: "Leading marks for cargo identification", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "Container number(s) and seal number(s)", required: false, severityIfMissing: "warning" },
          // Dates
          { name: "shippedOnBoardDate", description: "Shipped on board date (or received for shipment date)", required: true, severityIfMissing: "critical" },
          { name: "dateOfIssue", description: "Date B/L was issued", required: true, severityIfMissing: "warning" },
          // Freight
          { name: "freightTerms", description: "Freight prepaid or collect", required: false, severityIfMissing: "info" },
          // Type indicators
          { name: "blType", description: "Original/copy, negotiable/non-negotiable, clean/claused", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "critical", message: "Shipped on board date cannot be in the future." },
          { type: "origin_country_match", severity: "warning", message: "Port of loading does not match expected origin." },
          { type: "destination_country_match", severity: "warning", message: "Port of discharge does not match expected destination." },
          { type: "numeric_positive", severity: "warning", message: "Package count and weight must be positive values." },
          { type: "weight_net_less_than_gross", severity: "critical", message: "Net weight cannot exceed gross weight on B/L." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["shipperName", "consignee", "portOfLoading", "portOfDischarge", "shippedOnBoardDate"], ifMissing: "ISSUES_FOUND" },
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
          mustContainAny: ["certificate of origin", "certificat d'origine", "EUR.1", "EUR-MED", "Form A", "GSP Form A", "origin"],
          rejectIfContainsAny: ["invoice", "packing list", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          // Exporter (WCO Guidelines Box 1 / EUR.1 Box 1)
          { name: "exporterName", description: "Full name and address of exporter/sender", required: true, severityIfMissing: "critical" },
          { name: "exporterCountry", description: "Country of the exporter", required: true, severityIfMissing: "warning" },
          // Consignee (WCO Box 2 / EUR.1 Box 2)
          { name: "consigneeName", description: "Full name and address of consignee/importer", required: true, severityIfMissing: "warning" },
          // Certificate identifiers
          { name: "certificateNumber", description: "Unique certificate serial number", required: true, severityIfMissing: "critical" },
          { name: "dateOfIssue", description: "Date of issue of the certificate", required: true, severityIfMissing: "critical" },
          // Origin (WCO Box 3)
          { name: "originCountry", description: "Country of origin of goods", required: true, severityIfMissing: "critical" },
          { name: "originCriteria", description: "Origin criteria/rule satisfied (wholly obtained, sufficiently processed, cumulation)", required: false, severityIfMissing: "warning" },
          // Transport (WCO Box 4)
          { name: "transportDetails", description: "Means of transport and route (vessel, port, etc.)", required: false, severityIfMissing: "info" },
          // Goods (WCO Box 5-8)
          { name: "goodsDescription", description: "Description of goods", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS code of the goods", required: true, severityIfMissing: "warning" },
          { name: "quantity", description: "Quantity or weight of goods", required: true, severityIfMissing: "warning" },
          { name: "invoiceReference", description: "Commercial invoice number and date", required: false, severityIfMissing: "info" },
          // Certification (WCO Box 11-12)
          { name: "issuingAuthority", description: "Certifying body (Chamber of Commerce, customs authority, etc.)", required: true, severityIfMissing: "critical" },
          { name: "officialStampOrSeal", description: "Official stamp, seal, or signature of certifying body", required: true, severityIfMissing: "critical" },
          { name: "destinationCountry", description: "Destination/importing country", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "critical", message: "Origin country does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination country does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["exporterName", "originCountry", "issuingAuthority"], ifMissing: "ISSUES_FOUND" },
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
          shouldContainAny: ["ISPM", "inspection", "pest free", "treatment", "fumigation"],
          rejectIfContainsAny: ["invoice", "packing list", "bill of lading"],
        },
        expectedFields: [
          // ISPM 12 Model Certificate — all sections
          // Header
          { name: "certificateNumber", description: "Unique certificate identification number for trace-back", required: true, severityIfMissing: "critical" },
          { name: "issuingOrganization", description: "Name of National Plant Protection Organization (NPPO)", required: true, severityIfMissing: "critical" },
          { name: "issuingCountry", description: "Country of the issuing NPPO", required: true, severityIfMissing: "critical" },
          // Parties
          { name: "exporterName", description: "Name and address of exporter/applicant", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Name and address of consignee (declared)", required: true, severityIfMissing: "warning" },
          // Origin
          { name: "originCountry", description: "Country of origin of the plants/plant products", required: true, severityIfMissing: "critical" },
          { name: "placeOfOrigin", description: "Specific place of origin within country (region, district)", required: false, severityIfMissing: "warning" },
          // Transport
          { name: "meansOfConveyance", description: "Declared means of conveyance (vessel, aircraft, truck)", required: true, severityIfMissing: "warning" },
          { name: "entryPoint", description: "Declared point of entry at destination country", required: true, severityIfMissing: "warning" },
          // Commodity identification
          { name: "commodityDescription", description: "Name/description of commodity (common name)", required: true, severityIfMissing: "critical" },
          { name: "botanicalName", description: "Botanical/scientific name of plant(s)", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Quantity declared (weight, volume, number of units)", required: true, severityIfMissing: "critical" },
          { name: "numberOfPackages", description: "Number of packages", required: false, severityIfMissing: "warning" },
          // Phytosanitary declaration
          { name: "phytosanitaryDeclaration", description: "Standard IPPC declaration that products were inspected and found free from quarantine pests", required: true, severityIfMissing: "critical" },
          // Treatments
          { name: "treatmentType", description: "Treatment applied (e.g., fumigation, heat treatment, irradiation)", required: false, severityIfMissing: "warning" },
          { name: "treatmentChemical", description: "Chemical/active ingredient used in treatment", required: false, severityIfMissing: "warning" },
          { name: "treatmentDuration", description: "Duration and temperature of treatment", required: false, severityIfMissing: "warning" },
          { name: "treatmentDate", description: "Date treatment was applied", required: false, severityIfMissing: "warning" },
          // Additional declarations
          { name: "additionalDeclarations", description: "Additional declarations required by importing country (pest-free area, specific conditions)", required: false, severityIfMissing: "info" },
          // Certification
          { name: "placeOfIssue", description: "Place where certificate was issued", required: true, severityIfMissing: "warning" },
          { name: "dateOfIssue", description: "Date of issue", required: true, severityIfMissing: "critical" },
          { name: "authorizedOfficerName", description: "Name of authorized officer who signed", required: true, severityIfMissing: "critical" },
          { name: "officialStampOrSeal", description: "Official stamp or seal of the NPPO", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "critical", message: "Origin country does not match trade context." },
          { type: "date_not_future", severity: "critical", message: "Certificate issue date cannot be in the future." },
          { type: "date_before_expiry", severity: "critical", message: "Phytosanitary certificates are typically valid for 14 days from inspection." },
          { type: "phyto_within_14_days", severity: "critical", message: "Phytosanitary certificate exceeds 14-day validity from issue date (ISPM 12)." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "exporterName", "issuingOrganization", "commodityDescription", "dateOfIssue"], ifMissing: "ISSUES_FOUND" },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["SPS", "sanitary", "phytosanitary", "MRL", "residue", "contaminant", "food safety", "maximum residue"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "regulatoryFramework", description: "Applicable SPS regulatory framework (destination country regime)", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Product description and commodity code", required: true, severityIfMissing: "critical" },
          { name: "mrlCompliance", description: "Maximum Residue Limit (MRL) compliance status for pesticides/chemicals", required: true, severityIfMissing: "critical" },
          { name: "contaminantLevels", description: "Contaminant levels tested (heavy metals, mycotoxins, etc.)", required: true, severityIfMissing: "critical" },
          { name: "laboratoryReport", description: "Accredited laboratory analysis report reference", required: true, severityIfMissing: "critical" },
          { name: "testingLaboratory", description: "Name of accredited testing laboratory", required: true, severityIfMissing: "warning" },
          { name: "sampleDate", description: "Date of sampling", required: true, severityIfMissing: "warning" },
          { name: "labellingCompliance", description: "Labelling compliance with destination country requirements", required: false, severityIfMissing: "warning" },
          { name: "countryOfOrigin", description: "Country of origin of the product", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["productDescription", "mrlCompliance", "laboratoryReport"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "SPS requirements vary by destination. EU: Regulation (EC) 396/2005 for MRLs; UK: retained EU MRL legislation; US: EPA tolerances; Canada: PMRL; Switzerland: FSVO/BLV standards. Pre-check MRLs for all pesticides used in production — non-compliant shipments face destruction or re-export at importer's cost.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CHED", "Common Health Entry Document", "TRACES", "IMSOC", "live animal"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "consignorExporter", description: "I.1 — Consignor/exporter name, address, country", required: true, severityIfMissing: "critical" },
          { name: "chedReference", description: "I.2 — Unique CHED reference number (TRACES NT)", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "I.4 — Selected BCP competent for CHED-A", required: true, severityIfMissing: "critical" },
          { name: "consigneeImporter", description: "I.6 — Consignee/importer name, address, country", required: true, severityIfMissing: "critical" },
          { name: "placeOfDestination", description: "I.7 — Place of destination in Member State", required: true, severityIfMissing: "warning" },
          { name: "responsibleOperator", description: "I.8 — Operator responsible for consignment at BCP", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "I.9 — Health certificate reference, veterinary certificate, transport docs", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrivalDateTime", description: "I.10 — Estimated arrival date and time at BCP", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "I.11 — Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "meansOfTransport", description: "I.13 — Transport mode and identification", required: true, severityIfMissing: "warning" },
          { name: "countryOfDispatch", description: "I.14 — Country of dispatch (ISO code)", required: true, severityIfMissing: "warning" },
          { name: "establishmentOfOrigin", description: "I.15 — Establishment of origin (approval number)", required: true, severityIfMissing: "critical" },
          { name: "containerNumber", description: "I.17 — Container number and seal number", required: false, severityIfMissing: "info" },
          { name: "certifiedAsFor", description: "I.18 — Certified as/for purpose", required: true, severityIfMissing: "critical" },
          { name: "purpose", description: "I.20-I.26 — Purpose selection (internal market, transit, etc.)", required: true, severityIfMissing: "critical" },
          { name: "animalSpecies", description: "I.31 — Species, breed, identification marks, age, sex", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "I.31 — Number of animals", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination does not match EU Member State BCP." },
        ],
        minimumAcceptable: { mustHave: ["chedReference", "consigneeImporter", "animalSpecies", "quantity"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CHED", "Common Health Entry Document", "TRACES", "IMSOC", "products of animal origin", "POAO"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "consignorExporter", description: "I.1 — Consignor/exporter name, address, country", required: true, severityIfMissing: "critical" },
          { name: "chedReference", description: "I.2 — Unique CHED reference number (TRACES NT)", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "I.4 — Selected BCP competent for CHED-P", required: true, severityIfMissing: "critical" },
          { name: "consigneeImporter", description: "I.6 — Consignee/importer name, address, country", required: true, severityIfMissing: "critical" },
          { name: "placeOfDestination", description: "I.7 — Place of destination in Member State", required: true, severityIfMissing: "warning" },
          { name: "responsibleOperator", description: "I.8 — Operator responsible for consignment at BCP", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "I.9 — Health/veterinary certificate reference, transport docs", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrivalDateTime", description: "I.10 — Estimated arrival date and time at BCP", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "I.11 — Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "meansOfTransport", description: "I.13 — Transport mode and identification", required: true, severityIfMissing: "warning" },
          { name: "countryOfDispatch", description: "I.14 — Country of dispatch (ISO code)", required: true, severityIfMissing: "warning" },
          { name: "establishmentOfOrigin", description: "I.15 — Establishment of origin (approved establishment number)", required: true, severityIfMissing: "critical" },
          { name: "transportConditions", description: "I.16 — Temperature: ambient, chilled, or frozen", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "I.17 — Container number and seal number", required: false, severityIfMissing: "info" },
          { name: "certifiedAsFor", description: "I.18 — Certified as/for purpose (human consumption, processing, etc.)", required: true, severityIfMissing: "critical" },
          { name: "purpose", description: "I.20-I.26 — Purpose selection (internal market, transit, etc.)", required: true, severityIfMissing: "critical" },
          { name: "cnCode", description: "I.31 — Combined Nomenclature code (8-digit)", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "I.31 — Net weight of consignment", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "I.31 — Number of packages", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin (I.11) does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination does not match EU Member State BCP." },
          { type: "date_not_future", severity: "critical", message: "Estimated arrival date cannot be in the past for a new CHED-P." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "CN code in I.31 does not match expected HS code for animal products." },
          { type: "container_number_format", severity: "warning", message: "Container number (I.17) does not match ISO 6346 format." },
        ],
        issuerRules: {
          mustContain: ["TRACES", "IMSOC", "European Commission", "Border Control"],
        },
        minimumAcceptable: { mustHave: ["chedReference", "consigneeImporter", "cnCode", "netWeight", "establishmentOfOrigin"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "CHED-P covers products of animal origin (meat, fish, dairy, hides). Establishment of origin (I.15) must reference an EU-approved third-country establishment. Temperature conditions (I.16) are critical for cold-chain products. Part II (official checks) is completed by BCP inspectors.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CHED", "Common Health Entry Document", "TRACES", "IMSOC", "plant", "phytosanitary"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "consignorExporter", description: "I.1 — Consignor/exporter name, address, country", required: true, severityIfMissing: "critical" },
          { name: "chedReference", description: "I.2 — Unique CHED reference number (TRACES NT)", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "I.4 — Selected BCP competent for CHED-PP", required: true, severityIfMissing: "critical" },
          { name: "consigneeImporter", description: "I.6 — Consignee/importer name, address, country", required: true, severityIfMissing: "critical" },
          { name: "placeOfDestination", description: "I.7 — Place of destination in Member State", required: true, severityIfMissing: "warning" },
          { name: "responsibleOperator", description: "I.8 — Operator responsible for consignment at BCP", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "I.9 — Phytosanitary certificate reference, transport docs", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrivalDateTime", description: "I.10 — Estimated arrival date and time at BCP", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "I.11 — Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "meansOfTransport", description: "I.13 — Transport mode and identification", required: true, severityIfMissing: "warning" },
          { name: "countryOfDispatch", description: "I.14 — Country of dispatch (ISO code)", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "I.17 — Container number and seal number", required: false, severityIfMissing: "info" },
          { name: "certifiedAsFor", description: "I.18 — Certified as/for: planting, consumption, processing, etc.", required: true, severityIfMissing: "critical" },
          { name: "purpose", description: "I.20-I.26 — Purpose selection (internal market, transit, etc.)", required: true, severityIfMissing: "critical" },
          { name: "cnCode", description: "I.31 — Combined Nomenclature code (8-digit)", required: true, severityIfMissing: "critical" },
          { name: "botanicalName", description: "I.31 — Botanical/scientific name of plant species", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "I.31 — Net weight or quantity of consignment", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "I.31 — Number of packages", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin (I.11) does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination does not match EU Member State BCP." },
          { type: "date_not_future", severity: "critical", message: "Estimated arrival date cannot be in the past for a new CHED-PP." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "CN code in I.31 does not match expected HS code for plant products." },
          { type: "container_number_format", severity: "warning", message: "Container number (I.17) does not match ISO 6346 format." },
        ],
        issuerRules: {
          mustContain: ["TRACES", "IMSOC", "European Commission", "Border Control"],
        },
        minimumAcceptable: { mustHave: ["chedReference", "consigneeImporter", "cnCode", "botanicalName", "netWeight"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "CHED-PP covers plants, plant products, and other objects regulated under EU plant health legislation (Reg. 2016/2031). Botanical name is mandatory. The phytosanitary certificate from origin must be referenced in I.9. Identity and physical checks may be reduced frequency depending on risk category.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CHED", "Common Health Entry Document", "TRACES", "IMSOC", "food of non-animal origin"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          // Part I boxes per Regulation (EU) 2019/1715 Annex II + TRACES NT help
          // I.1 Consignor/Exporter
          { name: "consignorExporter", description: "I.1 — Name, address, country of consignor/exporter (TRACES operator)", required: true, severityIfMissing: "critical" },
          // I.2 CHED Reference
          { name: "chedReference", description: "I.2 — Unique CHED reference number (auto-allocated by TRACES NT)", required: true, severityIfMissing: "critical" },
          // I.4 Border Control Post
          { name: "borderControlPost", description: "I.4 — Selected BCP competent for CHED-D (must match commodity competence)", required: true, severityIfMissing: "critical" },
          // I.6 Consignee/Importer
          { name: "consigneeImporter", description: "I.6 — Name, address, country of consignee/importer", required: true, severityIfMissing: "critical" },
          // I.7 Place of destination
          { name: "placeOfDestination", description: "I.7 — Place of destination in Member State (defaults to I.6 operator)", required: true, severityIfMissing: "warning" },
          // I.8 Operator responsible for consignment
          { name: "responsibleOperator", description: "I.8 — Operator in Member State responsible when presented at BCP", required: true, severityIfMissing: "critical" },
          // I.9 Accompanying documents
          { name: "accompanyingDocuments", description: "I.9 — Health certificate reference, commercial docs (AWB/B/L), document type and unique code", required: true, severityIfMissing: "critical" },
          // I.10 Prior notification
          { name: "estimatedArrivalDateTime", description: "I.10 — Estimated arrival date and time at BCP entry point", required: true, severityIfMissing: "critical" },
          // I.11 Country of origin
          { name: "countryOfOrigin", description: "I.11 — Country of origin (ISO code, auto-filled from I.31 commodities)", required: true, severityIfMissing: "critical" },
          // I.13 Means of transport
          { name: "meansOfTransport", description: "I.13 — Transport mode: Railway, Road vehicle, Airplane, or Vessel (with identification)", required: true, severityIfMissing: "warning" },
          // I.14 Country of dispatch
          { name: "countryOfDispatch", description: "I.14 — Country where goods placed on final transport to EU (ISO code)", required: true, severityIfMissing: "warning" },
          // I.16 Transport conditions
          { name: "transportConditions", description: "I.16 — Storage/transport temperature: ambient, chilled, or frozen (single selection)", required: false, severityIfMissing: "warning" },
          // I.17 Container/Seal
          { name: "containerNumber", description: "I.17 — Container number (3 capital letters + U/J/Z + 7 digits) and seal number", required: false, severityIfMissing: "info" },
          // I.18 Certified as/for
          { name: "certifiedAsFor", description: "I.18 — Purpose: human consumption, feedstuff, sample, etc. (options depend on CN code)", required: true, severityIfMissing: "critical" },
          // I.20-I.26 Purpose (one must be selected)
          { name: "purpose", description: "I.20-I.26 — Purpose selection: internal market (I.23), transfer to control point (I.20), transit (I.22), etc.", required: true, severityIfMissing: "critical" },
          // I.31 Description of consignment
          { name: "cnCode", description: "I.31 — Combined Nomenclature code (8-digit CN code from TRACES dropdown)", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "I.31 — Net weight of consignment", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "I.31 — Number of packages", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin (I.11) does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination does not match EU Member State BCP." },
          { type: "date_not_future", severity: "critical", message: "Estimated arrival date cannot be in the past for a new CHED-D." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "CN code in I.31 does not match expected HS code." },
          { type: "container_number_format", severity: "warning", message: "Container number (I.17) does not match ISO 6346 format (3 letters + U/J/Z + 7 digits)." },
        ],
        issuerRules: {
          mustContain: ["TRACES", "IMSOC", "European Commission", "Border Control"],
        },
        minimumAcceptable: { mustHave: ["chedReference", "consigneeImporter", "cnCode", "netWeight"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "CHED-D mandatory status is workflow-dependent per Regulation (EU) 2019/1715 Annex II. Many fields use controlled lists in TRACES NT (operator database, BCP list, ISO country codes). I.5 (BCP code) is auto-allocated once I.4 is selected. I.11 (Country of origin) is auto-filled from I.31 commodities. I.19 (Conformity), I.22 (Transit), I.24-I.26 are N/A for CHED-D. I.21 (Onward transportation) and I.27-I.29 become mandatory only in transhipment/transit/control-point scenarios. Purpose selection (I.20-I.26) is mutually exclusive — most common is I.23 (internal market).",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["IPAFFS", "import notification", "live animal", "BTOM", "Port Health"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "ipaffsReference", description: "IPAFFS notification reference number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer/responsible person name and address", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter/consignor name, address, country", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "UK BCP selected for inspection", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrival", description: "Estimated date and time of arrival at BCP", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "Veterinary/health certificate references", required: true, severityIfMissing: "critical" },
          { name: "animalSpecies", description: "Species, breed, identification, age, sex", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Number of animals", required: true, severityIfMissing: "critical" },
          { name: "commodityCode", description: "UK commodity code", required: true, severityIfMissing: "critical" },
          { name: "meansOfTransport", description: "Transport mode and identification", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "Container/seal numbers if applicable", required: false, severityIfMissing: "info" },
          { name: "riskCategory", description: "BTOM risk category (high/medium/low)", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination should be GB/UK." },
        ],
        minimumAcceptable: { mustHave: ["ipaffsReference", "importerName", "animalSpecies", "quantity"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "IPAFFS is the UK's replacement for TRACES. Risk categorisation under the Border Target Operating Model (BTOM) determines inspection frequency. Live animals are always high-risk and subject to identity and physical checks at BCP.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["IPAFFS", "import notification", "POAO", "products of animal origin", "BTOM", "Port Health"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "ipaffsReference", description: "IPAFFS notification reference number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer/responsible person name and address", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter/consignor name, address, country", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "UK BCP selected for inspection", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "establishmentOfOrigin", description: "Approved establishment number in country of origin", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrival", description: "Estimated date and time of arrival at BCP", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "Veterinary/health certificate references", required: true, severityIfMissing: "critical" },
          { name: "commodityCode", description: "UK commodity code", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of animal products (meat type, dairy, fish, etc.)", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Net weight in kilograms", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "Number of packages", required: true, severityIfMissing: "warning" },
          { name: "transportConditions", description: "Temperature conditions: ambient, chilled, or frozen", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "Container/seal numbers", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "Commodity code does not match expected HS for animal products." },
          { type: "weight_net_less_than_gross", severity: "warning", message: "Net weight exceeds gross weight." },
        ],
        minimumAcceptable: { mustHave: ["ipaffsReference", "importerName", "commodityCode", "netWeight", "establishmentOfOrigin"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["IPAFFS", "import notification", "plant", "phytosanitary", "BTOM", "Port Health"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "ipaffsReference", description: "IPAFFS notification reference number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer/responsible person name and address", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter/consignor name, address, country", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "UK BCP selected for phytosanitary inspection", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrival", description: "Estimated date and time of arrival at BCP", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "Phytosanitary certificate reference from origin NPPO", required: true, severityIfMissing: "critical" },
          { name: "commodityCode", description: "UK commodity code", required: true, severityIfMissing: "critical" },
          { name: "botanicalName", description: "Scientific/botanical name of plant species", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of plant products", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Net weight or quantity", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "Number of packages", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "Container/seal numbers", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "Commodity code does not match expected HS for plant products." },
          { type: "phyto_within_14_days", severity: "critical", message: "Phytosanitary certificate must be issued within 14 days of export." },
        ],
        minimumAcceptable: { mustHave: ["ipaffsReference", "importerName", "commodityCode", "botanicalName"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["IPAFFS", "import notification", "HRFNAO", "high risk", "food of non-animal origin", "BTOM", "Port Health"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "ipaffsReference", description: "IPAFFS notification reference number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer/responsible person name and address", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter/consignor name, address, country", required: true, severityIfMissing: "critical" },
          { name: "borderControlPost", description: "UK BCP selected for inspection", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrival", description: "Estimated date and time of arrival", required: true, severityIfMissing: "critical" },
          { name: "accompanyingDocuments", description: "Health certificate or analytical report references", required: true, severityIfMissing: "critical" },
          { name: "commodityCode", description: "UK commodity code", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of food/feed product", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Net weight in kilograms", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "Number of packages", required: true, severityIfMissing: "warning" },
          { name: "containerNumber", description: "Container/seal numbers", required: false, severityIfMissing: "info" },
          { name: "riskCategory", description: "BTOM risk category for food/feed", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "Commodity code does not match expected HS for food/feed." },
          { type: "weight_net_less_than_gross", severity: "warning", message: "Net weight exceeds gross weight." },
        ],
        minimumAcceptable: { mustHave: ["ipaffsReference", "importerName", "commodityCode", "netWeight"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "HRFNAO = High Risk Food Not of Animal Origin. Equivalent to EU CHED-D. Products on the UK HRFNAO list (derived from EU Reg 2019/1793) require increased border checks. Aflatoxin testing common for cocoa, groundnuts, spices.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["FSVO", "BLV", "veterinary", "food safety", "import notification", "e-dec", "Passar", "Swiss food"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "notificationReference", description: "FSVO/BLV import notification reference number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Swiss importer name, address, UID (Unternehmens-Identifikationsnummer)", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter/consignor name, address, country", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of food/animal product", required: true, severityIfMissing: "critical" },
          { name: "tariffNumber", description: "Swiss tariff number (Tares)", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Net weight in kilograms", required: true, severityIfMissing: "critical" },
          { name: "healthCertificateRef", description: "Veterinary/health certificate reference from origin country", required: true, severityIfMissing: "critical" },
          { name: "establishmentOfOrigin", description: "Approved establishment in country of origin (if animal product)", required: false, severityIfMissing: "warning" },
          { name: "estimatedArrival", description: "Estimated date of arrival at Swiss border", required: true, severityIfMissing: "critical" },
          { name: "borderCrossing", description: "Swiss border crossing point or customs office", required: true, severityIfMissing: "warning" },
          { name: "transportConditions", description: "Temperature conditions (ambient/chilled/frozen)", required: false, severityIfMissing: "warning" },
          { name: "containerNumber", description: "Container number(s) if containerised", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "Swiss tariff number does not match expected HS code." },
          { type: "numeric_positive", severity: "critical", message: "Net weight must be positive." },
        ],
        minimumAcceptable: { mustHave: ["notificationReference", "importerName", "productDescription", "healthCertificateRef"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Switzerland uses its own FSVO/BLV notification system — NOT EU TRACES. For animal-origin products, the exporting country's veterinary authority must issue an official certificate. The Swiss UID (enterprise identification number, format CHE-xxx.xxx.xxx) replaces EORI for Swiss importers. ZAZ account needed for duty payment.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["phytosanitary", "FPPS", "OFAG", "plant protection", "SPPS", "plant health", "ISPM"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list", "certificate of origin"],
        },
        expectedFields: [
          { name: "certificateNumber", description: "Phytosanitary certificate number from origin NPPO", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Name and address of exporter/consignor", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Name and address of Swiss importer/consignee", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin of plants/plant products", required: true, severityIfMissing: "critical" },
          { name: "botanicalName", description: "Botanical/scientific name of plant species", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of plants/plant products including quantity", required: true, severityIfMissing: "critical" },
          { name: "quantityDeclared", description: "Quantity and unit of measure", required: true, severityIfMissing: "critical" },
          { name: "treatmentDetails", description: "Disinfection/disinfestation treatment applied (method, chemical, duration, temperature)", required: false, severityIfMissing: "warning" },
          { name: "additionalDeclaration", description: "Additional declaration (pest-free area, inspection results)", required: false, severityIfMissing: "warning" },
          { name: "issueDate", description: "Date of issue by origin NPPO", required: true, severityIfMissing: "critical" },
          { name: "issuingAuthority", description: "Name of issuing NPPO authority", required: true, severityIfMissing: "critical" },
          { name: "inspectionStamp", description: "FPPS/SPPS inspection stamp or digital clearance", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "phyto_within_14_days", severity: "critical", message: "Phytosanitary certificate must be issued within 14 days of export per ISPM-12." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "botanicalName", "countryOfOrigin", "issuingAuthority"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Swiss FPPS/SPPS processes phytosanitary certificates per ISPM-12 standards. Switzerland requires the certificate in an official Swiss language (German, French, or Italian) or English. Additional declarations may be required for specific pest-free claims. Plant passport (EU Reg 2016/2031 format, sections A-E) may be required for intra-European movement after Swiss import clearance.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CITES", "Convention on International Trade", "endangered species", "FOEN", "BAFU", "Appendix"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list"],
        },
        expectedFields: [
          { name: "permitNumber", description: "Swiss CITES import permit number", required: true, severityIfMissing: "critical" },
          { name: "issuingAuthority", description: "FOEN/BAFU as Swiss CITES Management Authority", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer/consignee name and address in Switzerland", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter/consignor name and address", required: true, severityIfMissing: "critical" },
          { name: "speciesScientific", description: "Scientific name (genus + species) of the specimen", required: true, severityIfMissing: "critical" },
          { name: "speciesCommon", description: "Common name of the species", required: false, severityIfMissing: "warning" },
          { name: "appendixListing", description: "CITES Appendix (I, II, or III)", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Quantity and unit of measure (number, kg, etc.)", required: true, severityIfMissing: "critical" },
          { name: "specimenDescription", description: "Description of specimen (live, skin, extract, etc.)", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin of the specimen", required: true, severityIfMissing: "critical" },
          { name: "exportPermitRef", description: "Export CITES permit number from origin country", required: true, severityIfMissing: "critical" },
          { name: "purposeOfTransaction", description: "Purpose: T (commercial), Z (zoo), S (scientific), etc.", required: true, severityIfMissing: "warning" },
          { name: "validityDate", description: "Permit validity expiry date", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "date_not_future", severity: "warning", message: "Check permit validity — expired permits are invalid." },
        ],
        minimumAcceptable: { mustHave: ["permitNumber", "speciesScientific", "appendixListing", "exportPermitRef"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Swiss CITES permits follow Resolution Conf. 12.3 (Rev. CoP19) 20-box format. Appendix I species require both import AND export permits. Permits are typically valid for 6 months (import) or 12 months (re-export). FSVO (not FOEN) actually administers CITES in practice for live animals.",
        },
      },
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
          // Operator identification (Annex II, Regulation 2023/1115)
          { name: "operator_name", description: "Name and contact details of operator or non-SME trader", required: true, severityIfMissing: "critical" },
          { name: "operator_eori", description: "EORI number of the operator (per Regulation EU 952/2013)", required: true, severityIfMissing: "critical" },
          { name: "activity_type", description: "Type of activity: import, domestic production, or export", required: true, severityIfMissing: "warning" },
          // Product identification
          { name: "hs_code", description: "HS/CN code for relevant product(s)", required: true, severityIfMissing: "critical" },
          { name: "product_description", description: "Free-text product description incl. trade name", required: true, severityIfMissing: "critical" },
          { name: "scientific_name", description: "Scientific name where applicable (mandatory for wood products)", required: false, severityIfMissing: "warning" },
          { name: "quantity_net_mass_kg", description: "Quantity in kg net mass plus supplementary units if applicable", required: true, severityIfMissing: "critical" },
          // Geographic and production data
          { name: "country_of_production", description: "Country where commodity was grown, harvested, or produced", required: true, severityIfMissing: "critical" },
          { name: "geolocation_plots", description: "Geolocation for all production plots (point data <4ha, polygon data ≥4ha)", required: true, severityIfMissing: "critical" },
          { name: "production_date_range", description: "Date or date range of production/harvest", required: true, severityIfMissing: "critical" },
          // Supply chain actors
          { name: "supplier_identity", description: "Name + postal address + email of supplier(s) in the supply chain", required: true, severityIfMissing: "critical" },
          { name: "customer_identity", description: "Name + postal address + email of customer(s)/buyer(s)", required: true, severityIfMissing: "critical" },
          // Due diligence assessment
          { name: "deforestation_free_evidence", description: "Conclusive info that products are deforestation-free (no deforestation after 31 Dec 2020)", required: true, severityIfMissing: "critical" },
          { name: "legality_evidence", description: "Info that commodities comply with country-of-production legislation", required: true, severityIfMissing: "critical" },
          { name: "risk_assessment_conclusion", description: "Risk assessment conclusion (no risk, negligible risk, or non-negligible risk requiring mitigation)", required: true, severityIfMissing: "critical" },
          { name: "operator_declaration", description: "Formal declaration that due diligence was exercised and no/negligible risk was found", required: true, severityIfMissing: "critical" },
          // References
          { name: "traces_reference_number", description: "TRACES NT / EUDR Information System reference number", required: true, severityIfMissing: "critical" },
          { name: "prior_dds_references", description: "Reference numbers of prior due diligence statements (if using already-declared materials)", required: false, severityIfMissing: "info" },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["EUDR", "due diligence statement", "deforestation", "Regulation 2023/1115", "geolocation"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list"],
        },
        expectedFields: [
          { name: "operator_name", description: "Operator/trader name and contact details", required: true, severityIfMissing: "critical" },
          { name: "operator_eori", description: "EORI number or UK equivalent", required: true, severityIfMissing: "critical" },
          { name: "hs_code", description: "HS/CN code for relevant product(s)", required: true, severityIfMissing: "critical" },
          { name: "product_description", description: "Product description incl. trade name", required: true, severityIfMissing: "critical" },
          { name: "quantity_net_mass_kg", description: "Quantity in kg net mass", required: true, severityIfMissing: "critical" },
          { name: "country_of_production", description: "Country where commodity was produced", required: true, severityIfMissing: "critical" },
          { name: "geolocation_plots", description: "Geolocation for all production plots", required: true, severityIfMissing: "critical" },
          { name: "production_date_range", description: "Date or date range of production/harvest", required: true, severityIfMissing: "critical" },
          { name: "supplier_identity", description: "Supplier name, address, and email", required: true, severityIfMissing: "critical" },
          { name: "deforestation_free_evidence", description: "Evidence products are deforestation-free (post 31 Dec 2020)", required: true, severityIfMissing: "critical" },
          { name: "legality_evidence", description: "Compliance with country-of-production legislation", required: true, severityIfMissing: "critical" },
          { name: "risk_assessment_conclusion", description: "Risk assessment conclusion", required: true, severityIfMissing: "critical" },
          { name: "operator_declaration", description: "Formal declaration of due diligence", required: true, severityIfMissing: "critical" },
          { name: "reference_number", description: "Due diligence statement reference number", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
        ],
        minimumAcceptable: { mustHave: ["reference_number", "operator_declaration", "geolocation_plots"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "UK is developing its own deforestation-free supply chain framework. Until UK-specific legislation applies, EUDR compliance is recommended for goods also destined for EU markets. The same due diligence statement format applies.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["EUDR", "operator registration", "Information System", "registration", "due diligence system"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "operatorName", description: "Operator/trader legal name", required: true, severityIfMissing: "critical" },
          { name: "eoriNumber", description: "EORI number", required: true, severityIfMissing: "critical" },
          { name: "registrationNumber", description: "EUDR Information System registration number", required: true, severityIfMissing: "critical" },
          { name: "memberState", description: "EU Member State of registration", required: true, severityIfMissing: "critical" },
          { name: "registrationDate", description: "Date of registration", required: true, severityIfMissing: "warning" },
          { name: "commoditiesInScope", description: "EUDR commodities in scope (cocoa, coffee, palm oil, soy, wood, rubber, cattle)", required: true, severityIfMissing: "critical" },
          { name: "contactDetails", description: "Operator contact details (address, email)", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["registrationNumber", "operatorName", "eoriNumber"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["EUDR", "operator registration", "due diligence system", "registration"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "operatorName", description: "Operator/trader legal name", required: true, severityIfMissing: "critical" },
          { name: "eoriNumber", description: "GB EORI number", required: true, severityIfMissing: "critical" },
          { name: "registrationNumber", description: "Registration reference number", required: true, severityIfMissing: "critical" },
          { name: "registrationDate", description: "Date of registration", required: true, severityIfMissing: "warning" },
          { name: "commoditiesInScope", description: "Commodities covered by operator registration", required: true, severityIfMissing: "critical" },
          { name: "contactDetails", description: "Operator contact details", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["registrationNumber", "operatorName"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Swiss Due Diligence", "Due Diligence Act", "timber", "minerals", "FOEN", "BAFU", "supply chain"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "importerName", description: "Swiss importer name and UID", required: true, severityIfMissing: "critical" },
          { name: "commodityType", description: "Commodity type (timber, minerals, or future EUDR commodities)", required: true, severityIfMissing: "critical" },
          { name: "supplyChainMapping", description: "Supply chain documentation from production to import", required: true, severityIfMissing: "critical" },
          { name: "countryOfProduction", description: "Country of production/harvest", required: true, severityIfMissing: "critical" },
          { name: "legalityEvidence", description: "Evidence of legal harvest/production in country of origin", required: true, severityIfMissing: "critical" },
          { name: "riskAssessment", description: "Risk assessment for illegal harvesting or sourcing", required: true, severityIfMissing: "critical" },
          { name: "mitigationMeasures", description: "Risk mitigation measures implemented (if non-negligible risk)", required: false, severityIfMissing: "warning" },
          { name: "declarationDate", description: "Date of due diligence declaration", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of production does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["importerName", "commodityType", "legalityEvidence", "riskAssessment"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Swiss Due Diligence Act currently covers timber (EU Timber Regulation equivalent) and minerals (conflict minerals due diligence). Cocoa, coffee, and other EUDR commodities are expected to be added — monitor FOEN/BAFU for scope expansion. Prepare EUDR-equivalent documentation now.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["ISF", "Importer Security Filing", "10+2", "security filing", "ACE", "CBP"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary", "packing list"],
        },
        expectedFields: [
          // 10 Importer elements per 19 CFR 149.3
          { name: "sellerName", description: "ISF-1: Seller (owner) name and address", required: true, severityIfMissing: "critical" },
          { name: "buyerName", description: "ISF-2: Buyer (purchaser) name and address", required: true, severityIfMissing: "critical" },
          { name: "importerOfRecordNumber", description: "ISF-3: Importer of Record number (IOR#) or FTZ applicant ID", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "ISF-4: Consignee number(s)", required: true, severityIfMissing: "critical" },
          { name: "manufacturerName", description: "ISF-5: Manufacturer (or supplier) name and address", required: true, severityIfMissing: "critical" },
          { name: "shipToParty", description: "ISF-6: Ship-to party name and address", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "ISF-7: Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "htsusNumber", description: "ISF-8: HTSUS number (6-digit minimum)", required: true, severityIfMissing: "critical" },
          { name: "containerStuffingLocation", description: "ISF-9: Container stuffing location", required: true, severityIfMissing: "critical" },
          { name: "consolidatorName", description: "ISF-10: Consolidator (stuffer) name and address", required: true, severityIfMissing: "critical" },
          // 2 Carrier elements
          { name: "vesselStowPlan", description: "Carrier-1: Vessel stow plan (submitted by carrier)", required: false, severityIfMissing: "info" },
          { name: "containerStatusMessages", description: "Carrier-2: Container status messages", required: false, severityIfMissing: "info" },
          // Filing metadata
          { name: "isfBondNumber", description: "ISF bond reference (continuous or single-transaction)", required: true, severityIfMissing: "critical" },
          { name: "billOfLadingNumber", description: "Master or house B/L number linked to ISF", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "HTSUS number does not match expected commodity." },
        ],
        minimumAcceptable: { mustHave: ["importerOfRecordNumber", "manufacturerName", "countryOfOrigin", "htsusNumber", "containerStuffingLocation"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "ISF must be filed via ACE at least 24 hours before vessel loading at foreign port. $5,000 penalty per violation for late/inaccurate filing. ISF-5 (manufacturer) is the most commonly corrected element. Flexible filing is allowed for elements 1-8 (can be updated until 24 hours before arrival), but elements 9-10 must be accurate at initial filing.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["customs bond", "surety bond", "CBP Form 301", "continuous bond", "single entry bond", "import bond"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          { name: "bondNumber", description: "Customs bond number (STB or continuous bond reference)", required: true, severityIfMissing: "critical" },
          { name: "bondType", description: "Bond type: continuous (CBP Form 301) or single-entry (single-transaction bond)", required: true, severityIfMissing: "critical" },
          { name: "principalName", description: "Principal (importer) name and address", required: true, severityIfMissing: "critical" },
          { name: "principalIorNumber", description: "Importer of Record number or EIN/SSN", required: true, severityIfMissing: "critical" },
          { name: "suretyCompany", description: "Surety company name and Treasury Department number", required: true, severityIfMissing: "critical" },
          { name: "suretyCode", description: "3-digit surety code (from Treasury Circular 570)", required: true, severityIfMissing: "critical" },
          { name: "bondAmount", description: "Bond amount in USD", required: true, severityIfMissing: "critical" },
          { name: "effectiveDate", description: "Bond effective date", required: true, severityIfMissing: "critical" },
          { name: "expirationDate", description: "Bond expiration date (continuous bonds: annual renewal)", required: false, severityIfMissing: "warning" },
          { name: "activityCodes", description: "Activity code(s) covered: 1 (importer/broker), 1a (drawback), 2 (custodian), etc.", required: true, severityIfMissing: "warning" },
          { name: "portCode", description: "Port code or nationwide (for continuous bonds)", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Bond amount must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Bond currency should be USD." },
        ],
        minimumAcceptable: { mustHave: ["bondNumber", "principalName", "suretyCompany", "bondAmount"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Minimum continuous bond = $50,000. Single-entry bond = duty + taxes + fees (minimum $100). CBP Form 301 is the standard bond form. Surety must be on Treasury Circular 570 approved list. Bond must be active before entry filing.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Prior Notice", "PNSI", "FDA", "Bioterrorism Act", "food import", "prior notice confirmation"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          // Per 21 CFR 1.281 — required data elements
          { name: "priorNoticeConfirmation", description: "PN confirmation number (from PNSI or ACE/ABI)", required: true, severityIfMissing: "critical" },
          { name: "submitterName", description: "Name and contact info of person submitting PN", required: true, severityIfMissing: "critical" },
          { name: "transmitterName", description: "Name of transmitter (if different from submitter)", required: false, severityIfMissing: "info" },
          { name: "importerOfRecord", description: "Importer of Record (IOR) name and IOR#/DUNS/FDA registration", required: true, severityIfMissing: "critical" },
          { name: "fceRegistrationNumber", description: "FDA Food Facility Registration number (FFR) of foreign manufacturer", required: true, severityIfMissing: "critical" },
          { name: "manufacturerName", description: "Manufacturer/processor name, address, country", required: true, severityIfMissing: "critical" },
          { name: "growerName", description: "Grower name and address (if known, for raw agricultural commodities)", required: false, severityIfMissing: "warning" },
          { name: "productDescription", description: "Complete description of food article", required: true, severityIfMissing: "critical" },
          { name: "fdaProductCode", description: "FDA product code (7-character)", required: true, severityIfMissing: "critical" },
          { name: "commonName", description: "Common/usual name or market name of food", required: true, severityIfMissing: "critical" },
          { name: "estimatedQuantity", description: "Estimated quantity (with unit of measure)", required: true, severityIfMissing: "critical" },
          { name: "arrivalInfo", description: "Anticipated arrival — port, date, and time", required: true, severityIfMissing: "critical" },
          { name: "modeOfTransport", description: "Mode of transport (ocean, air, truck, rail)", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country from which article originates", required: true, severityIfMissing: "critical" },
          { name: "countryOfShipment", description: "Country from which article is shipped", required: true, severityIfMissing: "warning" },
          { name: "shipperName", description: "Shipper name and address", required: true, severityIfMissing: "critical" },
          { name: "carrierInfo", description: "Carrier name and conveyance identification", required: true, severityIfMissing: "warning" },
          { name: "entryNumber", description: "Entry number or BOL number", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "FDA product code should correspond to expected commodity type." },
        ],
        minimumAcceptable: { mustHave: ["priorNoticeConfirmation", "importerOfRecord", "fceRegistrationNumber", "productDescription", "arrivalInfo"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Filing deadlines: ocean 8 hours, air 4 hours, truck/rail 2 hours before arrival. FDA facility registration (FURLS) must be current — renewed biennially in even years (Oct-Dec). PN can be filed via PNSI web interface or through ACE/ABI. FDA may issue a 'May Proceed' or hold ('Refused/Detained') based on PN review.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["FSVP", "Foreign Supplier Verification", "FSMA", "supplier verification", "hazard analysis"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "fsvpImporterName", description: "FSVP Importer name and DUNS number", required: true, severityIfMissing: "critical" },
          { name: "foreignSupplierName", description: "Foreign supplier name, address, and country", required: true, severityIfMissing: "critical" },
          { name: "foodDescription", description: "Description of food imported from this supplier", required: true, severityIfMissing: "critical" },
          { name: "hazardAnalysis", description: "Hazard analysis identifying known/foreseeable hazards for each food", required: true, severityIfMissing: "critical" },
          { name: "supplierEvaluation", description: "Evaluation of foreign supplier's performance and food safety practices", required: true, severityIfMissing: "critical" },
          { name: "verificationActivities", description: "Verification activities performed (audit, sampling, testing, review)", required: true, severityIfMissing: "critical" },
          { name: "verificationFrequency", description: "Frequency of verification activities", required: false, severityIfMissing: "warning" },
          { name: "correctiveActions", description: "Corrective action procedures when issues identified", required: true, severityIfMissing: "warning" },
          { name: "reassessmentDate", description: "Date of most recent FSVP reassessment", required: false, severityIfMissing: "warning" },
          { name: "recordRetentionPeriod", description: "Confirmation records retained for 2 years minimum", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Foreign supplier country does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["fsvpImporterName", "foreignSupplierName", "hazardAnalysis", "verificationActivities"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "FSVP is a per-supplier program, not per-shipment. Records must be maintained for 2 years. FDA inspects FSVP compliance during importer audits. Very small importers and importers of certain low-risk foods have modified requirements. Qualified auditor certifications may be required for high-risk foods.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["APHIS", "PPQ", "import permit", "phytosanitary", "plant health", "eFile", "PCIT"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "permitNumber", description: "APHIS import permit number (PPQ 587 or eFile reference)", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Permittee name and address", required: true, severityIfMissing: "critical" },
          { name: "commodityDescription", description: "Description of regulated article (plant, plant product)", required: true, severityIfMissing: "critical" },
          { name: "scientificName", description: "Scientific name (genus/species) of plant material", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin of plant material", required: true, severityIfMissing: "critical" },
          { name: "intendedUse", description: "Intended use: propagation, consumption, processing, research", required: true, severityIfMissing: "warning" },
          { name: "portOfEntry", description: "Designated US port of entry for APHIS inspection", required: true, severityIfMissing: "critical" },
          { name: "phytoCertificateRef", description: "Phytosanitary certificate number from origin NPPO", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Quantity and unit of measure", required: true, severityIfMissing: "critical" },
          { name: "treatmentDetails", description: "Treatment or condition requirements specified in permit", required: false, severityIfMissing: "warning" },
          { name: "additionalDeclarations", description: "Additional declarations required by APHIS (pest-free status)", required: false, severityIfMissing: "warning" },
          { name: "transitPermitRef", description: "Transit permit number (if goods transit through US)", required: false, severityIfMissing: "info" },
          { name: "validityPeriod", description: "Permit validity dates", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "phyto_within_14_days", severity: "critical", message: "Phytosanitary certificate must be valid and current." },
        ],
        minimumAcceptable: { mustHave: ["permitNumber", "scientificName", "countryOfOrigin", "phytoCertificateRef"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Permits are filed via APHIS eFile system. Some commodities may not require a permit but still need a phytosanitary certificate. Check APHIS PCIT (Phytosanitary Certificate Issuance and Tracking) database for commodity-origin specific requirements. CBP inspects at port of entry; non-compliant shipments face treatment, re-export, or destruction.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Lacey Act", "PPQ 505", "plant declaration", "LAWGS", "ACE plant", "timber declaration"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          // Per Lacey Act declaration requirements (16 USC 3372(f))
          { name: "declarantName", description: "Importer name and address", required: true, severityIfMissing: "critical" },
          { name: "scientificName", description: "Scientific name (genus + species) of plant/timber", required: true, severityIfMissing: "critical" },
          { name: "commonName", description: "Common name of the plant product", required: true, severityIfMissing: "warning" },
          { name: "countryOfHarvest", description: "Country where plant/timber was harvested", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Quantity of plant product (number, weight, or volume)", required: true, severityIfMissing: "critical" },
          { name: "unitOfMeasure", description: "Unit of measure for quantity", required: true, severityIfMissing: "critical" },
          { name: "valueUsd", description: "Value of the plant product (in USD)", required: true, severityIfMissing: "critical" },
          { name: "htsusCode", description: "HTSUS tariff classification code", required: true, severityIfMissing: "critical" },
          { name: "percentRecycled", description: "Percent recycled content (if applicable)", required: false, severityIfMissing: "info" },
          { name: "entryNumber", description: "CBP entry number", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of harvest does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "HTSUS code does not match expected plant/timber product." },
          { type: "numeric_positive", severity: "critical", message: "Quantity and value must be positive." },
        ],
        minimumAcceptable: { mustHave: ["scientificName", "countryOfHarvest", "quantity", "valueUsd"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "As of January 2026, paper PPQ 505 forms are eliminated — electronic filing only via ACE/LAWGS (Lacey Act Web Governance System). Phase VII expanded scope to additional HS chapters. Penalties: civil up to $10,000, criminal up to $250,000 + 5 years imprisonment for knowing violations. 'Due care' defense available for unknowing violations.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["AGOA", "African Growth and Opportunity", "GSP", "preference", "duty-free", "Chapter 9819"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "certificateOfOrigin", description: "Certificate of Origin supporting AGOA eligibility", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and address in AGOA-eligible country", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "US importer name and IOR number", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of goods claimed under AGOA", required: true, severityIfMissing: "critical" },
          { name: "htsusCode", description: "HTSUS code (with AGOA-specific tariff line under Chapter 9819)", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "AGOA-eligible country of origin", required: true, severityIfMissing: "critical" },
          { name: "valueAddedPercentage", description: "35% value-added content from beneficiary country (direct cost of processing)", required: true, severityIfMissing: "critical" },
          { name: "totalValue", description: "Total value of goods (for 35% value-add calculation)", required: true, severityIfMissing: "critical" },
          { name: "agoaVisaStamp", description: "AGOA visa/endorsement stamp (for textile/apparel articles)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin may not be AGOA-eligible — verify eligibility." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "HTSUS code should fall under AGOA-eligible tariff lines." },
          { type: "numeric_positive", severity: "critical", message: "Value and percentage must be positive." },
        ],
        minimumAcceptable: { mustHave: ["certificateOfOrigin", "countryOfOrigin", "htsusCode", "valueAddedPercentage"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "AGOA covers 1,800+ products from 32 eligible Sub-Saharan African countries. Expires December 2026. 35% value-add can be cumulated across AGOA beneficiary countries. AGOA does NOT override reciprocal tariffs. Textile/apparel has separate AGOA provisions under the 'third-country fabric' provision.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["OFAC", "sanctions", "SDN", "screening", "compliance", "blocked persons", "embargo"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "screeningDate", description: "Date sanctions screening was performed", required: true, severityIfMissing: "critical" },
          { name: "screenedParties", description: "List of all parties screened (supplier, banks, agents, beneficial owners)", required: true, severityIfMissing: "critical" },
          { name: "sdnListVersion", description: "SDN list version/date used for screening", required: true, severityIfMissing: "critical" },
          { name: "screeningResult", description: "Result: clear / match found / false positive resolved", required: true, severityIfMissing: "critical" },
          { name: "sanctionsProgram", description: "Applicable sanctions program (country-based or list-based)", required: true, severityIfMissing: "critical" },
          { name: "screeningTool", description: "Screening tool or service used", required: false, severityIfMissing: "warning" },
          { name: "falsePositiveResolution", description: "Documentation of false positive resolution (if any match)", required: false, severityIfMissing: "warning" },
          { name: "complianceOfficer", description: "Name of compliance officer who approved the transaction", required: true, severityIfMissing: "warning" },
          { name: "retentionPeriod", description: "Confirmation records will be retained for 5 years per OFAC", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Screening date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["screeningDate", "screenedParties", "screeningResult"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "OFAC civil penalty: up to $330,000 per violation. Screen against SDN List, Consolidated Sanctions List, and sector-specific lists. Re-screen at each transaction touchpoint. Voluntary self-disclosure of violations significantly reduces penalties. 50% rule: entity owned 50%+ by SDN-listed person is also blocked.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["tariff", "duty rate", "reciprocal", "Section 122", "additional duty", "entry summary", "Form 7501"],
          rejectIfContainsAny: ["phytosanitary", "certificate of origin", "CITES"],
        },
        expectedFields: [
          { name: "entryNumber", description: "CBP entry number (11-digit)", required: true, severityIfMissing: "critical" },
          { name: "entrySummaryNumber", description: "Entry summary number (Form 7501)", required: true, severityIfMissing: "critical" },
          { name: "importerOfRecord", description: "Importer of Record name and IOR number", required: true, severityIfMissing: "critical" },
          { name: "htsusCode", description: "HTSUS classification code (10-digit)", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin determining reciprocal rate", required: true, severityIfMissing: "critical" },
          { name: "mfnDutyRate", description: "MFN (Most Favored Nation) duty rate", required: true, severityIfMissing: "critical" },
          { name: "reciprocalTariffRate", description: "Reciprocal tariff rate for country of origin", required: true, severityIfMissing: "critical" },
          { name: "customsValue", description: "Customs value (transaction value, CIF)", required: true, severityIfMissing: "critical" },
          { name: "totalDutyOwed", description: "Total duty amount (MFN + reciprocal + any other additional duties)", required: true, severityIfMissing: "critical" },
          { name: "portOfEntry", description: "US port of entry code", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "HTSUS code does not match expected commodity." },
          { type: "numeric_positive", severity: "critical", message: "Duty rates and values must be positive." },
        ],
        minimumAcceptable: { mustHave: ["htsusCode", "countryOfOrigin", "reciprocalTariffRate", "customsValue"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["audit trail", "compliance record", "TwinLog", "reasonable care", "import record", "SHA-256"],
          rejectIfContainsAny: ["invoice", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "tradeReference", description: "Internal trade/shipment reference number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer of Record name", required: true, severityIfMissing: "critical" },
          { name: "entryDate", description: "Date of customs entry", required: true, severityIfMissing: "critical" },
          { name: "commodityDescription", description: "Description of imported goods", required: true, severityIfMissing: "critical" },
          { name: "htsusClassification", description: "HTSUS classification used at entry", required: true, severityIfMissing: "critical" },
          { name: "classificationBasis", description: "Basis for tariff classification (ruling, precedent, broker advice)", required: false, severityIfMissing: "warning" },
          { name: "valuation", description: "Customs valuation method and declared value", required: true, severityIfMissing: "critical" },
          { name: "dutyPaid", description: "Duty amount paid", required: true, severityIfMissing: "critical" },
          { name: "complianceChecksSummary", description: "Summary of compliance checks performed (SPS, EUDR, CITES, etc.)", required: true, severityIfMissing: "critical" },
          { name: "integrityHash", description: "SHA-256 hash of the compliance record", required: false, severityIfMissing: "info" },
          { name: "retentionConfirmation", description: "Confirmation records retained for 5 years per 19 USC 1508", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Entry date should not be in the future." },
          { type: "numeric_positive", severity: "critical", message: "Duty amount must be positive." },
        ],
        minimumAcceptable: { mustHave: ["tradeReference", "importerName", "htsusClassification", "complianceChecksSummary"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["HTSUS", "tariff classification", "harmonized tariff", "binding ruling", "tariff schedule", "HTS"],
          rejectIfContainsAny: ["invoice", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "htsusCode", description: "10-digit HTSUS classification code", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Detailed product description supporting classification", required: true, severityIfMissing: "critical" },
          { name: "generalDutyRate", description: "General (MFN/NTR) duty rate for classified product", required: true, severityIfMissing: "critical" },
          { name: "specialDutyRate", description: "Special duty rate (AGOA, GSP, FTA) if applicable", required: false, severityIfMissing: "warning" },
          { name: "statisticalSuffix", description: "Statistical suffix (2 digits)", required: false, severityIfMissing: "info" },
          { name: "unitOfQuantity", description: "Unit(s) of quantity for the tariff line", required: true, severityIfMissing: "warning" },
          { name: "pgaFlags", description: "Partner Government Agency (PGA) flags triggered by this HTS code (FDA, APHIS, EPA, etc.)", required: false, severityIfMissing: "warning" },
          { name: "bindingRulingRef", description: "CBP binding ruling reference (if obtained)", required: false, severityIfMissing: "info" },
          { name: "classificationRationale", description: "Rationale for classification choice (GRI rules applied)", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "critical", message: "HTSUS code does not match expected commodity type." },
        ],
        minimumAcceptable: { mustHave: ["htsusCode", "productDescription", "generalDutyRate"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "US HTSUS is 10 digits (international HS is 6). Misclassification is the #1 cause of CBP penalties. GRI (General Rules of Interpretation) determine classification. Consider requesting CBP binding ruling for complex products. PGA flags determine which agencies require additional clearance.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Section 232", "national security", "steel tariff", "aluminium tariff", "aluminum tariff", "trade expansion"],
          rejectIfContainsAny: ["invoice", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "entryNumber", description: "CBP entry number", required: true, severityIfMissing: "critical" },
          { name: "htsusCode", description: "HTSUS code for steel/aluminium product", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of steel/aluminium product", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (determines if Section 232 applies)", required: true, severityIfMissing: "critical" },
          { name: "section232Rate", description: "Applicable Section 232 tariff rate (25% steel / 10% aluminium)", required: true, severityIfMissing: "critical" },
          { name: "customsValue", description: "Customs value of the imported goods", required: true, severityIfMissing: "critical" },
          { name: "section232DutyAmount", description: "Section 232 additional duty amount", required: true, severityIfMissing: "critical" },
          { name: "exclusionReference", description: "Section 232 product exclusion reference (if applicable)", required: false, severityIfMissing: "warning" },
          { name: "quotaStatus", description: "Quota allocation status (for countries with quota-based exemptions)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "numeric_positive", severity: "critical", message: "Duty amount and customs value must be positive." },
        ],
        minimumAcceptable: { mustHave: ["htsusCode", "countryOfOrigin", "section232Rate", "section232DutyAmount"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Section 232 tariffs stack on top of MFN duty AND reciprocal tariffs. Some countries have quota-based arrangements instead of tariffs. Product-specific exclusions available via the Section 232 Exclusion Portal. Steel = 25%, Aluminium = 10% (Proclamation 9704/9705).",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["FSIS", "meat inspection", "poultry inspection", "food safety inspection", "USDA inspection", "slaughter", "import inspection"],
          rejectIfContainsAny: ["invoice", "phytosanitary", "certificate of origin", "bill of lading"],
        },
        expectedFields: [
          { name: "exportingCountry", description: "Country of export (must have FSIS equivalence determination)", required: true, severityIfMissing: "critical" },
          { name: "establishmentNumber", description: "Foreign establishment number (must be FSIS-approved/listed)", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of meat/poultry/egg product", required: true, severityIfMissing: "critical" },
          { name: "foreignInspectionCertificate", description: "Foreign government inspection certificate number", required: true, severityIfMissing: "critical" },
          { name: "inspectorSignature", description: "Foreign government inspector signature and stamp", required: true, severityIfMissing: "critical" },
          { name: "productCode", description: "FSIS product category code", required: true, severityIfMissing: "warning" },
          { name: "quantity", description: "Quantity (number of cases, net weight)", required: true, severityIfMissing: "critical" },
          { name: "lotNumbers", description: "Production lot/batch numbers", required: true, severityIfMissing: "warning" },
          { name: "labelApproval", description: "FSIS label approval number (all labels must be pre-approved)", required: true, severityIfMissing: "critical" },
          { name: "usPortOfEntry", description: "US port of entry for FSIS re-inspection", required: true, severityIfMissing: "critical" },
          { name: "containerSealNumbers", description: "Container and seal numbers", required: false, severityIfMissing: "warning" },
          { name: "temperatureCompliance", description: "Temperature compliance during transport", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Exporting country may not have FSIS equivalence — verify." },
          { type: "numeric_positive", severity: "critical", message: "Quantity must be positive." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["exportingCountry", "establishmentNumber", "foreignInspectionCertificate", "labelApproval"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Very few African countries have FSIS equivalence: Namibia/Botswana (beef), South Africa (ostrich, game meat). Each foreign establishment must be individually listed by FSIS. All labels require pre-approval. FSIS performs re-inspection at US port of entry — 100% documentary and identity checks, risk-based physical examination.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Kimberley", "KPC", "rough diamond", "conflict-free diamond", "diamond certificate"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          // Per Kimberley Process Certification Scheme (KPCS) minimum requirements
          { name: "certificateNumber", description: "Unique KPC serial number", required: true, severityIfMissing: "critical" },
          { name: "exportingCountry", description: "Exporting KP participant country", required: true, severityIfMissing: "critical" },
          { name: "importingCountry", description: "Importing KP participant country", required: true, severityIfMissing: "critical" },
          { name: "exportingAuthority", description: "Name and details of exporting KP authority", required: true, severityIfMissing: "critical" },
          { name: "caratWeight", description: "Carat weight of rough diamonds", required: true, severityIfMissing: "critical" },
          { name: "valueUsd", description: "Value in US dollars", required: true, severityIfMissing: "critical" },
          { name: "numberOfParcels", description: "Number of parcels in the shipment", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS code (71.02 for rough diamonds)", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer name and address", required: true, severityIfMissing: "critical" },
          { name: "dateOfIssue", description: "Date of certificate issue", required: true, severityIfMissing: "critical" },
          { name: "dateOfExpiry", description: "Certificate expiry date (valid 60 days from issue)", required: true, severityIfMissing: "critical" },
          { name: "tamperProofSeal", description: "Tamper-proof container seal number", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Exporting country does not match trade context." },
          { type: "numeric_positive", severity: "critical", message: "Carat weight and value must be positive." },
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "exportingCountry", "caratWeight", "tamperProofSeal"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "KPC is valid for 60 days from issuance. Broken seals invalidate the shipment. Both exporting and importing countries must be KP participants. HS 71.02 only — polished diamonds do not require KPC. African KP participants include Botswana, DRC, Sierra Leone, South Africa, Zimbabwe, Angola, Ghana, Tanzania, etc.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["conflict minerals", "CMRT", "3TG", "due diligence", "RMI", "Responsible Minerals", "Dodd-Frank", "Regulation 2017/821"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          // CMRT (Conflict Minerals Reporting Template) structure
          { name: "companyName", description: "Reporting company name and unique identifier", required: true, severityIfMissing: "critical" },
          { name: "reportingPeriod", description: "Reporting period (calendar year)", required: true, severityIfMissing: "critical" },
          { name: "mineralsInScope", description: "Which 3TG minerals are in scope: Tin, Tantalum, Tungsten, Gold", required: true, severityIfMissing: "critical" },
          { name: "smelterList", description: "List of identified smelters/refiners in supply chain (name, facility ID, location)", required: true, severityIfMissing: "critical" },
          { name: "smelterConformanceStatus", description: "RMAP (Responsible Minerals Assurance Process) conformance status of each smelter", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin of minerals (mine-level if possible)", required: true, severityIfMissing: "critical" },
          { name: "conflictAreaAssessment", description: "Assessment of whether minerals originate from conflict-affected or high-risk areas (CAHRAs)", required: true, severityIfMissing: "critical" },
          { name: "dueDiligenceFramework", description: "Due diligence framework used (OECD DDG, EU Regulation)", required: true, severityIfMissing: "warning" },
          { name: "thirdPartyAuditRef", description: "Reference to independent third-party audit (if performed)", required: false, severityIfMissing: "warning" },
          { name: "mitigationMeasures", description: "Risk mitigation measures implemented", required: false, severityIfMissing: "warning" },
          { name: "productList", description: "List of products containing 3TG minerals", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin of minerals should match trade context." },
        ],
        minimumAcceptable: { mustHave: ["companyName", "mineralsInScope", "smelterList", "conflictAreaAssessment"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "EU Regulation 2017/821 applies to EU importers of tin, tantalum, tungsten, and gold above volume thresholds. US Dodd-Frank Section 1502 applies to SEC-reporting companies. CMRT is the standard template from the Responsible Minerals Initiative (RMI). RMAP-conformant smelters are considered low-risk.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["supply chain", "chain of custody", "mine to export", "smelter", "OECD", "5-step", "traceability", "mineral origin"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "exporterName", description: "Exporter/mining company name and registration", required: true, severityIfMissing: "critical" },
          { name: "mineOfOrigin", description: "Mine name, location (GPS if available), and operating licence", required: true, severityIfMissing: "critical" },
          { name: "mineralType", description: "Mineral type (tin ore, coltan, wolframite, gold, etc.)", required: true, severityIfMissing: "critical" },
          { name: "supplyChainActors", description: "All intermediary actors from mine to export point", required: true, severityIfMissing: "critical" },
          { name: "smelterRefinerIdentity", description: "Smelter/refiner name, country, and facility ID", required: true, severityIfMissing: "critical" },
          { name: "businessLicences", description: "Business licences of each supply chain actor", required: true, severityIfMissing: "warning" },
          { name: "mineralOriginCertificate", description: "Certificate of mineral origin from government authority", required: true, severityIfMissing: "critical" },
          { name: "transportDocuments", description: "Transport documents linking each chain segment", required: true, severityIfMissing: "warning" },
          { name: "quantityTracked", description: "Quantity tracked at each stage (kg or tonnes)", required: true, severityIfMissing: "critical" },
          { name: "oecdStepCompliance", description: "Compliance status with OECD 5-step framework (steps 1-5)", required: true, severityIfMissing: "critical" },
          { name: "lastUpdateDate", description: "Date of last supply chain mapping update", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Mine of origin country does not match trade context." },
          { type: "numeric_positive", severity: "critical", message: "Quantities must be positive." },
        ],
        minimumAcceptable: { mustHave: ["mineOfOrigin", "smelterRefinerIdentity", "supplyChainActors", "mineralType"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CBAM", "carbon", "emissions", "CO2", "greenhouse gas", "embedded emissions"],
          shouldContainAny: ["tonnes CO2", "tCO2", "direct emissions", "indirect emissions", "Regulation 2023/956"],
          rejectIfContainsAny: ["phytosanitary", "certificate of origin", "packing list"],
        },
        expectedFields: [
          // Installation/producer identification (Regulation 2023/956 Art. 6 + Annex IV)
          { name: "installationName", description: "Name of the production installation/facility", required: true, severityIfMissing: "critical" },
          { name: "installationLocation", description: "Address and country of the production installation", required: true, severityIfMissing: "critical" },
          { name: "operatorName", description: "Name of the installation operator/producer", required: true, severityIfMissing: "critical" },
          // Product identification
          { name: "goodsType", description: "Type of CBAM goods (cement, iron/steel, aluminium, fertilisers, electricity, hydrogen)", required: true, severityIfMissing: "critical" },
          { name: "cnCode", description: "Combined Nomenclature (CN) code of the goods", required: true, severityIfMissing: "critical" },
          { name: "quantityImported", description: "Quantity of goods imported (tonnes)", required: true, severityIfMissing: "critical" },
          // Emissions data
          { name: "directEmissions", description: "Direct (Scope 1) embedded emissions in tonnes CO2e per tonne of product", required: true, severityIfMissing: "critical" },
          { name: "indirectEmissions", description: "Indirect (Scope 2) embedded emissions from electricity in tonnes CO2e per tonne of product", required: true, severityIfMissing: "critical" },
          { name: "totalEmbeddedEmissions", description: "Total embedded emissions for the declared quantity (tonnes CO2e)", required: true, severityIfMissing: "critical" },
          { name: "emissionsMethodology", description: "Methodology used to calculate emissions (actual values or default values)", required: true, severityIfMissing: "warning" },
          // Carbon price paid in country of origin
          { name: "carbonPricePaid", description: "Any carbon price already paid in country of production (for deduction)", required: false, severityIfMissing: "warning" },
          // Verification
          { name: "verifierName", description: "Name of accredited verifier (if actual values used)", required: false, severityIfMissing: "warning" },
          { name: "verificationDate", description: "Date of emissions verification", required: false, severityIfMissing: "info" },
          // Period
          { name: "reportingPeriod", description: "Reporting period covered by this declaration", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "CN code does not match expected CBAM goods category." },
          { type: "numeric_positive", severity: "critical", message: "Emissions values must be positive numbers." },
        ],
        minimumAcceptable: { mustHave: ["installationName", "goodsType", "totalEmbeddedEmissions"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CBAM", "carbon", "emissions", "CO2", "greenhouse gas", "UK CBAM", "embedded emissions"],
          shouldContainAny: ["tonnes CO2", "tCO2", "direct emissions", "indirect emissions"],
          rejectIfContainsAny: ["phytosanitary", "certificate of origin", "packing list"],
        },
        expectedFields: [
          { name: "installationName", description: "Name of the production installation/facility", required: true, severityIfMissing: "critical" },
          { name: "installationLocation", description: "Address and country of the production installation", required: true, severityIfMissing: "critical" },
          { name: "operatorName", description: "Name of the installation operator/producer", required: true, severityIfMissing: "critical" },
          { name: "goodsType", description: "Type of CBAM goods (cement, iron/steel, aluminium, fertilisers, electricity, hydrogen)", required: true, severityIfMissing: "critical" },
          { name: "cnCode", description: "Commodity code of the goods", required: true, severityIfMissing: "critical" },
          { name: "quantityImported", description: "Quantity of goods imported (tonnes)", required: true, severityIfMissing: "critical" },
          { name: "directEmissions", description: "Direct (Scope 1) embedded emissions in tonnes CO2e per tonne", required: true, severityIfMissing: "critical" },
          { name: "indirectEmissions", description: "Indirect (Scope 2) emissions from electricity", required: true, severityIfMissing: "critical" },
          { name: "totalEmbeddedEmissions", description: "Total embedded emissions (tonnes CO2e)", required: true, severityIfMissing: "critical" },
          { name: "emissionsMethodology", description: "Methodology: actual values or default values", required: true, severityIfMissing: "warning" },
          { name: "carbonPricePaid", description: "Carbon price paid in country of production", required: false, severityIfMissing: "warning" },
          { name: "reportingPeriod", description: "Reporting period covered", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "Commodity code does not match CBAM goods category." },
          { type: "numeric_positive", severity: "critical", message: "Emissions values must be positive." },
        ],
        minimumAcceptable: { mustHave: ["installationName", "goodsType", "totalEmbeddedEmissions"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "UK CBAM mirrors EU CBAM with UK-specific implementation timeline. UK ETS carbon price applies. Transitional period reporting only initially. Same six goods categories as EU CBAM.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CBAM certificate", "carbon certificate", "emissions certificate", "CBAM registry", "surrender", "carbon border"],
          rejectIfContainsAny: ["phytosanitary", "certificate of origin", "packing list"],
        },
        expectedFields: [
          { name: "certificateNumber", description: "CBAM certificate number(s) from national registry", required: true, severityIfMissing: "critical" },
          { name: "declarantName", description: "Authorised CBAM declarant name and registration number", required: true, severityIfMissing: "critical" },
          { name: "goodsType", description: "CBAM goods category covered", required: true, severityIfMissing: "critical" },
          { name: "embeddedEmissions", description: "Total embedded emissions (tonnes CO2e) covered by certificates", required: true, severityIfMissing: "critical" },
          { name: "certificatePrice", description: "Price per CBAM certificate (linked to EU ETS weekly average)", required: true, severityIfMissing: "critical" },
          { name: "totalCost", description: "Total cost of CBAM certificates", required: true, severityIfMissing: "critical" },
          { name: "carbonPriceDeduction", description: "Carbon price already paid in country of origin (deducted)", required: false, severityIfMissing: "warning" },
          { name: "surrenderDate", description: "Date certificates surrendered/declared", required: true, severityIfMissing: "critical" },
          { name: "reportingPeriod", description: "Calendar year / reporting period", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Certificate quantities and costs must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Currency should be EUR for EU CBAM certificates." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "declarantName", "embeddedEmissions"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CBAM certificate", "carbon certificate", "emissions certificate", "UK CBAM registry", "carbon border"],
          rejectIfContainsAny: ["phytosanitary", "certificate of origin", "packing list"],
        },
        expectedFields: [
          { name: "certificateNumber", description: "UK CBAM certificate number(s)", required: true, severityIfMissing: "critical" },
          { name: "declarantName", description: "Authorised UK CBAM declarant name and registration", required: true, severityIfMissing: "critical" },
          { name: "goodsType", description: "CBAM goods category covered", required: true, severityIfMissing: "critical" },
          { name: "embeddedEmissions", description: "Total embedded emissions (tonnes CO2e) covered", required: true, severityIfMissing: "critical" },
          { name: "certificatePrice", description: "Price per UK CBAM certificate (linked to UK ETS)", required: true, severityIfMissing: "critical" },
          { name: "totalCost", description: "Total cost of CBAM certificates (GBP)", required: true, severityIfMissing: "critical" },
          { name: "carbonPriceDeduction", description: "Carbon price already paid in country of origin", required: false, severityIfMissing: "warning" },
          { name: "surrenderDate", description: "Date certificates surrendered", required: true, severityIfMissing: "critical" },
          { name: "reportingPeriod", description: "Calendar year / reporting period", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Certificate quantities and costs must be positive." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "declarantName", "embeddedEmissions"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CSDDD", "due diligence", "human rights", "environmental impact", "Directive 2024/1760", "sustainability", "supply chain due diligence"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "companyName", description: "Reporting company name, registration, and Member State", required: true, severityIfMissing: "critical" },
          { name: "reportingPeriod", description: "Reporting period (fiscal year)", required: true, severityIfMissing: "critical" },
          { name: "supplyChainMapping", description: "Mapping of direct and indirect business relationships in value chain", required: true, severityIfMissing: "critical" },
          { name: "adverseImpactIdentification", description: "Identified actual or potential adverse human rights and environmental impacts", required: true, severityIfMissing: "critical" },
          { name: "preventionMeasures", description: "Prevention and mitigation measures implemented", required: true, severityIfMissing: "critical" },
          { name: "remediationActions", description: "Remediation actions for actual adverse impacts", required: false, severityIfMissing: "warning" },
          { name: "grievanceMechanism", description: "Complaints/grievance mechanism description", required: true, severityIfMissing: "warning" },
          { name: "climateTransitionPlan", description: "Climate transition plan aligned with Paris Agreement 1.5°C target", required: false, severityIfMissing: "warning" },
          { name: "monitoringProcess", description: "Periodic assessment and monitoring process description", required: true, severityIfMissing: "critical" },
          { name: "stakeholderEngagement", description: "Evidence of meaningful stakeholder engagement", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["companyName", "supplyChainMapping", "adverseImpactIdentification", "preventionMeasures"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "CSDDD (Directive 2024/1760) phases in from 2027 for largest companies (>5,000 employees + €1.5B turnover). By 2029 covers companies >1,000 employees + €450M. Member States may extend scope. Directors have a duty of care for due diligence implementation. Civil liability provisions apply.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CSDDD", "due diligence", "human rights", "environmental impact", "sustainability", "supply chain due diligence", "Modern Slavery"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "companyName", description: "Reporting company name and registration", required: true, severityIfMissing: "critical" },
          { name: "reportingPeriod", description: "Reporting period (fiscal year)", required: true, severityIfMissing: "critical" },
          { name: "supplyChainMapping", description: "Mapping of business relationships in value chain", required: true, severityIfMissing: "critical" },
          { name: "adverseImpactIdentification", description: "Identified adverse human rights and environmental impacts", required: true, severityIfMissing: "critical" },
          { name: "preventionMeasures", description: "Prevention and mitigation measures implemented", required: true, severityIfMissing: "critical" },
          { name: "remediationActions", description: "Remediation actions taken", required: false, severityIfMissing: "warning" },
          { name: "grievanceMechanism", description: "Complaints/grievance mechanism", required: true, severityIfMissing: "warning" },
          { name: "monitoringProcess", description: "Monitoring and assessment process", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["companyName", "supplyChainMapping", "adverseImpactIdentification"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "UK is developing its own framework parallel to EU CSDDD. Currently, UK Modern Slavery Act Section 54 requires transparency statements. Anticipate alignment with broader due diligence requirements.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["REACH", "ECHA", "registration", "Safety Data Sheet", "SDS", "SVHC", "substance registration", "EC 1907/2006"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "registrationNumber", description: "ECHA REACH registration number (format: 01-XXXXXXXXXX-XX-XXXX)", required: true, severityIfMissing: "critical" },
          { name: "substanceName", description: "Chemical substance name (IUPAC or common name)", required: true, severityIfMissing: "critical" },
          { name: "casNumber", description: "CAS (Chemical Abstracts Service) number", required: true, severityIfMissing: "critical" },
          { name: "ecNumber", description: "EC/EINECS number", required: false, severityIfMissing: "warning" },
          { name: "registrantName", description: "Registrant name (EU importer or Only Representative)", required: true, severityIfMissing: "critical" },
          { name: "tonnageBand", description: "Annual tonnage band (1-10t, 10-100t, 100-1000t, 1000t+)", required: true, severityIfMissing: "critical" },
          { name: "sdsProvided", description: "Safety Data Sheet (SDS) provided with 16 sections per Annex II", required: true, severityIfMissing: "critical" },
          { name: "hazardClassification", description: "CLP classification (GHS hazard classes/categories)", required: true, severityIfMissing: "critical" },
          { name: "svhcStatus", description: "Whether substance is on SVHC Candidate List (>0.1% w/w notification threshold)", required: true, severityIfMissing: "critical" },
          { name: "authorisationStatus", description: "Authorisation status (if on Annex XIV list)", required: false, severityIfMissing: "warning" },
          { name: "restrictionCompliance", description: "Compliance with Annex XVII restrictions", required: false, severityIfMissing: "warning" },
          { name: "onlyRepresentative", description: "Only Representative (OR) details if non-EU manufacturer uses OR", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["registrationNumber", "substanceName", "sdsProvided", "hazardClassification"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "REACH registration costs EUR 1,600-31,000+ depending on tonnage band and data requirements. Only Representative (OR) route lets non-EU manufacturers register. SDS must be in official language of Member State of import. SVHC notification to ECHA required if >0.1% w/w in articles. 'No data, no market' principle applies.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["UK REACH", "HSE", "registration", "Safety Data Sheet", "SDS", "SVHC", "substance registration"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "registrationNumber", description: "UK REACH registration number or DUIN (Downstream User Import Notification)", required: true, severityIfMissing: "critical" },
          { name: "substanceName", description: "Chemical substance name", required: true, severityIfMissing: "critical" },
          { name: "casNumber", description: "CAS number", required: true, severityIfMissing: "critical" },
          { name: "registrantName", description: "UK-based registrant or Only Representative", required: true, severityIfMissing: "critical" },
          { name: "tonnageBand", description: "Annual tonnage band", required: true, severityIfMissing: "critical" },
          { name: "sdsProvided", description: "UK-format Safety Data Sheet provided", required: true, severityIfMissing: "critical" },
          { name: "hazardClassification", description: "GB CLP classification", required: true, severityIfMissing: "critical" },
          { name: "svhcStatus", description: "UK SVHC Candidate List status", required: true, severityIfMissing: "critical" },
          { name: "authorisationStatus", description: "UK Annex XIV authorisation status", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["registrationNumber", "substanceName", "sdsProvided"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "UK REACH is administered by HSE (Health and Safety Executive), not ECHA. EU REACH registration does NOT transfer to UK REACH — separate registration required. DUIN (grandfathering) transitional period applies for substances previously registered under EU REACH. GB CLP Regulation mirrors EU CLP but is administered separately.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["ChemO", "ChemV", "Swiss chemicals", "FOPH", "BAG", "chemical notification", "Chemicals Ordinance"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "notificationReference", description: "Swiss FOPH/BAG notification reference (for new substances)", required: true, severityIfMissing: "critical" },
          { name: "substanceName", description: "Chemical substance name", required: true, severityIfMissing: "critical" },
          { name: "casNumber", description: "CAS number", required: true, severityIfMissing: "critical" },
          { name: "notifierName", description: "Swiss notifier (importer) name and UID", required: true, severityIfMissing: "critical" },
          { name: "tonnageBand", description: "Annual import quantity band", required: true, severityIfMissing: "critical" },
          { name: "sdsProvided", description: "Safety Data Sheet in official Swiss language (DE/FR/IT)", required: true, severityIfMissing: "critical" },
          { name: "hazardClassification", description: "GHS/CLP hazard classification", required: true, severityIfMissing: "critical" },
          { name: "swissInventoryStatus", description: "Whether substance is on Swiss chemicals inventory", required: true, severityIfMissing: "critical" },
          { name: "biocidalPermit", description: "Biocidal product authorisation (if applicable under OBP)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["substanceName", "casNumber", "sdsProvided"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Swiss ChemO is parallel to EU REACH but NOT identical. EU REACH registration does NOT automatically apply in Switzerland. Mutual recognition agreements cover some standards. SDS must be in at least one official Swiss language. FOPH/BAG administers the Swiss chemicals notification portal.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["ACI", "eManifest", "advance commercial information", "CBSA cargo", "pre-arrival", "cargo data"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary", "packing list"],
        },
        expectedFields: [
          { name: "carrierCode", description: "CBSA carrier code (SCAC or IATA code)", required: true, severityIfMissing: "critical" },
          { name: "conveyanceReference", description: "Conveyance reference number (vessel name + voyage or flight number)", required: true, severityIfMissing: "critical" },
          { name: "cargoControlNumber", description: "Cargo Control Number (CCN) — unique per shipment", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Consignee name, address, and BN (Business Number)", required: true, severityIfMissing: "critical" },
          { name: "shipperName", description: "Shipper/consignor name and address", required: true, severityIfMissing: "critical" },
          { name: "portOfLoading", description: "Port of loading (UN/LOCODE)", required: true, severityIfMissing: "critical" },
          { name: "portOfDischarge", description: "Canadian port of discharge (UN/LOCODE)", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS code (minimum 6-digit)", required: true, severityIfMissing: "warning" },
          { name: "grossWeight", description: "Gross weight (kg)", required: true, severityIfMissing: "critical" },
          { name: "containerNumbers", description: "Container and seal numbers", required: true, severityIfMissing: "critical" },
          { name: "estimatedArrival", description: "Estimated date/time of arrival at Canadian port", required: true, severityIfMissing: "critical" },
          { name: "undgCode", description: "UNDG dangerous goods code (if applicable)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
          { type: "numeric_positive", severity: "critical", message: "Gross weight must be positive." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["cargoControlNumber", "consigneeName", "portOfDischarge", "containerNumbers"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "ACI eManifest is Canada's equivalent of the US ISF 10+2. Filing deadlines: ocean = 24 hours before loading, air = varies (4 hours short-haul, pre-departure long-haul). Non-compliance = CBSA do-not-load (DNL) directive. Carrier is responsible for eManifest; freight forwarder files supplementary cargo/house bill data.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CFIA", "Canadian Food Inspection", "SFC licence", "Safe Food for Canadians", "AIRS", "import permit", "food import"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "sfcLicenceNumber", description: "Safe Food for Canadians (SFC) licence number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Canadian importer name, address, and Business Number", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Foreign exporter/supplier name and address", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of food/plant/animal product", required: true, severityIfMissing: "critical" },
          { name: "airsRequirements", description: "AIRS (Automated Import Reference System) commodity-specific requirements met", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "Canadian tariff classification code", required: true, severityIfMissing: "critical" },
          { name: "phytoCertificateRef", description: "Phytosanitary certificate reference (if plant product)", required: false, severityIfMissing: "warning" },
          { name: "importPermitRef", description: "CFIA import permit number (if required per AIRS)", required: false, severityIfMissing: "warning" },
          { name: "section43PermitRef", description: "Section 43 permit for otherwise prohibited material", required: false, severityIfMissing: "warning" },
          { name: "labelCompliance", description: "Confirmation labels comply with CFIA/SFCR requirements", required: true, severityIfMissing: "warning" },
          { name: "gradeCompliance", description: "Grade and quality compliance per applicable commodity standard", required: false, severityIfMissing: "warning" },
          { name: "lotTraceability", description: "Lot/batch traceability information for food safety recall capability", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
        ],
        minimumAcceptable: { mustHave: ["sfcLicenceNumber", "importerName", "productDescription", "airsRequirements"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "SFC licence is mandatory for most food imports into Canada. Use the AIRS database (airs-sari.inspection.gc.ca) to check commodity-specific requirements. Some products require CFIA import permits in addition to SFC licence. Section 43 permits allow import of otherwise prohibited material for specific purposes (research, exhibition).",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Bill S-211", "forced labour", "child labour", "supply chain", "Fighting Against", "modern slavery", "annual report"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          { name: "entityName", description: "Reporting entity name and legal form", required: true, severityIfMissing: "critical" },
          { name: "reportingYear", description: "Fiscal year covered by report", required: true, severityIfMissing: "critical" },
          { name: "structure", description: "Description of entity structure, activities, and supply chains", required: true, severityIfMissing: "critical" },
          { name: "policies", description: "Policies and due diligence processes for identifying forced/child labour", required: true, severityIfMissing: "critical" },
          { name: "riskAssessment", description: "Parts of activities/supply chains carrying risk of forced/child labour", required: true, severityIfMissing: "critical" },
          { name: "stepsTaken", description: "Steps taken to prevent and reduce risks", required: true, severityIfMissing: "critical" },
          { name: "remediation", description: "Measures taken to remediate any forced/child labour identified", required: false, severityIfMissing: "warning" },
          { name: "training", description: "Training provided to employees on forced/child labour", required: false, severityIfMissing: "warning" },
          { name: "effectivenessAssessment", description: "How entity assesses effectiveness of its measures", required: true, severityIfMissing: "warning" },
          { name: "approvalAttestation", description: "Approval by governing body and attestation", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [],
        minimumAcceptable: { mustHave: ["entityName", "reportingYear", "riskAssessment", "stepsTaken", "approvalAttestation"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Threshold: CA$20M+ revenue OR CA$10M+ assets OR 250+ employees. Annual report due May 31. Must be filed with Public Safety Canada and published on entity's website. Questionnaire format prescribed by regulations. False/misleading statements = offence under the Act.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CARM", "CBSA", "customs declaration", "Commercial Accounting Declaration", "CAD", "customs entry", "B3", "Canada customs"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary", "bill of lading"],
        },
        expectedFields: [
          // Per D17-1-10 memorandum field coding
          { name: "transactionNumber", description: "CARM transaction number (replaces B3 entry number)", required: true, severityIfMissing: "critical" },
          { name: "importerBusinessNumber", description: "Importer Business Number (BN15 — 9-digit BN + RM0001)", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer name and address", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name, address, and country", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin (ISO code)", required: true, severityIfMissing: "critical" },
          { name: "countryOfExport", description: "Country of export/direct shipment", required: true, severityIfMissing: "warning" },
          { name: "tariffClassification", description: "Canadian Customs Tariff classification code (10-digit)", required: true, severityIfMissing: "critical" },
          { name: "tariffTreatment", description: "Tariff treatment code (MFN, GPT, LDCT, etc.)", required: true, severityIfMissing: "critical" },
          { name: "customsValue", description: "Value for duty (transaction value, CAD)", required: true, severityIfMissing: "critical" },
          { name: "dutyRate", description: "Applicable duty rate", required: true, severityIfMissing: "critical" },
          { name: "gstAmount", description: "GST (5%) amount payable", required: true, severityIfMissing: "critical" },
          { name: "totalOwed", description: "Total duties + taxes + other levies", required: true, severityIfMissing: "critical" },
          { name: "releaseOffice", description: "CBSA release office code", required: true, severityIfMissing: "warning" },
          { name: "proofOfOrigin", description: "Origin proof reference for preferential tariff claim", required: false, severityIfMissing: "warning" },
          { name: "invoiceReference", description: "Commercial invoice or Canada Customs Invoice (CI1) reference", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "critical", message: "Tariff classification does not match expected commodity." },
          { type: "numeric_positive", severity: "critical", message: "Values and duties must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Currency should be CAD for Canadian customs." },
        ],
        minimumAcceptable: { mustHave: ["transactionNumber", "importerBusinessNumber", "tariffClassification", "customsValue"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "CARM Client Portal replaced ACROSS/B3 paper process in October 2024. Accounting data (CAD) due within 5 business days of release. GPT (General Preferential Tariff) and LDCT (Least Developed Country Tariff) available for qualifying African goods — verify with origin proof. CPTPP certificate of origin (Annex 3-B format) required for CPTPP preference claims.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["halal", "helal", "Islamic", "slaughter", "zabihah", "certification body", "Diyanet", "HAK"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "certificateNumber", description: "Halal certificate number", required: true, severityIfMissing: "critical" },
          { name: "certificationBody", description: "Accredited halal certification body name (HAK-recognised or Diyanet-recognised)", required: true, severityIfMissing: "critical" },
          { name: "accreditationRef", description: "Accreditation reference (HAK accreditation number or OIC/SMIIC recognition)", required: true, severityIfMissing: "critical" },
          { name: "producerName", description: "Producer/manufacturer name and address", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of certified halal product(s)", required: true, severityIfMissing: "critical" },
          { name: "productionFacility", description: "Production facility name and address", required: true, severityIfMissing: "critical" },
          { name: "slaughterMethod", description: "Slaughter method declaration (for meat/poultry): hand slaughter, Islamic prayer", required: false, severityIfMissing: "warning" },
          { name: "ingredientList", description: "Key ingredients confirmed halal-compliant", required: false, severityIfMissing: "warning" },
          { name: "issueDate", description: "Certificate issue date", required: true, severityIfMissing: "critical" },
          { name: "expiryDate", description: "Certificate expiry date", required: true, severityIfMissing: "critical" },
          { name: "scope", description: "Scope: which products/processes are covered", required: true, severityIfMissing: "critical" },
          { name: "halalStandard", description: "Halal standard applied (OIC/SMIIC 1:2019, national standard, etc.)", required: true, severityIfMissing: "warning" },
          { name: "auditDate", description: "Date of most recent halal audit", required: false, severityIfMissing: "info" },
          { name: "signatoryAuthority", description: "Authorised signatory name and stamp", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "certificationBody", "productDescription", "expiryDate"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Turkey's Halal Accreditation Agency (HAK) accredits certification bodies since 2018. Diyanet (Presidency of Religious Affairs) is the religious authority. OIC/SMIIC standards are the international reference. For meat products, hand slaughter and Islamic prayer recitation are mandatory. Certificate must be current (not expired) at time of import.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["TSE", "Turkish Standards", "conformity", "TAREKS", "test report", "certificate of conformity", "CE marking", "G mark"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "tareksReference", description: "TAREKS (Risk-Based Trade Control System) 23-digit reference number", required: true, severityIfMissing: "critical" },
          { name: "certificateNumber", description: "TSE conformity certificate number", required: true, severityIfMissing: "critical" },
          { name: "applicantName", description: "Applicant/importer name and Turkish tax number", required: true, severityIfMissing: "critical" },
          { name: "manufacturerName", description: "Manufacturer name and address", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Product description and model/type designation", required: true, severityIfMissing: "critical" },
          { name: "applicableStandard", description: "Turkish/EN/ISO standard(s) tested against", required: true, severityIfMissing: "critical" },
          { name: "testReportRef", description: "Test report reference number and testing laboratory", required: true, severityIfMissing: "critical" },
          { name: "testingLaboratory", description: "Name of accredited testing laboratory (TÜRKAK-accredited)", required: true, severityIfMissing: "critical" },
          { name: "conformityResult", description: "Conformity assessment result (pass/conditional/fail)", required: true, severityIfMissing: "critical" },
          { name: "ceMarkingStatus", description: "CE marking status (if applicable for EU-aligned regulation)", required: false, severityIfMissing: "warning" },
          { name: "validityPeriod", description: "Certificate validity period", required: true, severityIfMissing: "warning" },
          { name: "hsCode", description: "HS code of the product", required: true, severityIfMissing: "warning" },
          { name: "productGroup", description: "TAREKS product group classification", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected product type." },
        ],
        minimumAcceptable: { mustHave: ["tareksReference", "certificateNumber", "applicantName", "conformityResult"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "TAREKS is Turkey's prior authorisation system — many industrial products cannot clear customs without TAREKS approval. TSE = Türk Standardları Enstitüsü (Turkish Standards Institute). Many products accept EU CE marking but some require separate TSE 'G' mark. TAREKS application must be filed by the importing company's authorised user. Testing must be by TÜRKAK-accredited or TSE-recognised labs.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Borsa Istanbul", "BIST", "gold import", "precious metals", "Istanbul Gold Exchange", "CMB authorization"],
          rejectIfContainsAny: ["invoice", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "bistMembershipRef", description: "Borsa Istanbul membership/authorisation reference", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importing bank or authorised precious metals company name", required: true, severityIfMissing: "critical" },
          { name: "cmbLicence", description: "Capital Markets Board (CMB/SPK) licence number", required: true, severityIfMissing: "critical" },
          { name: "goldType", description: "Type of gold: refined bars, doré, scrap, jewellery", required: true, severityIfMissing: "critical" },
          { name: "purity", description: "Gold purity (fineness, e.g., 995/1000)", required: true, severityIfMissing: "critical" },
          { name: "weightGrams", description: "Weight in grams or troy ounces", required: true, severityIfMissing: "critical" },
          { name: "assayReport", description: "Assay/analysis report reference from LBMA-approved refiner or equivalent", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin of gold", required: true, severityIfMissing: "critical" },
          { name: "serialNumbers", description: "Bar serial numbers (for refined bars)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "numeric_positive", severity: "critical", message: "Weight must be positive." },
        ],
        minimumAcceptable: { mustHave: ["bistMembershipRef", "importerName", "goldType", "weightGrams"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "BIST membership is a hard market access barrier — only authorised banks and precious metals companies can import gold into Turkey. Non-members cannot clear gold through Turkish customs. Central Bank of Turkey (TCMB) also has regulatory oversight. LBMA-approved refiners' bars generally accepted without additional assay.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["ESMA", "Emirates Authority for Standardization", "GSO", "conformity", "technical regulation", "type approval"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "certificateNumber", description: "ESMA/GSO conformity certificate number", required: true, severityIfMissing: "critical" },
          { name: "applicantName", description: "UAE importer/applicant name and trade licence number", required: true, severityIfMissing: "critical" },
          { name: "manufacturerName", description: "Manufacturer name and address", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Product description and model designation", required: true, severityIfMissing: "critical" },
          { name: "gsoStandard", description: "Applicable GSO standard or UAE technical regulation reference", required: true, severityIfMissing: "critical" },
          { name: "testReportRef", description: "Test report reference from accredited lab", required: true, severityIfMissing: "critical" },
          { name: "testingLaboratory", description: "Name of testing lab (ILAC/EIAC-accredited)", required: true, severityIfMissing: "critical" },
          { name: "conformityResult", description: "Conformity assessment result", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "12-digit HS code (mandatory since 2025 in UAE)", required: true, severityIfMissing: "critical" },
          { name: "validityPeriod", description: "Certificate validity period", required: true, severityIfMissing: "warning" },
          { name: "gccMarkApplied", description: "GCC conformity marking applied to product", required: false, severityIfMissing: "warning" },
          { name: "batchLotInfo", description: "Batch/lot information for traceability", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected product category." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "applicantName", "productDescription", "conformityResult"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "ESMA administers conformity assessment aligned with GCC technical regulations. GSO (Gulf Standardization Organization) sets the standards. UAE mandates 12-digit HS codes since 2025. ILAC-accredited or EIAC-accredited test labs required. GCC mutual recognition agreements may simplify conformity for products already certified in other GCC states.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["halal", "EIAC", "Islamic", "slaughter", "zabihah", "GSO 2055", "Emirates halal"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          // Per GSO 2055 and UAE halal requirements
          { name: "certificateNumber", description: "Halal certificate number", required: true, severityIfMissing: "critical" },
          { name: "certificationBody", description: "Halal certification body name (must be EIAC-accredited)", required: true, severityIfMissing: "critical" },
          { name: "eiacAccreditationRef", description: "EIAC (Emirates International Accreditation Centre) accreditation number", required: true, severityIfMissing: "critical" },
          { name: "producerName", description: "Producer/manufacturer name and address", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of halal-certified product(s)", required: true, severityIfMissing: "critical" },
          { name: "productionFacility", description: "Production facility address", required: true, severityIfMissing: "critical" },
          { name: "slaughterMethod", description: "Slaughter method (for meat): hand slaughter by Muslim, facing Qibla", required: false, severityIfMissing: "warning" },
          { name: "slaughterCertification", description: "Slaughterman certification (for meat products)", required: false, severityIfMissing: "warning" },
          { name: "ingredientHalalStatus", description: "All ingredients confirmed halal and free from haram substances", required: true, severityIfMissing: "critical" },
          { name: "alcoholFreeDeclaration", description: "Declaration product is alcohol-free (for food/cosmetics)", required: false, severityIfMissing: "warning" },
          { name: "issueDate", description: "Certificate issue date", required: true, severityIfMissing: "critical" },
          { name: "expiryDate", description: "Certificate expiry date", required: true, severityIfMissing: "critical" },
          { name: "scope", description: "Scope of certification (products/processes covered)", required: true, severityIfMissing: "critical" },
          { name: "halalStandard", description: "Standard applied: UAE.S GSO 2055, OIC/SMIIC 1", required: true, severityIfMissing: "warning" },
          { name: "halalLogo", description: "Halal logo/mark applied to product packaging", required: true, severityIfMissing: "warning" },
          { name: "signatoryStamp", description: "Authorised signatory and certification body stamp", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "certificationBody", "eiacAccreditationRef", "productDescription", "expiryDate"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "UAE enforces halal requirements strictly — non-compliant shipments are rejected at port. EIAC accreditation is mandatory for the certification body. GSO 2055 is the GCC halal standard. For meat: hand slaughter by Muslim slaughterman, facing Qibla, with Tasmiya. Cosmetics must also be halal-certified in UAE. Certificate must be current (not expired) at time of import.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["MOCCAE", "Ministry of Climate Change", "import permit", "agricultural import", "plant import", "animal import", "feed import"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          // Per MOCCAE service pages (site.moccae.gov.ae)
          { name: "permitNumber", description: "MOCCAE import permit number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "UAE importer name and trade licence number", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of agricultural/plant/animal product", required: true, severityIfMissing: "critical" },
          { name: "productCategory", description: "MOCCAE product category (agricultural, animal feed, live animal, fish, etc.)", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin", required: true, severityIfMissing: "critical" },
          { name: "certificateOfOrigin", description: "Certificate of origin reference", required: true, severityIfMissing: "critical" },
          { name: "healthCertificateRef", description: "Health/veterinary certificate reference (if animal product)", required: false, severityIfMissing: "warning" },
          { name: "batchCertificateOfAnalysis", description: "Certificate of Analysis for each batch (required for animal feed)", required: false, severityIfMissing: "warning" },
          { name: "phytoCertificateRef", description: "Phytosanitary certificate reference (if plant product)", required: false, severityIfMissing: "warning" },
          { name: "quantity", description: "Quantity and unit of measure", required: true, severityIfMissing: "critical" },
          { name: "purchaseInvoiceRef", description: "Purchase invoice reference", required: true, severityIfMissing: "warning" },
          { name: "validityPeriod", description: "Permit validity period", required: true, severityIfMissing: "warning" },
          { name: "emirate", description: "Emirate of import clearance", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "numeric_positive", severity: "critical", message: "Quantity must be positive." },
        ],
        minimumAcceptable: { mustHave: ["permitNumber", "importerName", "productDescription", "certificateOfOrigin"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "MOCCAE regulates agricultural, plant, animal, and food/feed imports. For animal feed: certificate of analysis per batch is mandatory. For live animals: attested veterinary health certificate in approved model required. For fish/aquatic: health certificate in approved format. CITES certificate replaces certificate of origin for CITES-listed species.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["ECAS", "Emirates Conformity Assessment", "quality mark", "product registration", "ESMA marking"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary", "certificate of origin"],
        },
        expectedFields: [
          { name: "ecasCertificateNumber", description: "ECAS certificate/registration number", required: true, severityIfMissing: "critical" },
          { name: "applicantName", description: "Applicant/importer name and UAE trade licence", required: true, severityIfMissing: "critical" },
          { name: "manufacturerName", description: "Manufacturer name and address", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Product description, model, and brand", required: true, severityIfMissing: "critical" },
          { name: "productCategory", description: "ECAS product category (toys, LVE, building materials, PPE, etc.)", required: true, severityIfMissing: "critical" },
          { name: "technicalRegulation", description: "UAE technical regulation reference", required: true, severityIfMissing: "critical" },
          { name: "testReportRef", description: "Test report from accredited laboratory", required: true, severityIfMissing: "critical" },
          { name: "testingLaboratory", description: "Accredited testing laboratory name", required: true, severityIfMissing: "critical" },
          { name: "ecasMarkApplied", description: "Confirmation ECAS quality mark applied to product/packaging", required: true, severityIfMissing: "critical" },
          { name: "conformityResult", description: "Conformity assessment result", required: true, severityIfMissing: "critical" },
          { name: "validityPeriod", description: "Certificate validity period", required: true, severityIfMissing: "warning" },
          { name: "hsCode", description: "12-digit HS code", required: true, severityIfMissing: "warning" },
          { name: "batchInfo", description: "Batch/lot information", required: false, severityIfMissing: "info" },
          { name: "factoryInspection", description: "Factory inspection report (if required by scheme)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected ECAS product category." },
        ],
        minimumAcceptable: { mustHave: ["ecasCertificateNumber", "applicantName", "productDescription", "ecasMarkApplied"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "ECAS operates under a product registration system via the ECAS portal (ecas.esma.gov.ae). Products must carry the ECAS quality mark before sale in UAE. Low-voltage electrical equipment, toys, and building materials are the most common ECAS-regulated categories. Registration is product-specific, not per-shipment.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Dubai Trade", "Mirsal", "customs declaration", "import declaration", "Dubai Customs", "electronic declaration", "TAMM"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary", "bill of lading"],
        },
        expectedFields: [
          // Per Dubai Customs Mirsal 2 system and Dubai Trade portal
          { name: "declarationNumber", description: "Dubai Trade/Mirsal 2 declaration number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer name and UAE trade licence number", required: true, severityIfMissing: "critical" },
          { name: "importerCustomsCode", description: "Dubai Customs importer code", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Country of origin", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "12-digit HS code (mandatory since 2025)", required: true, severityIfMissing: "critical" },
          { name: "productDescription", description: "Description of imported goods", required: true, severityIfMissing: "critical" },
          { name: "customsValue", description: "Customs value (CIF)", required: true, severityIfMissing: "critical" },
          { name: "dutyRate", description: "GCC CET duty rate (standard 5%)", required: true, severityIfMissing: "critical" },
          { name: "dutyAmount", description: "Duty amount payable (AED)", required: true, severityIfMissing: "critical" },
          { name: "vatAmount", description: "VAT (5%) amount", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross weight in kilograms", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Net weight in kilograms", required: true, severityIfMissing: "warning" },
          { name: "containerNumbers", description: "Container number(s)", required: false, severityIfMissing: "info" },
          { name: "transportDocRef", description: "Bill of lading / AWB reference", required: true, severityIfMissing: "critical" },
          { name: "invoiceReference", description: "Commercial invoice reference and date", required: true, severityIfMissing: "warning" },
          { name: "portOfEntry", description: "UAE port of entry (Jebel Ali, Rashid, etc.)", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "critical", message: "HS code does not match expected commodity." },
          { type: "weight_net_less_than_gross", severity: "warning", message: "Net weight exceeds gross weight." },
          { type: "numeric_positive", severity: "critical", message: "Values and weights must be positive." },
        ],
        minimumAcceptable: { mustHave: ["declarationNumber", "importerName", "hsCode", "customsValue"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Dubai uses Mirsal 2 system; Abu Dhabi uses TAMM. Standard GCC CET rate is 5% on most goods. UAE VAT is 5%. 12-digit HS code mandatory since 2025. All customs clearance is electronic via Dubai Trade portal (dubaitrade.ae). Certain goods may require additional NOCs (No Objection Certificates) from regulatory bodies before clearance.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["catch certificate", "IUU", "fishing", "flag state", "catch documentation", "EC 1005/2008"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          // Per Annex II of EC Regulation 1005/2008 (IUU Regulation)
          { name: "certificateNumber", description: "Catch certificate unique document number", required: true, severityIfMissing: "critical" },
          { name: "flagState", description: "Flag state authority that validated the certificate", required: true, severityIfMissing: "critical" },
          { name: "vesselName", description: "Fishing vessel name", required: true, severityIfMissing: "critical" },
          { name: "vesselImoNumber", description: "Vessel IMO number or CFR number", required: true, severityIfMissing: "critical" },
          { name: "vesselRegistration", description: "Vessel registration number and flag state", required: true, severityIfMissing: "critical" },
          { name: "fishingLicenceRef", description: "Fishing licence/authorisation reference", required: true, severityIfMissing: "critical" },
          { name: "speciesScientific", description: "Species scientific name (FAO species code)", required: true, severityIfMissing: "critical" },
          { name: "speciesCommon", description: "Common/market name of fish species", required: true, severityIfMissing: "warning" },
          { name: "productDescription", description: "Product type (whole, filleted, frozen, canned, etc.)", required: true, severityIfMissing: "critical" },
          { name: "catchArea", description: "Catch area (FAO fishing area code)", required: true, severityIfMissing: "critical" },
          { name: "catchDates", description: "Date(s) of catch", required: true, severityIfMissing: "critical" },
          { name: "estimatedWeight", description: "Estimated live weight (kg) at catch", required: true, severityIfMissing: "critical" },
          { name: "landedWeight", description: "Landed/verified weight (kg)", required: true, severityIfMissing: "critical" },
          { name: "validationAuthority", description: "Flag state authority name, stamp, and signature", required: true, severityIfMissing: "critical" },
          { name: "validationDate", description: "Date of validation by flag state authority", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer name and address", required: true, severityIfMissing: "critical" },
          { name: "transportDetails", description: "Transport details (vessel, container, route)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Flag state does not match expected origin." },
          { type: "numeric_positive", severity: "critical", message: "Catch weight must be positive." },
          { type: "date_not_future", severity: "critical", message: "Catch date cannot be in the future." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "flagState", "vesselName", "speciesScientific", "catchArea", "validationAuthority"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "EU requires advance notification (3-4 working days) via the IUU catch certificate system. The certificate has 7 main sections per Annex II of EC 1005/2008. Flag state must not be on the EU IUU 'red card' (non-cooperating) list. IMO number is mandatory for vessels >15m. Simplified procedures exist for small-scale fisheries.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["processing statement", "processed fish", "re-export", "fish processing", "factory vessel", "catch certificate"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "statementNumber", description: "Processing statement unique reference number", required: true, severityIfMissing: "critical" },
          { name: "processingFacility", description: "Processing factory/facility name, address, and approval number", required: true, severityIfMissing: "critical" },
          { name: "catchCertificateRef", description: "Original catch certificate number(s) linked to processed product", required: true, severityIfMissing: "critical" },
          { name: "inputProduct", description: "Description of input product (whole fish species, weight)", required: true, severityIfMissing: "critical" },
          { name: "outputProduct", description: "Description of output product (fillets, frozen, canned, etc.)", required: true, severityIfMissing: "critical" },
          { name: "inputWeight", description: "Weight of raw material input (kg)", required: true, severityIfMissing: "critical" },
          { name: "outputWeight", description: "Weight of processed output (kg)", required: true, severityIfMissing: "critical" },
          { name: "processingType", description: "Type of processing applied", required: true, severityIfMissing: "warning" },
          { name: "processingDate", description: "Date(s) of processing", required: true, severityIfMissing: "critical" },
          { name: "authorityValidation", description: "Competent authority validation stamp and signature", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Weights must be positive." },
          { type: "date_not_future", severity: "warning", message: "Processing date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["statementNumber", "catchCertificateRef", "outputProduct", "outputWeight"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CITES", "export permit", "Convention on International Trade", "endangered species", "Appendix"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list"],
        },
        expectedFields: [
          // Per CITES Resolution Conf. 12.3 (Rev. CoP19) — 20-box permit format
          { name: "permitNumber", description: "Box 1 — CITES export permit unique number", required: true, severityIfMissing: "critical" },
          { name: "validityDate", description: "Box 2 — Permit validity expiry date (6 months for export)", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Box 3 — Exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Box 4 — Importer name and address", required: true, severityIfMissing: "critical" },
          { name: "speciesScientific", description: "Box 8 — Scientific name (genus + species)", required: true, severityIfMissing: "critical" },
          { name: "speciesCommon", description: "Box 8 — Common name", required: false, severityIfMissing: "warning" },
          { name: "appendixListing", description: "Box 10 — CITES Appendix (I, II, or III)", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Box 11 — Quantity (number, weight, or volume)", required: true, severityIfMissing: "critical" },
          { name: "specimenDescription", description: "Box 9 — Description of specimen (live, skin, extract, etc.)", required: true, severityIfMissing: "critical" },
          { name: "sourceCode", description: "Box 12 — Source code (W=wild, C=captive-bred, A=artificially propagated, etc.)", required: true, severityIfMissing: "critical" },
          { name: "purposeCode", description: "Box 13 — Purpose (T=commercial, Z=zoo, S=scientific, P=personal)", required: true, severityIfMissing: "warning" },
          { name: "countryOfOrigin", description: "Box 14 — Country of origin", required: true, severityIfMissing: "critical" },
          { name: "importPermitRef", description: "Box 6 — Import permit number (required for Appendix I)", required: false, severityIfMissing: "warning" },
          { name: "issuingAuthority", description: "Box 20 — Management Authority name, stamp, signature, date", required: true, severityIfMissing: "critical" },
          { name: "scientificAuthority", description: "Box 19 — Scientific Authority non-detriment finding reference", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "date_not_future", severity: "warning", message: "Check permit validity — expired permits are invalid." },
          { type: "numeric_positive", severity: "critical", message: "Quantity must be positive." },
        ],
        minimumAcceptable: { mustHave: ["permitNumber", "speciesScientific", "appendixListing", "issuingAuthority"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "CITES permits follow the standard 20-box format per Resolution Conf. 12.3 (Rev. CoP19). Export permits valid 6 months. Re-export certificates valid 6 months. Appendix I requires BOTH export and import permits. Appendix II requires only export permit. Source code 'W' (wild) may have national quotas. Scientific Authority non-detriment finding is mandatory.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["CITES", "import permit", "Convention on International Trade", "endangered species", "Appendix I"],
          rejectIfContainsAny: ["invoice", "bill of lading", "packing list"],
        },
        expectedFields: [
          { name: "permitNumber", description: "Box 1 — CITES import permit unique number", required: true, severityIfMissing: "critical" },
          { name: "validityDate", description: "Box 2 — Permit validity expiry date (12 months for import)", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Box 3 — Importer name and address", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Box 4 — Exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "issuingCountry", description: "Importing country CITES Management Authority", required: true, severityIfMissing: "critical" },
          { name: "speciesScientific", description: "Box 8 — Scientific name (genus + species)", required: true, severityIfMissing: "critical" },
          { name: "appendixListing", description: "Box 10 — CITES Appendix (I required for import permit)", required: true, severityIfMissing: "critical" },
          { name: "quantity", description: "Box 11 — Quantity", required: true, severityIfMissing: "critical" },
          { name: "specimenDescription", description: "Box 9 — Description of specimen", required: true, severityIfMissing: "critical" },
          { name: "sourceCode", description: "Box 12 — Source code", required: true, severityIfMissing: "critical" },
          { name: "purposeCode", description: "Box 13 — Purpose code", required: true, severityIfMissing: "warning" },
          { name: "countryOfOrigin", description: "Box 14 — Country of origin of specimen", required: true, severityIfMissing: "critical" },
          { name: "issuingAuthority", description: "Box 20 — Import Management Authority stamp, signature, date", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Importing country does not match trade context." },
        ],
        minimumAcceptable: { mustHave: ["permitNumber", "speciesScientific", "appendixListing", "issuingAuthority"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Import permits are only mandatory for CITES Appendix I species. Import permit must be issued BEFORE the exporting country can issue the export permit. Import permits valid 12 months. Both permits must be presented at customs in importing country.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["entry summary", "ENS", "security filing", "pre-arrival", "ICS", "safety and security", "S&S"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary", "packing list"],
        },
        expectedFields: [
          // EU Entry Summary Declaration (ENS) per Union Customs Code (UCC) Art. 127 + DA Art. 105-109
          { name: "declarantEORI", description: "Person lodging the ENS — EORI number", required: true, severityIfMissing: "critical" },
          { name: "consignorName", description: "Consignor/shipper name and address", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Consignee name, address, and EORI (if known)", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods (first 6 digits of HS code required)", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS code (minimum 6-digit level)", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross mass in kilograms", required: true, severityIfMissing: "critical" },
          { name: "packageCount", description: "Number of packages", required: true, severityIfMissing: "warning" },
          { name: "containerNumbers", description: "Container number(s) and seal number(s)", required: true, severityIfMissing: "critical" },
          { name: "portOfLoading", description: "Port of loading (UN/LOCODE)", required: true, severityIfMissing: "critical" },
          { name: "portOfEntry", description: "First port of entry in customs territory (UN/LOCODE)", required: true, severityIfMissing: "critical" },
          { name: "transportDocRef", description: "Transport document reference (B/L number, AWB, etc.)", required: true, severityIfMissing: "critical" },
          { name: "vesselName", description: "Vessel name and IMO number (sea) or flight number (air)", required: true, severityIfMissing: "warning" },
          { name: "estimatedArrival", description: "Estimated date and time of arrival at first port of entry", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
          { type: "numeric_positive", severity: "critical", message: "Gross weight and package count must be positive." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["declarantEORI", "consignorName", "hsCode", "containerNumbers", "portOfEntry"], ifMissing: "ISSUES_FOUND" },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["customs declaration", "import declaration", "SAD", "single administrative document", "customs entry", "C88", "déclaration en douane", "DEB", "DAU"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          // SAD/CDS key boxes (EU: Single Administrative Document boxes; UK: C88/CDS data elements)
          { name: "declarationType", description: "Box 1 — Declaration type (IM, EX, CO, EU) and procedure", required: true, severityIfMissing: "critical" },
          { name: "declarantEORI", description: "Box 14 — Declarant EORI number or identification", required: true, severityIfMissing: "critical" },
          { name: "importerEORI", description: "Box 8 — Importer/consignee EORI number", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Box 2 — Exporter/consignor name and address", required: true, severityIfMissing: "critical" },
          { name: "countryOfOrigin", description: "Box 34 — Country of origin code (ISO)", required: true, severityIfMissing: "critical" },
          { name: "countryOfDispatch", description: "Box 15 — Country of dispatch/export", required: true, severityIfMissing: "warning" },
          { name: "hsCode", description: "Box 33 — Commodity code (HS/CN/TARIC code, minimum 8 digits EU, 10 digits UK)", required: true, severityIfMissing: "critical" },
          { name: "customsValue", description: "Box 46 — Statistical value / Box 47 — Customs value (CIF)", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Box 38 — Net mass in kilograms", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Box 35 — Gross mass in kilograms", required: true, severityIfMissing: "warning" },
          { name: "customsProcedure", description: "Box 37 — Customs procedure code (CPC, 7 digits UK / 4+2 EU)", required: true, severityIfMissing: "critical" },
          { name: "invoiceNumber", description: "Box 44 — Invoice reference and date", required: true, severityIfMissing: "warning" },
          { name: "preferenceCode", description: "Box 36 — Preference code (tariff preference claimed: GSP, EPA, EBA, etc.)", required: false, severityIfMissing: "info" },
          { name: "dutyAmount", description: "Box 47 — Tax type, base, rate, and amount payable", required: true, severityIfMissing: "warning" },
          { name: "transportDocRef", description: "Box 44 — Transport document reference (B/L number, AWB)", required: true, severityIfMissing: "warning" },
          { name: "containerNumbers", description: "Box 31 — Container number(s)", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Country of origin does not match trade context." },
          { type: "destination_country_match", severity: "warning", message: "Destination country does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "critical", message: "HS code does not match expected commodity classification." },
          { type: "weight_net_less_than_gross", severity: "warning", message: "Net weight exceeds gross weight." },
          { type: "numeric_positive", severity: "critical", message: "Customs value and weights must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Currency code is not a valid ISO 4217 code." },
        ],
        minimumAcceptable: { mustHave: ["declarationType", "importerEORI", "hsCode", "customsValue", "netWeight", "customsProcedure"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 61a. Transit Document T1/T2 (broker — EU/UK) ──
    {
      ruleKey: "broker_transit_document",
      destinationIso2: "EU",
      titleTemplate: "Transit document T1/T2 for customs transit through EU territory",
      descriptionTemplate: "Common/Union transit document (T1 for non-EU goods, T2 for EU goods) used when goods move under customs control between entry BCP and inland destination. Filed via NCTS (New Computerised Transit System). Required when goods are not cleared at the first port of entry.",
      issuedByTemplate: "Customs Broker / Principal (holder of transit procedure)",
      whenNeeded: "At port of entry — when goods transit to inland customs office for clearance",
      tipTemplate: "Transit requires a guarantee (individual or comprehensive). The MRN (Movement Reference Number) from NCTS must accompany the goods. Goods must arrive at the office of destination within the prescribed time limit.",
      portalGuideTemplate: null,
      documentCode: "T1",
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 411,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["transit", "T1", "T2", "NCTS", "movement reference", "MRN", "common transit", "union transit"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary", "bill of lading"],
        },
        expectedFields: [
          { name: "mrn", description: "Movement Reference Number (MRN) — 18-character alphanumeric identifier from NCTS", required: true, severityIfMissing: "critical" },
          { name: "transitType", description: "Transit type: T1 (non-Union goods) or T2 (Union goods)", required: true, severityIfMissing: "critical" },
          { name: "principalName", description: "Principal (holder of procedure) — name, address, EORI", required: true, severityIfMissing: "critical" },
          { name: "officeOfDeparture", description: "Office of departure (customs office code)", required: true, severityIfMissing: "critical" },
          { name: "officeOfDestination", description: "Office of destination (customs office code)", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods — nature, marks, and numbers of packages", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "Commodity code (minimum first 6 digits of HS)", required: true, severityIfMissing: "warning" },
          { name: "grossWeight", description: "Gross mass in kilograms", required: true, severityIfMissing: "critical" },
          { name: "containerNumbers", description: "Container number(s) and seal number(s)", required: true, severityIfMissing: "warning" },
          { name: "guaranteeType", description: "Guarantee type and reference (individual, comprehensive, or waiver)", required: true, severityIfMissing: "critical" },
          { name: "timeLimit", description: "Prescribed time limit for arrival at office of destination", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected commodity." },
          { type: "numeric_positive", severity: "critical", message: "Gross weight must be positive." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["mrn", "transitType", "principalName", "officeOfDeparture", "officeOfDestination"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 61b. Delivery Order (broker — all destinations) ──
    {
      ruleKey: "broker_delivery_order",
      titleTemplate: "Delivery order for cargo release from port/terminal",
      descriptionTemplate: "Instruction from the shipping line agent or freight forwarder authorising the port terminal to release the cargo to the consignee or their nominated haulier. Issued after all charges (freight, demurrage, detention) are settled and customs clearance is obtained.",
      issuedByTemplate: "Shipping line agent / Freight Forwarder",
      whenNeeded: "Post-arrival — after customs clearance, before cargo collection",
      tipTemplate: "The delivery order is only issued after the original B/L is surrendered (or telex release confirmed) and all port/freight charges are paid. Delays in obtaining the D/O are a common cause of demurrage costs.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 412,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["delivery order", "D/O", "release order", "cargo release", "bon de livraison", "ordre de livraison"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "bill of lading", "customs declaration"],
        },
        expectedFields: [
          { name: "deliveryOrderNumber", description: "Unique delivery order reference number", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Consignee name and address (party authorised to collect)", required: true, severityIfMissing: "critical" },
          { name: "blReference", description: "Bill of Lading reference number", required: true, severityIfMissing: "critical" },
          { name: "vesselName", description: "Vessel name and voyage number", required: true, severityIfMissing: "warning" },
          { name: "containerNumbers", description: "Container number(s) to be released", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description and quantity of goods", required: true, severityIfMissing: "warning" },
          { name: "portTerminal", description: "Port/terminal where cargo is stored", required: true, severityIfMissing: "warning" },
          { name: "customsClearanceRef", description: "Customs clearance reference or entry number", required: true, severityIfMissing: "critical" },
          { name: "issueDate", description: "Date of issue", required: true, severityIfMissing: "warning" },
          { name: "validityPeriod", description: "Collection deadline / free-time expiry", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["deliveryOrderNumber", "consigneeName", "blReference", "containerNumbers"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 61c. Warehouse Receipt (broker — bonded warehouse) ──
    {
      ruleKey: "broker_warehouse_receipt",
      titleTemplate: "Warehouse receipt for bonded/customs warehouse storage",
      descriptionTemplate: "Receipt issued by an approved customs warehouse confirming goods have been deposited under customs control. Used when goods enter customs warehousing procedure (CPC 71xx EU) before final import clearance or re-export.",
      issuedByTemplate: "Approved customs warehouse operator",
      whenNeeded: "Post-arrival — when goods enter warehousing procedure instead of immediate clearance",
      tipTemplate: "Goods in customs warehouse are under suspension of duty. The warehouse keeper is liable for the goods. Maximum storage period is typically 3 years (EU) or as specified by national customs.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 413,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["warehouse receipt", "bonded warehouse", "customs warehouse", "récépissé d'entrepôt", "bon d'entrée en entrepôt", "warrant"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "receiptNumber", description: "Warehouse receipt/warrant number", required: true, severityIfMissing: "critical" },
          { name: "warehouseCode", description: "Approved warehouse identification code (customs authorisation number)", required: true, severityIfMissing: "critical" },
          { name: "depositorName", description: "Name of depositor (importer/consignee)", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods stored", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "Commodity code (HS)", required: false, severityIfMissing: "warning" },
          { name: "quantity", description: "Quantity — number of packages/units", required: true, severityIfMissing: "critical" },
          { name: "netWeight", description: "Net weight in kilograms", required: true, severityIfMissing: "warning" },
          { name: "containerNumbers", description: "Container number(s) if containerised", required: false, severityIfMissing: "info" },
          { name: "dateOfDeposit", description: "Date goods were deposited in warehouse", required: true, severityIfMissing: "critical" },
          { name: "customsEntryRef", description: "Customs entry/declaration reference for warehousing procedure", required: true, severityIfMissing: "warning" },
          { name: "storageConditions", description: "Storage conditions (ambient, chilled, frozen, hazardous)", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Quantity and weight must be positive." },
          { type: "date_not_future", severity: "warning", message: "Date of deposit should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["receiptNumber", "warehouseCode", "depositorName", "goodsDescription", "dateOfDeposit"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 61d. Broker Duty Payment Receipt ──
    {
      ruleKey: "broker_duty_payment",
      titleTemplate: "Customs duty and tax payment receipt",
      descriptionTemplate: "Official receipt confirming payment of customs duties, VAT/GST, and any additional levies (anti-dumping, countervailing, safeguard duties). Issued by customs or the payment system after successful settlement. Required for cargo release.",
      issuedByTemplate: "Customs authority / Revenue authority",
      whenNeeded: "At import — before goods are released from customs control",
      tipTemplate: "Retain the payment receipt for VAT recovery (input tax credit). Payment can be deferred if the broker holds a deferment account / duty deferment guarantee.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: false,
      owner: "BROKER",
      dueBy: "POST_ARRIVAL",
      sortOrder: 414,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["duty payment", "customs receipt", "tax payment", "duty receipt", "quittance douanière", "C79", "import charges", "droit de douane"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "bill of lading"],
        },
        expectedFields: [
          { name: "receiptNumber", description: "Payment receipt reference number", required: true, severityIfMissing: "critical" },
          { name: "declarationRef", description: "Customs declaration/entry reference linked to this payment", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer name and EORI/TIN", required: true, severityIfMissing: "critical" },
          { name: "dutyAmount", description: "Customs duty amount paid", required: true, severityIfMissing: "critical" },
          { name: "vatAmount", description: "VAT/GST amount paid", required: true, severityIfMissing: "critical" },
          { name: "totalAmount", description: "Total amount paid (all duties + taxes)", required: true, severityIfMissing: "critical" },
          { name: "currency", description: "Currency of payment (ISO 4217)", required: true, severityIfMissing: "warning" },
          { name: "paymentDate", description: "Date of payment", required: true, severityIfMissing: "critical" },
          { name: "paymentMethod", description: "Payment method (cash, deferment, bank transfer, guarantee)", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Duty and tax amounts must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Currency code is not a valid ISO 4217 code." },
          { type: "date_not_future", severity: "warning", message: "Payment date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["receiptNumber", "declarationRef", "totalAmount", "paymentDate"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 62. ECOWAS/UEMOA Certificate of Origin (origin: ECOWAS countries) ──
    {
      ruleKey: "ecowas_certificate_of_origin",
      extraConditions: { origin_countries: ["CI","GH","NG","SN","ML","BF","BJ","TG","NE","GN","GM","SL","LR","GW","CV"] },
      titleTemplate: "ECOWAS/UEMOA Certificate of Origin for preferential trade",
      descriptionTemplate: "Certificate of Community origin proving goods qualify for ECOWAS/UEMOA preferential treatment. Required for intra-ECOWAS trade; may support EPA claims for EU exports. Valid for 6-18 months depending on scheme.",
      issuedByTemplate: "ECOWAS National Approval Committee + Customs endorsement",
      whenNeeded: "Before export — issued after customs validates origin criteria",
      tipTemplate: "The ECOWAS certificate has 13 numbered boxes. Boxes 9 (exporter declaration), 10 (authority certification), and 11 (customs endorsement) all require signatures and stamps.",
      portalGuideTemplate: null,
      documentCode: "C644",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 420,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["certificate of origin", "certificat d'origine", "ECOWAS", "UEMOA", "CEDEAO"],
          rejectIfContainsAny: ["invoice", "bill of lading", "phytosanitary"],
        },
        expectedFields: [
          // ECOWAS/UEMOA Certificate numbered boxes
          { name: "certificateNumber", description: "Certificate of Origin N° (unique serial number)", required: true, severityIfMissing: "critical" },
          { name: "producerName", description: "Box 1 — Producer name, trade name, and full address", required: true, severityIfMissing: "critical" },
          { name: "registrationNumber", description: "Box 1 — Registration N° of the producer", required: false, severityIfMissing: "warning" },
          { name: "consigneeName", description: "Box 2 — Consignee name, trade name, and full address", required: true, severityIfMissing: "critical" },
          { name: "originCriteria", description: "Box 3 — Criteria determining origin (wholly produced / sufficiently processed / value added)", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Box 4 — Quantity, nature of goods, and number of packages", required: true, severityIfMissing: "critical" },
          { name: "tariffCode", description: "Box 5 — Tariff & Statistical Nomenclature (HS code)", required: true, severityIfMissing: "critical" },
          { name: "approvalNumber", description: "Box 6 — Approval number of goods (ETLS pre-approval)", required: false, severityIfMissing: "warning" },
          { name: "grossWeight", description: "Box 7 — Gross weight or other measure", required: true, severityIfMissing: "critical" },
          { name: "invoiceValue", description: "Box 8 — Invoice value (FOB)", required: true, severityIfMissing: "warning" },
          { name: "exporterDeclaration", description: "Box 9 — Declaration by exporter with place, date, and signature", required: true, severityIfMissing: "critical" },
          { name: "authorityEndorsement", description: "Box 10 — Certification by the appropriate Authority with signature and stamp", required: true, severityIfMissing: "critical" },
          { name: "customsEndorsement", description: "Box 11 — Certification by Customs with export document model N°, date, signature, and stamp", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "origin_country_match", severity: "warning", message: "Origin country does not match trade context." },
          { type: "hs_prefix_matches_context", severity: "warning", message: "Tariff nomenclature does not match expected HS code." },
          { type: "numeric_positive", severity: "warning", message: "Gross weight and invoice value must be positive." },
        ],
        minimumAcceptable: { mustHave: ["certificateNumber", "producerName", "consigneeName", "goodsDescription", "authorityEndorsement"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 63. CI Cocoa Export — Bulletin de Vérification (origin: CI, cocoa) ──
    {
      ruleKey: "ci_bulletin_verification",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [18], origin_countries: ["CI"] },
      titleTemplate: "Bulletin de Vérification (BV) — Côte d'Ivoire cocoa quality verification",
      descriptionTemplate: "Quality verification certificate issued after CCC-approved concessionaires test the cocoa lot via ECOQUAL system. Required before fumigation, AMQ, and export authorisation.",
      issuedByTemplate: "CCC-approved quality concessionaire (via Conseil du Café-Cacao ECOQUAL system)",
      whenNeeded: "Pre-shipment — prerequisite for Autorisation d'Empotage and F01 export authorisation",
      tipTemplate: "Request quality analysis via ECOQUAL early. If the lot does not conform, you cannot proceed to fumigation or AMQ.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 421,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["Bulletin de Vérification", "BV", "quality verification", "ECOQUAL", "vérification", "qualité"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "bvNumber", description: "Bulletin de Vérification number", required: true, severityIfMissing: "critical" },
          { name: "ecqualReference", description: "ECOQUAL system reference", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and CCC registration", required: true, severityIfMissing: "critical" },
          { name: "lotIdentifier", description: "Cocoa lot identifier (lot number/batch)", required: true, severityIfMissing: "critical" },
          { name: "gradeResult", description: "Quality grade result (Grade I, Grade II, or non-conforming)", required: true, severityIfMissing: "critical" },
          { name: "humidityLevel", description: "Humidity level (% — must be ≤8% for export)", required: true, severityIfMissing: "critical" },
          { name: "defectRate", description: "Defect rate (mouldy, slaty, insect-damaged, germinated beans %)", required: true, severityIfMissing: "critical" },
          { name: "foreignMatter", description: "Foreign matter percentage", required: false, severityIfMissing: "warning" },
          { name: "weightKg", description: "Weight of lot in kilograms", required: true, severityIfMissing: "critical" },
          { name: "concessionaireName", description: "CCC-approved quality concessionaire name", required: true, severityIfMissing: "critical" },
          { name: "inspectionDate", description: "Date of quality inspection", required: true, severityIfMissing: "critical" },
          { name: "conformityStatus", description: "Conformity status (conforme / non-conforme)", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Weight and defect rates must be valid numbers." },
          { type: "date_not_future", severity: "warning", message: "Inspection date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["bvNumber", "lotIdentifier", "gradeResult", "conformityStatus"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "BV is a prerequisite for fumigation, AMQ, and F01 export authorisation. Quality testing done through CCC-approved concessionaires via the ECOQUAL system. Non-conforming lots cannot proceed to export. Humidity ≤8%, defect rates per CCC quality standards.",
        },
      },
    },
    // ── 64. CI Cocoa Export — Autorisation de Mise à Quai (AMQ) ──
    {
      ruleKey: "ci_amq",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [18], origin_countries: ["CI"] },
      titleTemplate: "Autorisation de Mise à Quai (AMQ) — DPVCQ phytosanitary clearance for quay loading",
      descriptionTemplate: "Authorisation issued by DPVCQ (Direction de la Protection des Végétaux et du Contrôle de la Qualité) after satisfactory phytosanitary inspection. Valid for 3 days. Required before container stuffing.",
      issuedByTemplate: "DPVCQ — Ministry of Agriculture, Côte d'Ivoire",
      whenNeeded: "Pre-shipment — after fumigation attestation, before Autorisation d'Empotage",
      tipTemplate: "AMQ is only valid for 3 days. Coordinate timing with container stuffing and vessel schedule. Requires: Demande de Contrôle (3 copies) + fumigation attestation + export approval copy + inspection payment.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 422,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["AMQ", "Autorisation de Mise à Quai", "mise à quai", "DPVCQ", "phytosanitaire"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "amqNumber", description: "AMQ authorisation number", required: true, severityIfMissing: "critical" },
          { name: "dpvcqReference", description: "DPVCQ inspection reference", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name", required: true, severityIfMissing: "critical" },
          { name: "lotIdentifier", description: "Cocoa lot identifier", required: true, severityIfMissing: "critical" },
          { name: "fumigationAttestationRef", description: "Fumigation attestation reference number", required: true, severityIfMissing: "critical" },
          { name: "inspectionResult", description: "DPVCQ phytosanitary inspection result (pass/fail)", required: true, severityIfMissing: "critical" },
          { name: "weightKg", description: "Weight inspected (kg)", required: true, severityIfMissing: "critical" },
          { name: "issueDate", description: "AMQ issue date", required: true, severityIfMissing: "critical" },
          { name: "expiryDate", description: "AMQ expiry date (valid 3 days only)", required: true, severityIfMissing: "critical" },
          { name: "inspectorName", description: "DPVCQ inspector name and signature", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
          { type: "numeric_positive", severity: "critical", message: "Weight must be positive." },
        ],
        minimumAcceptable: { mustHave: ["amqNumber", "inspectionResult", "fumigationAttestationRef"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "AMQ is valid for only 3 days — coordinate with container stuffing and vessel schedule. Requires fumigation attestation + demande de contrôle (3 copies) + export approval copy + inspection payment receipt. Must be obtained BEFORE container stuffing (empotage).",
        },
      },
    },
    // ── 65. CI Cocoa Export — F01 Export Authorisation ──
    {
      ruleKey: "ci_f01_export_auth",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [18], origin_countries: ["CI"] },
      titleTemplate: "Autorisation d'Exportation F01 — Conseil du Café-Cacao export clearance for cocoa",
      descriptionTemplate: "Export authorisation from the Coffee-Cocoa Council (CCC) required for customs declaration validation. Requires: exporter approval, F01 bulletin, Bulletin de Vérification, Autorisation d'Empotage, and certificate of origin.",
      issuedByTemplate: "Conseil du Café-Cacao (CCC)",
      whenNeeded: "Pre-shipment — before customs declaration (D6) can be validated",
      tipTemplate: "F01 issuance takes about half a day. Ensure you have BV, AE (Autorisation d'Empotage), and certificate of origin (SGP or EUR.1) from CCI-CI ready.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 423,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["F01", "Autorisation d'Exportation", "CCC", "Conseil du Café-Cacao", "export authorisation", "autorisation export"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "f01Number", description: "F01 authorisation number", required: true, severityIfMissing: "critical" },
          { name: "cccReference", description: "CCC (Coffee-Cocoa Council) reference", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and CCC exporter licence number", required: true, severityIfMissing: "critical" },
          { name: "buyerName", description: "Buyer/consignee name and country", required: true, severityIfMissing: "critical" },
          { name: "commodityDescription", description: "Commodity description (cocoa beans, grade)", required: true, severityIfMissing: "critical" },
          { name: "weightKg", description: "Weight in kilograms", required: true, severityIfMissing: "critical" },
          { name: "bvReference", description: "Bulletin de Vérification (BV) reference number", required: true, severityIfMissing: "critical" },
          { name: "aeReference", description: "Autorisation d'Empotage reference number", required: true, severityIfMissing: "critical" },
          { name: "originCertificateRef", description: "Certificate of origin reference (SGP or EUR.1 from CCI-CI)", required: true, severityIfMissing: "critical" },
          { name: "contractReference", description: "Export contract reference", required: true, severityIfMissing: "warning" },
          { name: "issueDate", description: "F01 issue date", required: true, severityIfMissing: "critical" },
          { name: "campaignYear", description: "Cocoa campaign year", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Weight must be positive." },
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["f01Number", "exporterName", "bvReference", "aeReference"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "F01 issuance takes approximately half a day. Requires: exporter approval (agrément), F01 bulletin, BV, AE (Autorisation d'Empotage), and certificate of origin (SGP or EUR.1 from CCI-CI). F01 is prerequisite for customs declaration (D6) validation.",
        },
      },
    },
    // ── 66. CI Export — Weighing Certificate / VGM (SOLAS) ──
    {
      ruleKey: "ci_weighing_certificate",
      extraConditions: { origin_countries: ["CI"] },
      titleTemplate: "Certificat de Pesage / Weighing Certificate — SOLAS VGM verification",
      descriptionTemplate: "Gross verified mass (VGM) certificate issued at port by CCI-CI (Chambre de Commerce et d'Industrie). Mandatory for all containerised exports under SOLAS. Systematic for cocoa exports.",
      issuedByTemplate: "Chambre de Commerce et d'Industrie de Côte d'Ivoire (CCI-CI)",
      whenNeeded: "At port — before final loading onto vessel",
      tipTemplate: "The ticket de pesée has strict format requirements including container number (11 chars), seal number, booking number, and VGM in kg.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 424,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["pesage", "weighing", "VGM", "verified gross mass", "SOLAS", "ticket de pesée"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "containerNumber", description: "Container number (11 characters, no slash)", required: true, severityIfMissing: "critical" },
          { name: "sealNumber", description: "Container seal number (numéro du plomb)", required: true, severityIfMissing: "critical" },
          { name: "bookingNumber", description: "Shipping line booking number", required: true, severityIfMissing: "warning" },
          { name: "weighingDate", description: "Date and time of weighing (format: yyyy/mm/dd hh:mm:ss)", required: true, severityIfMissing: "critical" },
          { name: "vgmKg", description: "Verified Gross Mass in kilograms (VGM)", required: true, severityIfMissing: "critical" },
          { name: "solasMethod", description: "SOLAS method used: M1 (weigh entire container) or M2 (sum of contents + tare)", required: true, severityIfMissing: "critical" },
          { name: "responsibleEntity", description: "Name of responsible entity in uppercase (shipper/freight forwarder)", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
          { type: "numeric_positive", severity: "critical", message: "VGM weight must be a positive value." },
          { type: "date_not_future", severity: "critical", message: "Weighing date cannot be in the future." },
        ],
        minimumAcceptable: { mustHave: ["containerNumber", "vgmKg", "solasMethod"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 67. CI Cocoa Export — Fumigation/Treatment Certificate ──
    {
      ruleKey: "ci_fumigation_certificate",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [18], origin_countries: ["CI"] },
      titleTemplate: "Attestation de Fumigation — phytosanitary treatment certificate for cocoa",
      descriptionTemplate: "Fumigation/treatment certificate issued by CCC-approved private fumigation companies after phytosanitary treatment of cocoa lots. Required before DPVCQ inspection and AMQ issuance.",
      issuedByTemplate: "CCC-approved private fumigation company",
      whenNeeded: "Pre-shipment — after quality verification (BV), before DPVCQ inspection",
      tipTemplate: "The fumigation attestation is a prerequisite for DPVCQ inspection. Without it, you cannot obtain the AMQ or the phytosanitary certificate.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 425,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["fumigation", "attestation de fumigation", "traitement", "phytosanitaire", "désinsectisation"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "attestationNumber", description: "Fumigation attestation number", required: true, severityIfMissing: "critical" },
          { name: "fumigationCompany", description: "CCC-approved fumigation company name", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name", required: true, severityIfMissing: "critical" },
          { name: "lotIdentifier", description: "Cocoa lot identifier", required: true, severityIfMissing: "critical" },
          { name: "treatmentMethod", description: "Treatment method (phosphine, methyl bromide, etc.)", required: true, severityIfMissing: "critical" },
          { name: "chemicalUsed", description: "Chemical product used and dosage", required: true, severityIfMissing: "critical" },
          { name: "exposureDuration", description: "Exposure/treatment duration (hours)", required: true, severityIfMissing: "critical" },
          { name: "temperature", description: "Temperature during treatment (°C)", required: false, severityIfMissing: "warning" },
          { name: "treatmentDate", description: "Date and time of fumigation treatment", required: true, severityIfMissing: "critical" },
          { name: "weightKg", description: "Weight of lot treated (kg)", required: true, severityIfMissing: "critical" },
          { name: "resultCertification", description: "Certification that treatment was effective", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Treatment date should not be in the future." },
          { type: "numeric_positive", severity: "critical", message: "Weight and dosage must be positive." },
        ],
        minimumAcceptable: { mustHave: ["attestationNumber", "fumigationCompany", "treatmentMethod", "resultCertification"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Fumigation is a prerequisite for DPVCQ inspection and AMQ issuance. Only CCC-approved fumigation companies can issue valid attestations. Treatment must comply with ISPM-15 and destination country requirements for chemical residue limits.",
        },
      },
    },
    // ── 68. Cargo Tracking Note / BSC (origin: CI, sea freight) ──
    {
      ruleKey: "ci_bsc_cargo_tracking",
      extraConditions: { origin_countries: ["CI"] },
      titleTemplate: "Bordereau de Suivi des Cargaisons (BSC) — cargo tracking note",
      descriptionTemplate: "Electronic cargo tracking note managed by OIC (Office Ivoirien des Chargeurs) for all sea freight shipments to/from Côte d'Ivoire. Supports statistics and trade facilitation.",
      issuedByTemplate: "Office Ivoirien des Chargeurs (OIC)",
      whenNeeded: "Pre-shipment — for sea freight shipments",
      tipTemplate: "The BSC is obtained via the OIC platform. It tracks the cargo from origin to destination and is required for sea freight.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 426,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["BSC", "Bordereau de Suivi", "cargo tracking", "OIC", "Office Ivoirien des Chargeurs", "suivi des cargaisons"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          { name: "bscNumber", description: "BSC reference number", required: true, severityIfMissing: "critical" },
          { name: "shipperName", description: "Shipper/exporter name and address", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Consignee name and address", required: true, severityIfMissing: "critical" },
          { name: "vesselName", description: "Vessel name and voyage number", required: true, severityIfMissing: "critical" },
          { name: "portOfLoading", description: "Port of loading (Abidjan, San Pedro)", required: true, severityIfMissing: "critical" },
          { name: "portOfDischarge", description: "Port of discharge/destination", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross weight (kg)", required: true, severityIfMissing: "critical" },
          { name: "containerNumbers", description: "Container number(s)", required: true, severityIfMissing: "warning" },
          { name: "blReference", description: "Bill of Lading reference", required: true, severityIfMissing: "critical" },
          { name: "freightCharges", description: "Freight charges details", required: false, severityIfMissing: "info" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "Weight must be positive." },
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
        ],
        minimumAcceptable: { mustHave: ["bscNumber", "shipperName", "vesselName", "portOfLoading"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 69. CI Export — Customs Declaration D6 ──
    {
      ruleKey: "ci_d6_export_declaration",
      extraConditions: { origin_countries: ["CI"] },
      titleTemplate: "Déclaration en détail D6 — Côte d'Ivoire export customs declaration",
      descriptionTemplate: "Export customs declaration printed from the CI customs IT system (SIDAM/SYDAM). Filed by the freight forwarder. Validation requires CCC export authorisation (F01), DPVCQ clearance, and other prerequisites. DUS (Droit Unique de Sortie) is automatically paid at D6 edition.",
      issuedByTemplate: "Direction Générale des Douanes de Côte d'Ivoire (via freight forwarder)",
      whenNeeded: "At export — after all CCC/DPVCQ/phyto prerequisites are validated",
      tipTemplate: "The D6 is the formal export declaration. DUS is auto-deducted at printing. Ensure F01, BV, AE, and certificate of origin are all validated before requesting D6.",
      portalGuideTemplate: null,
      documentCode: "D6",
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 427,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["D6", "déclaration en détail", "export declaration", "customs declaration", "SIDAM", "SYDAM", "DUS"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          { name: "d6Number", description: "D6 customs declaration number (SIDAM/SYDAM reference)", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name and customs registration", required: true, severityIfMissing: "critical" },
          { name: "freightForwarder", description: "Freight forwarder name (filing agent)", required: true, severityIfMissing: "critical" },
          { name: "consigneeName", description: "Consignee/buyer name and address", required: true, severityIfMissing: "critical" },
          { name: "commodityDescription", description: "Description of goods", required: true, severityIfMissing: "critical" },
          { name: "hsCode", description: "HS code (tariff classification)", required: true, severityIfMissing: "critical" },
          { name: "fobValue", description: "FOB value", required: true, severityIfMissing: "critical" },
          { name: "currency", description: "Invoice currency", required: true, severityIfMissing: "warning" },
          { name: "netWeight", description: "Net weight (kg)", required: true, severityIfMissing: "critical" },
          { name: "grossWeight", description: "Gross weight (kg)", required: true, severityIfMissing: "warning" },
          { name: "f01Reference", description: "CCC F01 export authorisation reference", required: true, severityIfMissing: "critical" },
          { name: "dusAmount", description: "DUS (Droit Unique de Sortie) amount paid", required: true, severityIfMissing: "critical" },
          { name: "containerNumbers", description: "Container number(s)", required: true, severityIfMissing: "warning" },
          { name: "portOfLoading", description: "Port of loading", required: true, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "hs_prefix_matches_context", severity: "warning", message: "HS code does not match expected cocoa product." },
          { type: "weight_net_less_than_gross", severity: "warning", message: "Net weight exceeds gross weight." },
          { type: "numeric_positive", severity: "critical", message: "Values and weights must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Currency code should be valid ISO 4217." },
        ],
        minimumAcceptable: { mustHave: ["d6Number", "exporterName", "hsCode", "f01Reference"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "D6 is the formal CI export declaration. DUS (Droit Unique de Sortie) is automatically deducted at D6 printing. All CCC/DPVCQ prerequisites (F01, BV, AE, certificate of origin) must be validated before D6 can be issued. Filed through SIDAM/SYDAM customs IT system.",
        },
      },
    },
    // ── 70. CI Export — Fiche d'Empotage (container stuffing report) ──
    {
      ruleKey: "ci_fiche_empotage",
      extraConditions: { origin_countries: ["CI"] },
      titleTemplate: "Fiche d'Empotage — container stuffing request and report",
      descriptionTemplate: "Digitised container stuffing request/report from the CI customs platform (douanes.ci). Automates controls linked to export declaration release. Links container stuffing operations to the D6 export declaration.",
      issuedByTemplate: "Direction Générale des Douanes de Côte d'Ivoire (digital service)",
      whenNeeded: "Pre-shipment — at container stuffing, linked to export declaration",
      tipTemplate: "The Fiche d'Empotage is now digital via douanes.ci. It dematerialises stuffing requests and automates controls tied to export declaration release.",
      portalGuideTemplate: "https://www.douanes.ci/info/fiche-d-empotage",
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 428,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["fiche d'empotage", "empotage", "container stuffing", "stuffing report", "douanes.ci"],
          rejectIfContainsAny: ["invoice", "certificate of origin", "phytosanitary"],
        },
        expectedFields: [
          { name: "ficheNumber", description: "Fiche d'empotage reference number", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter name", required: true, severityIfMissing: "critical" },
          { name: "containerNumber", description: "Container number being stuffed", required: true, severityIfMissing: "critical" },
          { name: "sealNumber", description: "Container seal number applied", required: true, severityIfMissing: "critical" },
          { name: "goodsDescription", description: "Description of goods stuffed into container", required: true, severityIfMissing: "critical" },
          { name: "numberOfBags", description: "Number of bags/packages loaded", required: true, severityIfMissing: "critical" },
          { name: "totalWeight", description: "Total weight loaded (kg)", required: true, severityIfMissing: "critical" },
          { name: "d6Reference", description: "Export declaration D6 reference linked to this stuffing", required: true, severityIfMissing: "critical" },
          { name: "stuffingDate", description: "Date and time of container stuffing", required: true, severityIfMissing: "critical" },
          { name: "stuffingLocation", description: "Location of container stuffing (warehouse, depot)", required: true, severityIfMissing: "warning" },
          { name: "customsPresence", description: "Customs officer presence confirmation", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "container_number_format", severity: "warning", message: "Container number does not match ISO 6346 format." },
          { type: "numeric_positive", severity: "critical", message: "Weight and bag count must be positive." },
          { type: "date_not_future", severity: "warning", message: "Stuffing date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["ficheNumber", "containerNumber", "d6Reference", "totalWeight"], ifMissing: "ISSUES_FOUND" },
      },
    },
    // ── 71. CI Cocoa Export — Agrément d'Exportation (exporter licence) ──
    {
      ruleKey: "ci_agrement_exportation",
      triggerFlag: "sps",
      extraConditions: { hs_chapters: [18], origin_countries: ["CI"] },
      titleTemplate: "Agrément d'Exportation — CCC exporter licence for cocoa",
      descriptionTemplate: "Annual licence from the Coffee-Cocoa Council (CCC) authorising the profession of cocoa exporter. Must be renewed each campaign year. Prerequisite for all cocoa export authorisations.",
      issuedByTemplate: "Conseil du Café-Cacao (CCC)",
      whenNeeded: "Licensing prerequisite — renewed annually per campaign",
      tipTemplate: "This is a once-per-year licence, not a per-shipment document. Ensure it's valid for the current campaign before starting any cocoa export process.",
      portalGuideTemplate: null,
      documentCode: null,
      isSupplierSide: true,
      owner: "SUPPLIER",
      dueBy: "BEFORE_LOADING",
      sortOrder: 419,
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["agrément", "exporter licence", "CCC licence", "exporter approval", "agrement", "exportation licence"],
          rejectIfContainsAny: ["invoice", "bill of lading", "certificate of origin"],
        },
        expectedFields: [
          { name: "agrementNumber", description: "CCC exporter licence number", required: true, severityIfMissing: "critical" },
          { name: "exporterName", description: "Exporter company name and legal form", required: true, severityIfMissing: "critical" },
          { name: "exporterAddress", description: "Exporter registered address in Côte d'Ivoire", required: true, severityIfMissing: "critical" },
          { name: "legalRepresentative", description: "Legal representative name", required: true, severityIfMissing: "warning" },
          { name: "commodityCovered", description: "Commodity covered (cocoa, coffee, or both)", required: true, severityIfMissing: "critical" },
          { name: "campaignYear", description: "Campaign year/period of validity", required: true, severityIfMissing: "critical" },
          { name: "issueDate", description: "Date of licence issue", required: true, severityIfMissing: "critical" },
          { name: "expiryDate", description: "Date of licence expiry (annual renewal)", required: true, severityIfMissing: "critical" },
          { name: "cccStamp", description: "CCC official stamp and signature", required: true, severityIfMissing: "critical" },
          { name: "financialGuarantee", description: "Financial guarantee/caution reference (if required)", required: false, severityIfMissing: "warning" },
        ],
        consistencyChecks: [
          { type: "date_not_future", severity: "warning", message: "Issue date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["agrementNumber", "exporterName", "campaignYear", "expiryDate"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "This is a once-per-year licence, not a per-shipment document. Must be renewed each cocoa campaign year. It is a prerequisite for all cocoa export authorisations (F01). The CCC controls licence issuance and can suspend/revoke for non-compliance.",
        },
      },
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
      validationSpec: {
        docTypeGate: {
          mustContainAny: ["VAT", "GST", "value added tax", "goods and services tax", "import VAT", "TVA", "customs receipt", "tax payment"],
          rejectIfContainsAny: ["phytosanitary", "certificate of origin", "CITES"],
        },
        expectedFields: [
          { name: "taxReceiptNumber", description: "VAT/GST payment receipt or assessment number", required: true, severityIfMissing: "critical" },
          { name: "importerName", description: "Importer name and tax registration number (VAT/GST number)", required: true, severityIfMissing: "critical" },
          { name: "declarationRef", description: "Customs declaration reference linked to this VAT/GST payment", required: true, severityIfMissing: "critical" },
          { name: "cifValue", description: "CIF value (base for VAT/GST calculation)", required: true, severityIfMissing: "critical" },
          { name: "dutyAmount", description: "Customs duty amount (included in VAT base in some jurisdictions)", required: false, severityIfMissing: "warning" },
          { name: "vatGstRate", description: "Applicable VAT/GST rate (%)", required: true, severityIfMissing: "critical" },
          { name: "vatGstAmount", description: "VAT/GST amount payable", required: true, severityIfMissing: "critical" },
          { name: "currency", description: "Currency of payment (ISO 4217)", required: true, severityIfMissing: "warning" },
          { name: "paymentDate", description: "Date of payment", required: true, severityIfMissing: "critical" },
        ],
        consistencyChecks: [
          { type: "numeric_positive", severity: "critical", message: "CIF value and VAT/GST amount must be positive." },
          { type: "currency_code_valid", severity: "warning", message: "Currency code should be valid ISO 4217." },
          { type: "date_not_future", severity: "warning", message: "Payment date should not be in the future." },
        ],
        minimumAcceptable: { mustHave: ["taxReceiptNumber", "importerName", "vatGstAmount"], ifMissing: "ISSUES_FOUND" },
        outputHints: {
          notes: "Import VAT/GST is usually recoverable as input tax credit if the importer is VAT/GST-registered. VAT base typically = CIF value + customs duty + other levies. Rates: EU ~21%, UK 20%, UAE 5%, Canada 5% (GST), Switzerland 8.1%, Turkey 20%. Keep the customs receipt for VAT recovery claims.",
        },
      },
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
