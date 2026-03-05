import { Link } from "wouter";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, FileCheck, Loader2, Check, Building2, Mail, RefreshCw, Clock, ArrowUpRight, ArrowDownRight, Gift } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { trackEvent } from "@/lib/analytics";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/AppShell";
import PromoCodeRedeem from "@/components/promo-code-redeem";
import type { TokenTransaction } from "@shared/schema";

const tradePacks = [
  {
    key: "shield_single",
    name: "Single",
    price: "$110",
    lookups: 1,
    perLookup: "$110",
    popular: false,
  },
  {
    key: "shield_3",
    name: "3-Pack",
    price: "$299",
    lookups: 3,
    perLookup: "$100",
    popular: true,
  },
  {
    key: "shield_5",
    name: "5-Pack",
    price: "$475",
    lookups: 5,
    perLookup: "$95",
    popular: false,
  },
];

const S = {
  card: {
    background: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,.03), 0 4px 16px rgba(0,0,0,.05)",
    padding: 24,
  } as React.CSSProperties,
  badge: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    padding: "4px 10px",
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,
  btnPrimary: {
    background: "var(--sage)",
    color: "#fff",
    borderRadius: 8,
    border: "none",
    padding: "10px 20px",
    fontFamily: "var(--fb)",
    fontSize: 13,
    fontWeight: 700,
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
    color: "var(--t2)",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.12)",
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
};

export default function Pricing() {
  const { t } = useTranslation("pricing");
  usePageTitle(t("title"));
  useEffect(() => { trackEvent("pricing_page_viewed"); }, []);
  const tokenQuery = useTokenBalance();
  const { toast } = useToast();

  const transactionsQuery = useQuery<TokenTransaction[]>({
    queryKey: ["/api/tokens/transactions"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (pack: string) => {
      trackEvent("checkout_started", { pack });
      const res = await apiRequest("POST", "/api/tokens/checkout", { pack });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast({ title: t("checkoutError"), description: err.message || t("checkoutErrorDefault"), variant: "destructive" });
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
      toast({ title: t("checkoutError"), description: err.message || t("checkoutErrorDefault"), variant: "destructive" });
    },
  });

  const balance = tokenQuery.data?.balance ?? 0;
  const lcBalance = tokenQuery.data?.lcBalance ?? 0;
  const transactions = transactionsQuery.data ?? [];

  return (
    <AppShell>
      {/* Hero */}
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }} data-testid="text-pricing-title">
          {t("title")}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("subtitle")}
        </p>
      </div>

      <div style={{ margin: "0 24px 32px", maxWidth: 900 }}>
        {/* -- SECTION A: Credit Balance -- */}
        <div className="pricing-balance-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Shield Credits */}
          <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }} data-testid="card-shield-balance">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(109,184,154,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Shield style={{ width: 24, height: 24, color: "var(--sage-l)" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 32, color: "var(--t1)", lineHeight: 1 }}>
                {balance}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginTop: 4 }}>
                {balance === 1 ? t("shieldOne") : t("shieldMany")}
              </div>
            </div>
            {tokenQuery.data && !tokenQuery.data.freeLookupUsed && (
              <span
                style={{ ...S.badge, background: "rgba(109,184,154,0.1)", color: "var(--sage-l)", border: "1px solid rgba(109,184,154,0.2)", marginLeft: "auto" }}
                data-testid="badge-free-demo"
              >
                <Gift style={{ width: 10, height: 10 }} /> {t("firstCheckFree")}
              </span>
            )}
          </div>

          {/* LC Credits */}
          <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }} data-testid="card-lc-balance">
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(59,130,246,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FileCheck style={{ width: 24, height: 24, color: "#60a5fa" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 32, color: "var(--t1)", lineHeight: 1 }}>
                {lcBalance}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t3)", marginTop: 4 }}>
                LC {lcBalance === 1 ? t("lcCreditOne") : t("lcCreditMany")}
              </div>
            </div>
          </div>
        </div>

        {/* -- SECTION B: Transaction History -- */}
        <div style={{ ...S.card, marginBottom: 24 }} data-testid="section-transaction-history">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock style={{ width: 16, height: 16, color: "var(--t3)" }} />
              <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "var(--t1)" }}>
                {t("transactionHistory")}
              </span>
            </div>
            <span style={{ ...S.badge, background: "rgba(0,0,0,0.04)", color: "var(--t3)" }}>
              {transactions.length} {transactions.length === 1 ? t("entryOne") : t("entryMany")}
            </span>
          </div>

          {transactionsQuery.isLoading ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--t3)", fontSize: 13 }}>
              {t("loadingTransactions")}
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 13, color: "var(--t3)", margin: 0 }}>
                {t("noTransactions")}
              </p>
            </div>
          ) : (
            <div data-testid="table-transactions">
              {/* Header row */}
              <div className="pricing-tx-row" style={{ display: "grid", gridTemplateColumns: "110px 80px 1fr 80px", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t4)" }}>{t("headerDate")}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t4)" }}>{t("headerType")}</span>
                <span className="pricing-tx-desc-hdr" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t4)" }}>{t("headerDescription")}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--t4)", textAlign: "right" }}>{t("headerAmount")}</span>
              </div>
              {/* Transaction rows */}
              {transactions.map((tx, idx) => {
                const isPurchase = tx.type === "PURCHASE";
                const date = new Date(tx.createdAt);
                return (
                  <div
                    key={tx.id}
                    className="pricing-tx-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "110px 80px 1fr 80px",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: idx < transactions.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                      alignItems: "center",
                    }}
                    data-testid={`transaction-row-${idx}`}
                  >
                    <span style={{ fontSize: 14, color: "var(--t3)" }}>
                      {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    <span style={{
                      ...S.badge,
                      fontSize: 8,
                      padding: "2px 6px",
                      background: isPurchase ? "rgba(109,184,154,0.1)" : "rgba(0,0,0,0.04)",
                      color: isPurchase ? "var(--sage-l)" : "var(--t3)",
                      border: isPurchase ? "1px solid rgba(109,184,154,0.2)" : "1px solid rgba(0,0,0,0.06)",
                      width: "fit-content",
                    }}>
                      {tx.type}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.description}
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "'Inter', sans-serif",
                      textAlign: "right",
                      color: isPurchase ? "var(--sage-l)" : "var(--t3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 4,
                    }}>
                      {isPurchase ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : <ArrowDownRight style={{ width: 12, height: 12 }} />}
                      {isPurchase ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promo Code */}
        <div style={{ ...S.card, marginBottom: 32 }}>
          <PromoCodeRedeem />
        </div>

        {/* -- SECTION C: Buy More Credits -- */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 20, color: "var(--t1)", margin: "0 0 6px" }}>
            {t("buyMoreCredits")}
          </h2>
          <p style={{ fontSize: 13, color: "var(--t3)", margin: "0 0 20px" }}>
            {t("buyMoreSubtitle")}
          </p>

          {/* Shield Packs Grid */}
          <div className="pricing-packs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {tradePacks.map((pack) => (
              <div
                key={pack.key}
                style={{
                  background: pack.popular ? "var(--sage)" : "#ffffff",
                  borderRadius: 16,
                  border: pack.popular ? "none" : "1px solid rgba(0,0,0,0.08)",
                  boxShadow: pack.popular ? "0 4px 24px rgba(74,124,94,0.18)" : "0 1px 3px rgba(0,0,0,.03), 0 4px 16px rgba(0,0,0,.05)",
                  padding: "20px 16px",
                  textAlign: "center",
                  position: "relative",
                }}
                data-testid={`card-pack-${pack.key}`}
              >
                {pack.popular && (
                  <span style={{ ...S.badge, background: "#fff", color: "var(--sage)", fontWeight: 700, position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)" }}>
                    {t("mostPopular")}
                  </span>
                )}
                <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 24, color: pack.popular ? "#fff" : "var(--t1)", marginBottom: 4, marginTop: pack.popular ? 6 : 0 }}>
                  {pack.price}
                </div>
                <div style={{ fontSize: 13, color: pack.popular ? "rgba(255,255,255,0.8)" : "var(--t2)", marginBottom: 4 }}>
                  {pack.lookups} {pack.lookups === 1 ? t("shipmentOne") : t("shipmentMany")}
                </div>
                <div style={{ fontSize: 13, color: pack.popular ? "rgba(255,255,255,0.6)" : "var(--t3)", marginBottom: 14 }}>
                  {pack.perLookup} {t("perShipment")}
                </div>
                <button
                  style={{
                    ...(pack.popular
                      ? { ...S.btnPrimary, background: "#fff", color: "var(--sage)" }
                      : S.btnOutline),
                    width: "100%",
                    padding: "8px 14px",
                    fontSize: 14,
                    opacity: checkoutMutation.isPending ? 0.6 : 1,
                  }}
                  disabled={checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate(pack.key)}
                  data-testid={`button-buy-${pack.key}`}
                >
                  {checkoutMutation.isPending && checkoutMutation.variables === pack.key ? (
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  ) : null}
                  {t("activate")}
                </button>
              </div>
            ))}
          </div>

          {/* LC Standalone + Corrections + Enterprise -- compact row */}
          <div className="pricing-addons-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {/* LC Standalone */}
            <div style={{ ...S.card, padding: 18 }} data-testid="card-lc-standalone">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <FileCheck style={{ width: 16, height: 16, color: "#60a5fa" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{t("lcCheckOnly")}</span>
              </div>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 22, color: "var(--t1)", marginBottom: 4 }}>
                {t("lcCheckOnlyPrice")}
              </div>
              <p style={{ fontSize: 13, color: "var(--t3)", margin: "0 0 4px", lineHeight: 1.5 }}>
                {t("lcCheckOnlyDescription")}
              </p>
              <p style={{ fontSize: 14, color: "var(--sage-l)", margin: "0 0 12px", fontStyle: "italic" }}>
                {t("includedFreeWithShield")}
              </p>
              <button
                style={{ ...S.btnOutline, width: "100%", padding: "8px 14px", fontSize: 12 }}
                disabled={lcStandaloneMutation.isPending}
                onClick={() => lcStandaloneMutation.mutate()}
                data-testid="button-lc-standalone"
              >
                {lcStandaloneMutation.isPending ? (
                  <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                ) : null}
                {t("buyLcCheck")}
              </button>
            </div>

            {/* LC Corrections */}
            <div style={{ ...S.card, padding: 18 }} data-testid="card-lc-recheck-addon">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <RefreshCw style={{ width: 16, height: 16, color: "#60a5fa" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{t("lcRecheck")}</span>
              </div>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 22, color: "var(--t1)", marginBottom: 4 }}>
                {t("lcRecheckPrice")}
              </div>
              <p style={{ fontSize: 13, color: "var(--t3)", margin: 0, lineHeight: 1.5 }}>
                {t("lcRecheckDescription")}
              </p>
            </div>

            {/* Enterprise */}
            <div style={{ ...S.card, padding: 18, background: "transparent", border: "1px dashed rgba(0,0,0,0.12)" }} data-testid="card-enterprise">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Building2 style={{ width: 16, height: 16, color: "var(--t3)" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{t("highVolume")}</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t3)", margin: "0 0 12px", lineHeight: 1.5 }}>
                {t("highVolumeDescription")}
              </p>
              <button
                style={{ ...S.btnOutline, width: "100%", padding: "8px 14px", fontSize: 12 }}
                onClick={() => window.location.href = "mailto:hello@taptrao.com?subject=Enterprise%20Pricing%20Enquiry"}
                data-testid="button-enterprise-contact"
              >
                <Mail style={{ width: 14, height: 14 }} />
                {t("contactSales")}
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 13, color: "var(--t4)", textAlign: "center", margin: "0 0 24px", lineHeight: 1.5 }}>
          {t("disclaimer")}
        </p>
      </div>
    </AppShell>
  );
}
