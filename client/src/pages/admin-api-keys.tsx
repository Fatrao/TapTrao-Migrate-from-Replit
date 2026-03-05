import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";

type ApiKeyRow = {
  id: string;
  name: string;
  keyPreview: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function AdminApiKeys() {
  const { t } = useTranslation("admin");
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { data: tokenData } = useTokenBalance();

  usePageTitle("API Keys");

  if (tokenData && !tokenData.isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const keysQuery = useQuery<ApiKeyRow[]>({
    queryKey: ["/api/admin/api-keys"],
    enabled: !!tokenData?.isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/api-keys", { name });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setNewKey(data.key);
      setName("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      setNewKey("");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/api-keys/${id}/deactivate`);
      if (!res.ok) throw new Error("Failed to deactivate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
    },
  });

  const keys = keysQuery.data || [];

  return (
    <AppShell contentClassName="content-area">
      <div className="green-hero-box" style={{ margin: "4px 24px 16px" }}>
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>
          {t("apiKeys.title")}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          {t("apiKeys.subtitle")}
        </p>
      </div>

      {/* Create form */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 16px" }}>
          {t("apiKeys.createTitle")}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setNewKey("");
            createMutation.mutate();
          }}
        >
          <div className="form-group">
            <label>{t("apiKeys.keyNameLabel")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("apiKeys.keyNamePlaceholder")}
            />
          </div>

          {error && <div style={{ fontSize: 14, color: "var(--red)", marginBottom: 8 }}>{error}</div>}

          {newKey && (
            <div style={{ marginBottom: 16, padding: 16, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                {t("apiKeys.keyCreatedWarning")}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 13, background: "#fff", padding: "10px 12px", borderRadius: 6, border: "1px solid #e5e7eb", wordBreak: "break-all", userSelect: "all" }}>
                {newKey}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending || !name}
            style={{
              background: "var(--sage)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              opacity: createMutation.isPending || !name ? 0.5 : 1,
            }}
          >
            {createMutation.isPending ? t("apiKeys.generating") : t("apiKeys.generateButton")}
          </button>
        </form>
      </div>

      {/* Keys table */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 12px" }}>
          {t("apiKeys.yourKeysTitle", { count: keys.length })}
        </h2>
        {keys.length === 0 ? (
          <p style={{ fontSize: 13, color: "#555" }}>{t("apiKeys.noKeysYet")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("apiKeys.tableName")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("apiKeys.tableKey")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("apiKeys.tableLastUsed")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t("apiKeys.tableStatus")}</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "#666", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{k.name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 14, color: "#666" }}>{k.keyPreview}</td>
                    <td style={{ padding: "10px 12px", color: "#555" }}>
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : t("apiKeys.neverUsed")}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                        background: k.isActive ? "#dcfce7" : "#fee2e2",
                        color: k.isActive ? "#16a34a" : "#ef4444",
                      }}>
                        {k.isActive ? t("apiKeys.statusActive") : t("apiKeys.statusRevoked")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {k.isActive && (
                        <button
                          onClick={() => deactivateMutation.mutate(k.id)}
                          disabled={deactivateMutation.isPending}
                          style={{
                            background: "none",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 13,
                            color: "#555",
                            cursor: "pointer",
                          }}
                        >
                          {t("apiKeys.revokeButton")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage guide */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 12px" }}>
          {t("apiKeys.quickStartTitle")}
        </h2>
        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 12px" }}>{t("apiKeys.quickStartIntro").replace("<code>", "").replace("</code>", "")} <code style={{ background: "#f5f5f5", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>Authorization</code></p>
          <div style={{ fontFamily: "monospace", fontSize: 14, background: "#1a1a1a", color: "#5dd9c1", padding: 16, borderRadius: 8, overflowX: "auto", marginBottom: 16 }}>
            <div>curl -H "Authorization: Bearer tt_live_..." \</div>
            <div>&nbsp;&nbsp;https://taptrao.com/api/v1/commodities</div>
          </div>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{t("apiKeys.availableEndpoints")}</p>
          <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["GET", "/api/v1/commodities", t("apiKeys.endpointListCommodities"), "No"],
                ["GET", "/api/v1/origins", t("apiKeys.endpointListOrigins"), "No"],
                ["GET", "/api/v1/destinations", t("apiKeys.endpointListDestinations"), "No"],
                ["POST", "/api/v1/compliance-check", t("apiKeys.endpointComplianceCheck"), "1 credit"],
                ["POST", "/api/v1/lc-check", t("apiKeys.endpointLcCheck"), "1 credit"],
                ["GET", "/api/v1/lookups", t("apiKeys.endpointListLookups"), "No"],
                ["GET", "/api/v1/lookups/:id", t("apiKeys.endpointLookupDetail"), "No"],
                ["GET", "/api/v1/lc-checks/:id", t("apiKeys.endpointLcCheckDetail"), "No"],
                ["GET", "/api/v1/balance", t("apiKeys.endpointBalance"), "No"],
              ].map(([method, path, desc, cost]) => (
                <tr key={path} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "6px 8px", fontFamily: "monospace", fontWeight: 600, color: method === "POST" ? "#0e4e45" : "#555" }}>{method}</td>
                  <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>{path}</td>
                  <td style={{ padding: "6px 8px", color: "#555" }}>{desc}</td>
                  <td style={{ padding: "6px 8px", color: cost === "No" ? "#555" : "#0e4e45", fontWeight: cost !== "No" ? 600 : 400 }}>{cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
