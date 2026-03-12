/**
 * Risk Exposure calculation utility.
 *
 * Per-trade risk estimate based on:
 *   - readiness score → delay probability
 *   - demurrage daily rate
 *   - SPS flag (phytosanitary non-compliance)
 *   - LC discrepancy flag
 *   - EUDR applicability (EU Reg 2023/1115)
 *   - CBAM applicability (EU Reg 2023/956)
 *   - trade value (scales regulatory fines)
 *
 * Penalty sources:
 *   EUDR: Fines up to 4% of EU turnover + shipment seizure + market ban
 *   CBAM: €100/tonne unreported emissions + potential audits
 *   SPS/Phyto: $1,500–$5,000+ in fees/delays (rejection, re-export, storage)
 *   LC Discrepancies: $50–$200 per issue + payment delays
 *   Demurrage: €100–€300/day at major EU ports
 */

export type RiskComponents = {
  delayProbability: number;
  demurrageExpected: number;
  demurrageWorst: number;
  spsCostExpected: number;
  spsCostWorst: number;
  lcCostExpected: number;
  lcCostWorst: number;
  eudrCostExpected: number;
  eudrCostWorst: number;
  cbamCostExpected: number;
  cbamCostWorst: number;
};

export type TradeRiskEstimate = {
  expectedLoss: number;
  worstCase: number;
  components: RiskComponents;
};

/** Map readiness score to delay probability */
export function getDelayProbability(readinessScore: number | null): number {
  const score = readinessScore ?? 0;
  if (score >= 80) return 0.10;
  if (score >= 60) return 0.30;
  if (score >= 40) return 0.50;
  return 0.70;
}

/**
 * SPS/Phytosanitary penalty constants
 * Real-world: missing certs from Ghana/Nigeria = $1,500–$5,000+
 * Expected: inspection fee + delays (~$1,500)
 * Worst: full rejection + re-export + storage ($5,000+)
 */
const SPS_EXPECTED = 1500;
const SPS_WORST = 5000;

/**
 * LC Discrepancy cost constants
 * Real-world: $50–$200 per discrepancy + payment delays
 * Expected: amendment fee + 1-2 discrepancies (~$250)
 * Worst: multiple discrepancies + payment rejection ($800+)
 */
const LC_EXPECTED = 250;
const LC_WORST = 800;

/**
 * EUDR penalty constants (when no trade value available)
 * Real-world: up to 4% of EU annual turnover + seizure + ban
 * Flat fallback when trade value is unknown
 */
const EUDR_EXPECTED_FLAT = 2500;
const EUDR_WORST_FLAT = 8000;
const EUDR_EXPECTED_PCT = 0.02; // 2% of trade value (expected)
const EUDR_WORST_PCT = 0.04;   // 4% of trade value (worst case — regulation max)

/**
 * CBAM penalty constants
 * Real-world: €100/tonne unreported + audit fees
 * Expected: reporting penalty for moderate shipment
 * Worst: full penalty + audit + retroactive levies
 */
const CBAM_EXPECTED = 1200;
const CBAM_WORST = 4000;

/**
 * Calculate per-trade risk estimate.
 *
 * Expected loss = (delayProb × dailyRate × 3) + SPS + LC + EUDR + CBAM
 * Worst case    = (dailyRate × 7) + SPS + LC + EUDR + CBAM
 */
export function calculateTradeRisk(params: {
  readinessScore: number | null;
  dailyRate: number | null;
  spsFlagged: boolean;
  lcFlagged: boolean;
  eudrApplicable?: boolean;
  cbamApplicable?: boolean;
  tradeValue?: number;
}): TradeRiskEstimate {
  const { readinessScore, dailyRate, spsFlagged, lcFlagged, eudrApplicable, cbamApplicable, tradeValue } = params;
  const rate = dailyRate ?? 0;
  const delayProbability = getDelayProbability(readinessScore);

  const demurrageExpected = delayProbability * rate * 3;
  const demurrageWorst = rate * 7;
  const spsCostExpected = spsFlagged ? SPS_EXPECTED : 0;
  const spsCostWorst = spsFlagged ? SPS_WORST : 0;
  const lcCostExpected = lcFlagged ? LC_EXPECTED : 0;
  const lcCostWorst = lcFlagged ? LC_WORST : 0;

  // EUDR: scale to trade value if available, otherwise use flat amount
  let eudrCostExpected = 0;
  let eudrCostWorst = 0;
  if (eudrApplicable) {
    if (tradeValue && tradeValue > 0) {
      eudrCostExpected = tradeValue * EUDR_EXPECTED_PCT;
      eudrCostWorst = tradeValue * EUDR_WORST_PCT;
    } else {
      eudrCostExpected = EUDR_EXPECTED_FLAT;
      eudrCostWorst = EUDR_WORST_FLAT;
    }
  }

  // CBAM: flat penalties (could be enhanced with actual tonnage data)
  const cbamCostExpected = cbamApplicable ? CBAM_EXPECTED : 0;
  const cbamCostWorst = cbamApplicable ? CBAM_WORST : 0;

  const expectedLoss = demurrageExpected + spsCostExpected + lcCostExpected + eudrCostExpected + cbamCostExpected;
  const worstCase = demurrageWorst + spsCostWorst + lcCostWorst + eudrCostWorst + cbamCostWorst;

  return {
    expectedLoss: Math.round(expectedLoss),
    worstCase: Math.round(worstCase),
    components: {
      delayProbability,
      demurrageExpected: Math.round(demurrageExpected),
      demurrageWorst: Math.round(demurrageWorst),
      spsCostExpected,
      spsCostWorst,
      lcCostExpected,
      lcCostWorst,
      eudrCostExpected: Math.round(eudrCostExpected),
      eudrCostWorst: Math.round(eudrCostWorst),
      cbamCostExpected,
      cbamCostWorst,
    },
  };
}

/**
 * Calculate portfolio-level risk roll-up.
 * Sums expected loss (floor) and worst case (ceiling) across active trades.
 */
export function calculatePortfolioRisk(
  trades: Array<{
    readinessScore: number | null;
    dailyRate: number | null;
    spsFlagged: boolean;
    lcFlagged: boolean;
    eudrApplicable?: boolean;
    cbamApplicable?: boolean;
    tradeValue?: number;
    tradeStatus: string | null;
  }>
): { totalExpected: number; totalWorstCase: number; tradeCount: number } {
  let totalExpected = 0;
  let totalWorstCase = 0;
  let tradeCount = 0;

  for (const t of trades) {
    if (t.tradeStatus === "closed" || t.tradeStatus === "archived") continue;
    const risk = calculateTradeRisk(t);
    if (risk.expectedLoss > 0 || risk.worstCase > 0) {
      totalExpected += risk.expectedLoss;
      totalWorstCase += risk.worstCase;
      tradeCount++;
    }
  }

  return { totalExpected, totalWorstCase, tradeCount };
}
