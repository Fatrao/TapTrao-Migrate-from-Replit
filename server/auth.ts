/**
 * Authentication module — Passport + express-session configuration
 *
 * Uses the Session-Linked Users architecture:
 * - Each user stores the sessionId from their anonymous taptrao_session cookie
 * - On login, we set the taptrao_session cookie to the user's stored sessionId
 * - Result: zero migration of existing session-keyed tables
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { pool } from "./db";
import type { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      displayName: string | null;
      sessionId: string;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

export function setupAuth(app: Express): void {
  const PgStore = connectPgSimple(session);

  const sessionSecret = process.env.SESSION_SECRET || "taptrao-dev-secret-change-in-production";

  app.use(
    session({
      store: pool
        ? new PgStore({
            pool,
            tableName: "session",
            createTableIfMissing: true,
          })
        : undefined, // Falls back to MemoryStore for PGlite dev
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy: authenticate by email + password
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const isValid = await comparePasswords(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize: store user.id in session
  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  // Deserialize: fetch full user from DB
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
