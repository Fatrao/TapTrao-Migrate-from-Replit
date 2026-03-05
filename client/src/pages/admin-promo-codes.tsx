import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";

type PromoCode = {
  id: string;
  code: string;
  tradeTokens: number;
  lcCredits: number;
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function AdminPromoCodes() {
  const { t } = useTranslation("admin");
  const [code, setCode] = useState("");
  const [tradeTokens, setTradeTokens] = useState(1);
  const [lcCredits, setLcCredits] = useState(0);
  const [maxRedemptions, setMaxRedemptions] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, navigate] = useLocation();
  const { data: tokenData } = useTokenBalance();

  usePageTitle("Promo Codes");

  // Redirect if not admin
  if (tokenData && !tokenData.isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const codesQuery = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    enabled: !!tokenData?.isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/promo-codes", {
        code,
        tradeTokens,
        lcCredits,
        maxRedemptions,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(t("promoCodes.createdSuccess", { code: data.promoCode.code }));
      setCode("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setSuccess("");
    },
  });

  const codes = codesQuery.data || [];

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          {t("promoCodes.title")}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("promoCodes.subtitle")}
        </p>
      </div>

      {/* Create form */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            {t("promoCodes.createTitle")}
          </h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setSuccess("");
            createMutation.mutate();
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>{t("promoCodes.codeLabel")}</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t("promoCodes.codePlaceholder")}
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div className="form-group">
              <label>{t("promoCodes.tradeTokensLabel")}</label>
              <input type="number" value={tradeTokens} onChange={(e) => setTradeTokens(Number(e.target.value))} min={0} />
            </div>
            <div className="form-group">
              <label>{t("promoCodes.lcCreditsLabel")}</label>
              <input type="number" value={lcCredits} onChange={(e) => setLcCredits(Number(e.target.value))} min={0} />
            </div>
            <div className="form-group">
              <label>{t("promoCodes.maxRedemptionsLabel")}</label>
              <input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(Number(e.target.value))} min={1} />
            </div>
          </div>

          {error && <div style={{ fontSize: 14, color: "var(--red)", marginBottom: 8 }}>{error}</div>}
          {success && <div style={{ fontSize: 14, color: "#16a34a", marginBottom: 8 }}>{success}</div>}

          <button
            type="submit"
            disabled={createMutation.isPending || !code}
            style={{
              background: "var(--sage)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: createMutation.isPending || !code ? 0.5 : 1,
            }}
          >
            {createMutation.isPending ? t("promoCodes.creating") : t("promoCodes.createButton")}
          </button>
        </form>
      </div>

      {/* Codes table */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 12px" }}>
          {t("promoCodes.existingTitle", { count: codes.length })}
        </h2>
        {codes.length === 0 ? (
          <p style={{ fontSize: 13, color: "#555" }}>{t("promoCodes.noCodesYet")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("promoCodes.tableCode")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("promoCodes.tableTokens")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("promoCodes.tableLc")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("promoCodes.tableUsedMax")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("promoCodes.tableStatus")}</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, fontFamily: "monospace", color: "#1a1a1a" }}>{c.code}</td>
                    <td style={{ padding: "10px 12px", color: "#1a1a1a" }}>{c.tradeTokens}</td>
                    <td style={{ padding: "10px 12px", color: "#1a1a1a" }}>{c.lcCredits}</td>
                    <td style={{ padding: "10px 12px", color: "#1a1a1a" }}>{c.currentRedemptions} / {c.maxRedemptions}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        background: c.currentRedemptions >= c.maxRedemptions ? "#fee2e2" : c.isActive ? "#dcfce7" : "#fef3c7",
                        color: c.currentRedemptions >= c.maxRedemptions ? "#ef4444" : c.isActive ? "#16a34a" : "#d97706",
                      }}>
                        {c.currentRedemptions >= c.maxRedemptions ? t("promoCodes.statusExhausted") : c.isActive ? t("promoCodes.statusActive") : t("promoCodes.statusInactive")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
