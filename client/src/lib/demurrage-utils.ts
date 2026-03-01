/* ── Shared Demurrage Types, Data & Functions ── */

export type ContainerType = "20ft" | "40ft" | "40hc" | "reefer";

export interface PortRate {
  label: string;
  rates: Record<ContainerType, number>;
}

export interface DemurrageTier {
  label: string;
  days: number;
  rate: number;
  subtotal: number;
}

export interface DemurrageResult {
  tiers: DemurrageTier[];
  total: number;
}

/* ── 70 Ports — Full dataset ── */
export const PORTS: PortRate[] = [
  { label: "Rotterdam, Netherlands", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Amsterdam, Netherlands", rates: { "20ft": 60, "40ft": 90, "40hc": 100, reefer: 150 } },
  { label: "Zaanstad, Netherlands", rates: { "20ft": 55, "40ft": 85, "40hc": 95, reefer: 140 } },
  { label: "Hamburg, Germany", rates: { "20ft": 70, "40ft": 100, "40hc": 110, reefer: 160 } },
  { label: "Bremen/Bremerhaven, Germany", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Rostock, Germany", rates: { "20ft": 55, "40ft": 80, "40hc": 90, reefer: 135 } },
  { label: "Antwerp-Bruges, Belgium", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Ghent, Belgium", rates: { "20ft": 50, "40ft": 75, "40hc": 85, reefer: 130 } },
  { label: "Le Havre (HAROPA), France", rates: { "20ft": 60, "40ft": 90, "40hc": 100, reefer: 150 } },
  { label: "Rouen (HAROPA), France", rates: { "20ft": 50, "40ft": 75, "40hc": 85, reefer: 125 } },
  { label: "Marseille-Fos, France", rates: { "20ft": 60, "40ft": 88, "40hc": 98, reefer: 145 } },
  { label: "Dunkirk, France", rates: { "20ft": 50, "40ft": 75, "40hc": 85, reefer: 130 } },
  { label: "Genoa, Italy", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Trieste, Italy", rates: { "20ft": 60, "40ft": 88, "40hc": 98, reefer: 145 } },
  { label: "Gioia Tauro, Italy", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 140 } },
  { label: "Naples, Italy", rates: { "20ft": 58, "40ft": 85, "40hc": 95, reefer: 142 } },
  { label: "Livorno, Italy", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 138 } },
  { label: "Valencia, Spain", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 140 } },
  { label: "Algeciras, Spain", rates: { "20ft": 50, "40ft": 78, "40hc": 88, reefer: 135 } },
  { label: "Barcelona, Spain", rates: { "20ft": 58, "40ft": 85, "40hc": 95, reefer: 142 } },
  { label: "Bilbao, Spain", rates: { "20ft": 52, "40ft": 78, "40hc": 88, reefer: 132 } },
  { label: "Felixstowe, UK", rates: { "20ft": 70, "40ft": 100, "40hc": 110, reefer: 160 } },
  { label: "London (Tilbury), UK", rates: { "20ft": 68, "40ft": 98, "40hc": 108, reefer: 158 } },
  { label: "Liverpool, UK", rates: { "20ft": 60, "40ft": 88, "40hc": 98, reefer: 148 } },
  { label: "Southampton, UK", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Hull, UK", rates: { "20ft": 55, "40ft": 80, "40hc": 90, reefer: 135 } },
  { label: "Bristol/Avonmouth, UK", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 138 } },
  { label: "Aarhus, Denmark", rates: { "20ft": 60, "40ft": 88, "40hc": 98, reefer: 148 } },
  { label: "Copenhagen, Denmark", rates: { "20ft": 62, "40ft": 90, "40hc": 100, reefer: 150 } },
  { label: "Fredericia, Denmark", rates: { "20ft": 52, "40ft": 78, "40hc": 88, reefer: 132 } },
  { label: "Gdańsk, Poland", rates: { "20ft": 45, "40ft": 68, "40hc": 78, reefer: 120 } },
  { label: "Gdynia, Poland", rates: { "20ft": 45, "40ft": 68, "40hc": 78, reefer: 118 } },
  { label: "Szczecin-Świnoujście, Poland", rates: { "20ft": 42, "40ft": 65, "40hc": 75, reefer: 115 } },
  { label: "Piraeus, Greece", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 140 } },
  { label: "Thessaloniki, Greece", rates: { "20ft": 50, "40ft": 75, "40hc": 85, reefer: 130 } },
  { label: "Sines, Portugal", rates: { "20ft": 50, "40ft": 75, "40hc": 85, reefer: 130 } },
  { label: "Lisbon, Portugal", rates: { "20ft": 52, "40ft": 78, "40hc": 88, reefer: 135 } },
  { label: "Leixões (Porto), Portugal", rates: { "20ft": 48, "40ft": 72, "40hc": 82, reefer: 128 } },
  { label: "Helsinki, Finland", rates: { "20ft": 62, "40ft": 90, "40hc": 100, reefer: 150 } },
  { label: "HaminaKotka, Finland", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 140 } },
  { label: "Bergen, Norway", rates: { "20ft": 68, "40ft": 98, "40hc": 108, reefer: 158 } },
  { label: "Oslo, Norway", rates: { "20ft": 70, "40ft": 100, "40hc": 110, reefer: 160 } },
  { label: "Gothenburg, Sweden", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Stockholm, Sweden", rates: { "20ft": 60, "40ft": 88, "40hc": 98, reefer: 148 } },
  { label: "Basel (Rhine), Switzerland", rates: { "20ft": 75, "40ft": 108, "40hc": 118, reefer: 170 } },
  { label: "Varna, Bulgaria", rates: { "20ft": 40, "40ft": 60, "40hc": 70, reefer: 110 } },
  { label: "Burgas, Bulgaria", rates: { "20ft": 38, "40ft": 58, "40hc": 68, reefer: 108 } },
  { label: "Mersin, Turkey", rates: { "20ft": 50, "40ft": 75, "40hc": 85, reefer: 130 } },
  { label: "Ambarlı (Istanbul), Turkey", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 138 } },
  { label: "Limassol, Cyprus", rates: { "20ft": 52, "40ft": 78, "40hc": 88, reefer: 135 } },
  { label: "Durrës, Albania", rates: { "20ft": 42, "40ft": 62, "40hc": 72, reefer: 115 } },
  { label: "Constanța, Romania", rates: { "20ft": 42, "40ft": 65, "40hc": 75, reefer: 115 } },
  { label: "Budapest (Danube), Hungary", rates: { "20ft": 45, "40ft": 68, "40hc": 78, reefer: 120 } },
  { label: "Vienna (Danube), Austria", rates: { "20ft": 55, "40ft": 82, "40hc": 92, reefer: 138 } },
  { label: "Montreal, Canada", rates: { "20ft": 75, "40ft": 110, "40hc": 120, reefer: 175 } },
  { label: "Vancouver, Canada", rates: { "20ft": 80, "40ft": 115, "40hc": 125, reefer: 180 } },
  { label: "Halifax, Canada", rates: { "20ft": 65, "40ft": 95, "40hc": 105, reefer: 155 } },
  { label: "Toronto, Canada", rates: { "20ft": 70, "40ft": 100, "40hc": 110, reefer: 162 } },
  { label: "New York/New Jersey, USA", rates: { "20ft": 85, "40ft": 125, "40hc": 135, reefer: 195 } },
  { label: "Houston, USA", rates: { "20ft": 75, "40ft": 110, "40hc": 120, reefer: 175 } },
  { label: "New Orleans, USA", rates: { "20ft": 70, "40ft": 105, "40hc": 115, reefer: 168 } },
  { label: "Jacksonville (JAXPORT), USA", rates: { "20ft": 68, "40ft": 100, "40hc": 110, reefer: 162 } },
  { label: "Savannah, USA", rates: { "20ft": 72, "40ft": 108, "40hc": 118, reefer: 170 } },
  { label: "Los Angeles/Long Beach, USA", rates: { "20ft": 90, "40ft": 130, "40hc": 140, reefer: 200 } },
  { label: "Oakland, USA", rates: { "20ft": 78, "40ft": 115, "40hc": 125, reefer: 180 } },
  { label: "Norfolk, USA", rates: { "20ft": 68, "40ft": 100, "40hc": 110, reefer: 162 } },
  { label: "Philadelphia, USA", rates: { "20ft": 72, "40ft": 108, "40hc": 118, reefer: 170 } },
  { label: "Miami, USA", rates: { "20ft": 75, "40ft": 112, "40hc": 122, reefer: 178 } },
  { label: "Charleston, USA", rates: { "20ft": 70, "40ft": 105, "40hc": 115, reefer: 168 } },
];

export const CONTAINER_OPTIONS: { value: ContainerType; label: string }[] = [
  { value: "20ft", label: "20ft standard" },
  { value: "40ft", label: "40ft standard" },
  { value: "40hc", label: "40ft high cube" },
  { value: "reefer", label: "Reefer (refrigerated)" },
];

/* ── 3-Tier Demurrage Calculation ── */
export function computeDemurrage(baseRate: number, chargeableDays: number): DemurrageResult {
  if (chargeableDays <= 0) return { tiers: [], total: 0 };
  const tiers: DemurrageTier[] = [];

  const tier1Days = Math.min(chargeableDays, 7);
  if (tier1Days > 0) {
    tiers.push({ label: "Days 1-7", days: tier1Days, rate: baseRate, subtotal: tier1Days * baseRate });
  }

  const tier2Days = Math.min(Math.max(chargeableDays - 7, 0), 7);
  if (tier2Days > 0) {
    const r = baseRate * 1.5;
    tiers.push({ label: "Days 8-14", days: tier2Days, rate: r, subtotal: tier2Days * r });
  }

  const tier3Days = Math.max(chargeableDays - 14, 0);
  if (tier3Days > 0) {
    const r = baseRate * 2;
    tiers.push({ label: "Days 15+", days: tier3Days, rate: r, subtotal: tier3Days * r });
  }

  const total = tiers.reduce((s, t) => s + t.subtotal, 0);
  return { tiers, total };
}

/* ── Port → Destination mapping (every port tagged to a TapTrao destination) ── */
// Country suffixes in port labels → TapTrao destination ISO2
const PORT_COUNTRY_TO_DEST: Record<string, string> = {
  // GB
  "UK": "GB",
  // EU member states + EEA
  "Netherlands": "EU", "Germany": "EU", "Belgium": "EU", "France": "EU",
  "Italy": "EU", "Spain": "EU", "Denmark": "EU", "Poland": "EU",
  "Greece": "EU", "Portugal": "EU", "Finland": "EU", "Norway": "EU",
  "Sweden": "EU", "Bulgaria": "EU", "Cyprus": "EU", "Albania": "EU",
  "Romania": "EU", "Hungary": "EU", "Austria": "EU",
  // CH
  "Switzerland": "CH",
  // TR
  "Turkey": "TR",
  // CA
  "Canada": "CA",
  // US
  "USA": "US",
};

// Primary port per destination (shown in estimate cards)
const PRIMARY_PORT_LABEL: Record<string, string> = {
  GB: "Felixstowe, UK",
  EU: "Rotterdam, Netherlands",
  CH: "Basel (Rhine), Switzerland",
  TR: "Ambarlı (Istanbul), Turkey",
  CA: "Montreal, Canada",
  US: "New York/New Jersey, USA",
};

/** Get the TapTrao destination ISO2 for a given port label */
export function getDestinationForPort(portLabel: string): string | null {
  for (const [suffix, dest] of Object.entries(PORT_COUNTRY_TO_DEST)) {
    if (portLabel.endsWith(suffix)) return dest;
  }
  return null;
}

/** Get ALL ports for a destination ISO2 */
export function getPortsForDestination(iso2: string): PortRate[] {
  return PORTS.filter((p) => getDestinationForPort(p.label) === iso2);
}

/** Get the primary (representative) port for a destination ISO2 */
export function getPortForDestination(iso2: string): PortRate | null {
  const label = PRIMARY_PORT_LABEL[iso2];
  if (!label) return null;
  return PORTS.find((p) => p.label === label) ?? null;
}

/* ── Estimate Delay Days by Readiness Verdict ── */
export function estimateDelayDays(verdict: "GREEN" | "AMBER" | "RED"): { min: number; max: number; label: string } {
  switch (verdict) {
    case "GREEN":
      return { min: 2, max: 4, label: "2–4 days" };
    case "AMBER":
      return { min: 5, max: 10, label: "5–10 days" };
    case "RED":
      return { min: 10, max: 21, label: "10–21 days" };
    default:
      return { min: 5, max: 10, label: "5–10 days" };
  }
}

/* ── Quick Estimate for a Destination + Verdict ── */
export function estimateDemurrageRange(
  iso2: string,
  verdict: "GREEN" | "AMBER" | "RED",
  containerType: ContainerType = "20ft",
): { port: PortRate; allPorts: PortRate[]; minCost: number; maxCost: number; delayLabel: string } | null {
  const port = getPortForDestination(iso2);
  if (!port) return null;
  const allPorts = getPortsForDestination(iso2);
  const baseRate = port.rates[containerType];
  const delay = estimateDelayDays(verdict);
  const minResult = computeDemurrage(baseRate, delay.min);
  const maxResult = computeDemurrage(baseRate, delay.max);
  return {
    port,
    allPorts,
    minCost: minResult.total,
    maxCost: maxResult.total,
    delayLabel: delay.label,
  };
}
