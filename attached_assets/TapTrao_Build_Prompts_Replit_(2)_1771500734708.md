# TapTrao Build Prompts — Replit Agent Sequence

**Domain:** taptrao.com / taptrao.app

## How to use this document

Feed each prompt to Replit Agent **one at a time, in order**. Wait until each step is working and deployed before moving to the next. Test after every prompt. If something breaks, tell Replit Agent what's wrong — don't skip ahead.

**Stack:** Next.js 14 (App Router) + PostgreSQL (Replit DB or Neon) + Drizzle ORM + Tailwind CSS + Shadcn/UI
**Total prompts:** 12 (Phase 1 = prompts 1-8, gets you to revenue)

### Why Replit, not the ChatGPT enterprise architecture

ChatGPT produced a 15-prompt enterprise build: monorepo, Prisma, Temporal/Camunda workflow orchestration, Kubernetes, KMS envelope encryption, Row-Level Security, Docker, mock authority servers. That's an architecture for a funded team of 5-10 engineers. You're a solo founder who needs revenue in 2 weeks.

The ChatGPT architecture is useful as a FUTURE roadmap — keep it for when you have paying users and need to harden the platform. But building it now means you spend 3 months on infrastructure before a single trader can do a lookup.

What you need NOW: a working product that takes money. Everything below gets you there.

---

## PROMPT 1: Project Setup + Database Schema

```
Create a Next.js 14 App Router project with TypeScript, Tailwind CSS, and Shadcn/UI.

Set up a PostgreSQL database with the following 5 tables. Use Drizzle ORM for type-safe queries.

TABLE 1 — destinations
- id: UUID primary key
- country_name: string (e.g. "United Kingdom")
- iso2: string(2) unique (e.g. "GB")
- tariff_source: string (e.g. "UK Trade Tariff API")
- vat_rate: decimal (e.g. 20.0)
- sps_regime: string (e.g. "IPAFFS + Port Health")
- security_filing: string (e.g. "CHIEF/CDS Entry")
- special_rules: JSONB (commodity-specific import rules)
- preference_schemes: JSONB (e.g. GSP, EPA, AfCFTA)
- is_afcfta_member: boolean default false
- created_at: timestamp

TABLE 2 — regional_frameworks
- id: UUID primary key
- name: string (e.g. "ECOWAS/WAEMU")
- member_countries: text array (ISO2 codes)
- cet_bands: JSONB (e.g. {"band_0": 0, "band_1": 5, "band_2": 10, "band_3": 20, "band_4": 35})
- coo_type: string (e.g. "ECOWAS Certificate of Origin")
- export_procedures: text
- customs_code: string (e.g. "ECOWAS CET")

TABLE 3 — origin_countries
- id: UUID primary key
- country_name: string
- iso2: string(2) unique
- framework_id: UUID foreign key to regional_frameworks
- phyto_authority: string (exact name of phytosanitary authority)
- coo_issuing_body: string (who issues Certificates of Origin)
- customs_admin: string (customs authority name)
- trade_portal_url: string nullable
- commodity_councils: JSONB (e.g. {"cocoa": "COCOBOD", "cashew": "CCA"})
- operational_notes: text
- is_afcfta_member: boolean default true

TABLE 4 — commodities
- id: UUID primary key
- name: string (e.g. "Raw Cashew Nuts")
- hs_code: string (e.g. "0801.31")
- commodity_type: enum ("agricultural", "mineral", "forestry", "seafood", "livestock", "manufactured")
- triggers_sps: boolean default false
- triggers_eudr: boolean default false
- triggers_kimberley: boolean default false
- triggers_conflict: boolean default false
- triggers_cbam: boolean default false
- triggers_csddd: boolean default false
- triggers_iuu: boolean default false
- triggers_cites: boolean default false
- known_hazards: text array (e.g. ["aflatoxin", "salmonella"])
- stop_flags: JSONB nullable (e.g. {"gold_to_turkey": "Borsa Istanbul members only"})
- created_at: timestamp

TABLE 5 — afcfta_roo (Rules of Origin)
- id: UUID primary key
- hs_heading: string (e.g. "0801")
- general_rule: enum ("WHOLLY_OBTAINED", "VALUE_ADD", "CTH", "CTSH", "SPECIFIC_PROCESS")
- min_value_add_pct: integer nullable (e.g. 40)
- alternative_criteria: JSONB nullable (e.g. {"options": ["CTH", "40% value add"]})
- specific_process: text nullable
- notes: text nullable
- source_ref: string (e.g. "Annex 2, Schedule A, HS 08")
- updated_at: timestamp

Create all tables with proper foreign keys and indexes on iso2, hs_code, and hs_heading columns.

IMPORTANT DATABASE SAFETY RULE — apply to ALL seed operations throughout the build:
Wrap all seed/insert operations in database transactions. If any insert fails, rollback the entire transaction and report the error clearly. Never leave the database in a half-seeded state.

Add a homepage at / with just a centered logo placeholder and tagline: "Trade compliance for commodity traders. No ERP required." with a "Start Lookup" button that links to /lookup.

Deploy and confirm the database tables are created.
```

---

## PROMPT 2: Seed Data — Destinations + Regional Frameworks + Origins

```
Seed the database with real data for all 5 tables. This is a trade compliance platform — accuracy matters.

DESTINATIONS (Table 1) — insert these 6:
1. United Kingdom (GB): VAT 20%, tariff source "UK Trade Tariff API", SPS regime "IPAFFS + Port Health", security filing "CHIEF/CDS customs entry". Preference schemes: ["GSP", "EPA", "DCTS"]. NOT AfCFTA member.
2. European Union (EU): VAT varies by state (use 21% as average), tariff source "TARIC", SPS regime "TRACES/CHED", security filing "ENS". Preference schemes: ["GSP", "EPA", "EBA"]. NOT AfCFTA member.
3. Turkey (TR): VAT 20%, tariff source "Turkey Customs Tariff", SPS regime "Turkey food safety authority", security filing "NCTS". NOT AfCFTA.
4. United Arab Emirates (AE): VAT 5%, tariff source "UAE Federal Customs", SPS regime "MOCCAE import permit", security filing "Dubai Trade portal". NOT AfCFTA.
5. China (CN): VAT 13%, tariff source "China Customs Tariff Commission", SPS regime "GACC registration required", security filing "China customs declaration". NOT AfCFTA.
6. United States (US): VAT 0% (no federal VAT), tariff source "USITC HTS", SPS regime "FDA/USDA/APHIS", security filing "ISF 10+2". NOT AfCFTA.

REGIONAL FRAMEWORKS (Table 2) — insert these 5:
1. ECOWAS/WAEMU: members ["BJ","BF","CV","CI","GM","GH","GN","GW","LR","ML","NE","NG","SN","SL","TG"], 5-band CET {0,5,10,20,35}, CoO type "ECOWAS Certificate of Origin", customs code "ECOWAS CET"
2. CEMAC: members ["CM","CF","TD","CG","GQ","GA"], 4-band CET {5,10,20,30}, CoO type "CEMAC Certificate of Origin", customs code "CEMAC Common Tariff"
3. EAC: members ["BI","CD","KE","RW","SS","TZ","UG","SO"], 3-band CET {0,10,25}, CoO type "EAC Certificate of Origin", customs code "EAC CET"
4. SADC/SACU: members ["AO","BW","CD","SZ","LS","MG","MW","MU","MZ","NA","SC","ZA","TZ","ZM","ZW","KM"], CoO type "SADC Certificate of Origin", customs code "SADC FTA Tariff"
5. UMA: members ["DZ","LY","MR","MA","TN"], CoO type "National CoO + EUR.1 for EU", customs code "National tariff + EU Association"

ORIGIN COUNTRIES (Table 3) — insert these 18 with REAL authority names:
1. Côte d'Ivoire (CI) — framework: ECOWAS. Phyto: "LANADA/DPVCQ". CoO: "Chambre de Commerce et d'Industrie de Côte d'Ivoire". Customs: "Direction Générale des Douanes". Councils: {"cocoa": "Conseil du Café-Cacao (CCC)", "cashew": "Conseil du Coton et de l'Anacarde (CCA)"}
2. Ghana (GH) — framework: ECOWAS. Phyto: "Plant Protection and Regulatory Services Directorate (PPRSD)". CoO: "Ghana National Chamber of Commerce". Customs: "Ghana Revenue Authority – Customs Division". Councils: {"cocoa": "COCOBOD", "gold": "Minerals Commission"}
3. Nigeria (NG) — framework: ECOWAS. Phyto: "NAQS (Nigeria Agricultural Quarantine Service)". CoO: "Nigerian Association of Chambers of Commerce (NACCIMA)". Customs: "Nigeria Customs Service". Councils: {"oil": "DPR/NUPRC"}
4. Senegal (SN) — framework: ECOWAS. Phyto: "Direction de la Protection des Végétaux (DPV)". CoO: "Chambre de Commerce de Dakar". Customs: "Direction Générale des Douanes"
5. Cameroon (CM) — framework: CEMAC. Phyto: "MINADER/DRCQ". CoO: "Chambre de Commerce du Cameroun". Customs: "Direction Générale des Douanes"
6. Kenya (KE) — framework: EAC. Phyto: "KEPHIS (Kenya Plant Health Inspectorate Service)". CoO: "Kenya National Chamber of Commerce and Industry". Customs: "Kenya Revenue Authority – Customs". Councils: {"tea": "Tea Board of Kenya", "flowers": "Kenya Flower Council"}
7. Tanzania (TZ) — framework: EAC. Phyto: "TPRI (Tropical Pesticides Research Institute)". CoO: "Tanzania Chamber of Commerce". Customs: "Tanzania Revenue Authority"
8. Uganda (UG) — framework: EAC. Phyto: "MAAIF". CoO: "Uganda National Chamber of Commerce". Customs: "Uganda Revenue Authority"
9. Ethiopia (ET) — framework: none (observer AfCFTA). Phyto: "Ethiopian Institute of Agricultural Research (EIAR)". CoO: "Ethiopian Chamber of Commerce". Customs: "Ethiopian Customs Commission". Councils: {"coffee": "Ethiopian Coffee and Tea Authority"}
10. South Africa (ZA) — framework: SADC. Phyto: "DALRRD (Dept of Agriculture, Land Reform and Rural Development)". CoO: "SARS via RLA". Customs: "SARS Customs". Councils: {"wine": "SAWIS", "citrus": "Citrus Growers Association"}
11. Morocco (MA) — framework: UMA. Phyto: "ONSSA". CoO: "Chambre de Commerce du Maroc". Customs: "Administration des Douanes et Impôts Indirects"
12. Tunisia (TN) — framework: UMA. Phyto: "Direction Générale de la Santé Végétale". CoO: "Chambre de Commerce de Tunis". Customs: "Douane Tunisienne"
13. Democratic Republic of Congo (CD) — framework: EAC (also SADC). Phyto: "SENASEM". CoO: "Fédération des Entreprises du Congo". Customs: "DGDA"
14. Burkina Faso (BF) — framework: ECOWAS. Phyto: "DPVC". CoO: "Chambre de Commerce du Burkina Faso". Customs: "Direction Générale des Douanes"
15. Mali (ML) — framework: ECOWAS. Phyto: "Direction Nationale de l'Agriculture". CoO: "Chambre de Commerce du Mali". Customs: "Direction Générale des Douanes"
16. Guinea (GN) — framework: ECOWAS. Phyto: "Service National de la Protection des Végétaux". CoO: "Chambre de Commerce de Guinée". Customs: "Direction Nationale des Douanes". Councils: {"bauxite": "Ministry of Mines"}
17. Mozambique (MZ) — framework: SADC. Phyto: "IIAM". CoO: "Mozambique Chamber of Commerce". Customs: "Autoridade Tributária de Moçambique"
18. Rwanda (RW) — framework: EAC. Phyto: "RAB (Rwanda Agriculture Board)". CoO: "Rwanda Chamber of Commerce". Customs: "Rwanda Revenue Authority"

All 18 origins are AfCFTA members (is_afcfta_member = true).

Verify all data is inserted by creating a simple /admin/data page that shows counts for each table.
```

---


## PROMPT 3A: Seed Data — Agricultural Commodities (1-94)

```
Seed Table 4 (commodities) with ALL agricultural commodities below. Wrap the entire insert in a database transaction — if any row fails, rollback everything and report the error.

For ALL agricultural commodities: commodity_type = "agricultural", triggers_sps = true.

1. Raw Cashew Nuts — HS 0801.31 — hazards: ["aflatoxin", "moisture_damage"]
2. Shelled Cashew Nuts — HS 0801.32 — hazards: ["aflatoxin"]
3. Cocoa Beans — HS 1801.00 — triggers_eudr: true, triggers_csddd: true — hazards: ["cadmium", "ochratoxin"]
4. Cocoa Butter — HS 1804.00 — triggers_eudr: true — hazards: ["cadmium"]
5. Cocoa Powder — HS 1805.00 — triggers_eudr: true — hazards: ["cadmium"]
6. Cocoa Paste — HS 1803.10 — triggers_eudr: true — hazards: ["cadmium"]
7. Coffee (green/unroasted) — HS 0901.11 — triggers_eudr: true — hazards: ["ochratoxin", "pesticide_residues"]
8. Coffee (roasted) — HS 0901.21 — triggers_eudr: true — hazards: ["ochratoxin"]
9. Coffee (instant/soluble) — HS 2101.11 — triggers_eudr: true — hazards: ["ochratoxin"]
10. Sesame Seeds — HS 1207.40 — hazards: ["salmonella", "ethylene_oxide"]
11. Shea Nuts — HS 1207.99 — hazards: ["aflatoxin"]
12. Shea Butter — HS 1515.90 — hazards: ["none_significant"]
13. Cotton (raw lint) — HS 5201.00 — triggers_csddd: true — hazards: ["pesticide_residues"]
14. Cotton Seed — HS 1207.21 — hazards: ["gossypol"]
15. Cotton Seed Oil — HS 1512.21 — hazards: ["gossypol"]
16. Groundnuts (in shell) — HS 1202.41 — hazards: ["aflatoxin"]
17. Groundnuts (shelled) — HS 1202.42 — hazards: ["aflatoxin"]
18. Groundnut Oil — HS 1508.10 — hazards: ["aflatoxin"]
19. Palm Oil (crude) — HS 1511.10 — triggers_eudr: true — hazards: ["3-MCPD", "mineral_oil"]
20. Palm Oil (refined) — HS 1511.90 — triggers_eudr: true — hazards: ["3-MCPD"]
21. Palm Kernel Oil — HS 1513.21 — triggers_eudr: true — hazards: ["none_significant"]
22. Coconut Oil — HS 1513.11 — hazards: ["none_significant"]
23. Rubber (natural latex) — HS 4001.10 — triggers_eudr: true — hazards: ["none_significant"]
24. Rubber (smoked sheets) — HS 4001.21 — triggers_eudr: true — hazards: ["none_significant"]
25. Rubber (technically specified) — HS 4001.22 — triggers_eudr: true — hazards: ["none_significant"]
26. Soya Beans — HS 1201.90 — triggers_eudr: true — hazards: ["pesticide_residues"]
27. Soya Bean Oil — HS 1507.10 — triggers_eudr: true — hazards: ["none_significant"]
28. Tea (black) — HS 0902.30 — hazards: ["pesticide_residues", "heavy_metals"]
29. Tea (green) — HS 0902.10 — hazards: ["pesticide_residues", "heavy_metals"]
30. Tobacco (unmanufactured) — HS 2401.10 — triggers_csddd: true — hazards: ["pesticide_residues"]
31. Tobacco (manufactured) — HS 2402.20 — triggers_csddd: true — hazards: ["none_significant"]
32. Vanilla Beans — HS 0905.10 — hazards: ["none_significant"]
33. Cloves — HS 0907.10 — hazards: ["none_significant"]
34. Ginger (fresh) — HS 0910.11 — hazards: ["pesticide_residues"]
35. Ginger (dried) — HS 0910.12 — hazards: ["pesticide_residues", "aflatoxin"]
36. Chilli Peppers (dried) — HS 0904.21 — hazards: ["aflatoxin", "sudan_dyes"]
37. Black Pepper — HS 0904.11 — hazards: ["salmonella", "pesticide_residues"]
38. Turmeric — HS 0910.30 — hazards: ["lead", "sudan_dyes"]
39. Cinnamon — HS 0906.11 — hazards: ["coumarin"]
40. Mangoes (fresh) — HS 0804.50 — hazards: ["fruit_fly"]
41. Pineapples (fresh) — HS 0804.30 — hazards: ["fruit_fly"]
42. Avocados — HS 0804.40 — hazards: ["fruit_fly"]
43. Bananas (fresh) — HS 0803.90 — hazards: ["pesticide_residues"]
44. Citrus Fruits (oranges) — HS 0805.10 — hazards: ["citrus_black_spot", "pesticide_residues"]
45. Citrus Fruits (lemons) — HS 0805.50 — hazards: ["citrus_black_spot"]
46. Passion Fruit — HS 0810.90 — hazards: ["fruit_fly"]
47. Papaya — HS 0807.20 — hazards: ["fruit_fly"]
48. Lychees — HS 0810.90 — hazards: ["sulphur_dioxide"]
49. Dried Fruits (mixed) — HS 0813.40 — hazards: ["aflatoxin", "sulphur_dioxide"]
50. Dates — HS 0804.10 — hazards: ["none_significant"]
51. Cassava (fresh) — HS 0714.10 — hazards: ["cyanide"]
52. Cassava (dried chips) — HS 0714.10 — hazards: ["cyanide"]
53. Cassava Flour — HS 1106.20 — hazards: ["cyanide"]
54. Cassava Starch — HS 1108.14 — hazards: ["none_significant"]
55. Yams — HS 0714.40 — hazards: ["pesticide_residues"]
56. Sweet Potatoes — HS 0714.20 — hazards: ["none_significant"]
57. Plantains — HS 0803.10 — hazards: ["none_significant"]
58. Maize/Corn — HS 1005.90 — hazards: ["aflatoxin", "fumonisin"]
59. Sorghum — HS 1007.10 — hazards: ["aflatoxin"]
60. Millet — HS 1008.21 — hazards: ["aflatoxin"]
61. Rice (paddy) — HS 1006.10 — hazards: ["arsenic", "heavy_metals"]
62. Rice (milled) — HS 1006.30 — hazards: ["arsenic"]
63. Wheat — HS 1001.99 — hazards: ["mycotoxins"]
64. Sugar (raw cane) — HS 1701.14 — hazards: ["none_significant"]
65. Sugar (refined) — HS 1701.99 — hazards: ["none_significant"]
66. Honey — HS 0409.00 — hazards: ["antibiotics", "pesticide_residues"]
67. Beeswax — HS 1521.90 — hazards: ["none_significant"]
68. Cut Flowers (roses) — HS 0603.11 — hazards: ["pesticide_residues", "thrips"]
69. Cut Flowers (other) — HS 0603.19 — hazards: ["pesticide_residues", "thrips"]
70. Live Plants — HS 0602.90 — hazards: ["invasive_species", "plant_diseases"]
71. Essential Oils (general) — HS 3301.29 — hazards: ["adulteration"]
72. Ylang-Ylang Oil — HS 3301.29 — hazards: ["none_significant"]
73. Jojoba Oil — HS 1515.90 — hazards: ["none_significant"]
74. Argan Oil — HS 1515.90 — hazards: ["none_significant"]
75. Karité (Shea) Products — HS 1515.90 — hazards: ["none_significant"]
76. Gum Arabic — HS 1301.20 — hazards: ["none_significant"]
77. Kola Nuts — HS 0813.40 — hazards: ["none_significant"]
78. Moringa (leaves/powder) — HS 1211.90 — hazards: ["pesticide_residues"]
79. Hibiscus (dried flowers) — HS 1211.90 — hazards: ["pesticide_residues"]
80. Fonio — HS 1008.90 — hazards: ["none_significant"]
81. Teff — HS 1008.90 — hazards: ["none_significant"]
82. Chickpeas — HS 0713.20 — hazards: ["pesticide_residues"]
83. Cowpeas/Black-Eyed Peas — HS 0713.35 — hazards: ["none_significant"]
84. Pigeon Peas — HS 0713.60 — hazards: ["none_significant"]
85. Lentils — HS 0713.40 — hazards: ["none_significant"]
86. Sunflower Seeds — HS 1206.00 — hazards: ["aflatoxin"]
87. Sunflower Oil — HS 1512.11 — hazards: ["mineral_oil"]
88. Macadamia Nuts — HS 0802.62 — hazards: ["none_significant"]
89. Cashew Nut Shell Liquid — HS 1302.19 — hazards: ["none_significant"]
90. Cocoa Shell/Husk — HS 1802.00 — triggers_eudr: true — hazards: ["cadmium"]
91. Sisal Fibre — HS 5304.10 — hazards: ["none_significant"]
92. Kenaf Fibre — HS 5303.10 — hazards: ["none_significant"]
93. Pyrethrum Extract — HS 1302.19 — hazards: ["none_significant"]
94. Tobacco Stems — HS 2401.30 — triggers_csddd: true — hazards: ["none_significant"]

After seeding, verify: run SELECT COUNT(*) FROM commodities WHERE commodity_type = 'agricultural'. Expected: 94. If not 94, report which ones are missing.
```

---

## PROMPT 3B: Seed Data — Seafood, Livestock & Forestry (95-128)

```
Continue seeding Table 4 (commodities). Wrap in a transaction — rollback on any failure.

SEAFOOD (commodity_type = "seafood", triggers_sps = true, triggers_iuu = true):
95. Tuna (fresh/chilled) — HS 0302.35 — hazards: ["histamine", "mercury"]
96. Tuna (frozen) — HS 0303.45 — hazards: ["histamine", "mercury"]
97. Tuna (canned) — HS 1604.14 — hazards: ["histamine"]
98. Shrimp/Prawns (frozen) — HS 0306.17 — hazards: ["antibiotics", "heavy_metals"]
99. Octopus (frozen) — HS 0307.51 — hazards: ["heavy_metals"]
100. Squid/Cuttlefish — HS 0307.43 — hazards: ["heavy_metals"]
101. Nile Perch (frozen fillets) — HS 0304.59 — hazards: ["none_significant"]
102. Tilapia (frozen) — HS 0303.23 — hazards: ["antibiotics"]
103. Sardines/Pilchards — HS 1604.13 — hazards: ["histamine"]
104. Crab — HS 0306.14 — hazards: ["heavy_metals"]
105. Lobster — HS 0306.12 — hazards: ["none_significant"]
106. Seaweed/Algae — HS 1212.21 — hazards: ["heavy_metals", "iodine"]
107. Dried Fish (stockfish) — HS 0305.59 — hazards: ["histamine"]

LIVESTOCK (commodity_type = "livestock", triggers_sps = true):
108. Cattle (live) — HS 0102.29 — triggers_eudr: true — hazards: ["FMD", "BSE"]
109. Goats (live) — HS 0104.20 — hazards: ["PPR"]
110. Sheep (live) — HS 0104.10 — hazards: ["FMD"]
111. Poultry (live) — HS 0105.11 — hazards: ["avian_influenza", "newcastle_disease"]
112. Goat Hides (raw) — HS 4103.20 — hazards: ["chrome_VI"]
113. Bovine Hides (raw) — HS 4101.20 — hazards: ["anthrax"]
114. Leather (finished bovine) — HS 4107.19 — hazards: ["chrome_VI"]
115. Leather (finished goat) — HS 4106.22 — hazards: ["chrome_VI"]
116. Wool (greasy) — HS 5101.11 — hazards: ["pesticide_residues"]
117. Bone Meal — HS 0506.90 — hazards: ["BSE"]
118. Animal Casings — HS 0504.00 — hazards: ["salmonella"]

FORESTRY (commodity_type = "forestry", triggers_sps = true):
119. Timber (tropical sawn) — HS 4407.29 — triggers_eudr: true, triggers_cites: true — hazards: ["invasive_species"]
120. Timber (logs) — HS 4403.49 — triggers_eudr: true, triggers_cites: true — hazards: ["invasive_species"]
121. Timber (plywood) — HS 4412.31 — triggers_eudr: true — hazards: ["formaldehyde"]
122. Timber (veneer) — HS 4408.39 — triggers_eudr: true — hazards: ["none_significant"]
123. Charcoal (wood) — HS 4402.90 — stop_flags: {"SO_charcoal": "UN Security Council sanctions prohibit charcoal exports from Somalia"} — hazards: ["none"]
124. Bamboo (raw) — HS 1401.10 — hazards: ["none_significant"]
125. Rattan (raw) — HS 1401.20 — hazards: ["none_significant"]
126. Wood Chips — HS 4401.21 — triggers_eudr: true — hazards: ["none_significant"]
127. Paper Pulp (wood) — HS 4703.21 — triggers_eudr: true — hazards: ["none_significant"]
128. Furniture (wooden) — HS 9403.60 — triggers_eudr: true — hazards: ["formaldehyde"]

After seeding, verify counts:
- SELECT COUNT(*) FROM commodities WHERE commodity_type = 'seafood'. Expected: 13
- SELECT COUNT(*) FROM commodities WHERE commodity_type = 'livestock'. Expected: 11
- SELECT COUNT(*) FROM commodities WHERE commodity_type = 'forestry'. Expected: 10
- SELECT COUNT(*) FROM commodities. Expected: 128 (94 + 13 + 11 + 10)
Report any discrepancies.
```

---

## PROMPT 3C: Seed Data — Minerals (129-154)

```
Continue seeding Table 4 (commodities). Wrap in a transaction — rollback on any failure.

IMPORTANT: For ALL minerals, triggers_sps = false.

MINERALS (commodity_type = "mineral", triggers_sps = false):
129. Gold (unwrought) — HS 7108.12 — triggers_conflict: true — stop_flags: {"gold_to_TR": "Borsa Istanbul membership required for gold imports to Turkey"} — hazards: ["mercury_contamination"]
130. Gold (semi-manufactured) — HS 7108.13 — triggers_conflict: true — hazards: ["none"]
131. Rough Diamonds — HS 7102.10 — triggers_kimberley: true — hazards: ["none"]
132. Polished Diamonds — HS 7102.39 — hazards: ["none"]
133. Copper Ore/Concentrates — HS 2603.00 — hazards: ["none"]
134. Copper (refined) — HS 7403.11 — hazards: ["none"]
135. Iron Ore — HS 2601.11 — triggers_cbam: true — hazards: ["none"]
136. Iron/Steel (semi-finished) — HS 7207.11 — triggers_cbam: true — hazards: ["none"]
137. Cobalt Ore — HS 2605.00 — triggers_conflict: true, triggers_csddd: true — hazards: ["none"]
138. Cobalt (refined) — HS 8105.20 — triggers_conflict: true, triggers_csddd: true — hazards: ["none"]
139. Tin Ore (cassiterite) — HS 2609.00 — triggers_conflict: true — hazards: ["none"]
140. Tin (refined) — HS 8001.10 — triggers_conflict: true — hazards: ["none"]
141. Tantalum Ore (coltan) — HS 2615.90 — triggers_conflict: true — hazards: ["none"]
142. Tungsten Ore (wolframite) — HS 2611.00 — triggers_conflict: true — hazards: ["none"]
143. Bauxite — HS 2606.00 — triggers_cbam: true — hazards: ["none"]
144. Aluminium (unwrought) — HS 7601.10 — triggers_cbam: true — hazards: ["none"]
145. Manganese Ore — HS 2602.00 — hazards: ["none"]
146. Chromite Ore — HS 2610.00 — hazards: ["none"]
147. Phosphate Rock — HS 2510.10 — hazards: ["cadmium"]
148. Uranium Ore — HS 2612.10 — stop_flags: {"uranium": "IAEA safeguards required. Nuclear non-proliferation controls apply."} — hazards: ["radioactive"]
149. Lithium Ore (spodumene) — HS 2530.90 — hazards: ["none"]
150. Zinc Ore — HS 2608.00 — hazards: ["none"]
151. Nickel Ore — HS 2604.00 — hazards: ["none"]
152. Platinum Group Metals — HS 7110.11 — hazards: ["none"]
153. Graphite (natural) — HS 2504.10 — hazards: ["none"]
154. Cement (Portland) — HS 2523.29 — triggers_cbam: true — hazards: ["none"]

After seeding, run FULL verification:
- SELECT COUNT(*) FROM commodities WHERE commodity_type = 'mineral'. Expected: 26
- SELECT COUNT(*) FROM commodities. Expected: 154
- SELECT COUNT(*) FROM commodities WHERE triggers_eudr = true. Expected: ~22
- SELECT COUNT(*) FROM commodities WHERE triggers_conflict = true. Expected: ~10
- SELECT COUNT(*) FROM commodities WHERE triggers_cbam = true. Expected: ~6
- SELECT COUNT(*) FROM commodities WHERE triggers_kimberley = true. Expected: 1
- SELECT COUNT(*) FROM commodities WHERE stop_flags IS NOT NULL. Expected: 3

Update the /admin/data page to show:
- Total commodities: 154
- Count by type: agricultural, seafood, livestock, forestry, mineral
- Count by trigger: EUDR, CBAM, CSDDD, Kimberley, Conflict, IUU, CITES
- Any commodities with STOP flags highlighted in red
```

---

## PROMPT 4: Module 2 — Compliance Lookup Engine (Core)

```
Build the Compliance Lookup page at /lookup. This is the core product.

USER INTERFACE:
- 3 dropdown inputs in a clean form: Commodity (from Table 4), Origin Country (from Table 3), Destination Country (from Table 1)
- Big "Run Compliance Check" button ($4.99 — show price on button, but don't implement payment yet)
- Results display below the form after submission

BACKEND — CASCADE LOGIC:
When user submits, the server runs this cascade and returns a JSON result:

LAYER 1 — COMMODITY:
- Look up the commodity in Table 4
- Get: hs_code, commodity_type, all trigger flags, known_hazards, stop_flags

LAYER 2 — ORIGIN:
- Look up origin country in Table 3
- Join to Table 2 (regional_frameworks) via framework_id
- Get: framework name, CET bands, CoO type, export procedures, phyto authority, CoO issuing body, customs admin, commodity councils

LAYER 2.5 — AfCFTA RoO (conditional):
- IF origin.is_afcfta_member AND destination.is_afcfta_member:
  - Query Table 5 for matching hs_heading (first 4 digits of commodity hs_code)
  - Return: general_rule, min_value_add_pct, alternative_criteria, preferential tariff note
  - Show: "AfCFTA preferential tariff may apply. Criteria: [rule]. Required: [AfCFTA CoO type]"
- IF NOT both AfCFTA members: skip this layer

LAYER 3 — DESTINATION:
- Look up destination in Table 1
- Get: vat_rate, sps_regime, security_filing, preference_schemes

LAYER 4 — OVERLAYS:
Build an array of active international regulations based on trigger flags + destination:
- IF triggers_eudr AND (dest is EU or GB): add "EUDR — EU Deforestation Regulation"
- IF triggers_cbam AND (dest is EU): add "CBAM — Carbon Border Adjustment Mechanism"
- IF triggers_csddd AND (dest is EU): add "CSDDD — Corporate Sustainability Due Diligence"
- IF triggers_kimberley: add "Kimberley Process — rough diamond certification required"
- IF triggers_conflict: add "OECD Due Diligence Guidance — conflict mineral verification required"
- IF triggers_iuu: add "IUU Regulation — catch certificate required"
- IF triggers_cites: add "CITES — permit required for listed species"

LAYER 5 — STOP GATE:
- Check commodity.stop_flags against origin+destination combination
- If any STOP flag matches: return a RED warning with the stop message and DO NOT show the rest of the report

RESULTS DISPLAY — split into two sections:

Section 1: "YOUR SIDE (Buyer Documents)" — what the importer must do:
- Filter documents by commodity_type:
  - agricultural: Customs declaration, Phytosanitary certificate (import), IPAFFS notification (if UK), TRACES/CHED (if EU), Import licence (if applicable)
  - seafood: Customs declaration, IUU catch certificate, Health certificate (import), IPAFFS (if UK)
  - forestry: Customs declaration, FLEGT licence (if applicable), UKTR due diligence register (if UK)
  - mineral: Customs declaration, Kimberley Process certificate (if diamonds), OECD DDG records (if conflict minerals)
  - livestock: Customs declaration, Veterinary certificate (import), TRACES/CHED (if EU)
- Show duty estimate: "Tariff rate: [from destination]. VAT: [vat_rate]%. Total estimated duty on $10,000 shipment: $X"

Section 2: "THEIR SIDE (Supplier Documents)" — what the supplier must provide:
- Certificate of Origin from [coo_issuing_body exact name]
- Phytosanitary certificate from [phyto_authority exact name] (if SPS)
- Commercial invoice
- Packing list  
- Bill of Lading
- If EUDR: Geolocation coordinates of production plot
- If conflict minerals: OECD DDG supplier declaration
- If kimberley: Kimberley Process certificate

Section 3: "RISK FLAGS"
- Show each known_hazard with severity indicator
- Show each active overlay regulation
- Show commodity_type-specific warnings

Section 4: "AfCFTA PREFERENTIAL TARIFF" (only if Layer 2.5 activated)
- Show RoO criteria and eligibility guidance

Make the results visually clean with colour-coded sections: green for straightforward items, amber for attention-needed, red for STOP/critical warnings.

EVIDENCE HASHING:
After generating the full result, compute a SHA-256 hash of the complete results JSON. Display at the bottom of every report:
- "Compliance check ref: TT-[YYYY]-[first 6 chars of hash]"
- "Integrity hash: sha256:[full hash]"  
- "Generated: [timestamp]"
Store the hash in the lookups table. This lets traders prove to banks, auditors, or customs authorities that they ran a verified compliance check at a specific time. Add a "Download PDF Report" button that includes the hash and timestamp (PDF generation can be basic — just the results formatted with the hash footer).
```

---

## PROMPT 5: Module 2 — Supplier Brief Generator + Document Details

```
Add two features to the /lookup results page:

FEATURE 1 — SUPPLIER BRIEF GENERATOR:
Add a "Generate Supplier Brief" button at the bottom of the results.
When clicked, generate a ready-to-send message with:
- Addressed to: "[Supplier]" (placeholder — user can edit)
- Subject: "Required documents for [commodity] export from [origin] to [destination]"
- Body: Numbered list of every document from "THEIR SIDE" section, with:
  - Document name
  - Issuing authority (exact name from database)
  - Why it's needed (one line)
- Closing: "Please confirm you can provide all documents listed above before we proceed."

Show the message in two formats with copy buttons:
1. Email format (full formal email)
2. WhatsApp format (condensed, emoji bullet points, ready to paste into WhatsApp)

Store the generated brief in the database: create a "lookups" table with columns:
- lookup_id: UUID
- commodity_id, origin_iso2, dest_iso2
- buyer_docs_json, supplier_docs_json, duty_estimate_json
- triggers: text array
- hazards: text array  
- stops: text array
- overlays_json, framework_json, afcfta_roo_json
- supplier_brief: JSONB (email_text, whatsapp_text, documents_requested, authority_names, generated_at)
- comms_log: JSONB array (channel, sent_at, recipient, content_hash)
- created_at: timestamp

FEATURE 2 — EXPANDABLE DOCUMENT DETAILS + PORTAL SUBMISSION GUIDES:
Each document in the buyer-side list should be clickable/expandable.
When expanded, show:
- What it is (1-2 sentence description)
- Who provides it (issuing authority or where to get it)
- When it's needed (before shipment? at port? within X days?)
- Practical tip (one actionable sentence)
- **Portal submission guide** (where applicable): step-by-step instructions for the actual government portal the trader needs to use

Use this knowledge base for common documents:
- Customs declaration: Filed by importer or customs broker. Required at port of entry. Tip: "Can be filed electronically via CHIEF (UK) or ICS (EU). Most brokers charge £50-150 per declaration."
- Phytosanitary certificate (import): Issued by destination port health authority after inspection. Required at port. Tip: "Pre-notify via IPAFFS (UK) or TRACES (EU) at least 24 hours before arrival."
- Certificate of Origin: Issued by chamber of commerce in origin country. Required before shipment for LC compliance. Tip: "Must match goods description on LC exactly — most common cause of bank rejection."
- Bill of Lading: Issued by shipping line. Created at port of loading. Tip: "Check port name matches LC exactly. 'Abidjan' vs 'Port Autonome d'Abidjan' causes rejections."
- Commercial Invoice: Created by supplier. Must match LC terms. Tip: "Currency and amount must not exceed LC. Goods description must use LC wording exactly."
- Phytosanitary certificate (export): Issued by origin country phyto authority. Required before loading. Tip: "Book inspection 3-5 days before intended shipment date."
- IUU Catch Certificate: Issued by flag state of fishing vessel. Required for all seafood into EU/UK. Tip: "Must be validated by catch authority — not the exporter."
- FLEGT Licence: Issued by origin country forestry authority. Required for timber into EU. Tip: "Only available from VPA partner countries. Check if origin country has VPA."
- Kimberley Process Certificate: Issued by national KP authority. Required for rough diamonds. Tip: "Must be tamper-evident sealed. Both origin and destination must be KP participants."

PORTAL SUBMISSION GUIDES (show as expandable "How to submit" sections):

For UK destination (SPS goods):
- IPAFFS Pre-notification: "1. Go to https://www.ipaffs.co.uk 2. Log in with Government Gateway 3. Select 'Create new CHED-PP' (for plant products) or 'CHED-D' (for food) 4. Enter: commodity HS code [auto-filled from lookup], origin country [auto-filled], port of entry, estimated arrival date 5. Upload phytosanitary certificate when available 6. Submit — you'll receive a CHED reference number in format GBCHDYYYY.NNNNNNN 7. Give this reference to your customs broker for the customs declaration"

For EU destination (SPS goods):
- TRACES Pre-notification: "1. Go to https://webgate.ec.europa.eu/tracesnt 2. Register or log in 3. Select 'CHED' → 'Create Part I' 4. Select CHED type: CHED-PP (plants), CHED-D (food), CHED-A (animals) 5. Enter: commodity code, origin country, destination member state, border control post 6. Attach phytosanitary certificate 7. Submit Part I — the Border Control Post completes Part II on arrival"

For origin-side (supplier guidance by country):
- Côte d'Ivoire export: "Supplier should use GUCE portal (https://www.guce.gouv.ci) for: export declaration, phytosanitary certificate request to LANADA/DPVCQ, Certificate of Origin from Chambre de Commerce"
- Kenya export: "Supplier applies to KEPHIS (https://kephis.go.ke) for phytosanitary inspection. Book 3-5 working days before shipment. Certificate of Origin from Kenya National Chamber of Commerce via KenTrade portal."
- Ghana export: "Supplier applies to PPRSD for phytosanitary certificate. Export declaration via GCNET/UNIPASS. Certificate of Origin from Ghana National Chamber of Commerce."

FEATURE 3 — CDS-READY DATA PACK:
Add a "Download Customs Data Pack" button to lookup results.
This generates a downloadable document (PDF or CSV) containing all the fields a customs broker needs to file the UK customs declaration:
- Commodity code (HS code from lookup)
- Country of origin (ISO code + full name)
- Country of consignment
- Customs procedure code (suggested based on commodity type)
- Preference code (if GSP/EPA applies)
- Document codes required (C644 for phyto, C085 for CHED, N853 for CoO, etc.)
- CHED reference number (placeholder: "Enter after IPAFFS submission")
- Duty rate and VAT rate (from lookup)
- Header text: "TapTrao Customs Data Pack — give this to your customs broker to file your declaration. Reference: [lookup hash]"

This is NOT customs filing. It's a pre-filled data sheet that saves the trader an hour of back-and-forth with their broker. It makes TapTrao useful even for traders who use a broker — they look professional and prepared.
```

---

## PROMPT 6: Module 1 — LC Document Checker (Manual Entry MVP)

```
Build the LC Document Checker at /lc-check. This is the second paid feature ($2.99/check).

This MVP uses manual field entry. AI-powered PDF upload comes later.

USER FLOW:

STEP 1 — LC TERMS ENTRY:
A form with these fields (the trader types in their LC details):
- Beneficiary name (supplier)
- Applicant name (buyer)  
- Goods description (free text)
- HS code
- Quantity (number + unit: kg, MT, bags, etc.)
- Unit price + currency
- Total amount + currency
- Country of origin
- Port of loading
- Port of discharge
- Latest shipment date
- LC expiry date
- Incoterms (dropdown: FOB, CIF, CFR, FCA, EXW, etc.)
- Partial shipments allowed? (yes/no)
- Transhipment allowed? (yes/no)

STEP 2 — SUPPLIER DOCUMENT ENTRY:
Tabs for up to 6 documents. Each tab is a document type (dropdown: Commercial Invoice, Bill of Lading, Certificate of Origin, Phytosanitary Certificate, Packing List, Other).

For each document, the trader enters the key fields:
- Commercial Invoice: beneficiary name, goods description, quantity, unit price, total amount, currency
- Bill of Lading: shipper name, consignee, port of loading, port of discharge, shipped on board date, vessel name
- Certificate of Origin: exporter name, origin country, goods description, language of document
- Phytosanitary Certificate: exporter name, origin country, commodity description
- Packing List: quantity, gross weight, net weight, number of packages

STEP 3 — CROSS-CHECK ENGINE:
Run these checks and return results:

STRING MATCHING:
- Compare beneficiary name on LC vs name on each document. Flag: exact match, case-insensitive match, or MISMATCH (UCP 600 Art. 14(d))
- Handle variations: "SARL" before/after company name, "Ltd" vs "Limited", "&" vs "and"

NUMERIC CHECKS:
- Invoice amount must NOT exceed LC amount (UCP 600 Art. 18(a))
- Invoice currency must match LC currency (UCP 600 Art. 18(a))
- Quantity on invoice vs LC: if within +/-5%, show AMBER warning with "ISBP 745 tolerance may apply for bulk goods". If >5% difference, show RED.
- Quantity on invoice must match quantity on B/L must match quantity on packing list (UCP 600 Art. 14(d))

DATE CHECKS:
- B/L shipped date must be on or before LC latest shipment date (UCP 600 Art. 14(c))
- Days between B/L date and today: if >21 days, flag "Presentation deadline exceeded — UCP 600 Art. 14(c)"

PORT/ORIGIN CHECKS:
- Port of loading on B/L must match LC port of loading (UCP 600 Art. 20(a)(ii))
- Country of origin on CoO must match LC origin

GOODS DESCRIPTION:
- Invoice goods description must correspond with LC (UCP 600 Art. 18(c))
- Other documents may use general terms — only flag if completely different

IDENTIFIER FORMAT VALIDATION:
When the user enters reference numbers in any document, validate known formats:
- CHED reference: must match pattern GBCHDYYYY.NNNNNNN (e.g. GBCHD2026.0012345). If invalid format, show amber warning: "CHED reference format appears incorrect. Expected: GBCHDYYYY.NNNNNNN"
- LC reference: no fixed format, but flag if empty
- B/L number: no fixed format, but flag if empty
This catches data entry errors before they cause real problems at the bank or customs.

EVIDENCE HASHING:
After generating results, compute SHA-256 hash of the full results JSON. Display:
- "LC check ref: TT-LC-[YYYY]-[first 6 chars of hash]"
- "Integrity hash: sha256:[full hash]"
- "Checked: [timestamp]"
Store hash in lc_checks table. Banks and compliance auditors can verify the check was performed.

RESULTS DISPLAY:
For each check, show:
- Field name
- LC value vs Document value
- Status: GREEN (match), AMBER (warning/tolerance), RED (critical — bank will reject)
- UCP 600 rule reference (e.g. "Art. 14(d)")
- Plain English explanation

Summary at top:
- Total checks: X
- Matches: X (green)
- Warnings: X (amber)  
- Critical: X (red)
- Verdict: "COMPLIANT" (all green) / "COMPLIANT WITH NOTES" (green + amber) / "DISCREPANCIES FOUND" (any red)

STEP 4 — CORRECTION EMAIL:
If any RED findings, show "Generate Supplier Correction Email" button.
Generate email listing every critical discrepancy:
- "Your [document] shows [value]. The LC requires [value]. Please amend and reissue."
Provide both email and WhatsApp format with copy buttons.

Store results in a "lc_checks" table:
- check_id: UUID
- lc_fields_json: JSONB
- documents_json: JSONB  
- results_json: JSONB (per-field results with severity and ucp_rule)
- summary: JSONB (total_checks, matches, warnings, criticals, pass_rate)
- verdict: enum (COMPLIANT, COMPLIANT_WITH_NOTES, DISCREPANCIES_FOUND)
- correction_email: text
- comms_log: JSONB array
- created_at: timestamp
```

---

## PROMPT 7: Navigation + Dashboard + Branding

```
Add proper navigation and user experience:

NAVIGATION:
- Top nav bar with logo "TapTrao" (use a clean sans-serif font, dark blue #1F4E79)
- Nav links: Compliance Lookup | LC Checker | My Trades | Pricing
- Mobile responsive hamburger menu

DASHBOARD at /dashboard:
- "Recent Lookups" — list of last 10 lookups from the lookups table, showing: commodity, origin → destination, date, risk level badge
- "Recent LC Checks" — list of last 10 checks, showing: verdict badge, date, number of discrepancies
- Quick action cards: "New Lookup" and "New LC Check"
- Stats: Total lookups, Total LC checks, Most used corridor

PRICING PAGE at /pricing:
- Simple pricing cards:
  - Compliance Lookup: $4.99 per lookup — "Full regulatory checklist, duty estimate, supplier brief, risk flags"
  - LC Document Check: $2.99 per check — "Cross-check up to 6 supplier documents against LC terms with UCP 600 references"
  - Token Packs: $9.99 (3 lookups), $19.99 (7 lookups), $29.99 (12 lookups)
  - Pro Monitoring: $29/month — "Coming soon — alerts when regulations change for your corridors"
- FAQ section below

MY TRADES at /trades:
- List all lookups and LC checks in reverse chronological order
- Click any to view full results
- "Save as Template" button on each (placeholder — Module 3 comes later)

LANDING PAGE at /:
Update the homepage to be a proper landing page:
- Hero: "Know your compliance before you commit to the trade."
- Subtext: "The first standalone trade compliance tool for commodity traders. No ERP. No broker. $4.99 per check."
- 3 feature cards: Compliance Lookup, LC Checker, Regulatory Alerts (coming soon)
- "How it works" section: 3 steps with icons (Enter trade details → Get full compliance picture → Send supplier brief)
- CTA button: "Start Your First Lookup — Free Demo"

Use a professional colour scheme: primary #1F4E79 (dark blue), accent #D35400 (orange for CTAs), green #1B7340 (for compliant/success), red #C0392B (for critical/stop), amber #F39C12 (for warnings).
```

---

## PROMPT 8: Stripe Payment + Token System

```
Integrate Stripe for payments using the token pack model.

TOKEN SYSTEM:
- Create a "user_tokens" table: user_id, balance (integer), created_at, updated_at
- Create a "token_transactions" table: id, user_id, type (PURCHASE/SPEND), amount, description, stripe_session_id (nullable), created_at

TOKEN COSTS:
- Compliance Lookup: costs 5 tokens
- LC Document Check: costs 3 tokens

TOKEN PACKS (Stripe Checkout):
- Starter: $9.99 = 10 tokens (2 lookups or 3 LC checks)
- Standard: $19.99 = 25 tokens (5 lookups)  
- Pro: $29.99 = 45 tokens (9 lookups)
- Power: $49.99 = 85 tokens (17 lookups)

IMPLEMENTATION:
1. Add Stripe Checkout for token purchases on the /pricing page
2. After successful payment, credit tokens to user_tokens.balance
3. Before running a lookup or LC check, check token balance:
   - If sufficient: deduct tokens, run the check, log transaction
   - If insufficient: show "Not enough tokens" with link to purchase
4. Show token balance in the nav bar

For now, use a simple session-based user system (no full auth needed yet — just a browser session with a UUID). We'll add proper auth later.

Add a "FREE DEMO" mode: first lookup is free (no tokens needed). After that, require tokens. Track via a "demo_used" boolean on the session.

Stripe webhook at /api/webhooks/stripe to handle checkout.session.completed events.

Environment variables needed: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## PROMPTS 9-12: Phase 2+ (After Revenue)

These come AFTER you have paying users. Don't build these yet.

## PROMPT 9: Module 3 — Trade Templates (Phase 2)

```
[Save after Phase 1 is generating revenue]

Add template save/load functionality:

1. On any completed lookup results page, add "Save as Template" button
2. User names the template (e.g. "Cashew CdI to UK")
3. System saves: commodity, origin, destination, full lookup results JSON, date saved
4. New page /templates showing all saved templates
5. Click a template to load it — pre-fills the lookup form
6. Show "Regulatory data may have changed since [save date]" warning
7. "Refresh Lookup" button that runs a new lookup with same parameters (costs tokens)

Templates table: template_id, user_session_id, name, commodity_id, origin_iso2, dest_iso2, snapshot_json, variable_fields, last_used_at, times_used, created_at

Templates are FREE to save/load. Revenue comes from the refresh lookup (5 tokens each time).
```

## PROMPT 10: Module 6 Basic — Regulatory Alerts (Phase 2)

```
[Save for Phase 2]

Add basic regulatory monitoring:

1. Let users "watch" up to 3 commodity+destination corridors (free tier)
2. Create an "alert_subscriptions" table: user_id, commodity_id, dest_iso2
3. Create an "alerts" table: alert_id, source (MANUAL for now), hs_codes_affected, destinations_affected, summary, effective_date, created_at
4. Admin page /admin/alerts to manually add regulatory alerts
5. User dashboard shows: "Alerts for your corridors" section with any matching alerts
6. Each alert links to "Run fresh lookup" (costs tokens)

This is the re-engagement engine. Even without automated feeds, you can manually add alerts when you spot regulatory changes, and users get notified.
```

## PROMPT 11: Module 5 Level 1 — Risk Scoring (Phase 3)

```
[Save for Phase 3]

Enhance every lookup with automatic risk scoring.

Add a "RISK ASSESSMENT" section to lookup results:

Score these factors:
- Commodity risk: map known_hazards to severity (aflatoxin=HIGH, fruit_fly=HIGH, pesticide_residues=MEDIUM, none=LOW)
- Origin risk: hardcoded risk levels per origin-destination pair (e.g. sesame from Ethiopia to EU = ELEVATED)
- Destination strictness: EU/UK = STRICT, Turkey/UAE = MODERATE, others = STANDARD
- Regulatory complexity: count active overlays. 3+ = COMPLEX, 1-2 = MODERATE, 0 = SIMPLE
- Document risk: count required documents. 8+ = HIGH, 5-7 = MEDIUM, <5 = LOW

Overall risk score: GREEN (all low/medium), AMBER (any high factor), RED (multiple high or known rejection patterns)

Show each factor with its score and a one-line mitigation tip.
```

## PROMPT 12: Authentication + User Accounts (When Needed)

```
[Add when you have 20+ returning users]

Replace session-based system with proper auth:

1. Add NextAuth.js with email magic link login (no passwords)
2. Create a users table: id, email, name, company_name, created_at
3. Migrate user_tokens, lookups, lc_checks, templates to use user_id foreign key
4. Add user profile page at /profile
5. Show trade history across sessions
6. This enables: persistent templates, token balance across devices, HMRC record archive
```

---

## TIPS FOR USING REPLIT AGENT

1. **Give one prompt at a time.** Don't paste all 12. Wait for each to work.
2. **Test after every prompt.** Click through the UI. Try edge cases. Does "Charcoal from Somalia" show a STOP warning? Does "Cocoa to EU" trigger EUDR?
3. **If it breaks, describe the bug.** "The lookup page shows a blank screen when I select Ghana" — Replit Agent will fix it.
4. **Keep the architecture doc open.** If Replit Agent makes wrong assumptions about the data model, paste the relevant section from the architecture doc.
5. **Don't let it over-engineer.** If it starts adding GraphQL, microservices, or complex state management — tell it: "Keep it simple. Server actions, direct database queries, no extra abstractions."
6. **Deploy after each prompt.** Replit auto-deploys, but check the live URL works.

## BUILD ORDER SUMMARY

| Prompt | What it builds | Time est. | Revenue? |
|--------|---------------|-----------|----------|
| 1 | Database + skeleton | 1 day | No |
| 2 | Seed destinations + origins + frameworks | 1 day | No |
| 3A | Seed agricultural commodities (94) | Half day | No |
| 3B | Seed seafood + livestock + forestry (34) | Half day | No |
| 3C | Seed minerals (26) — total 154 | Half day | No |
| 4 | Module 2 lookup engine | 2-3 days | Almost |
| 5 | Supplier brief + portal guides + customs data pack | 1-2 days | Almost |
| 6 | Module 1 LC checker | 2-3 days | Almost |
| 7 | Navigation + dashboard + branding | 1-2 days | Almost |
| 8 | Stripe + tokens | 1-2 days | YES |
| 9 | Templates (Phase 2) | 1 day | Retention |
| 10 | Alerts (Phase 2) | 1 day | Re-engagement |
| 11 | Risk scoring (Phase 3) | 1 day | Value-add |
| 12 | Auth (when needed) | 1 day | Persistence |

**Total to revenue: ~12-16 days of focused work with Replit Agent.**
**Total for full Phase 1: ~16-20 days.**
**Commodities at launch: 154 (full database, no artificial limits).**
