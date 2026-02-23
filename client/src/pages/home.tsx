import { Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X } from "lucide-react";

const commodities = [
  "Coffee", "Cocoa Beans", "Gold", "Copper Ore", "Timber", "Cotton",
  "Palm Oil", "Cobalt", "Shea Butter", "Iron Ore", "Rubber", "Tea",
  "Groundnuts", "Coltan", "Vanilla", "Cashew Nuts", "Sesame Seeds",
  "Rough Diamonds", "Tuna",
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  usePageTitle(
    "Know your compliance before you commit",
    "Trade compliance for commodity traders sourcing from Africa. No ERP. No broker. No guesswork."
  );

  return (
    <div className="page-wrap" style={{ fontFamily: "var(--fb)", background: "linear-gradient(180deg, #0e4e45 0%, #104f47 5%, #14574a 10%, #1c6352 15%, #216354 20%, #2f725f 25%, #347161 30%, #3f7d6a 35%, #468271 40%, #498573 45%, #578d7d 50%, #619888 55%, #6a9f8d 60%, #7faa9b 65%, #87b0a2 68%, #8db3a6 71%, #94b5ab 74%, #9cbbb2 77%, #a6c3ba 80%, #bdd3cb 85%, #c7d9d2 88%, #e2e7e6 93%, #f2f2f2 97%, #f3f3f3 100%)", color: "#fff", WebkitFontSmoothing: "antialiased" }}>

      {/* ── NAV ── */}
      <div className="nav-bar" data-testid="nav-header">
        <Link href="/">
          <span className="nav-l" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textDecoration: "none" }} data-testid="text-landing-logo">
            <img src="/taptrao-green-logo.png" alt="TapTrao" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", boxShadow: "0 0 16px rgba(74,140,111,.4)" }} />
            <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>TapTrao</span>
          </span>
        </Link>
        <div className="nav-c" data-testid="nav-landing-desktop" style={{ display: "flex", gap: 28 }}>
          <a href="#how" style={{ textDecoration: "none", fontSize: 13.5, color: "rgba(255,255,255,.4)", fontWeight: 500, transition: ".2s" }}>How it works</a>
          <a href="#modules" style={{ textDecoration: "none", fontSize: 13.5, color: "rgba(255,255,255,.4)", fontWeight: 500, transition: ".2s" }}>Modules</a>
          <a href="#lc" style={{ textDecoration: "none", fontSize: 13.5, color: "rgba(255,255,255,.4)", fontWeight: 500, transition: ".2s" }}>LC Check</a>
          <a href="#pricing" style={{ textDecoration: "none", fontSize: 13.5, color: "rgba(255,255,255,.4)", fontWeight: 500, transition: ".2s" }}>Pricing</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="md:block hidden" style={{ background: "none", border: 0, color: "rgba(255,255,255,.4)", fontFamily: "var(--fb)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }} data-testid="button-sign-in">Sign in</button>
          <Link href="/lookup">
            <span style={{ background: "var(--green)", color: "#000", fontFamily: "var(--fb)", fontSize: 13, fontWeight: 700, padding: "9px 20px", borderRadius: 50, cursor: "pointer", boxShadow: "0 4px 18px rgba(74,140,111,.4)", display: "inline-block" }} data-testid="button-nav-start-free">Start Free →</span>
          </Link>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }} data-testid="button-landing-mobile-menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-drawer" data-testid="nav-mobile-dropdown">
          <Link href="/lookup"><span onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, cursor: "pointer", padding: "12px 16px", display: "flex", alignItems: "center", minHeight: 44 }}>Compliance Lookup</span></Link>
          <Link href="/lc-check"><span onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, cursor: "pointer", padding: "12px 16px", display: "flex", alignItems: "center", minHeight: 44 }}>LC Checker</span></Link>
          <Link href="/pricing"><span onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, cursor: "pointer", padding: "12px 16px", display: "flex", alignItems: "center", minHeight: 44 }}>Pricing</span></Link>
          <div style={{ marginTop: 8, padding: "0 16px" }}>
            <Link href="/lookup">
              <span onClick={() => setMobileMenuOpen(false)} style={{ background: "#4a8c6f", color: "white", padding: "0 20px", borderRadius: 8, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", height: 48, width: "100%" }} data-testid="button-mobile-start-free">Start free lookup</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO BOX ── */}
      <div className="hero-box" data-testid="section-hero">
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.08)", backdropFilter: "blur(6px)", borderRadius: 24, padding: "6px 16px", marginBottom: 28, fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.6)" }} className="home-hero-badge" data-testid="badge-hero">
            <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 8px var(--green)", display: "inline-block" }} /> Trade compliance for commodity traders
          </div>
          <h1 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(38px,5.5vw,64px)", lineHeight: 1.08, letterSpacing: "-0.02em", color: "#fff", marginBottom: 20, marginTop: 0 }} className="home-hero-title" data-testid="text-hero-title">
            Know your compliance<br />before you <em style={{ fontStyle: "normal", color: "var(--green)" }}>commit.</em>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: "rgba(255,255,255,.45)", marginBottom: 36 }} className="home-hero-subtitle" data-testid="text-hero-subtitle">
            The first standalone trade compliance tool for commodity traders sourcing from Africa. <strong style={{ color: "rgba(255,255,255,.75)", fontWeight: 600 }}>No ERP. No broker. No guesswork.</strong>
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 28 }} className="home-hero-buttons">
            <Link href="/lookup">
              <span className="home-hero-primary" style={{ background: "var(--green)", color: "#000", fontFamily: "var(--fb)", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 50, cursor: "pointer", boxShadow: "0 4px 24px rgba(74,140,111,.45)", display: "inline-block" }} data-testid="button-hero-free-lookup">Run Free Lookup →</span>
            </Link>
            <a href="#how">
              <span className="home-hero-secondary" style={{ background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", fontFamily: "var(--fb)", fontSize: 15, fontWeight: 600, padding: "14px 28px", borderRadius: 50, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", display: "inline-block" }} data-testid="button-hero-how-it-works">See how it works</span>
            </a>
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", marginBottom: 20 }}>
            First lookup free · No credit card required · Results in seconds
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", fontWeight: 600 }}>Sourcing from</span>
            {["🇨🇮","🇬🇭","🇳🇬","🇪🇹","🇰🇪","🇹🇿","🇿🇦","🇸🇳","🇨🇩","🇨🇲","🇲🇬","🇲🇿","🇺🇬","🇷🇼","🇲🇱","🇧🇫","🇬🇳","🇿🇲"].map((f, i) => (
              <span key={i} style={{ fontSize: 16 }}>{f}</span>
            ))}
            <span style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", fontWeight: 600 }}>and more</span>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar">
        <span>🌍 ECOWAS · AfCFTA · EAC · SADC</span><div className="sep" /><span>📄 UCP 600 · ISBP 745</span><div className="sep" /><span>🌱 EUDR · CBAM · CSDDD · Kimberley</span><div className="sep" /><span>⚡ Pay-per-check from $19.99</span><div className="sep" /><span>🔒 No ERP required</span>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="section">
        <div className="section-inner">
          <div className="stat-grid">
            <div className="stat-card glow-green">
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12, position: "relative", zIndex: 1, background: "rgba(74,140,111,.1)" }}>📦</div>
              <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Commodities Covered</div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6, position: "relative", zIndex: 1 }}>154 <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 400, fontFamily: "var(--fb)" }}>types</span></div>
              <div style={{ fontSize: 11.5, position: "relative", zIndex: 1, color: "var(--txt3)" }}><span style={{ color: "var(--green)", fontWeight: 600 }}>↑ Full database</span> at launch</div>
            </div>
            <div className="stat-card glow-amber">
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12, position: "relative", zIndex: 1, background: "rgba(234,139,67,.1)" }}>💰</div>
              <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Bank Amendment Fee</div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6, position: "relative", zIndex: 1 }}><sup style={{ fontSize: 13, fontWeight: 500, opacity: .5, verticalAlign: "super", marginRight: 1 }}>$</sup>150–500</div>
              <div style={{ fontSize: 11.5, position: "relative", zIndex: 1, color: "var(--txt3)" }}><span style={{ color: "var(--red)", fontWeight: 600 }}>⚠ Per discrepancy</span> what's at stake</div>
            </div>
            <div className="stat-card glow-teal">
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginBottom: 12, position: "relative", zIndex: 1, background: "rgba(46,134,98,.1)" }}>📋</div>
              <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Regulations Mapped</div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "var(--txt)", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6, position: "relative", zIndex: 1 }}>40+ <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 400, fontFamily: "var(--fb)" }}>rules</span></div>
              <div style={{ fontSize: 11.5, position: "relative", zIndex: 1, color: "var(--txt3)" }}><span style={{ color: "var(--green)", fontWeight: 600 }}>↑ EUDR · CBAM</span> + more</div>
            </div>
            <div className="stat-card cta">
              <div className="animate-breathe" style={{ position: "absolute", bottom: -20, right: -20, width: 130, height: 130, background: "radial-gradient(circle,rgba(74,140,111,.28) 0%,rgba(74,140,111,.06) 50%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
              <div style={{ fontFamily: "var(--fh)", fontSize: 36, fontWeight: 800, color: "var(--green)", letterSpacing: "-0.02em", position: "relative", zIndex: 1, marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", position: "relative", zIndex: 1, marginBottom: 4 }}>Pre-Shipment Check with <strong style={{ color: "var(--green)" }}>AI</strong></div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginBottom: 2 }}>No card · No sign-up</div>
              <Link href="/lookup">
                <span style={{ display: "inline-block", background: "var(--green)", color: "#000", fontFamily: "var(--fb)", fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 10, cursor: "pointer", position: "relative", zIndex: 1, boxShadow: "0 0 16px rgba(74,140,111,.3)", marginTop: 10 }}>Run Free Check ✦</span>
              </Link>
            </div>
          </div>

          {/* FREE BANNER */}
          <div className="free-banner">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>✦ No account needed</div>
              <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(24px,3vw,36px)", color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 12 }}>Run your first<br />lookup free.</h2>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,.35)", maxWidth: 460 }}>Enter commodity + origin + destination. Get the full compliance picture in seconds — duty rates, required documents, regulatory triggers, STOP warnings. No credit card. No sign-up.</p>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 800, fontSize: 64, color: "var(--green)", lineHeight: 1 }}>$0</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginBottom: 14 }}>first lookup</div>
              <Link href="/lookup">
                <span style={{ background: "var(--green)", color: "#000", fontFamily: "var(--fb)", fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: 50, cursor: "pointer", boxShadow: "0 4px 24px rgba(74,140,111,.45)", display: "inline-block" }}>Try it now →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...commodities, ...commodities].map((c, i) => (
            <span key={`${c}-${i}`} style={{ display: "contents" }}>
              <span style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 18, whiteSpace: "nowrap", color: i % 2 === 0 ? "var(--green)" : "rgba(255,255,255,.12)" }}>{c}</span>
              <span style={{ color: "rgba(255,255,255,.06)", fontSize: 18 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="section" id="how" data-testid="section-how-it-works">
        <div className="section-inner">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>How it works</div>
          <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(26px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 8 }}>Three inputs. <em style={{ fontStyle: "normal", color: "var(--green)" }}>Complete picture.</em></div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)", lineHeight: 1.6, maxWidth: 460, marginBottom: 40 }}>No ERP required. No broker needed. Just answers.</div>
          <div className="how-grid">
            {[
              { num: "01", icon: "◎", title: "Define your corridor", desc: "Select the origin country, destination market, and commodity from our database of 154 commodities across 18 African origins." },
              { num: "02", icon: "📊", title: "Review compliance requirements", desc: "Receive duty rates, document checklists, regulatory triggers, SPS requirements, and stop-flag warnings — all in one view." },
              { num: "03", icon: "✅", title: "Proceed with confidence", desc: "Export results, generate supplier instructions, validate LC documents against UCP 600 rules, and download audit-ready TwinLog PDFs." },
            ].map((s, i) => (
              <div key={s.num} className="how-card" data-testid={`step-${i + 1}`}>
                <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 42, color: "rgba(74,140,111,.15)", lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                <div style={{ fontSize: 22, marginBottom: 14 }}>{s.icon}</div>
                <h3 style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 16, color: "#fff", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,.35)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODULES ── */}
      <div className="section" id="modules" data-testid="section-capabilities">
        <div className="section-inner">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>What's included</div>
          <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(26px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 8 }}>Six modules. <em style={{ fontStyle: "normal", color: "var(--green)" }}>One engine.</em></div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)", lineHeight: 1.6, maxWidth: 460, marginBottom: 40 }}>Every tool a commodity trader needs. Pay per check. No subscription required to start.</div>
          <div className="mod-grid">
            {[
              { icon: "◎", title: "Compliance Lookup", price: "$4.99 / lookup", priceClass: "green", desc: "Full regulatory checklist, duty rates, ESG triggers, supplier brief, and risk flags in one report.", tags: ["ECOWAS","AfCFTA","EUDR","SPS"] },
              { icon: "📄", title: "LC Document Checker", price: "$2.99 / check", priceClass: "green", desc: "AI cross-checks every field against UCP 600 and ISBP 745. Flags bank rejections before they happen.", tags: ["UCP 600","ISBP 745","Multilingual"] },
              { icon: "📋", title: "Trade Templates", price: "Free", priceClass: "free", desc: "Save successful trades as reusable templates. Update quantities, regenerate all documents automatically.", tags: ["Corridors","No ERP"] },
              { icon: "🌱", title: "ESG Due Diligence", price: "Included", priceClass: "green", desc: "EUDR geolocation, deforestation proof, UKTR register, conflict minerals. Auto-generates statements.", tags: ["EUDR","Kimberley","OECD DDG"] },
              { icon: "⚠️", title: "Risk Dashboard", price: "$9.99 / scenario", priceClass: "amber", desc: "Pre-trade risk scores. Post-rejection decision trees — appeal, return, destroy, insurance, duty refund.", tags: ["Demurrage","Insurance","RASFF"] },
              { icon: "◆", title: "Regulatory Monitoring", price: "$29 / mo", priceClass: "amber", desc: "Alerts when regulations change for your corridors. AEO tracker. HMRC archive. EUDR annual reports.", tags: ["WTO ePing","UK Tariff API","AEO"] },
            ].map((m, i) => (
              <div key={m.title} className="mod-card" data-testid={`card-capability-${i}`}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{m.icon}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50, whiteSpace: "nowrap", background: m.priceClass === "amber" ? "rgba(234,139,67,.12)" : m.priceClass === "free" ? "rgba(74,140,111,.2)" : "rgba(74,140,111,.12)", color: m.priceClass === "amber" ? "var(--amber)" : "var(--green)" }}>{m.price}</span>
                </div>
                <h3 style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 17, color: "#fff", marginBottom: 6 }}>{m.title}</h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "rgba(255,255,255,.35)", marginBottom: 14 }}>{m.desc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {m.tags.map(t => <span key={t} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.3)", fontWeight: 500 }}>{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── LC DOCUMENT CHECK ── */}
      <div className="section" id="lc" style={{ paddingTop: 40 }}>
        <div className="section-inner">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", color: "var(--green)", marginBottom: 12 }}>LC Document Check</div>
          <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(26px,3.5vw,40px)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "#fff", marginBottom: 8 }}>Just need to check <em style={{ fontStyle: "normal", color: "var(--green)" }}>an LC?</em></div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.35)", lineHeight: 1.6, maxWidth: 460, marginBottom: 40 }}>Standalone LC checking without buying a full trade credit.</div>
          <div className="lc-cards">
            <div className="lc-card primary">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 16 }}>📄</span><span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>LC Document Check</span></div>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 38, color: "#fff", marginBottom: 4 }}>$19.99 <em style={{ fontStyle: "normal", fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,.3)", fontFamily: "var(--fb)" }}>one-time</em></div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.6, marginBottom: 16 }}>Validate supplier documents against your Letter of Credit (UCP 600) before submitting to the bank.</p>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <li style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.7)" }}><span style={{ fontSize: 13, color: "var(--green)" }}>✔</span> First LC submission check</li>
                <li style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.7)" }}><span style={{ fontSize: 13, color: "var(--green)" }}>✔</span> Discrepancy summary & fix suggestions</li>
                <li style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.2)" }}><span style={{ fontSize: 13, color: "rgba(255,255,255,.15)" }}>✕</span> Compliance check</li>
                <li style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.2)" }}><span style={{ fontSize: 13, color: "rgba(255,255,255,.15)" }}>✕</span> Document checklist</li>
              </ul>
              <div style={{ fontSize: 12, color: "var(--green)", fontStyle: "italic", marginBottom: 14 }}>Included free with every trade credit</div>
              <Link href="/lc-check"><span style={{ background: "rgba(255,255,255,.06)", color: "#fff", fontFamily: "var(--fb)", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }} data-testid="button-pricing-lc">📄 Check LC only</span></Link>
            </div>
            <div className="lc-card secondary">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 16 }}>🔄</span><span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>LC corrections (if documents are updated)</span></div>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 38, color: "#fff", marginBottom: 4 }}>$9.99 <em style={{ fontStyle: "normal", fontSize: 15, fontWeight: 400, color: "rgba(255,255,255,.3)", fontFamily: "var(--fb)" }}>per re-check</em></div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>If your supplier corrects documents after the first submission, re-check before resubmitting to the bank.</p>
            </div>
            <div className="lc-card dashed">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><span style={{ fontSize: 16 }}>🏢</span><span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>High-volume or team usage</span></div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.6, marginBottom: 14 }}>Custom pricing, shared credits, API access, and dedicated support.</p>
              <span style={{ background: "rgba(255,255,255,.06)", color: "#fff", fontFamily: "var(--fb)", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>✉ Contact sales</span>
            </div>
            <div className="lc-card dashed" style={{ borderColor: "rgba(74,140,111,.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>🔔</span><span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Pro Monitoring</span>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.4)", marginLeft: 8 }}>Coming soon</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>Regulatory change alerts and compliance calendar. For frequent traders who need always-on monitoring.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div className="section" id="pricing" data-testid="section-pricing">
        <div className="section-inner">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: "clamp(28px,4vw,46px)", color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }} data-testid="text-pricing-heading">Check a shipment<br /><em style={{ fontStyle: "normal", color: "var(--green)" }}>before it costs you.</em></h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.35)", marginBottom: 20 }}>Pay per shipment. No subscriptions. Your first compliance check is free.</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 50, padding: "6px 18px", fontSize: 11, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.2)", marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} /> 0 Trade Credits
            </div>
          </div>

          <div style={{ maxWidth: 700, margin: "0 auto 40px", background: "#1c1c1e", borderRadius: 14, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🎁</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 13, color: "#fff", display: "block", marginBottom: 2 }}>Your first check is free</strong>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>Run one full compliance check for free — no card required. See duties, required documents, and shipment risks.</span>
            </div>
            <Link href="/lookup"><span style={{ background: "rgba(74,140,111,.08)", color: "var(--green)", fontFamily: "var(--fb)", fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(74,140,111,.2)", cursor: "pointer", whiteSpace: "nowrap" }}>🔍 Check shipment risk — Free</span></Link>
          </div>

          <div style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 18, color: "#fff", marginBottom: 6 }}>Trade Packs</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 24 }}>1 credit = 1 shipment checked (compliance + LC). Buy more, save more.</div>

          <div className="packs-grid">
            {[
              { name: "Single Shipment", price: "$24.99", credits: "1 Shipment", per: "$24.99 per shipment", features: ["Full compliance check","Buyer & supplier document checklist","LC document check (first submission)","Risk score & audit trail","Customs declaration data pack (CSV)","Instructions for supplier"], popular: false },
              { name: "3 Shipments", price: "$59.99", credits: "3 Shipments", per: "$20.00 per shipment", features: ["Everything in Single × 3","Save as template","13% discount"], popular: true },
              { name: "10 Shipments", price: "$179", credits: "10 Shipments", per: "$17.90 per shipment", features: ["Everything in 3-pack × 10","Stale-check & refresh","28% discount"], popular: false },
              { name: "25 Shipments", price: "$349", credits: "25 Shipments", per: "$13.96 per shipment", features: ["Everything in 10-pack × 25","Best value for teams","44% discount"], popular: false },
            ].map((p) => (
              <div key={p.name} className={`pack-card${p.popular ? " popular" : ""}`}>
                <div style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 15, color: "#fff", marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 32, color: "#fff", marginBottom: 4 }}>{p.price}</div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--green)", marginBottom: 2 }}>{p.credits}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginBottom: 18 }}>{p.per}</div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 18, display: "flex", flexDirection: "column", gap: 5 }}>
                  {p.features.map(f => <li key={f} style={{ fontSize: 12, color: "rgba(255,255,255,.4)", display: "flex", alignItems: "flex-start", gap: 7 }}><span style={{ color: "var(--green)", fontSize: 12, flexShrink: 0, marginTop: 1 }}>✔</span>{f}</li>)}
                </ul>
                <Link href="/pricing">
                  <span style={{ display: "block", width: "100%", padding: 10, borderRadius: 10, fontFamily: "var(--fb)", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center", ...(p.popular ? { background: "var(--green)", color: "#000", boxShadow: "0 4px 16px rgba(74,140,111,.3)" } : { background: "none", color: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.1)" }) }}>Buy {p.name}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer data-testid="section-footer" style={{ padding: "40px 10px 24px", marginTop: 40 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/taptrao-green-logo.png" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
            <span style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 15, color: "#fff" }} data-testid="text-footer-logo">TapTrao</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }} data-testid="text-footer-copyright">© 2026 FATRAO LIMITED · Trade compliance for commodity traders</div>
          <div style={{ display: "flex", gap: 18 }}>
            <Link href="/privacy-policy"><span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", cursor: "pointer" }} data-testid="link-footer-privacy">Privacy</span></Link>
            <Link href="/terms-of-service"><span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", cursor: "pointer" }} data-testid="link-footer-terms">Terms</span></Link>
            <a href="mailto:hello@taptrao.com" style={{ fontSize: 12, color: "rgba(255,255,255,.3)", textDecoration: "none" }} data-testid="link-footer-email">Contact</a>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)", cursor: "pointer" }}>Docs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
