import { db } from "./db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import {
  destinations,
  regionalFrameworks,
  originCountries,
  commodities,
  afcftaRoo,
  lcChecks,
  lookups,
  userTokens,
  tokenTransactions,
  templates,
  companyProfiles,
  twinlogDownloads,
  supplierRequests,
  supplierUploads,
  alertSubscriptions,
  regulatoryAlerts,
  alertReads,
  type Destination,
  type RegionalFramework,
  type OriginCountry,
  type Commodity,
  type AfcftaRoo,
  type LcCheck,
  type InsertLcCheck,
  type Lookup,
  type InsertLookup,
  type UserTokens,
  type TokenTransaction,
  type Template,
  type InsertTemplate,
  type CompanyProfile,
  type InsertCompanyProfile,
  type TwinlogDownload,
  type SupplierRequest,
  type InsertSupplierRequest,
  type SupplierUpload,
  type AlertSubscription,
  type InsertAlertSubscription,
  type RegulatoryAlert,
  type InsertRegulatoryAlert,
  type AlertRead,
  eudrRecords,
  type EudrRecord,
  type InsertEudrRecord,
  promoCodes,
  promoRedemptions,
  type PromoCode,
  apiKeys,
} from "@shared/schema";

export interface IStorage {
  getDestinations(): Promise<Destination[]>;
  getOriginCountries(): Promise<OriginCountry[]>;
  getCommodities(): Promise<Commodity[]>;
  getDestinationById(id: string): Promise<Destination | undefined>;
  getOriginCountryById(id: string): Promise<OriginCountry | undefined>;
  getCommodityById(id: string): Promise<Commodity | undefined>;
  getRegionalFrameworkById(id: string): Promise<RegionalFramework | undefined>;
  getTableCounts(): Promise<{
    destinations: number;
    regionalFrameworks: number;
    originCountries: number;
    commodities: number;
    afcftaRoo: number;
  }>;
  getCommodityStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byTrigger: Record<string, number>;
    stopFlagCommodities: { name: string; hsCode: string; stopFlags: unknown }[];
  }>;
  getAfcftaRooByHsHeading(hsHeading: string): Promise<AfcftaRoo | undefined>;
  createLcCheck(data: InsertLcCheck): Promise<LcCheck>;
  getLcCheckById(id: string): Promise<LcCheck | undefined>;
  getRecentLcChecks(limit: number): Promise<LcCheck[]>;
  getLcChecksByLookupIds(lookupIds: string[]): Promise<Record<string, string>>;
  hasLcCheckForLookup(lookupId: string): Promise<boolean>;
  createLookup(data: InsertLookup): Promise<Lookup>;
  getLookupById(id: string): Promise<Lookup | undefined>;
  getRecentLookups(limit: number): Promise<Lookup[]>;
  getAllLookups(): Promise<Lookup[]>;
  getAllLcChecks(): Promise<LcCheck[]>;
  getDashboardStats(): Promise<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null }>;
  getOrCreateUserTokens(sessionId: string): Promise<UserTokens>;
  getTokenBalance(sessionId: string): Promise<{ balance: number; lcBalance: number; freeLookupUsed: boolean }>;
  spendTokens(sessionId: string, amount: number, description: string): Promise<{ success: boolean; balance: number }>;
  creditTokens(sessionId: string, amount: number, description: string, stripeSessionId: string): Promise<{ success: boolean; balance: number }>;
  spendLcCredit(sessionId: string, description: string): Promise<{ success: boolean; lcBalance: number }>;
  creditLcCredits(sessionId: string, amount: number, description: string, stripeSessionId: string): Promise<{ success: boolean; lcBalance: number }>;
  markDemoUsed(sessionId: string): Promise<void>;
  getTokenTransactions(sessionId: string, limit: number): Promise<TokenTransaction[]>;
  hasStripeSessionBeenProcessed(stripeSessionId: string): Promise<boolean>;
  createTemplate(data: InsertTemplate): Promise<Template>;
  getTemplatesBySession(sessionId: string): Promise<Template[]>;
  getTemplateById(id: string): Promise<Template | undefined>;
  deleteTemplate(id: string, sessionId: string): Promise<boolean>;
  updateTemplateSnapshot(id: string, snapshotJson: unknown, regVersionHash: string): Promise<Template | undefined>;
  incrementTemplateUsage(id: string): Promise<void>;
  getTemplateCountBySession(sessionId: string): Promise<number>;
  getTemplateByCorridorAndSession(sessionId: string, commodityId: string, originIso2: string, destIso2: string): Promise<Template | undefined>;
  getCompanyProfile(sessionId: string): Promise<CompanyProfile | undefined>;
  upsertCompanyProfile(data: InsertCompanyProfile): Promise<CompanyProfile>;
  createTwinlogDownload(data: { lookupId?: string; sessionId: string; companyName: string; eoriNumber?: string; documentStatuses: unknown; pdfHash: string }): Promise<TwinlogDownload>;
  getTradesSummary(): Promise<{ total: number; needAttention: number; lcPending: number; archiveReady: number }>;
  getEnrichedTrades(): Promise<EnrichedTrade[]>;
  getSupplierRequestsBySession(sessionId: string): Promise<EnrichedSupplierRequest[]>;
  getSupplierInboxSummary(sessionId: string): Promise<{ awaiting: number; blocking: number; completeThisWeek: number }>;
  getSupplierInboxBadgeCount(sessionId: string): Promise<number>;
  getSupplierRequestByLookupId(lookupId: string): Promise<SupplierRequest | undefined>;
  createSupplierRequest(data: InsertSupplierRequest): Promise<SupplierRequest>;
  logSupplierSend(requestId: string, channel: string): Promise<void>;
  getSupplierRequestById(id: string): Promise<SupplierRequest | undefined>;
  getSupplierUploadsByRequestId(requestId: string): Promise<SupplierUpload[]>;
  getSupplierRequestByToken(token: string): Promise<SupplierRequest | undefined>;
  createSupplierUpload(data: { requestId: string; docType: string; originalFilename: string; fileKey: string; filesizeBytes?: number; mimeType?: string }): Promise<SupplierUpload>;
  updateSupplierRequestDocsReceived(requestId: string, docsReceived: string[], status: string): Promise<void>;
  getLookupByTwinlogRef(ref: string): Promise<Lookup | undefined>;
  createAlertSubscription(data: InsertAlertSubscription): Promise<AlertSubscription>;
  getAlertSubscriptionCount(sessionId: string): Promise<number>;
  getAlertSubscriptions(sessionId: string): Promise<AlertSubscription[]>;
  getAlertsForSession(sessionId: string): Promise<(RegulatoryAlert & { isRead: boolean })[]>;
  getUnreadAlertCount(sessionId: string): Promise<number>;
  markAlertRead(sessionId: string, alertId: string): Promise<void>;
  createRegulatoryAlert(data: InsertRegulatoryAlert): Promise<RegulatoryAlert>;
  createEudrRecord(data: InsertEudrRecord): Promise<EudrRecord>;
  getEudrRecordByLookupId(lookupId: string): Promise<EudrRecord | undefined>;
  updateEudrRecord(id: string, data: Partial<InsertEudrRecord>): Promise<EudrRecord | undefined>;
  markLookupEudrComplete(lookupId: string): Promise<void>;
  // Admin & Promo
  setAdminFlag(sessionId: string, isAdmin: boolean): Promise<void>;
  isAdminSession(sessionId: string): Promise<boolean>;
  createPromoCode(data: { code: string; tradeTokens: number; lcCredits: number; maxRedemptions: number; expiresAt?: Date | null }): Promise<PromoCode>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  getPromoCodes(): Promise<PromoCode[]>;
  redeemPromoCode(promoCodeId: string, sessionId: string, tradeTokens: number, lcCredits: number, code: string): Promise<{ success: boolean; message: string }>;
  // API keys
  createApiKey(sessionId: string, name: string): Promise<{ id: string; key: string; name: string; createdAt: Date }>;
  getApiKeyByKey(key: string): Promise<{ id: string; sessionId: string; isActive: boolean } | undefined>;
  getApiKeysBySession(sessionId: string): Promise<{ id: string; name: string; keyPreview: string; isActive: boolean; lastUsedAt: Date | null; createdAt: Date }[]>;
  deactivateApiKey(id: string, sessionId: string): Promise<boolean>;
  touchApiKey(id: string): Promise<void>;
}

export type EnrichedTrade = {
  id: string;
  commodityName: string;
  hsCode: string;
  originIso2: string;
  originName: string;
  destIso2: string;
  destName: string;
  riskLevel: string;
  readinessScore: number | null;
  readinessVerdict: string | null;
  createdAt: Date;
  lcVerdict: string | null;
  lcCheckId: string | null;
};

export class DatabaseStorage implements IStorage {
  async getDestinations(): Promise<Destination[]> {
    return db.select().from(destinations).orderBy(destinations.countryName);
  }

  async getOriginCountries(): Promise<OriginCountry[]> {
    return db.select().from(originCountries).orderBy(originCountries.countryName);
  }

  async getCommodities(): Promise<Commodity[]> {
    return db.select().from(commodities).orderBy(commodities.name);
  }

  async getDestinationById(id: string): Promise<Destination | undefined> {
    const [result] = await db.select().from(destinations).where(eq(destinations.id, id));
    return result;
  }

  async getOriginCountryById(id: string): Promise<OriginCountry | undefined> {
    const [result] = await db.select().from(originCountries).where(eq(originCountries.id, id));
    return result;
  }

  async getCommodityById(id: string): Promise<Commodity | undefined> {
    const [result] = await db.select().from(commodities).where(eq(commodities.id, id));
    return result;
  }

  async getRegionalFrameworkById(id: string): Promise<RegionalFramework | undefined> {
    const [result] = await db.select().from(regionalFrameworks).where(eq(regionalFrameworks.id, id));
    return result;
  }

  async getCommodityStats() {
    const typeResults = await db
      .select({
        type: commodities.commodityType,
        count: sql<number>`count(*)`,
      })
      .from(commodities)
      .groupBy(commodities.commodityType);

    const byType: Record<string, number> = {};
    let total = 0;
    for (const row of typeResults) {
      byType[row.type] = Number(row.count);
      total += Number(row.count);
    }

    const [eudr] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersEudr, true));
    const [cbam] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersCbam, true));
    const [csddd] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersCsddd, true));
    const [kimberley] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersKimberley, true));
    const [conflict] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersConflict, true));
    const [iuu] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersIuu, true));
    const [cites] = await db.select({ count: sql<number>`count(*)` }).from(commodities).where(eq(commodities.triggersCites, true));

    const byTrigger: Record<string, number> = {
      EUDR: Number(eudr.count),
      CBAM: Number(cbam.count),
      CSDDD: Number(csddd.count),
      Kimberley: Number(kimberley.count),
      Conflict: Number(conflict.count),
      IUU: Number(iuu.count),
      CITES: Number(cites.count),
    };

    const stopFlagRows = await db
      .select({
        name: commodities.name,
        hsCode: commodities.hsCode,
        stopFlags: commodities.stopFlags,
      })
      .from(commodities)
      .where(sql`stop_flags IS NOT NULL AND stop_flags::text != 'null' AND stop_flags::text != '{}'`);

    return { total, byType, byTrigger, stopFlagCommodities: stopFlagRows };
  }

  async getAfcftaRooByHsHeading(hsHeading: string): Promise<AfcftaRoo | undefined> {
    const [result] = await db
      .select()
      .from(afcftaRoo)
      .where(eq(afcftaRoo.hsHeading, hsHeading));
    return result;
  }

  async createLcCheck(data: InsertLcCheck): Promise<LcCheck> {
    const [result] = await db.insert(lcChecks).values(data).returning();
    return result;
  }

  async getLcCheckById(id: string): Promise<LcCheck | undefined> {
    const [result] = await db.select().from(lcChecks).where(eq(lcChecks.id, id));
    return result;
  }

  async getRecentLcChecks(limit: number): Promise<LcCheck[]> {
    return db.select().from(lcChecks).orderBy(desc(lcChecks.createdAt)).limit(limit);
  }

  async getLcChecksByLookupIds(lookupIds: string[]): Promise<Record<string, string>> {
    if (!lookupIds.length) return {};
    const rows = await db.select({ sourceLookupId: lcChecks.sourceLookupId, id: lcChecks.id })
      .from(lcChecks)
      .where(inArray(lcChecks.sourceLookupId, lookupIds));
    const map: Record<string, string> = {};
    for (const row of rows) {
      if (row.sourceLookupId) map[row.sourceLookupId] = row.id;
    }
    return map;
  }

  async hasLcCheckForLookup(lookupId: string): Promise<boolean> {
    const [result] = await db.select({ id: lcChecks.id })
      .from(lcChecks)
      .where(eq(lcChecks.sourceLookupId, lookupId))
      .limit(1);
    return !!result;
  }

  async createLookup(data: InsertLookup): Promise<Lookup> {
    const [result] = await db.insert(lookups).values(data).returning();

    const year = new Date().getFullYear();
    const refInput = result.id + result.createdAt.toISOString();
    const refHash = createHash("sha256").update(refInput).digest("hex").substring(0, 6).toUpperCase();
    const twinlogRef = `TT-${year}-${refHash}`;

    const sortedKeys = Object.keys(data.resultJson as object).sort();
    const sortedObj: Record<string, unknown> = {};
    for (const k of sortedKeys) sortedObj[k] = (data.resultJson as Record<string, unknown>)[k];
    const twinlogHash = createHash("sha256").update(JSON.stringify(sortedObj)).digest("hex");

    await db.execute(sql`
      UPDATE lookups
      SET twinlog_ref = ${twinlogRef},
          twinlog_hash = ${twinlogHash},
          twinlog_locked_at = NOW()
      WHERE id = ${result.id}::uuid
    `);

    return { ...result, twinlogRef, twinlogHash, twinlogLockedAt: new Date() };
  }

  async getLookupById(id: string): Promise<Lookup | undefined> {
    const [result] = await db.select().from(lookups).where(eq(lookups.id, id));
    return result;
  }

  async getRecentLookups(limit: number): Promise<Lookup[]> {
    return db.select().from(lookups).orderBy(desc(lookups.createdAt)).limit(limit);
  }

  async getAllLookups(): Promise<Lookup[]> {
    return db.select().from(lookups).orderBy(desc(lookups.createdAt));
  }

  async getAllLcChecks(): Promise<LcCheck[]> {
    return db.select().from(lcChecks).orderBy(desc(lcChecks.createdAt));
  }

  async getDashboardStats(): Promise<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null }> {
    const [lookupCount] = await db.select({ count: sql<number>`count(*)` }).from(lookups);
    const [lcCount] = await db.select({ count: sql<number>`count(*)` }).from(lcChecks);
    const corridorRows = await db
      .select({
        corridor: sql<string>`origin_name || ' → ' || destination_name`,
        count: sql<number>`count(*)`,
      })
      .from(lookups)
      .groupBy(sql`origin_name || ' → ' || destination_name`)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    return {
      totalLookups: Number(lookupCount.count),
      totalLcChecks: Number(lcCount.count),
      topCorridor: corridorRows.length > 0 ? corridorRows[0].corridor : null,
    };
  }

  async getOrCreateUserTokens(sessionId: string): Promise<UserTokens> {
    const [existing] = await db.select().from(userTokens).where(eq(userTokens.sessionId, sessionId));
    if (existing) return existing;
    const [created] = await db.insert(userTokens).values({ sessionId, balance: 0, freeLookupUsed: false }).returning();
    return created;
  }

  async getTokenBalance(sessionId: string): Promise<{ balance: number; lcBalance: number; freeLookupUsed: boolean }> {
    const user = await this.getOrCreateUserTokens(sessionId);
    return { balance: user.balance, lcBalance: user.lcBalance, freeLookupUsed: user.freeLookupUsed };
  }

  async spendTokens(sessionId: string, amount: number, description: string): Promise<{ success: boolean; balance: number }> {
    const user = await this.getOrCreateUserTokens(sessionId);
    if (user.balance < amount) {
      return { success: false, balance: user.balance };
    }
    const newBalance = user.balance - amount;
    await db.update(userTokens).set({ balance: newBalance, updatedAt: new Date() }).where(eq(userTokens.sessionId, sessionId));
    await db.insert(tokenTransactions).values({
      sessionId,
      type: "SPEND",
      amount: -amount,
      description,
    });
    return { success: true, balance: newBalance };
  }

  async creditTokens(sessionId: string, amount: number, description: string, stripeSessionId: string): Promise<{ success: boolean; balance: number }> {
    const alreadyProcessed = await this.hasStripeSessionBeenProcessed(stripeSessionId);
    if (alreadyProcessed) {
      const user = await this.getOrCreateUserTokens(sessionId);
      return { success: false, balance: user.balance };
    }
    const user = await this.getOrCreateUserTokens(sessionId);
    const newBalance = user.balance + amount;
    await db.update(userTokens).set({ balance: newBalance, updatedAt: new Date() }).where(eq(userTokens.sessionId, sessionId));
    await db.insert(tokenTransactions).values({
      sessionId,
      type: "PURCHASE",
      amount,
      description,
      stripeSessionId,
    });
    return { success: true, balance: newBalance };
  }

  async spendLcCredit(sessionId: string, description: string): Promise<{ success: boolean; lcBalance: number }> {
    const user = await this.getOrCreateUserTokens(sessionId);
    if (user.lcBalance < 1) {
      return { success: false, lcBalance: user.lcBalance };
    }
    const newBalance = user.lcBalance - 1;
    await db.update(userTokens).set({ lcBalance: newBalance, updatedAt: new Date() }).where(eq(userTokens.sessionId, sessionId));
    await db.insert(tokenTransactions).values({
      sessionId,
      type: "SPEND",
      amount: -1,
      description,
    });
    return { success: true, lcBalance: newBalance };
  }

  async creditLcCredits(sessionId: string, amount: number, description: string, stripeSessionId: string): Promise<{ success: boolean; lcBalance: number }> {
    const alreadyProcessed = await this.hasStripeSessionBeenProcessed(stripeSessionId);
    if (alreadyProcessed) {
      const user = await this.getOrCreateUserTokens(sessionId);
      return { success: false, lcBalance: user.lcBalance };
    }
    const user = await this.getOrCreateUserTokens(sessionId);
    const newLcBalance = user.lcBalance + amount;
    await db.update(userTokens).set({ lcBalance: newLcBalance, updatedAt: new Date() }).where(eq(userTokens.sessionId, sessionId));
    await db.insert(tokenTransactions).values({
      sessionId,
      type: "PURCHASE",
      amount,
      description,
      stripeSessionId,
    });
    return { success: true, lcBalance: newLcBalance };
  }

  async markDemoUsed(sessionId: string): Promise<void> {
    await this.getOrCreateUserTokens(sessionId);
    await db.update(userTokens).set({ freeLookupUsed: true, updatedAt: new Date() }).where(eq(userTokens.sessionId, sessionId));
  }

  async getTokenTransactions(sessionId: string, limit: number): Promise<TokenTransaction[]> {
    return db.select().from(tokenTransactions)
      .where(eq(tokenTransactions.sessionId, sessionId))
      .orderBy(desc(tokenTransactions.createdAt))
      .limit(limit);
  }

  async hasStripeSessionBeenProcessed(stripeSessionId: string): Promise<boolean> {
    const [result] = await db.select().from(tokenTransactions)
      .where(eq(tokenTransactions.stripeSessionId, stripeSessionId));
    return !!result;
  }

  async createTemplate(data: InsertTemplate): Promise<Template> {
    const [result] = await db.insert(templates).values(data).returning();
    return result;
  }

  async getTemplatesBySession(sessionId: string): Promise<Template[]> {
    return db.select().from(templates)
      .where(eq(templates.sessionId, sessionId))
      .orderBy(desc(templates.createdAt));
  }

  async getTemplateById(id: string): Promise<Template | undefined> {
    const [result] = await db.select().from(templates).where(eq(templates.id, id));
    return result;
  }

  async deleteTemplate(id: string, sessionId: string): Promise<boolean> {
    const result = await db.delete(templates)
      .where(sql`${templates.id} = ${id} AND ${templates.sessionId} = ${sessionId}`)
      .returning();
    return result.length > 0;
  }

  async updateTemplateSnapshot(id: string, snapshotJson: unknown, regVersionHash: string): Promise<Template | undefined> {
    const [result] = await db.update(templates)
      .set({ snapshotJson, regVersionHash, lastUsedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return result;
  }

  async incrementTemplateUsage(id: string): Promise<void> {
    await db.update(templates)
      .set({
        timesUsed: sql`${templates.timesUsed} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(templates.id, id));
  }

  async getTemplateCountBySession(sessionId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(templates)
      .where(eq(templates.sessionId, sessionId));
    return Number(result.count);
  }

  async getTemplateByCorridorAndSession(sessionId: string, commodityId: string, originIso2: string, destIso2: string): Promise<Template | undefined> {
    const [result] = await db.select().from(templates)
      .where(sql`${templates.sessionId} = ${sessionId} AND ${templates.commodityId} = ${commodityId} AND ${templates.originIso2} = ${originIso2} AND ${templates.destIso2} = ${destIso2}`);
    return result;
  }

  async getCompanyProfile(sessionId: string): Promise<CompanyProfile | undefined> {
    const [result] = await db.select().from(companyProfiles).where(eq(companyProfiles.sessionId, sessionId));
    return result;
  }

  async upsertCompanyProfile(data: InsertCompanyProfile): Promise<CompanyProfile> {
    const profileComplete = !!(data.companyName && data.registeredAddress && data.countryIso2);
    const existing = await this.getCompanyProfile(data.sessionId);
    if (existing) {
      const [result] = await db.update(companyProfiles)
        .set({ ...data, profileComplete, updatedAt: new Date() })
        .where(eq(companyProfiles.sessionId, data.sessionId))
        .returning();
      return result;
    }
    const [result] = await db.insert(companyProfiles)
      .values({ ...data, profileComplete })
      .returning();
    return result;
  }

  async createTwinlogDownload(data: { lookupId?: string; sessionId: string; companyName: string; eoriNumber?: string; documentStatuses: unknown; pdfHash: string }): Promise<TwinlogDownload> {
    const [result] = await db.insert(twinlogDownloads)
      .values({
        lookupId: data.lookupId || null,
        sessionId: data.sessionId,
        companyName: data.companyName,
        eoriNumber: data.eoriNumber || null,
        documentStatuses: data.documentStatuses,
        pdfHash: data.pdfHash,
      })
      .returning();
    return result;
  }

  async getTableCounts() {
    const [destCount] = await db.select({ count: sql<number>`count(*)` }).from(destinations);
    const [fwCount] = await db.select({ count: sql<number>`count(*)` }).from(regionalFrameworks);
    const [origCount] = await db.select({ count: sql<number>`count(*)` }).from(originCountries);
    const [commCount] = await db.select({ count: sql<number>`count(*)` }).from(commodities);
    const [rooCount] = await db.select({ count: sql<number>`count(*)` }).from(afcftaRoo);

    return {
      destinations: Number(destCount.count),
      regionalFrameworks: Number(fwCount.count),
      originCountries: Number(origCount.count),
      commodities: Number(commCount.count),
      afcftaRoo: Number(rooCount.count),
    };
  }

  async getTradesSummary(): Promise<{ total: number; needAttention: number; lcPending: number; archiveReady: number }> {
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(lookups);
    const [attentionRow] = await db.select({ count: sql<number>`count(*)` }).from(lookups)
      .where(sql`readiness_verdict IN ('RED','AMBER')`);
    const [lcPendingRow] = await db.select({ count: sql<number>`count(*)` }).from(lcChecks)
      .where(eq(lcChecks.verdict, 'DISCREPANCIES_FOUND'));
    const [archiveRow] = await db.select({ count: sql<number>`count(*)` }).from(lookups)
      .where(sql`created_at < NOW() - INTERVAL '30 days'`);
    return {
      total: Number(totalRow.count),
      needAttention: Number(attentionRow.count),
      lcPending: Number(lcPendingRow.count),
      archiveReady: Number(archiveRow.count),
    };
  }

  async getEnrichedTrades(): Promise<EnrichedTrade[]> {
    const rows = await db.execute(sql`
      SELECT DISTINCT ON (l.id)
        l.id,
        l.commodity_name AS "commodityName",
        l.hs_code AS "hsCode",
        o.iso2 AS "originIso2",
        o.country_name AS "originName",
        d.iso2 AS "destIso2",
        d.country_name AS "destName",
        l.risk_level AS "riskLevel",
        l.readiness_score AS "readinessScore",
        l.readiness_verdict AS "readinessVerdict",
        l.created_at AS "createdAt",
        lc.verdict AS "lcVerdict",
        lc.id AS "lcCheckId"
      FROM lookups l
      INNER JOIN origin_countries o ON l.origin_id = o.id
      INNER JOIN destinations d ON l.destination_id = d.id
      LEFT JOIN lc_checks lc ON lc.source_lookup_id = l.id
      ORDER BY l.id, lc.created_at DESC
    `);
    const sorted = (rows.rows as EnrichedTrade[]).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted;
  }

  async getSupplierRequestsBySession(sessionId: string): Promise<EnrichedSupplierRequest[]> {
    const rows = await db.execute(sql`
      SELECT sr.*,
        c.name as commodity_name,
        o.iso2 as origin_iso2,
        d.iso2 as dest_iso2,
        o.country_name as origin_name,
        d.country_name as dest_name
      FROM supplier_requests sr
      JOIN lookups l ON sr.lookup_id = l.id
      JOIN commodities c ON l.commodity_id = c.id
      JOIN origin_countries o ON l.origin_id = o.id
      JOIN destinations d ON l.destination_id = d.id
      WHERE sr.user_session_id = ${sessionId}
      ORDER BY
        CASE sr.status WHEN 'blocking' THEN 1 WHEN 'waiting' THEN 2 WHEN 'partial' THEN 3 ELSE 4 END,
        sr.updated_at DESC
    `);
    return rows.rows as EnrichedSupplierRequest[];
  }

  async getSupplierInboxSummary(sessionId: string): Promise<{ awaiting: number; blocking: number; completeThisWeek: number }> {
    const [awaitingRow] = await db.select({ count: sql<number>`count(*)` })
      .from(supplierRequests)
      .where(sql`user_session_id = ${sessionId} AND status IN ('waiting','partial')`);
    const [blockingRow] = await db.select({ count: sql<number>`count(*)` })
      .from(supplierRequests)
      .where(sql`user_session_id = ${sessionId} AND status = 'blocking'`);
    const [completeRow] = await db.select({ count: sql<number>`count(*)` })
      .from(supplierRequests)
      .where(sql`user_session_id = ${sessionId} AND status = 'complete' AND updated_at > NOW() - INTERVAL '7 days'`);
    return {
      awaiting: Number(awaitingRow.count),
      blocking: Number(blockingRow.count),
      completeThisWeek: Number(completeRow.count),
    };
  }

  async getSupplierInboxBadgeCount(sessionId: string): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)` })
      .from(supplierRequests)
      .where(sql`user_session_id = ${sessionId} AND status IN ('waiting','blocking','partial')`);
    return Number(row.count);
  }

  async getSupplierRequestByLookupId(lookupId: string): Promise<SupplierRequest | undefined> {
    const [row] = await db.select().from(supplierRequests).where(eq(supplierRequests.lookupId, lookupId)).limit(1);
    return row;
  }

  async createSupplierRequest(data: InsertSupplierRequest): Promise<SupplierRequest> {
    const [row] = await db.insert(supplierRequests).values(data).returning();
    return row;
  }

  async logSupplierSend(requestId: string, channel: string): Promise<void> {
    await db.execute(sql`
      UPDATE supplier_requests
      SET sent_via = array_append(sent_via, ${channel}),
          last_sent_at = NOW(),
          updated_at = NOW()
      WHERE id = ${requestId}::uuid
    `);
  }

  async getSupplierRequestById(id: string): Promise<SupplierRequest | undefined> {
    const [row] = await db.select().from(supplierRequests).where(eq(supplierRequests.id, id)).limit(1);
    return row;
  }

  async getSupplierUploadsByRequestId(requestId: string): Promise<SupplierUpload[]> {
    return db.select().from(supplierUploads).where(eq(supplierUploads.requestId, requestId));
  }

  async getSupplierRequestByToken(token: string): Promise<SupplierRequest | undefined> {
    const [row] = await db.select().from(supplierRequests).where(eq(supplierRequests.uploadToken, token)).limit(1);
    return row;
  }

  async createSupplierUpload(data: { requestId: string; docType: string; originalFilename: string; fileKey: string; filesizeBytes?: number; mimeType?: string }): Promise<SupplierUpload> {
    const [row] = await db.insert(supplierUploads).values({
      requestId: data.requestId,
      docType: data.docType,
      originalFilename: data.originalFilename,
      fileKey: data.fileKey,
      filesizeBytes: data.filesizeBytes,
      mimeType: data.mimeType,
      uploadedBy: "supplier",
    }).returning();
    return row;
  }

  async updateSupplierRequestDocsReceived(requestId: string, docsReceived: string[], status: string): Promise<void> {
    await db.execute(sql`
      UPDATE supplier_requests
      SET docs_received = ${JSON.stringify(docsReceived)}::jsonb,
          status = ${status},
          updated_at = NOW()
      WHERE id = ${requestId}::uuid
    `);
  }

  async getLookupByTwinlogRef(ref: string): Promise<Lookup | undefined> {
    const [result] = await db.select().from(lookups).where(eq(lookups.twinlogRef, ref)).limit(1);
    return result;
  }

  async createAlertSubscription(data: InsertAlertSubscription): Promise<AlertSubscription> {
    const [row] = await db.insert(alertSubscriptions).values(data).onConflictDoNothing().returning();
    if (!row) {
      const [existing] = await db.select().from(alertSubscriptions)
        .where(sql`${alertSubscriptions.userSessionId} = ${data.userSessionId} AND ${alertSubscriptions.commodityId} = ${data.commodityId} AND ${alertSubscriptions.destIso2} = ${data.destIso2}`);
      return existing;
    }
    return row;
  }

  async getAlertSubscriptionCount(sessionId: string): Promise<number> {
    const result = await db.execute(sql`SELECT COUNT(*)::int as count FROM alert_subscriptions WHERE user_session_id = ${sessionId}`);
    return (result.rows[0] as any)?.count ?? 0;
  }

  async getAlertSubscriptions(sessionId: string): Promise<AlertSubscription[]> {
    return db.select().from(alertSubscriptions).where(eq(alertSubscriptions.userSessionId, sessionId));
  }

  async getAlertsForSession(sessionId: string): Promise<(RegulatoryAlert & { isRead: boolean })[]> {
    const result = await db.execute(sql`
      SELECT DISTINCT ra.*,
        CASE WHEN ar.id IS NOT NULL THEN true ELSE false END as is_read
      FROM regulatory_alerts ra
      JOIN alert_subscriptions sub ON (
        ra.hs_codes_affected && ARRAY(SELECT hs_code::text FROM commodities WHERE id = sub.commodity_id)
        OR ra.is_deadline = true
      )
      LEFT JOIN alert_reads ar ON ar.alert_id = ra.id AND ar.user_session_id = ${sessionId}
      WHERE sub.user_session_id = ${sessionId}
      ORDER BY ra.effective_date ASC, ra.created_at DESC
    `);
    return (result.rows as any[]).map(r => ({
      id: r.id,
      source: r.source,
      hsCodesAffected: r.hs_codes_affected,
      destIso2Affected: r.dest_iso2_affected,
      summary: r.summary,
      sourceUrl: r.source_url,
      effectiveDate: r.effective_date,
      isDeadline: r.is_deadline,
      createdAt: r.created_at,
      isRead: r.is_read,
    }));
  }

  async getUnreadAlertCount(sessionId: string): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(DISTINCT ra.id)::int as count
      FROM regulatory_alerts ra
      JOIN alert_subscriptions sub ON (
        ra.hs_codes_affected && ARRAY(SELECT hs_code::text FROM commodities WHERE id = sub.commodity_id)
        OR ra.is_deadline = true
      )
      LEFT JOIN alert_reads ar ON ar.alert_id = ra.id AND ar.user_session_id = ${sessionId}
      WHERE sub.user_session_id = ${sessionId}
      AND ar.id IS NULL
    `);
    return (result.rows[0] as any)?.count ?? 0;
  }

  async markAlertRead(sessionId: string, alertId: string): Promise<void> {
    await db.insert(alertReads).values({
      userSessionId: sessionId,
      alertId,
    }).onConflictDoNothing();
  }

  async createRegulatoryAlert(data: InsertRegulatoryAlert): Promise<RegulatoryAlert> {
    const [row] = await db.insert(regulatoryAlerts).values(data).returning();
    return row;
  }

  async createEudrRecord(data: InsertEudrRecord): Promise<EudrRecord> {
    const [row] = await db.insert(eudrRecords).values(data).returning();
    return row;
  }

  async getEudrRecordByLookupId(lookupId: string): Promise<EudrRecord | undefined> {
    const [row] = await db.select().from(eudrRecords).where(eq(eudrRecords.lookupId, lookupId));
    return row;
  }

  async updateEudrRecord(id: string, data: Partial<InsertEudrRecord>): Promise<EudrRecord | undefined> {
    const [row] = await db.update(eudrRecords)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(eudrRecords.id, id))
      .returning();
    return row;
  }

  async markLookupEudrComplete(lookupId: string): Promise<void> {
    await db.update(lookups)
      .set({ eudrComplete: true })
      .where(eq(lookups.id, lookupId));
  }

  // ── Admin & Promo ──

  async setAdminFlag(sessionId: string, isAdmin: boolean): Promise<void> {
    await this.getOrCreateUserTokens(sessionId);
    await db.update(userTokens).set({ isAdmin, updatedAt: new Date() }).where(eq(userTokens.sessionId, sessionId));
  }

  async isAdminSession(sessionId: string): Promise<boolean> {
    const user = await this.getOrCreateUserTokens(sessionId);
    return (user as any).isAdmin ?? false;
  }

  async createPromoCode(data: { code: string; tradeTokens: number; lcCredits: number; maxRedemptions: number; expiresAt?: Date | null }): Promise<PromoCode> {
    const [row] = await db.insert(promoCodes).values({
      code: data.code.toUpperCase().trim(),
      tradeTokens: data.tradeTokens,
      lcCredits: data.lcCredits,
      maxRedemptions: data.maxRedemptions,
      expiresAt: data.expiresAt ?? null,
    }).returning();
    return row;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [row] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase().trim()));
    return row;
  }

  async getPromoCodes(): Promise<PromoCode[]> {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async redeemPromoCode(promoCodeId: string, sessionId: string, tradeTokens: number, lcCredits: number, code: string): Promise<{ success: boolean; message: string }> {
    // Check double-redeem
    const [existing] = await db.select().from(promoRedemptions)
      .where(and(eq(promoRedemptions.promoCodeId, promoCodeId), eq(promoRedemptions.sessionId, sessionId)));
    if (existing) return { success: false, message: "You have already redeemed this code." };

    // Atomic increment + check max
    const [updated] = await db.update(promoCodes)
      .set({ currentRedemptions: sql`${promoCodes.currentRedemptions} + 1` })
      .where(and(eq(promoCodes.id, promoCodeId), sql`${promoCodes.currentRedemptions} < ${promoCodes.maxRedemptions}`))
      .returning();
    if (!updated) return { success: false, message: "This promo code has reached its maximum redemptions." };

    // Record redemption
    await db.insert(promoRedemptions).values({ promoCodeId, sessionId });

    // Credit tokens
    const syntheticId = `promo_${code}_${sessionId}`;
    if (tradeTokens > 0) {
      await this.creditTokens(sessionId, tradeTokens, `Promo code ${code} — ${tradeTokens} trade tokens`, syntheticId);
    }
    if (lcCredits > 0) {
      await this.creditLcCredits(sessionId, lcCredits, `Promo code ${code} — ${lcCredits} LC credits`, `${syntheticId}_lc`);
    }

    const parts: string[] = [];
    if (tradeTokens > 0) parts.push(`${tradeTokens} trade token${tradeTokens > 1 ? "s" : ""}`);
    if (lcCredits > 0) parts.push(`${lcCredits} LC credit${lcCredits > 1 ? "s" : ""}`);
    return { success: true, message: `Redeemed! ${parts.join(" and ")} added.` };
  }

  // ── API Keys ──

  async createApiKey(sessionId: string, name: string): Promise<{ id: string; key: string; name: string; createdAt: Date }> {
    const key = "tt_live_" + randomBytes(32).toString("hex");
    const [row] = await db.insert(apiKeys).values({ sessionId, key, name }).returning();
    return { id: row.id, key: row.key, name: row.name, createdAt: row.createdAt };
  }

  async getApiKeyByKey(key: string): Promise<{ id: string; sessionId: string; isActive: boolean } | undefined> {
    const [row] = await db.select({ id: apiKeys.id, sessionId: apiKeys.sessionId, isActive: apiKeys.isActive })
      .from(apiKeys).where(eq(apiKeys.key, key));
    return row;
  }

  async getApiKeysBySession(sessionId: string): Promise<{ id: string; name: string; keyPreview: string; isActive: boolean; lastUsedAt: Date | null; createdAt: Date }[]> {
    const rows = await db.select().from(apiKeys)
      .where(eq(apiKeys.sessionId, sessionId))
      .orderBy(desc(apiKeys.createdAt));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      keyPreview: r.key.slice(0, 12) + "..." + r.key.slice(-4),
      isActive: r.isActive,
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
    }));
  }

  async deactivateApiKey(id: string, sessionId: string): Promise<boolean> {
    const [row] = await db.update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.sessionId, sessionId)))
      .returning();
    return !!row;
  }

  async touchApiKey(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }
}

export type EnrichedSupplierRequest = {
  id: string;
  lookup_id: string;
  user_session_id: string;
  supplier_name: string;
  supplier_email: string | null;
  supplier_whatsapp: string | null;
  upload_token: string;
  upload_expires_at: string;
  status: string;
  docs_required: unknown;
  docs_received: unknown;
  sent_via: string[] | null;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  commodity_name: string;
  origin_iso2: string;
  dest_iso2: string;
  origin_name: string;
  dest_name: string;
};

export const storage = new DatabaseStorage();
