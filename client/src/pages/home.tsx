import { Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/* ═══════════════════════════════════════════
   TapTrao Landing Page — Warm Cream
   Matches: taptrao-landing-FINAL (2).html
   ═══════════════════════════════════════════ */

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  usePageTitle("TapTrao — Trade Compliance for Commodity Traders");

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
          <img src="/logo.png" alt="TapTrao" style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover" }} />
          <span style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 600, color: "var(--t1)" }}>TapTrao</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex" style={{ gap: 28 }}>
          <a href="#how" style={{ fontSize: 13, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>How It Works</a>
          <a href="#validation" style={{ fontSize: 13, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>Validation</a>
          <a href="#pricing" style={{ fontSize: 13, color: "var(--t2)", textDecoration: "none", fontWeight: 500 }}>Pricing</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 12 }}>
          {isAuthenticated ? (
            <Link href="/trades" style={{
              padding: "9px 22px", borderRadius: 20, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 14, fontWeight: 600,
              textDecoration: "none", cursor: "pointer",
            }}>
              My Trades
            </Link>
          ) : (
            <Link href="/lookup" style={{
              padding: "9px 22px", borderRadius: 20, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 14, fontWeight: 600,
              textDecoration: "none", cursor: "pointer",
            }}>
              Free Compliance Check
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
          <a href="#how" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>How It Works</a>
          <a href="#validation" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>Validation</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 16, color: "var(--t1)", textDecoration: "none", fontWeight: 500 }}>Pricing</a>
          <div style={{ borderTop: "1px solid var(--bg)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {isAuthenticated ? (
              <Link href="/trades" onClick={() => setMobileMenuOpen(false)} style={{
                padding: "12px 24px", borderRadius: 20, background: "var(--sage)", color: "#fff",
                textAlign: "center", fontWeight: 600, textDecoration: "none", fontSize: 14,
              }}>My Trades</Link>
            ) : (
              <Link href="/lookup" onClick={() => setMobileMenuOpen(false)} style={{
                padding: "12px 24px", borderRadius: 20, background: "var(--sage)", color: "#fff",
                textAlign: "center", fontWeight: 600, textDecoration: "none", fontSize: 14,
              }}>Free Compliance Check</Link>
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
            De-risk your next shipment before spending.
          </h1>
          <p style={{
            fontSize: 19, color: "rgba(255,255,255,.9)", lineHeight: 1.7,
            marginBottom: 32, maxWidth: 800, fontWeight: 500,
          }}>
            Every document. Every regulation. Every corridor. Checked before you commit.
          </p>

          <div style={{ flex: 1, minHeight: 40 }} />

          <div className="hp-hero-btns" style={{ display: "flex", gap: 12, alignSelf: "flex-end", marginRight: 60, flexWrap: "wrap" }}>
            <Link href="/lookup" style={{
              padding: "16px 36px", borderRadius: 24, border: "none",
              background: "var(--sage)", color: "#fff",
              fontFamily: "var(--fb)", fontSize: 14, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 6px 24px rgba(27,42,34,.4)",
              textDecoration: "none", display: "inline-block",
            }}>
              Free Compliance Check &rarr;
            </Link>
            <a href="#validation" style={{
              padding: "16px 36px", borderRadius: 24, border: "none",
              background: "rgba(255,255,255,.85)", color: "var(--dark)",
              fontFamily: "var(--fb)", fontSize: 14, fontWeight: 600,
              cursor: "pointer", backdropFilter: "blur(8px)",
              boxShadow: "0 4px 16px rgba(0,0,0,.12)",
              textDecoration: "none", display: "inline-block",
            }}>
              See Full Validation
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
            fontSize: 14, fontWeight: 700, letterSpacing: 2.5,
            color: "#fff", marginBottom: 10,
          }}>
            AFRICA &rarr; EU &middot; UK &middot; USA &middot; CANADA &middot; T&Uuml;RKIYE &middot; SWITZERLAND
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
          The cost of getting it wrong
        </h2>
        <p style={{ fontSize: 16, color: "var(--t2)", marginBottom: 40, maxWidth: 500 }}>
          A single document issue can cascade into thousands in losses.
        </p>

        <div className="hp-cost-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 40 }}>
          {[
            { val: "$75\u2013$300/day", desc: "Demurrage while documents are on hold at port" },
            { val: "$95\u2013$160", desc: "Bank fee for one LC discrepancy" },
            { val: "$5,000", desc: "US ISF late-filing penalty per violation" },
            { val: "$1,500+", desc: "Cascade cost from one missing document" },
          ].map((c) => (
            <div key={c.val} style={{ background: "var(--bg)", borderRadius: "var(--r)", padding: 24, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 700, color: "var(--red)", marginBottom: 6 }}>{c.val}</div>
              <div style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.5 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", fontSize: 15, color: "var(--t2)", lineHeight: 1.8 }}>
          A single bank rejection costs <b style={{ color: "var(--t1)" }}>$1,500 or more</b>. Full validation costs{" "}
          <span style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 700, color: "var(--sage)" }}>$110</span>.
        </div>
      </div>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          How It Works
        </h2>
        <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          Knowledge. Action. Confidence.
        </p>

        <div className="hp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            {
              num: "STEP 1", title: "Knowledge",
              desc: "Enter your origin, destination, and commodity. TapTrao maps every regulation, required document, and compliance obligation for your corridor.",
            },
            {
              num: "STEP 2", title: "Action",
              desc: "Upload your trade documents. Our engine cross-validates every document against every other, checks LC terms, and flags mismatches before submission.",
            },
            {
              num: "STEP 3", title: "Confidence",
              desc: "Receive your Shield report with a compliance score, issue breakdown, and fix recommendations. Submit to the bank with confidence.",
            },
          ].map((s) => (
            <div key={s.num} style={{ background: "#fff", borderRadius: "var(--r)", padding: 32, boxShadow: "var(--shd)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sage-l)", letterSpacing: 1, marginBottom: 8 }}>{s.num}</div>
              <h3 style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "var(--t3)", lineHeight: 1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ VALIDATION PREVIEW ═══ */}
      <div id="validation" className="hp-validation-section" style={{
        background: "var(--dark)", borderRadius: 24, margin: "0 40px",
        padding: 60, color: "#fff",
      }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8, color: "#fff" }}>
          Cross-Validation Report
        </h2>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,.8)", marginBottom: 40, maxWidth: 500 }}>
          Every document checked against every other. Every regulation mapped.
        </p>

        <div style={{
          background: "rgba(255,255,255,.06)", borderRadius: "var(--r)",
          padding: 28, maxWidth: 500,
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 600 }}>
                🥜 Raw Cashew &middot; CI &rarr; UK
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>TT-2026-a3f9c1</div>
            </div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 32, fontWeight: 700, color: "var(--sage-l)" }}>87</div>
          </div>

          {/* Risk tags */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}><span style={{ color: "var(--sage-l)", fontWeight: 600 }}>LOW</span> Origin</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}><span style={{ color: "var(--sage-l)", fontWeight: 600 }}>LOW</span> Commodity</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}><span style={{ color: "var(--amber)", fontWeight: 600 }}>MED</span> Regulatory</span>
          </div>

          {/* Check items */}
          <div className="hp-check-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { icon: "\u2713", label: "Certificate of Origin", status: "pass" },
              { icon: "\u2713", label: "Phytosanitary Certificate", status: "pass" },
              { icon: "\u2713", label: "Bill of Lading", status: "pass" },
              { icon: "!", label: "Insurance \u2014 below 110% CIF", status: "warn" },
              { icon: "\u2717", label: "Weight Certificate \u2014 missing", status: "fail" },
              { icon: "\u2713", label: "Fumigation Certificate", status: "pass" },
            ].map((c) => {
              const bg = c.status === "pass" ? "rgba(109,184,154,.1)"
                : c.status === "warn" ? "rgba(196,136,42,.1)"
                : "rgba(196,78,58,.1)";
              const color = c.status === "pass" ? "var(--sage-l)"
                : c.status === "warn" ? "var(--amber)"
                : "var(--red)";
              return (
                <div key={c.label} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, background: bg, color,
                }}>
                  {c.icon} {c.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" style={{ padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 8 }}>
          Pricing
        </h2>
        <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 40, maxWidth: 500 }}>
          Simple, transparent. No subscription required.
        </p>

        <div className="hp-pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            {
              name: "Single Check", price: "$110", per: "per trade", featured: false,
              feats: "Full cross-validation\nLC terms check\nEUDR + CBAM screening\nCompliance score + report\nFix recommendations",
            },
            {
              name: "3-Pack", price: "$299", per: "$99.67 per trade", featured: true,
              feats: "Everything in Single Check\nSave $31 per trade\nValid for 12 months\nPriority support",
            },
            {
              name: "5-Pack", price: "$475", per: "$95 per trade", featured: false,
              feats: "Everything in Single Check\nSave $75 total\nValid for 12 months\nPriority support\nDedicated onboarding",
            },
          ].map((plan) => (
            <div key={plan.name} style={{
              background: plan.featured ? "var(--dark)" : "#fff",
              color: plan.featured ? "#fff" : "var(--t1)",
              borderRadius: "var(--r)", padding: 32,
              boxShadow: plan.featured ? "0 8px 32px rgba(0,0,0,.15)" : "var(--shd)",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 13, fontWeight: 600, letterSpacing: 1,
                color: plan.featured ? "var(--sage-l)" : "var(--t3)",
                marginBottom: 8, textTransform: "uppercase",
              }}>{plan.name}</div>
              <div style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{plan.price}</div>
              <div style={{
                fontSize: 13, color: plan.featured ? "rgba(255,255,255,.8)" : "var(--t3)",
                marginBottom: 20,
              }}>{plan.per}</div>
              <div style={{
                fontSize: 14, color: plan.featured ? "rgba(255,255,255,.85)" : "var(--t2)",
                lineHeight: 2, textAlign: "left", marginBottom: 20,
              }}>
                {plan.feats.split("\n").map((f) => <div key={f}>{f}</div>)}
              </div>
              <Link href="/lookup" style={{
                display: "block", width: "100%", padding: 12, borderRadius: 20,
                border: "none", fontFamily: "var(--fb)", fontSize: 13, fontWeight: 600,
                cursor: "pointer", textDecoration: "none",
                background: plan.featured ? "var(--sage-l)" : "var(--bg)",
                color: plan.featured ? "var(--dark)" : "var(--t1)",
                textAlign: "center",
              }}>
                {plan.featured ? "Best Value \u2192" : "Get Started"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <div className="hp-cta" style={{ textAlign: "center", padding: "80px 60px" }}>
        <h2 style={{ fontFamily: "var(--fd)", fontSize: 36, fontWeight: 600, marginBottom: 12 }}>
          Ready to de-risk your next shipment?
        </h2>
        <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 28 }}>
          Start with a free compliance check. No account required.
        </p>
        <Link href="/lookup" style={{
          padding: "16px 36px", borderRadius: 24, border: "none",
          background: "var(--sage)", color: "#fff",
          fontFamily: "var(--fb)", fontSize: 14, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 6px 24px rgba(27,42,34,.4)",
          textDecoration: "none", display: "inline-block",
        }}>
          Free Compliance Check &rarr;
        </Link>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        background: "var(--dark)", padding: "48px 60px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        color: "rgba(255,255,255,.8)", fontSize: 14,
        flexWrap: "wrap", gap: 40,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <img src="/logo.png" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
            <span style={{ fontFamily: "var(--fd)", fontSize: 14, color: "#fff", fontWeight: 600 }}>TapTrao</span>
          </div>
          <div>Trade compliance for African commodity corridors.</div>
          <div style={{ marginTop: 12 }}>&copy; 2026 Fatrao Limited. All rights reserved.</div>
        </div>

        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.2)", marginBottom: 10, textTransform: "uppercase" }}>Product</h4>
            <Link href="/lookup" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>Free Check</Link>
            <Link href="/pricing" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>Pricing</Link>
            <Link href="/lc-check" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>LC Check</Link>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.2)", marginBottom: 10, textTransform: "uppercase" }}>Company</h4>
            <a href="mailto:hello@taptrao.com" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>Contact</a>
          </div>
          <div>
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,.2)", marginBottom: 10, textTransform: "uppercase" }}>Legal</h4>
            <Link href="/privacy-policy" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>Privacy Policy</Link>
            <Link href="/terms-of-service" style={{ display: "block", fontSize: 14, color: "rgba(255,255,255,.8)", textDecoration: "none", marginBottom: 6 }}>Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>

      {/* Responsive overrides for mobile */}
      <style>{`
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
            font-size: 11px !important;
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

          /* Validation section */
          .hp-page .hp-validation-section {
            margin: 0 12px !important;
            padding: 28px 16px !important;
            border-radius: 16px !important;
          }
          .hp-page .hp-validation-section .hp-check-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
          .hp-page .hp-validation-section > div {
            max-width: 100% !important;
            padding: 20px 16px !important;
          }

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
