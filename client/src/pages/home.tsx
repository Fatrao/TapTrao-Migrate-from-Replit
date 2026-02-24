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
      {/* ── TOP NAV ── */}
      <nav className="hp-topnav">
        <Link href="/">
          <div className="hp-topnav-left">
            <img className="hp-logo-img" src="/logo.png" alt="TapTrao" />
            <span className="hp-logo-text">TapTrao</span>
          </div>
        </Link>
        <div className="hp-topnav-center">
          <Link href="/"><span className="active">Home</span></Link>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
          <Link href="/lookup"><span>Commodities</span></Link>
          <a href="mailto:hello@taptrao.com">About</a>
        </div>
        <div className="hp-topnav-right">
          <Link href="/dashboard">
            <span className="hp-nav-ghost">Log In</span>
          </Link>
          <Link href="/lookup">
            <span className="hp-nav-primary">Start Free Check</span>
          </Link>
        </div>
        {/* Mobile hamburger */}
        <button
          className="hp-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="hp-mobile-menu">
          <Link href="/"><span onClick={() => setMobileMenuOpen(false)}>Home</span></Link>
          <a href="#how" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <Link href="/lookup"><span onClick={() => setMobileMenuOpen(false)}>Commodities</span></Link>
          <Link href="/dashboard"><span onClick={() => setMobileMenuOpen(false)}>Log In</span></Link>
          <Link href="/lookup">
            <span className="hp-nav-primary" onClick={() => setMobileMenuOpen(false)} style={{ width: "100%", textAlign: "center", marginTop: 8 }}>
              Start Free Check
            </span>
          </Link>
        </div>
      )}

      {/* ── MAIN BOX ── */}
      <div className="hp-main">

        {/* GREEN HERO */}
        <section className="hp-hero">
          <div className="hp-hero-glow" />
          <div className="hp-hero-badge">
            <span>🛡</span> For SME commodity traders importing from Africa into Europe
          </div>
          <h1>
            Pre-Shipment<br />
            <span className="accent">Regulatory Check</span>
          </h1>
          <p className="hp-hero-sub">
            Know your compliance before you commit. Check EUDR, customs, LC docs and trade regulations — in minutes, not weeks.
          </p>
          <div className="hp-hero-ctas">
            <Link href="/lookup">
              <span className="hp-btn-hero-primary">Run Your First Check — Free</span>
            </Link>
            <a href="#how">
              <span className="hp-btn-hero-secondary">See How It Works</span>
            </a>
          </div>
          <div className="hp-hero-flags">
            {"🇬🇭 🇨🇮 🇪🇹 🇰🇪 🇹🇿 🇺🇬 🇳🇬 🇨🇲".split(" ").map((f, i) => (
              <span key={i} className="flag">{f}</span>
            ))}
            <span className="arrow">→</span>
            {"🇪🇺 🇬🇧 🇩🇪 🇫🇷 🇮🇹 🇪🇸 🇨🇭 🇦🇹".split(" ").map((f, i) => (
              <span key={`d${i}`} className="flag">{f}</span>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="hp-section" id="how">
          <div className="hp-section-label">How It Works</div>
          <h2>Three steps to trade with confidence</h2>
          <p className="hp-section-sub">No compliance team needed. TapTrao checks your shipment against every regulation that matters.</p>
          <div className="hp-steps-grid">
            {[
              { num: 1, icon: "📋", title: "Enter Your Trade", desc: "Tell us the commodity, origin country, destination, and value. Takes under 2 minutes." },
              { num: 2, icon: "🔍", title: "We Check Everything", desc: "EUDR compliance, HS code validation, customs duties, LC document rules (UCP 600), sanctions — all cross-referenced automatically." },
              { num: 3, icon: "✅", title: "Get Your Report", desc: "A clear compliance report with flags, required documents, and next steps. Ready to share with your bank or broker." },
            ].map((s) => (
              <div key={s.num} className="hp-step-card">
                <div className="hp-step-icon">{s.icon}</div>
                <div className="hp-step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TRUST SIGNALS */}
        <section className="hp-section">
          <div className="hp-section-label">Why TapTrao</div>
          <h2>Built for the traders who move goods, not paper</h2>
          <p className="hp-section-sub">We know the Africa–Europe corridor because we've lived it.</p>
          <div className="hp-trust-grid">
            {[
              { icon: "🛡", title: "EUDR Ready", desc: "Full EU Deforestation Regulation screening with geolocation checks" },
              { icon: "📄", title: "UCP 600 Compliant", desc: "LC document checker built on international banking standards" },
              { icon: "⚡", title: "Minutes, Not Weeks", desc: "Get your compliance report before you commit capital to a trade" },
              { icon: "🌍", title: "Africa\u2013Europe Focus", desc: "Purpose-built for the trade corridors that matter to you" },
            ].map((t) => (
              <div key={t.title} className="hp-trust-card">
                <div className="hp-trust-icon">{t.icon}</div>
                <h4>{t.title}</h4>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING HERO */}
        <section className="hp-pricing-hero" id="pricing">
          <h2>Check a shipment<br /><span className="accent">before it costs you.</span></h2>
          <p>Pay per shipment. No subscriptions. Your first compliance check is free.</p>
          <div className="hp-credits-pill">
            <span className="dot" />
            0 Trade Credits
          </div>
        </section>

        {/* FREE CHECK BANNER */}
        <div className="hp-free-banner">
          <div className="hp-free-glow" />
          <div className="hp-free-left">
            <div className="hp-free-icon">🎁</div>
            <div>
              <h4>Your first check is free</h4>
              <p>Run one full compliance check for free — no card required. See duties, required documents, and shipment risks.</p>
            </div>
          </div>
          <Link href="/lookup">
            <span className="hp-free-btn">🔍 Check shipment risk — Free</span>
          </Link>
        </div>

        {/* TRADE PACKS */}
        <div className="hp-packs-heading">
          <h2>Trade Packs</h2>
          <p>1 credit = 1 shipment checked (compliance + LC). Buy more, save more.</p>
        </div>

        <div className="hp-packs-grid">
          {[
            { name: "Single Shipment", price: "$24.99", meta: "1 Shipment", per: "$24.99 per shipment", features: ["Full compliance check", "Buyer & supplier document checklist", "LC document check (first submission)", "Risk score & audit trail", "Customs declaration data pack (CSV)", "Instructions for supplier"], featured: false },
            { name: "3 Shipments", price: "$59.99", meta: "3 Shipments", per: "$20.00 per shipment", features: ["Everything in Single \u00d7 3", "Save as template", "13% discount"], featured: true },
            { name: "10 Shipments", price: "$179", meta: "10 Shipments", per: "$17.90 per shipment", features: ["Everything in 3-pack \u00d7 10", "Stale-check & refresh", "28% discount"], featured: false },
            { name: "25 Shipments", price: "$349", meta: "25 Shipments", per: "$13.96 per shipment", features: ["Everything in 10-pack \u00d7 25", "Best value for teams", "44% discount"], featured: false },
          ].map((p) => (
            <div key={p.name} className={`hp-pack-card${p.featured ? " featured" : ""}`}>
              {p.featured && <div className="hp-pack-badge">Most Popular</div>}
              <div className="hp-pack-name">{p.name}</div>
              <div className="hp-pack-price">{p.price}</div>
              <div className="hp-pack-meta">{p.meta}</div>
              <div className="hp-pack-per">{p.per}</div>
              <ul className="hp-pack-features">
                {p.features.map((f) => (
                  <li key={f}><span className="ck">✓</span> {f}</li>
                ))}
              </ul>
              <Link href="/pricing">
                <span className={`hp-pack-btn${p.featured ? " featured" : ""}`}>
                  Buy {p.name}
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* LC DOCUMENT CHECK */}
        <section className="hp-lc-section">
          <div className="hp-lc-label">LC Document Check</div>
          <h2>Just need to check <span className="accent">an LC?</span></h2>
          <p className="hp-lc-sub">Standalone LC checking without buying a full trade credit.</p>
          <div className="hp-lc-grid">
            <div className="hp-lc-card main-lc">
              <div className="hp-lc-header"><span>📄</span><h3>LC Document Check</h3></div>
              <div className="hp-lc-price">$19.99</div>
              <div className="hp-lc-price-sub">one-time</div>
              <p className="hp-lc-desc">Validate supplier documents against your Letter of Credit (UCP 600) before submitting to the bank.</p>
              <ul className="hp-lc-features">
                <li className="included"><span className="check">✓</span> First LC submission check</li>
                <li className="included"><span className="check">✓</span> Discrepancy summary & fix suggestions</li>
                <li className="excluded"><span className="cross">✕</span> Compliance check</li>
                <li className="excluded"><span className="cross">✕</span> Document checklist</li>
              </ul>
              <div className="hp-lc-note">Included free with every trade credit</div>
              <Link href="/lc-check">
                <span className="hp-lc-btn">📄 Check LC only</span>
              </Link>
            </div>
            <div className="hp-lc-card recheck">
              <div className="hp-lc-header"><span>🔄</span><h3>LC corrections (if documents are updated)</h3></div>
              <div className="hp-lc-price">$9.99</div>
              <div className="hp-lc-price-sub">per re-check</div>
              <p className="hp-lc-desc">If your supplier corrects documents after the first submission, re-check before resubmitting to the bank.</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="hp-footer">
          <div className="hp-footer-left">
            <img className="hp-footer-logo" src="/logo.png" alt="TapTrao" />
            <span className="hp-footer-name">TapTrao</span>
            <span className="hp-footer-copy">&copy; 2026 FATRAO LIMITED &middot; Trade compliance for commodity traders</span>
          </div>
          <div className="hp-footer-links">
            <Link href="/privacy-policy"><span>Privacy</span></Link>
            <Link href="/terms-of-service"><span>Terms</span></Link>
            <a href="mailto:hello@taptrao.com">Contact</a>
            <a href="#">Docs</a>
          </div>
        </footer>

      </div>{/* end hp-main */}
    </div>
  );
}
