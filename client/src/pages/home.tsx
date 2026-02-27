import { Link } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/* ═══════════════════════════════════════════
   Interactive Demo — 4-step auto-advancing carousel
   ═══════════════════════════════════════════ */
function DemoSection() {
  const [step, setStep] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const total = 4;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStep(s => (s === total ? 1 : s + 1));
    }, 5000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => startTimer();

  const goTo = (n: number) => {
    setStep(n);
    clearInterval(timerRef.current);
    startTimer();
  };

  const docRow = (dot: string, name: string, auth: string) => (
    <div className="demo-doc-row" key={name}>
      <div className="demo-doc-dot" style={{ background: dot }} />
      <div className="demo-doc-name">{name}</div>
      <div className="demo-doc-auth">{auth}</div>
    </div>
  );

  /* LC check result item */
  const lcItem = (severity: "red" | "amber" | "green", field: string, doc: string, lcVal: string, docVal: string, rule: string) => {
    const colors = { red: "#ef4444", amber: "#F59E0B", green: "#22C55E" };
    return (
      <div className="demo-lc-item" key={field + doc}>
        <div className="demo-doc-dot" style={{ background: colors[severity], marginTop: 4 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.90)", fontWeight: 600 }}>{field}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{doc}</div>
          {severity !== "green" && (
            <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.5 }}>
              <span style={{ color: "rgba(255,255,255,0.35)" }}>LC: </span>
              <span style={{ color: "rgba(255,255,255,0.70)" }}>"{lcVal}"</span>
              <span style={{ color: "rgba(255,255,255,0.35)" }}> · Doc: </span>
              <span style={{ color: "rgba(255,255,255,0.70)" }}>"{docVal}"</span>
            </div>
          )}
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 3, letterSpacing: "0.03em" }}>{rule}</div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        className="demo-browser"
        onMouseEnter={pause}
        onMouseLeave={resume}
      >
        {/* Browser chrome */}
        <div className="demo-chrome">
          <div className="demo-dot red" />
          <div className="demo-dot yellow" />
          <div className="demo-dot green" />
          <div className="demo-url">{step <= 2 ? "taptrao.com/lookup" : step === 3 ? "taptrao.com/lc-check" : "taptrao.com/lookup"}</div>
        </div>

        {/* Step tabs */}
        <div className="demo-tabs">
          <div className={`demo-tab ${step === 1 ? "active" : ""}`} onClick={() => goTo(1)}>① Enter trade</div>
          <div className={`demo-tab ${step === 2 ? "active" : ""}`} onClick={() => goTo(2)}>② Pre-ship report</div>
          <div className={`demo-tab ${step === 3 ? "active" : ""}`} onClick={() => goTo(3)}>③ LC check</div>
          <div className={`demo-tab ${step === 4 ? "active" : ""}`} onClick={() => goTo(4)}>④ Supplier brief</div>
        </div>

        {/* Step content */}
        <div className="demo-content">

          {/* STEP 1 — Enter Trade */}
          {step === 1 && (
            <div>
              <div className="demo-title">Compliance Lookup</div>
              <div className="demo-subtitle">Enter your commodity, origin, and destination</div>

              <div className="demo-grid-3a" style={{ marginBottom: 24 }}>
                {["Commodity", "Origin Country", "Destination"].map((label, i) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div className="demo-label">{label}</div>
                    <div className="demo-input">
                      {["🥜 Raw Cashew Nuts", "🇨🇮 Côte d'Ivoire", "🇬🇧 United Kingdom"][i]}
                    </div>
                  </div>
                ))}
                <button className="demo-run-btn" onClick={() => goTo(2)}>
                  Run Check →
                </button>
              </div>

              <div className="demo-grid-4">
                {[
                  { label: "Lookups Run", value: "12", color: "var(--fern)", sub: "this month" },
                  { label: "LC Checks", value: "4", color: "rgba(255,255,255,0.95)", sub: "discrepancies caught" },
                  { label: "Corridors", value: "3", color: "rgba(255,255,255,0.95)", sub: "saved" },
                  { label: "Alerts", value: "2", color: "#F59E0B", sub: "new this week" },
                ].map(s => (
                  <div key={s.label} className="demo-stat-card">
                    <div className="demo-label" style={{ marginBottom: 8 }}>{s.label}</div>
                    <div className="demo-stat-value" style={{ color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Pre-Shipment Compliance Report */}
          {step === 2 && (
            <div>
              <div className="demo-title">Pre-Shipment Report</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: 600, marginBottom: 20 }}>
                🥜 Raw Cashew Nuts › 🇨🇮 Côte d'Ivoire › 🇬🇧 United Kingdom
              </div>

              <div className="demo-grid-2">
                {/* Buyer docs */}
                <div className="demo-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div className="demo-result-title">Your Side — Buyer</div>
                    <div className="demo-badge" style={{ color: "var(--fern)", background: "var(--app-acapulco-dim)" }}>5 docs</div>
                  </div>
                  {docRow("#22C55E", "Customs Declaration (CDS)", "HMRC")}
                  {docRow("#22C55E", "IPAFFS Pre-notification", "APHA")}
                  {docRow("#22C55E", "Port Health Inspection", "Port Health")}
                  {docRow("#F59E0B", "Import Licence (if >20MT)", "HMRC RPA")}
                  {docRow("#22C55E", "Duty & VAT Payment", "HMRC")}
                </div>

                {/* Supplier docs */}
                <div className="demo-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div className="demo-result-title">Their Side — Supplier</div>
                    <div className="demo-badge" style={{ color: "var(--fern)", background: "var(--app-acapulco-dim)" }}>6 docs</div>
                  </div>
                  {docRow("#22C55E", "Certificate of Origin", "CCA (Conseil Anacarde)")}
                  {docRow("#22C55E", "Phytosanitary Certificate", "LANADA / DPVCQ")}
                  {docRow("#22C55E", "Commercial Invoice", "Supplier")}
                  {docRow("#22C55E", "Bill of Lading", "Shipping Line")}
                  {docRow("#F59E0B", "Aflatoxin Test Report", "Accredited Lab")}
                </div>

                {/* Readiness score */}
                <div className="demo-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div className="demo-result-title">Readiness Score</div>
                    <div className="demo-badge" style={{ color: "#22C55E", background: "rgba(34,197,94,0.10)" }}>Low Risk</div>
                  </div>
                  <div className="demo-score">87</div>
                  <div className="demo-label" style={{ textAlign: "center" }}>Compliance Readiness</div>
                  <div className="demo-progress-bar">
                    <div className="demo-progress-fill" style={{ width: "87%" }} />
                  </div>
                  {[
                    ["Commodity risk", "LOW", "#22C55E"],
                    ["Origin risk", "LOW", "#22C55E"],
                    ["Regulatory complexity", "MEDIUM", "#F59E0B"],
                    ["Known hazards", "AFLATOXIN", "#F59E0B"],
                  ].map(([k, v, c]) => (
                    <div className="demo-risk-row" key={k}>
                      <span className="demo-risk-label">{k}</span>
                      <span className="demo-risk-value" style={{ color: c }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Duty estimate */}
                <div className="demo-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div className="demo-result-title">Duty Estimate</div>
                    <div className="demo-badge" style={{ color: "#22C55E", background: "rgba(34,197,94,0.10)" }}>GSP rate</div>
                  </div>
                  {[
                    ["MFN Tariff Rate", "0%"],
                    ["GSP Preference", "0% (eligible)"],
                    ["UK VAT (Import)", "20%"],
                    ["Est. duty on $50k", "$0"],
                    ["Est. VAT on $50k", "$10,000"],
                  ].map(([k, v]) => (
                    <div className="demo-duty-row" key={k}>
                      <span className="demo-duty-label">{k}</span>
                      <span className="demo-duty-value">{v}</span>
                    </div>
                  ))}
                  <div className="demo-twinlog-ref">
                    <span>TT-2026-a3f9c1</span>
                    <span style={{ color: "var(--fern)" }}>sha256:a3f9c1...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — LC Document Check */}
          {step === 3 && (
            <div>
              <div className="demo-title">LC Document Check</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: 600, marginBottom: 20 }}>
                📄 LC Ref: LC-2026-UK-4821 · 🇨🇮 Côte d'Ivoire → 🇬🇧 United Kingdom
              </div>

              <div className="demo-grid-2">
                {/* Verdict panel */}
                <div className="demo-card" style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 28 }}>⚠️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#F59E0B", fontFamily: "'Clash Display', sans-serif" }}>Discrepancies Found</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>2 critical issues will cause bank rejection. 1 warning to review.</div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#22C55E", fontFamily: "'Clash Display', sans-serif" }}>8</div>
                        <div className="demo-label">matched</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#F59E0B", fontFamily: "'Clash Display', sans-serif" }}>1</div>
                        <div className="demo-label">warning</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444", fontFamily: "'Clash Display', sans-serif" }}>2</div>
                        <div className="demo-label">critical</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Critical discrepancies */}
                <div className="demo-card">
                  <div className="demo-result-title" style={{ color: "#ef4444", marginBottom: 12 }}>🔴 Critical — Bank Will Reject</div>
                  {lcItem("red", "Beneficiary Name", "Commercial Invoice",
                    "Ivory Coast Cashew Company Ltd", "Ivory Coast Cashew Co.",
                    "UCP 600 Art. 14(d) — Name must match exactly"
                  )}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                  {lcItem("red", "Invoice Amount", "Commercial Invoice",
                    "$50,000.00 (max)", "$52,400.00",
                    "UCP 600 Art. 18(b) — Must not exceed LC amount"
                  )}
                </div>

                {/* Warnings + matches */}
                <div className="demo-card">
                  <div className="demo-result-title" style={{ color: "#F59E0B", marginBottom: 12 }}>🟡 Warning</div>
                  {lcItem("amber", "Port of Loading", "Bill of Lading",
                    "Port of Abidjan", "Abidjan Terminal",
                    "UCP 600 Art. 20(a)(ii) — Partial match"
                  )}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
                  <div className="demo-result-title" style={{ color: "#22C55E", marginBottom: 10 }}>🟢 Matched (8)</div>
                  {[
                    "Currency (USD)", "Goods Description", "Shipment Date",
                    "Port of Discharge", "Quantity", "Incoterms (CIF)",
                  ].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                      <div className="demo-doc-dot" style={{ background: "#22C55E" }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.50)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Supplier Brief */}
          {step === 4 && (
            <div>
              <div className="demo-title">Supplier Brief</div>
              <div className="demo-subtitle">Ready to send — email or WhatsApp</div>

              <div className="demo-grid-2b">
                {/* Email format */}
                <div className="demo-email-card">
                  <div className="demo-label" style={{ marginBottom: 12 }}>📧 Email Format</div>
                  <div className="demo-email-body">
                    <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600, marginBottom: 8 }}>
                      Subject: Required documents — Raw Cashew Nuts CIV → UK
                    </div>
                    Dear Supplier,<br /><br />
                    Please provide the following documents:<br /><br />
                    <span style={{ color: "rgba(255,255,255,0.90)" }}>
                      1. Certificate of Origin<br />
                      &nbsp;&nbsp;→ <span style={{ color: "var(--fern)" }}>CCA (Conseil du Coton et de l'Anacarde)</span><br /><br />
                      2. Phytosanitary Certificate<br />
                      &nbsp;&nbsp;→ <span style={{ color: "var(--fern)" }}>LANADA / DPVCQ</span><br /><br />
                      3. Aflatoxin Test Report<br />
                      &nbsp;&nbsp;→ Accredited laboratory
                    </span>
                  </div>
                </div>

                {/* WhatsApp format */}
                <div className="demo-email-card">
                  <div className="demo-label" style={{ marginBottom: 12 }}>💬 WhatsApp Format</div>
                  <div className="demo-whatsapp-body">
                    <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>TapTrao Document Request</span><br />
                    Raw Cashew Nuts · CIV → UK<br /><br />
                    Please send:<br />
                    ✅ Certificate of Origin<br />
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>&nbsp;&nbsp;&nbsp;_(CCA — Conseil Anacarde)_</span><br />
                    ✅ Phytosanitary Certificate<br />
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>&nbsp;&nbsp;&nbsp;_(LANADA/DPVCQ)_</span><br />
                    ✅ Aflatoxin Test Report
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button className="demo-copy-btn">Copy Email</button>
                <button className="demo-copy-btn demo-copy-whatsapp">Copy WhatsApp</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="demo-progress-dots">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            className={`demo-dot-nav ${step === n ? "active" : ""}`}
            onClick={() => goTo(n)}
          />
        ))}
        <button className="demo-next-btn" onClick={() => goTo(step === total ? 1 : step + 1)}>
          {step === total ? "Start over ↺" : "Next step →"}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse-follow spotlight on hero
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const spotlight = document.createElement('div');
    spotlight.className = 'hero-spotlight';
    hero.appendChild(spotlight);

    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      spotlight.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      spotlight.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    };
    hero.addEventListener('mousemove', onMove);
    return () => { hero.removeEventListener('mousemove', onMove); spotlight.remove(); };
  }, []);

  usePageTitle(
    "De-risk your next shipment before spending",
    "The first standalone pre-shipment screening tool for commodity traders importing from Africa. No ERP. No broker. No guesswork."
  );

  const checkoutMutation = useMutation({
    mutationFn: async (pack: string) => {
      const res = await apiRequest("POST", "/api/tokens/checkout", { pack });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  const lcStandaloneMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tokens/lc-standalone-checkout");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });

  return (
    <div className="hp-page">

      {/* ═══ TOP NAV (horizontal bar) ═══ */}
      <div className="top-nav" data-testid="nav-header">
        <div className="top-nav-left">
          <Link href="/">
            <img className="logo-img" src="/logo.png" alt="TapTrao" />
          </Link>
          <Link href="/">
            <span className="logo-text">TapTrao</span>
          </Link>
        </div>

        <div className="top-nav-center" data-testid="nav-landing-desktop">
          <a href="#" className="active">Home</a>
          <a href="#how">How It Works</a>
          <a href="#demo">Demo</a>
          <a href="#pricing">Pricing</a>
          <Link href="/lookup">Commodities</Link>
          <a href="#trust">About</a>
        </div>

        <div className="top-nav-right">
          <Link href="/dashboard">
            <span className="nav-btn-ghost" data-testid="button-sign-in">Log In</span>
          </Link>
          <Link href="/lookup">
            <span className="nav-btn-primary" data-testid="button-nav-start-free">Start Free Check</span>
          </Link>
          {/* Mobile hamburger */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            style={{ display: "none" }}
            data-testid="button-landing-mobile-menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ═══ MAIN BOX (gradient container) ═══ */}
      <div className="main-box">

        {/* ── GREEN HERO ── */}
        <div className="green-hero" ref={heroRef} data-testid="section-hero">
          <div className="hero-badge">
            🛡️ For SME commodity traders importing from Africa into Europe
          </div>

          <h1>
            Pre-Shipment<br />
            <span className="accent">Regulatory Check</span>
          </h1>

          <p className="subtitle">
            De-risk your next shipment before spending. Check EUDR, customs, LC docs
            and trade regulations — in minutes, not weeks.
          </p>

          <div className="hero-cta-row">
            <Link href="/lookup">
              <span className="btn-hero btn-hero-primary" data-testid="button-hero-free-lookup">
                Run Your First Check — Free
              </span>
            </Link>
            <a href="#how">
              <span className="btn-hero btn-hero-secondary" data-testid="button-hero-how-it-works">
                See How It Works
              </span>
            </a>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--hp-text-muted)", marginTop: 10 }}>
            Decision-support tool · Not legal or banking advice
          </div>

          <div className="hero-flags">
            <span>🇬🇭</span><span>🇨🇮</span><span>🇪🇹</span><span>🇰🇪</span>
            <span>🇹🇿</span><span>🇺🇬</span><span>🇳🇬</span><span>🇨🇲</span>
            {" → "}
            <span>🇪🇺</span><span>🇬🇧</span><span>🇩🇪</span><span>🇫🇷</span>
            <span>🇮🇹</span><span>🇪🇸</span><span>🇨🇭</span><span>🇦🇹</span>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="section" id="how" data-testid="section-how-it-works">
          <div className="section-label">How It Works</div>
          <h2>
            Three steps to trade with <span className="accent">confidence</span>
          </h2>
          <p className="section-sub">
            Built to support your compliance workflow. TapTrao runs automated pre-checks so you walk in prepared.
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-icon">📋</div>
              <h3>Enter Your Trade</h3>
              <p>Tell us the commodity, origin country, destination, and value. Takes under 2 minutes.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-icon">🔍</div>
              <h3>We Run Automated Pre-Checks</h3>
              <p>Shipment data screened against EUDR requirements, customs data, and LC document rules (UCP 600). Results highlight potential risks and missing information.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon">✅</div>
              <h3>Get Your Report</h3>
              <p>A clear risk summary with flags, suggested documents, and next steps to support your conversations with banks or agents.</p>
            </div>
          </div>
        </div>

        {/* ── DEMO WALKTHROUGH ── */}
        <div className="section" id="demo" data-testid="section-demo" style={{ textAlign: "center" }}>
          <div className="section-label">See It In Action</div>
          <h2>
            From trade idea to full <span className="accent">compliance picture</span>
          </h2>
          <p className="section-sub">
            Three inputs. Seconds. No broker needed.
          </p>

          <DemoSection />

          <div style={{ marginTop: 28 }}>
            <Link href="/lookup">
              <span className="btn-hero btn-hero-primary">
                Try It Yourself — Free
              </span>
            </Link>
          </div>
        </div>

        {/* ── TRUST SIGNALS ── */}
        <div className="section" id="trust">
          <div className="section-label">Why TapTrao</div>
          <h2>
            Manage your <span className="accent">trade risks</span>
          </h2>
          <p className="section-sub">
            We know the Africa–Europe corridor because we've lived it.
          </p>

          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🛡️</div>
              <h4>EUDR Screening</h4>
              <p>Screen shipment data against EUDR requirements using geolocation inputs</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📄</div>
              <h4>UCP 600-Based Checks</h4>
              <p>LC document rules screened against UCP 600 standards for pre-submission review</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">⚡</div>
              <h4>Minutes, Not Weeks</h4>
              <p>Generate a risk summary in minutes to support your internal review</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🌍</div>
              <h4>Africa–Europe Focus</h4>
              <p>Purpose-built for the trade corridors that matter to you</p>
            </div>
          </div>
        </div>

        {/* ── PRICING HERO ── */}
        <div className="pricing-hero" id="pricing" data-testid="section-pricing">
          <h2>
            Check a shipment<br />
            <span className="accent">before it costs you.</span>
          </h2>
          <p>Pay per shipment. No subscriptions. Your first compliance check is free.</p>
          <div className="credits-pill">
            <span className="dot" /> 0 Trade Credits
          </div>
        </div>

        {/* ── FREE BANNER ── */}
        <div className="free-banner">
          <div className="free-banner-left">
            <div className="free-banner-icon">🎁</div>
            <div className="free-banner-text">
              <h4>Your first check is free</h4>
              <p>Run one full compliance check for free — no card required. See duties, required documents, and shipment risks.</p>
              <p style={{ fontSize: "0.75rem", color: "var(--hp-text-muted)", marginTop: 2 }}>Results are informational and intended to support your own review or discussions with banks, agents, or advisors.</p>
            </div>
          </div>
          <Link href="/lookup">
            <span className="free-banner-btn">🔍 Check shipment risk — Free</span>
          </Link>
        </div>

        {/* ── TRADE PACKS HEADING ── */}
        <div className="packs-heading" style={{ padding: "32px 48px 8px" }}>
          <div className="section-label" style={{ marginBottom: 12, color: "var(--dark-text)" }}>Trade Packs</div>
          <p style={{ fontSize: "0.9rem", color: "var(--dark-text-secondary)", marginBottom: 0 }}>
            1 credit = 1 shipment checked (compliance + LC). Buy more, save more.
          </p>
        </div>

        {/* ── TRADE PACKS GRID ── */}
        <div className="packs-grid">
          {/* Single Shipment */}
          <div className="pack-card">
            <div className="pack-name">Single Shipment</div>
            <div className="pack-price">$24.99</div>
            <div className="pack-meta">1 Shipment</div>
            <div className="pack-per">$24.99 per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Full compliance check</li>
              <li><span className="check">✓</span> Buyer & supplier document checklist</li>
              <li><span className="check">✓</span> LC document check (first submission)</li>
              <li><span className="check">✓</span> Risk score & audit trail</li>
              <li><span className="check">✓</span> Customs declaration data pack (CSV)</li>
              <li><span className="check">✓</span> Instructions for supplier</li>
            </ul>
            <button className="pack-btn pack-btn-outline" onClick={() => checkoutMutation.mutate("single_trade")} disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending && checkoutMutation.variables === "single_trade" ? "Loading…" : "Buy Single Shipment"}
            </button>
          </div>

          {/* 3 Shipments — Featured */}
          <div className="pack-card featured">
            <div className="card-flare"><div className="flare-core" /></div>
            <div className="pack-badge">Most Popular</div>
            <div className="pack-name">3 Shipments</div>
            <div className="pack-price">$59.99</div>
            <div className="pack-meta">3 Shipments</div>
            <div className="pack-per">$20.00 per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in Single × 3</li>
              <li><span className="check">✓</span> Save as template</li>
              <li><span className="check">✓</span> 13% discount</li>
            </ul>
            <button className="pack-btn pack-btn-featured" onClick={() => checkoutMutation.mutate("3_trade")} disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending && checkoutMutation.variables === "3_trade" ? "Loading…" : "Buy 3 Shipments"}
            </button>
          </div>

          {/* 10 Shipments */}
          <div className="pack-card">
            <div className="pack-name">10 Shipments</div>
            <div className="pack-price">$179</div>
            <div className="pack-meta">10 Shipments</div>
            <div className="pack-per">$17.90 per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in 3-pack × 10</li>
              <li><span className="check">✓</span> Stale-check & refresh</li>
              <li><span className="check">✓</span> 28% discount</li>
            </ul>
            <button className="pack-btn pack-btn-outline" onClick={() => checkoutMutation.mutate("10_trade")} disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending && checkoutMutation.variables === "10_trade" ? "Loading…" : "Buy 10 Shipments"}
            </button>
          </div>

          {/* 25 Shipments */}
          <div className="pack-card">
            <div className="pack-name">25 Shipments</div>
            <div className="pack-price">$349</div>
            <div className="pack-meta">25 Shipments</div>
            <div className="pack-per">$13.96 per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in 10-pack × 25</li>
              <li><span className="check">✓</span> Best value for teams</li>
              <li><span className="check">✓</span> 44% discount</li>
            </ul>
            <button className="pack-btn pack-btn-outline" onClick={() => checkoutMutation.mutate("25_trade")} disabled={checkoutMutation.isPending}>
              {checkoutMutation.isPending && checkoutMutation.variables === "25_trade" ? "Loading…" : "Buy 25 Shipments"}
            </button>
          </div>
        </div>

        {/* ── LC DOCUMENT CHECK SECTION ── */}
        <div className="lc-section" data-testid="section-lc">
          <div className="section-label">LC Document Check</div>
          <h2>
            Just need to check <span className="accent">an LC?</span>
          </h2>
          <div className="section-sub">
            Standalone LC checking without buying a full trade credit.
          </div>

          <div className="lc-cards">
            {/* Main LC Card */}
            <div className="lc-card main-lc">
              <div className="lc-card-header">
                📄 <h3>LC Document Check</h3>
              </div>
              <div className="lc-price">$19.99</div>
              <div className="lc-price-sub">one-time</div>
              <p className="lc-desc">
                Validate supplier documents against your Letter of Credit (UCP 600)
                before submitting to the bank.
              </p>
              <ul className="lc-features">
                <li className="included"><span className="check">✓</span> First LC submission check</li>
                <li className="included"><span className="check">✓</span> Discrepancy summary & fix suggestions</li>
                <li className="excluded"><span className="cross">✕</span> Compliance check</li>
                <li className="excluded"><span className="cross">✕</span> Document checklist</li>
              </ul>
              <div className="lc-note">Included free with every trade credit</div>
              <button className="lc-btn" data-testid="button-pricing-lc" onClick={() => lcStandaloneMutation.mutate()} disabled={lcStandaloneMutation.isPending}>
                {lcStandaloneMutation.isPending ? "Loading…" : "📄 Check LC only — $19.99"}
              </button>
            </div>

            {/* Re-check Card */}
            <div className="lc-card recheck">
              <div className="lc-card-header">
                🔄 <h3>LC corrections (if documents are updated)</h3>
              </div>
              <div className="lc-price">$9.99</div>
              <div className="lc-price-sub">per re-check</div>
              <p className="lc-desc">
                If your supplier corrects documents after the first submission,
                re-check before resubmitting to the bank.
              </p>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="footer" data-testid="section-footer">
          <div style={{ fontSize: "0.75rem", color: "var(--dark-text-muted)", lineHeight: 1.5, marginBottom: 16, maxWidth: 640 }}>
            TapTrao provides automated trade and document screening for informational purposes only. Results do not constitute legal, regulatory, or banking advice and do not guarantee acceptance by authorities or financial institutions.
          </div>
          <div className="footer-left">
            <img className="logo-img" src="/logo.png" alt="TapTrao" />
            <span className="logo-name">TapTrao</span>
            © 2026 FATRAO LIMITED · Trade compliance for commodity traders
          </div>
          <div className="footer-right">
            <Link href="/privacy-policy"><span data-testid="link-footer-privacy">Privacy</span></Link>
            <Link href="/terms-of-service"><span data-testid="link-footer-terms">Terms</span></Link>
            <a href="mailto:hello@taptrao.com" data-testid="link-footer-email">Contact</a>
            <span>Docs</span>
          </div>
        </div>

      </div>
    </div>
  );
}
