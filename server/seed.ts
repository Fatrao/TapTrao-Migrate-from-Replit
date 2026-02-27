import { db } from "./db";
import {
  destinations,
  regionalFrameworks,
  originCountries,
  commodities,
  afcftaRoo,
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
    await db.transaction(async (tx) => {
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
          specialRules: {},
          preferenceSchemes: [],
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
    await db.transaction(async (tx) => {
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
    await db.transaction(async (tx) => {
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
    await db.transaction(async (tx) => {
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
    await db.transaction(async (tx) => {
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
