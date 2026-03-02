import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";

type FeatureRequest = {
  id: string;
  sessionId: string;
  title: string;
  description: string | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = ["new", "reviewed", "planned", "shipped"] as const;
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "#fef3c7", text: "#d97706" },
  reviewed: { bg: "#dbeafe", text: "#2563eb" },
  planned: { bg: "#e0e7ff", text: "#4f46e5" },
  shipped: { bg: "#dcfce7", text: "#16a34a" },
};

export default function AdminFeatureRequests() {
  const [, navigate] = useLocation();
  const { data: tokenData } = useTokenBalance();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  usePageTitle("Feature Requests");

  if (tokenData && !tokenData.isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const requestsQuery = useQuery<FeatureRequest[]>({
    queryKey: ["/api/admin/feature-requests"],
    enabled: !!tokenData?.isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/feature-requests/${id}`, { status, adminNote });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feature-requests"] });
      setEditingId(null);
      setEditNote("");
    },
  });

  const requests = requestsQuery.data ?? [];

  // Group by status
  const grouped = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = requests.filter((r) => r.status === status);
    return acc;
  }, {} as Record<string, FeatureRequest[]>);

  return (
    <AppShell>
      <div style={{ margin: "4px 24px 16px", padding: "32px 28px", borderRadius: 14, background: "linear-gradient(135deg, #0e4e45, #14574a, #1c6352, #327462, #3a7d6a)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Admin
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Clash Display', sans-serif" }}>
          🗳️ Feature Requests
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6, marginBottom: 0 }}>
          {requests.length} total request{requests.length !== 1 ? "s" : ""} from paying customers
        </p>
      </div>

      <div style={{ padding: "0 24px 40px" }}>
        {STATUS_OPTIONS.map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;
          const colors = STATUS_COLORS[status];

          return (
            <div key={status} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                  padding: "3px 10px", borderRadius: 20, background: colors.bg, color: colors.text,
                }}>
                  {status}
                </span>
                <span style={{ fontSize: 12, color: "#888" }}>{items.length}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((req) => (
                  <div key={req.id} style={{
                    background: "#fff", borderRadius: 12, padding: "16px 20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>
                          {req.title}
                        </div>
                        {req.description && (
                          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 6 }}>
                            {req.description}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#999" }}>
                          {new Date(req.createdAt).toLocaleDateString()} · Session: {req.sessionId.substring(0, 8)}…
                        </div>
                        {req.adminNote && (
                          <div style={{
                            marginTop: 8, padding: "6px 10px", borderRadius: 6,
                            background: "#f8f8f8", fontSize: 12, color: "#555",
                            borderLeft: "3px solid #0e4e45",
                          }}>
                            <strong>Note:</strong> {req.adminNote}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        {STATUS_OPTIONS.filter((s) => s !== req.status).map((s) => {
                          const c = STATUS_COLORS[s];
                          return (
                            <button
                              key={s}
                              onClick={() => updateMutation.mutate({ id: req.id, status: s })}
                              style={{
                                fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                                padding: "4px 10px", borderRadius: 6, border: "none",
                                background: c.bg, color: c.text, cursor: "pointer",
                                letterSpacing: "0.04em",
                              }}
                            >
                              → {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inline note editor */}
                    {editingId === req.id ? (
                      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Add admin note..."
                          style={{
                            flex: 1, padding: "6px 10px", borderRadius: 6,
                            border: "1px solid #ddd", fontSize: 12, outline: "none",
                          }}
                        />
                        <button
                          onClick={() => updateMutation.mutate({ id: req.id, status: req.status, adminNote: editNote })}
                          style={{
                            padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: "#0e4e45", color: "#fff", border: "none", cursor: "pointer",
                          }}
                        >Save</button>
                        <button
                          onClick={() => { setEditingId(null); setEditNote(""); }}
                          style={{
                            padding: "6px 10px", borderRadius: 6, fontSize: 11,
                            background: "#f3f3f3", color: "#666", border: "none", cursor: "pointer",
                          }}
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(req.id); setEditNote(req.adminNote || ""); }}
                        style={{
                          marginTop: 8, fontSize: 11, color: "#0e4e45", background: "none",
                          border: "none", cursor: "pointer", padding: 0, fontWeight: 500,
                        }}
                      >
                        {req.adminNote ? "Edit note" : "+ Add note"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {requests.length === 0 && !requestsQuery.isLoading && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗳️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>No feature requests yet</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
              Paying customers can submit requests via the sidebar button.
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
