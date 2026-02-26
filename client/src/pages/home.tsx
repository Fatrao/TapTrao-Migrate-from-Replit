import { Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  usePageTitle(
    "Know your compliance before you commit",
    "Trade compliance for commodity traders sourcing from Africa. No ERP. No broker. No guesswork."
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
        <div className="green-hero" data-testid="section-hero">
          <div className="hero-badge">
            🛡️ For SME commodity traders importing from Africa into Europe
          </div>

          <h1>
            Pre-Shipment<br />
            <span className="accent">Regulatory Check</span>
          </h1>

          <p className="subtitle">
            Know your compliance before you commit. Check EUDR, customs, LC docs
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
            No compliance team needed. TapTrao checks your shipment against every regulation that matters.
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

        {/* ── TRUST SIGNALS ── */}
        <div className="section" id="trust">
          <div className="section-label">Why TapTrao</div>
          <h2>
            Built for the traders who move <span className="accent">goods, not paper</span>
          </h2>
          <p className="section-sub">
            We know the Africa–Europe corridor because we've lived it.
          </p>

          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🛡️</div>
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
            </div>
          </div>
          <Link href="/lookup">
            <span className="free-banner-btn">🔍 Check shipment risk — Free</span>
          </Link>
        </div>

        {/* ── TRADE PACKS HEADING ── */}
        <div className="packs-heading" style={{ padding: "32px 48px 8px" }}>
          <h2 style={{ fontFamily: "var(--fh)", fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
            Trade Packs
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 0 }}>
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
