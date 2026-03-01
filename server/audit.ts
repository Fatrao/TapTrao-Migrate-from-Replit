/**
 * TwinLog Audit Trail — Hash-chained event log for trade lifecycle
 *
 * Every trade action (compliance check, LC check, supplier upload, status change, etc.)
 * is recorded as an event in the trade_events table. Each event's hash chains to the
 * previous event's hash, creating a tamper-evident audit trail.
 *
 * Hash chain: event_hash = SHA-256(JSON.stringify(eventData) + (previousHash || "genesis"))
 */

import { createHash } from "crypto";
import { db } from "./db";
import { tradeEvents, type TradeEvent } from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

/**
 * Compute a SHA-256 hash for an audit event, chaining to the previous event's hash.
 */
export function computeEventHash(eventData: object, previousHash: string | null): string {
  const payload = JSON.stringify(eventData) + (previousHash || "genesis");
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Append a new event to a trade's audit chain.
 * Fetches the last event for this lookupId, computes the chained hash, and inserts.
 */
export async function appendTradeEvent(
  lookupId: string,
  sessionId: string,
  eventType: string,
  eventData: object
): Promise<TradeEvent> {
  // Get the most recent event for this trade to chain from
  const [lastEvent] = await db
    .select({ eventHash: tradeEvents.eventHash })
    .from(tradeEvents)
    .where(eq(tradeEvents.lookupId, lookupId))
    .orderBy(desc(tradeEvents.createdAt))
    .limit(1);

  const previousHash = lastEvent?.eventHash ?? null;
  const eventHash = computeEventHash(eventData, previousHash);

  const [event] = await db
    .insert(tradeEvents)
    .values({
      lookupId,
      sessionId,
      eventType,
      eventData,
      previousHash,
      eventHash,
    })
    .returning();

  return event;
}

/**
 * Get the full audit chain for a trade, ordered chronologically.
 */
export async function getTradeAuditChain(lookupId: string): Promise<TradeEvent[]> {
  return db
    .select()
    .from(tradeEvents)
    .where(eq(tradeEvents.lookupId, lookupId))
    .orderBy(asc(tradeEvents.createdAt));
}

/**
 * Verify the integrity of a trade's audit chain.
 * Walks every event, recomputes its hash, and checks it matches the stored hash.
 * Returns { valid: true } if the chain is intact, or { valid: false, brokenAt } if tampered.
 */
export async function verifyAuditChain(
  lookupId: string
): Promise<{ valid: boolean; brokenAt?: number; totalEvents: number }> {
  const events = await getTradeAuditChain(lookupId);

  if (events.length === 0) {
    return { valid: true, totalEvents: 0 };
  }

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const expectedPreviousHash = i === 0 ? null : events[i - 1].eventHash;

    // Check that the previousHash pointer is correct
    if (event.previousHash !== expectedPreviousHash) {
      return { valid: false, brokenAt: i, totalEvents: events.length };
    }

    // Recompute the hash and verify it matches
    const recomputedHash = computeEventHash(
      event.eventData as object,
      event.previousHash
    );
    if (recomputedHash !== event.eventHash) {
      return { valid: false, brokenAt: i, totalEvents: events.length };
    }
  }

  return { valid: true, totalEvents: events.length };
}
