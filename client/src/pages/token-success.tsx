import { AppShell } from "@/components/AppShell";
import { CheckCircle2, Hexagon, Loader2 } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function TokenSuccess() {
  const { t } = useTranslation("errors");
  usePageTitle(t("tokenSuccess.purchaseComplete"), t("tokenSuccess.packAdded", { packName: "" }));

  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const stripeSessionId = params.get("session_id");

  const verifyQuery = useQuery<{
    success: boolean;
    tokensAdded?: number;
    balance?: number;
    packName?: string;
    message?: string;
  }>({
    queryKey: ["/api/tokens/verify-purchase", `?session_id=${stripeSessionId}`],
    enabled: !!stripeSessionId,
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (verifyQuery.data?.success) {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens/balance"] });
      trackEvent("purchase_completed", {
        pack: verifyQuery.data.packName || "",
        tokens_added: String(verifyQuery.data.tokensAdded || 0),
      });
    }
  }, [verifyQuery.data?.success]);

  if (!stripeSessionId) {
    return (
      <AppShell>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--t2)" }}>{t("tokenSuccess.noSession")}</p>
          <Link href="/pricing">
            <button
              style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16 }}
            >
              {t("tokenSuccess.goToPricing")}
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  if (verifyQuery.isLoading) {
    return (
      <AppShell>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
          <Loader2 size={32} style={{ color: "var(--blue)", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontSize: 15, color: "var(--t2)" }}>{t("tokenSuccess.verifying")}</p>
        </div>
      </AppShell>
    );
  }

  const result = verifyQuery.data;

  return (
    <AppShell>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "64px 16px" }}>
        <div style={{ background: "var(--card)", borderRadius: 14, padding: 32, textAlign: "center" }}>
          {result?.success ? (
            <>
              <CheckCircle2 size={48} style={{ color: "var(--green)", margin: "0 auto 16px" }} />
              <h1
                style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 24, color: "var(--t1)", marginBottom: 8 }}
                data-testid="text-purchase-success"
              >
                {t("tokenSuccess.purchaseComplete")}
              </h1>
              <p style={{ fontSize: 15, color: "var(--t2)", marginBottom: 24 }}>
                {t("tokenSuccess.packAdded", { packName: result.packName })}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700,
                    padding: "4px 12px", borderRadius: 4, background: "var(--gbg)",
                    border: "1px solid var(--gbd)", color: "var(--green)",
                  }}
                  data-testid="badge-tokens-added"
                >
                  {t("tokenSuccess.tokensAdded", { count: result.tokensAdded })}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 15,
                    padding: "4px 12px", borderRadius: 4, background: "var(--card2)",
                    color: "var(--t2)", display: "flex", alignItems: "center", gap: 4,
                  }}
                  data-testid="badge-new-balance"
                >
                  <Hexagon size={12} /> {t("tokenSuccess.balance", { count: result.balance })}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1
                style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 24, color: "var(--t1)", marginBottom: 8 }}
              >
                {t("tokenSuccess.processing")}
              </h1>
              <p style={{ fontSize: 15, color: "var(--t2)", marginBottom: 24 }}>
                {result?.message || t("tokenSuccess.processingDefault")}
              </p>
            </>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/new-check">
              <button
                style={{ background: "var(--blue)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                data-testid="button-go-lookup"
              >
                {t("tokenSuccess.runLookup")}
              </button>
            </Link>
            <Link href="/dashboard">
              <button
                style={{ background: "var(--card2)", color: "var(--t2)", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                data-testid="button-go-dashboard"
              >
                {t("tokenSuccess.dashboard")}
              </button>
            </Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
