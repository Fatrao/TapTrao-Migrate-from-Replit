import { Link } from "wouter";
import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X, Globe, Loader2, AlertTriangle, CheckCircle2, XCircle, Shield, FileCheck, Upload, Bell } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import PromoCodeRedeem from "@/components/promo-code-redeem";
import type { Commodity, OriginCountry, Destination } from "@shared/schema";

/* ═══════════════════════════════════════════
   TapTrao Landing Page — Interactive Corridor Checker
   ═══════════════════════════════════════════ */

type CompliancePreview = {
  commodity: { name: string; hsCode: string; commodityType: string };
  origin: { countryName: string; iso2: string };
  destination: { countryName: string; iso2: string };
  triggers: Record<string, boolean>;
  requirementTitles: string[];
  requirementCount: number;
  readinessScore: { score: number; verdict: string };
  hazards: string[];
  hasStopFlags: boolean;
  buyerDocCount: number;
  supplierDocCount: number;
  riskCount: number;
  cbamTriggered: boolean;
};

const LOADING_KEYS = ["eudr", "sps", "docs", "duties", "score", "cbam", "cites"] as const;
const TRIGGER_LABELS: Record<string, string> = {
  sps: "SPS", eudr: "EUDR", cbam: "CBAM", cites: "CITES",
  kimberley: "Kimberley", conflict: "Conflict Minerals", iuu: "IUU",
  csddd: "CSDDD", laceyAct: "Lacey Act", fdaPriorNotice: "FDA Prior Notice",
  reach: "REACH", section232: "Section 232", fsis: "FSIS",
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation("home");
  const isEn = i18n.language === "en";

  usePageTitle(t("pageTitle"));
  const { toast } = useToast();

  /* ── Reference data queries ── */
  const { data: commodities } = useQuery<Commodity[]>({
    queryKey: ["/api/commodities"],
    staleTime: Infinity,
  });
  const { data: origins } = useQuery<OriginCountry[]>({
    queryKey: ["/api/origins"],
    staleTime: Infinity,
  });
  const { data: destinations } = useQuery<Destination[]>({
    queryKey: ["/api/destinations"],
    staleTime: Infinity,
  });

  /* ── Corridor checker state ── */
  const [commodityId, setCommodityId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "result">("idle");
  const [loadingMsg, setLoadingMsg] = useState("");
  const [preview, setPreview] = useState<CompliancePreview | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  /* Group commodities by type for <optgroup> */
  const groupedCommodities = useMemo(() => {
    if (!commodities) return {};
    const groups: Record<string, Commodity[]> = {};
    for (const c of commodities) {
      const type = c.commodityType || "other";
      if (!groups[type]) groups[type] = [];
      groups[type].push(c);
    }
    // Sort within each group by name
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => a.name.localeCompare(b.name));
    }
    return groups;
  }, [commodities]);

  const TYPE_LABELS: Record<string, string> = {
    agricultural: "Agricultural",
    mineral: "Mineral",
    forestry: "Forestry",
    seafood: "Seafood",
    livestock: "Livestock",
    manufactured: "Manufactured",
    other: "Other",
  };

  /* ── Corridor check handler ── */
  async function handleCheck() {
    if (!commodityId || !originId || !destinationId) return;
    setPhase("loading");
    trackEvent("corridor_check_started", {
      commodityId, originId, destinationId,
    });

    let msgIdx = 0;
    setLoadingMsg(t(`hero.loading.${LOADING_KEYS[0]}`));
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_KEYS.length;
      setLoadingMsg(t(`hero.loading.${LOADING_KEYS[msgIdx]}`));
    }, 300);

    try {
      const res = await fetch(
        `/api/compliance-preview?commodityId=${commodityId}&originId=${originId}&destinationId=${destinationId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Preview failed");
      const data: CompliancePreview = await res.json();

      // Ensure minimum 1.5s loading for dramatic effect
      await new Promise((r) => setTimeout(r, 1500));
      clearInterval(interval);

      setPreview(data);
      setPhase("result");

      trackEvent("corridor_check_completed", {
        requirementCount: data.requirementCount,
        score: data.readinessScore.score,
        verdict: data.readinessScore.verdict,
      });

      // Scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch {
      clearInterval(interval);
      setPhase("idle");
      toast({ title: "Preview failed", description: "Please try again.", variant: "destructive" });
    }
  }

  function resetChecker() {
    setCommodityId("");
    setOriginId("");
    setDestinationId("");
    setPhase("idle");
    setPreview(null);
  }

  /* ── Demo carousel state ── */
  const [activeDemo, setActiveDemo] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const resumeRef = useRef<ReturnType<typeof setTimeout>>();
  const DEMO_COUNT = 4;

  useEffect(() => {
    if (!autoCycle) return;
    const id = setInterval(() => setActiveDemo((p) => (p + 1) % DEMO_COUNT), 6000);
    return () => clearInterval(id);
  }, [autoCycle]);

  const handleTabClick = (idx: number) => {
    setActiveDemo(idx);
    setAutoCycle(false);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setAutoCycle(true), 15000);
  };

  /* ── Stripe checkout ── */
  const PACK_KEYS: Record<string, string> = {
    single: "shield_single",
    threePack: "shield_3",
    fivePack: "shield_5",
  };

  const checkoutMutation = useMutation({
    mutationFn: async (pack: string) => {
      trackEvent("checkout_started", { pack });
      const res = await apiRequest("POST", "/api/tokens/checkout", { pack });
      return res.json();
    },
    onSuccess: (data: { url?: string }) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast({ title: "Checkout failed", description: err.message || "Please try again.", variant: "destructive" });
    },
  });

  /* ── Active triggers from preview ── */
  const activeTriggers = preview
    ? Object.entries(preview.triggers).filter(([, v]) => v).map(([k]) => k)
    : [];

  const verdictColor = preview
    ? preview.readinessScore.verdict === "GREEN" ? "var(--sage)" : preview.readinessScore.verdict === "RED" ? "var(--red)" : "var(--amber)"
    : "var(--sage)";

  const canCheck = commodityId && originId && destinationId;

  return (
    <div className="hp-page" style={{ fontFamily: "var(--fb)", background: "var(--bg)", color: "var(--t1)", minHeight: "100vh" }}>

      {/* ═══ NAVIGATION ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px",
        background: "rgba(238,233,224,.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 600, color: "var(--t1)" }}>TapTrao</span>
        </Link>

        <div className="hidden md:flex" style={{ gap: 28 }}>
          <a href="#how" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>{t("nav.howItWorks")}</a>
          <a href="#validation" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>{t("nav.validation")}</a>
          <a href="#pricing" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>{t("nav.pricing")}</a>
          <Link href="/blog" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>Blog</Link>
        </div>

        <div className="hidden md:flex" style={{ alignItems: "center", gap: 12 }}>
          <button
            onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 20, padding: "6px 14px", cursor: "pointer",
              fontSize: 15, fontWeight: 500, color: "var(--t2)", fontFamily: "var(--fb)",
            }}
            title={isEn ? "Passer en francais" : "Switch to English"}
          >
            <Globe size={14} />
            {isEn ? "FR" : "EN"}
          </button>
          {isAuthenticated ? (
            <Link href="/trades" style={{
              padding: "9px 22px", borderRadius: 20, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600, textDecoration: "none",
            }}>{t("nav.myTrades")}</Link>
          ) : (
            <Link href="/lookup" style={{
              padding: "9px 22px", borderRadius: 20, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600, textDecoration: "none",
            }}>{t("nav.freeComplianceCheck")}</Link>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t1)" }}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, bottom: 0, zIndex: 99,
          background: "#fff", padding: "24px 32px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <a href="#how" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>{t("nav.howItWorks")}</a>
          <a href="#validation" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>{t("nav.validation")}</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>{t("nav.pricing")}</a>
          <Link href="/blog" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>Blog</Link>
          <button onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 10, padding: "10px 16px", cursor: "pointer",
            fontSize: 15, fontWeight: 500, color: "var(--t1)", fontFamily: "var(--fb)",
          }}>
            <Globe size={16} />
            {isEn ? "Francais" : "English"}
          </button>
          <div style={{ borderTop: "1px solid var(--bg)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {isAuthenticated ? (
              <Link href="/trades" onClick={() => setMobileMenuOpen(false)} style={{
                padding: "12px 24px", borderRadius: 20, background: "var(--sage)", color: "#fff",
                textAlign: "center", fontWeight: 600, textDecoration: "none", fontSize: 15,
              }}>{t("nav.myTrades")}</Link>
            ) : (
              <Link href="/lookup" onClick={() => setMobileMenuOpen(false)} style={{
                padding: "12px 24px", borderRadius: 20, background: "var(--sage)", color: "#fff",
                textAlign: "center", fontWeight: 600, textDecoration: "none", fontSize: 15,
              }}>{t("nav.freeComplianceCheck")}</Link>
            )}
          </div>
        </div>
      )}

      {/* ═══ HERO — Interactive Corridor Checker ═══ */}
      <div style={{
        marginTop: 64, position: "relative", minHeight: phase === "idle" ? 460 : 380,
        display: "flex", alignItems: "center", overflow: "hidden",
        background: "#1b2a22",
      }}>
        <img src="/images/jungle-river-opt.jpg" alt="" style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 40%",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(27,42,34,0.85) 0%, rgba(45,74,56,0.75) 50%, rgba(61,107,79,0.65) 100%)",
        }} />

        <div className="hp-hero-inner" style={{
          position: "relative", zIndex: 2, padding: "40px 60px 50px", width: "100%",
          display: "flex", flexDirection: "column", gap: 24,
        }}>
          <h1 style={{
            fontFamily: "var(--fd)", fontSize: 44, fontWeight: 600, color: "#fff",
            lineHeight: 1.15, maxWidth: 700,
          }}>
            {t("hero.heading")}
          </h1>
          <p style={{
            fontSize: 18, color: "rgba(255,255,255,.9)", lineHeight: 1.7,
            maxWidth: 700, fontWeight: 400,
          }}>
            {t("hero.subheading")}
          </p>

          {/* Corridor input card */}
          <div className="hp-corridor-card" style={{
            background: "var(--sage-mid)", borderRadius: 16, padding: "24px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            maxWidth: 800,
          }}>
            {phase === "loading" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
                <Loader2 size={32} style={{ color: "#fff", animation: "spin 1s linear infinite" }} />
                <div style={{ fontSize: 16, color: "#fff", fontWeight: 500, animation: "pulse 1s ease-in-out infinite" }}>
                  {loadingMsg}
                </div>
              </div>
            ) : (
              <>
                <div className="hp-corridor-inputs" style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {/* Commodity */}
                  <select
                    value={commodityId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("__hdr__")) { e.target.value = commodityId; return; }
                      setCommodityId(val);
                    }}
                    style={{
                      flex: 1, padding: "12px 14px", borderRadius: 10,
                      border: "none", background: "var(--sage)",
                      color: commodityId ? "#fff" : "#fff",
                      fontSize: 15, fontFamily: "var(--fb)", cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="" style={{ color: "#333", background: "#fff" }}>{t("hero.commodityPlaceholder")}</option>
                    {Object.entries(groupedCommodities).flatMap(([type, items]) => [
                      <option key={`hdr-${type}`} value={`__hdr__${type}`} style={{ fontWeight: 900, color: "#0e4e45", background: "#c8ddd2", fontSize: "14px" }}>
                        {"━━━  " + (TYPE_LABELS[type] || type).toUpperCase() + "  ━━━"}
                      </option>,
                      ...items.map((c) => (
                        <option key={c.id} value={c.id} style={{ color: "#333", background: "#fff", fontWeight: 400 }}>
                          {"   "}{c.name} ({c.hsCode})
                        </option>
                      )),
                    ])}
                  </select>

                  {/* Origin */}
                  <select
                    value={originId}
                    onChange={(e) => setOriginId(e.target.value)}
                    style={{
                      flex: 1, padding: "12px 14px", borderRadius: 10,
                      border: "none", background: "var(--sage)",
                      color: originId ? "#fff" : "#fff",
                      fontSize: 15, fontFamily: "var(--fb)", cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="" style={{ color: "#333", background: "#fff" }}>{t("hero.originPlaceholder")}</option>
                    {origins?.map((o) => (
                      <option key={o.id} value={o.id} style={{ color: "#333", background: "#fff" }}>
                        {iso2ToFlag(o.iso2)} {o.countryName}
                      </option>
                    ))}
                  </select>

                  {/* Destination */}
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    style={{
                      flex: 1, padding: "12px 14px", borderRadius: 10,
                      border: "none", background: "var(--sage)",
                      color: destinationId ? "#fff" : "#fff",
                      fontSize: 15, fontFamily: "var(--fb)", cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="" style={{ color: "#333", background: "#fff" }}>{t("hero.destinationPlaceholder")}</option>
                    {destinations?.map((d) => (
                      <option key={d.id} value={d.id} style={{ color: "#333", background: "#fff" }}>
                        {iso2ToFlag(d.iso2)} {d.countryName}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCheck}
                  disabled={!canCheck}
                  style={{
                    width: "100%", padding: "14px 24px", borderRadius: 12,
                    border: "none", fontFamily: "var(--fb)", fontSize: 16, fontWeight: 700,
                    cursor: canCheck ? "pointer" : "not-allowed",
                    background: "#fff",
                    color: "var(--sage-mid)",
                    opacity: canCheck ? 1 : 0.5,
                    transition: "all .2s",
                  }}
                >
                  {t("hero.ctaPrimary")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CORRIDOR RESULT — Risk Briefing ═══ */}
      {phase === "result" && preview && (
        <div ref={resultRef} className="hp-result-section" style={{
          margin: "0 40px", animation: "fadeInUp 0.5s ease both",
        }}>
          {/* Risk briefing card */}
          <div style={{
            background: "#fff", borderRadius: 20, padding: "40px 48px",
            boxShadow: "var(--shd)", marginBottom: 40,
          }}>
            {/* Corridor header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--fd)" }}>
                {iso2ToFlag(preview.origin.iso2)} {preview.commodity.name}
              </span>
              <span style={{ fontSize: 16, color: "var(--t3)" }}>&rarr;</span>
              <span style={{ fontSize: 20, fontWeight: 600, fontFamily: "var(--fd)" }}>
                {iso2ToFlag(preview.destination.iso2)} {preview.destination.countryName}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                background: "rgba(0,0,0,0.05)", color: "var(--t3)",
              }}>
                HS {preview.commodity.hsCode}
              </span>
            </div>

            {/* Risk-led headline */}
            <h3 style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 600, marginBottom: 20, color: "var(--t1)" }}>
              {t("pain.heading", { count: preview.riskCount })}
            </h3>

            {/* Two prominent number cards: buyer docs + supplier docs */}
            <div className="hp-doc-count-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={{
                background: "rgba(0,0,0,0.03)", borderRadius: 12, padding: "16px 20px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>
                  {preview.buyerDocCount}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t3)" }}>
                  {t("pain.buyerDocs")}
                </div>
              </div>
              <div style={{
                background: "rgba(0,0,0,0.03)", borderRadius: 12, padding: "16px 20px",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>
                  {preview.supplierDocCount}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t3)" }}>
                  {t("pain.supplierDocs")}
                </div>
              </div>
            </div>

            {/* CBAM explicit callout */}
            {preview.cbamTriggered && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 18px",
                background: "var(--amber-pale)", borderRadius: 10, marginBottom: 16,
                borderLeft: "3px solid var(--amber)",
              }}>
                <AlertTriangle size={18} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--t1)", lineHeight: 1.5 }}>
                  {t("pain.cbamCallout")}
                </span>
              </div>
            )}

            {/* Stop flags warning */}
            {preview.hasStopFlags && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                background: "var(--red-pale)", borderRadius: 10, marginBottom: 16,
                border: "1px solid rgba(196,78,58,0.15)",
              }}>
                <AlertTriangle size={18} style={{ color: "var(--red)", flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--red)" }}>{t("pain.stopFlags")}</span>
              </div>
            )}

            {/* Requirements list — first 3 visible, rest locked */}
            <div className="hp-pain-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginBottom: 0 }}>
              {preview.requirementTitles.map((title, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <XCircle size={16} style={{ color: "var(--red)", marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.5 }}>{title}</span>
                </div>
              ))}
            </div>

            {/* Locked requirements teaser */}
            {preview.requirementCount > preview.requirementTitles.length && (
              <div style={{
                position: "relative", marginTop: 8, marginBottom: 24,
                padding: "20px 24px", borderRadius: 12,
                background: "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.06) 100%)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                {/* Blurred fake rows */}
                <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }}>
                  <div className="hp-pain-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
                    {Array.from({ length: Math.min(preview.requirementCount - preview.requirementTitles.length, 4) }).map((_, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <XCircle size={16} style={{ color: "var(--red)", marginTop: 2, flexShrink: 0, opacity: 0.4 }} />
                        <span style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.5 }}>
                          Certificate of compliance requirement #{i + 4}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Lock overlay */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 12,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#fff", padding: "10px 20px", borderRadius: 10,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.08)",
                  }}>
                    <Shield size={16} style={{ color: "var(--sage)" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--t1)" }}>
                      +{preview.requirementCount - preview.requirementTitles.length} more requirements
                    </span>
                    <span style={{ fontSize: 13, color: "var(--t3)" }}>— unlock with Shield</span>
                  </div>
                </div>
              </div>
            )}

            {/* Triggers + Score row */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
              {activeTriggers.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {t("pain.triggers")}
                  </span>
                  {activeTriggers.map((key) => (
                    <span key={key} style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                      background: "var(--amber-pale)", color: "var(--amber)",
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      {TRIGGER_LABELS[key] || key}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {t("pain.readinessLabel")}
                </span>
                <span style={{
                  fontSize: 20, fontWeight: 700, fontFamily: "var(--fd)", color: verdictColor,
                }}>
                  {preview.readinessScore.score}/100
                </span>
              </div>
            </div>

            {/* CTA section with tooltip */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {isMobile ? (
                /* Mobile: button + inline tooltip content */
                <Link
                  href={`/new-check?commodityId=${commodityId}&originId=${originId}&destinationId=${destinationId}`}
                  style={{
                    padding: "14px 32px", borderRadius: 12, border: "none",
                    background: "var(--sage)", color: "#fff",
                    fontFamily: "var(--fb)", fontSize: 16, fontWeight: 700,
                    cursor: "pointer", boxShadow: "0 4px 16px rgba(74,124,94,.3)",
                    textDecoration: "none", display: "inline-block",
                  }}
                  onClick={() => trackEvent("corridor_check_cta_clicked", { source: "risk_briefing" })}
                >
                  {t("pain.cta")} &rarr;
                </Link>
              ) : (
                /* Desktop: hover tooltip */
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/new-check?commodityId=${commodityId}&originId=${originId}&destinationId=${destinationId}`}
                      style={{
                        padding: "14px 32px", borderRadius: 12, border: "none",
                        background: "var(--sage)", color: "#fff",
                        fontFamily: "var(--fb)", fontSize: 16, fontWeight: 700,
                        cursor: "pointer", boxShadow: "0 4px 16px rgba(74,124,94,.3)",
                        textDecoration: "none", display: "inline-block",
                      }}
                      onClick={() => trackEvent("corridor_check_cta_clicked", { source: "risk_briefing" })}
                    >
                      {t("pain.cta")} &rarr;
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    sideOffset={12}
                    style={{
                      background: "#1b2a22", color: "#fff",
                      minWidth: 320, maxWidth: 420, padding: 24,
                      borderRadius: 14, border: "none",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#eab308", marginBottom: 14 }}>
                      {t("pain.tooltipHeader")}
                    </div>
                    {([1,2,3,4,5,6] as const).map(n => (
                      <div key={n} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                        <span style={{ color: "#eab308", fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: 1.6 }}>✓</span>
                        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: "rgba(255,255,255,0.92)" }}>
                          {t(`pain.tooltipItem${n}`)}
                        </span>
                      </div>
                    ))}
                  </TooltipContent>
                </Tooltip>
              )}
              <button onClick={resetChecker} style={{
                padding: "14px 24px", borderRadius: 12,
                background: "none", border: "1px solid rgba(0,0,0,0.12)",
                color: "var(--t2)", fontFamily: "var(--fb)", fontSize: 15, fontWeight: 500,
                cursor: "pointer",
              }}>
                {t("pain.ctaAnother")}
              </button>
            </div>

            {/* Mobile: show tooltip content inline below button */}
            {isMobile && (
              <div style={{
                background: "#1b2a22", color: "#fff",
                padding: 20, borderRadius: 14, marginTop: 20,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#eab308", marginBottom: 14 }}>
                  {t("pain.tooltipHeader")}
                </div>
                {([1,2,3,4,5,6] as const).map(n => (
                  <div key={n} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#eab308", fontWeight: 700, flexShrink: 0, fontSize: 14, lineHeight: 1.6 }}>✓</span>
                    <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: "rgba(255,255,255,0.92)" }}>
                      {t(`pain.tooltipItem${n}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TRUST BAR ═══ */}
      <div className="hp-trust-bar" style={{
        display: "flex", justifyContent: "center", padding: "28px 40px",
        background: "var(--dark)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2.5, color: "#fff", marginBottom: 10 }}>
            {t("trustBar.corridors")}
          </div>
          <div style={{ fontSize: 32, letterSpacing: 8 }}>
            🇨🇮 🇬🇭 🇳🇬 🇰🇪 🇹🇿 🇪🇹{" "}
            <span style={{ color: "#fff", fontSize: 24 }}>&rarr;</span>{" "}
            🇪🇺 🇬🇧 🇩🇪 🇫🇷 🇮🇹 🇨🇭 🇺🇸 🇨🇦 🇹🇷
          </div>
        </div>
      </div>

      {/* ═══ FACTS — What Every African Commodity Importer Should Know ═══ */}
      <div className="hp-facts-section" style={{
        background: "#fff", borderRadius: 24, margin: "0 40px",
        padding: 60, boxShadow: "var(--shd)",
      }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          {t("factsSection.heading")}
        </h2>
        <p style={{ fontSize: 16, color: "var(--t2)", marginBottom: 40, maxWidth: 600 }}>
          {t("factsSection.subheading")}
        </p>

        {/* Regulatory deadlines */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
          {t("factsSection.regulations.heading")}
        </h3>
        <div className="hp-facts-regs" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36 }}>
          {(["eudr", "cbam", "ukBtom"] as const).map((key) => (
            <div key={key} style={{
              background: "var(--bg)", borderRadius: "var(--r)", padding: 24,
              borderLeft: `3px solid ${key === "eudr" ? "var(--red)" : key === "cbam" ? "var(--amber)" : "var(--sage)"}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, color: key === "eudr" ? "var(--red)" : key === "cbam" ? "var(--amber)" : "var(--sage)" }}>
                {key === "eudr" ? "EUDR" : key === "cbam" ? "CBAM" : "UK BTOM"}
              </div>
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.7, margin: 0 }}>
                {t(`factsSection.regulations.${key}`)}
              </p>
            </div>
          ))}
        </div>

        {/* Cost stats */}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
          {t("factsSection.costs.heading")}
        </h3>
        <div className="hp-cost-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {(["demurrage", "bankFee", "isfPenalty", "cascadeCost"] as const).map((key) => (
            <div key={key} style={{ background: "var(--bg)", borderRadius: "var(--r)", padding: 20 }}>
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6, margin: 0 }}>
                {t(`factsSection.costs.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ HOW IT WORKS — 4 Steps ═══ */}
      <section id="how" style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          {t("howItWorks.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          {t("howItWorks.subheading")}
        </p>

        <div className="hp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {(["step1", "step2", "step3", "step4"] as const).map((stepKey, i) => {
            const icons = [Shield, Upload, FileCheck, Bell];
            const Icon = icons[i];
            return (
              <div key={stepKey} style={{ background: "#fff", borderRadius: "var(--r)", padding: 28, boxShadow: "var(--shd)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(74,124,94,0.08)",
                  }}>
                    <Icon size={16} style={{ color: "var(--sage)" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--sage)", letterSpacing: 2, textTransform: "uppercase" }}>
                    {t(`howItWorks.steps.${stepKey}.label`)}
                  </span>
                </div>
                <h3 style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {t(`howItWorks.steps.${stepKey}.title`)}
                </h3>
                <p style={{ fontSize: 14, color: "var(--t3)", lineHeight: 1.7, margin: 0 }}>
                  {t(`howItWorks.steps.${stepKey}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ PLATFORM DEMO ═══ */}
      <div id="validation" className="hp-validation-section" style={{
        background: "var(--dark)", borderRadius: 24, margin: "0 40px", padding: 60, color: "#fff",
      }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8, color: "#fff" }}>
          {t("demo.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", marginBottom: 32, maxWidth: 600 }}>
          {t("demo.subheading")}
        </p>

        <div className="hp-demo-tabs" style={{ display: "flex", gap: 4, marginBottom: 24, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {([
            { tab: "check", label: t("demo.tabs.check") },
            { tab: "dashboard", label: t("demo.tabs.dashboard") },
            { tab: "lcVerify", label: t("demo.tabs.lcVerify") },
            { tab: "inbox", label: t("demo.tabs.inbox") },
          ] as const).map(({ tab, label }, i) => (
            <button key={tab} onClick={() => handleTabClick(i)} style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: activeDemo === i ? "rgba(109,184,154,.15)" : "transparent",
              color: activeDemo === i ? "var(--sage-l)" : "rgba(255,255,255,.5)",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: activeDemo === i ? 600 : 400,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              borderBottom: activeDemo === i ? "2px solid var(--sage-l)" : "2px solid transparent",
              transition: "all .2s",
            }}>
              {label}
            </button>
          ))}
        </div>

        <div key={activeDemo} className="hp-demo-panel" style={{
          borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)",
          animation: "demoFadeIn .4s ease both", background: "#1a1a1c",
        }}>
          <img
            src={["/demo/compliance.png", "/demo/trades.png", "/demo/lc-check.png", "/demo/inbox.png"][activeDemo]}
            alt={[t("demo.tabs.check"), t("demo.tabs.dashboard"), t("demo.tabs.lcVerify"), t("demo.tabs.inbox")][activeDemo]}
            style={{ width: "100%", maxHeight: "60vh", objectFit: "cover", objectPosition: "top left", display: "block" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: DEMO_COUNT }).map((_, i) => (
            <button key={i} onClick={() => handleTabClick(i)} style={{
              width: activeDemo === i ? 24 : 8, height: 8, borderRadius: 4, border: "none",
              background: activeDemo === i ? "var(--sage-l)" : "rgba(255,255,255,.2)",
              cursor: "pointer", transition: "all .3s", padding: 0,
            }} />
          ))}
        </div>
      </div>

      {/* ═══ WHAT YOUR SUPPLIER SEES ═══ */}
      <section style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          {t("supplierPreview.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          {t("supplierPreview.subheading")}
        </p>

        <div className="hp-supplier-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {(["noLogin", "exactDocs", "tracked"] as const).map((key) => (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(74,124,94,0.08)",
                }}>
                  <CheckCircle2 size={18} style={{ color: "var(--sage)" }} />
                </div>
                <span style={{ fontSize: 16, color: "var(--t2)", lineHeight: 1.6 }}>
                  {t(`supplierPreview.${key}`)}
                </span>
              </div>
            ))}
            <Link href="/lookup" style={{
              padding: "14px 28px", borderRadius: 12, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600,
              textDecoration: "none", display: "inline-block", alignSelf: "flex-start",
              marginTop: 8,
            }}>
              {t("supplierPreview.cta")} &rarr;
            </Link>
          </div>

          {/* Supplier upload mockup */}
          <div style={{
            background: "var(--dark)", borderRadius: 20, padding: 32,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <img src="/logo.png?v=2" alt="" style={{ width: 24, height: 24, borderRadius: 6 }} />
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>Secure Upload</span>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #1b3a2e, #2d4a38)", borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 4 }}>🥜 Raw Cashew Nuts</div>
              <div style={{ fontSize: 13, color: "#fff" }}>🇨🇮 Cote d'Ivoire &rarr; 🇬🇧 United Kingdom</div>
            </div>
            {["Certificate of Origin", "Phytosanitary Cert", "Bill of Lading"].map((doc, i) => (
              <div key={doc} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 8, marginBottom: 6,
                background: i === 0 ? "rgba(74,124,94,0.12)" : "rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontSize: 13, color: i === 0 ? "var(--sage-l)" : "rgba(255,255,255,0.5)" }}>
                  {i === 0 ? "✓" : "○"} {doc}
                </span>
                {i !== 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Upload</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOG PREVIEW ═══ */}
      <section id="blog" style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          From the TapTrao Blog
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          What every small importer needs to know — before the next shipment.
        </p>

        <div className="hp-blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {([
            { slug: "/blog/sesame-seeds-nigeria", image: "/blog/sesame.jpg", tag: "Food Safety \u00B7 EU MRLs", title: "Why sesame seeds from Nigeria keep getting rejected at Rotterdam", readTime: "7 min read" },
            { slug: "/blog/cocoa-eudr-importers", image: "/blog/cocoa.jpg", tag: "EUDR \u00B7 Cocoa \u00B7 Ghana", title: "What EUDR actually requires from cocoa importers \u2014 and why most small businesses aren't ready", readTime: "8 min read" },
            { slug: "/blog/tropical-fruits-phytosanitary", image: "/blog/fruits.jpg", tag: "Phytosanitary \u00B7 UK Border", title: "The 14-day window that catches tropical fruit importers off guard", readTime: "7 min read" },
            { slug: "/blog/bamboo-eudr-forest-product", image: "/blog/bamboo.jpg", tag: "EUDR \u00B7 Forest Products", title: "Bamboo is a forest product under EUDR. Most importers don't know that yet.", readTime: "7 min read" },
          ]).map((post) => (
            <Link key={post.slug} href={post.slug} style={{
              background: "#fff", borderRadius: "var(--r)", overflow: "hidden",
              textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column",
              boxShadow: "var(--shd)", transition: "box-shadow 0.25s, transform 0.25s",
            }} className="hp-blog-card">
              <img src={post.image} alt={post.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
              <div style={{ padding: "20px 22px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.11em", textTransform: "uppercase",
                  color: "var(--sage)", background: "rgba(107,144,128,0.1)",
                  padding: "3px 10px", borderRadius: 100, alignSelf: "flex-start", marginBottom: 10,
                }}>{post.tag}</span>
                <div style={{
                  fontFamily: "var(--fd)", fontSize: 15, fontWeight: 700, lineHeight: 1.35,
                  color: "var(--dark)", marginBottom: 12, flex: 1,
                }}>{post.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--dark)", borderBottom: "2px solid var(--sage)", paddingBottom: 1 }}>
                    Continue reading &rarr;
                  </span>
                  <span style={{ fontSize: 12, color: "var(--t3)", opacity: 0.6 }}>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link href="/blog" style={{
            display: "inline-block", padding: "12px 32px", borderRadius: 24,
            border: "2px solid var(--sage)", color: "var(--sage)",
            fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}>
            View All Articles
          </Link>
        </div>
      </section>

      {/* ═══ REAL COST OF GETTING IT WRONG ═══ */}
      <section style={{ padding: "80px 60px", background: "linear-gradient(180deg, #faf8f5 0%, #fff 100%)" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8, color: "var(--t1)" }}>
          {t("realCost.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 40, maxWidth: 560 }}>
          {t("realCost.subheading")}
        </p>

        <div className="hp-realcost-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {([
            { key: "eudr" as const, icon: "\uD83C\uDF3F", accent: "#059669", accentBg: "rgba(5,150,105,0.08)", borderColor: "rgba(5,150,105,0.2)" },
            { key: "cbam" as const, icon: "\uD83C\uDFED", accent: "#2563eb", accentBg: "rgba(37,99,235,0.08)", borderColor: "rgba(37,99,235,0.2)" },
            { key: "demurrage" as const, icon: "\u2693", accent: "#d97706", accentBg: "rgba(217,119,6,0.08)", borderColor: "rgba(217,119,6,0.2)" },
            { key: "lc" as const, icon: "\uD83D\uDCDC", accent: "#7c3aed", accentBg: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.2)" },
            { key: "sps" as const, icon: "\uD83D\uDEE1\uFE0F", accent: "#dc2626", accentBg: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.2)" },
          ]).map((item) => (
            <div
              key={item.key}
              style={{
                background: "#fff",
                borderRadius: "var(--r)",
                padding: "24px 22px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: `1px solid ${item.borderColor}`,
                borderTop: `3px solid ${item.accent}`,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: item.accentBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>
                    {t(`realCost.${item.key}.title`)}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.accent, fontFamily: "var(--fd)" }}>
                    {t(`realCost.${item.key}.amount`)}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.6, margin: 0 }}>
                {t(`realCost.${item.key}.detail`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          {t("pricingSection.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          {t("pricingSection.subheading")}
        </p>

        <div className="hp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {([
            { key: "single" as const, featured: false },
            { key: "threePack" as const, featured: true },
            { key: "fivePack" as const, featured: false },
          ]).map((plan) => (
            <div key={plan.key} title={t(`pricingSection.plans.${plan.key}.tooltip`)} style={{
              background: plan.featured ? "var(--dark)" : "#fff",
              color: plan.featured ? "#fff" : "var(--t1)",
              borderRadius: "var(--r)", padding: 32,
              boxShadow: plan.featured ? "0 8px 32px rgba(0,0,0,.15)" : "var(--shd)",
              textAlign: "center", cursor: "default", position: "relative",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = plan.featured ? "0 12px 40px rgba(0,0,0,.25)" : "0 8px 24px rgba(0,0,0,.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = plan.featured ? "0 8px 32px rgba(0,0,0,.15)" : "var(--shd)"; }}
            >
              <div style={{
                fontSize: 15, fontWeight: 600, letterSpacing: 1,
                color: plan.featured ? "var(--sage-l)" : "var(--t3)",
                marginBottom: 8, textTransform: "uppercase",
              }}>{t(`pricingSection.plans.${plan.key}.name`)}</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
                {t(`pricingSection.plans.${plan.key}.price`)}
              </div>
              <div style={{
                fontSize: 15, color: plan.featured ? "rgba(255,255,255,.8)" : "var(--t3)", marginBottom: 20,
              }}>{t(`pricingSection.plans.${plan.key}.per`)}</div>
              {/* Tooltip description line */}
              <div style={{
                fontSize: 13, color: plan.featured ? "rgba(255,255,255,.65)" : "var(--t4)",
                fontStyle: "italic", marginBottom: 16, lineHeight: 1.4,
              }}>{t(`pricingSection.plans.${plan.key}.description`)}</div>
              <div style={{
                fontSize: 15, color: plan.featured ? "rgba(255,255,255,.85)" : "var(--t2)",
                lineHeight: 2, textAlign: "left", marginBottom: 20,
              }}>
                {(t(`pricingSection.plans.${plan.key}.features`) as string).split("\n").map((f: string) => <div key={f}>{f}</div>)}
              </div>
              <button
                onClick={() => checkoutMutation.mutate(PACK_KEYS[plan.key])}
                disabled={checkoutMutation.isPending}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  width: "100%", padding: 12, borderRadius: 20,
                  border: "none", fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600,
                  cursor: checkoutMutation.isPending ? "wait" : "pointer",
                  background: plan.featured ? "var(--sage-l)" : "var(--bg)",
                  color: plan.featured ? "var(--dark)" : "var(--t1)",
                  opacity: checkoutMutation.isPending ? 0.7 : 1,
                }}
              >
                {checkoutMutation.isPending && checkoutMutation.variables === PACK_KEYS[plan.key] && (
                  <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                )}
                {plan.featured ? t("pricingSection.ctaFeatured") : t("pricingSection.ctaDefault")}
              </button>
            </div>
          ))}
        </div>

        {/* Promo Code */}
        <div style={{
          marginTop: 32, maxWidth: 400, marginLeft: "auto", marginRight: "auto",
          background: "#fff", borderRadius: 14, padding: "20px 24px",
          border: "2px solid #c0c0c0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <PromoCodeRedeem variant="light" />
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <div className="hp-cta" style={{ textAlign: "center", padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 12 }}>
          {t("finalCta.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 28 }}>
          {t("finalCta.subheading")}
        </p>
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{
          padding: "16px 36px", borderRadius: 24, border: "none",
          background: "var(--sage)", color: "#fff",
          fontFamily: "var(--fb)", fontSize: 15, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 6px 24px rgba(27,42,34,.4)",
          textDecoration: "none", display: "inline-block",
        }}>
          {t("finalCta.button")}
        </a>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: "var(--dark)", padding: "48px 60px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        color: "rgba(255,255,255,.8)", fontSize: 15, flexWrap: "wrap", gap: 40,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
            <span style={{ fontFamily: "var(--fd)", fontSize: 15, color: "#fff", fontWeight: 600 }}>TapTrao</span>
          </div>
          <div>{t("footer.tagline")}</div>
          <div style={{ marginTop: 12 }}>{t("footer.copyright")}</div>
        </div>

        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.2)", marginBottom: 10, textTransform: "uppercase" }}>{t("footer.product")}</h4>
            <Link href="/lookup" style={{ display: "block", fontSize: 15, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>{t("footer.freeCheck")}</Link>
            <Link href="/pricing" style={{ display: "block", fontSize: 15, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>{t("footer.pricing")}</Link>
            <Link href="/lc-check" style={{ display: "block", fontSize: 15, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>{t("footer.lcCheck")}</Link>
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.2)", marginBottom: 10, textTransform: "uppercase" }}>{t("footer.company")}</h4>
            <a href="mailto:hello@taptrao.com" style={{ display: "block", fontSize: 15, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>{t("footer.contact")}</a>
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.2)", marginBottom: 10, textTransform: "uppercase" }}>{t("footer.legal")}</h4>
            <Link href="/privacy-policy" style={{ display: "block", fontSize: 15, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>{t("footer.privacyPolicy")}</Link>
            <Link href="/terms-of-service" style={{ display: "block", fontSize: 15, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>{t("footer.termsConditions")}</Link>
          </div>
        </div>
      </footer>

      {/* Animations + Responsive overrides */}
      <style>{`
        @keyframes demoFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .hp-demo-tabs::-webkit-scrollbar { display: none; }
        .hp-demo-tabs { scrollbar-width: none; }
        .hp-blog-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.08) !important; }

        @media (max-width: 768px) {
          .hp-page { overflow-x: hidden !important; }
          .hp-page nav { padding: 12px 16px !important; }
          .hp-page section { padding: 32px 16px !important; }
          .hp-page h1 { font-size: 26px !important; line-height: 1.2 !important; }
          .hp-page h2 { font-size: 22px !important; }
          .hp-page footer { padding: 32px 16px !important; flex-direction: column !important; }

          /* Hero */
          .hp-page .hp-hero-inner {
            padding: 20px 20px 28px !important;
          }
          .hp-page .hp-hero-inner h1 { max-width: 100% !important; }
          .hp-page .hp-hero-inner p { font-size: 15px !important; margin-bottom: 16px !important; }

          /* Corridor inputs */
          .hp-corridor-card { padding: 16px !important; }
          .hp-corridor-inputs { flex-direction: column !important; gap: 8px !important; }
          .hp-corridor-inputs select { width: 100% !important; }

          /* Result section */
          .hp-result-section { margin: 0 12px !important; }
          .hp-result-section > div { padding: 24px 20px !important; }
          .hp-result-section .hp-pain-grid { grid-template-columns: 1fr !important; }

          /* Trust bar */
          .hp-page .hp-trust-bar { padding: 20px 16px !important; }
          .hp-page .hp-trust-bar > div > div:first-child { font-size: 15px !important; letter-spacing: 1.5px !important; }
          .hp-page .hp-trust-bar > div > div:last-child { font-size: 24px !important; letter-spacing: 4px !important; }

          /* Facts section */
          .hp-page .hp-facts-section { margin: 0 12px !important; padding: 28px 16px !important; border-radius: 16px !important; }
          .hp-facts-regs { grid-template-columns: 1fr !important; }
          .hp-cost-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }

          /* Steps */
          .hp-steps-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }

          /* Demo */
          .hp-page .hp-validation-section { margin: 0 12px !important; padding: 28px 16px !important; border-radius: 16px !important; }

          /* Supplier preview */
          .hp-supplier-grid { grid-template-columns: 1fr !important; gap: 24px !important; }

          /* Real Cost + Blog + Pricing */
          .hp-realcost-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .hp-blog-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .hp-pricing-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .hp-pricing-grid > div { padding: 24px !important; }

          /* Final CTA */
          .hp-page .hp-cta { padding: 40px 16px !important; }

          /* Footer columns */
          .hp-page footer > div:last-child { flex-direction: column !important; gap: 24px !important; }
        }

        @media (max-width: 480px) {
          .hp-steps-grid { grid-template-columns: 1fr !important; }
          .hp-cost-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
