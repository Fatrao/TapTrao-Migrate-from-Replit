import { db } from "../server/db";
import { lookups } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";
import { computeReadinessScore } from "../server/compliance";
import type { ComplianceResult } from "../shared/schema";

async function backfill() {
  console.log("Starting readiness score backfill...");

  const rows = await db.select().from(lookups).where(isNull(lookups.readinessScore));
  console.log(`Found ${rows.length} lookups without readiness scores`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const result = row.resultJson as ComplianceResult;
      if (!result || !result.triggers || !result.requirementsDetailed) {
        skipped++;
        continue;
      }

      const score = computeReadinessScore({
        triggers: result.triggers,
        hazards: result.hazards || [],
        stopFlags: result.stopFlags || null,
        requirementsDetailed: result.requirementsDetailed || [],
      });

      await db.update(lookups)
        .set({
          readinessScore: score.score,
          readinessVerdict: score.verdict,
          readinessFactors: score.factors,
          readinessSummary: score.summary,
        })
        .where(eq(lookups.id, row.id));

      updated++;
    } catch (e) {
      console.error(`Error updating lookup ${row.id}:`, e);
      skipped++;
    }
  }

  console.log(`Backfill complete: ${updated} updated, ${skipped} skipped`);
  process.exit(0);
}

backfill().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
