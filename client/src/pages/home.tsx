import { Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X } from "lucide-react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  usePageTitle(
    "Pre-Shipment Regulatory Check",
    "Know your compliance before you commit. Check EUDR, customs, LC docs and trade regulations — in minutes, not weeks."
  );

  return (
    <div className="hp-page">
      {/* HORIZONTAL NAV */}
      <div className="top-nav">
        <Link href="/">
          <div className="top-nav-left">
            <img className="logo-img" src="/logo.png" alt="TapTrao" />
            <span className="logo-text">TapTrao</span>
          </div>
        </Link>
        <div className="top-nav-center">
          <Link href="/"><span className="active">Home</span></Link>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/lookup"><span>Commodities</span></Link>
          <a href="mailto:hello@taptrao.com">About</a>
        </div>
        <div className="top-nav-right">
          <Link href="/dashboard">
            <span className="nav-btn-ghost">Log In</span>
          </Link>
          <Link href="/lookup">
            <span className="nav-btn-primary">Start Free Check</span>
          </Link>
        </div>
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link href="/"><span onClick={() => setMobileMenuOpen(false)}>Home</span></Link>
          <a href="#how" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <Link href="/lookup"><span onClick={() => setMobileMenuOpen(false)}>Commodities</span></Link>
          <Link href="/dashboard"><span onClick={() => setMobileMenuOpen(false)}>Log In</span></Link>
          <Link href="/lookup">
            <span className="nav-btn-primary" onClick={() => setMobileMenuOpen(false)} style={{ width: "100%", textAlign: "center", marginTop: 8 }}>
              Start Free Check
            </span>
          </Link>
        </div>
      )}

      {/* MAIN FADING BOX */}
      <div className="main-box">

        {/* GREEN HERO */}
        <div className="green-hero">
          <div className="hero-badge">🛡 For SME commodity traders importing from Africa into Europe</div>
          <h1>Pre-Shipment<br /><span className="accent">Regulatory Check</span></h1>
          <p className="subtitle">Know your compliance before you commit. Check EUDR, customs, LC docs and trade regulations — in minutes, not weeks.</p>
          <div className="hero-cta-row">
            <Link href="/lookup">
              <span className="btn-hero btn-hero-primary">Run Your First Check — Free</span>
            </Link>
            <a href="#how">
              <span className="btn-hero btn-hero-secondary">See How It Works</span>
            </a>
          </div>
          <div className="hero-flags">
            <span>🇬🇭</span><span>🇨🇮</span><span>🇪🇹</span><span>🇰🇪</span><span>🇹🇿</span><span>🇺🇬</span><span>🇳🇬</span><span>🇨🇲</span>
            {" → "}
            <span>🇪🇺</span><span>🇬🇧</span><span>🇩🇪</span><span>🇫🇷</span><span>🇮🇹</span><span>🇪🇸</span><span>🇨🇭</span><span>🇦🇹</span>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="section" id="how">
          <div className="section-label">How It Works</div>
          <h2>Three steps to trade with confidence</h2>
          <p className="section-sub">No compliance team needed. TapTrao checks your shipment against every regulation that matters.</p>
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
              <h3>We Check Everything</h3>
              <p>EUDR compliance, HS code validation, customs duties, LC document rules (UCP 600), sanctions — all cross-referenced automatically.</p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <div className="step-icon">✅</div>
              <h3>Get Your Report</h3>
              <p>A clear compliance report with flags, required documents, and next steps. Ready to share with your bank or broker.</p>
            </div>
          </div>
        </div>

        {/* TRUST SIGNALS */}
        <div className="section">
          <div className="section-label">Why TapTrao</div>
          <h2>Built for the traders who move goods, not paper</h2>
          <p className="section-sub">We know the Africa–Europe corridor because we've lived it.</p>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🛡</div>
              <h4>EUDR Ready</h4>
              <p>Full EU Deforestation Regulation screening with geolocation checks</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📄</div>
              <h4>UCP 600 Compliant</h4>
              <p>LC document checker built on international banking standards</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">⚡</div>
              <h4>Minutes, Not Weeks</h4>
              <p>Get your compliance report before you commit capital to a trade</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🌍</div>
              <h4>Africa–Europe Focus</h4>
              <p>Purpose-built for the trade corridors that matter to you</p>
            </div>
          </div>
        </div>

        {/* PRICING HERO */}
        <div className="pricing-hero" id="pricing">
          <h2>Check a shipment<br /><span className="accent">before it costs you.</span></h2>
          <p>Pay per shipment. No subscriptions. Your first compliance check is free.</p>
          <div className="credits-pill"><span className="dot" /> 0 Trade Credits</div>
        </div>

        {/* FREE CHECK BANNER */}
        <div className="free-banner">
          <div className="free-banner-left">
            <div className="free-banner-icon">🎁</div>
            <div className="free-banner-text">
              <h4>Your first check is free</h4>
              <p>Run one full compliance check for free — no card required. See duties, required documents, and shipment risks.</p>
            </div>
          </div>
          <Link href="/lookup">
            <span className="free-banner-btn">🔍 Check shipment risk — Free</span>
          </Link>
        </div>

        {/* TRADE PACKS heading */}
        <div className="packs-heading">
          <h2>Trade Packs</h2>
          <p>1 credit = 1 shipment checked (compliance + LC). Buy more, save more.</p>
        </div>

        {/* TRADE PACKS grid */}
        <div className="packs-grid">
          {/* Single */}
          <div className="pack-card">
            <div className="pack-name">Single Shipment</div>
            <div className="pack-price">$24.99</div>
            <div className="pack-meta">1 Shipment</div>
            <div className="pack-per">$24.99 per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Full compliance check</li>
              <li><span className="check">✓</span> Buyer &amp; supplier document checklist</li>
              <li><span className="check">✓</span> LC document check (first submission)</li>
              <li><span className="check">✓</span> Risk score &amp; audit trail</li>
              <li><span className="check">✓</span> Customs declaration data pack (CSV)</li>
              <li><span className="check">✓</span> Instructions for supplier</li>
            </ul>
            <Link href="/pricing">
              <span className="pack-btn pack-btn-outline">Buy Single Shipment</span>
            </Link>
          </div>

          {/* 3 Shipments — Featured */}
          <div className="pack-card featured">
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
            <Link href="/pricing">
              <span className="pack-btn pack-btn-featured">Buy 3 Shipments</span>
            </Link>
          </div>

          {/* 10 Shipments */}
          <div className="pack-card">
            <div className="pack-name">10 Shipments</div>
            <div className="pack-price">$179</div>
            <div className="pack-meta">10 Shipments</div>
            <div className="pack-per">$17.90 per shipment</div>
            <ul className="pack-features">
              <li><span className="check">✓</span> Everything in 3-pack × 10</li>
              <li><span className="check">✓</span> Stale-check &amp; refresh</li>
              <li><span className="check">✓</span> 28% discount</li>
            </ul>
            <Link href="/pricing">
              <span className="pack-btn pack-btn-outline">Buy 10 Shipments</span>
            </Link>
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
            <Link href="/pricing">
              <span className="pack-btn pack-btn-outline">Buy 25 Shipments</span>
            </Link>
          </div>
        </div>

        {/* LC DOCUMENT CHECK */}
        <div className="lc-section">
          <div className="section-label">LC Document Check</div>
          <h2>Just need to check <span className="accent">an LC?</span></h2>
          <div className="section-sub">Standalone LC checking without buying a full trade credit.</div>

          <div className="lc-cards">
            <div className="lc-card main-lc">
              <div className="lc-card-header"><span>📄</span><h3>LC Document Check</h3></div>
              <div className="lc-price">$19.99</div>
              <div className="lc-price-sub">one-time</div>
              <p className="lc-desc">Validate supplier documents against your Letter of Credit (UCP 600) before submitting to the bank.</p>
              <ul className="lc-features">
                <li className="included"><span className="check">✓</span> First LC submission check</li>
                <li className="included"><span className="check">✓</span> Discrepancy summary &amp; fix suggestions</li>
                <li className="excluded"><span className="cross">✕</span> Compliance check</li>
                <li className="excluded"><span className="cross">✕</span> Document checklist</li>
              </ul>
              <div className="lc-note">Included free with every trade credit</div>
              <Link href="/lc-check">
                <span className="lc-btn">📄 Check LC only</span>
              </Link>
            </div>

            <div className="lc-card recheck">
              <div className="lc-card-header"><span>🔄</span><h3>LC corrections (if documents are updated)</h3></div>
              <div className="lc-price">$9.99</div>
              <div className="lc-price-sub">per re-check</div>
              <p className="lc-desc">If your supplier corrects documents after the first submission, re-check before resubmitting to the bank.</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="footer">
          <div className="footer-left">
            <img className="logo-img" src="/logo.png" alt="TapTrao" />
            <span className="logo-name">TapTrao</span>
            © 2026 FATRAO LIMITED · Trade compliance for commodity traders
          </div>
          <div className="footer-right">
            <Link href="/privacy-policy"><span>Privacy</span></Link>
            <Link href="/terms-of-service"><span>Terms</span></Link>
            <a href="mailto:hello@taptrao.com">Contact</a>
            <a href="#">Docs</a>
          </div>
        </div>

      </div>{/* end main-box */}
    </div>
  );
}
