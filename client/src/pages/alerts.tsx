import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { apiRequest, queryClient } from "@/lib/queryClient";

type AlertItem = {
  id: string;
  source: string;
  hsCodesAffected: string[];
  destIso2Affected: string[];
  summary: string;
  sourceUrl: string | null;
  effectiveDate: string | null;
  isDeadline: boolean;
  createdAt: string;
  isRead: boolean;
};

const sourceBadgeStyles: Record<string, { bg: string; border: string; color: string }> = {
  EUDR_DEADLINE: { bg: "var(--abg)", border: "var(--abd)", color: "var(--amber)" },
  MANUAL: { bg: "var(--blue-dim)", border: "var(--blue-bd)", color: "var(--blue)" },
  TARIFF_API: { bg: "var(--gbg)", border: "var(--gbd)", color: "var(--green)" },
};

function AlertCard({ alert, onVisible }: { alert: AlertItem; onVisible: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alert.isRead || !ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible(alert.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [alert.id, alert.isRead, onVisible]);

  const badgeStyle = sourceBadgeStyles[alert.source] || sourceBadgeStyles.MANUAL;
  const effectiveDateStr = alert.effectiveDate
    ? new Date(alert.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const firstHs = alert.hsCodesAffected?.[0];
  const firstDest = alert.destIso2Affected?.[0];
  const lookupHref = firstHs && firstDest ? `/lookup?hs=${firstHs}&dest=${firstDest}` : "/lookup";

  return (
    <div
      ref={ref}
      style={{
        background: "var(--card)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 8,
        borderLeft: !alert.isRead ? "3px solid var(--blue)" : undefined,
      }}
      data-testid={`card-alert-${alert.id}`}
    >
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 9,
          fontWeight: 600,
          textTransform: "uppercase",
          padding: "2px 6px",
          borderRadius: 3,
          background: badgeStyle.bg,
          border: `1px solid ${badgeStyle.border}`,
          color: badgeStyle.color,
        }}
        data-testid={`badge-alert-source-${alert.id}`}
      >
        {alert.source.replace(/_/g, " ")}
      </span>

      <p
        style={{
          fontSize: 13,
          color: "var(--t1)",
          lineHeight: 1.55,
          margin: "6px 0",
        }}
        data-testid={`text-alert-summary-${alert.id}`}
      >
        {alert.summary}
      </p>

      {alert.hsCodesAffected && alert.hsCodesAffected.length > 0 && (
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", margin: "2px 0" }}>
          HS: {alert.hsCodesAffected.slice(0, 6).join(", ")}
          {alert.hsCodesAffected.length > 6 && ` +${alert.hsCodesAffected.length - 6} more`}
        </p>
      )}

      {effectiveDateStr && (
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", margin: "2px 0" }}>
          Effective {effectiveDateStr}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <div>
          {alert.sourceUrl && (
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "var(--blue)", textDecoration: "none" }}
              data-testid={`link-alert-source-${alert.id}`}
            >
              ↗ View source
            </a>
          )}
        </div>
        <Link href={lookupHref}>
          <button
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: 5,
              background: "var(--blue)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
            data-testid={`button-alert-lookup-${alert.id}`}
          >
            Run fresh lookup →
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const alertsQuery = useQuery<AlertItem[]>({ queryKey: ["/api/alerts"] });
  const subsQuery = useQuery<{ subscriptions: any[]; count: number }>({ queryKey: ["/api/alerts/subscriptions"] });
  const alerts = alertsQuery.data ?? [];
  const subCount = subsQuery.data?.count ?? 0;

  const handleVisible = useCallback(async (alertId: string) => {
    try {
      await apiRequest("POST", `/api/alerts/${alertId}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread-count"] });
    } catch {}
  }, []);

  return (
    <AppShell>
      <div style={{ flex: 1, padding: "40px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--fh)",
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "-0.5px",
              color: "var(--t1)",
              marginBottom: 4,
            }}
            data-testid="text-alerts-title"
          >
            Regulatory Alerts
          </h1>
          <p
            style={{
              fontFamily: "var(--fb)",
              fontSize: 13,
              color: "var(--t2)",
              marginBottom: 24,
            }}
            data-testid="text-alerts-subtitle"
          >
            Monitoring {subCount} corridor{subCount !== 1 ? "s" : ""}
          </p>

          {alertsQuery.isLoading ? (
            <div style={{ color: "var(--t3)", fontSize: 13 }}>Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div
              style={{
                background: "var(--card)",
                borderRadius: 14,
                padding: "32px 24px",
                textAlign: "center",
              }}
              data-testid="empty-state"
            >
              <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.6 }}>
                You're not watching any corridors yet.
                <br />
                Run a lookup and click "Watch this corridor".
              </p>
            </div>
          ) : (
            <div>
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onVisible={handleVisible} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
