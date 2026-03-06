/**
 * Risk Exposure calculation utility.
 *
 * Per-trade risk estimate based on:
 *   - readiness score → delay probability
 *   - demurrage daily rate
 *   - SPS flag
 *   - LC discrepancy flag
 */

export type RiskComponents = {
  delayProbability: number;
  demurrageExpected: number;
  demurrageWorst: number;
  spsCostExpected: number;
  spsCostWorst: number;
  lcCostExpected: number;
  lcCostWorst: number;
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

/** SPS flag cost constants */
const SPS_EXPECTED = 112;
const SPS_WORST = 600;

/** LC discrepancy cost constants */
const LC_EXPECTED = 80;
const LC_WORST = 350;

/**
 * Calculate per-trade risk estimate.
 *
 * Expected loss = (delayProb × dailyRate × 3) + SPS($112) + LC($80)
 * Worst case    = (dailyRate × 7) + SPS($600) + LC($350)
 */
export function calculateTradeRisk(params: {
  readinessScore: number | null;
  dailyRate: number | null;
  spsFlagged: boolean;
  lcFlagged: boolean;
}): TradeRiskEstimate {
  const { readinessScore, dailyRate, spsFlagged, lcFlagged } = params;
  const rate = dailyRate ?? 0;
  const delayProbability = getDelayProbability(readinessScore);

  const demurrageExpected = delayProbability * rate * 3;
  const demurrageWorst = rate * 7;
  const spsCostExpected = spsFlagged ? SPS_EXPECTED : 0;
  const spsCostWorst = spsFlagged ? SPS_WORST : 0;
  const lcCostExpected = lcFlagged ? LC_EXPECTED : 0;
  const lcCostWorst = lcFlagged ? LC_WORST : 0;

  return {
    expectedLoss: Math.round(demurrageExpected + spsCostExpected + lcCostExpected),
    worstCase: Math.round(demurrageWorst + spsCostWorst + lcCostWorst),
    components: {
      delayProbability,
      demurrageExpected: Math.round(demurrageExpected),
      demurrageWorst: Math.round(demurrageWorst),
      spsCostExpected,
      spsCostWorst,
      lcCostExpected,
      lcCostWorst,
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
