import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAvatarColour } from "@/lib/avatarColours";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
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

type LookupRow = {
  id: string;
  commodityName: string;
  originName: string;
  destinationName: string;
  hsCode: string;
  resultJson: any;
  createdAt: string;
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

// Country code → emoji flag
function flag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "";
  const upper = iso2.toUpperCase();
  return String.fromCodePoint(0x1F1E6 + upper.charCodeAt(0) - 65, 0x1F1E6 + upper.charCodeAt(1) - 65);
}

export default function Inbox() {
  const { t } = useTranslation("inbox");
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  usePageTitle("Supplier Inbox", "Track supplier documents and uploads");
  const [dialogOpen, setDialogOpen] = useState(false);

  const summaryQuery = useQuery<InboxSummary>({ queryKey: ["/api/supplier-inbox/summary"], refetchOnMount: "always" });
  const requestsQuery = useQuery<SupplierRequestRow[]>({ queryKey: ["/api/supplier-inbox"], refetchOnMount: "always" });

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
          onClick={() => setDialogOpen(true)}
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
          data-testid="button-new-request"
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
          <div style={{
            padding: "60px 40px", textAlign: "center",
            background: "var(--card)", borderRadius: "var(--r)",
            boxShadow: "var(--shd)", borderLeft: "4px solid var(--sage)",
          }} data-testid="inbox-empty-state">
            <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
            <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 20, color: "var(--t1)" }}>
              {t("empty.title")}
            </div>
            <div style={{ fontSize: 14, color: "var(--t3)", marginTop: 8, maxWidth: 360, margin: "8px auto 0" }}>
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

      {/* New Request Dialog */}
      {dialogOpen && (
        <NewRequestDialog
          onClose={() => setDialogOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/supplier-inbox"] });
            queryClient.invalidateQueries({ queryKey: ["/api/supplier-inbox/summary"] });
          }}
        />
      )}
    </AppShell>
  );
}

/* ── New Request Dialog ── */

type DialogStep = "trade" | "docs" | "share";

type CreatedRequest = {
  uploadUrl: string;
  uploadToken: string;
  requestId: string;
  docsRequired: string[];
  commodityName: string;
  destinationName: string;
  supplierWhatsapp: string | null;
};

function NewRequestDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useTranslation("inbox");
  const { toast } = useToast();
  const [step, setStep] = useState<DialogStep>("trade");
  const [selectedLookup, setSelectedLookup] = useState<LookupRow | null>(null);
  const [supplierDocs, setSupplierDocs] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedRequest | null>(null);

  // Fetch user's trades/lookups
  const lookupsQuery = useQuery<LookupRow[]>({ queryKey: ["/api/lookups"] });
  const lookups = lookupsQuery.data ?? [];

  const handleSelectTrade = (lookup: LookupRow) => {
    setSelectedLookup(lookup);
    // Extract supplier-side documents from the compliance result
    const result = lookup.resultJson;
    const requirements = result?.requirementsDetailed ?? result?.origin?.requirementsDetailed ?? [];
    const docs: string[] = requirements
      .filter((r: any) => r.isSupplierSide)
      .map((r: any) => r.title);
    // If no supplier-side docs found, use common defaults
    const finalDocs = docs.length > 0 ? docs : ["Commercial Invoice", "Certificate of Origin", "Packing List"];
    setSupplierDocs(finalDocs);
    setSelectedDocs(new Set(finalDocs));
    setStep("docs");
  };

  const toggleDoc = (doc: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(doc)) next.delete(doc);
      else next.add(doc);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedLookup || selectedDocs.size === 0) return;
    setCreating(true);
    try {
      const res = await apiRequest("POST", "/api/supplier-requests/create-or-get", {
        lookupId: selectedLookup.id,
        selectedDocs: Array.from(selectedDocs),
      });
      const data = await res.json();
      setCreated({
        uploadUrl: data.uploadUrl,
        uploadToken: data.uploadToken,
        requestId: data.requestId,
        docsRequired: Array.from(selectedDocs),
        commodityName: selectedLookup.commodityName,
        destinationName: selectedLookup.destinationName,
        supplierWhatsapp: data.supplierRequest?.supplierWhatsapp || null,
      });
      setStep("share");
      onCreated();
    } catch (err: any) {
      toast({ title: err.message || "Failed to create request", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleWhatsApp = () => {
    if (!created) return;
    const docList = created.docsRequired.join(", ");
    const msg = encodeURIComponent(
      `Please upload your ${docList} for the ${created.commodityName} shipment to ${created.destinationName} using this link: ${created.uploadUrl}`
    );
    const phone = created.supplierWhatsapp?.replace(/[^0-9]/g, "") || "";
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const handleEmail = () => {
    if (!created) return;
    const docList = created.docsRequired.join(", ");
    const subject = encodeURIComponent(`Document Upload Request – ${created.commodityName}`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease upload your ${docList} for the ${created.commodityName} shipment to ${created.destinationName} using the secure link below:\n\n${created.uploadUrl}\n\nThank you.`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
  };

  const handleCopyLink = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.uploadUrl);
      toast({ title: t("share.linkCopied") });
    } catch {
      toast({ title: t("share.linkCopyFailed"), variant: "destructive" });
    }
  };

  // Extract origin ISO2 from resultJson for flag display
  const getOriginIso2 = (lookup: LookupRow): string => {
    return lookup.resultJson?.origin?.iso2 || "";
  };
  const getDestIso2 = (lookup: LookupRow): string => {
    return lookup.resultJson?.destination?.iso2 || "";
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#1b2a22",
        borderRadius: 18, width: "100%", maxWidth: 500,
        maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
        position: "relative",
        padding: "28px 24px 24px",
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 18,
            width: 28, height: 28, borderRadius: 6, border: "none",
            background: "#2e3e34", cursor: "pointer", fontSize: 14, color: "#a8b8b0",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Dialog Header */}
        <div style={{ marginBottom: step === "docs" ? 20 : 16 }}>
          <div style={{ fontFamily: "var(--fd)", fontWeight: 600, fontSize: 20, color: "#e8e2da" }}>
            {step === "trade" ? t("dialog.selectTrade") : step === "docs" ? t("dialog.selectDocs") : t("dialog.shareLink")}
          </div>
          {step === "docs" && selectedLookup && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#a8b8b0", marginTop: 6 }}>
              <span style={{ fontSize: 15 }}>{flag(getOriginIso2(selectedLookup))}</span>
              <span>{selectedLookup.originName}</span>
              <span style={{ color: "#6b8c7a" }}>→</span>
              <span style={{ fontSize: 15 }}>{flag(getDestIso2(selectedLookup))}</span>
              <span>{selectedLookup.destinationName}</span>
              <span>·</span>
              <span style={{ color: "#c9a96e", fontWeight: 500 }}>{selectedLookup.commodityName}</span>
            </div>
          )}
        </div>

        {/* Dialog Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {step === "trade" && (
            <TradePickerStep
              lookups={lookups}
              loading={lookupsQuery.isLoading}
              onSelect={handleSelectTrade}
              getOriginIso2={getOriginIso2}
              getDestIso2={getDestIso2}
              t={t}
            />
          )}

          {step === "docs" && (
            <DocPickerStep
              docs={supplierDocs}
              selectedDocs={selectedDocs}
              onToggle={toggleDoc}
              onBack={() => setStep("trade")}
              onConfirm={handleCreate}
              creating={creating}
              t={t}
            />
          )}

          {step === "share" && created && (
            <ShareStep
              created={created}
              onWhatsApp={handleWhatsApp}
              onEmail={handleEmail}
              onCopyLink={handleCopyLink}
              onDone={onClose}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function TradePickerStep({
  lookups, loading, onSelect, getOriginIso2, getDestIso2, t,
}: {
  lookups: LookupRow[];
  loading: boolean;
  onSelect: (l: LookupRow) => void;
  getOriginIso2: (l: LookupRow) => string;
  getDestIso2: (l: LookupRow) => string;
  t: TFunction;
}) {
  if (loading) {
    return <div style={{ padding: "40px 0", textAlign: "center", color: "#a8b8b0", fontSize: 15 }}>{t("dialog.loadingTrades")}</div>;
  }
  if (lookups.length === 0) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <div style={{ fontSize: 15, color: "#a8b8b0" }}>{t("dialog.noTrades")}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {lookups.map((lookup) => {
        const oIso = getOriginIso2(lookup);
        const dIso = getDestIso2(lookup);
        return (
          <button
            key={lookup.id}
            onClick={() => onSelect(lookup)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 10, border: "none",
              background: "#fff", cursor: "pointer", textAlign: "left", width: "100%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            data-testid={`dialog-trade-${lookup.id}`}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "var(--sage-xs)", color: "var(--sage)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {oIso || "??"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--t1)" }}>
                {lookup.commodityName}
              </div>
              <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 1 }}>
                {flag(oIso)} {lookup.originName} → {flag(dIso)} {lookup.destinationName}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--t4)", flexShrink: 0 }}>
              {lookup.hsCode}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DocPickerStep({
  docs, selectedDocs, onToggle, onBack, onConfirm, creating, t,
}: {
  docs: string[];
  selectedDocs: Set<string>;
  onToggle: (doc: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  creating: boolean;
  t: TFunction;
}) {
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {docs.map((doc) => {
          const checked = selectedDocs.has(doc);
          return (
            <div
              key={doc}
              onClick={() => onToggle(doc)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "14px 16px", borderRadius: 10,
                background: checked ? "#2d4a37" : "#243329",
                border: `1.5px solid ${checked ? "#4a6355" : "transparent"}`,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {/* Custom checkbox */}
              <div style={{
                width: 20, height: 20, minWidth: 20,
                borderRadius: 5,
                border: `1.5px solid ${checked ? "#4a6355" : "#4a6355"}`,
                background: checked ? "#4a6355" : "transparent",
                marginTop: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, border-color 0.15s",
              }}>
                {checked && (
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{
                fontSize: 12.5, fontWeight: 500,
                color: "#e8e2da",
                lineHeight: 1.5,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}>
                {doc}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={onBack}
          style={{
            padding: "11px 24px", borderRadius: 9, border: "none",
            background: "#2e3e34", fontSize: 14, fontWeight: 600,
            cursor: "pointer", color: "#a8b8b0",
            fontFamily: "var(--fb)",
            transition: "opacity 0.15s",
          }}
        >
          {t("dialog.back")}
        </button>
        <button
          onClick={onConfirm}
          disabled={selectedDocs.size === 0 || creating}
          style={{
            padding: "11px 24px", borderRadius: 9, border: "none",
            background: "#c9a96e",
            color: "#1b2a22",
            fontSize: 14, fontWeight: 600,
            cursor: selectedDocs.size === 0 ? "not-allowed" : "pointer",
            opacity: (selectedDocs.size === 0 || creating) ? 0.4 : 1,
            fontFamily: "var(--fb)",
            transition: "opacity 0.15s, background 0.15s",
          }}
        >
          {creating ? t("dialog.creating") : t("dialog.createLink")}
        </button>
      </div>
    </div>
  );
}

function ShareStep({
  created, onWhatsApp, onEmail, onCopyLink, onDone, t,
}: {
  created: CreatedRequest;
  onWhatsApp: () => void;
  onEmail: () => void;
  onCopyLink: () => void;
  onDone: () => void;
  t: TFunction;
}) {
  return (
    <div>
      {/* Upload URL display */}
      <div style={{
        padding: "12px 16px", borderRadius: 10, background: "#243329",
        border: "1.5px solid #4a6355", marginBottom: 16,
        fontSize: 13, color: "#e8e2da", wordBreak: "break-all",
      }}>
        {created.uploadUrl}
      </div>

      {/* Documents requested */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#a8b8b0", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
          {t("dialog.docsRequested")} ({created.docsRequired.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {created.docsRequired.map((doc, i) => {
            const core = doc.replace(/\s+(issued by|with HS Code|customs code:).*/i, "").trim();
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "#e8e2da",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#6b8c7a", flexShrink: 0,
                }} />
                {core}
              </div>
            );
          })}
        </div>
      </div>

      {/* Share buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={onWhatsApp}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 9,
            border: "none", background: "#2e3e34",
            color: "#25D366", fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--fb)", transition: "opacity 0.15s",
          }}
          data-testid="dialog-share-whatsapp"
        >
          💬 {t("btn.whatsapp")}
        </button>
        <button
          onClick={onEmail}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 9,
            border: "none", background: "#2e3e34",
            color: "#e8e2da", fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--fb)", transition: "opacity 0.15s",
          }}
          data-testid="dialog-share-email"
        >
          📧 {t("btn.email")}
        </button>
        <button
          onClick={onCopyLink}
          style={{
            flex: 1, padding: "11px 16px", borderRadius: 9,
            border: "none", background: "#2e3e34",
            color: "#e8e2da", fontSize: 14, fontWeight: 600, cursor: "pointer",
            fontFamily: "var(--fb)", transition: "opacity 0.15s",
          }}
          data-testid="dialog-share-link"
        >
          🔗 {t("btn.link")}
        </button>
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        style={{
          width: "100%", padding: "11px 24px", borderRadius: 9, border: "none",
          background: "#c9a96e", color: "#1b2a22", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "var(--fb)",
          transition: "opacity 0.15s",
        }}
        data-testid="dialog-done"
      >
        {t("dialog.done")}
      </button>
    </div>
  );
}

/* ── Inbox Section & Card (unchanged) ── */

function InboxSection({ label, items, dimmed, t }: { label: string; items: SupplierRequestRow[]; dimmed?: boolean; t: TFunction }) {
  return (
    <div style={{ marginBottom: 28 }} data-testid={`inbox-group-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 0 10px",
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1.2px",
          color: "var(--t4)",
          textTransform: "uppercase",
        }}>
          {label}
        </span>
        <span style={{
          padding: "1px 8px",
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 700,
          background: "var(--sage-xs)",
          color: "var(--sage)",
        }}>
          {items.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
  const isComplete = request.status === "complete";
  const progressPct = docsRequired.length > 0 ? Math.round((docsReceived.length / docsRequired.length) * 100) : 0;

  // Card accent: sage for default/complete, red for blocking
  const accentColor = isBlocking ? "var(--red)" : "var(--sage)";
  const accentBg = isBlocking ? "var(--red-xs)" : "var(--sage-xs)";

  // Short doc name: first 2–3 meaningful words
  const shortDocName = (doc: string) => {
    // Strip "issued by..." / "with HS Code..." suffixes, keep the core doc type
    const core = doc.replace(/\s+(issued by|with HS Code|customs code:).*/i, "").trim();
    const words = core.split(/\s+/);
    return words.length > 3 ? words.slice(0, 3).join(" ") + "…" : core;
  };

  // Status description — concise, never the full doc names
  const statusText = isComplete
    ? t("card.allDocsReceived")
    : outstanding.length === 0
    ? t("card.allDocsReceived")
    : outstanding.length === 1
    ? t("card.waitingFor", { docs: shortDocName(outstanding[0]) })
    : t("card.waitingFor", { docs: `${outstanding.length} documents` });

  // Time label
  const timeLabel = isBlocking
    ? overdueTime(request.updated_at, t)
    : isComplete
    ? relativeTime(request.updated_at, t)
    : sentTime(request.created_at, t);

  // Use commodity as the card title (more meaningful than generic "Supplier")
  const cardTitle = request.commodity_name;
  const routeLabel = `${flag(request.origin_iso2)} ${request.origin_name || request.origin_iso2} → ${flag(request.dest_iso2)} ${request.dest_name || request.dest_iso2}`;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--r)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${accentColor}`,
        padding: "18px 20px",
        opacity: dimmed ? 0.65 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      data-testid={`inbox-card-${request.id}`}
    >
      {/* Top row: info + status badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Flag avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
            background: accentBg,
          }}
        >
          {flag(request.origin_iso2) || request.origin_iso2}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 700, color: "var(--t1)" }}>{cardTitle}</span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: statusInfo.bg,
                color: statusInfo.color,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                letterSpacing: ".02em",
              }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: "currentColor", display: "inline-block",
              }} />
              {statusInfo.label}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 2 }}>
            {routeLabel}
          </div>
          <div style={{
            fontSize: 13,
            color: isBlocking ? "var(--red)" : "var(--t3)",
            fontWeight: isBlocking ? 600 : 400,
            marginTop: 4,
          }}>
            {statusText}
          </div>
        </div>

        {/* Time */}
        <div style={{ fontSize: 12, color: "var(--t4)", flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
          {timeLabel}
        </div>
      </div>

      {/* Progress bar + doc count */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t3)" }}>
            {t("card.docs", { received: docsReceived.length, total: docsRequired.length })}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>
            {progressPct}%
          </span>
        </div>
        <div style={{
          width: "100%", height: 6, borderRadius: 3,
          background: "rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${progressPct}%`,
            height: "100%",
            borderRadius: 3,
            background: isComplete ? "var(--sage)" : isBlocking ? "var(--red)" : "var(--sage)",
            transition: "width 0.3s ease",
          }} />
        </div>
        {/* Individual doc pips */}
        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
          {docsRequired.map((doc, i) => {
            const received = receivedSet.has(doc);
            const isMissing = !received && isBlocking;
            const pipDot = received ? "var(--sage)" : isMissing ? "var(--red)" : "var(--t4)";
            const pipBg = received ? "var(--sage-pale)" : isMissing ? "var(--red-pale)" : "rgba(0,0,0,0.05)";
            const pipText = received ? "var(--sage)" : isMissing ? "var(--red)" : "var(--t2)";
            const pipBorder = received ? "var(--sage)" : isMissing ? "var(--red)" : "rgba(0,0,0,0.15)";
            // Short doc label: core doc type
            const shortLabel = shortDocName(doc);
            return (
              <span
                key={i}
                title={doc}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", borderRadius: 6,
                  fontSize: 12, fontWeight: 600,
                  background: pipBg,
                  color: pipText,
                  border: `1px solid ${pipBorder}`,
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: pipDot, flexShrink: 0,
                }} />
                {shortLabel}
              </span>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 12 }}>
        <button
          onClick={handleWhatsApp}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid #25D366",
            background: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            color: "#1a9e4a", fontFamily: "var(--fb)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          data-testid={`inbox-whatsapp-${request.id}`}
        >
          💬 {t("btn.whatsapp")}
        </button>
        <button
          onClick={handleEmail}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid var(--sage)",
            background: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            color: "var(--sage)", fontFamily: "var(--fb)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          data-testid={`inbox-email-${request.id}`}
        >
          📧 {t("btn.email")}
        </button>
        <button
          onClick={handleCopyLink}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.2)",
            background: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            color: "var(--t1)", fontFamily: "var(--fb)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
          data-testid={`inbox-link-${request.id}`}
        >
          🔗 {t("btn.link")}
        </button>
      </div>
    </div>
  );
}
