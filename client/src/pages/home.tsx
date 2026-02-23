import { Link } from "wouter";
import { useState } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X } from "lucide-react";

const commodities = [
  "Cashew Nuts", "Cocoa Beans", "Sesame Seeds", "Gold", "Rough Diamonds",
  "Copper Ore", "Timber", "Tuna", "Cotton", "Palm Oil",
  "Cobalt", "Shea Butter", "Iron Ore", "Rubber", "Tea",
  "Groundnuts", "Coltan", "Vanilla",
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  usePageTitle(
    "Know your compliance before you commit",
    "The first standalone trade compliance tool for commodity traders sourcing from Africa. No ERP. No broker. No guesswork."
  );

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "var(--fb)", WebkitFontSmoothing: "antialiased", overflowX: "hidden" }}>
      <div className="hp-wrap">

        {/* NAV */}
        <div className="hp-nav">
          <Link href="/">
            <span className="hp-nav-l">
              <img className="hp-nav-logo" src="/logo.png" alt="TapTrao" />
              <span className="hp-nav-name">TapTrao</span>
            </span>
          </Link>
          <div className="hp-nav-c hide-on-mobile">
            <a href="#how">How it works</a>
            <a href="#modules">Modules</a>
            <a href="#lc">LC Check</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="hp-nav-r hide-on-mobile">
            <Link href="/auth">
              <span className="hp-btn-ghost">Sign in</span>
            </Link>
            <Link href="/lookup">
              <span className="hp-btn-green">Start Free →</span>
            </Link>
          </div>
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-drawer">
            <Link href="/lookup"><span onClick={() => setMobileMenuOpen(false)}>Compliance Lookup</span></Link>
            <Link href="/lc-check"><span onClick={() => setMobileMenuOpen(false)}>LC Checker</span></Link>
            <Link href="/pricing"><span onClick={() => setMobileMenuOpen(false)}>Pricing</span></Link>
            <div style={{ marginTop: 8, padding: "0 16px" }}>
              <Link href="/lookup">
                <span
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: "#4a8c6f", color: "#000", padding: "0 20px", borderRadius: 50, fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", height: 48, width: "100%" }}
                >
                  Start free lookup
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* HERO */}
        <div className="hp-hero-box">
          <div className="hp-hero-inner">
            <div className="hp-hero-badge">
              <span className="dot" /> Trade compliance for commodity traders
            </div>
            <h1>Know your compliance<br />before you <em>commit.</em></h1>
            <p className="hp-hero-sub">
              The first standalone trade compliance tool for commodity traders sourcing from Africa.{" "}
              <strong>No ERP. No broker. No guesswork.</strong>
            </p>
            <div className="hp-hero-ctas">
              <Link href="/lookup">
                <span className="hp-btn-hero">Run Free Lookup →</span>
              </Link>
              <a href="#how">
                <span className="hp-btn-sec">See how it works</span>
              </a>
            </div>
            <div className="hp-hero-meta">First lookup free · No credit card required · Results in seconds</div>
            <div className="hp-hero-flags">
              <span>Sourcing from</span>
              {["🇨🇮","🇬🇭","🇳🇬","🇪🇹","🇰🇪","🇹🇿","🇿🇦","🇸🇳","🇨🇩","🇨🇲","🇲🇬","🇲🇿","🇺🇬","🇷🇼","🇲🇱","🇧🇫","🇬🇳","🇿🇲"].map((f, i) => (
                <span key={i} className="flag">{f}</span>
              ))}
              <span>and more</span>
            </div>
          </div>
        </div>

        {/* TRUST BAR */}
        <div className="hp-trust-bar">
          <span>🌍 ECOWAS · AfCFTA · EAC · SADC</span><div className="sep" />
          <span>📄 UCP 600 · ISBP 745</span><div className="sep" />
          <span>🌱 EUDR · CBAM · CSDDD · Kimberley</span><div className="sep" />
          <span>⚡ Pay-per-check from $19.99</span><div className="sep" />
          <span>🔒 No ERP required</span>
        </div>

        {/* STAT CARDS + FREE BANNER */}
        <div className="hp-section">
          <div className="hp-section-inner">
            <div className="hp-stat-grid">
              <div className="hp-stat-card glow-green">
                <div className="hp-stat-icon g">📦</div>
                <div className="hp-stat-label">Commodities Covered</div>
                <div className="hp-stat-val">154 <span className="sm">types</span></div>
                <div className="hp-stat-delta"><span className="up">↑ Full database</span> at launch</div>
              </div>
              <div className="hp-stat-card glow-amber">
                <div className="hp-stat-icon a">💰</div>
                <div className="hp-stat-label">Bank Amendment Fee</div>
                <div className="hp-stat-val"><sup>$</sup>150–500</div>
                <div className="hp-stat-delta"><span className="warn">⚠ Per discrepancy</span> what's at stake</div>
              </div>
              <div className="hp-stat-card glow-teal">
                <div className="hp-stat-icon t">📋</div>
                <div className="hp-stat-label">Regulations Mapped</div>
                <div className="hp-stat-val">40+ <span className="sm">rules</span></div>
                <div className="hp-stat-delta"><span className="up">↑ EUDR · CBAM</span> + more</div>
              </div>
              <div className="hp-stat-card cta">
                <div className="hp-cta-orb" />
                <div className="hp-cta-num">$0</div>
                <div className="hp-cta-title">Pre-Shipment Check with <strong>AI</strong></div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginBottom: 2 }}>No card · No sign-up</div>
                <Link href="/lookup">
                  <span className="hp-btn-cta-sm">Run Free Check ✦</span>
                </Link>
              </div>
            </div>

            <div className="hp-free-banner">
              <div>
                <div className="lbl">✦ No account needed</div>
                <h2>Run your first<br />lookup free.</h2>
                <p>Enter commodity + origin + destination. Get the full compliance picture in seconds — duty rates, required documents, regulatory triggers, STOP warnings. No credit card. No sign-up.</p>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div className="hp-free-price">$0</div>
                <div className="hp-free-price-sub">first lookup</div>
                <Link href="/lookup">
                  <span className="hp-btn-hero" style={{ fontSize: 14, padding: "12px 24px" }}>Try it now →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* COMMODITY MARQUEE */}
        <div className="hp-marquee-wrap">
          <div className="hp-marquee-track">
            {[...commodities, ...commodities].map((c, i) => (
              <span key={`${c}-${i}`} style={{ display: "contents" }}>
                <span className={`hp-marquee-item${i % 2 === 0 ? " hl" : ""}`}>{c}</span>
                <span className="hp-marquee-sep">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* MODULES */}
        <div className="hp-section" id="modules">
          <div className="hp-section-inner">
            <div className="hp-section-lbl">What's included</div>
            <div className="hp-section-h">Six modules. <em>One engine.</em></div>
            <div className="hp-section-sub">Every tool a commodity trader needs. Pay per check. No subscription required to start.</div>
            <div className="hp-mod-grid">
              {[
                { icon: "◎", price: "$4.99 / lookup", priceClass: "green", title: "Compliance Lookup", desc: "Full regulatory checklist, duty rates, ESG triggers, supplier brief, and risk flags in one report.", tags: ["ECOWAS", "AfCFTA", "EUDR", "SPS"] },
                { icon: "📄", price: "$2.99 / check", priceClass: "green", title: "LC Document Checker", desc: "AI cross-checks every field against UCP 600 and ISBP 745. Flags bank rejections before they happen.", tags: ["UCP 600", "ISBP 745", "Multilingual"] },
                { icon: "📋", price: "Free", priceClass: "free", title: "Trade Templates", desc: "Save successful trades as reusable templates. Update quantities, regenerate all documents automatically.", tags: ["Corridors", "No ERP"] },
                { icon: "🌱", price: "Included", priceClass: "green", title: "ESG Due Diligence", desc: "EUDR geolocation, deforestation proof, UKTR register, conflict minerals. Auto-generates statements.", tags: ["EUDR", "Kimberley", "OECD DDG"] },
                { icon: "⚠️", price: "$9.99 / scenario", priceClass: "amber", title: "Risk Dashboard", desc: "Pre-trade risk scores. Post-rejection decision trees — appeal, return, destroy, insurance, duty refund.", tags: ["Demurrage", "Insurance", "RASFF"], amber: true },
                { icon: "◆", price: "$29 / mo", priceClass: "amber", title: "Regulatory Monitoring", desc: "Alerts when regulations change for your corridors. AEO tracker. HMRC archive. EUDR annual reports.", tags: ["WTO ePing", "UK Tariff API", "AEO"], amber: true },
              ].map((m) => (
                <div key={m.title} className={`hp-mod-card${m.amber ? " amber" : ""}`}>
                  <div className="hp-mod-top">
                    <div className="hp-mod-icon">{m.icon}</div>
                    <span className={`hp-mod-price ${m.priceClass}`}>{m.price}</span>
                  </div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                  <div className="hp-mod-tags">
                    {m.tags.map((t) => <span key={t} className="hp-mod-tag">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LC DOCUMENT CHECK */}
        <div className="hp-section" id="lc" style={{ paddingTop: 40 }}>
          <div className="hp-section-inner">
            <div className="hp-section-lbl">LC Document Check</div>
            <div className="hp-section-h">Just need to check <em>an LC?</em></div>
            <div className="hp-section-sub">Standalone LC checking without buying a full trade credit.</div>
            <div className="hp-lc-cards">
              <div className="hp-lc-card primary">
                <div className="hp-lc-head"><span className="ic">📄</span><span>LC Document Check</span></div>
                <div className="hp-lc-price">$19.99 <em>one-time</em></div>
                <div className="hp-lc-desc">Validate supplier documents against your Letter of Credit (UCP 600) before submitting to the bank.</div>
                <ul className="hp-lc-list">
                  <li className="on"><span className="ck g">✔</span> First LC submission check</li>
                  <li className="on"><span className="ck g">✔</span> Discrepancy summary &amp; fix suggestions</li>
                  <li className="off"><span className="ck x">✕</span> Compliance check</li>
                  <li className="off"><span className="ck x">✕</span> Document checklist</li>
                </ul>
                <div className="hp-lc-note">Included free with every trade credit</div>
                <Link href="/lc-check">
                  <span className="hp-btn-lc">📄 Check LC only</span>
                </Link>
              </div>
              <div className="hp-lc-card secondary">
                <div className="hp-lc-head"><span className="ic">🔄</span><span>LC corrections (if documents are updated)</span></div>
                <div className="hp-lc-price">$9.99 <em>per re-check</em></div>
                <div className="hp-lc-desc">If your supplier corrects documents after the first submission, re-check before resubmitting to the bank.</div>
              </div>
              <div className="hp-lc-card dashed">
                <div className="hp-lc-head"><span className="ic">🏢</span><span>High-volume or team usage</span></div>
                <div className="hp-lc-desc" style={{ marginBottom: 14 }}>Custom pricing, shared credits, API access, and dedicated support.</div>
                <a href="mailto:hello@taptrao.com">
                  <span className="hp-btn-lc">✉ Contact sales</span>
                </a>
              </div>
              <div className="hp-lc-card dashed green-hint">
                <div className="hp-lc-head"><span className="ic">🔔</span><span>Pro Monitoring</span><span className="badge">Coming soon</span></div>
                <div className="hp-lc-desc" style={{ marginBottom: 0 }}>Regulatory change alerts and compliance calendar. For frequent traders who need always-on monitoring.</div>
              </div>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div className="hp-section" id="pricing">
          <div className="hp-section-inner">
            <div className="hp-pricing-cta">
              <h2>Check a shipment<br /><em>before it costs you.</em></h2>
              <p>Pay per shipment. No subscriptions. Your first compliance check is free.</p>
              <div className="hp-credits-badge"><span className="dot" /> 0 Trade Credits</div>
            </div>

            <div className="hp-free-check-bar">
              <span className="ic">🎁</span>
              <div className="info">
                <strong>Your first check is free</strong>
                <span>Run one full compliance check for free — no card required. See duties, required documents, and shipment risks.</span>
              </div>
              <Link href="/lookup">
                <span className="hp-btn-free">🔍 Check shipment risk — Free</span>
              </Link>
            </div>

            <div style={{ fontFamily: "var(--fh)", fontWeight: 600, fontSize: 18, color: "#fff", marginBottom: 6 }}>Trade Packs</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 24 }}>1 credit = 1 shipment checked (compliance + LC). Buy more, save more.</div>

            <div className="hp-packs-grid">
              {[
                { name: "Single Shipment", price: "$24.99", meta: "1 Shipment", per: "$24.99 per shipment", features: ["Full compliance check", "Buyer & supplier document checklist", "LC document check (first submission)", "Risk score & audit trail", "Customs declaration data pack (CSV)", "Instructions for supplier"], popular: false },
                { name: "3 Shipments", price: "$59.99", meta: "3 Shipments", per: "$20.00 per shipment", features: ["Everything in Single × 3", "Save as template", "13% discount"], popular: true },
                { name: "10 Shipments", price: "$179", meta: "10 Shipments", per: "$17.90 per shipment", features: ["Everything in 3-pack × 10", "Stale-check & refresh", "28% discount"], popular: false },
                { name: "25 Shipments", price: "$349", meta: "25 Shipments", per: "$13.96 per shipment", features: ["Everything in 10-pack × 25", "Best value for teams", "44% discount"], popular: false },
              ].map((p) => (
                <div key={p.name} className={`hp-pack-card${p.popular ? " popular" : ""}`}>
                  <div className="hp-pack-name">{p.name}</div>
                  <div className="hp-pack-price">{p.price}</div>
                  <div className="hp-pack-meta">{p.meta}</div>
                  <div className="hp-pack-per">{p.per}</div>
                  <ul className="hp-pack-features">
                    {p.features.map((f) => (
                      <li key={f}><span className="ck">✔</span> {f}</li>
                    ))}
                  </ul>
                  <Link href="/lookup">
                    <span className={`hp-btn-pack ${p.popular ? "fill" : "outline"}`}>
                      Buy {p.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="hp-footer">
          <div className="hp-footer-inner">
            <div className="hp-footer-l">
              <img className="hp-footer-logo" src="/logo.png" alt="TapTrao" />
              <span>TapTrao</span>
            </div>
            <div className="hp-footer-copy">© 2026 FATRAO LIMITED · Trade compliance for commodity traders</div>
            <div className="hp-footer-links">
              <Link href="/privacy-policy"><span>Privacy</span></Link>
              <Link href="/terms-of-service"><span>Terms</span></Link>
              <a href="mailto:hello@taptrao.com">Contact</a>
            </div>
          </div>
        </div>

      </div>{/* end hp-wrap */}
    </div>
  );
}
