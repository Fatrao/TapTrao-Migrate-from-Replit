import { Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { CheckCircle2, ArrowRight, Menu, X, Mail, MessageCircle, CircleCheck } from "lucide-react";

function DemoSection() {
  const [step, setStep] = useState(1);
  const total = 3;

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s === total ? 1 : s + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const tabStyle = (n: number): React.CSSProperties => ({
    padding: "10px 20px",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: step === n ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)",
    borderBottom: step === n ? "2px solid #427EFF" : "2px solid transparent",
    transition: "all 0.15s",
    userSelect: "none",
  });

  const card: React.CSSProperties = {
    background: "#0D1117",
    borderRadius: 12,
    padding: "18px 20px",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.95)",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const docRow = (dotColor: string, name: string, auth: string) => (
    <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.70)" }}>{name}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.28)" }}>{auth}</div>
    </div>
  );

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  return (
    <div className="home-demo-section" style={{ maxWidth: 960, margin: "0 auto", padding: "60px 48px 80px" }} data-testid="section-demo">
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", textAlign: "center", marginBottom: 16 }}>
        See it in action
      </div>
      <h2 className="home-demo-heading" style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 32, textAlign: "center", color: "rgba(255,255,255,0.95)", marginBottom: 8, letterSpacing: "-0.5px" }} data-testid="text-demo-heading">
        From trade idea to full compliance picture
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", textAlign: "center", marginBottom: 40 }}>
        Three inputs. Seconds. No broker needed.
      </p>

      <div style={{ background: "#161B27", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ background: "#1C2333", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22C55E" }} />
          <div style={{ flex: 1, background: "#0D1117", borderRadius: 5, padding: "4px 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 12px" }}>
            taptrao.com/lookup
          </div>
        </div>

        <div className="home-demo-tabs" style={{ display: "flex", background: "#1C2333" }}>
          <div style={tabStyle(1)} onClick={() => setStep(1)} data-testid="demo-tab-1">1. Enter trade</div>
          <div style={tabStyle(2)} onClick={() => setStep(2)} data-testid="demo-tab-2">2. Compliance report</div>
          <div style={tabStyle(3)} onClick={() => setStep(3)} data-testid="demo-tab-3">3. Supplier brief</div>
        </div>

        <div className="home-demo-content" style={{ padding: 28, minHeight: 340 }}>
          {step === 1 && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: "rgba(255,255,255,0.95)", marginBottom: 4 }}>Compliance Lookup</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>Enter your commodity, origin, and destination</div>
              <div className="demo-grid-3a" style={{ marginBottom: 24 }}>
                {([["Commodity", "Raw Cashew Nuts"], ["Origin Country", "C\u00f4te d'Ivoire"], ["Destination", "United Kingdom"]] as const).map(([label, value]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>{label}</div>
                    <div style={{ background: "#0D1117", borderRadius: 8, padding: "10px 12px", color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
                <button onClick={() => setStep(2)} style={{ background: "#427EFF", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }} data-testid="demo-run-check">
                  Run Check &rarr;
                </button>
              </div>
              <div className="demo-grid-4">
                {[
                  { label: "Lookups Run", value: "12", color: "#427EFF", sub: "this month" },
                  { label: "LC Checks", value: "4", color: "rgba(255,255,255,0.95)", sub: "discrepancies caught" },
                  { label: "Corridors", value: "3", color: "rgba(255,255,255,0.95)", sub: "saved" },
                  { label: "Alerts", value: "2", color: "#F59E0B", sub: "new this week" },
                ].map((s) => (
                  <div key={s.label} style={{ background: "#0D1117", borderRadius: 12, padding: "16px 18px" }} data-testid={`demo-stat-${s.label.toLowerCase().replace(/\s/g,"-")}`}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28, color: s.color, letterSpacing: "-1px" }} data-testid={`text-demo-stat-value-${s.label.toLowerCase().replace(/\s/g,"-")}`}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 6 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: "rgba(255,255,255,0.95)", marginBottom: 4 }}>Compliance Report</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.95)", fontWeight: 600, marginBottom: 20 }}>
                Raw Cashew Nuts &rsaquo; C&ocirc;te d'Ivoire &rsaquo; United Kingdom
              </div>
              <div className="demo-grid-2">
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={sectionTitle}>Your Side &mdash; Buyer</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(66,126,255,0.12)", color: "#427EFF" }}>5 docs</div>
                  </div>
                  {docRow("#22C55E", "Customs Declaration (CDS)", "HMRC")}
                  {docRow("#22C55E", "IPAFFS Pre-notification", "APHA")}
                  {docRow("#22C55E", "Port Health Inspection", "Port Health")}
                  {docRow("#F59E0B", "Import Licence (if >20MT)", "HMRC RPA")}
                  {docRow("#22C55E", "Duty & VAT Payment", "HMRC")}
                </div>
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={sectionTitle}>Their Side &mdash; Supplier</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(66,126,255,0.12)", color: "#427EFF" }}>6 docs</div>
                  </div>
                  {docRow("#22C55E", "Certificate of Origin", "CCA (Conseil Anacarde)")}
                  {docRow("#22C55E", "Phytosanitary Certificate", "LANADA / DPVCQ")}
                  {docRow("#22C55E", "Commercial Invoice", "Supplier")}
                  {docRow("#22C55E", "Bill of Lading", "Shipping Line")}
                  {docRow("#F59E0B", "Aflatoxin Test Report", "Accredited Lab")}
                </div>
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={sectionTitle}>Readiness Score</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(34,197,94,0.10)", color: "#22C55E" }}>Low Risk</div>
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 52, color: "#22C55E", lineHeight: 1, textAlign: "center", padding: "8px 0 4px" }} data-testid="text-demo-readiness-score">87</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.28)", textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase" }}>Compliance Readiness</div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, margin: "12px 0 8px", overflow: "hidden" }}>
                    <div style={{ height: 3, background: "linear-gradient(90deg,#427EFF,#22C55E)", borderRadius: 2, width: "87%" }} />
                  </div>
                  {([["Commodity risk", "LOW", "#22C55E"], ["Origin risk", "LOW", "#22C55E"], ["Regulatory complexity", "MEDIUM", "#F59E0B"], ["Known hazards", "AFLATOXIN", "#F59E0B"]] as const).map(([k, v, c]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0" }}>
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: c }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={sectionTitle}>Duty Estimate</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "3px 8px", borderRadius: 4, background: "rgba(34,197,94,0.10)", color: "#22C55E" }}>GSP rate</div>
                  </div>
                  {([["MFN Tariff Rate", "0%"], ["GSP Preference", "0% (eligible)"], ["UK VAT (Import)", "20%"], ["Est. duty on $50k", "$0"], ["Est. VAT on $50k", "$10,000"]] as const).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 12 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{k}</span>
                      <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, background: "#1C2333", borderRadius: 7, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
                    <span>TT-2026-a3f9c1</span>
                    <span style={{ color: "#427EFF" }}>sha256:a3f9c1...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: "rgba(255,255,255,0.95)", marginBottom: 4 }}>Supplier Brief</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>Ready to send &mdash; email or WhatsApp</div>
              <div className="demo-grid-2b">
                <div style={{ background: "#0D1117", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><Mail size={12} /> Email Format</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.70)", lineHeight: 1.8 }}>
                    <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600, marginBottom: 8 }}>Subject: Required documents &mdash; Raw Cashew Nuts CIV &rarr; UK</div>
                    Dear Supplier,<br /><br />
                    Please provide the following documents:<br /><br />
                    <span style={{ color: "rgba(255,255,255,0.90)" }}>
                      1. Certificate of Origin<br />
                      &nbsp;&nbsp;&rarr; <span style={{ color: "#427EFF" }}>CCA (Conseil du Coton et de l'Anacarde)</span><br /><br />
                      2. Phytosanitary Certificate<br />
                      &nbsp;&nbsp;&rarr; <span style={{ color: "#427EFF" }}>LANADA / DPVCQ</span><br /><br />
                      3. Aflatoxin Test Report<br />
                      &nbsp;&nbsp;&rarr; Accredited laboratory
                    </span>
                  </div>
                </div>
                <div style={{ background: "#0D1117", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}><MessageCircle size={12} /> WhatsApp Format</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.70)", lineHeight: 2 }}>
                    <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>TapTrao Document Request</span><br />
                    Raw Cashew Nuts &middot; CIV &rarr; UK<br /><br />
                    Please send:<br />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CircleCheck size={12} style={{ color: "#22C55E" }} /> Certificate of Origin</span><br />
                    <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 11 }}>&nbsp;&nbsp;_(CCA &mdash; Conseil Anacarde)_</span><br />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CircleCheck size={12} style={{ color: "#22C55E" }} /> Phytosanitary Certificate</span><br />
                    <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 11 }}>&nbsp;&nbsp;_(LANADA/DPVCQ)_</span><br />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CircleCheck size={12} style={{ color: "#22C55E" }} /> Aflatoxin Test Report</span><br />
                    <span style={{ color: "rgba(255,255,255,0.40)", fontSize: 11 }}>&nbsp;&nbsp;_(Accredited lab)_</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => copyToClipboard("Subject: Required documents — Raw Cashew Nuts CIV → UK\n\nDear Supplier,\n\nPlease provide:\n1. Certificate of Origin (CCA)\n2. Phytosanitary Certificate (LANADA/DPVCQ)\n3. Aflatoxin Test Report (Accredited lab)", "email")}
                  style={{ background: "#427EFF", color: "white", border: "none", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  data-testid="demo-copy-email"
                >
                  Copy Email
                </button>
                <button
                  onClick={() => copyToClipboard("*TapTrao Document Request*\nRaw Cashew Nuts · CIV → UK\n\nPlease send:\n✅ Certificate of Origin\n✅ Phytosanitary Certificate\n✅ Aflatoxin Test Report", "whatsapp")}
                  style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "none", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  data-testid="demo-copy-whatsapp"
                >
                  Copy WhatsApp
                </button>
                <Link href="/lookup">
                  <span style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.70)", borderRadius: 7, padding: "9px 20px", fontSize: 13, fontWeight: 500, display: "inline-block", cursor: "pointer" }} data-testid="demo-run-another">
                    Run another lookup &rarr;
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            onClick={() => setStep(n)}
            style={{
              height: 6,
              borderRadius: 3,
              cursor: "pointer",
              transition: "all 0.2s",
              background: step === n ? "#427EFF" : "rgba(255,255,255,0.15)",
              width: step === n ? 20 : 6,
            }}
            data-testid={`demo-dot-${n}`}
          />
        ))}
        <button
          onClick={() => setStep(step === total ? 1 : step + 1)}
          style={{
            background: "rgba(66,126,255,0.15)",
            color: "#427EFF",
            border: "none",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          data-testid="demo-next-step"
        >
          {step === total ? "Start over \u21ba" : "Next step \u2192"}
        </button>
      </div>
    </div>
  );
}

const commodities = [
  "Raw Cashew Nuts", "Cocoa Beans", "Coffee", "Sesame Seeds", "Gold",
  "Rough Diamonds", "Copper Ore", "Timber", "Tuna", "Cotton",
  "Palm Oil", "Cobalt", "Shea Butter", "Iron Ore", "Rubber",
  "Tea", "Groundnuts", "Coltan", "Vanilla", "Mangoes",
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  usePageTitle(
    "Trade with certainty",
    "Know your duty rates, document requirements, and regulatory triggers before you commit. Built for commodity traders working African corridors."
  );

  return (
    <div className="home-page-root" style={{
      minHeight: "100vh",
      background: "#0D1117",
      color: "rgba(255,255,255,0.95)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      WebkitFontSmoothing: "antialiased",
      overflowX: "hidden",
    }}>

      {/* NAV */}
      <nav
        className="home-nav"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
        data-testid="nav-header"
      >
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} data-testid="text-landing-logo">
            <img src="/logo.png" alt="TapTrao" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.95)" }}>TapTrao</span>
          </span>
        </Link>
        <div data-testid="nav-landing-desktop" className="hidden md:flex" style={{ alignItems: "center", gap: 24 }}>
          <Link href="/lookup">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textDecoration: "none", cursor: "pointer" }} data-testid="link-nav-lookup">Compliance Lookup</span>
          </Link>
          <Link href="/lc-check">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textDecoration: "none", cursor: "pointer" }} data-testid="link-nav-lc-check">LC Checker</span>
          </Link>
          <Link href="/pricing">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textDecoration: "none", cursor: "pointer" }} data-testid="link-nav-pricing">Pricing</span>
          </Link>
          <Link href="/lookup">
            <span
              style={{
                background: "#427EFF",
                color: "white",
                padding: "8px 18px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
              data-testid="button-nav-start-free"
            >
              Start free →
            </span>
          </Link>
        </div>
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}
          data-testid="button-landing-mobile-menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          className="mobile-drawer"
          data-testid="nav-mobile-dropdown"
        >
          <Link href="/lookup"><span onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, cursor: "pointer", padding: "12px 16px", display: "flex", alignItems: "center", minHeight: 44 }} data-testid="link-mobile-lookup">Compliance Lookup</span></Link>
          <Link href="/lc-check"><span onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, cursor: "pointer", padding: "12px 16px", display: "flex", alignItems: "center", minHeight: 44 }} data-testid="link-mobile-lc-check">LC Checker</span></Link>
          <Link href="/pricing"><span onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, cursor: "pointer", padding: "12px 16px", display: "flex", alignItems: "center", minHeight: 44 }} data-testid="link-mobile-pricing">Pricing</span></Link>
          <div style={{ marginTop: 8, padding: "0 16px" }}>
            <Link href="/lookup">
              <span
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "#427EFF", color: "white", padding: "0 20px", borderRadius: 8, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", height: 48, width: "100%" }}
                data-testid="button-mobile-start-free"
              >
                Start free lookup
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* HERO */}
      <div
        className="home-hero"
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "120px 40px 80px",
          textAlign: "center",
        }}
        data-testid="section-hero"
      >
        <div style={{
          display: "inline-block",
          background: "rgba(66,126,255,0.12)",
          color: "#427EFF",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.08em",
          padding: "4px 12px",
          borderRadius: 20,
          marginBottom: 24,
          textTransform: "uppercase",
        }} className="home-hero-badge" data-testid="badge-hero">
          Trade Compliance for Commodity Traders
        </div>

        <h1 className="home-hero-title" style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 900,
          fontSize: 52,
          lineHeight: 1.1,
          letterSpacing: "-1.5px",
          color: "rgba(255,255,255,0.95)",
          marginBottom: 20,
          marginTop: 0,
        }} data-testid="text-hero-title">
          Know your compliance<br />before you commit.
        </h1>

        <p className="home-hero-subtitle" style={{
          fontSize: 17,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
          maxWidth: 560,
          margin: "0 auto 36px",
        }} data-testid="text-hero-subtitle">
          The first standalone trade compliance tool for commodity traders sourcing from Africa. No ERP. No broker. $4.99 per check.
        </p>

        <div className="home-hero-buttons" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/lookup">
            <span className="home-hero-primary" style={{
              background: "#427EFF",
              color: "white",
              padding: "13px 28px",
              borderRadius: 9,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }} data-testid="button-hero-free-lookup">
              Run your first lookup →
            </span>
          </Link>
          <Link href="/pricing">
            <span className="home-hero-secondary" style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.80)",
              padding: "13px 28px",
              borderRadius: 9,
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
              cursor: "pointer",
              display: "inline-block",
            }} data-testid="button-hero-how-it-works">
              See pricing
            </span>
          </Link>
        </div>

        <div className="home-hero-stats" style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {["18 origins", "154 commodities", "6 destinations"].map((stat) => (
            <span key={stat} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.40)", fontSize: 14 }}>
              <CheckCircle2 size={14} style={{ color: "#427EFF" }} />
              {stat}
            </span>
          ))}
        </div>
      </div>

      {/* INTERACTIVE DEMO */}
      <DemoSection />

      {/* THREE FEATURES */}
      <div className="home-features" style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 40px 100px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }} data-testid="section-capabilities">
        {[
          {
            icon: "⚡",
            title: "Compliance Lookup",
            desc: "Enter commodity, origin, and destination. Get the full regulatory picture in seconds — duties, documents, risk flags.",
            price: "$4.99 per lookup",
            href: "/lookup",
          },
          {
            icon: "📄",
            title: "LC Document Checker",
            desc: "Upload your Letter of Credit and supplier documents. Catch discrepancies before your bank does.",
            price: "$2.99 per check",
            href: "/lc-check",
          },
          {
            icon: "🔔",
            title: "Regulatory Alerts",
            desc: "Get notified when regulations change for your saved corridors. Never miss an SPS update or duty change.",
            price: "Coming soon",
            href: "/pricing",
          },
        ].map((f, i) => (
          <Link key={f.title} href={f.href}>
            <div
              style={{
                background: "#161B27",
                borderRadius: 14,
                padding: 24,
                height: "100%",
                cursor: "pointer",
                transition: "background .15s",
              }}
              data-testid={`card-capability-${i}`}
              onMouseEnter={e => { e.currentTarget.style.background = "#1C2333"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#161B27"; }}
            >
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.95)", marginBottom: 8 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", lineHeight: 1.5, marginBottom: 16 }}>
                {f.desc}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#427EFF", letterSpacing: "0.04em" }}>
                {f.price}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div id="how-it-works" className="home-how-section" style={{ background: "#0D1117", padding: "80px 40px" }} data-testid="section-how-it-works">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="home-how-heading" style={{
            fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 32,
            color: "rgba(255,255,255,0.95)", textAlign: "center", marginBottom: 8, letterSpacing: "-1px",
          }} data-testid="text-how-heading">
            Three inputs. Complete picture.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.50)", textAlign: "center", fontSize: 16, marginBottom: 48 }}>
            No ERP required. No broker needed. Just answers.
          </p>
          <div className="home-how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
              { num: "01", title: "Pick your corridor", desc: "Select the origin country, destination market, and commodity from our database of 154 commodities across 18 African origins." },
              { num: "02", title: "Get your compliance pack", desc: "Receive duty rates, document checklists, regulatory triggers, SPS requirements, and stop-flag warnings — all in one view." },
              { num: "03", title: "Ship with confidence", desc: "Export results, generate supplier briefs, validate LC documents against UCP 600 rules, and download audit-ready TwinLog PDFs." },
            ].map((step, i) => (
              <div key={step.num} data-testid={`step-${i + 1}`}>
                <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 48, color: "rgba(66,126,255,0.15)" }}>
                  {step.num}
                </span>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.95)", marginTop: 4 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginTop: 8, lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMMODITIES TICKER */}
      <div style={{ background: "#0F1318", padding: "60px 0" }} data-testid="section-commodities">
        <div className="home-commodities-header" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "0 40px", marginBottom: 32 }}>
          <h2 className="home-commodities-heading" style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.5px" }} data-testid="text-commodities-heading">
            Every commodity. Every corridor.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.40)", marginTop: 8, fontSize: 14 }} data-testid="text-commodities-subheading">
            From raw cashews to cobalt, we cover the commodities that move between Africa and the world.
          </p>
        </div>
        <div style={{ overflow: "hidden" }}>
          <div className="animate-ticker" style={{ display: "flex", whiteSpace: "nowrap" }}>
            {[...commodities, ...commodities].map((c, i) => (
              <span key={`${c}-${i}`} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <span
                  style={{
                    padding: "8px 24px",
                    fontSize: 18,
                    fontFamily: "'Fraunces', serif",
                    fontWeight: 600,
                    color: i % 2 === 0 ? "#427EFF" : "rgba(255,255,255,0.30)",
                  }}
                  data-testid={`text-commodity-${i}`}
                >
                  {c}
                </span>
                <span style={{ color: "rgba(255,255,255,0.15)" }}>&middot;</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* PRICING PREVIEW */}
      <div className="home-pricing-section" style={{ background: "#0D1117", padding: "80px 40px" }} data-testid="section-pricing">
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 className="home-pricing-heading" style={{
            fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 32,
            color: "rgba(255,255,255,0.95)", textAlign: "center", letterSpacing: "-1px", marginBottom: 8,
          }} data-testid="text-pricing-heading">
            Pay per check. No subscription trap.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.50)", textAlign: "center", fontSize: 16, marginBottom: 40 }} data-testid="text-pricing-subheading">
            Buy trade credits when you need them. Your first lookup is free.
          </p>
          <div className="home-pricing-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 640, margin: "0 auto" }}>
            <div style={{ background: "#161B27", borderRadius: 14, padding: 28, position: "relative", overflow: "hidden" }} data-testid="card-pricing-lookup">
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #427EFF, transparent)" }} />
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.95)", marginTop: 0 }}>Compliance Lookup</h3>
              <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: "rgba(255,255,255,0.95)", marginTop: 8 }}>
                1 credit <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.40)" }}>per lookup</span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
                {["Duty rates & tariff codes", "Document checklists", "Regulatory trigger screening", "SPS & phytosanitary requirements", "Bundled LC check included"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.60)", marginBottom: 10 }}>
                    <CheckCircle2 size={14} style={{ color: "#427EFF", flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/lookup">
                <span
                  style={{ display: "block", textAlign: "center", background: "#427EFF", color: "white", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 20 }}
                  data-testid="button-pricing-lookup"
                >
                  Start with a free lookup
                </span>
              </Link>
            </div>
            <div style={{ background: "#161B27", borderRadius: 14, padding: 28, position: "relative", overflow: "hidden" }} data-testid="card-pricing-lc">
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #22C55E, transparent)" }} />
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.95)", marginTop: 0 }}>LC Re-check</h3>
              <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 22, color: "rgba(255,255,255,0.95)", marginTop: 8 }}>
                $9.99 <span style={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.40)" }}>per re-check</span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0" }}>
                {["UCP 600 compliance validation", "Field-by-field discrepancy check", "Correction email & WhatsApp", "Actionable fix suggestions", "SHA-256 evidence hash"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.60)", marginBottom: 10 }}>
                    <CheckCircle2 size={14} style={{ color: "#22C55E", flexShrink: 0, marginTop: 2 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/lc-check">
                <span
                  style={{ display: "block", textAlign: "center", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.80)", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 20 }}
                  data-testid="button-pricing-lc"
                >
                  Check your first LC
                </span>
              </Link>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.30)", textAlign: "center", marginTop: 20 }} data-testid="text-pricing-note">
            Trade packs: Single $4.99 &middot; 3-Trade $12.99 &middot; 10-Trade $34.99 &middot; 25-Trade $74.99
          </p>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="home-cta-section" style={{ background: "#0F1318", padding: "80px 40px", textAlign: "center" }} data-testid="section-final-cta">
        <h2 className="home-cta-heading" style={{
          fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 32,
          color: "rgba(255,255,255,0.95)", letterSpacing: "-1px", marginBottom: 12,
        }} data-testid="text-cta-heading">
          Know before you commit.
        </h2>
        <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 16, marginBottom: 28 }} data-testid="text-cta-subheading">
          Run your first compliance lookup free. No account required.
        </p>
        <Link href="/lookup">
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#427EFF", color: "white", padding: "13px 28px",
              borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
            data-testid="button-cta-start"
          >
            Start free lookup
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      {/* FOOTER */}
      <footer data-testid="section-footer" style={{ background: "#0D1117", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="home-footer-inner" style={{ maxWidth: 960, margin: "0 auto", padding: "48px 40px 36px" }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: "rgba(255,255,255,0.95)" }} data-testid="text-footer-logo">TapTrao</span>
            <p style={{ color: "rgba(255,255,255,0.40)", fontSize: 13, marginTop: 6 }}>Trade compliance for commodity corridors out of Africa.</p>
          </div>
          <div className="home-footer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            <div>
              <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Product</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/lookup"><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} data-testid="link-footer-lookup">Compliance Lookup</span></Link>
                <Link href="/lc-check"><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} data-testid="link-footer-lc">LC Checker</span></Link>
                <Link href="/pricing"><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} data-testid="link-footer-pricing">Pricing</span></Link>
                <Link href="/dashboard"><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} data-testid="link-footer-dashboard">Dashboard</span></Link>
              </div>
            </div>
            <div>
              <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Company</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} data-testid="link-footer-about">About</span>
                <a href="#how-it-works" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textDecoration: "none" }} data-testid="link-footer-how">How it works</a>
              </div>
            </div>
            <div>
              <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Legal</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/privacy-policy"><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} data-testid="link-footer-privacy">Privacy Policy</span></Link>
                <Link href="/terms-of-service"><span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }} data-testid="link-footer-terms">Terms of Service</span></Link>
                <button
                  onClick={() => { import("@/components/cookie-consent").then(m => m.resetCookieConsent()); }}
                  style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", background: "none", border: "none", textAlign: "left", padding: 0 }}
                  data-testid="link-footer-cookie-settings"
                >
                  Cookie Settings
                </button>
              </div>
            </div>
            <div>
              <h4 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.30)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Contact</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <a href="mailto:hello@taptrao.com" style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, textDecoration: "none" }} data-testid="link-footer-email">hello@taptrao.com</a>
              </div>
            </div>
          </div>
        </div>
        <div className="home-footer-bottom" style={{ background: "#050709", padding: "18px 40px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ color: "rgba(255,255,255,0.30)", fontSize: 13 }} data-testid="text-footer-copyright">
              &copy; 2026 FATRAO LIMITED &middot; Registered in England and Wales
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
