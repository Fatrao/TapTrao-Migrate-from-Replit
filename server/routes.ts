import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { randomUUID, createHash } from "crypto";
import { storage } from "./storage";
import { seedPrompt2, seedPrompt3A, seedPrompt3B, seedPrompt3C, seedPrompt5 } from "./seed";
import { runComplianceCheck, computeReadinessScore } from "./compliance";
import { runLcCrossCheck, computeLcHash, generateCorrectionEmail } from "./lc-engine";
import { generateTwinlogPdf } from "./twinlog-pdf";
import { generateEudrPdf } from "./eudr-pdf";
import { lcCheckRequestSchema, tokenTransactions, type ComplianceResult, type DocumentStatus } from "@shared/schema";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";

function computeRegVersionHash(result: unknown): string {
  const stable = JSON.stringify(result);
  return createHash("sha256").update(stable).digest("hex");
}

const TOKEN_PACKS: Record<string, { price: number; tokens: number; name: string }> = {
  single_trade: { price: 2499, tokens: 1, name: "Single Trade" },
  "3_trade": { price: 5999, tokens: 3, name: "3-Trade Pack" },
  "10_trade": { price: 17900, tokens: 10, name: "10-Trade Pack" },
  "25_trade": { price: 34900, tokens: 25, name: "25-Trade Pack" },
};

const LOOKUP_COST = 1;
const LC_RECHECK_PRICE_CENTS = 999;
const LC_STANDALONE_PRICE_CENTS = 1999;

function getSessionId(req: Request, res: Response): string {
  let sessionId = req.cookies?.taptrao_session;
  if (!sessionId) {
    sessionId = randomUUID();
    res.cookie("taptrao_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  return sessionId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedPrompt2();
  await seedPrompt3A();
  await seedPrompt3B();
  await seedPrompt3C();
  await seedPrompt5();

  app.get("/download/taptrao-project.zip", (_req, res) => {
    const zipPath = path.resolve("public/taptrao-project.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "taptrao-project.zip");
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  app.get("/api/commodities", async (_req, res) => {
    try {
      const data = await storage.getCommodities();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/origins", async (_req, res) => {
    try {
      const data = await storage.getOriginCountries();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/destinations", async (_req, res) => {
    try {
      const data = await storage.getDestinations();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tokens/balance", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { balance, lcBalance, freeLookupUsed } = await storage.getTokenBalance(sessionId);
      res.json({ balance, lcBalance, freeLookupUsed });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tokens/transactions", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getTokenTransactions(sessionId, limit);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/checkout", async (req, res) => {
    try {
      const { pack } = req.body;
      if (!pack || !TOKEN_PACKS[pack]) {
        res.status(400).json({ message: "Invalid pack. Choose: single_trade, 3_trade, 10_trade, 25_trade" });
        return;
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: "Stripe is not configured" });
        return;
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const sessionId = getSessionId(req, res);
      const packInfo = TOKEN_PACKS[pack];

      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      const baseUrl = `${protocol}://${host}`;

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `TapTrao ${packInfo.name} Token Pack`,
                description: `${packInfo.tokens} compliance tokens`,
              },
              unit_amount: packInfo.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          session_id: sessionId,
          pack,
        },
      });

      res.json({ url: checkoutSession.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/lc-recheck-checkout", async (req, res) => {
    try {
      const { sourceLookupId } = req.body;
      if (!sourceLookupId) {
        res.status(400).json({ message: "sourceLookupId is required" });
        return;
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: "Stripe is not configured" });
        return;
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const sessionId = getSessionId(req, res);

      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      const baseUrl = `${protocol}://${host}`;

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "TapTrao LC Re-check",
                description: "Additional LC document check after supplier corrections",
              },
              unit_amount: LC_RECHECK_PRICE_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/lc-check?recheck_paid={CHECKOUT_SESSION_ID}&lookup_id=${sourceLookupId}`,
        cancel_url: `${baseUrl}/lc-check`,
        metadata: {
          session_id: sessionId,
          pack: "lc_recheck",
          source_lookup_id: sourceLookupId,
        },
      });

      res.json({ url: checkoutSession.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tokens/lc-standalone-checkout", async (req, res) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: "Stripe is not configured" });
        return;
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const sessionId = getSessionId(req, res);

      const host = req.headers.host || "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      const baseUrl = `${protocol}://${host}`;

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "TapTrao LC Check Only",
                description: "Standalone LC document check",
              },
              unit_amount: LC_STANDALONE_PRICE_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/lc-check?lc_paid={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: {
          session_id: sessionId,
          pack: "lc_standalone",
        },
      });

      res.json({ url: checkoutSession.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripeKey || !webhookSecret) {
        res.status(500).json({ message: "Stripe is not configured" });
        return;
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const sig = req.headers["stripe-signature"] as string;

      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody as Buffer,
          sig,
          webhookSecret
        );
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).json({ message: `Webhook Error: ${err.message}` });
        return;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const sessionId = session.metadata?.session_id;
        const pack = session.metadata?.pack;
        const stripeSessionId = session.id;

        if (sessionId && pack === "lc_recheck") {
          const alreadyProcessed = await storage.hasStripeSessionBeenProcessed(stripeSessionId);
          if (!alreadyProcessed) {
            await db.insert(tokenTransactions).values({
              sessionId,
              type: "PURCHASE",
              amount: 0,
              description: "LC re-check payment — $9.99",
              stripeSessionId,
            });
          }
        } else if (sessionId && pack === "lc_standalone") {
          const alreadyProcessed = await storage.hasStripeSessionBeenProcessed(stripeSessionId);
          if (!alreadyProcessed) {
            await db.insert(tokenTransactions).values({
              sessionId,
              type: "PURCHASE",
              amount: 0,
              description: "LC standalone check — $19.99",
              stripeSessionId,
            });
          }
        } else if (sessionId && pack && TOKEN_PACKS[pack]) {
          const packInfo = TOKEN_PACKS[pack];
          await storage.creditTokens(
            sessionId,
            packInfo.tokens,
            `Trade pack purchase — ${packInfo.name}`,
            stripeSessionId
          );
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tokens/verify-purchase", async (req, res) => {
    try {
      const stripeSessionId = req.query.session_id as string;
      if (!stripeSessionId) {
        res.status(400).json({ message: "session_id is required" });
        return;
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: "Stripe is not configured" });
        return;
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);

      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      if (session.payment_status === "paid") {
        const sessionId = session.metadata?.session_id;
        const pack = session.metadata?.pack;
        if (sessionId && pack === "lc_recheck") {
          const alreadyProcessed = await storage.hasStripeSessionBeenProcessed(stripeSessionId);
          if (!alreadyProcessed) {
            await db.insert(tokenTransactions).values({
              sessionId,
              type: "PURCHASE",
              amount: 0,
              description: "LC re-check payment — $9.99",
              stripeSessionId,
            });
          }
          res.json({ success: true, packName: "LC Re-check" });
          return;
        } else if (sessionId && pack === "lc_standalone") {
          const alreadyProcessed = await storage.hasStripeSessionBeenProcessed(stripeSessionId);
          if (!alreadyProcessed) {
            await db.insert(tokenTransactions).values({
              sessionId,
              type: "PURCHASE",
              amount: 0,
              description: "LC standalone check — $19.99",
              stripeSessionId,
            });
          }
          res.json({ success: true, packName: "LC Check Only" });
          return;
        } else if (sessionId && pack && TOKEN_PACKS[pack]) {
          const packInfo = TOKEN_PACKS[pack];
          await storage.creditTokens(
            sessionId,
            packInfo.tokens,
            `Trade pack purchase — ${packInfo.name}`,
            stripeSessionId
          );
          const { balance } = await storage.getTokenBalance(sessionId);
          res.json({ success: true, tokensAdded: packInfo.tokens, balance, packName: packInfo.name });
          return;
        }
      }

      res.json({ success: false, message: "Payment not completed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/compliance-check", async (req, res) => {
    try {
      const { commodityId, originId, destinationId } = req.body;
      if (!commodityId || !originId || !destinationId) {
        res.status(400).json({ message: "commodityId, originId, and destinationId are required" });
        return;
      }

      const sessionId = getSessionId(req, res);
      const { balance, freeLookupUsed } = await storage.getTokenBalance(sessionId);

      if (!freeLookupUsed) {
        await storage.markDemoUsed(sessionId);
      } else if (balance < LOOKUP_COST) {
        res.status(402).json({
          message: "Insufficient tokens",
          required: LOOKUP_COST,
          balance,
        });
        return;
      } else {
        await storage.spendTokens(sessionId, LOOKUP_COST, `Compliance Lookup — ${commodityId}`);
      }

      const result = await runComplianceCheck(commodityId, originId, destinationId);

      const triggers = result.triggers;
      const hasStop = result.stopFlags && Object.keys(result.stopFlags).length > 0;
      const hasRed = triggers.kimberley || triggers.conflict || triggers.cites;
      const hasAmber = triggers.eudr || triggers.cbam || triggers.iuu || triggers.csddd;
      const riskLevel = hasStop ? "STOP" : hasRed ? "HIGH" : hasAmber ? "MEDIUM" : "LOW";

      const integrityHash = createHash("sha256")
        .update(JSON.stringify(result) + new Date().toISOString())
        .digest("hex");

      let lookupId: string | null = null;
      try {
        const saved = await storage.createLookup({
          commodityId,
          originId,
          destinationId,
          commodityName: result.commodity.name,
          originName: result.origin.countryName,
          destinationName: result.destination.countryName,
          hsCode: result.commodity.hsCode,
          riskLevel,
          resultJson: result,
          integrityHash,
          readinessScore: result.readinessScore.score,
          readinessVerdict: result.readinessScore.verdict,
          readinessFactors: result.readinessScore.factors,
          readinessSummary: result.readinessScore.summary,
        });
        lookupId = saved.id;
      } catch (_e) {}

      res.json({ ...result, lookupId, integrityHash });
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("not found")) {
        res.status(404).json({ message: msg });
      } else {
        res.status(500).json({ message: msg });
      }
    }
  });

  app.get("/api/table-counts", async (_req, res) => {
    try {
      const counts = await storage.getTableCounts();
      res.json(counts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/commodity-stats", async (_req, res) => {
    try {
      const stats = await storage.getCommodityStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades/summary", async (_req, res) => {
    try {
      const summary = await storage.getTradesSummary();
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades", async (_req, res) => {
    try {
      const trades = await storage.getEnrichedTrades();
      res.json(trades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lookups/recent", async (_req, res) => {
    try {
      const data = await storage.getRecentLookups(10);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lookups", async (_req, res) => {
    try {
      const data = await storage.getAllLookups();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lookups/:id", async (req, res) => {
    try {
      const lookup = await storage.getLookupById(req.params.id);
      if (!lookup) {
        res.status(404).json({ message: "Lookup not found" });
        return;
      }
      res.json(lookup);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lc-checks/recent", async (_req, res) => {
    try {
      const data = await storage.getRecentLcChecks(10);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lc-checks", async (_req, res) => {
    try {
      const data = await storage.getAllLcChecks();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-checks", async (req, res) => {
    try {
      const parsed = lcCheckRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Invalid request", errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const sessionId = getSessionId(req, res);
      const { balance, freeLookupUsed } = await storage.getTokenBalance(sessionId);
      const { lcFields, documents, sourceLookupId } = parsed.data;
      const recheckSessionId = req.body.recheckSessionId as string | undefined;

      if (sourceLookupId) {
        const alreadyHasLcCheck = await storage.hasLcCheckForLookup(sourceLookupId);
        if (alreadyHasLcCheck) {
          if (recheckSessionId) {
            const alreadyUsed = await storage.hasStripeSessionBeenProcessed(recheckSessionId);
            if (alreadyUsed) {
              res.status(402).json({
                message: "This re-check payment has already been used. Please purchase a new re-check.",
                type: "lc_recheck",
                sourceLookupId,
              });
              return;
            }
            const stripeKey = process.env.STRIPE_SECRET_KEY;
            if (!stripeKey) {
              res.status(500).json({ message: "Stripe is not configured" });
              return;
            }
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(stripeKey);
            try {
              const stripeSession = await stripe.checkout.sessions.retrieve(recheckSessionId);
              if (stripeSession.payment_status !== "paid" || stripeSession.metadata?.pack !== "lc_recheck") {
                res.status(402).json({
                  message: "Re-check payment not found. Please try again.",
                  type: "lc_recheck",
                  sourceLookupId,
                });
                return;
              }
              await db.insert(tokenTransactions).values({
                sessionId,
                type: "PURCHASE",
                amount: 0,
                description: "LC re-check payment — $9.99",
                stripeSessionId: recheckSessionId,
              });
            } catch {
              res.status(402).json({
                message: "Re-check payment verification failed. Please try again.",
                type: "lc_recheck",
                sourceLookupId,
              });
              return;
            }
          } else {
            res.status(402).json({
              message: "You've already run an LC check for this trade. Re-check after supplier corrections — $9.99.",
              type: "lc_recheck",
              sourceLookupId,
            });
            return;
          }
        }
        if (!freeLookupUsed) {
          await storage.markDemoUsed(sessionId);
        } else if (balance < 1) {
          res.status(402).json({
            message: "LC checks are included in trade packs. Purchase a trade pack to continue.",
            required: 1,
            balance,
            type: "trade_pack",
          });
          return;
        }
      } else {
        if (!freeLookupUsed) {
          await storage.markDemoUsed(sessionId);
        } else if (balance < 1) {
          res.status(402).json({
            message: "LC checks are included in trade packs. Purchase a trade pack to continue.",
            required: 1,
            balance,
            type: "trade_pack",
          });
          return;
        }
      }
      const { results, summary } = runLcCrossCheck(lcFields, documents);
      const timestamp = new Date().toISOString();
      const integrityHash = computeLcHash(lcFields, documents, results, timestamp);
      const correction = generateCorrectionEmail(lcFields, results);

      const saved = await storage.createLcCheck({
        lcFieldsJson: lcFields,
        documentsJson: documents,
        resultsJson: results,
        summary,
        verdict: summary.verdict,
        correctionEmail: correction.email || null,
        commsLog: null,
        integrityHash,
        sourceLookupId: sourceLookupId || null,
        sessionId,
      });

      res.json({
        id: saved.id,
        results,
        summary,
        integrityHash,
        timestamp,
        correctionEmail: correction.email,
        correctionWhatsApp: correction.whatsapp,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-checks/linked-lookups", async (req, res) => {
    try {
      const { lookupIds } = req.body;
      if (!Array.isArray(lookupIds)) {
        res.status(400).json({ message: "lookupIds array required" });
        return;
      }
      const map = await storage.getLcChecksByLookupIds(lookupIds);
      res.json(map);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lc-checks/:id", async (req, res) => {
    try {
      const check = await storage.getLcCheckById(req.params.id);
      if (!check) {
        res.status(404).json({ message: "LC check not found" });
        return;
      }
      res.json(check);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const tpls = await storage.getTemplatesBySession(sessionId);
      res.json(tpls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates/check-corridor", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { commodityId, originIso2, destIso2 } = req.query as Record<string, string>;
      if (!commodityId || !originIso2 || !destIso2) {
        res.json({ exists: false });
        return;
      }
      const existing = await storage.getTemplateByCorridorAndSession(sessionId, commodityId, originIso2, destIso2);
      res.json({ exists: !!existing, templateId: existing?.id || null });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates/count", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const count = await storage.getTemplateCountBySession(sessionId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { name, commodityId, originIso2, destIso2, snapshotJson } = req.body;
      if (!name || !commodityId || !originIso2 || !destIso2 || !snapshotJson) {
        res.status(400).json({ message: "name, commodityId, originIso2, destIso2, and snapshotJson are required" });
        return;
      }

      const existing = await storage.getTemplateByCorridorAndSession(sessionId, commodityId, originIso2, destIso2);
      if (existing) {
        res.status(409).json({ message: "A template for this corridor already exists", templateId: existing.id });
        return;
      }

      const regVersionHash = computeRegVersionHash(snapshotJson);
      const template = await storage.createTemplate({
        sessionId,
        name,
        commodityId,
        originIso2,
        destIso2,
        snapshotJson,
        regVersionHash,
      });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplateById(req.params.id);
      if (!template) {
        res.status(404).json({ message: "Template not found" });
        return;
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/templates/:id/stale-check", async (req, res) => {
    try {
      const template = await storage.getTemplateById(req.params.id);
      if (!template) {
        res.status(404).json({ message: "Template not found" });
        return;
      }

      const commodity = await storage.getCommodityById(template.commodityId);
      if (!commodity) {
        res.json({ stale: true, reason: "Commodity no longer exists" });
        return;
      }

      const origins = await storage.getOriginCountries();
      const origin = origins.find(o => o.iso2 === template.originIso2);
      const dests = await storage.getDestinations();
      const dest = dests.find(d => d.iso2 === template.destIso2);

      if (!origin || !dest) {
        res.json({ stale: true, reason: "Origin or destination no longer exists" });
        return;
      }

      const freshResult = await runComplianceCheck(commodity.id, origin.id, dest.id);
      const currentHash = computeRegVersionHash(freshResult);
      const stale = currentHash !== template.regVersionHash;
      res.json({ stale, currentHash, savedHash: template.regVersionHash });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/templates/:id/refresh", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const template = await storage.getTemplateById(req.params.id);
      if (!template) {
        res.status(404).json({ message: "Template not found" });
        return;
      }
      if (template.sessionId !== sessionId) {
        res.status(403).json({ message: "Not your template" });
        return;
      }

      const { balance, demoUsed } = await storage.getTokenBalance(sessionId);
      if (demoUsed && balance < LOOKUP_COST) {
        res.status(402).json({ message: "Insufficient tokens", required: LOOKUP_COST, balance });
        return;
      }

      const commodity = await storage.getCommodityById(template.commodityId);
      if (!commodity) {
        res.status(404).json({ message: "Commodity no longer exists" });
        return;
      }

      const origins = await storage.getOriginCountries();
      const origin = origins.find(o => o.iso2 === template.originIso2);
      const dests = await storage.getDestinations();
      const dest = dests.find(d => d.iso2 === template.destIso2);

      if (!origin || !dest) {
        res.status(404).json({ message: "Origin or destination no longer exists" });
        return;
      }

      if (!demoUsed) {
        await storage.markDemoUsed(sessionId);
      } else {
        await storage.spendTokens(sessionId, LOOKUP_COST, `Template refresh — ${commodity.name} ${template.originIso2}\u2192${template.destIso2}`);
      }

      const freshResult = await runComplianceCheck(commodity.id, origin.id, dest.id);
      const newHash = computeRegVersionHash(freshResult);

      await storage.updateTemplateSnapshot(template.id, freshResult, newHash);
      await storage.incrementTemplateUsage(template.id);

      try {
        const triggers = freshResult.triggers;
        const hasStop = freshResult.stopFlags && Object.keys(freshResult.stopFlags).length > 0;
        const hasRed = triggers.kimberley || triggers.conflict || triggers.cites;
        const hasAmber = triggers.eudr || triggers.cbam || triggers.iuu || triggers.csddd;
        const riskLevel = hasStop ? "STOP" : hasRed ? "HIGH" : hasAmber ? "MEDIUM" : "LOW";
        await storage.createLookup({
          commodityId: commodity.id,
          originId: origin.id,
          destinationId: dest.id,
          commodityName: commodity.name,
          originName: origin.countryName,
          destinationName: dest.countryName,
          hsCode: commodity.hsCode,
          riskLevel,
          resultJson: freshResult,
          integrityHash: null,
          readinessScore: freshResult.readinessScore.score,
          readinessVerdict: freshResult.readinessScore.verdict,
          readinessFactors: freshResult.readinessScore.factors,
          readinessSummary: freshResult.readinessScore.summary,
        });
      } catch (_e) {}

      res.json({ result: freshResult, regVersionHash: newHash });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Company Profile ──

  app.get("/api/company-profile", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const profile = await storage.getCompanyProfile(sessionId);
      res.json(profile || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/company-profile", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { companyName, registeredAddress, countryIso2, vatNumber, eoriNumber, contactEmail } = req.body;
      if (!companyName || !registeredAddress || !countryIso2) {
        res.status(400).json({ message: "companyName, registeredAddress, and countryIso2 are required" });
        return;
      }
      const profile = await storage.upsertCompanyProfile({
        sessionId,
        companyName,
        registeredAddress,
        countryIso2,
        vatNumber: vatNumber || null,
        eoriNumber: eoriNumber || null,
        contactEmail: contactEmail || null,
      });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── TwinLog Trail ──

  app.get("/api/twinlog/:lookupId/data", async (req, res) => {
    try {
      const lookup = await storage.getLookupById(req.params.lookupId);
      if (!lookup) {
        res.status(404).json({ message: "Lookup not found" });
        return;
      }

      const lcCheckMap = await storage.getLcChecksByLookupIds([lookup.id]);
      const lcCheckId = lcCheckMap[lookup.id];
      const lcCheck = lcCheckId ? await storage.getLcCheckById(lcCheckId) : null;

      const supplierRequest = await storage.getSupplierRequestByLookupId(lookup.id);

      let supplierUploads: any[] = [];
      if (supplierRequest) {
        supplierUploads = await storage.getSupplierUploadsByRequestId(supplierRequest.id);
      }

      const timeline: { event: string; timestamp: string }[] = [];
      timeline.push({ event: "Compliance lookup run", timestamp: lookup.createdAt.toISOString() });
      if (lcCheck) {
        timeline.push({ event: `LC check run \u2014 ${lcCheck.verdict}`, timestamp: lcCheck.createdAt.toISOString() });
      }
      if (supplierRequest?.lastSentAt) {
        timeline.push({ event: `Supplier brief sent`, timestamp: supplierRequest.lastSentAt.toISOString() });
      }
      for (const upload of supplierUploads) {
        timeline.push({ event: `${upload.docType} uploaded by supplier`, timestamp: upload.uploadedAt.toISOString() });
      }
      if (lookup.twinlogLockedAt) {
        timeline.push({ event: "TwinLog locked", timestamp: lookup.twinlogLockedAt.toISOString() });
      }
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      res.json({
        lookup: {
          id: lookup.id,
          commodityId: lookup.commodityId,
          commodityName: lookup.commodityName,
          originName: lookup.originName,
          destinationName: lookup.destinationName,
          hsCode: lookup.hsCode,
          resultJson: lookup.resultJson,
          twinlogRef: lookup.twinlogRef,
          twinlogHash: lookup.twinlogHash,
          twinlogLockedAt: lookup.twinlogLockedAt,
          readinessScore: lookup.readinessScore,
          readinessVerdict: lookup.readinessVerdict,
          readinessFactors: lookup.readinessFactors,
          readinessSummary: lookup.readinessSummary,
          integrityHash: lookup.integrityHash,
          createdAt: lookup.createdAt,
        },
        lcCheck: lcCheck ? { id: lcCheck.id, verdict: lcCheck.verdict, createdAt: lcCheck.createdAt } : null,
        supplierRequest: supplierRequest ? {
          id: supplierRequest.id,
          docsRequired: supplierRequest.docsRequired,
          docsReceived: supplierRequest.docsReceived,
          status: supplierRequest.status,
        } : null,
        timeline,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/verify/:ref", async (req, res) => {
    try {
      const lookup = await storage.getLookupByTwinlogRef(req.params.ref);
      if (!lookup) {
        res.status(404).json({ message: "Reference not found" });
        return;
      }
      res.json({
        commodityName: lookup.commodityName,
        originName: lookup.originName,
        destinationName: lookup.destinationName,
        twinlogRef: lookup.twinlogRef,
        twinlogHash: lookup.twinlogHash,
        twinlogLockedAt: lookup.twinlogLockedAt,
        readinessScore: lookup.readinessScore,
        readinessVerdict: lookup.readinessVerdict,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/twinlog/generate", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { lookupId, documentStatuses, complianceResult } = req.body;

      const profile = await storage.getCompanyProfile(sessionId);
      if (!profile || !profile.profileComplete) {
        res.status(403).json({
          error: "PROFILE_REQUIRED",
          message: "Complete your company profile at /settings/profile before downloading TwinLog Trail records.",
        });
        return;
      }

      let result: ComplianceResult;
      let integrityHash: string | null = null;
      let lookupTimestamp = new Date().toISOString();
      let resolvedLookupId: string | undefined;

      if (lookupId) {
        const lookup = await storage.getLookupById(lookupId);
        if (!lookup) {
          res.status(404).json({ message: "Lookup not found" });
          return;
        }
        result = lookup.resultJson as ComplianceResult;
        integrityHash = lookup.integrityHash;
        lookupTimestamp = lookup.createdAt.toISOString();
        resolvedLookupId = lookup.id;
      } else if (complianceResult) {
        result = complianceResult as ComplianceResult;
      } else {
        res.status(400).json({ message: "lookupId or complianceResult is required" });
        return;
      }

      const docStatuses: Record<number, DocumentStatus> = documentStatuses || {};
      const year = new Date().getFullYear();
      const hashPart = integrityHash ? integrityHash.substring(0, 6).toUpperCase() : createHash("sha256").update(JSON.stringify(result) + Date.now()).digest("hex").substring(0, 6).toUpperCase();
      const reference = `TT-${year}-${hashPart}`;

      const commoditySlug = result.commodity.name.replace(/[^a-zA-Z0-9]/g, "");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `TwinLog-Trail_${commoditySlug}_${result.origin.iso2}-${result.destination.iso2}_${dateStr}.pdf`;

      const { stream, hashPromise } = generateTwinlogPdf(
        result,
        profile,
        docStatuses,
        integrityHash,
        reference,
        lookupTimestamp,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      stream.pipe(res);

      hashPromise.then(async (pdfHash) => {
        try {
          await storage.createTwinlogDownload({
            lookupId: resolvedLookupId,
            sessionId,
            companyName: profile.companyName,
            eoriNumber: profile.eoriNumber || undefined,
            documentStatuses: docStatuses,
            pdfHash,
          });
        } catch (_e) {}
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Supplier Inbox ──

  app.get("/api/supplier-inbox", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const requests = await storage.getSupplierRequestsBySession(sessionId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/supplier-inbox/summary", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const summary = await storage.getSupplierInboxSummary(sessionId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/supplier-inbox/badge-count", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const count = await storage.getSupplierInboxBadgeCount(sessionId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/supplier-requests/create-or-get", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { lookupId } = req.body;
      if (!lookupId) {
        res.status(400).json({ message: "lookupId is required" });
        return;
      }

      const lookup = await storage.getLookupById(lookupId);
      if (!lookup) {
        res.status(404).json({ message: "Lookup not found" });
        return;
      }

      let request = await storage.getSupplierRequestByLookupId(lookupId);
      if (!request) {
        const resultJson = lookup.resultJson as any;
        const requirementsDetailed = resultJson?.origin?.requirementsDetailed || [];
        const supplierDocs = requirementsDetailed
          .filter((r: any) => r.isSupplierSide)
          .map((r: any) => r.title);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        request = await storage.createSupplierRequest({
          lookupId,
          userSessionId: sessionId,
          docsRequired: supplierDocs.length > 0 ? supplierDocs : ["Commercial Invoice", "Certificate of Origin", "Packing List"],
          docsReceived: [],
          uploadExpiresAt: expiresAt,
          status: "waiting",
        });
      }

      const host = req.headers.host || "app.taptrao.com";
      const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
      const uploadUrl = `${protocol}://${host}/upload/${request.uploadToken}`;

      res.json({
        requestId: request.id,
        uploadToken: request.uploadToken,
        uploadUrl,
        supplierRequest: request,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/supplier-requests/:id/log-send", async (req, res) => {
    try {
      const { id } = req.params;
      const { channel } = req.body;
      if (!channel || !["whatsapp", "email", "link"].includes(channel)) {
        res.status(400).json({ message: "channel must be whatsapp, email, or link" });
        return;
      }

      const request = await storage.getSupplierRequestById(id);
      if (!request) {
        res.status(404).json({ message: "Supplier request not found" });
        return;
      }

      await storage.logSupplierSend(id, channel);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/supplier-requests/:id/uploads", async (req, res) => {
    try {
      const uploads = await storage.getSupplierUploadsByRequestId(req.params.id);
      res.json(uploads);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Public Supplier Upload ──

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  app.get("/api/upload/:token/data", async (req, res) => {
    try {
      const { token } = req.params;
      if (!UUID_REGEX.test(token)) {
        res.status(404).json({ message: "Upload link not found" });
        return;
      }
      const request = await storage.getSupplierRequestByToken(token);
      if (!request) {
        res.status(404).json({ message: "Upload link not found" });
        return;
      }
      if (new Date(request.uploadExpiresAt) < new Date()) {
        res.status(410).json({ message: "Upload link has expired" });
        return;
      }

      const lookup = request.lookupId ? await storage.getLookupById(request.lookupId) : null;
      const uploads = await storage.getSupplierUploadsByRequestId(request.id);

      let commodityName = "";
      let originIso2 = "";
      let originName = "";
      let destIso2 = "";
      let destName = "";

      if (lookup) {
        const commodity = await storage.getCommodityById(lookup.commodityId as string);
        const origin = await storage.getOriginCountryById(lookup.originId as string);
        const dest = await storage.getDestinationById(lookup.destinationId as string);
        commodityName = commodity?.name || lookup.commodityName || "";
        originIso2 = origin?.iso2 || "";
        originName = origin?.countryName || lookup.originName || "";
        destIso2 = dest?.iso2 || "";
        destName = dest?.countryName || lookup.destinationName || "";
      }

      res.json({
        request: {
          id: request.id,
          supplierName: request.supplierName,
          docsRequired: request.docsRequired,
          docsReceived: request.docsReceived,
          status: request.status,
          uploadExpiresAt: request.uploadExpiresAt,
        },
        trade: { commodityName, originIso2, originName, destIso2, destName },
        uploads,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const uploadDir = path.join("/tmp", "uploads");
  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        const tokenDir = path.join(uploadDir, req.params.token || "unknown");
        fs.mkdirSync(tokenDir, { recursive: true });
        cb(null, tokenDir);
      },
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [".pdf", ".jpg", ".jpeg", ".png"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, JPG, and PNG files are allowed"));
      }
    },
  });

  app.post("/api/upload/:token/file", upload.single("file"), async (req, res) => {
    try {
      const { token } = req.params;
      if (!UUID_REGEX.test(token)) {
        res.status(404).json({ message: "Upload link not found" });
        return;
      }
      const request = await storage.getSupplierRequestByToken(token);
      if (!request) {
        res.status(404).json({ message: "Upload link not found" });
        return;
      }
      if (new Date(request.uploadExpiresAt) < new Date()) {
        res.status(410).json({ message: "Upload link has expired" });
        return;
      }

      const docType = req.body?.doc_type;
      if (!docType) {
        res.status(400).json({ message: "doc_type is required" });
        return;
      }

      const docsRequired = (request.docsRequired as string[]) || [];
      if (!docsRequired.includes(docType)) {
        res.status(400).json({ message: "Invalid document type for this request" });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

      await storage.createSupplierUpload({
        requestId: request.id,
        docType,
        originalFilename: safeFilename,
        fileKey: file.path,
        filesizeBytes: file.size,
        mimeType: file.mimetype,
      });

      const currentReceived = (request.docsReceived as string[]) || [];
      const newReceived = currentReceived.includes(docType)
        ? currentReceived
        : [...currentReceived, docType];

      const uploads = await storage.getSupplierUploadsByRequestId(request.id);
      const hasBlocking = uploads.some(u => u.verified === false && u.finding);
      let status: string;
      if (newReceived.length >= docsRequired.length && !hasBlocking) {
        status = "complete";
      } else if (hasBlocking) {
        status = "blocking";
      } else if (newReceived.length > 0) {
        status = "partial";
      } else {
        status = "waiting";
      }

      await storage.updateSupplierRequestDocsReceived(request.id, newReceived, status);

      res.json({ success: true, filename: file.originalname, doc_type: docType });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/upload/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      if (!UUID_REGEX.test(token)) {
        res.status(404).json({ message: "Upload link not found" });
        return;
      }
      const request = await storage.getSupplierRequestByToken(token);
      if (!request) {
        res.status(404).json({ message: "Upload link not found" });
        return;
      }

      const docsRequired = (request.docsRequired as string[]) || [];
      const docsReceived = (request.docsReceived as string[]) || [];
      const uploads = await storage.getSupplierUploadsByRequestId(request.id);
      const hasBlocking = uploads.some(u => u.verified === false && u.finding);
      let status: string;
      if (docsReceived.length >= docsRequired.length && !hasBlocking) {
        status = "complete";
      } else if (hasBlocking) {
        status = "blocking";
      } else if (docsReceived.length > 0) {
        status = "partial";
      } else {
        status = "waiting";
      }
      await storage.updateSupplierRequestDocsReceived(request.id, docsReceived, status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      await storage.incrementTemplateUsage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const deleted = await storage.deleteTemplate(req.params.id, sessionId);
      if (!deleted) {
        res.status(404).json({ message: "Template not found or not yours" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/alerts/subscribe", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { commodityId, destIso2 } = req.body;
      if (!commodityId || !destIso2) {
        res.status(400).json({ message: "commodityId and destIso2 are required" });
        return;
      }
      const count = await storage.getAlertSubscriptionCount(sessionId);
      if (count >= 3) {
        res.status(403).json({ message: "Free limit reached. You can watch up to 3 corridors.", count });
        return;
      }
      const sub = await storage.createAlertSubscription({ userSessionId: sessionId, commodityId, destIso2 });
      const newCount = await storage.getAlertSubscriptionCount(sessionId);
      res.json({ subscription: sub, count: newCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/alerts/subscriptions", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const subs = await storage.getAlertSubscriptions(sessionId);
      const count = subs.length;
      res.json({ subscriptions: subs, count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const alerts = await storage.getAlertsForSession(sessionId);
      res.json(alerts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/alerts/unread-count", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const count = await storage.getUnreadAlertCount(sessionId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/alerts/:alertId/read", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      await storage.markAlertRead(sessionId, req.params.alertId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── EUDR Due Diligence ──

  app.get("/api/eudr/:lookupId", async (req, res) => {
    try {
      const record = await storage.getEudrRecordByLookupId(req.params.lookupId);
      res.json(record || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/eudr", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { lookupId, commodityId, originIso2, destIso2 } = req.body;
      if (!lookupId) {
        res.status(400).json({ message: "lookupId is required" });
        return;
      }
      const existing = await storage.getEudrRecordByLookupId(lookupId);
      if (existing) {
        res.json(existing);
        return;
      }
      const record = await storage.createEudrRecord({
        lookupId,
        userSessionId: sessionId,
        commodityId: commodityId || null,
        originIso2: originIso2 || null,
        destIso2: destIso2 || null,
        status: "draft",
      });
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/eudr/:id", async (req, res) => {
    try {
      const allowedFields = [
        "plotCoordinates", "plotCountryIso2", "plotCountryValid",
        "evidenceType", "evidenceReference", "evidenceDate",
        "supplierName", "supplierAddress", "supplierRegNumber",
        "sanctionsChecked", "sanctionsClear",
        "riskLevel", "riskFactors", "highRiskReason",
        "statementJson", "statementPdfKey", "status", "retentionUntil",
      ];
      const sanitized: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) sanitized[key] = req.body[key];
      }
      const updated = await storage.updateEudrRecord(req.params.id, sanitized);
      if (!updated) {
        res.status(404).json({ message: "EUDR record not found" });
        return;
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/eudr/:id/generate-statement", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { eudrRecords } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const byId = await db.select().from(eudrRecords).where(eq(eudrRecords.id, req.params.id));
      let eudrRecord = byId[0] || null;
      if (!eudrRecord) {
        eudrRecord = await storage.getEudrRecordByLookupId(req.params.id) || null;
      }
      if (!eudrRecord) {
        res.status(404).json({ message: "EUDR record not found" });
        return;
      }

      const lookup = eudrRecord.lookupId
        ? await storage.getLookupById(eudrRecord.lookupId)
        : null;

      const resultJson = lookup?.resultJson as ComplianceResult | null;
      const twinlogRef = lookup?.twinlogRef || null;
      const twinlogHash = lookup?.twinlogHash || null;

      const profile = await storage.getCompanyProfile(sessionId);
      const companyName = profile?.companyName || "OPERATOR (Not specified)";

      const now = new Date();
      const year = now.getFullYear();
      const refSuffix = (eudrRecord.id || "").substring(0, 6).toUpperCase();
      const eudrRef = `EUDR-${twinlogRef || "TT"}-${refSuffix}-${year}`;

      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + 5);

      const plotCoords = eudrRecord.plotCoordinates as any;

      const statementData = {
        plotCoordinates: plotCoords,
        plotCountryValid: eudrRecord.plotCountryValid ?? false,
        evidenceType: eudrRecord.evidenceType || "other",
        evidenceReference: eudrRecord.evidenceReference || "",
        evidenceDate: eudrRecord.evidenceDate || "",
        supplierName: eudrRecord.supplierName || "",
        supplierAddress: eudrRecord.supplierAddress || "",
        supplierRegNumber: eudrRecord.supplierRegNumber || null,
        sanctionsChecked: eudrRecord.sanctionsChecked ?? false,
        riskLevel: eudrRecord.riskLevel || "standard",
        riskFactors: eudrRecord.riskFactors || [],
        highRiskReason: eudrRecord.highRiskReason || null,
        commodityName: resultJson?.commodity?.name || "",
        hsCode: resultJson?.commodity?.hsCode || "",
        originCountry: resultJson?.origin?.countryName || "",
        destination: resultJson?.destination?.countryName || "",
      };

      const statementJson = {
        reference: eudrRef,
        companyName,
        generatedAt: now.toISOString(),
        ...statementData,
        twinlogRef,
        twinlogHash,
      };

      await storage.updateEudrRecord(eudrRecord.id, {
        statementJson,
        status: "complete",
        retentionUntil: retentionDate.toISOString().split("T")[0],
        riskLevel: eudrRecord.riskLevel || "standard",
      });

      if (eudrRecord.lookupId) {
        await storage.markLookupEudrComplete(eudrRecord.lookupId);
      }

      const { stream, hashPromise } = generateEudrPdf({
        reference: eudrRef,
        companyName,
        statementDate: now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        commodityName: statementData.commodityName,
        hsCode: statementData.hsCode,
        originCountry: statementData.originCountry,
        destination: statementData.destination,
        plotCoordinates: plotCoords,
        plotCountryValid: statementData.plotCountryValid,
        evidenceType: statementData.evidenceType,
        evidenceReference: statementData.evidenceReference,
        evidenceDate: statementData.evidenceDate,
        supplierName: statementData.supplierName,
        supplierAddress: statementData.supplierAddress,
        supplierRegNumber: statementData.supplierRegNumber,
        sanctionsCheckedDate: now.toLocaleDateString("en-GB"),
        riskLevel: statementData.riskLevel,
        highRiskReason: statementData.highRiskReason,
        twinlogRef,
        twinlogHash,
      });

      const filename = `EUDR-Statement-${eudrRef.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      stream.pipe(res);

      hashPromise.then(async (pdfHash) => {
        try {
          await storage.updateEudrRecord(eudrRecord!.id, {
            statementPdfKey: pdfHash,
          });
        } catch (_e) {}
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/alerts", async (req, res) => {
    try {
      const { admin_password, source, hs_codes_affected, dest_iso2_affected, summary, source_url, effective_date } = req.body;
      const adminPw = process.env.ADMIN_PASSWORD;
      if (!adminPw || admin_password !== adminPw) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      if (!summary) {
        res.status(400).json({ message: "summary is required" });
        return;
      }
      const hsArr = typeof hs_codes_affected === "string"
        ? hs_codes_affected.split(",").map((s: string) => s.trim()).filter(Boolean)
        : hs_codes_affected || [];
      const destArr = typeof dest_iso2_affected === "string"
        ? dest_iso2_affected.split(",").map((s: string) => s.trim()).filter(Boolean)
        : dest_iso2_affected || [];
      const alert = await storage.createRegulatoryAlert({
        source: source || "MANUAL",
        hsCodesAffected: hsArr,
        destIso2Affected: destArr,
        summary,
        sourceUrl: source_url || null,
        effectiveDate: effective_date || null,
        isDeadline: false,
      });
      res.json({ success: true, alert });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    app.post("/api/test/readiness-score", async (req, res) => {
      try {
        const { triggers, hazards, stopFlags, requirementsDetailed } = req.body;
        const result = computeReadinessScore({
          triggers: triggers || {},
          hazards: hazards || [],
          stopFlags: stopFlags || null,
          requirementsDetailed: requirementsDetailed || [],
        });
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });

    app.post("/api/test/demurrage", async (req, res) => {
      try {
        const { baseRate, chargeableDays } = req.body;
        if (typeof baseRate !== "number" || typeof chargeableDays !== "number") {
          res.status(400).json({ message: "baseRate and chargeableDays (numbers) are required" });
          return;
        }
        if (chargeableDays <= 0) {
          res.json({ tiers: [], total: 0 });
          return;
        }
        const tiers: { label: string; days: number; rate: number; subtotal: number }[] = [];
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
        res.json({ tiers, total });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });
  }

  return httpServer;
}
