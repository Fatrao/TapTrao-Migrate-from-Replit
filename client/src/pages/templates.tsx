import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Template } from "@shared/schema";

type StaleInfo = { stale: boolean };

function relativeTime(date: string | Date) {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function originAvatar(iso2: string) {
  const colors: Record<string, string> = {
    CI: "#ea8b43", GH: "#4a8c6f", CD: "#da3c3d", KE: "#4a8c6f",
    NG: "#4a8c6f", TZ: "#ea8b43", ET: "#4a8c6f", ZA: "#da3c3d",
    SN: "#4a8c6f", CM: "#ea8b43", UG: "#4a8c6f", MZ: "#4a8c6f",
  };
  const color = colors[iso2] || "var(--blue)";
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color,
      }}
    >
      {iso2}
    </div>
  );
}

function TemplateCard({
  template,
  staleInfo,
  onDelete,
  onUse,
}: {
  template: Template;
  staleInfo: StaleInfo | undefined;
  onDelete: (id: string) => void;
  onUse: (template: Template) => void;
}) {
  const isStale = staleInfo?.stale ?? false;
  const snapshot = template.snapshotJson as any;
  const commodityName = snapshot?.commodity?.name || "Trade";
  const hsCode = snapshot?.commodity?.hsCode || "";

  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: 14,
        padding: "16px 18px",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}
      data-testid={`card-template-${template.id}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {originAvatar(template.originIso2)}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} data-testid={`text-template-name-${template.id}`}>
              {template.name}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", whiteSpace: "nowrap" }}>
              {template.originIso2} → {template.destIso2}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 4 }}>
            {commodityName} {hsCode ? `· HS ${hsCode}` : ""}
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", marginTop: 8 }}>
        Used {template.timesUsed} time{template.timesUsed !== 1 ? "s" : ""}
        {template.lastUsedAt ? ` · Last used ${relativeTime(template.lastUsedAt)}` : ""}
      </div>

      {isStale && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            background: "var(--abg)",
            borderRadius: "0 0 6px 6px",
          }}
          data-testid={`stale-warning-${template.id}`}
        >
          <span style={{ fontSize: 11, color: "var(--amber)", fontWeight: 600 }}>
            Regulations may have changed since this template was last used
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12 }}>
        <button
          onClick={() => onUse(template)}
          style={{
            flex: 1,
            background: "var(--blue)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
            padding: "7px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
          data-testid={`button-use-template-${template.id}`}
        >
          Use template →
        </button>
        <button
          onClick={() => onDelete(template.id)}
          style={{
            padding: "7px 14px",
            background: "transparent",
            color: "var(--red)",
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 6,
            border: "1px solid rgba(218,60,61,.3)",
            cursor: "pointer",
          }}
          data-testid={`button-delete-template-${template.id}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function Templates() {
  usePageTitle("Templates", "Your saved trade corridors for quick reuse");
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templatesList, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const staleQueries = useQuery<Record<string, StaleInfo>>({
    queryKey: ["/api/templates", "stale-checks"],
    queryFn: async () => {
      if (!templatesList || templatesList.length === 0) return {};
      const results: Record<string, StaleInfo> = {};
      await Promise.all(
        templatesList.map(async (t) => {
          try {
            const res = await fetch(`/api/templates/${t.id}/stale-check`, { credentials: "include" });
            if (res.ok) {
              results[t.id] = await res.json();
            }
          } catch {
            results[t.id] = { stale: false };
          }
        })
      );
      return results;
    },
    enabled: !!templatesList && templatesList.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates/count"] });
      setDeleteId(null);
    },
  });

  const handleUse = async (template: Template) => {
    try {
      await apiRequest("POST", `/api/templates/${template.id}/use`);
    } catch {}
    navigate(`/lookup?templateId=${template.id}`);
  };

  const count = templatesList?.length ?? 0;

  return (
    <AppShell>
      <div style={{ flex: 1, padding: "40px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--fh)",
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "0",
              color: "var(--t1)",
              margin: 0,
              lineHeight: 1.1,
            }}
            data-testid="text-templates-title"
          >
            Templates
          </h1>
          <p style={{ fontFamily: "var(--fb)", fontSize: 13, color: "var(--t2)", marginTop: 6 }}>
            {count} saved template{count !== 1 ? "s" : ""}
          </p>

          {isLoading && (
            <div style={{ marginTop: 24 }}>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--card)",
                    borderRadius: 14, height: 140, marginBottom: 12,
                    animation: "pulse 2s infinite",
                  }}
                />
              ))}
            </div>
          )}

          {!isLoading && count === 0 && (
            <div
              style={{
                marginTop: 40,
                textAlign: "center",
                padding: "48px 24px",
                background: "var(--card)",
                borderRadius: 14,
              }}
              data-testid="empty-state"
            >
              <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>
                No templates saved yet. Complete a lookup and save it as a template from the TwinLog Trail.
              </p>
            </div>
          )}

          {count > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
              {templatesList!.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  staleInfo={staleQueries.data?.[t.id]}
                  onDelete={(id) => setDeleteId(id)}
                  onUse={handleUse}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: "var(--card2)", borderRadius: 14,
              padding: 24, maxWidth: 400, width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 18, color: "var(--t1)", marginBottom: 8 }}>
              Delete Template
            </h3>
            <p style={{ fontSize: 13, color: "var(--t2)", marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to delete this template? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "8px 16px", background: "transparent", border: "none",
                  borderRadius: 6, color: "var(--t2)", fontSize: 13, cursor: "pointer",
                }}
                data-testid="button-cancel-delete"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: "8px 16px", background: "var(--red)", border: "none",
                  borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
