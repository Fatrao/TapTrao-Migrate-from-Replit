import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageCircle, Mail, Copy, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { SupplierUpload } from "@shared/schema";
import { getDocEmoji, getDocIssuer, relativeTime } from "./helpers";
import type { LcPrefillData, SupplierDocsResponse } from "./constants";

export function SupplierDocsTab({ prefillData }: { prefillData: LcPrefillData | null }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const lookupId = prefillData?.lookup_id;

  const createOrGetMutation = useMutation({
    mutationFn: async (lid: string) => {
      const res = await apiRequest("POST", "/api/supplier-requests/create-or-get", { lookupId: lid });
      return res.json() as Promise<SupplierDocsResponse>;
    },
  });

  const logSendMutation = useMutation({
    mutationFn: async ({ requestId, channel }: { requestId: string; channel: string }) => {
      await apiRequest("POST", `/api/supplier-requests/${requestId}/log-send`, { channel });
    },
  });

  useEffect(() => {
    if (lookupId && !createOrGetMutation.data && !createOrGetMutation.isPending) {
      createOrGetMutation.mutate(lookupId);
    }
  }, [lookupId]);

  const supplierData = createOrGetMutation.data;
  const sr = supplierData?.supplierRequest;
  const docsRequired: string[] = sr ? (sr.docsRequired as string[]) : (prefillData?.required_docs || []);
  const docsReceived: string[] = sr ? (sr.docsReceived as string[]) : [];

  const uploadsQuery = useQuery<SupplierUpload[]>({
    queryKey: ["/api/supplier-requests", sr?.id, "uploads"],
    queryFn: async () => {
      if (!sr?.id) return [];
      const res = await fetch(`/api/supplier-requests/${sr.id}/uploads`);
      return res.json();
    },
    enabled: !!sr?.id,
  });
  const uploads = uploadsQuery.data || [];

  const receivedCount = docsReceived.length;
  const totalCount = docsRequired.length;
  const progressPct = totalCount > 0 ? (receivedCount / totalCount) * 100 : 0;

  const handleSendWhatsApp = async () => {
    if (!lookupId) return;
    const data = createOrGetMutation.data || await createOrGetMutation.mutateAsync(lookupId);
    await logSendMutation.mutateAsync({ requestId: data.requestId, channel: "whatsapp" });
    const commodity = prefillData?.commodity_name || "goods";
    const origin = prefillData?.origin_name || "";
    const dest = prefillData?.dest_name || "";
    const message = `Please upload your documents for ${commodity} (${origin} \u2192 ${dest}) here: ${data.uploadUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleSendEmail = async () => {
    if (!lookupId) return;
    const data = createOrGetMutation.data || await createOrGetMutation.mutateAsync(lookupId);
    await logSendMutation.mutateAsync({ requestId: data.requestId, channel: "email" });
    const commodity = prefillData?.commodity_name || "goods";
    const origin = prefillData?.origin_name || "";
    const dest = prefillData?.dest_name || "";
    const docs = docsRequired.map((d, i) => `${i + 1}. ${d}`).join("\n");
    const subject = `Document request \u2014 ${commodity} ${origin} \u2192 ${dest}`;
    const body = `Hi,\n\nPlease prepare and upload the following documents for ${commodity} (${origin} \u2192 ${dest}):\n\n${docs}\n\nUpload here: ${data.uploadUrl}\n\nThank you.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyLink = async () => {
    if (!lookupId) return;
    const data = createOrGetMutation.data || await createOrGetMutation.mutateAsync(lookupId);
    await logSendMutation.mutateAsync({ requestId: data.requestId, channel: "link" });
    try {
      await navigator.clipboard.writeText(data.uploadUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = data.uploadUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!lookupId) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>
        <p style={{ marginBottom: 8 }}>No lookup linked to this LC check.</p>
        <p>Run a compliance lookup first, then start an LC check from the results page.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 292px", height: "calc(100vh - 52px - 40px - 40px)", overflow: "hidden" }} data-testid="supplier-docs-tab">
      {/* LEFT PANEL */}
      <div style={{ padding: "24px 28px", overflowY: "auto" }}>
        {/* SEND BRIEF CARD */}
        <div
          style={{
            background: "var(--card)",
            borderRadius: 14,
            padding: "18px 20px",
            position: "relative",
            overflow: "hidden",
            marginBottom: 24,
          }}
          data-testid="send-brief-card"
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, var(--blue-glow), transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "var(--t1)", marginBottom: 6 }}>
              Send document request to supplier
            </h3>
            <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5, marginBottom: 14 }}>
              {sr?.lastSentAt
                ? `Last sent via ${(sr.sentVia as string[])?.slice(-1)[0] || "link"} \u00B7 ${relativeTime(sr.lastSentAt as unknown as string)} \u00B7 ${sr.status}`
                : "Generate a secure upload link and send it to your supplier. They can upload directly \u2014 no account required."}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleSendWhatsApp}
                disabled={createOrGetMutation.isPending || logSendMutation.isPending}
                style={{
                  background: "rgba(37,211,102,.12)",
                  color: "#25D366",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
                data-testid="button-send-whatsapp"
              >
                <MessageCircle size={14} /> Send via WhatsApp
              </button>
              <button
                onClick={handleSendEmail}
                disabled={createOrGetMutation.isPending || logSendMutation.isPending}
                style={{
                  background: "var(--blue-dim)",
                  color: "var(--blue)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
                data-testid="button-send-email"
              >
                <Mail size={14} /> Send via Email
              </button>
              <button
                onClick={handleCopyLink}
                disabled={createOrGetMutation.isPending || logSendMutation.isPending}
                style={{
                  background: "var(--card2)",
                  color: "var(--t2)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "9px 16px",
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
                data-testid="button-copy-link"
              >
                {copiedLink ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy upload link</>}
              </button>
            </div>
          </div>
        </div>

        {/* DOCUMENT CHECKLIST */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontFamily: "var(--fb)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", whiteSpace: "nowrap" }}>
            Required documents ({totalCount})
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {docsRequired.map((docName, idx) => {
          const isReceived = docsReceived.includes(docName);
          const upload = uploads.find(u => u.docType === docName);
          const isVerified = upload?.verified;
          const hasFinding = upload && !upload.verified && upload.finding;

          let statusLabel: string;
          let statusColor: string;
          let iconBg: string;
          let iconBd: string;

          if (isVerified) {
            statusLabel = "\u2713 Verified";
            statusColor = "var(--green)";
            iconBg = "var(--gbg)";
            iconBd = "var(--gbd)";
          } else if (hasFinding) {
            statusLabel = "\u2297 Needs amendment";
            statusColor = "var(--red)";
            iconBg = "var(--rbg)";
            iconBd = "var(--rbd)";
          } else if (isReceived || upload) {
            statusLabel = "\u25CF Awaiting upload";
            statusColor = "var(--amber)";
            iconBg = "var(--abg)";
            iconBd = "var(--abd)";
          } else {
            statusLabel = "\u25CB Not yet sent";
            statusColor = "var(--t3)";
            iconBg = "var(--card2)";
            iconBd = "var(--border)";
          }

          return (
            <div
              key={idx}
              style={{
                background: "var(--card)",
                borderRadius: 14,
                marginBottom: 6,
                overflow: "hidden",
              }}
              data-testid={`doc-card-${idx}`}
            >
              {/* HEADER ROW */}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: iconBg,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {getDocEmoji(docName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{docName}</div>
                  <div style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--fb)" }}>{getDocIssuer(docName)}</div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--fb)",
                    fontSize: 9,
                    color: statusColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* FINDING ROW */}
              {hasFinding && (
                <div
                  style={{
                    background: "var(--rbg)",

                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 9,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", marginTop: 4, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, flex: 1 }}>{upload!.finding}</span>
                  {upload!.ucpRule && (
                    <span
                      style={{
                        fontFamily: "var(--fb)",
                        fontSize: 9,
                        background: "var(--blue-dim)",

                        color: "var(--blue)",
                        padding: "1px 6px",
                        borderRadius: 3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {upload!.ucpRule}
                    </span>
                  )}
                </div>
              )}

              {/* FILE ROW */}
              <div
                style={{
                  padding: "8px 14px",
                  background: "var(--card2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {upload ? (
                  <>
                    <span style={{ fontFamily: "var(--fb)", fontSize: 11, color: "var(--t3)", flex: 1 }}>
                      {upload.originalFilename}
                      {upload.filesizeBytes ? ` \u00B7 ${(upload.filesizeBytes / 1024).toFixed(0)}KB` : ""}
                      {upload.uploadedAt ? ` \u00B7 ${relativeTime(upload.uploadedAt as unknown as string)}` : ""}
                    </span>
                  </>
                ) : (
                  <span style={{ fontStyle: "italic", fontSize: 11, color: "var(--t3)", flex: 1 }}>Not yet uploaded</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          background: "var(--card)",
          padding: "20px 18px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 15, color: "var(--t1)", marginBottom: 4 }}>
          Document progress
        </h3>
        <p style={{ fontFamily: "var(--fb)", fontSize: 11, color: "var(--t3)", marginBottom: 16 }}>
          {prefillData?.commodity_name || "Commodity"} \u00B7 {prefillData?.origin_name || ""} \u2192 {prefillData?.dest_name || ""}
        </p>

        <div style={{ fontFamily: "var(--fb)", fontSize: 9, color: "var(--t3)", marginBottom: 6 }}>
          {receivedCount} of {totalCount} received
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: progressPct >= 100 ? "var(--green)" : "var(--amber)",
              borderRadius: 2,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p style={{ fontSize: 11, color: "var(--t2)", lineHeight: 1.5, marginBottom: 16 }}>
          {receivedCount === 0
            ? "No documents received yet. Send a request to your supplier to get started."
            : receivedCount === totalCount
              ? "All documents received and ready for review."
              : `${totalCount - receivedCount} document${totalCount - receivedCount > 1 ? "s" : ""} still pending from supplier.`}
        </p>

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        <div style={{ fontFamily: "var(--fb)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", marginBottom: 10 }}>
          Activity
        </div>

        {sr?.lastSentAt && (
          <div style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--blue)", marginTop: 3, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--t2)" }}>
                Supplier brief sent via {(sr.sentVia as string[])?.slice(-1)[0] || "link"}
              </div>
              <div style={{ fontFamily: "var(--fb)", fontSize: 9, color: "var(--t3)" }}>
                {relativeTime(sr.lastSentAt as unknown as string)}
              </div>
            </div>
          </div>
        )}

        {uploads.map((upload, idx) => (
          <div key={idx} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: upload.verified ? "var(--green)" : "var(--amber)", marginTop: 3, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--t2)" }}>
                {upload.verified ? `${upload.docType} verified` : `${upload.docType} uploaded`}
              </div>
              <div style={{ fontFamily: "var(--fb)", fontSize: 9, color: "var(--t3)" }}>
                {upload.uploadedAt ? relativeTime(upload.uploadedAt as unknown as string) : ""}
              </div>
            </div>
          </div>
        ))}

        {!sr?.lastSentAt && uploads.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--t3)", fontStyle: "italic", padding: "8px 0" }}>
            No activity yet
          </div>
        )}

        <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />

        <div style={{ fontFamily: "var(--fb)", fontSize: 9, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--t3)", marginBottom: 6 }}>
          Supplier
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t1)", marginBottom: 4 }}>
          {sr?.supplierName || "Not yet assigned"}
        </div>
        {sr?.uploadToken && (
          <button
            onClick={() => {
              if (supplierData?.uploadUrl) {
                window.open(supplierData.uploadUrl, "_blank");
              }
            }}
            style={{
              width: "100%",
              marginTop: 10,
              background: "transparent",
              color: "var(--t2)",
              fontSize: 11,
              fontWeight: 500,
              padding: "8px 12px",
              borderRadius: 8,
              cursor: "pointer",
              textAlign: "center",
            }}
            data-testid="button-view-upload-page"
          >
            View upload page \u2192
          </button>
        )}
      </div>
    </div>
  );
}
