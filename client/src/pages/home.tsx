import { Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X, Globe, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ═══════════════════════════════════════════
   TapTrao Landing Page — Warm Cream
   Matches: taptrao-landing-FINAL (2).html
   ═══════════════════════════════════════════ */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation("home");
  const isEn = i18n.language === "en";

  usePageTitle(t("pageTitle"));

  const { toast } = useToast();

  /* Demo section state */
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

  // Map landing page plan keys → Stripe pack keys
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
      toast({
        title: "Checkout failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

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

        {/* Desktop nav links */}
        <div className="hidden md:flex" style={{ gap: 28 }}>
          <a href="#how" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>{t("nav.howItWorks")}</a>
          <a href="#validation" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>{t("nav.validation")}</a>
          <a href="#pricing" style={{ fontSize: 15, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>{t("nav.pricing")}</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 12 }}>
          <button
            onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 20, padding: "6px 14px", cursor: "pointer",
              fontSize: 15, fontWeight: 500, color: "var(--t2)",
              fontFamily: "var(--fb)",
            }}
            title={isEn ? "Passer en français" : "Switch to English"}
          >
            <Globe size={14} />
            {isEn ? "FR" : "EN"}
          </button>
          {isAuthenticated ? (
            <Link href="/trades" style={{
              padding: "9px 22px", borderRadius: 20, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600,
              textDecoration: "none", cursor: "pointer",
            }}>
              {t("nav.myTrades")}
            </Link>
          ) : (
            <Link href="/lookup" style={{
              padding: "9px 22px", borderRadius: 20, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600,
              textDecoration: "none", cursor: "pointer",
            }}>
              {t("nav.freeComplianceCheck")}
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t1)" }}
        >
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
          <button
            onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 10, padding: "10px 16px", cursor: "pointer",
              fontSize: 15, fontWeight: 500, color: "var(--t1)",
              fontFamily: "var(--fb)",
            }}
          >
            <Globe size={16} />
            {isEn ? "Français" : "English"}
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

      {/* ═══ HERO ═══ */}
      <div style={{
        marginTop: 64, position: "relative", minHeight: 380, maxHeight: 420,
        display: "flex", alignItems: "center", overflow: "hidden",
        background: "#1b2a22",
      }}>
        {/* Background image */}
        <img
          src="/images/jungle-river-opt.jpg"
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 40%",
          }}
        />
        {/* Dark gradient overlay for text readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(27,42,34,0.82) 0%, rgba(45,74,56,0.7) 50%, rgba(61,107,79,0.6) 100%)",
        }} />

        <div className="hp-hero-inner" style={{
          position: "relative", zIndex: 2, padding: "30px 60px 60px", width: "100%",
          display: "flex", flexDirection: "column", minHeight: 280,
        }}>
          <h1 style={{
            fontFamily: "var(--fd)", fontSize: 48, fontWeight: 600, color: "#fff",
            lineHeight: 1.15, marginBottom: 16, maxWidth: 700,
          }}>
            {t("hero.heading")}
          </h1>
          <p style={{
            fontSize: 19, color: "rgba(255,255,255,.9)", lineHeight: 1.7,
            marginBottom: 32, maxWidth: 800, fontWeight: 500,
          }}>
            {t("hero.subheading")}
          </p>

          <div style={{ flex: 1, minHeight: 40 }} />

          <div className="hp-hero-btns" style={{ display: "flex", gap: 12, alignSelf: "flex-end", marginRight: 60, flexWrap: "wrap" }}>
            <Link href="/lookup" style={{
              padding: "16px 36px", borderRadius: 24, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 6px 24px rgba(27,42,34,.4)",
              textDecoration: "none", display: "inline-block",
            }}>
              {t("hero.ctaPrimary")}
            </Link>
            <a href="#validation" style={{
              padding: "16px 36px", borderRadius: 24, border: "none",
              background: "rgba(255,255,255,.85)", color: "var(--dark)",
              fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600,
              cursor: "pointer", backdropFilter: "blur(8px)",
              boxShadow: "0 4px 16px rgba(0,0,0,.12)",
              textDecoration: "none", display: "inline-block",
            }}>
              {t("hero.ctaSecondary")}
            </a>
          </div>
        </div>
      </div>

      {/* ═══ TRUST BAR ═══ */}
      <div className="hp-trust-bar" style={{
        display: "flex", justifyContent: "center", padding: "28px 40px",
        background: "var(--dark)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 15, fontWeight: 700, letterSpacing: 2.5,
            color: "#fff", marginBottom: 10,
          }}>
            {t("trustBar.corridors")}
          </div>
          <div style={{ fontSize: 32, letterSpacing: 8 }}>
            🇨🇮 🇬🇭 🇳🇬 🇰🇪 🇹🇿 🇪🇹{" "}
            <span style={{ color: "#fff", fontSize: 24 }}>&rarr;</span>{" "}
            🇪🇺 🇬🇧 🇩🇪 🇫🇷 🇮🇹 🇨🇭 🇺🇸 🇨🇦 🇹🇷
          </div>
        </div>
      </div>

      {/* ═══ COST OF GETTING IT WRONG ═══ */}
      <div className="hp-cost-section" style={{
        background: "#fff", borderRadius: 24, margin: "0 40px",
        padding: 60, boxShadow: "var(--shd)",
      }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          {t("costSection.heading")}
        </h2>
        <p style={{ fontSize: 16, color: "var(--t2)", marginBottom: 40, maxWidth: 500 }}>
          {t("costSection.subheading")}
        </p>

        <div className="hp-cost-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          {(["demurrage", "bankFee", "isfPenalty", "cascadeCost"] as const).map((key) => (
            <div key={key} style={{ background: "var(--bg)", borderRadius: "var(--r)", padding: 24, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>{t(`costSection.stats.${key}.value`)}</div>
              <div style={{ fontSize: 15, color: "var(--t3)", lineHeight: 1.5 }}>{t(`costSection.stats.${key}.description`)}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 15, color: "var(--t2)", lineHeight: 1.8 }}>
          <span dangerouslySetInnerHTML={{ __html: t("costSection.summary", { amount: t("costSection.summaryAmount") }) }} />{" "}
          <span style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 700, color: "var(--sage)" }}>{t("costSection.summaryValidationCost")}</span>.
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          {t("howItWorks.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          {t("howItWorks.subheading")}
        </p>

        <div className="hp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {(["step1", "step2", "step3"] as const).map((stepKey) => (
            <div key={stepKey} style={{ background: "#fff", borderRadius: "var(--r)", padding: 32, boxShadow: "var(--shd)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--sage-l)", letterSpacing: 1, marginBottom: 8 }}>{t(`howItWorks.steps.${stepKey}.label`)}</div>
              <h3 style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{t(`howItWorks.steps.${stepKey}.title`)}</h3>
              <p style={{ fontSize: 15, color: "var(--t3)", lineHeight: 1.7 }}>{t(`howItWorks.steps.${stepKey}.description`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PLATFORM DEMO — Real screenshots ═══ */}
      <div id="validation" className="hp-validation-section" style={{
        background: "var(--dark)", borderRadius: 24, margin: "0 40px",
        padding: 60, color: "#fff",
      }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8, color: "#fff" }}>
          {t("demo.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", marginBottom: 32, maxWidth: 600 }}>
          {t("demo.subheading")}
        </p>

        {/* Tab bar */}
        <div className="hp-demo-tabs" style={{
          display: "flex", gap: 4, marginBottom: 24, overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}>
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

        {/* Screenshot panel */}
        <div key={activeDemo} className="hp-demo-panel" style={{
          borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(255,255,255,.1)",
          animation: "demoFadeIn .4s ease both",
          background: "#1a1a1c",
        }}>
          <img
            src={["/demo/compliance.png", "/demo/trades.png", "/demo/lc-check.png", "/demo/inbox.png"][activeDemo]}
            alt={[t("demo.tabs.check"), t("demo.tabs.dashboard"), t("demo.tabs.lcVerify"), t("demo.tabs.inbox")][activeDemo]}
            style={{
              width: "100%", maxHeight: "60vh", objectFit: "cover", objectPosition: "top left", display: "block",
            }}
          />
        </div>

        {/* Progress dots */}
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
            <div key={plan.key} style={{
              background: plan.featured ? "var(--dark)" : "#fff",
              color: plan.featured ? "#fff" : "var(--t1)",
              borderRadius: "var(--r)", padding: 32,
              boxShadow: plan.featured ? "0 8px 32px rgba(0,0,0,.15)" : "var(--shd)",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 15, fontWeight: 600, letterSpacing: 1,
                color: plan.featured ? "var(--sage-l)" : "var(--t3)",
                marginBottom: 8, textTransform: "uppercase",
              }}>{t(`pricingSection.plans.${plan.key}.name`)}</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{t(`pricingSection.plans.${plan.key}.price`)}</div>
              <div style={{
                fontSize: 15, color: plan.featured ? "rgba(255,255,255,.8)" : "var(--t3)",
                marginBottom: 20,
              }}>{t(`pricingSection.plans.${plan.key}.per`)}</div>
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
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <div className="hp-cta" style={{ textAlign: "center", padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 12 }}>
          {t("finalCta.heading")}
        </h2>
        <p style={{ fontSize: 15, color: "var(--t3)", marginBottom: 28 }}>
          {t("finalCta.subheading")}
        </p>
        <Link href="/lookup" style={{
          padding: "16px 36px", borderRadius: 24, border: "none",
          background: "var(--sage)", color: "#fff",
          fontFamily: "var(--fb)", fontSize: 15, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 6px 24px rgba(27,42,34,.4)",
          textDecoration: "none", display: "inline-block",
        }}>
          {t("finalCta.button")}
        </Link>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: "var(--dark)", padding: "48px 60px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        color: "rgba(255,255,255,.8)", fontSize: 15,
        flexWrap: "wrap", gap: 40,
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
        .hp-demo-tabs::-webkit-scrollbar { display: none; }
        .hp-demo-tabs { scrollbar-width: none; }

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
            min-height: 240px !important;
          }
          .hp-page .hp-hero-inner h1 { max-width: 100% !important; }
          .hp-page .hp-hero-inner p { font-size: 15px !important; margin-bottom: 20px !important; }
          .hp-page .hp-hero-btns {
            align-self: stretch !important;
            margin-right: 0 !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .hp-page .hp-hero-btns a {
            text-align: center !important;
            padding: 14px 24px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* Trust bar */
          .hp-page .hp-trust-bar {
            padding: 20px 16px !important;
          }
          .hp-page .hp-trust-bar > div > div:first-child {
            font-size: 15px !important;
            letter-spacing: 1.5px !important;
          }
          .hp-page .hp-trust-bar > div > div:last-child {
            font-size: 24px !important;
            letter-spacing: 4px !important;
          }

          /* Cost section */
          .hp-page .hp-cost-section {
            margin: 0 12px !important;
            padding: 28px 16px !important;
            border-radius: 16px !important;
            overflow: hidden !important;
          }
          .hp-cost-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .hp-cost-grid > div { padding: 14px 10px !important; word-break: break-word !important; }

          /* Steps */
          .hp-steps-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .hp-steps-grid > div { padding: 20px !important; }

          /* Demo / Validation section */
          .hp-page .hp-validation-section {
            margin: 0 12px !important;
            padding: 28px 16px !important;
            border-radius: 16px !important;
          }
          .hp-demo-panel { padding: 0 !important; }

          /* Pricing */
          .hp-pricing-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .hp-pricing-grid > div { padding: 24px !important; }

          /* Final CTA */
          .hp-page .hp-cta { padding: 40px 16px !important; }

          /* Footer columns */
          .hp-page footer > div:last-child {
            flex-direction: column !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
