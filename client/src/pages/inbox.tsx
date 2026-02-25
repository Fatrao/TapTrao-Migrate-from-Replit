import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { getAvatarColour } from "@/lib/avatarColours";
import { usePageTitle } from "@/hooks/use-page-title";

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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getStatusTag(status: string) {
  switch (status) {
    case "blocking":
      return { symbol: "\u2297", label: "Blocking", color: "var(--red)", bg: "var(--rbg)", bd: "var(--rbd)" };
    case "waiting":
      return { symbol: "\u25CF", label: "Waiting", color: "var(--amber)", bg: "var(--abg)", bd: "var(--abd)" };
    case "partial":
      return { symbol: "\u21BB", label: "Partial", color: "var(--blue)", bg: "var(--blue-dim)", bd: "var(--blue-bd)" };
    case "complete":
      return { symbol: "\u2713", label: "Complete", color: "var(--green)", bg: "var(--gbg)", bd: "var(--gbd)" };
    default:
      return { symbol: "\u25CF", label: status, color: "var(--t3)", bg: "var(--s3)", bd: "var(--s5)" };
  }
}

export default function Inbox() {
  usePageTitle("Supplier Inbox", "Track supplier documents and uploads");

  const summaryQuery = useQuery<InboxSummary>({ queryKey: ["/api/supplier-inbox/summary"] });
  const requestsQuery = useQuery<SupplierRequestRow[]>({ queryKey: ["/api/supplier-inbox"] });

  const summary = summaryQuery.data ?? { awaiting: 0, blocking: 0, completeThisWeek: 0 };
  const requests = requestsQuery.data ?? [];

  const grouped = useMemo(() => {
    const attention: SupplierRequestRow[] = [];
    const inProgress: SupplierRequestRow[] = [];
    const complete: SupplierRequestRow[] = [];
    for (const r of requests) {
      if (r.status === "blocking" || r.status === "waiting") attention.push(r);
      else if (r.status === "partial") inProgress.push(r);
      else complete.push(r);
    }
    return { attention, inProgress, complete };
  }, [requests]);

  const cards = [
    { value: summary.awaiting, color: "var(--amber)", label: "Awaiting documents" },
    { value: summary.blocking, color: "var(--red)", label: "Blocking issue" },
    { value: summary.completeThisWeek, color: "var(--green)", label: "Complete this week" },
  ];

  return (
    <AppShell>
      <div style={{ overflowY: "auto", padding: "32px 40px 60px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, letterSpacing: "0", color: "var(--t1)", margin: 0, lineHeight: 1.1 }}
            data-testid="text-inbox-title"
          >
            Supplier Inbox
          </h1>
          <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 6 }} data-testid="text-inbox-subtitle">
            {summary.awaiting + summary.blocking} suppliers waiting &middot; {summary.blocking} blocking issues
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2, marginBottom: 32 }} data-testid="inbox-summary-cards">
          {cards.map((c, i) => (
            <div
              key={c.label}
              style={{
                background: c.label === "Blocking issue"
                  ? `linear-gradient(135deg, rgba(218,60,61,.05), transparent 60%), var(--card)`
                  : "var(--card)",
                padding: "20px 22px",
                borderRadius:
                  i === 0 ? "14px 0 0 14px" :
                  i === cards.length - 1 ? "0 14px 14px 0" : "0",
              }}
              data-testid={`inbox-summary-card-${i}`}
            >
              <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 36, letterSpacing: 0, lineHeight: 1, color: c.color }}>
                {c.value}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", letterSpacing: ".04em", marginTop: 4 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>

        {/* INBOX CARDS */}
        {requestsQuery.isLoading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>Loading inbox...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }} data-testid="inbox-empty-state">
            <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 20, color: "var(--t2)" }}>
              No supplier requests yet.
            </div>
            <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 8 }}>
              Send your first supplier brief from the LC Checker or Compliance Lookup.
            </div>
          </div>
        ) : (
          <>
            {grouped.attention.length > 0 && (
              <InboxGroup label="Needs attention" items={grouped.attention} />
            )}
            {grouped.inProgress.length > 0 && (
              <InboxGroup label="In progress" items={grouped.inProgress} />
            )}
            {grouped.complete.length > 0 && (
              <InboxGroup label="Complete" items={grouped.complete} opacity={0.7} />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function InboxGroup({ label, items, opacity }: { label: string; items: SupplierRequestRow[]; opacity?: number }) {
  return (
    <div style={{ marginBottom: 28, opacity: opacity ?? 1 }} data-testid={`inbox-group-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((req) => (
          <InboxCard key={req.id} request={req} />
        ))}
      </div>
    </div>
  );
}

function InboxCard({ request }: { request: SupplierRequestRow }) {
  const avatar = getAvatarColour(request.origin_iso2);
  const statusTag = getStatusTag(request.status);
  const docsRequired = Array.isArray(request.docs_required) ? request.docs_required as string[] : [];
  const docsReceived = Array.isArray(request.docs_received) ? request.docs_received as string[] : [];
  const receivedSet = new Set(docsReceived);
  const outstanding = docsRequired.filter(d => !receivedSet.has(d));
  const blockingCount = request.status === "blocking" ? outstanding.length : 0;
  const pendingCount = outstanding.length - blockingCount;

  return (
    <div
      style={{
        background: "var(--card)",
        borderLeft: request.status === "blocking" ? "3px solid var(--red)" : undefined,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "background .15s",
        display: "flex",
        flexDirection: "row",
        gap: 14,
        alignItems: "center",
      }}
      data-testid={`inbox-card-${request.id}`}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--card2)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--card)"; }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 9,
          background: avatar.bg,
          border: `1px solid ${avatar.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          fontWeight: 800,
          color: avatar.text,
          flexShrink: 0,
        }}
      >
        {request.origin_iso2}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{request.supplier_name}</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)" }}>
            {request.origin_iso2} → {request.dest_iso2} · {request.commodity_name}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--t2)", marginTop: 3 }}>
          {outstanding.length > 0
            ? `Outstanding: ${outstanding.join(", ")}`
            : "All documents received"}
        </div>
        {/* Document progress pips */}
        <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
          {docsRequired.map((doc, i) => {
            const received = receivedSet.has(doc);
            const isBlocking = request.status === "blocking" && !received;
            return (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 4,
                  borderRadius: 2,
                  background: received ? "var(--green)" : isBlocking ? "var(--red)" : "var(--s5)",
                }}
              />
            );
          })}
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", marginTop: 6 }}>
          {docsReceived.length}/{docsRequired.length} docs
          {blockingCount > 0 && ` · ${blockingCount} blocking`}
          {pendingCount > 0 && ` · ${pendingCount} pending`}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            background: statusTag.bg,
            border: `1px solid ${statusTag.bd}`,
            color: statusTag.color,
            whiteSpace: "nowrap",
          }}
        >
          {statusTag.symbol} {statusTag.label}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)" }}>
          {relativeTime(request.updated_at)}
        </span>
        {/* Send buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={{
              background: "rgba(37,211,102,.12)",
              border: "1px solid rgba(37,211,102,.3)",
              color: "#25D366",
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
              borderRadius: 6,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            data-testid={`inbox-whatsapp-${request.id}`}
          >
            WhatsApp
          </button>
          <button
            style={{
              background: "var(--blue-dim)",
              border: "1px solid var(--blue-bd)",
              color: "var(--blue)",
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
              borderRadius: 6,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            data-testid={`inbox-email-${request.id}`}
          >
            Email
          </button>
          <button
            style={{
              background: "var(--s3)",
              border: "1px solid var(--s5)",
              color: "var(--t2)",
              fontSize: 11,
              fontWeight: 600,
              padding: "5px 10px",
              borderRadius: 6,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
            data-testid={`inbox-link-${request.id}`}
          >
            Link
          </button>
        </div>
      </div>
    </div>
  );
}
