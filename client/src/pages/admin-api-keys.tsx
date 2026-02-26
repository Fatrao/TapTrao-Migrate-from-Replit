import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
          API Keys
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          Generate API keys for programmatic access to TapTrao's compliance and LC checking endpoints
        </p>
      </div>

      {/* Create form */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "var(--card-heading)", margin: "0 0 16px" }}>
          Create New API Key
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
            <label>Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production, Testing"
            />
          </div>

          {error && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 8 }}>{error}</div>}

          {newKey && (
            <div style={{ marginBottom: 16, padding: 16, background: "rgba(74,140,111,0.1)", border: "1px solid rgba(74,140,111,0.2)", borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                API Key Created — Copy it now, it won't be shown again
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 13, background: "rgba(255,255,255,0.06)", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", color: "var(--card-heading)", wordBreak: "break-all", userSelect: "all" }}>
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
            {createMutation.isPending ? "Creating..." : "Generate API Key"}
          </button>
        </form>
      </div>

      {/* Keys table */}
      <div className="form-card" style={{ margin: "0 24px 20px" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "var(--card-heading)", margin: "0 0 12px" }}>
          Your API Keys ({keys.length})
        </h2>
        {keys.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--card-body)" }}>No API keys yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--card-border-subtle)", textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "var(--card-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "var(--card-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Key</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "var(--card-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Last Used</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "var(--card-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</th>
                  <th style={{ padding: "8px 12px", fontWeight: 600, color: "var(--card-label)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: "1px solid var(--card-border-subtle)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{k.name}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "var(--card-label)" }}>{k.keyPreview}</td>
                    <td style={{ padding: "10px 12px", color: "var(--card-body)" }}>
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: k.isActive ? "rgba(74,140,111,0.15)" : "rgba(239,68,68,0.15)",
                        color: k.isActive ? "#4ade80" : "#f87171",
                      }}>
                        {k.isActive ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {k.isActive && (
                        <button
                          onClick={() => deactivateMutation.mutate(k.id)}
                          disabled={deactivateMutation.isPending}
                          style={{
                            background: "none",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: 11,
                            color: "var(--card-body)",
                            cursor: "pointer",
                          }}
                        >
                          Revoke
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
        <h2 style={{ fontFamily: "var(--fh)", fontSize: 16, fontWeight: 600, color: "var(--card-heading)", margin: "0 0 12px" }}>
          Quick Start
        </h2>
        <div style={{ fontSize: 13, color: "var(--card-body)", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 12px" }}>Use your API key in the <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>Authorization</code> header:</p>
          <div style={{ fontFamily: "monospace", fontSize: 12, background: "#1a1a1a", color: "#4ade80", padding: 16, borderRadius: 8, overflowX: "auto", marginBottom: 16 }}>
            <div>curl -H "Authorization: Bearer tt_live_..." \</div>
            <div>&nbsp;&nbsp;https://taptrao.com/api/v1/commodities</div>
          </div>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Available endpoints:</p>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["GET", "/api/v1/commodities", "List commodities", "No"],
                ["GET", "/api/v1/origins", "List origin countries", "No"],
                ["GET", "/api/v1/destinations", "List destinations", "No"],
                ["POST", "/api/v1/compliance-check", "Run compliance check", "1 credit"],
                ["POST", "/api/v1/lc-check", "Run LC document check", "1 credit"],
                ["GET", "/api/v1/lookups", "List past lookups", "No"],
                ["GET", "/api/v1/lookups/:id", "Get lookup detail", "No"],
                ["GET", "/api/v1/lc-checks/:id", "Get LC check detail", "No"],
                ["GET", "/api/v1/balance", "Check credit balance", "No"],
              ].map(([method, path, desc, cost]) => (
                <tr key={path} style={{ borderBottom: "1px solid var(--card-border-subtle)" }}>
                  <td style={{ padding: "6px 8px", fontFamily: "monospace", fontWeight: 600, color: method === "POST" ? "#6b9080" : "#555" }}>{method}</td>
                  <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>{path}</td>
                  <td style={{ padding: "6px 8px", color: "var(--card-body)" }}>{desc}</td>
                  <td style={{ padding: "6px 8px", color: cost === "No" ? "#555" : "#6b9080", fontWeight: cost !== "No" ? 600 : 400 }}>{cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
