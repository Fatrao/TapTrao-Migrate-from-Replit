import { Link } from "wouter";
import { Search, FileCheck, Bell, Calendar, Shield, Archive, Loader2, Hexagon, Check, Building2, Mail, Gift, RefreshCw, ArrowLeft } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const tradePacks = [
  {
    key: "single_trade",
    name: "Single Trade",
    price: "$24.99",
    lookups: 1,
    perLookup: "$24.99",
    features: [
      "Full compliance check",
      "TwinLog Score & Trail PDF",
      "LC Document Check (1 included)",
      "Customs Data Pack CSV",
      "Supplier Brief",
    ],
  },
  {
    key: "3_trade",
    name: "3-Trade Pack",
    price: "$59.99",
    lookups: 3,
    perLookup: "$20.00",
    features: [
      "Everything in Single Trade × 3",
      "Save as Template",
      "13% discount",
    ],
    popular: true,
  },
  {
    key: "10_trade",
    name: "10-Trade Pack",
    price: "$179",
    lookups: 10,
    perLookup: "$17.90",
    features: [
      "Everything in 3-Trade × 10",
      "Stale-check & refresh",
      "28% discount",
    ],
  },
  {
    key: "25_trade",
    name: "25-Trade Pack",
    price: "$349",
    lookups: 25,
    perLookup: "$13.96",
    features: [
      "Everything in 10-Trade × 25",
      "Best value for teams",
      "44% discount",
    ],
  },
];

const monitoringFeatures = [
  { icon: Bell, label: "Regulatory change alerts" },
  { icon: Calendar, label: "Compliance calendar" },
  { icon: Shield, label: "AEO tracker" },
  { icon: Archive, label: "HMRC archive access" },
];

const faqs = [
  {
    q: "What's included in a trade pack?",
    a: "Each trade credit gives you a full compliance lookup — tariffs, SPS requirements, document checklists, and trade triggers (EUDR, CBAM, Kimberley). It also includes a TwinLog Score, Customs Data Pack CSV, Supplier Brief, TwinLog Trail PDF, and one LC Document Check per trade.",
  },
  {
    q: "What about LC re-checks?",
    a: "Your first LC check per trade is included free. If your supplier corrects documents and you need to re-check, additional LC checks are $9.99 each.",
  },
  {
    q: "Is the first lookup really free?",
    a: "Yes. Your first compliance lookup costs nothing — no credit card required. Premium features like the TwinLog Trail PDF and LC checks unlock when you purchase a trade pack.",
  },
  {
    q: "Which countries are covered?",
    a: "We cover 18 African origin countries and 6 global destinations including UK, EU, USA, China, UAE, and India. AfCFTA intra-African trade is also supported.",
  },
  {
    q: "Do credits expire?",
    a: "No. Your trade credits never expire. Use them whenever you need a compliance check.",
  },
  {
    q: "Can I export compliance results?",
    a: "Yes. Every lookup includes a CSV export of customs data packs with HS codes, document codes, and duty rates. You can also generate a TwinLog Trail PDF for your compliance audit file.",
  },
  {
    q: "What about enterprise or high-volume needs?",
    a: "Contact us for custom pricing on high-volume compliance needs, API access, team accounts, and dedicated support.",
  },
];

const S = {
  page: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "48px 16px",
  } as React.CSSProperties,
  heading: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 900,
    fontSize: 28,
    color: "var(--t1)",
    letterSpacing: "-0.5px",
    margin: 0,
  } as React.CSSProperties,
  sub: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
    fontFamily: "'Fraunces', serif",
    fontWeight: 900,
    fontSize: 20,
    color: "var(--t1)",
    letterSpacing: "-0.3px",
    textAlign: "center" as const,
    margin: "0 0 8px",
  } as React.CSSProperties,
  sectionSub: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
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
  usePageTitle("Pricing", "Pay-per-use trade compliance pricing with trade packs and bundled LC checks.");
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

  const balance = tokenQuery.data?.balance ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Plus Jakarta Sans', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 60, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <img src="/logo.png" alt="TapTrao" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 18, color: "rgba(255,255,255,0.95)" }}>TapTrao</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/lookup">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>Compliance Lookup</span>
          </Link>
          <Link href="/lc-check">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>LC Checker</span>
          </Link>
          <Link href="/dashboard">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer" }}>Dashboard</span>
          </Link>
          <Link href="/lookup">
            <span style={{ background: "#427EFF", color: "white", padding: "8px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Start free →
            </span>
          </Link>
        </div>
      </nav>
      <div style={S.page}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={S.heading} data-testid="text-pricing-title">
            Simple, transparent pricing
          </h1>
          <p style={S.sub}>
            Pay per trade. No subscriptions, no hidden fees. Your first compliance lookup is free.
          </p>
          {tokenQuery.data && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <span
                style={{ ...S.badge, background: "var(--card2)", color: "var(--t1)", fontSize: 12 }}
                data-testid="badge-pricing-balance"
              >
                <Hexagon style={{ width: 14, height: 14 }} /> {balance} trade {balance === 1 ? "credit" : "credits"}
              </span>
              {!tokenQuery.data.freeLookupUsed && (
                <span
                  style={{ ...S.badge, background: "var(--gbg)", color: "var(--green)", border: "1px solid var(--gbd)" }}
                  data-testid="badge-free-demo"
                >
                  First lookup free
                </span>
              )}
            </div>
          )}
        </div>

        {/* Free lookup banner */}
        <div
          style={{ ...S.card, background: "var(--gbg)", marginBottom: 40, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}
          data-testid="card-free-lookup-banner"
        >
          <div style={{ padding: 12, borderRadius: "50%", background: "rgba(34,197,94,0.12)", flexShrink: 0 }}>
            <Gift style={{ width: 24, height: 24, color: "var(--green)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, color: "var(--t1)", margin: "0 0 4px" }}>
              Your first lookup is free
            </h3>
            <p style={{ fontSize: 13, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
              Try a full compliance check on any corridor — no credit card required. See your TwinLog Score, tariffs, SPS requirements, and document checklist. Premium features like TwinLog Trail PDF and LC checks unlock with a trade pack.
            </p>
          </div>
          <button
            style={{ ...S.btnOutline, flexShrink: 0, border: "1px solid var(--gbd)", color: "var(--green)" }}
            onClick={() => window.location.href = "/lookup"}
            data-testid="button-free-lookup-cta"
          >
            <Search style={{ width: 16, height: 16 }} />
            Try Free Lookup
          </button>
        </div>

        {/* Trade Packs */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={S.sectionTitle} data-testid="text-trade-packs-heading">
            Trade Packs
          </h2>
          <p style={S.sectionSub}>
            1 credit = 1 full compliance lookup + bundled LC check. Buy more, save more.
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
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, color: "var(--t1)" }}>
                      {pack.name}
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28, color: "var(--t1)", marginTop: 8, letterSpacing: "-0.5px" }}>
                      {pack.price}
                    </div>
                    <div style={{ ...S.statLabel, marginTop: 6 }}>
                      {pack.lookups} {pack.lookups === 1 ? "trade" : "trades"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                      {pack.perLookup} per trade
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
                    Buy {pack.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LC Re-check + Enterprise */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {/* LC Re-check */}
            <div style={S.card} data-testid="card-lc-recheck-addon">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <RefreshCw style={{ width: 20, height: 20, color: "var(--blue)" }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, color: "var(--t1)" }}>
                  LC Re-check
                </span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 28, color: "var(--t1)", letterSpacing: "-0.5px" }}>
                  $9.99
                </span>
                <span style={{ color: "var(--t2)", fontSize: 13, marginLeft: 6 }}>per re-check</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Your first LC check per trade is included free. If your supplier corrects documents and you need to re-check, additional checks are $9.99 each.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "First LC check bundled in trade pack",
                  "UCP 600 compliance re-check",
                  "Updated correction emails",
                  "Pay only when needed",
                ].map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--t2)", marginBottom: 6 }}>
                    <Check style={{ width: 14, height: 14, color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise */}
            <div style={{ ...S.card, border: "1px dashed var(--border2)" }} data-testid="card-enterprise">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <Building2 style={{ width: 20, height: 20, color: "var(--blue)" }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, color: "var(--t1)" }}>
                  Enterprise
                </span>
                <span style={{ ...S.badge, background: "var(--card2)", color: "var(--t2)" }}>
                  Contact Us
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Custom pricing for high-volume traders, trading houses, and compliance teams.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}>
                {[
                  "Volume discounts beyond 25 trades",
                  "API access for ERP integration",
                  "Team accounts & shared credits",
                  "Dedicated compliance support",
                ].map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "var(--t2)", marginBottom: 6 }}>
                    <Check style={{ width: 14, height: 14, color: "var(--green)", marginTop: 2, flexShrink: 0 }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                style={{ ...S.btnOutline, width: "100%" }}
                onClick={() => window.location.href = "mailto:hello@taptrao.com?subject=Enterprise%20Pricing%20Enquiry"}
                data-testid="button-enterprise-contact"
              >
                <Mail style={{ width: 16, height: 16 }} />
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Pro Monitoring */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ ...S.card, border: "1px dashed var(--border2)" }} data-testid="card-pro-monitoring">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 20, color: "var(--t1)", letterSpacing: "-0.3px" }}>
                    Pro Monitoring
                  </span>
                  <span style={{ ...S.badge, background: "var(--abg)", color: "var(--amber)", border: "1px solid var(--abd)" }}>
                    Coming Soon
                  </span>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: 24, color: "var(--t1)" }}>$29</span>
                  <span style={{ fontSize: 13, color: "var(--t2)", marginLeft: 4 }}>/ month</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--t2)", margin: "0 0 16px", lineHeight: 1.6 }}>
                  Stay ahead of regulatory changes with automated monitoring and alerts.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                  {monitoringFeatures.map((f) => (
                    <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)" }}>
                      <f.icon style={{ width: 16, height: 16, color: "var(--t3)", flexShrink: 0 }} />
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <button style={{ ...S.btnOutline, opacity: 0.45, cursor: "not-allowed" }} disabled data-testid="button-pro-monitoring">
                  Coming Soon
                </button>
              </div>
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
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--t1)", margin: "0 0 8px" }}
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
