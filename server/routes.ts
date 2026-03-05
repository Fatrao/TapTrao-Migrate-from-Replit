import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomUUID, createHash } from "crypto";
import { storage } from "./storage";
import { seedPrompt2, seedPrompt3A, seedPrompt3B, seedPrompt3C, seedPrompt5, seedPrompt6, seedPrompt7, seedComplianceRules } from "./seed";
import { runComplianceCheck, computeReadinessScore } from "./compliance";
import { runLcCrossCheck, computeLcHash, generateCorrectionEmail } from "./lc-engine";
import { generateTwinlogPdf } from "./twinlog-pdf";
import { generateEudrPdf } from "./eudr-pdf";
import { runEudrAssessment, runCbamAssessment } from "./regulatory-assess";
import { appendTradeEvent, getTradeAuditChain, verifyAuditChain } from "./audit";
import { hashPassword, comparePasswords } from "./auth";
import { lcCheckRequestSchema, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, tokenTransactions, leadCaptureSchema, type ComplianceResult, type DocumentStatus } from "@shared/schema";
import { sendPasswordResetEmail } from "./email";
import { getLocale, t } from "./locales";
import passport from "passport";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";

function computeRegVersionHash(result: unknown): string {
  const stable = JSON.stringify(result);
  return createHash("sha256").update(stable).digest("hex");
}

/** Middleware: requires authenticated user. Returns 401 with AUTH_REQUIRED code. */
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated?.()) {
    return next();
  }
  res.status(401).json({ message: t("routes.auth_required", getLocale(req)), code: "AUTH_REQUIRED" });
}

const TOKEN_PACKS: Record<string, { price: number; tokens: number; name: string }> = {
  lc_standalone: { price: 4999, tokens: 0, name: "LC Document Check" },
  shield_single: { price: 11000, tokens: 1, name: "TapTrao Shield: Single" },
  shield_3: { price: 29900, tokens: 3, name: "TapTrao Shield: 3-Pack" },
  shield_5: { price: 47500, tokens: 5, name: "TapTrao Shield: 5-Pack" },
};

const LOOKUP_COST = 1;
const LC_STANDALONE_PRICE_CENTS = 4999;

// ── Rate limiter for API keys ──
const apiRateLimits = new Map<string, { count: number; resetAt: number }>();
const API_RATE_LIMIT = 60; // requests per minute
function checkRateLimit(apiKeyId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = apiRateLimits.get(apiKeyId);
  if (!entry || now > entry.resetAt) {
    apiRateLimits.set(apiKeyId, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }
  if (entry.count >= API_RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

// ── API key auth helper ──
async function getSessionFromApiKey(req: Request): Promise<{ sessionId: string; apiKeyId: string } | null> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer tt_live_")) return null;
  const key = auth.slice(7); // "Bearer " = 7 chars
  const record = await storage.getApiKeyByKey(key);
  if (!record || !record.isActive) return null;
  return { sessionId: record.sessionId, apiKeyId: record.id };
}

function getSessionId(req: Request, res: Response): string {
  // If user is authenticated via passport, use their stored sessionId
  if (req.isAuthenticated?.() && req.user?.sessionId) {
    const userSessionId = req.user.sessionId;
    // Sync the taptrao_session cookie to match the user's stored sessionId
    if (req.cookies?.taptrao_session !== userSessionId) {
      res.cookie("taptrao_session", userSessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
    return userSessionId;
  }

  // Fallback: anonymous session via cookie
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
  await seedPrompt6();
  await seedPrompt7();
  await seedComplianceRules();

  // ── Protected User Guide (behind login wall) ──
  app.get("/user-guide", (req, res) => {
    if (!req.isAuthenticated?.()) {
      // Redirect unauthenticated users to login page with return URL
      res.redirect("/?login=required&redirect=/user-guide");
      return;
    }
    const guidePath = path.resolve(__dirname, "protected", "user-guide.html");
    if (!fs.existsSync(guidePath)) {
      res.status(404).send("User guide not found");
      return;
    }
    res.sendFile(guidePath);
  });

  // ── Auth Routes ──

  app.post("/api/auth/register", async (req, res) => {
    try {
      const locale = getLocale(req);
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: t("routes.invalid_input", locale), errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const { email, password, displayName } = parsed.data;

      // Check if email already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ message: t("routes.account_exists", locale) });
        return;
      }

      // Get the current anonymous sessionId — this becomes the user's permanent sessionId
      const sessionId = getSessionId(req, res);

      // Check if this sessionId is already claimed by another user
      const existingBySession = await storage.getUserBySessionId(sessionId);
      if (existingBySession) {
        res.status(409).json({ message: t("routes.session_linked", locale) });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, passwordHash, sessionId, displayName });

      // Auto-login after registration
      if (!req.session) {
        console.error("No session object on req — express-session middleware may have failed");
        // Still return success since the account was created
        res.json({
          user: { id: user.id, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified },
          needsLogin: true,
        });
        return;
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Auto-login failed after registration:", err);
          // Still return success since the account was created — client will redirect to login
          res.json({
            user: { id: user.id, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified },
            needsLogin: true,
          });
          return;
        }

        // Set the taptrao_session cookie to the user's stored sessionId
        res.cookie("taptrao_session", user.sessionId, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        res.json({
          user: { id: user.id, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified },
        });
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const locale = getLocale(req);
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: t("routes.invalid_input", locale), errors: parsed.error.flatten().fieldErrors });
      return;
    }

    passport.authenticate("local", (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || t("routes.invalid_credentials", locale) });
      }

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);

        // KEY: Set the taptrao_session cookie to the user's stored sessionId
        // This gives instant access to all their data on any device
        res.cookie("taptrao_session", user.sessionId, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        res.json({
          user: { id: user.id, email: user.email, displayName: user.displayName, emailVerified: user.emailVerified },
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const locale = getLocale(req);
    req.logout((err) => {
      if (err) {
        res.status(500).json({ message: t("routes.logout_failed", locale) });
        return;
      }
      res.json({ message: t("routes.logged_out", locale) });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated?.() && req.user) {
      res.json({
        user: { id: req.user.id, email: req.user.email, displayName: req.user.displayName, emailVerified: req.user.emailVerified },
      });
    } else {
      res.json({ user: null });
    }
  });

  // ── Password Reset ──

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const locale = getLocale(req);
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: t("routes.valid_email_required", locale) });
        return;
      }

      const { email } = parsed.data;
      // Always return the same message to prevent user enumeration
      const successMsg = t("routes.password_reset_sent", locale);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        res.json({ message: successMsg });
        return;
      }

      // Rate limit: max 3 reset requests per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await storage.countRecentPasswordResetTokens(user.id, oneHourAgo);
      if (recentCount >= 3) {
        res.json({ message: successMsg });
        return;
      }

      // Generate token and store
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await storage.createPasswordResetToken(user.id, token, expiresAt);

      // Build reset URL
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

      // Send email (falls back to console log if no RESEND_API_KEY)
      await sendPasswordResetEmail(user.email, resetUrl);

      res.json({ message: successMsg });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: t("routes.something_went_wrong", locale) });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const locale = getLocale(req);
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: t("routes.invalid_input", locale), errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const { token, newPassword } = parsed.data;

      const resetToken = await storage.getValidPasswordResetToken(token);
      if (!resetToken) {
        res.status(400).json({ message: t("routes.reset_link_invalid", locale) });
        return;
      }

      const passwordHash = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, passwordHash);
      await storage.markPasswordResetTokenUsed(resetToken.id);

      res.json({ message: t("routes.password_reset_success", locale) });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: t("routes.something_went_wrong", locale) });
    }
  });

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
      const isAdmin = await storage.isAdminSession(sessionId);
      const hasPurchased = await storage.hasPurchased(sessionId);
      res.json({ balance, lcBalance, freeLookupUsed, isAdmin, hasPurchased });
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
      const locale = getLocale(req);
      const { pack } = req.body;
      if (!pack || !TOKEN_PACKS[pack]) {
        res.status(400).json({ message: t("routes.invalid_pack", locale) });
        return;
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: t("routes.stripe_not_configured", locale) });
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

  app.post("/api/tokens/lc-standalone-checkout", async (req, res) => {
    try {
      const locale = getLocale(req);
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: t("routes.stripe_not_configured", locale) });
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
      const locale = getLocale(req);
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripeKey || !webhookSecret) {
        res.status(500).json({ message: t("routes.stripe_not_configured", locale) });
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

        if (sessionId && pack === "lc_standalone") {
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
      const locale = getLocale(req);
      const stripeSessionId = req.query.session_id as string;
      if (!stripeSessionId) {
        res.status(400).json({ message: t("routes.session_id_required", locale) });
        return;
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        res.status(500).json({ message: t("routes.stripe_not_configured", locale) });
        return;
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);

      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
      if (session.payment_status === "paid") {
        const sessionId = session.metadata?.session_id;
        const pack = session.metadata?.pack;
        if (sessionId && pack === "lc_standalone") {
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

      res.json({ success: false, message: t("routes.payment_not_completed", locale) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/compliance-check", async (req, res) => {
    try {
      const locale = getLocale(req);
      const { commodityId, originId, destinationId } = req.body;
      if (!commodityId || !originId || !destinationId) {
        res.status(400).json({ message: t("routes.compliance_fields_required", locale) });
        return;
      }

      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);

      if (!isAdmin) {
        const { balance, freeLookupUsed } = await storage.getTokenBalance(sessionId);
        if (!freeLookupUsed) {
          await storage.markDemoUsed(sessionId);
        } else if (balance < LOOKUP_COST) {
          res.status(402).json({
            message: t("routes.insufficient_tokens", locale),
            required: LOOKUP_COST,
            balance,
          });
          return;
        } else {
          await storage.spendTokens(sessionId, LOOKUP_COST, `Compliance Lookup — ${commodityId}`);
        }
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
        }, sessionId);
        lookupId = saved.id;

        // Append first event in the TwinLog audit chain
        try {
          await appendTradeEvent(saved.id, sessionId, "compliance_check", {
            commodityName: result.commodity.name,
            origin: result.origin.countryName,
            destination: result.destination.countryName,
            hsCode: result.commodity.hsCode,
            riskLevel,
            readinessScore: result.readinessScore.score,
            readinessVerdict: result.readinessScore.verdict,
            integrityHash,
          });
        } catch (_auditErr) { /* audit is non-blocking */ }
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

  app.get("/api/trades/dashboard-stats", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const stats = await storage.getMyTradesStats(sessionId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades/corridors", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const corridors = await storage.getTradeCorridors(sessionId);
      res.json(corridors);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades/summary", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const summary = await storage.getTradesSummary(sessionId);
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades/pending-count", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const trades = await storage.getEnrichedTrades(sessionId);
      const pendingCount = trades.filter(
        (t) => t.tradeStatus === "pending" || t.tradeStatus === "in_progress"
      ).length;
      res.json({ count: pendingCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trade detail — unified view for /trades/:id page
  app.get("/api/trades/:id", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const detail = await storage.getTradeDetail(req.params.id, sessionId);
      if (!detail) {
        return res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
      }
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trade audit trail only
  app.get("/api/trades/:id/audit", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const lookup = await storage.getLookupById(req.params.id);
      if (!lookup || lookup.sessionId !== sessionId) {
        return res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
      }
      const auditTrail = await getTradeAuditChain(req.params.id);
      const chainResult = await verifyAuditChain(req.params.id);
      res.json({ auditTrail, ...chainResult });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trade lifecycle: advance status
  app.patch("/api/trades/:id/status", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { status } = req.body;
      const validStatuses = ["active", "in_transit", "arrived", "cleared", "closed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: t("routes.invalid_status", getLocale(req)) });
      }
      const lookup = await storage.getLookupById(req.params.id);
      if (!lookup || lookup.sessionId !== sessionId) {
        return res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
      }
      const oldStatus = (lookup as any).tradeStatus || "active";
      const updated = await storage.updateTradeStatus(req.params.id, status, sessionId);
      if (!updated) return res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
      // Audit event
      await appendTradeEvent(req.params.id, sessionId, "status_change", { from: oldStatus, to: status });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trade lifecycle: archive
  app.post("/api/trades/:id/archive", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { reason } = req.body || {};
      const updated = await storage.archiveTrade(req.params.id, sessionId);
      if (!updated) return res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
      await appendTradeEvent(req.params.id, sessionId, "trade_archived", { reason: reason || "User archived" });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Trade lifecycle: update fields (notes, ETA, arrival, trade value)
  app.patch("/api/trades/:id", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { notes, estimatedArrival, actualArrival, tradeValue, tradeValueCurrency } = req.body;
      const updated = await storage.updateTradeFields(req.params.id, { notes, estimatedArrival, actualArrival, tradeValue, tradeValueCurrency }, sessionId);
      if (!updated) return res.status(404).json({ message: t("routes.trade_not_found_no_changes", getLocale(req)) });
      // Audit events for date changes
      if (estimatedArrival) {
        await appendTradeEvent(req.params.id, sessionId, "eta_set", { date: estimatedArrival });
      }
      if (actualArrival) {
        await appendTradeEvent(req.params.id, sessionId, "arrival", { date: actualArrival });
      }
      if (tradeValue) {
        await appendTradeEvent(req.params.id, sessionId, "trade_value_set", { value: tradeValue, currency: tradeValueCurrency || "USD" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const trades = await storage.getEnrichedTrades(sessionId);
      res.json(trades);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lookups/recent", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const data = await storage.getRecentLookups(10, sessionId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lookups", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const data = await storage.getAllLookups(sessionId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lookups/:id", async (req, res) => {
    try {
      const lookup = await storage.getLookupById(req.params.id);
      if (!lookup) {
        res.status(404).json({ message: t("routes.lookup_not_found", getLocale(req)) });
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

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const stats = await storage.getDashboardStats(sessionId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-checks", async (req, res) => {
    try {
      const locale = getLocale(req);
      const parsed = lcCheckRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: t("routes.lc_invalid_request", locale), errors: parsed.error.flatten().fieldErrors });
        return;
      }

      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      const { lcFields, documents, sourceLookupId } = parsed.data;

      // ── New case-based billing logic ──
      let existingCase = sourceLookupId ? await storage.getLcCaseByLookupId(sourceLookupId) : undefined;
      let recheckNumber = 0;
      let freeRechecksRemaining = 3;

      if (!isAdmin) {
        const { balance } = await storage.getTokenBalance(sessionId);

        if (existingCase) {
          // Re-check: free if under limit, otherwise 1 trade credit
          recheckNumber = existingCase.recheckCount + 1;
          freeRechecksRemaining = Math.max(0, existingCase.maxFreeRechecks - recheckNumber);

          if (recheckNumber <= existingCase.maxFreeRechecks) {
            // FREE re-check — no charge
          } else {
            // Paid re-check: costs 1 trade credit
            if (balance < 1) {
              res.status(402).json({
                message: t("routes.lc_recheck_limit", locale, { limit: String(existingCase.maxFreeRechecks) }),
                required: 1,
                balance,
                type: "trade_pack",
              });
              return;
            }
            await storage.spendTokens(sessionId, 1, `LC re-check #${recheckNumber} for case ${existingCase.id}`);
          }
        } else {
          // New check: costs 1 trade credit
          if (balance < 1) {
            res.status(402).json({
              message: t("routes.lc_credit_required", locale),
              required: 1,
              balance,
              type: "trade_pack",
            });
            return;
          }
        }
      } // end if (!isAdmin)

      // ── Run the cross-check ──
      const { results, summary } = runLcCrossCheck(lcFields, documents, locale);
      const timestamp = new Date().toISOString();
      const integrityHash = computeLcHash(lcFields, documents, results, timestamp);
      const correction = generateCorrectionEmail(lcFields, results, locale);

      // Determine case status from verdict
      const caseStatus = summary.verdict === "COMPLIANT" || summary.verdict === "COMPLIANT_WITH_NOTES"
        ? (existingCase ? "resolved" as const : "all_clear" as const)
        : "discrepancy" as const;

      // Save the LC check
      const saved = await storage.createLcCheck({
        lcFieldsJson: lcFields,
        documentsJson: documents,
        resultsJson: results,
        summary,
        verdict: summary.verdict,
        correctionEmail: correction.email || null,
        correctionWhatsApp: correction.whatsapp || null,
        commsLog: null,
        integrityHash,
        sourceLookupId: sourceLookupId || null,
        sessionId,
        caseId: existingCase?.id || null,
      });

      // ── Case management ──
      let caseId: string | null = null;

      if (existingCase) {
        // Update existing case
        await storage.updateLcCaseLatestCheck(existingCase.id, saved.id, recheckNumber);
        await storage.updateLcCaseStatus(existingCase.id, caseStatus);
        await storage.addCheckHistoryEntry(existingCase.id, {
          checkId: saved.id,
          verdict: summary.verdict,
          createdAt: timestamp,
          recheckNumber,
          summary: `${summary.matches}/${summary.totalChecks} passed, ${summary.criticals} critical`,
        });
        caseId = existingCase.id;
        freeRechecksRemaining = Math.max(0, existingCase.maxFreeRechecks - recheckNumber);
      } else {
        // Create new case
        const newCase = await storage.createLcCase({
          sessionId,
          sourceLookupId: sourceLookupId || null,
          status: caseStatus,
          initialCheckId: saved.id,
          latestCheckId: saved.id,
          recheckCount: 0,
          maxFreeRechecks: 3,
          lcReference: lcFields.lcReference || null,
          beneficiaryName: lcFields.beneficiaryName || null,
          correctionRequests: [],
          checkHistory: [{
            checkId: saved.id,
            verdict: summary.verdict,
            createdAt: timestamp,
            recheckNumber: 0,
            summary: `${summary.matches}/${summary.totalChecks} passed, ${summary.criticals} critical`,
          }],
        });
        caseId = newCase.id;
        freeRechecksRemaining = 3;

        // Spend the trade credit for new checks (not re-checks)
        if (!isAdmin && !existingCase) {
          await storage.spendTokens(sessionId, 1, `LC check for ${lcFields.lcReference || "new LC"}`);
        }
      }

      // Audit event: append to trade's hash chain if linked to a lookup
      if (sourceLookupId) {
        try {
          if (recheckNumber > 0) {
            await appendTradeEvent(sourceLookupId, sessionId, "lc_recheck", {
              recheckNumber,
              newVerdict: summary.verdict,
              previousVerdict: existingCase ? "previous" : null,
              discrepancyCount: summary.criticals + summary.warnings,
              integrityHash,
            });
          } else {
            await appendTradeEvent(sourceLookupId, sessionId, "lc_check", {
              verdict: summary.verdict,
              discrepancyCount: summary.criticals + summary.warnings,
              matches: summary.matches,
              totalChecks: summary.totalChecks,
              integrityHash,
            });
          }
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }

      res.json({
        id: saved.id,
        results,
        summary,
        integrityHash,
        timestamp,
        correctionEmail: correction.email,
        correctionWhatsApp: correction.whatsapp,
        caseId,
        recheckNumber,
        freeRechecksRemaining,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-checks/linked-lookups", async (req, res) => {
    try {
      const { lookupIds } = req.body;
      if (!Array.isArray(lookupIds)) {
        res.status(400).json({ message: t("routes.lookupids_required", getLocale(req)) });
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
        res.status(404).json({ message: t("routes.lc_check_not_found", getLocale(req)) });
        return;
      }
      res.json(check);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── LC Cases ──

  app.get("/api/lc-cases", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const cases = await storage.getLcCasesBySession(sessionId);
      res.json(cases);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lc-cases/by-lookup/:lookupId", async (req, res) => {
    try {
      const lcCase = await storage.getLcCaseByLookupId(req.params.lookupId);
      if (!lcCase) {
        res.status(404).json({ message: t("routes.lc_case_no_lookup", getLocale(req)) });
        return;
      }
      const checkId = lcCase.latestCheckId || lcCase.initialCheckId;
      const check = checkId ? await storage.getLcCheckById(checkId) : null;
      if (!check) {
        res.status(404).json({ message: t("routes.lc_check_not_found_for_case", getLocale(req)) });
        return;
      }
      res.json({
        id: check.id,
        results: check.resultsJson,
        summary: check.summary,
        integrityHash: check.integrityHash || "",
        timestamp: check.createdAt.toISOString(),
        correctionEmail: check.correctionEmail || "",
        correctionWhatsApp: check.correctionWhatsApp || "",
        caseId: lcCase.id,
        recheckNumber: lcCase.recheckCount,
        freeRechecksRemaining: Math.max(0, lcCase.maxFreeRechecks - lcCase.recheckCount),
        caseStatus: lcCase.status,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lc-cases/:id", async (req, res) => {
    try {
      const lcCase = await storage.getLcCaseById(req.params.id);
      if (!lcCase) {
        res.status(404).json({ message: t("routes.lc_case_not_found", getLocale(req)) });
        return;
      }
      res.json(lcCase);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-cases/:id/correction-request", async (req, res) => {
    try {
      const { channel, discrepancyCount } = req.body;
      if (!channel || typeof discrepancyCount !== "number") {
        res.status(400).json({ message: t("routes.channel_discrepancy_required", getLocale(req)) });
        return;
      }
      const entry = {
        sentAt: new Date().toISOString(),
        channel: channel as "email" | "whatsapp" | "link",
        discrepancyCount,
      };
      const updated = await storage.addCorrectionRequest(req.params.id, entry);
      // Audit event for correction
      if (updated.sourceLookupId) {
        try {
          const sessionId = getSessionId(req, res);
          await appendTradeEvent(updated.sourceLookupId, sessionId, "correction_sent", {
            channel,
            discrepancyCount,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-cases/:id/park", async (req, res) => {
    try {
      const updated = await storage.parkLcCase(req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lc-cases/:id/close", async (req, res) => {
    try {
      const { reason } = req.body;
      const updated = await storage.closeLcCase(req.params.id, reason || "Closed by user");
      // Audit event for case close
      if (updated.sourceLookupId) {
        try {
          const sessionId = getSessionId(req, res);
          await appendTradeEvent(updated.sourceLookupId, sessionId, "trade_closed", {
            reason: reason || "Closed by user",
            finalStatus: updated.status,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lc-cases/:id/comparison", async (req, res) => {
    try {
      const lcCase = await storage.getLcCaseById(req.params.id);
      if (!lcCase) {
        res.status(404).json({ message: t("routes.lc_case_not_found", getLocale(req)) });
        return;
      }

      const initialCheck = lcCase.initialCheckId ? await storage.getLcCheckById(lcCase.initialCheckId) : null;
      const latestCheck = lcCase.latestCheckId && lcCase.latestCheckId !== lcCase.initialCheckId
        ? await storage.getLcCheckById(lcCase.latestCheckId)
        : null;

      res.json({
        caseId: lcCase.id,
        status: lcCase.status,
        recheckCount: lcCase.recheckCount,
        initialCheck: initialCheck ? {
          id: initialCheck.id,
          verdict: initialCheck.verdict,
          results: initialCheck.resultsJson,
          summary: initialCheck.summary,
          createdAt: initialCheck.createdAt,
        } : null,
        latestCheck: latestCheck ? {
          id: latestCheck.id,
          verdict: latestCheck.verdict,
          results: latestCheck.resultsJson,
          summary: latestCheck.summary,
          createdAt: latestCheck.createdAt,
        } : null,
        checkHistory: lcCase.checkHistory,
        correctionRequests: lcCase.correctionRequests,
      });
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
        res.status(400).json({ message: t("routes.template_fields_required", getLocale(req)) });
        return;
      }

      const existing = await storage.getTemplateByCorridorAndSession(sessionId, commodityId, originIso2, destIso2);
      if (existing) {
        res.status(409).json({ message: t("routes.template_exists", getLocale(req)), templateId: existing.id });
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
        res.status(404).json({ message: t("routes.template_not_found", getLocale(req)) });
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
        res.status(404).json({ message: t("routes.template_not_found", getLocale(req)) });
        return;
      }

      const commodity = await storage.getCommodityById(template.commodityId);
      if (!commodity) {
        res.json({ stale: true, reason: t("routes.commodity_no_longer_exists", getLocale(req)) });
        return;
      }

      const origins = await storage.getOriginCountries();
      const origin = origins.find(o => o.iso2 === template.originIso2);
      const dests = await storage.getDestinations();
      const dest = dests.find(d => d.iso2 === template.destIso2);

      if (!origin || !dest) {
        res.json({ stale: true, reason: t("routes.origin_dest_no_longer_exists", getLocale(req)) });
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
        res.status(404).json({ message: t("routes.template_not_found", getLocale(req)) });
        return;
      }
      if (template.sessionId !== sessionId) {
        res.status(403).json({ message: t("routes.not_your_template", getLocale(req)) });
        return;
      }

      const { balance, freeLookupUsed } = await storage.getTokenBalance(sessionId);
      if (freeLookupUsed && balance < LOOKUP_COST) {
        res.status(402).json({ message: t("routes.insufficient_tokens", getLocale(req)), required: LOOKUP_COST, balance });
        return;
      }

      const commodity = await storage.getCommodityById(template.commodityId);
      if (!commodity) {
        res.status(404).json({ message: t("routes.commodity_no_longer_exists", getLocale(req)) });
        return;
      }

      const origins = await storage.getOriginCountries();
      const origin = origins.find(o => o.iso2 === template.originIso2);
      const dests = await storage.getDestinations();
      const dest = dests.find(d => d.iso2 === template.destIso2);

      if (!origin || !dest) {
        res.status(404).json({ message: t("routes.origin_dest_no_longer_exists", getLocale(req)) });
        return;
      }

      if (!freeLookupUsed) {
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
      const { companyName, registeredAddress, countryIso2, vatNumber, eoriNumber, einNumber, contactEmail } = req.body;
      if (!companyName || !registeredAddress || !countryIso2) {
        res.status(400).json({ message: t("routes.company_fields_required", getLocale(req)) });
        return;
      }
      const profile = await storage.upsertCompanyProfile({
        sessionId,
        companyName,
        registeredAddress,
        countryIso2,
        vatNumber: vatNumber || null,
        eoriNumber: eoriNumber || null,
        einNumber: einNumber || null,
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
        res.status(404).json({ message: t("routes.lookup_not_found", getLocale(req)) });
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
        res.status(404).json({ message: t("routes.reference_not_found", getLocale(req)) });
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
          message: t("routes.profile_required", getLocale(req)),
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
          res.status(404).json({ message: t("routes.lookup_not_found", getLocale(req)) });
          return;
        }
        result = lookup.resultJson as ComplianceResult;
        integrityHash = lookup.integrityHash;
        lookupTimestamp = lookup.createdAt.toISOString();
        resolvedLookupId = lookup.id;
      } else if (complianceResult) {
        result = complianceResult as ComplianceResult;
      } else {
        res.status(400).json({ message: t("routes.lookupid_or_result_required", getLocale(req)) });
        return;
      }

      const docStatuses: Record<number, DocumentStatus> = documentStatuses || {};
      const year = new Date().getFullYear();
      const hashPart = integrityHash ? integrityHash.substring(0, 6).toUpperCase() : createHash("sha256").update(JSON.stringify(result) + Date.now()).digest("hex").substring(0, 6).toUpperCase();
      const reference = `TT-${year}-${hashPart}`;

      const commoditySlug = result.commodity.name.replace(/[^a-zA-Z0-9]/g, "");
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `TwinLog-Trail_${commoditySlug}_${result.origin.iso2}-${result.destination.iso2}_${dateStr}.pdf`;

      // Fetch audit trail and supplier data for the PDF
      let auditTrail: import("@shared/schema").TradeEvent[] = [];
      let supplierUploads: import("@shared/schema").SupplierUpload[] = [];
      let chainValid = true;

      if (resolvedLookupId) {
        auditTrail = await getTradeAuditChain(resolvedLookupId);
        const chainResult = await verifyAuditChain(resolvedLookupId);
        chainValid = chainResult.valid;

        const supplierReq = await storage.getSupplierRequestByLookupId(resolvedLookupId);
        if (supplierReq) {
          supplierUploads = await storage.getSupplierUploadsByRequestId(supplierReq.id);
        }
      }

      const { stream, hashPromise } = generateTwinlogPdf(
        result,
        profile,
        docStatuses,
        integrityHash,
        reference,
        lookupTimestamp,
        auditTrail,
        supplierUploads,
        chainValid,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      // Handle PDF stream errors to prevent server crash
      stream.on("error", (err: Error) => {
        console.error("PDF stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: t("routes.pdf_generation_failed", getLocale(req)) });
        }
      });
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
          // Audit event: TwinLog generated
          if (resolvedLookupId) {
            await appendTradeEvent(resolvedLookupId, sessionId, "twinlog_generated", {
              ref: reference,
              pdfHash,
            });
          }
        } catch (e) {
          console.error("TwinLog post-generation error:", e);
        }
      }).catch((e) => console.error("TwinLog hash promise error:", e));
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
        res.status(400).json({ message: t("routes.lookupid_required", getLocale(req)) });
        return;
      }

      const lookup = await storage.getLookupById(lookupId);
      if (!lookup) {
        res.status(404).json({ message: t("routes.lookup_not_found", getLocale(req)) });
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

        const docsRequired = supplierDocs.length > 0 ? supplierDocs : ["Commercial Invoice", "Certificate of Origin", "Packing List"];
        request = await storage.createSupplierRequest({
          lookupId,
          userSessionId: sessionId,
          docsRequired,
          docsReceived: [],
          uploadExpiresAt: expiresAt,
          status: "waiting",
        });

        // Audit event: supplier link created
        try {
          const uploadUrlForAudit = `/upload/${request.uploadToken}`;
          await appendTradeEvent(lookupId, sessionId, "supplier_link_created", {
            docsRequired,
            uploadUrl: uploadUrlForAudit,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
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
        res.status(400).json({ message: t("routes.channel_required", getLocale(req)) });
        return;
      }

      const request = await storage.getSupplierRequestById(id);
      if (!request) {
        res.status(404).json({ message: t("routes.supplier_request_not_found", getLocale(req)) });
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

  // ── Buyer Upload on Behalf of Supplier ──

  // Uses the same multer config defined below for public supplier uploads
  // (the `upload` const is hoisted via `var` behavior in the IIFE / function scope)

  app.post("/api/supplier-requests/:requestId/buyer-upload", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { requestId } = req.params;
      if (!requestId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
        res.status(400).json({ message: t("routes.invalid_request_id", getLocale(req)) });
        return;
      }

      const request = await storage.getSupplierRequestById(requestId);
      if (!request) {
        res.status(404).json({ message: t("routes.supplier_request_not_found", getLocale(req)) });
        return;
      }
      if (request.userSessionId !== sessionId) {
        res.status(403).json({ message: t("routes.not_authorized", getLocale(req)) });
        return;
      }

      // Use multer to handle the file upload
      const uploadDir = path.join("/tmp", "uploads");
      const buyerUpload = multer({
        storage: multer.diskStorage({
          destination: (_req, _file, cb) => {
            const dir = path.join(uploadDir, "buyer-" + requestId);
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
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

      buyerUpload.single("file")(req, res, async (err) => {
        if (err) {
          res.status(400).json({ message: err.message });
          return;
        }

        const docType = req.body?.doc_type;
        if (!docType) {
          res.status(400).json({ message: t("routes.doc_type_required", getLocale(req)) });
          return;
        }

        const docsRequired = (request.docsRequired as string[]) || [];
        if (!docsRequired.includes(docType)) {
          res.status(400).json({ message: t("routes.invalid_doc_type", getLocale(req)) });
          return;
        }

        const file = req.file;
        if (!file) {
          res.status(400).json({ message: t("routes.no_file_uploaded", getLocale(req)) });
          return;
        }

        const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        const note = req.body?.note || null;

        await storage.createSupplierUpload({
          requestId: request.id,
          docType,
          originalFilename: safeFilename,
          fileKey: file.path,
          filesizeBytes: file.size,
          mimeType: file.mimetype,
          uploadedBy: "buyer",
        });

        // Update docsReceived and status
        const currentReceived = (request.docsReceived as string[]) || [];
        const newReceived = currentReceived.includes(docType)
          ? currentReceived
          : [...currentReceived, docType];

        const uploads = await storage.getSupplierUploadsByRequestId(request.id);
        const hasBlocking = uploads.some((u) => u.verified === false && u.finding);
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

        // Audit event
        if (request.lookupId) {
          try {
            const fileHash = createHash("sha256").update(file.buffer || file.path).digest("hex");
            await appendTradeEvent(request.lookupId, sessionId, "buyer_doc_uploaded", {
              docType,
              filename: safeFilename,
              fileHash: fileHash.slice(0, 16),
              filesizeBytes: file.size,
              note: note || undefined,
            });
          } catch (auditErr) {
            console.error("Audit event failed (non-fatal):", auditErr);
          }
        }

        res.json({ success: true, filename: safeFilename, doc_type: docType });
      });
    } catch (error: any) {
      console.error("Buyer upload error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ── Manual Document Verification (Buyer) ──

  app.patch("/api/supplier-uploads/:id/verify", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { id } = req.params;
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        res.status(400).json({ message: t("routes.invalid_upload_id", getLocale(req)) });
        return;
      }

      const upload = await storage.getSupplierUploadById(id);
      if (!upload || !upload.requestId) {
        res.status(404).json({ message: t("routes.upload_not_found", getLocale(req)) });
        return;
      }

      // Verify ownership: the supplier request must belong to this session
      const request = await storage.getSupplierRequestById(upload.requestId);
      if (!request || request.userSessionId !== sessionId) {
        res.status(403).json({ message: t("routes.not_authorized", getLocale(req)) });
        return;
      }

      const { verified, finding, ucpRule } = req.body;
      if (typeof verified !== "boolean") {
        res.status(400).json({ message: t("routes.verified_required", getLocale(req)) });
        return;
      }

      const updated = await storage.updateSupplierUploadVerification(id, {
        verified,
        finding: finding || null,
        ucpRule: ucpRule || null,
      });

      // Audit event
      if (request.lookupId) {
        try {
          await appendTradeEvent(request.lookupId, sessionId, verified ? "doc_verified" : "doc_flagged", {
            docType: upload.docType,
            filename: upload.originalFilename,
            verified,
            finding: finding || undefined,
            ucpRule: ucpRule || undefined,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }

      // Re-evaluate supplier request status after verification change
      const uploads = await storage.getSupplierUploadsByRequestId(request.id);
      const docsRequired = (request.docsRequired as string[]) || [];
      const docsReceived = (request.docsReceived as string[]) || [];
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

      res.json({ success: true, upload: updated });
    } catch (error: any) {
      console.error("Verify upload error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ── AI Document Scan ──

  app.post("/api/supplier-uploads/:id/scan", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { id } = req.params;
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        res.status(400).json({ message: t("routes.invalid_upload_id", getLocale(req)) });
        return;
      }

      const upload = await storage.getSupplierUploadById(id);
      if (!upload || !upload.requestId) {
        res.status(404).json({ message: t("routes.upload_not_found", getLocale(req)) });
        return;
      }

      const request = await storage.getSupplierRequestById(upload.requestId);
      if (!request || request.userSessionId !== sessionId) {
        res.status(403).json({ message: t("routes.not_authorized", getLocale(req)) });
        return;
      }

      // Get lookup data for compliance context
      const lookup = request.lookupId ? await storage.getLookupById(request.lookupId) : null;

      // Get LC check data if available
      let lcCheckData: any = null;
      if (lookup) {
        const lcCheckMap = await storage.getLcChecksByLookupIds([lookup.id]);
        const lcCheckId = lcCheckMap[lookup.id];
        if (lcCheckId) {
          lcCheckData = await storage.getLcCheckById(lcCheckId);
        }
      }

      // Read the file to analyze
      const filePath = upload.fileKey;
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ message: t("routes.file_not_found_on_disk", getLocale(req)) });
        return;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const base64Content = fileBuffer.toString("base64");
      const mimeType = upload.mimeType || "application/pdf";

      // Build context for the AI scan
      const complianceContext = lookup?.resultJson
        ? JSON.stringify(lookup.resultJson, null, 2).slice(0, 3000)
        : "No compliance data available";

      const lcContext = lcCheckData?.resultJson
        ? JSON.stringify(lcCheckData.resultJson, null, 2).slice(0, 3000)
        : "No LC check data available";

      // Call Anthropic API to analyze the document
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      if (!ANTHROPIC_API_KEY) {
        res.status(503).json({ message: t("routes.ai_not_configured", getLocale(req)), code: "AI_NOT_CONFIGURED" });
        return;
      }

      const systemPrompt = `You are a trade compliance document reviewer for TapTrao, a commodity trade compliance platform. Your job is to review uploaded supplier documents and check them against trade compliance requirements and LC (Letter of Credit) terms.

Document type being reviewed: ${upload.docType}
Document filename: ${upload.originalFilename}

Trade compliance context:
${complianceContext}

LC check context:
${lcContext}

Analyze this document and respond with a JSON object (no markdown, just raw JSON):
{
  "verified": true/false,
  "finding": "Brief description of any issues found, or null if document looks correct",
  "ucpRule": "Relevant UCP 600 rule reference if applicable, or null",
  "confidence": "high" | "medium" | "low",
  "details": "Detailed analysis of the document (2-3 sentences max)"
}

Rules:
- Set verified=true if the document appears complete, correctly formatted, and consistent with the trade details
- Set verified=false if there are discrepancies, missing information, or formatting issues
- For finding: be specific and actionable (e.g. "Invoice total $12,500 does not match LC amount $12,000")
- For ucpRule: cite specific UCP 600 articles when relevant (e.g. "UCP 600 Art. 18(a)(iii)")
- Only output the JSON object, nothing else`;

      const messageBody: any = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            {
              type: mimeType.startsWith("image/") ? "image" : "document",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Content,
              },
            },
            {
              type: "text",
              text: `Review this ${upload.docType} document for trade compliance. Check for completeness, accuracy, and consistency with the trade details provided in the system context.`,
            },
          ],
        }],
        system: systemPrompt,
      };

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(messageBody),
      });

      if (!anthropicRes.ok) {
        const errorText = await anthropicRes.text();
        console.error("Anthropic API error:", anthropicRes.status, errorText);
        res.status(502).json({ message: t("routes.ai_scan_failed", getLocale(req)) });
        return;
      }

      const anthropicData = await anthropicRes.json() as any;
      const responseText = anthropicData.content?.[0]?.text || "";

      // Parse the JSON response
      let scanResult: { verified: boolean; finding: string | null; ucpRule: string | null; confidence: string; details: string };
      try {
        // Try to extract JSON from the response (handle possible markdown wrapping)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");
        scanResult = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error("Failed to parse AI response:", responseText);
        res.status(502).json({ message: t("routes.ai_scan_unparseable", getLocale(req)) });
        return;
      }

      // Update the upload record with scan results
      const updated = await storage.updateSupplierUploadVerification(id, {
        verified: scanResult.verified,
        finding: scanResult.finding,
        ucpRule: scanResult.ucpRule,
      });

      // Audit event
      if (request.lookupId) {
        try {
          await appendTradeEvent(request.lookupId, sessionId, "doc_ai_scanned", {
            docType: upload.docType,
            filename: upload.originalFilename,
            verified: scanResult.verified,
            finding: scanResult.finding || undefined,
            ucpRule: scanResult.ucpRule || undefined,
            confidence: scanResult.confidence,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }

      // Re-evaluate supplier request status
      const allUploads = await storage.getSupplierUploadsByRequestId(request.id);
      const docsRequired = (request.docsRequired as string[]) || [];
      const docsReceived = (request.docsReceived as string[]) || [];
      const hasBlocking = allUploads.some(u => u.verified === false && u.finding);
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

      res.json({
        success: true,
        scan: {
          verified: scanResult.verified,
          finding: scanResult.finding,
          ucpRule: scanResult.ucpRule,
          confidence: scanResult.confidence,
          details: scanResult.details,
        },
        upload: updated,
      });
    } catch (error: any) {
      console.error("AI scan error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ── Public Supplier Upload ──

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  app.get("/api/upload/:token/data", async (req, res) => {
    try {
      const { token } = req.params;
      if (!UUID_REGEX.test(token)) {
        res.status(404).json({ message: t("routes.upload_link_not_found", getLocale(req)) });
        return;
      }
      const request = await storage.getSupplierRequestByToken(token);
      if (!request) {
        res.status(404).json({ message: t("routes.upload_link_not_found", getLocale(req)) });
        return;
      }
      if (new Date(request.uploadExpiresAt) < new Date()) {
        res.status(410).json({ message: t("routes.upload_link_expired", getLocale(req)) });
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
        const tokenDir = path.join(uploadDir, (req.params.token as string) || "unknown");
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
      const token = req.params.token as string;
      if (!UUID_REGEX.test(token)) {
        res.status(404).json({ message: t("routes.upload_link_not_found", getLocale(req)) });
        return;
      }
      const request = await storage.getSupplierRequestByToken(token);
      if (!request) {
        res.status(404).json({ message: t("routes.upload_link_not_found", getLocale(req)) });
        return;
      }
      if (new Date(request.uploadExpiresAt) < new Date()) {
        res.status(410).json({ message: t("routes.upload_link_expired", getLocale(req)) });
        return;
      }

      const docType = req.body?.doc_type;
      if (!docType) {
        res.status(400).json({ message: t("routes.doc_type_required", getLocale(req)) });
        return;
      }

      const docsRequired = (request.docsRequired as string[]) || [];
      if (!docsRequired.includes(docType)) {
        res.status(400).json({ message: t("routes.invalid_doc_type", getLocale(req)) });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ message: t("routes.no_file_uploaded", getLocale(req)) });
        return;
      }

      const safeFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);

      const supplierUpload = await storage.createSupplierUpload({
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

      // Audit event: supplier doc uploaded
      if (request.lookupId) {
        try {
          const fileHash = createHash("sha256").update(file.buffer || file.path).digest("hex");
          await appendTradeEvent(request.lookupId, request.userSessionId, "supplier_doc_uploaded", {
            docType,
            filename: safeFilename,
            fileHash: fileHash.slice(0, 16),
            filesizeBytes: file.size,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }

      // Phase 4: Auto-validate supplier upload against compliance requirements
      if (request.lookupId) {
        try {
          const lookup = await storage.getLookupById(request.lookupId);
          if (lookup) {
            const result = lookup.resultJson as any;
            const requirements = result?.requirementsDetailed ?? [];

            // Match docType (title) to a requirement index
            const reqIndex = requirements.findIndex(
              (r: any) => r.title?.toLowerCase() === docType.toLowerCase()
            );

            if (reqIndex >= 0) {
              const requirement = requirements[reqIndex];

              // Compute file hash
              const { computeFileSha256 } = await import("./file-extract");
              const fileSha256 = await computeFileSha256(file.path);

              // Check idempotency — don't create duplicate validations
              const existing = await storage.findExistingValidation(
                request.lookupId, reqIndex, fileSha256
              );

              if (!existing) {
                // Get validationSpec from compliance rules
                const { complianceRules } = await import("@shared/schema");
                const allRules = await db.select().from(complianceRules);
                const matchingRule = requirement.documentCode
                  ? allRules.find((r: any) => r.documentCode === requirement.documentCode)
                  : null;
                const validationSpec = matchingRule?.validationSpec ?? null;

                // Create document_validations row
                const validation = await storage.createDocumentValidation({
                  lookupId: request.lookupId,
                  sessionId: request.userSessionId,
                  requirementIndex: reqIndex,
                  requirementTitle: requirement.title,
                  requirementDocumentCode: requirement.documentCode ?? null,
                  requirementTemplateVersion: matchingRule?.ruleKey ?? null,
                  originalFilename: safeFilename,
                  fileKey: file.path,
                  filesizeBytes: file.size,
                  mimeType: file.mimetype,
                  fileSha256,
                  processingStatus: "pending",
                  uploadSource: "supplier",
                  supplierUploadId: supplierUpload.id,
                });

                // Process asynchronously (fire and forget)
                processValidationAsync(
                  validation.id, file.path, file.mimetype,
                  requirement, validationSpec,
                  {
                    commodityName: lookup.commodityName,
                    hsCode: lookup.hsCode,
                    originCountry: lookup.originName,
                    originIso2: result?.origin?.iso2 ?? "",
                    destinationName: lookup.destinationName,
                    destinationIso2: result?.destination?.iso2 ?? "",
                  },
                  supplierUpload.id,
                ).catch((err) => {
                  console.error(`Supplier doc validation failed for ${validation.id}:`, err);
                });
              }
            }
          }
        } catch (valErr) {
          // Non-fatal: supplier upload succeeds even if validation setup fails
          console.error("Auto-validation for supplier upload failed (non-fatal):", valErr);
        }
      }

      res.json({ success: true, filename: file.originalname, doc_type: docType });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/upload/:token/submit", async (req, res) => {
    try {
      const { token } = req.params;
      if (!UUID_REGEX.test(token)) {
        res.status(404).json({ message: t("routes.upload_link_not_found", getLocale(req)) });
        return;
      }
      const request = await storage.getSupplierRequestByToken(token);
      if (!request) {
        res.status(404).json({ message: t("routes.upload_link_not_found", getLocale(req)) });
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

      // Audit event: supplier submission complete
      if (status === "complete" && request.lookupId) {
        try {
          await appendTradeEvent(request.lookupId, request.userSessionId, "supplier_complete", {
            docsReceived,
            totalUploads: uploads.length,
          });
        } catch (auditErr) {
          console.error("Audit event failed (non-fatal):", auditErr);
        }
      }
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
        res.status(404).json({ message: t("routes.template_not_found_or_not_yours", getLocale(req)) });
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
        res.status(400).json({ message: t("routes.alert_fields_required", getLocale(req)) });
        return;
      }
      const count = await storage.getAlertSubscriptionCount(sessionId);
      if (count >= 3) {
        res.status(403).json({ message: t("routes.alert_free_limit", getLocale(req)), count });
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

  // ── LC Document Auto-Extraction ──

  const extractUploadDir = path.join("/tmp", "uploads", "lc-extract");
  const extractUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(extractUploadDir, { recursive: true });
        cb(null, extractUploadDir);
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

  // Rate limiter for extraction — max 20 per session per hour
  const extractRateLimits = new Map<string, { count: number; resetAt: number }>();

  app.post("/api/lc-extract", extractUpload.single("file"), async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);

      // Rate limit check
      const now = Date.now();
      const rateEntry = extractRateLimits.get(sessionId);
      if (rateEntry && now < rateEntry.resetAt) {
        if (rateEntry.count >= 20) {
          res.status(429).json({ error: t("routes.rate_limit_extract", getLocale(req)) });
          return;
        }
        rateEntry.count++;
      } else {
        extractRateLimits.set(sessionId, { count: 1, resetAt: now + 3600_000 });
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: t("routes.no_file_uploaded", getLocale(req)) });
        return;
      }

      const documentType = (req.body?.documentType as string) || "lc_terms";

      // Dynamically import the extraction module
      const { extractFromPdf, extractFromPdfWithAutoDetect, cleanupTempFile, ALL_DOC_TYPES } = await import("./lc-extract");

      const validTypes = [...ALL_DOC_TYPES, "auto"];
      if (!validTypes.includes(documentType)) {
        // Clean up temp file
        try { fs.unlinkSync(file.path); } catch {}
        res.status(400).json({ error: t("routes.invalid_document_type", getLocale(req)) });
        return;
      }

      let result: any;
      let finalDocType = documentType;

      if (documentType === "auto") {
        // Auto-detect: classify + extract in a single Claude call
        const autoResult = await extractFromPdfWithAutoDetect(file.path);
        finalDocType = autoResult.detectedDocumentType;
        result = autoResult;
      } else {
        // Explicit type: use the existing extraction path
        result = await extractFromPdf(file.path, documentType);
      }

      // Clean up temp file
      cleanupTempFile(file.path);

      // Save audit log
      try {
        await storage.createDocumentExtraction({
          sessionId,
          documentType: finalDocType,
          originalFilename: file.originalname,
          extractedText: result.rawText?.substring(0, 10000) || null,
          extractionJson: result.fields ? { fields: result.fields, overallConfidence: result.overallConfidence, warnings: result.warnings } : null,
          overallConfidence: result.overallConfidence,
          llmModel: "claude-sonnet-4-20250514",
          processingTimeMs: result.processingTimeMs,
        });
      } catch (auditErr: any) {
        console.error("Failed to save extraction audit log:", auditErr.message);
        // Non-fatal — continue returning the result
      }

      res.json({
        documentType: finalDocType,
        fields: result.fields,
        overallConfidence: result.overallConfidence,
        warnings: result.warnings,
        rawText: result.rawText ? result.rawText.substring(0, 500) : null,
        error: result.error,
        processingTimeMs: result.processingTimeMs,
        ...(documentType === "auto" ? {
          classificationConfidence: result.classificationConfidence,
        } : {}),
      });
    } catch (error: any) {
      console.error("LC extraction endpoint error:", error.message);
      // Clean up temp file on error
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      res.status(500).json({ error: `Extraction failed: ${error.message?.substring(0, 100)}` });
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
        res.status(400).json({ message: t("routes.lookupid_required", getLocale(req)) });
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
      // Audit event: EUDR created
      try {
        await appendTradeEvent(lookupId, sessionId, "eudr_created", {
          eudrRecordId: record.id,
          commodityId,
          originIso2,
          destIso2,
        });
      } catch (auditErr) {
        console.error("Audit event failed (non-fatal):", auditErr);
      }
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
        res.status(404).json({ message: t("routes.eudr_not_found", getLocale(req)) });
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
        res.status(404).json({ message: t("routes.eudr_not_found", getLocale(req)) });
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

      stream.on("error", (err: Error) => {
        console.error("EUDR PDF stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: t("routes.pdf_generation_failed", getLocale(req)) });
        }
      });
      stream.pipe(res);

      hashPromise.then(async (pdfHash) => {
        try {
          await storage.updateEudrRecord(eudrRecord!.id, {
            statementPdfKey: pdfHash,
          });
        } catch (e) {
          console.error("EUDR post-generation error:", e);
        }
      }).catch((e) => console.error("EUDR hash promise error:", e));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── EUDR Assessment (risk scoring) ──

  app.post("/api/eudr/:lookupId/assess", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { lookupId } = req.params;

      // 1. Verify ownership
      const lookup = await storage.getLookupById(lookupId);
      if (!lookup || lookup.sessionId !== sessionId) {
        res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
        return;
      }

      // 2. Get commodity trigger info
      const commodity = lookup.commodityId ? await storage.getCommodityById(lookup.commodityId) : null;
      const destination = lookup.destinationId ? await storage.getDestinationById(lookup.destinationId) : null;
      const destIso2 = destination?.iso2 || "";

      // 3. Get EUDR record
      const eudrRecord = await storage.getEudrRecordByLookupId(lookupId) || null;

      // 4. Get latest LC check cross-check results
      const lcCase = await storage.getLcCaseByLookupId?.(lookupId);
      let latestLcCheck = null;
      if (lcCase?.latestCheckId) {
        latestLcCheck = await storage.getLcCheckById(lcCase.latestCheckId);
      }
      const crossCheckResults = (latestLcCheck?.resultsJson as any[]) || [];

      // 5. Run the assessment engine
      const result = runEudrAssessment({
        lookup,
        eudrRecord,
        lcCheck: latestLcCheck || null,
        crossCheckResults,
        commodityTriggersEudr: commodity?.triggersEudr ?? false,
        destinationIso2: destIso2,
      });

      // 6. Upsert to eudr_assessments
      const assessment = await storage.createOrUpdateEudrAssessment({
        lookupId,
        applicable: result.applicable,
        score: result.score,
        band: result.band,
        canConcludeNegligibleRisk: result.canConcludeNegligibleRisk,
        breakdown: result.breakdown,
        topDrivers: result.topDrivers,
        checksRun: result.checksRun,
      });

      // 7. Audit event
      await appendTradeEvent(lookupId, sessionId, "eudr_assessed", {
        score: result.score,
        band: result.band,
        applicable: result.applicable,
        canConcludeNegligibleRisk: result.canConcludeNegligibleRisk,
      });

      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── CBAM CRUD + Assessment ──

  app.get("/api/cbam/:lookupId", async (req, res) => {
    try {
      const record = await storage.getCbamRecordByLookupId(req.params.lookupId);
      res.json(record || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cbam", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { lookupId } = req.body;
      if (!lookupId) {
        res.status(400).json({ message: t("routes.lookupid_required", getLocale(req)) });
        return;
      }
      const existing = await storage.getCbamRecordByLookupId(lookupId);
      if (existing) {
        res.json(existing);
        return;
      }
      const record = await storage.createCbamRecord({
        lookupId,
        userSessionId: sessionId,
        status: "draft",
      });

      // Audit event
      await appendTradeEvent(lookupId, sessionId, "cbam_created", {
        cbamRecordId: record.id,
      });

      res.json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/cbam/:id", async (req, res) => {
    try {
      const updated = await storage.updateCbamRecord(req.params.id, req.body);
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ message: t("routes.cbam_not_found", getLocale(req)) });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/cbam/:lookupId/assess", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { lookupId } = req.params;

      // 1. Verify ownership
      const lookup = await storage.getLookupById(lookupId);
      if (!lookup || lookup.sessionId !== sessionId) {
        res.status(404).json({ message: t("routes.trade_not_found", getLocale(req)) });
        return;
      }

      // 2. Get commodity trigger info
      const commodity = lookup.commodityId ? await storage.getCommodityById(lookup.commodityId) : null;
      const destination = lookup.destinationId ? await storage.getDestinationById(lookup.destinationId) : null;
      const destIso2 = destination?.iso2 || "";

      // 3. Get CBAM record
      const cbamRecord = await storage.getCbamRecordByLookupId(lookupId) || null;

      // 4. Get latest LC check cross-check results
      const lcCase = await storage.getLcCaseByLookupId?.(lookupId);
      let latestLcCheck = null;
      if (lcCase?.latestCheckId) {
        latestLcCheck = await storage.getLcCheckById(lcCase.latestCheckId);
      }
      const crossCheckResults = (latestLcCheck?.resultsJson as any[]) || [];

      // 5. Run the assessment engine
      const result = runCbamAssessment({
        lookup,
        cbamRecord,
        lcCheck: latestLcCheck || null,
        crossCheckResults,
        commodityTriggersCbam: commodity?.triggersCbam ?? false,
        destinationIso2: destIso2,
      });

      // 6. Upsert to cbam_assessments
      const assessment = await storage.createOrUpdateCbamAssessment({
        lookupId,
        applicable: result.applicable,
        score: result.score,
        band: result.band,
        canConcludeCbamCompliant: result.canConcludeCbamCompliant,
        breakdown: result.breakdown,
        topDrivers: result.topDrivers,
        checksRun: result.checksRun,
      });

      // 7. Audit event
      await appendTradeEvent(lookupId, sessionId, "cbam_assessed", {
        score: result.score,
        band: result.band,
        applicable: result.applicable,
        canConcludeCbamCompliant: result.canConcludeCbamCompliant,
      });

      res.json(assessment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Admin Login ──
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPw = process.env.ADMIN_PASSWORD;
      if (!adminPw || password !== adminPw) {
        res.status(401).json({ message: t("routes.invalid_admin_password", getLocale(req)) });
        return;
      }
      const sessionId = getSessionId(req, res);
      await storage.setAdminFlag(sessionId, true);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/status", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      res.json({ isAdmin });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Promo Codes (admin) ──
  app.post("/api/admin/promo-codes", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) { res.status(401).json({ message: t("routes.unauthorized", getLocale(req)) }); return; }

      const { code, tradeTokens, lcCredits, maxRedemptions, expiresAt } = req.body;
      if (!code) { res.status(400).json({ message: t("routes.code_required", getLocale(req)) }); return; }

      const existing = await storage.getPromoCodeByCode(code);
      if (existing) { res.status(409).json({ message: t("routes.code_already_exists", getLocale(req)) }); return; }

      const promoCode = await storage.createPromoCode({
        code: code.toUpperCase().trim(),
        tradeTokens: tradeTokens || 0,
        lcCredits: lcCredits || 0,
        maxRedemptions: maxRedemptions || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      });
      res.json({ success: true, promoCode });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/promo-codes", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) { res.status(401).json({ message: t("routes.unauthorized", getLocale(req)) }); return; }
      const codes = await storage.getPromoCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Promo Code Redemption (user) ──
  app.post("/api/promo/redeem", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { code } = req.body;
      if (!code || typeof code !== "string") { res.status(400).json({ message: t("routes.code_required", getLocale(req)) }); return; }

      const promoCode = await storage.getPromoCodeByCode(code);
      if (!promoCode) { res.status(404).json({ message: t("routes.invalid_promo_code", getLocale(req)) }); return; }
      if (!promoCode.isActive) { res.status(400).json({ message: t("routes.promo_inactive", getLocale(req)) }); return; }
      if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) { res.status(400).json({ message: t("routes.promo_expired", getLocale(req)) }); return; }

      const result = await storage.redeemPromoCode(promoCode.id, sessionId, promoCode.tradeTokens, promoCode.lcCredits, promoCode.code);
      if (!result.success) { res.status(400).json({ message: result.message }); return; }

      const { balance, lcBalance } = await storage.getTokenBalance(sessionId);
      res.json({ success: true, message: result.message, tradeTokensGranted: promoCode.tradeTokens, lcCreditsGranted: promoCode.lcCredits, balance, lcBalance });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/alerts", async (req, res) => {
    try {
      const { admin_password, source, hs_codes_affected, dest_iso2_affected, summary, source_url, effective_date } = req.body;
      const adminPw = process.env.ADMIN_PASSWORD;
      if (!adminPw || admin_password !== adminPw) {
        res.status(401).json({ message: t("routes.unauthorized", getLocale(req)) });
        return;
      }
      if (!summary) {
        res.status(400).json({ message: t("routes.summary_required", getLocale(req)) });
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
          res.status(400).json({ message: "baseRate and chargeableDays (numbers) are required" }); // test-only: not translated
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

  // ═══════════════════════════════════════════════════
  // ═══ PUBLIC REST API v1 (API key authentication) ═══
  // ═══════════════════════════════════════════════════

  // Middleware helper for v1 endpoints requiring auth
  async function requireApiKey(req: Request, res: Response): Promise<string | null> {
    const apiAuth = await getSessionFromApiKey(req);
    if (!apiAuth) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: t("routes.api_unauthorized", getLocale(req)) } });
      return null;
    }
    const rateCheck = checkRateLimit(apiAuth.apiKeyId);
    if (!rateCheck.allowed) {
      res.status(429).set("Retry-After", String(rateCheck.retryAfter)).json({ success: false, error: { code: "RATE_LIMITED", message: t("routes.api_rate_limited", getLocale(req), { retryAfter: rateCheck.retryAfter! }) } });
      return null;
    }
    // Touch last used (fire-and-forget)
    storage.touchApiKey(apiAuth.apiKeyId).catch(() => {});
    return apiAuth.sessionId;
  }

  // ── Reference data (no auth required) ──

  app.get("/api/v1/commodities", async (_req, res) => {
    try {
      const data = await storage.getCommodities();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  app.get("/api/v1/origins", async (_req, res) => {
    try {
      const data = await storage.getOriginCountries();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  app.get("/api/v1/destinations", async (_req, res) => {
    try {
      const data = await storage.getDestinations();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  // ── Compliance check (API key required, costs 1 credit) ──

  app.post("/api/v1/compliance-check", async (req, res) => {
    const sessionId = await requireApiKey(req, res);
    if (!sessionId) return;
    try {
      const { commodityId, originId, destinationId } = req.body;
      if (!commodityId || !originId || !destinationId) {
        res.status(400).json({ success: false, error: { code: "INVALID_REQUEST", message: t("routes.api_fields_required", getLocale(req)) } });
        return;
      }

      // Token gating (same as web app)
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) {
        const { balance } = await storage.getTokenBalance(sessionId);
        if (balance < LOOKUP_COST) {
          res.status(402).json({ success: false, error: { code: "INSUFFICIENT_CREDITS", message: t("routes.api_insufficient_credits", getLocale(req)), required: LOOKUP_COST, balance } });
          return;
        }
        await storage.spendTokens(sessionId, LOOKUP_COST, `API Compliance Lookup — ${commodityId}`);
      }

      const result = await runComplianceCheck(commodityId, originId, destinationId);
      const triggers = result.triggers;
      const hasStop = result.stopFlags && Object.keys(result.stopFlags).length > 0;
      const hasRed = triggers.kimberley || triggers.conflict || triggers.cites;
      const hasAmber = triggers.eudr || triggers.cbam || triggers.iuu || triggers.csddd;
      const riskLevel = hasStop ? "STOP" : hasRed ? "HIGH" : hasAmber ? "MEDIUM" : "LOW";
      const integrityHash = createHash("sha256").update(JSON.stringify(result) + new Date().toISOString()).digest("hex");

      let lookupId: string | null = null;
      try {
        const saved = await storage.createLookup({
          commodityId, originId, destinationId,
          commodityName: result.commodity.name,
          originName: result.origin.countryName,
          destinationName: result.destination.countryName,
          hsCode: result.commodity.hsCode,
          riskLevel, resultJson: result, integrityHash,
          readinessScore: result.readinessScore.score,
          readinessVerdict: result.readinessScore.verdict,
          readinessFactors: result.readinessScore.factors,
          readinessSummary: result.readinessScore.summary,
        });
        lookupId = saved.id;
      } catch (_e) {}

      const { balance: creditsRemaining } = await storage.getTokenBalance(sessionId);
      res.json({ success: true, data: { ...result, lookupId, integrityHash, riskLevel }, meta: { creditsRemaining } });
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("not found")) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: msg } });
      } else {
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: msg } });
      }
    }
  });

  // ── LC check (API key required, costs 1 credit) ──

  app.post("/api/v1/lc-check", async (req, res) => {
    const sessionId = await requireApiKey(req, res);
    if (!sessionId) return;
    try {
      const parsed = lcCheckRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: "INVALID_REQUEST", message: t("routes.lc_invalid_request", getLocale(req)), details: parsed.error.flatten().fieldErrors } });
        return;
      }
      const { lcFields, documents, sourceLookupId } = parsed.data;

      // Token gating
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) {
        const { balance } = await storage.getTokenBalance(sessionId);
        if (balance < 1) {
          res.status(402).json({ success: false, error: { code: "INSUFFICIENT_CREDITS", message: t("routes.api_insufficient_credits", getLocale(req)), required: 1, balance } });
          return;
        }
        await storage.spendTokens(sessionId, 1, "API LC Check");
      }

      const { results, summary } = runLcCrossCheck(lcFields, documents, getLocale(req));
      const timestamp = new Date().toISOString();
      const integrityHash = computeLcHash(lcFields, documents, results, timestamp);
      const correction = generateCorrectionEmail(lcFields, results, getLocale(req));

      const saved = await storage.createLcCheck({
        lcFieldsJson: lcFields, documentsJson: documents,
        resultsJson: results, summary, verdict: summary.verdict,
        correctionEmail: correction.email || null, commsLog: null,
        integrityHash, sourceLookupId: sourceLookupId || null, sessionId,
      });

      const { balance: creditsRemaining } = await storage.getTokenBalance(sessionId);
      res.json({
        success: true,
        data: { id: saved.id, results, summary, integrityHash, timestamp, correctionEmail: correction.email, correctionWhatsApp: correction.whatsapp },
        meta: { creditsRemaining },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  // ── Lookups retrieval (API key required) ──

  app.get("/api/v1/lookups", async (req, res) => {
    const sessionId = await requireApiKey(req, res);
    if (!sessionId) return;
    try {
      const data = await storage.getAllLookups(sessionId);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  app.get("/api/v1/lookups/:id", async (req, res) => {
    const sessionId = await requireApiKey(req, res);
    if (!sessionId) return;
    try {
      const lookup = await storage.getLookupById(req.params.id);
      if (!lookup) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: t("routes.lookup_not_found", getLocale(req)) } });
        return;
      }
      res.json({ success: true, data: lookup });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  app.get("/api/v1/lc-checks/:id", async (req, res) => {
    const sessionId = await requireApiKey(req, res);
    if (!sessionId) return;
    try {
      const check = await storage.getLcCheckById(req.params.id);
      if (!check) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: t("routes.lc_check_not_found", getLocale(req)) } });
        return;
      }
      res.json({ success: true, data: check });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  // ── Account balance (API key required) ──

  app.get("/api/v1/balance", async (req, res) => {
    const sessionId = await requireApiKey(req, res);
    if (!sessionId) return;
    try {
      const { balance, lcBalance, freeLookupUsed } = await storage.getTokenBalance(sessionId);
      res.json({ success: true, data: { balance, lcBalance, freeLookupUsed } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
    }
  });

  // ═══ Admin API Key Management ═══

  app.post("/api/admin/api-keys", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) { res.status(401).json({ message: t("routes.unauthorized", getLocale(req)) }); return; }
      const { name } = req.body;
      if (!name) { res.status(400).json({ message: t("routes.api_key_name_required", getLocale(req)) }); return; }
      const apiKey = await storage.createApiKey(sessionId, name);
      res.json(apiKey);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/api-keys", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) { res.status(401).json({ message: t("routes.unauthorized", getLocale(req)) }); return; }
      const keys = await storage.getApiKeysBySession(sessionId);
      res.json(keys);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/api-keys/:id/deactivate", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) { res.status(401).json({ message: t("routes.unauthorized", getLocale(req)) }); return; }
      const ok = await storage.deactivateApiKey(req.params.id, sessionId);
      if (!ok) { res.status(404).json({ message: t("routes.api_key_not_found", getLocale(req)) }); return; }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /* ── Feature Requests ── */
  app.post("/api/feature-requests", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const hasPurchased = await storage.hasPurchased(sessionId);
      if (!hasPurchased) {
        return res.status(403).json({ message: t("routes.feature_paying_only", getLocale(req)) });
      }
      const { title, description } = req.body;
      if (!title || typeof title !== "string" || title.trim().length < 3) {
        return res.status(400).json({ message: t("routes.feature_title_min", getLocale(req)) });
      }
      const request = await storage.createFeatureRequest(sessionId, title.trim(), description?.trim());
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/feature-requests/mine", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const requests = await storage.getFeatureRequestsBySession(sessionId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/feature-requests", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) return res.status(403).json({ message: t("routes.admin_only", getLocale(req)) });
      const requests = await storage.getFeatureRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/feature-requests/:id", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) return res.status(403).json({ message: t("routes.admin_only", getLocale(req)) });
      const { status, adminNote } = req.body;
      const updated = await storage.updateFeatureRequestStatus(req.params.id, status, adminNote);
      if (!updated) return res.status(404).json({ message: t("routes.not_found", getLocale(req)) });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ═══ UTM Tracking ═══
  app.post("/api/session/utm", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const { utm_source, utm_medium, utm_campaign, utm_content, utm_term } = req.body || {};
      if (utm_source || utm_medium || utm_campaign) {
        await storage.setUtmParams(sessionId, { utm_source, utm_medium, utm_campaign, utm_content, utm_term });
      }
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ═══ Lead Capture ═══
  app.post("/api/leads", async (req, res) => {
    try {
      const parsed = leadCaptureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: t("routes.invalid_input", getLocale(req)), errors: parsed.error.flatten().fieldErrors });
      }
      const sessionId = getSessionId(req, res);
      const { email, companyName, source, lookupId, commodityName, corridorDescription } = parsed.data;

      // Deduplicate: don't create duplicate leads for same email+session
      const existing = await storage.getLeadByEmailAndSession(email, sessionId);
      if (existing) {
        return res.json({ ok: true, deduplicated: true });
      }

      // Pull UTM data from session record
      const tokenRecord = await storage.getOrCreateUserTokens(sessionId);

      await storage.createLead({
        sessionId,
        email,
        companyName: companyName || null,
        source,
        lookupId: lookupId || null,
        commodityName: commodityName || null,
        corridorDescription: corridorDescription || null,
        utmSource: tokenRecord.utmSource,
        utmMedium: tokenRecord.utmMedium,
        utmCampaign: tokenRecord.utmCampaign,
        utmContent: tokenRecord.utmContent,
        utmTerm: tokenRecord.utmTerm,
      });

      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/leads", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const isAdmin = await storage.isAdminSession(sessionId);
      if (!isAdmin) return res.status(403).json({ message: t("routes.admin_only", getLocale(req)) });
      const allLeads = await storage.getLeads(500);
      res.json({ leads: allLeads });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ══════════════════════════════════════════════════════════
  // Phase 4: Document Validation Endpoints
  // ══════════════════════════════════════════════════════════

  // Async validation processor — runs in background after upload
  async function processValidationAsync(
    validationId: string,
    filePath: string,
    mimeType: string,
    requirement: any,
    validationSpec: any,
    trade: { commodityName: string; hsCode: string; originCountry: string; originIso2: string; destinationName: string; destinationIso2: string },
    supplierUploadId?: string,
  ) {
    try {
      // Set processing status with lease
      const leaseUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 min lease
      await storage.updateValidationProcessing(validationId, {
        processingStatus: "processing",
        processingLeaseUntil: leaseUntil,
        processingWorkerId: `worker-${process.pid}`,
      });

      const { extractFileContent } = await import("./file-extract");
      const { validateDocument, validateSpecShape } = await import("./doc-validate");
      type TradeContext = import("./doc-validate").TradeContext;
      type RequirementValidationContext = import("./doc-validate").RequirementValidationContext;

      // Extract file content
      const fileContent = await extractFileContent(filePath, mimeType);

      // Validate spec shape
      const validatedSpec = validationSpec ? validateSpecShape(validationSpec) : null;

      const ctx: RequirementValidationContext = {
        requirement: {
          title: requirement.title ?? "",
          description: requirement.description ?? "",
          issuedBy: requirement.issuedBy ?? "",
          whenNeeded: requirement.whenNeeded ?? "",
          tip: requirement.tip ?? "",
          documentCode: requirement.documentCode ?? null,
        },
        validationSpec: validatedSpec,
        trade,
      };

      // Run the full validation pipeline
      const result = await validateDocument(fileContent, ctx);

      // Update the validation row with results
      await storage.updateValidationProcessing(validationId, {
        processingStatus: "completed",
        intakeResult: result.intake as any,
        verdict: result.finalVerdict,
        confidence: result.finalConfidence,
        extractedFields: result.aiResult.extractedFields as any,
        fieldStatus: result.fieldStatus as any,
        validationIssues: result.allIssues as any,
        deterministicChecks: result.deterministicChecks as any,
        evidence: result.allEvidence as any,
        validationSummary: result.summary,
        rawText: fileContent.pages.map((p) => p.text).join("\n\n").slice(0, 50000),
        llmModel: result.llmModel,
        intakeTimeMs: result.intakeTimeMs,
        validationTimeMs: result.validationTimeMs,
        pageCount: fileContent.totalPageCount,
        sourceTextMethod: fileContent.sourceTextMethod,
      });

      // Sync results back to supplier_uploads if this came from a supplier
      if (supplierUploadId) {
        try {
          const verdict = result.finalVerdict;
          const isVerified = verdict === "VALID" || verdict === "VALID_WITH_NOTES";
          const finding = result.allIssues.length > 0
            ? result.allIssues
                .filter((i: any) => i.severity === "critical" || i.severity === "warning")
                .map((i: any) => i.explanation || i.expected)
                .slice(0, 3)
                .join("; ") || null
            : null;

          await storage.updateSupplierUploadVerification(supplierUploadId, {
            verified: isVerified,
            finding: !isVerified ? (finding || result.summary || "Document validation found issues") : null,
          });
        } catch (syncErr) {
          console.error(`Supplier upload sync failed for ${supplierUploadId}:`, syncErr);
        }
      }
    } catch (err: any) {
      console.error(`Validation processing failed for ${validationId}:`, err);
      await storage.updateValidationProcessing(validationId, {
        processingStatus: "failed",
        processingError: err.message?.substring(0, 500) ?? "Unknown error",
      });
    }
  }

  const docValUploadDir = path.join("/tmp", "uploads", "doc-validate");
  const docValUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        fs.mkdirSync(docValUploadDir, { recursive: true });
        cb(null, docValUploadDir);
      },
      filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
        cb(null, `${Date.now()}-${safeName}`);
      },
    }),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".html", ".htm", ".txt"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF, JPG, PNG, WebP, HTML, and TXT files are allowed"));
      }
    },
  });

  // POST /api/lookups/:lookupId/requirements/:reqIndex/validate
  // Upload a document to validate against a specific requirement
  app.post("/api/lookups/:lookupId/requirements/:reqIndex/validate", docValUpload.single("file"), async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const lookupId = req.params.lookupId as string;
      const reqIndex = req.params.reqIndex as string;
      const requirementIndex = parseInt(reqIndex, 10);

      if (isNaN(requirementIndex) || requirementIndex < 0) {
        return res.status(400).json({ message: t("routes.invalid_requirement_index", getLocale(req)) });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: t("routes.no_file_uploaded", getLocale(req)) });
      }

      // Get the lookup
      const lookup = await storage.getLookupById(lookupId);
      if (!lookup) {
        return res.status(404).json({ message: t("routes.lookup_not_found", getLocale(req)) });
      }

      // Get the requirement
      const result = lookup.resultJson as any;
      const requirements = result?.requirementsDetailed ?? [];
      if (requirementIndex >= requirements.length) {
        return res.status(400).json({ message: t("routes.requirement_out_of_range", getLocale(req)) });
      }

      const requirement = requirements[requirementIndex];

      // Compute file hash for idempotency
      const { computeFileSha256 } = await import("./file-extract");
      const fileSha256 = await computeFileSha256(file.path);

      // Check idempotency
      const existing = await storage.findExistingValidation(lookupId, requirementIndex, fileSha256);
      if (existing) {
        // Return existing validation
        if (existing.processingStatus === "failed") {
          // Allow retry: reset to pending
          await storage.updateValidationProcessing(existing.id, {
            processingStatus: "pending",
            processingError: null,
          });
        }
        return res.status(200).json(existing);
      }

      // Get the compliance rule for this requirement (for validationSpec)
      const { complianceRules } = await import("@shared/schema");
      const allRules = await db.select().from(complianceRules);
      const matchingRule = requirement.documentCode
        ? allRules.find((r: any) => r.documentCode === requirement.documentCode)
        : null;

      const validationSpec = matchingRule?.validationSpec ?? null;

      // Create validation row
      const validation = await storage.createDocumentValidation({
        lookupId,
        sessionId,
        requirementIndex,
        requirementTitle: requirement.title,
        requirementDocumentCode: requirement.documentCode ?? null,
        requirementTemplateVersion: matchingRule?.ruleKey ?? null,
        originalFilename: file.originalname,
        fileKey: file.path,
        filesizeBytes: file.size,
        mimeType: file.mimetype,
        fileSha256,
        processingStatus: "pending",
        uploadSource: "buyer",
      });

      // Process asynchronously (fire and forget)
      processValidationAsync(validation.id, file.path, file.mimetype, requirement, validationSpec, {
        commodityName: lookup.commodityName,
        hsCode: lookup.hsCode,
        originCountry: lookup.originName,
        originIso2: result?.origin?.iso2 ?? "",
        destinationName: lookup.destinationName,
        destinationIso2: result?.destination?.iso2 ?? "",
      }).catch((err) => {
        console.error(`Validation processing failed for ${validation.id}:`, err);
      });

      return res.status(202).json(validation);
    } catch (error: any) {
      console.error("Document validation upload error:", error);
      return res.status(500).json({ message: error.message });
    }
  });

  // GET /api/lookups/:lookupId/document-readiness
  // Get per-requirement readiness status
  app.get("/api/lookups/:lookupId/document-readiness", async (req, res) => {
    try {
      const lookupId = req.params.lookupId as string;
      const readiness = await storage.getRequirementReadiness(lookupId);
      return res.json({ readiness });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // GET /api/document-validations/:id
  // Single validation (for polling processing status)
  app.get("/api/document-validations/:id", async (req, res) => {
    try {
      const id = req.params.id as string;
      const validation = await storage.getDocumentValidationById(id);
      if (!validation) {
        return res.status(404).json({ message: t("routes.validation_not_found", getLocale(req)) });
      }
      return res.json(validation);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // POST /api/document-validations/:id/override
  // Buyer overrides AI verdict
  app.post("/api/document-validations/:id/override", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const id = req.params.id as string;
      const { verdict, reason } = req.body;

      if (!verdict || !reason) {
        return res.status(400).json({ message: t("routes.verdict_reason_required", getLocale(req)) });
      }

      const updated = await storage.overrideDocumentValidation(id, sessionId, verdict, reason);
      if (!updated) {
        return res.status(404).json({ message: t("routes.validation_access_denied", getLocale(req)) });
      }

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // POST /api/document-validations/:id/revalidate
  // Re-run AI on existing upload
  app.post("/api/document-validations/:id/revalidate", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const id = req.params.id as string;

      const validation = await storage.getDocumentValidationById(id);
      if (!validation || validation.sessionId !== sessionId) {
        return res.status(404).json({ message: t("routes.validation_access_denied", getLocale(req)) });
      }

      if (!validation.fileKey || !fs.existsSync(validation.fileKey)) {
        return res.status(400).json({ message: t("routes.file_no_longer_available", getLocale(req)) });
      }

      // Reset processing status
      await storage.updateValidationProcessing(id, {
        processingStatus: "pending",
        processingError: null,
        manualOverride: false,
        manualVerdict: null,
        overrideReason: null,
      });

      // Get the lookup for trade context
      const lookup = await storage.getLookupById(validation.lookupId);
      if (!lookup) {
        return res.status(404).json({ message: t("routes.lookup_not_found", getLocale(req)) });
      }

      const result = lookup.resultJson as any;
      const requirements = result?.requirementsDetailed ?? [];
      const requirement = requirements[validation.requirementIndex];

      // Get validationSpec
      const { complianceRules } = await import("@shared/schema");
      const allRules = await db.select().from(complianceRules);
      const matchingRule = validation.requirementDocumentCode
        ? allRules.find((r: any) => r.documentCode === validation.requirementDocumentCode)
        : null;

      const validationSpec = matchingRule?.validationSpec ?? null;

      // Process asynchronously
      processValidationAsync(id, validation.fileKey, validation.mimeType ?? "application/pdf", requirement, validationSpec, {
        commodityName: lookup.commodityName,
        hsCode: lookup.hsCode,
        originCountry: lookup.originName,
        originIso2: result?.origin?.iso2 ?? "",
        destinationName: lookup.destinationName,
        destinationIso2: result?.destination?.iso2 ?? "",
      }).catch((err) => {
        console.error(`Revalidation failed for ${id}:`, err);
      });

      const updated = await storage.getDocumentValidationById(id);
      return res.status(202).json(updated);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // DELETE /api/document-validations/:id
  // Remove validation + file
  app.delete("/api/document-validations/:id", async (req, res) => {
    try {
      const sessionId = getSessionId(req, res);
      const id = req.params.id as string;

      // Get validation first to clean up file
      const validation = await storage.getDocumentValidationById(id);
      if (validation?.fileKey) {
        try {
          fs.unlinkSync(validation.fileKey);
        } catch {
          // File cleanup error — ignore
        }
      }

      const deleted = await storage.deleteDocumentValidation(id, sessionId);
      if (!deleted) {
        return res.status(404).json({ message: t("routes.validation_access_denied", getLocale(req)) });
      }

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
