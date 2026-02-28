import { Link } from "wouter";
import { Search, FileCheck, Bell, Calendar, Shield, Archive, Loader2, Hexagon, Check, X, Building2, Mail, Gift, RefreshCw, ArrowLeft } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PromoCodeRedeem from "@/components/promo-code-redeem";

const tradePacks = [
  {
    key: "shield_single",
    name: "🛡️ TapTrao Shield: Single",
    price: "$110",
    lookups: 1,
    perLookup: "$110",
    features: [
      "Everything in the free check, PLUS:",
      "LC document scanning & data extraction",
      "LC document consistency checks (UCP 600)",
      "Sanctions & enhanced risk flags",
      "EUDR scope & due-diligence triggers",
      "Pre-built supplier document requests",
      "Required documents checklist with deadlines",
      "Late-document alerts until docking",
    ],
  },
  {
    key: "shield_3",
    name: "🛡️ TapTrao Shield: 3-Pack",
    price: "$299",
    lookups: 3,
    perLookup: "$100",
    features: [
      "Everything in a single Shield check",
      "Best for 1–3 shipments per month",
    ],
    popular: true,
  },
  {
    key: "shield_5",
    name: "🛡️ TapTrao Shield: 5-Pack",
    price: "$475",
    lookups: 5,
    perLookup: "$95",
    features: [
      "Everything in a single Shield check",
      "Best for regular corridors & repeat shipments",
    ],
  },
];

const faqs = [
  {
    q: "What's included in TapTrao Shield?",
    a: "Each Shield activation gives you one full shipment check — LC document scanning & data extraction, UCP 600 consistency checks, sanctions & risk flags, EUDR scope, supplier document requests, deadline tracking, and late-document alerts until docking or bank presentation.",
  },
  {
    q: "Is the first check really free?",
    a: "Yes. The Pre-Shipment Regulatory Check is free and unlimited — no card required. It shows which regulations apply to your corridor. TapTrao Shield adds full protection for $110 per shipment.",
  },
  {
    q: "What if my supplier corrects documents?",
    a: "Your first LC check per shipment is included with Shield. If your supplier updates documents and you need to re-check before resubmitting to the bank, additional checks are $9.99 each.",
  },
  {
    q: "Can I check an LC without activating Shield?",
    a: "Yes. A standalone LC check is available for $49.99. It's included free with every TapTrao Shield activation.",
  },
  {
    q: "Why is the LC check included with Shield?",
    a: "Because banks reject documents based on combined compliance and LC discrepancies. Checking them together reduces risk.",
  },
  {
    q: "Which countries are covered?",
    a: "54 African origin countries. EU, UK, USA, Canada, Türkiye, and Switzerland as destinations. 90+ commodity chapters. Designed for real commodity trade.",
  },
  {
    q: "Does TapTrao Shield expire?",
    a: "No. Your Shield activations never expire. Use them whenever you need a shipment check.",
  },
  {
    q: "What about high-volume or team needs?",
    a: "Running 10+ shipments per month? Contact us at hello@taptrao.com for custom pricing built around your corridors.",
  },
];

const S = {
  page: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "48px 16px",
  } as React.CSSProperties,
  heading: {
    fontFamily: "var(--fh)",
    fontWeight: 900,
    fontSize: 28,
    color: "var(--t1)",
    letterSpacing: "0",
    margin: 0,
  } as React.CSSProperties,
  sub: {
    fontFamily: "var(--fb)",
    fontSize: 13,
    color: "var(--t2)",
    maxWidth: 480,
    margin: "8px auto 0",
    lineHeight: 1.6,
  } as React.CSSProperties,
  card: {
    background: "var(--card)",
    borderRadius: 14,
    border: "none",
    padding: 24,
  } as React.CSSProperties,
  badge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    padding: "4px 10px",
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,
  statLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--t3)",
  } as React.CSSProperties,
  btnPrimary: {
    background: "var(--blue)",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    padding: "10px 20px",
    fontFamily: "var(--fb)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity .15s",
  } as React.CSSProperties,
  btnOutline: {
    background: "transparent",
    color: "var(--t1)",
    borderRadius: 8,
    border: "1px solid var(--border2)",
    padding: "10px 20px",
    fontFamily: "var(--fb)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "opacity .15s",
  } as React.CSSProperties,
  sectionTitle: {
    fontFamily: "var(--fh)",
    fontWeight: 900,
    fontSize: 20,
    color: "var(--t1)",
    letterSpacing: "0",
    textAlign: "center" as const,
    margin: "0 0 8px",
  } as React.CSSProperties,
  sectionSub: {
    fontFamily: "var(--fb)",
    fontSize: 13,
    color: "var(--t2)",
    textAlign: "center" as const,
    margin: "0 0 24px",
  } as React.CSSProperties,
  shimmer: {
    position: "absolute" as const,
    inset: -1,
    borderRadius: 15,
    background: "linear-gradient(135deg, var(--blue-bd), var(--blue-dim), var(--blue-bd))",
    zIndex: 0,
    pointerEvents: "none" as const,
  } as React.CSSProperties,
};

export default function Pricing() {
  usePageTitle("Pricing", "Pay-per-shipment trade compliance pricing. First check is free.");
  const tokenQuery = useTokenBalance();
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async (pack: string) => {
      const res = await apiRequest("POST", "/api/tokens/checkout", { pack });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Unable to start checkout", variant: "destructive" });
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
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message || "Unable to start checkout", variant: "destructive" });
    },
  });

  const balance = tokenQuery.data?.balance ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "var(--fb)", WebkitFontSmoothing: "antialiased", flex: 1, minWidth: 0 }}>
      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", gap: 6, overflow: "hidden" }}>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
            <img src="/logo.png" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
            <span className="hide-on-mobile" style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.95)" }}>TapTrao</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "auto", WebkitOverflowScrolling: "touch", flexShrink: 1, minWidth: 0, msOverflowStyle: "none", scrollbarWidth: "none" }}>
          <Link href="/lookup">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Lookup</span>
          </Link>
          <Link href="/lc-check">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>LC Checker</span>
          </Link>
          <Link href="/dashboard">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Dashboard</span>
          </Link>
          <Link href="/lookup">
            <span style={{ background: "#4a8c6f", color: "white", padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              Free check →
            </span>
          </Link>
        </div>
      </nav>
      <div style={S.page}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={S.heading} data-testid="text-pricing-title">
            Choose your level of protection
          </h1>
          <p style={S.sub}>
            Run a free regulatory check, or activate TapTrao Shield for full shipment protection.
          </p>
          {tokenQuery.data && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{ ...S.badge, background: "var(--card2)", color: "var(--t1)", fontSize: 12 }}
                data-testid="badge-pricing-balance"
              >
                <Shield style={{ width: 14, height: 14 }} /> {balance} Shield {balance === 1 ? "check" : "checks"}
              </span>
              {!tokenQuery.data.freeLookupUsed && (
                <span
                  style={{ ...S.badge, background: "var(--gbg)", color: "var(--green)", border: "1px solid var(--gbd)" }}
                  data-testid="badge-free-demo"
                >
                  First check free
                </span>
              )}
            </div>
          )}
        </div>

        {/* Free check banner */}
        <div
          style={{ ...S.card, background: "var(--gbg)", marginBottom: 40, display: "flex", flexDirection: "column", gap: 16 }}
          data-testid="card-free-lookup-banner"
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ padding: 12, borderRadius: "50%", background: "rgba(74,140,111,0.12)", flexShrink: 0 }}>
              <Gift style={{ width: 24, height: 24, color: "var(--green)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 16, color: "var(--t1)", margin: "0 0 4px" }}>
                Your first check is free
              </h3>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                Run one full compliance check for free — no card required. See duties, required documents, and shipment risks.
              </p>
            </div>
          </div>
          <button
            style={{ ...S.btnOutline, border: "1px solid var(--gbd)", color: "var(--green)", width: "100%" }}
            onClick={() => window.location.href = "/lookup"}
            data-testid="button-free-lookup-cta"
          >
            <Search style={{ width: 16, height: 16 }} />
            Check shipment risk — Free
          </button>
        </div>

        {/* Promo Code Redemption */}
        <div style={{ ...S.card, marginBottom: 40, background: "var(--card2)" }}>
          <PromoCodeRedeem />
        </div>

        {/* SECTION 1 — Trade Packs (core product, FIRST) */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={S.sectionTitle} data-testid="text-trade-packs-heading">
            TapTrao Shield
          </h2>
          <p style={S.sectionSub}>
            Ongoing trade risk checks until docking. Activate more, save more.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {tradePacks.map((pack) => (
              <div
                key={pack.key}
                style={{ position: "relative" }}
                data-testid={`card-pack-${pack.key}`}
              >
                {pack.popular && <div style={S.shimmer} />}
                <div style={{ ...S.card, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                  {pack.popular && (
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                      <span style={{ ...S.badge, background: "var(--blue)", color: "#fff" }}>
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 16, color: "var(--t1)" }}>
                      {pack.name}
                    </div>
                    <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, color: "var(--t1)", marginTop: 8, letterSpacing: "0" }}>
                      {pack.price}
                    </div>
                    <div style={{ ...S.statLabel, marginTop: 6 }}>
                      {pack.lookups} {pack.lookups === 1 ? "shipment" : "shipments"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                      {pack.perLookup} per shipment
                    </div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", flex: 1 }}>
                    {pack.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--t2)", marginBottom: 6 }}>
                        <Check style={{ width: 14, height: 14, color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    style={{
                      ...(pack.popular ? S.btnPrimary : S.btnOutline),
                      width: "100%",
                      opacity: checkoutMutation.isPending ? 0.6 : 1,
                    }}
                    disabled={checkoutMutation.isPending}
                    onClick={() => checkoutMutation.mutate(pack.key)}
                    data-testid={`button-buy-${pack.key}`}
                  >
                    {checkoutMutation.isPending && checkoutMutation.variables === pack.key ? (
                      <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                    ) : null}
                    Activate {pack.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing disclaimer */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 11, color: "var(--t3)", margin: 0, maxWidth: 520, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
            TapTrao does not provide legal or banking advice. Reports are informational and designed to support internal decision-making.
          </p>
        </div>

        {/* SECTION 2 — What's included (clarity block) */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ ...S.card, background: "var(--card2)", padding: 28 }}>
            <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "var(--t1)", margin: "0 0 16px", textAlign: "center" }}>
              Every TapTrao Shield activation includes
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              {[
                "Full compliance check",
                "Buyer & supplier document checklist",
                "LC document check (first submission)",
                "TwinLog score & audit trail",
                "Customs data for broker (CSV)",
                "Instructions for supplier",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)" }}>
                  <Check style={{ width: 14, height: 14, color: "var(--green)", flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3 — LC-only (secondary, muted) */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={S.sectionTitle}>
            Already have an LC?
          </h2>
          <p style={S.sectionSub}>
            Standalone LC checking without activating TapTrao Shield.
          </p>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ ...S.card, background: "var(--card2)", border: "1px solid var(--border2)" }} data-testid="card-lc-standalone">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <FileCheck style={{ width: 20, height: 20, color: "var(--blue)" }} />
                <span style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 16, color: "var(--t1)" }}>
                  LC Document Check
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, color: "var(--t1)", letterSpacing: "0" }}>
                  $49.99
                </span>
                <span style={{ color: "var(--t2)", fontSize: 13, marginLeft: 6 }}>one-time</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Validate supplier documents against your Letter of Credit (UCP 600) before submitting to the bank.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 12px" }}>
                {[
                  { text: "First LC submission check", included: true },
                  { text: "Discrepancy summary & fix suggestions", included: true },
                  { text: "Compliance check", included: false },
                  { text: "Document checklist", included: false },
                ].map((f) => (
                  <li key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: f.included ? "var(--t2)" : "var(--t3)", marginBottom: 6 }}>
                    {f.included ? (
                      <Check style={{ width: 14, height: 14, color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <X style={{ width: 14, height: 14, color: "var(--t3)", marginTop: 2, flexShrink: 0 }} />
                    )}
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: 11, color: "var(--green)", margin: "0 0 16px", fontStyle: "italic" }}>
                Included free with every TapTrao Shield activation
              </p>
              <button
                style={{
                  ...S.btnOutline,
                  width: "100%",
                  opacity: lcStandaloneMutation.isPending ? 0.6 : 1,
                }}
                disabled={lcStandaloneMutation.isPending}
                onClick={() => lcStandaloneMutation.mutate()}
                data-testid="button-lc-standalone"
              >
                {lcStandaloneMutation.isPending ? (
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                ) : (
                  <FileCheck style={{ width: 16, height: 16 }} />
                )}
                Check LC only — $49.99
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4 — LC Corrections (add-on) */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ ...S.card, border: "1px solid var(--border2)" }} data-testid="card-lc-recheck-addon">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <RefreshCw style={{ width: 18, height: 18, color: "var(--blue)" }} />
                <span style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 14, color: "var(--t1)" }}>
                  LC corrections (if documents are updated)
                </span>
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 22, color: "var(--t1)", letterSpacing: "0" }}>
                  $9.99
                </span>
                <span style={{ color: "var(--t2)", fontSize: 13, marginLeft: 6 }}>per re-check</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                If your supplier corrects documents after the first submission, you can re-check the LC before resubmitting to the bank.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5 — High volume (de-emphasised) */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ ...S.card, border: "1px dashed var(--border2)", background: "transparent" }} data-testid="card-enterprise">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Building2 style={{ width: 18, height: 18, color: "var(--t2)" }} />
                <span style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 14, color: "var(--t1)" }}>
                  High-volume or team usage
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Custom pricing, shared credits, API access, and dedicated support.
              </p>
              <button
                style={{ ...S.btnOutline, width: "100%" }}
                onClick={() => window.location.href = "mailto:hello@taptrao.com?subject=Enterprise%20Pricing%20Enquiry"}
                data-testid="button-enterprise-contact"
              >
                <Mail style={{ width: 16, height: 16 }} />
                Contact sales
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 6 — Monitoring (muted) */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ ...S.card, border: "1px dashed var(--border2)", background: "transparent", opacity: 0.7 }} data-testid="card-pro-monitoring">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Bell style={{ width: 18, height: 18, color: "var(--t3)" }} />
                <span style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 14, color: "var(--t1)" }}>
                  Pro Monitoring
                </span>
                <span style={{ ...S.badge, background: "var(--abg)", color: "var(--amber)", border: "1px solid var(--abd)" }}>
                  Coming Soon
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                Regulatory change alerts and compliance calendar. For frequent shippers. Not required for occasional trades.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 7 — Public API (coming soon) */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ ...S.card, border: "1px dashed var(--border2)", background: "transparent", opacity: 0.7 }} data-testid="card-public-api">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Shield style={{ width: 18, height: 18, color: "var(--t3)" }} />
                <span style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 14, color: "var(--t1)" }}>
                  Public API
                </span>
                <span style={{ ...S.badge, background: "var(--abg)", color: "var(--amber)", border: "1px solid var(--abd)" }}>
                  Coming Soon
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                Integrate compliance checks directly into your systems via REST API. Programmatic access to duties, document requirements, and risk scores.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ ...S.sectionTitle, fontSize: 24, marginBottom: 32 }} data-testid="text-faq-title">
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ ...S.card, padding: 20 }}>
                <h3
                  style={{ fontFamily: "var(--fb)", fontWeight: 600, fontSize: 14, color: "var(--t1)", margin: "0 0 8px" }}
                  data-testid={`faq-question-${i}`}
                >
                  {faq.q}
                </h3>
                <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
