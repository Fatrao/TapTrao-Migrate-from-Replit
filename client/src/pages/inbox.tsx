import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { getAvatarColour } from "@/lib/avatarColours";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { TFunction } from "i18next";

type InboxSummary = {
  awaiting: number;
  blocking: number;
  completeThisWeek: number;
};

type SupplierRequestRow = {
  id: string;
  lookup_id: string;
  supplier_name: string;
  supplier_email: string | null;
  supplier_whatsapp: string | null;
  upload_token: string;
  status: string;
  docs_required: string[];
  docs_received: string[];
  sent_via: string[] | null;
  created_at: string;
  updated_at: string;
  commodity_name: string;
  origin_iso2: string;
  dest_iso2: string;
  origin_name: string;
  dest_name: string;
};

function relativeTime(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time.justNow");
  if (mins < 60) return t("time.minsAgo", { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("time.hoursAgo", { hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("time.daysAgo", { days });
  return t("time.monthsAgo", { months: Math.floor(days / 30) });
}

function sentTime(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time.sentJustNow");
  if (mins < 60) return t("time.sentMinsAgo", { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("time.sentHoursAgo", { hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t("time.sentDaysAgo", { days });
  return t("time.sentMonthsAgo", { months: Math.floor(days / 30) });
}

function overdueTime(dateStr: string, t: TFunction): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return t("time.overdue");
  return t("time.daysOverdue", { days });
}

type StatusInfo = {
  label: string;
  color: string;
  bg: string;
};

function getStatusInfo(status: string, t: TFunction): StatusInfo {
  switch (status) {
    case "blocking":
      return { label: t("status.blocking"), color: "var(--red)", bg: "var(--red-xs)" };
    case "waiting":
      return { label: t("status.awaiting"), color: "var(--amber)", bg: "var(--amber-xs)" };
    case "partial":
      return { label: t("status.awaiting"), color: "var(--amber)", bg: "var(--amber-xs)" };
    case "complete":
      return { label: t("status.complete"), color: "var(--sage)", bg: "var(--sage-xs)" };
    default:
      return { label: status, color: "var(--t3)", bg: "rgba(0,0,0,0.04)" };
  }
}

export default function Inbox() {
  const { t } = useTranslation("inbox");
  const [, navigate] = useLocation();
  usePageTitle("Supplier Inbox", "Track supplier documents and uploads");

  const summaryQuery = useQuery<InboxSummary>({ queryKey: ["/api/supplier-inbox/summary"] });
  const requestsQuery = useQuery<SupplierRequestRow[]>({ queryKey: ["/api/supplier-inbox"] });

  const summary = summaryQuery.data ?? { awaiting: 0, blocking: 0, completeThisWeek: 0 };
  const requests = requestsQuery.data ?? [];

  const grouped = useMemo(() => {
    const awaiting: SupplierRequestRow[] = [];
    const blocking: SupplierRequestRow[] = [];
    const complete: SupplierRequestRow[] = [];
    for (const r of requests) {
      if (r.status === "blocking") blocking.push(r);
      else if (r.status === "complete") complete.push(r);
      else awaiting.push(r);
    }
    return { awaiting, blocking, complete };
  }, [requests]);

  const stats = [
    { value: summary.awaiting, color: "var(--amber)", label: t("stat.awaitingDocuments") },
    { value: summary.blocking, color: "var(--red)", label: t("stat.blockingIssue") },
    { value: summary.completeThisWeek, color: "var(--sage)", label: t("stat.completeThisWeek") },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "28px 28px 20px" }}>
        <div>
          <h1
            style={{ fontFamily: "var(--fd)", fontWeight: 600, fontSize: 26, color: "var(--t1)", margin: 0, lineHeight: 1.1 }}
            data-testid="text-inbox-title"
          >
            {t("title")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--t3)", marginTop: 4 }} data-testid="text-inbox-subtitle">
            {t("subtitle", {
              waiting: summary.awaiting + summary.blocking,
              blocking: summary.blocking,
              plural: summary.blocking !== 1 ? "s" : "",
            })}
          </p>
        </div>
        <button
          onClick={() => navigate("/lookup")}
          style={{
            padding: "9px 20px",
            borderRadius: 20,
            border: "none",
            fontFamily: "var(--fb)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            background: "var(--sage)",
            color: "#fff",
          }}
        >
          {t("newUploadLink")}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 28px 20px" }} data-testid="inbox-summary-cards">
        {stats.map((s, i) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)",
              borderRadius: "var(--r)",
              boxShadow: "var(--shd)",
              padding: "18px 22px",
            }}
            data-testid={`inbox-summary-card-${i}`}
          >
            <div style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 28px 60px" }}>
        {requestsQuery.isLoading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>{t("loading")}</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }} data-testid="inbox-empty-state">
            <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 20, color: "var(--t1)" }}>
              {t("empty.title")}
            </div>
            <div style={{ fontSize: 15, color: "var(--t3)", marginTop: 8 }}>
              {t("empty.subtitle")}
            </div>
          </div>
        ) : (
          <>
            {grouped.awaiting.length > 0 && (
              <InboxSection label={t("section.awaitingDocuments")} items={grouped.awaiting} t={t} />
            )}
            {grouped.blocking.length > 0 && (
              <InboxSection label={t("section.blockingIssue")} items={grouped.blocking} t={t} />
            )}
            {grouped.complete.length > 0 && (
              <InboxSection label={t("section.complete")} items={grouped.complete} dimmed t={t} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function InboxSection({ label, items, dimmed, t }: { label: string; items: SupplierRequestRow[]; dimmed?: boolean; t: TFunction }) {
  return (
    <div style={{ marginBottom: 24 }} data-testid={`inbox-group-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div style={{
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: "1.2px",
        color: "var(--t3)",
        textTransform: "uppercase",
        padding: "8px 0",
      }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((req) => (
          <SupplierCard key={req.id} request={req} dimmed={dimmed} t={t} />
        ))}
      </div>
    </div>
  );
}

function SupplierCard({ request, dimmed, t }: { request: SupplierRequestRow; dimmed?: boolean; t: TFunction }) {
  const { toast } = useToast();
  const statusInfo = getStatusInfo(request.status, t);
  const uploadUrl = `${window.location.origin}/upload/${request.upload_token}`;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      t("share.whatsappMessage", {
        supplier: request.supplier_name,
        commodity: request.commodity_name,
        url: uploadUrl,
      })
    );
    const phone = request.supplier_whatsapp?.replace(/[^0-9]/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(
      t("share.emailSubject", { commodity: request.commodity_name })
    );
    const body = encodeURIComponent(
      t("share.emailBody", {
        supplier: request.supplier_name,
        commodity: request.commodity_name,
        url: uploadUrl,
      })
    );
    const email = request.supplier_email || "";
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      toast({ title: t("share.linkCopied") });
    } catch {
      toast({ title: t("share.linkCopyFailed"), variant: "destructive" });
    }
  };
  const docsRequired = Array.isArray(request.docs_required) ? request.docs_required : [];
  const docsReceived = Array.isArray(request.docs_received) ? request.docs_received : [];
  const receivedSet = new Set(docsReceived);
  const outstanding = docsRequired.filter((d) => !receivedSet.has(d));
  const isBlocking = request.status === "blocking";

  // Avatar color based on status
  const avatarStyle = isBlocking
    ? { background: "var(--red-xs)", color: "var(--red)" }
    : request.status === "complete"
    ? { background: "var(--sage-xs)", color: "var(--sage)" }
    : { background: "var(--amber-xs)", color: "var(--amber)" };

  // Status description
  const statusText = request.status === "complete"
    ? t("card.allDocsReceived")
    : isBlocking && outstanding.length > 0
    ? outstanding.join(" and ")
    : t("card.waitingFor", { docs: outstanding.join(" and ") });

  // Time label
  const timeLabel = isBlocking
    ? overdueTime(request.updated_at, t)
    : request.status === "complete"
    ? relativeTime(request.updated_at, t)
    : sentTime(request.created_at, t);

  return (
    <div
      style={{
        background: "var(--card)",
        borderRadius: "var(--r)",
        boxShadow: isBlocking
          ? "var(--shd), inset 3px 0 0 var(--red)"
          : "var(--shd)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: dimmed ? 0.7 : 1,
      }}
      data-testid={`inbox-card-${request.id}`}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
          ...avatarStyle,
        }}
      >
        {request.origin_iso2}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{request.supplier_name}</span>
          <span style={{ fontSize: 15, fontWeight: 400, color: "var(--t3)" }}>
            {request.origin_iso2} → {request.dest_iso2} · {request.commodity_name}
          </span>
        </div>
        <div style={{
          fontSize: 15,
          color: isBlocking ? "var(--red)" : "var(--t3)",
          fontWeight: isBlocking ? 600 : 400,
          marginTop: 2,
        }}>
          {statusText}
        </div>
        {/* Document pips */}
        <div style={{ display: "flex", gap: 3, marginTop: 4, alignItems: "center" }}>
          {docsRequired.map((doc, i) => {
            const received = receivedSet.has(doc);
            const isMissing = !received && isBlocking;
            return (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 5,
                  borderRadius: 2,
                  background: received
                    ? "var(--sage)"
                    : isMissing
                    ? "var(--red)"
                    : "var(--amber)",
                }}
              />
            );
          })}
          <span style={{ fontSize: 15, color: "var(--t3)", marginLeft: 4 }}>
            {t("card.docs", { received: docsReceived.length, total: docsRequired.length })}
          </span>
        </div>
      </div>

      {/* Right side: badge, time, actions */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: statusInfo.bg,
            color: statusInfo.color,
          }}
        >
          <span style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "currentColor",
            display: "inline-block",
          }} />
          {statusInfo.label}
        </div>
        <div style={{ fontSize: 15, color: "var(--t4)" }}>
          {timeLabel}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button
            onClick={handleWhatsApp}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid rgba(37,211,102,0.2)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              color: "#25D366",
              fontFamily: "var(--fb)",
            }}
            data-testid={`inbox-whatsapp-${request.id}`}
          >
            {t("btn.whatsapp")}
          </button>
          <button
            onClick={handleEmail}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid rgba(74,124,94,0.2)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              color: "var(--sage)",
              fontFamily: "var(--fb)",
            }}
            data-testid={`inbox-email-${request.id}`}
          >
            {t("btn.email")}
          </button>
          <button
            onClick={handleCopyLink}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              background: "transparent",
              color: "var(--t2)",
              fontFamily: "var(--fb)",
            }}
            data-testid={`inbox-link-${request.id}`}
          >
            {t("btn.link")}
          </button>
        </div>
      </div>
    </div>
  );
}
