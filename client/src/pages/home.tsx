import { Link } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X, ChevronDown } from "lucide-react";

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
          <div className={`demo-tab ${step === 3 ? "active" : ""}`} onClick={() => goTo(3)}>③ LC check 🛡️</div>
          <div className={`demo-tab ${step === 4 ? "active" : ""}`} onClick={() => goTo(4)}>④ Supplier brief 🛡️</div>
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
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
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
          <div className="nav-dropdown">
            <button className="nav-dropdown-trigger" onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}>
              Menu <ChevronDown size={14} style={{ marginLeft: 4, transition: "transform .2s", transform: menuDropdownOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {menuDropdownOpen && (
              <div className="nav-dropdown-panel" onMouseLeave={() => setMenuDropdownOpen(false)}>
                <div className="nav-dropdown-section">
                  <div className="nav-dropdown-label">Main</div>
                  <Link href="/dashboard" onClick={() => setMenuDropdownOpen(false)}>Dashboard</Link>
                  <Link href="/trades" onClick={() => setMenuDropdownOpen(false)}>My Trades</Link>
                  <Link href="/lookup" onClick={() => setMenuDropdownOpen(false)}>Pre-Shipment Check</Link>
                </div>
                <div className="nav-dropdown-section">
                  <div className="nav-dropdown-label">Compliance</div>
                  <Link href="/inbox" onClick={() => setMenuDropdownOpen(false)}>Supplier Inbox</Link>
                  <Link href="/alerts" onClick={() => setMenuDropdownOpen(false)}>Alerts</Link>
                  <Link href="/templates" onClick={() => setMenuDropdownOpen(false)}>Templates</Link>
                </div>
                <div className="nav-dropdown-section">
                  <div className="nav-dropdown-label">Tools</div>
                  <Link href="/lc-check" onClick={() => setMenuDropdownOpen(false)}>LC Document Check</Link>
                  <Link href="/demurrage" onClick={() => setMenuDropdownOpen(false)}>Demurrage Calculator</Link>
                </div>
              </div>
            )}
          </div>
          <a href="#demo">Demo</a>
          <Link href="/lookup">Commodities</Link>
          <a href="#trust">About</a>
        </div>

        <div className="top-nav-right">
          <Link href="/pricing">
            <span className="nav-link-pricing" data-testid="button-pricing">Pricing</span>
          </Link>
          <Link href="/dashboard">
            <span className="nav-btn-ghost" data-testid="button-sign-in">Log In</span>
          </Link>
          <Link href="/pricing">
            <span className="nav-btn-primary" data-testid="button-nav-start-free">Pricing</span>
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
            🏆 For SME commodity traders · Africa → EU · UK · Türkiye · Switzerland · Canada · USA
          </div>

          <h1>
            Know the rules.<br />
            <span className="accent">Avoid the loss.</span>
          </h1>

          <p className="subtitle">
            Run a free regulatory check in seconds. Activate TapTrao Shield to catch document gaps,
            LC discrepancies, and sanctions risks while there's still time to fix them, even if documents
            arrive late. Coverage runs until docking or bank presentation.
          </p>

          <div className="hero-cta-row">
            <Link href="/lookup">
              <span className="btn-hero btn-hero-primary" data-testid="button-hero-free-lookup">
                Free Pre-Shipment Check
              </span>
            </Link>
            <a href="#pricing">
              <span className="btn-hero btn-hero-secondary" data-testid="button-hero-how-it-works">
                See TapTrao Shield
              </span>
            </a>
          </div>

          <div className="hero-flags">
            <span>🇬🇭</span><span>🇨🇮</span><span>🇪🇹</span><span>🇰🇪</span>
            <span>🇹🇿</span><span>🇺🇬</span><span>🇳🇬</span><span>🇨🇲</span>
            {" → "}
            <span>🇪🇺</span><span>🇬🇧</span><span>🇩🇪</span><span>🇫🇷</span>
            <span>🇮🇹</span><span>🇪🇸</span><span>🇨🇭</span><span>🇦🇹</span>
            <span>🇺🇸</span><span>🇨🇦</span><span>🇹🇷</span>
          </div>
        </div>

        {/* ── COST-OF-FAILURE STRIP ── */}
        <div className="cost-strip">
          <div className="cost-strip-grid">
            <div className="cost-strip-item">
              <div className="cost-strip-value">$75–$300/day</div>
              <div className="cost-strip-label">Demurrage while documents are on hold</div>
            </div>
            <div className="cost-strip-item">
              <div className="cost-strip-value">$95–$160</div>
              <div className="cost-strip-label">Bank fee for one LC discrepancy</div>
            </div>
            <div className="cost-strip-item">
              <div className="cost-strip-value">$5,000</div>
              <div className="cost-strip-label">US ISF late-filing penalty (per violation)</div>
            </div>
            <div className="cost-strip-item">
              <div className="cost-strip-value">$1,500–$3,000+</div>
              <div className="cost-strip-label">Typical cascade cost from one missing document</div>
            </div>
          </div>
          <div className="cost-strip-footer">
            One missing document. $1,500–$3,000 gone. TapTrao Shield: $110.
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="section" id="how" data-testid="section-how-it-works">
          <div className="section-label">How It Works</div>
          <h2>
            Start free. Step up <span className="accent">when it matters.</span>
          </h2>
          <p className="section-sub">
            The free Pre-Shipment Check tells you what regulations apply. TapTrao Shield tells you exactly what to do about them, and tracks it until docking.
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <div className="step-icon">📋</div>
              <h3>Enter Your Trade</h3>
              <p>Origin, destination, commodity. 54 African origins. EU, UK, USA, Canada, Türkiye, Switzerland. Free. No card required.</p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <div className="step-icon">🔍</div>
              <h3>Get Your Regulatory Snapshot</h3>
              <p>Instantly see which rules apply to your corridor: EUDR, customs, sanctions, destination-specific requirements. This is your free preview.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon">🛡️</div>
              <h3>Activate TapTrao Shield</h3>
              <p>Turn the snapshot into protection. LC document checks, sanctions screening, supplier requests, deadlines, document scanning, and late-document alerts, monitored until docking. $110 per shipment.</p>
            </div>
          </div>
        </div>

        {/* ── DEMO WALKTHROUGH ── */}
        <div className="section" id="demo" data-testid="section-demo" style={{ textAlign: "center" }}>
          <div className="section-label">See It In Action</div>
          <h2>
            From free check to <span className="accent">TapTrao Shield</span>
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

        {/* ── WHY TRADERS ACTIVATE TAPTRAO SHIELD ── */}
        <div className="section" id="trust">
          <div className="section-label">Why TapTrao Shield</div>
          <h2>
            Why traders activate <span className="accent">TapTrao Shield</span>
          </h2>
          <p className="section-sub">
            We know the Africa–Europe corridor because we've lived it.
          </p>

          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🎯</div>
              <h4>Knows what's actually in scope</h4>
              <p>Cocoa triggers EUDR. Argan oil doesn't. TapTrao scopes by HS code, not guesswork.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📄</div>
              <h4>Catches LC problems before the bank does</h4>
              <p>Cross-checks documents against UCP 600. Flags issues that cost $95–$160 every time they're missed.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">⚡</div>
              <h4>Turns risk into action</h4>
              <p>Not just flags. Ready-to-send supplier requests and a clear fix list. Full corridor-specific report in under 2 minutes.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🌍</div>
              <h4>Built for your corridors</h4>
              <p>54 African origins. EU, UK, USA, Canada, Türkiye, Switzerland. 90+ commodity chapters. Designed for real commodity trade, not theory.</p>
            </div>
          </div>
        </div>

        {/* ── PRICING ── */}
        <div className="pricing-hero" id="pricing" data-testid="section-pricing">
          <h2>
            Choose your level of<br />
            <span className="accent">protection</span>
          </h2>
        </div>

        {/* ── PRICING GRID ── */}
        <div className="packs-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>

          {/* Free — Pre-Shipment Check */}
          <div className="pack-card">
            <div className="pack-name">Pre-Shipment Regulatory Check</div>
            <div className="pack-price">Free</div>
            <div className="pack-meta">Unlimited checks</div>
            <div className="pack-per">No card required</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Regulatory overview by corridor</li>
              <li><span className="check">✓</span> EUDR, customs, sanctions scope</li>
              <li><span className="check">✓</span> Unlimited free checks</li>
            </ul>
            <Link href="/lookup">
              <span className="pack-btn pack-btn-outline">Run a Free Check</span>
            </Link>
          </div>

          {/* LC Document Check — $49.99 */}
          <div className="pack-card">
            <div className="pack-name">LC Document Check</div>
            <div className="pack-price">$49.99</div>
            <div className="pack-meta">Standalone</div>
            <div className="pack-per">one-time</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> LC document scanning & data extraction</li>
              <li><span className="check">✓</span> UCP 600 consistency checks</li>
              <li><span className="check">✓</span> Discrepancy summary & fix suggestions</li>
            </ul>
            <div className="lc-note" style={{ marginBottom: 12 }}>Included free with every TapTrao Shield activation</div>
            <Link href="/pricing">
              <span className="pack-btn pack-btn-outline" data-testid="button-pricing-lc">Check LC — $49.99</span>
            </Link>
          </div>

          {/* Shield: Single — $110 */}
          <div className="pack-card">
            <div className="pack-name">🛡️ TapTrao Shield: Single</div>
            <div className="pack-price">$110</div>
            <div className="pack-meta">1 Shipment</div>
            <div className="pack-per">per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in the free check, PLUS:</li>
              <li><span className="check">✓</span> LC document scanning & data extraction</li>
              <li><span className="check">✓</span> LC document consistency checks (UCP 600)</li>
              <li><span className="check">✓</span> Sanctions & enhanced risk flags</li>
              <li><span className="check">✓</span> EUDR scope & due-diligence triggers</li>
              <li><span className="check">✓</span> Pre-built supplier document requests</li>
              <li><span className="check">✓</span> Required documents checklist with deadlines</li>
              <li><span className="check">✓</span> Late-document alerts until docking</li>
            </ul>
            <Link href="/pricing">
              <span className="pack-btn pack-btn-outline">Activate TapTrao Shield</span>
            </Link>
          </div>

          {/* Shield: 3-Pack — $299 (Featured) */}
          <div className="pack-card featured">
            <div className="card-flare"><div className="flare-core" /></div>
            <div className="pack-badge">Most Popular</div>
            <div className="pack-name">🛡️ TapTrao Shield: 3-Pack</div>
            <div className="pack-price">$299</div>
            <div className="pack-meta">3 Shipments</div>
            <div className="pack-per">$100 per check</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in a single Shield check</li>
              <li><span className="check">✓</span> Best for 1–3 shipments per month</li>
            </ul>
            <Link href="/pricing">
              <span className="pack-btn pack-btn-featured">Activate 3-Pack</span>
            </Link>
          </div>

          {/* Shield: 5-Pack — $475 */}
          <div className="pack-card">
            <div className="pack-name">🛡️ TapTrao Shield: 5-Pack</div>
            <div className="pack-price">$475</div>
            <div className="pack-meta">5 Shipments</div>
            <div className="pack-per">$95 per check</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in a single Shield check</li>
              <li><span className="check">✓</span> Best for regular corridors & repeat shipments</li>
            </ul>
            <Link href="/pricing">
              <span className="pack-btn pack-btn-outline">Activate 5-Pack</span>
            </Link>
          </div>

          {/* Volume — Contact Us */}
          <div className="pack-card">
            <div className="pack-name">🛡️ Volume</div>
            <div className="pack-price">Custom</div>
            <div className="pack-meta">10+ shipments/month</div>
            <div className="pack-per">Custom pricing</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in a single Shield check</li>
              <li><span className="check">✓</span> Package built around your corridors</li>
            </ul>
            <a href="mailto:hello@taptrao.com">
              <span className="pack-btn pack-btn-outline">Contact Us</span>
            </a>
          </div>
        </div>

        <div style={{ padding: "0 48px 24px", fontSize: "0.72rem", color: "var(--dark-text-muted)" }}>
          Not legal advice. No guarantee of bank or customs acceptance.
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="pricing-hero" style={{ marginTop: 0 }}>
          <h2>
            The free check shows the risk.<br />
            <span className="accent">TapTrao Shield helps you fix it in time.</span>
          </h2>
          <p>One missing document can cost thousands. TapTrao Shield costs $110.</p>
          <div className="hero-cta-row" style={{ justifyContent: "center" }}>
            <Link href="/lookup">
              <span className="btn-hero btn-hero-primary">Free Pre-Shipment Check</span>
            </Link>
            <a href="#pricing">
              <span className="btn-hero btn-hero-secondary" style={{ color: "#1a1a1a", borderColor: "rgba(0,0,0,0.25)" }}>Activate TapTrao Shield: $110</span>
            </a>
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
