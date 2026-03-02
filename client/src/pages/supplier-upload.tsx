import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import type { SupplierUpload } from "@shared/schema";

type UploadPageData = {
  request: {
    id: string;
    supplierName: string;
    docsRequired: string[];
    docsReceived: string[];
    status: string;
    uploadExpiresAt: string;
  };
  trade: {
    commodityName: string;
    originIso2: string;
    originName: string;
    destIso2: string;
    destName: string;
  };
  uploads: SupplierUpload[];
};

/* ── helpers ── */

function iso2ToFlag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "";
  const upper = iso2.toUpperCase();
  const cp1 = 0x1f1e6 - 65 + upper.charCodeAt(0);
  const cp2 = 0x1f1e6 - 65 + upper.charCodeAt(1);
  return String.fromCodePoint(cp1, cp2);
}

function getDocIcon(docName: string): string {
  const lower = docName.toLowerCase();
  if (lower.includes("invoice") || lower.includes("commercial")) return "\u{1F4C4}";
  if (lower.includes("origin") || lower.includes("coo")) return "\u{1F30D}";
  if (lower.includes("phyto") || lower.includes("sps")) return "\u{1F33F}";
  if (lower.includes("packing")) return "\u{1F4E6}";
  if (lower.includes("bill of lading") || lower.includes("b/l")) return "\u{1F6A2}";
  return "\u{1F4CB}";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

/* ── shared styles ── */

const lightBg = "#f8f9fa";
const cardBg = "#ffffff";
const cardBorder = "#e5e7eb";
const textPrimary = "#1a1a2e";
const textSecondary = "#6b7280";
const textMuted = "#9ca3af";
const accentGreen = "#0e7a5e";
const accentGreenLight = "#ecfdf5";
const accentGreenBorder = "#a7f3d0";
const amberBg = "#fffbeb";
const amberBorder = "#fde68a";
const amberText = "#b45309";
const sage = "#0e4e45";
const sageHover = "#5a7a6b";

/* ── page ── */

export default function SupplierUpload() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [submitted, setSubmitted] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const dataQuery = useQuery<UploadPageData>({
    queryKey: ["/api/upload", token, "data"],
    queryFn: async () => {
      const res = await fetch(`/api/upload/${token}/data`);
      if (res.status === 404) throw new Error("not_found");
      if (res.status === 410) throw new Error("expired");
      if (!res.ok) throw new Error("error");
      return res.json();
    },
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/upload/${token}/submit`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
  });

  /* ── loading ── */
  if (dataQuery.isLoading) {
    return (
      <div className="supplier-upload-page" style={{ background: lightBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: textSecondary, fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  /* ── error ── */
  if (dataQuery.isError) {
    const errMsg = (dataQuery.error as Error)?.message;
    return <ExpiredPage reason={errMsg === "expired" ? "expired" : "invalid"} />;
  }

  const data = dataQuery.data!;
  const { request, trade, uploads } = data;
  const docsRequired = request.docsRequired as string[];
  const docsReceived = request.docsReceived as string[];
  const daysLeft = daysUntil(request.uploadExpiresAt);

  /* ── submitted success ── */
  if (submitted) {
    return (
      <div className="supplier-upload-page" style={{ background: lightBg, minHeight: "100vh" }}>
        <TopBar />
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: accentGreenLight, border: `2px solid ${accentGreenBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, margin: "0 auto 20px",
          }}>
            {"\u2705"}
          </div>
          <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 22, color: textPrimary, marginBottom: 8 }}>
            Documents submitted
          </h2>
          <p style={{ fontSize: 15, color: textSecondary, lineHeight: 1.6 }}>
            The buyer has been notified. You can close this page.
          </p>
        </div>
        <Footer expiryDate={request.uploadExpiresAt} />
      </div>
    );
  }

  /* ── file upload handler ── */
  const handleFileUpload = async (docType: string, file: File) => {
    setUploadingDoc(docType);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);
      const res = await fetch(`/api/upload/${token}/file`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message);
      }
      dataQuery.refetch();
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  };

  const allReceived = docsReceived.length >= docsRequired.length;

  /* ── main upload page ── */
  return (
    <div className="supplier-upload-page" style={{ background: lightBg, minHeight: "100vh", paddingBottom: 60 }}>
      <TopBar />

      <div style={{ maxWidth: 580, margin: "0 auto", padding: "32px 24px" }}>
        {/* ── Trade context hero ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0e4e45, #14574a, #1c6352, #327462)",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 28,
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {iso2ToFlag(trade.originIso2)}
            </div>
            <div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: 18, fontWeight: 700 }}>
                {trade.commodityName}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {iso2ToFlag(trade.originIso2)} {trade.originName} {"\u2192"} {iso2ToFlag(trade.destIso2)} {trade.destName}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: 0 }}>
            Please upload the documents listed below for this shipment.
            No account needed {"\u2014"} your files go directly to the buyer.
          </p>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            {daysLeft <= 7 ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.3)",
                color: "#fcd34d", fontSize: 12, fontWeight: 600,
                padding: "5px 12px", borderRadius: 6,
              }}>
                {"\u23F1"} Due by {formatDate(request.uploadExpiresAt)}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                Deadline: {formatDate(request.uploadExpiresAt)}
              </span>
            )}
            <span style={{
              fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: "auto",
            }}>
              {docsReceived.length}/{docsRequired.length} uploaded
            </span>
          </div>
        </div>

        {/* ── Document cards ── */}
        {docsRequired.map((docName, idx) => {
          const isReceived = docsReceived.includes(docName);
          const upload = uploads.find((u) => u.docType === docName);
          const isVerified = upload?.verified;
          const hasFinding = upload && !upload.verified && upload.finding;

          return (
            <div
              key={idx}
              style={{
                background: cardBg,
                border: `1px solid ${
                  isVerified ? accentGreenBorder :
                  hasFinding ? amberBorder :
                  cardBorder
                }`,
                borderRadius: 12,
                marginBottom: 12,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {/* Header */}
              <div style={{
                padding: "14px 18px",
                display: "flex", alignItems: "center", gap: 12,
                borderBottom: (!isVerified || hasFinding) ? `1px solid ${cardBorder}` : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: isVerified ? accentGreenLight :
                    hasFinding ? amberBg : "#f3f4f6",
                  border: `1px solid ${
                    isVerified ? accentGreenBorder :
                    hasFinding ? amberBorder : "#e5e7eb"
                  }`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, flexShrink: 0,
                }}>
                  {getDocIcon(docName)}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: textPrimary }}>
                  {docName}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: isVerified ? accentGreen :
                    hasFinding ? amberText :
                    isReceived ? accentGreen : textMuted,
                  whiteSpace: "nowrap",
                  padding: "3px 10px", borderRadius: 6,
                  background: isVerified ? accentGreenLight :
                    hasFinding ? amberBg :
                    isReceived ? accentGreenLight : "#f3f4f6",
                }}>
                  {isVerified ? "\u2713 Verified" :
                    hasFinding ? "\u26A0 Amend" :
                    isReceived ? "\u2713 Received" : "Awaiting"}
                </span>
              </div>

              {/* Finding instruction */}
              {hasFinding && (
                <div style={{
                  background: amberBg, borderTop: `1px solid ${amberBorder}`,
                  padding: "10px 18px",
                }}>
                  <p style={{ fontSize: 13, color: amberText, lineHeight: 1.5, margin: 0 }}>
                    {upload!.finding}
                  </p>
                </div>
              )}

              {/* Verified file row */}
              {isVerified && upload && (
                <div style={{
                  padding: "8px 18px", background: accentGreenLight,
                  borderTop: `1px solid ${accentGreenBorder}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 12, color: textSecondary, flex: 1 }}>
                    {upload.originalFilename}
                    {upload.filesizeBytes ? ` \u00B7 ${(upload.filesizeBytes / 1024).toFixed(0)}KB` : ""}
                  </span>
                  <span style={{ color: accentGreen, fontSize: 14, fontWeight: 700 }}>{"\u2713"}</span>
                </div>
              )}

              {/* Upload zone for non-verified / not-uploaded */}
              {!isVerified && (
                <UploadZone
                  docName={docName}
                  isUploading={uploadingDoc === docName}
                  error={uploadingDoc === docName ? uploadError : null}
                  onFileSelect={(file) => handleFileUpload(docName, file)}
                  hasExistingUpload={!!upload && !hasFinding}
                />
              )}
            </div>
          );
        })}

        {/* ── Progress summary ── */}
        <div style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 10, padding: "16px 20px",
          marginTop: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: textMuted, marginBottom: 10 }}>
            Upload progress
          </div>
          {docsRequired.map((docName, idx) => {
            const isReceived = docsReceived.includes(docName);
            const upload = uploads.find((u) => u.docType === docName);
            const hasFinding = upload && !upload.verified && upload.finding;

            let dotColor: string;
            let label: string;
            if (upload?.verified || isReceived) {
              dotColor = accentGreen;
              label = `${docName} \u2014 received`;
            } else if (hasFinding) {
              dotColor = amberText;
              label = `${docName} \u2014 needs amendment`;
            } else {
              dotColor = "#d1d5db";
              label = `${docName} \u2014 not yet uploaded`;
            }

            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: textSecondary }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Submit button ── */}
        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          style={{
            width: "100%",
            marginTop: 24,
            background: allReceived ? sage : "#d1d5db",
            color: allReceived ? "#fff" : "#9ca3af",
            fontWeight: 700,
            fontSize: 15,
            padding: 16,
            borderRadius: 10,
            border: "none",
            cursor: allReceived ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 52,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (allReceived) (e.target as HTMLButtonElement).style.background = sageHover;
          }}
          onMouseLeave={(e) => {
            if (allReceived) (e.target as HTMLButtonElement).style.background = sage;
          }}
        >
          {submitMutation.isPending ? "Submitting..." : allReceived ? "Submit documents \u2192" : `Upload all ${docsRequired.length} documents to submit`}
        </button>

        <Footer expiryDate={request.uploadExpiresAt} />
      </div>
    </div>
  );
}

/* ── Top bar ── */

function TopBar() {
  return (
    <div style={{
      position: "sticky", top: 0, height: 56,
      background: "#ffffff",
      borderBottom: `1px solid ${cardBorder}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
      zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src="/logo.png" alt="TapTrao" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
        <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 16, color: textPrimary }}>
          TapTrao
        </span>
      </div>
      <span style={{ fontSize: 12, color: textMuted, display: "flex", alignItems: "center", gap: 5 }}>
        {"\uD83D\uDD12"} Secure upload
      </span>
    </div>
  );
}

/* ── Footer ── */

function Footer({ expiryDate }: { expiryDate: string }) {
  return (
    <div style={{ textAlign: "center", marginTop: 40, padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
        <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 4 }} />
        <span style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 14, color: textSecondary }}>
          TapTrao
        </span>
      </div>
      <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.55 }}>
        Your files go directly and securely to the buyer. No TapTrao account required.
      </p>
      <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.55, marginTop: 2 }}>
        This link expires {formatDate(expiryDate)}.
      </p>
    </div>
  );
}

/* ── Expired page ── */

function ExpiredPage({ reason }: { reason: "expired" | "invalid" }) {
  return (
    <div className="supplier-upload-page" style={{ background: lightBg, minHeight: "100vh" }}>
      <TopBar />
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#fef2f2", border: "2px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 20px",
        }}>
          {"\u26A0\uFE0F"}
        </div>
        <h2 style={{ fontFamily: "'Clash Display', sans-serif", fontWeight: 700, fontSize: 20, color: textPrimary, marginBottom: 12 }}>
          {reason === "expired" ? "This upload link has expired" : "Upload link not found"}
        </h2>
        <p style={{ fontSize: 15, color: textSecondary, lineHeight: 1.6 }}>
          Please contact the buyer to request a new link.
        </p>
      </div>
      <Footer expiryDate={new Date().toISOString()} />
    </div>
  );
}

/* ── Upload zone ── */

function UploadZone({
  docName,
  isUploading,
  error,
  onFileSelect,
  hasExistingUpload,
}: {
  docName: string;
  isUploading: boolean;
  error: string | null;
  onFileSelect: (file: File) => void;
  hasExistingUpload: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = "";
  }, [onFileSelect]);

  if (hasExistingUpload) {
    return (
      <div style={{
        padding: "10px 18px",
        background: accentGreenLight,
        borderTop: `1px solid ${accentGreenBorder}`,
        fontSize: 13, color: accentGreen, fontWeight: 500,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {"\u2713"} Uploaded — pending verification
      </div>
    );
  }

  return (
    <div style={{ padding: "10px 18px" }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragOver ? sage : "#d1d5db"}`,
          borderRadius: 10,
          padding: "20px 16px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all .15s",
          background: isDragOver ? "rgba(14,78,69,0.06)" : "#fafafa",
          minHeight: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isUploading ? (
          <div style={{ fontSize: 13, color: textSecondary }}>Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: textSecondary, fontWeight: 500 }}>
              {"\uD83D\uDCCE"} Drop file here or tap to choose
            </div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
              PDF, JPG, PNG {"\u00B7"} max 20MB
            </div>
          </>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>{error}</div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: "none" }}
        onChange={handleChange}
      />
    </div>
  );
}
