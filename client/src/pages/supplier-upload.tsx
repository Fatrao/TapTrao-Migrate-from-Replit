import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { getAvatarColour } from "@/lib/avatarColours";
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

function getDocEmoji(docName: string): string {
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

  if (dataQuery.isLoading) {
    return (
      <div style={{ background: "var(--s0)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--t2)", fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (dataQuery.isError) {
    const errMsg = (dataQuery.error as Error)?.message;
    return <ExpiredPage reason={errMsg === "expired" ? "expired" : "invalid"} />;
  }

  const data = dataQuery.data!;
  const { request, trade, uploads } = data;
  const docsRequired = request.docsRequired as string[];
  const docsReceived = request.docsReceived as string[];
  const avatarColour = getAvatarColour(trade.originIso2);
  const daysLeft = daysUntil(request.uploadExpiresAt);

  if (submitted) {
    return (
      <div style={{ background: "var(--s0)", minHeight: "100vh" }}>
        <TopBar />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2705"}</div>
          <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 20, color: "var(--t1)", marginBottom: 8 }}>
            Documents submitted
          </h2>
          <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>
            The buyer has been notified. You can close this page.
          </p>
        </div>
        <Footer expiryDate={request.uploadExpiresAt} />
      </div>
    );
  }

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

  return (
    <div style={{ background: "var(--s0)", minHeight: "100vh", paddingBottom: 80 }}>
      <TopBar />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px" }}>
        {/* Trade Context Card */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--s5)",
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 24,
          }}
          data-testid="trade-context-card"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: avatarColour.bg,
                border: `1px solid ${avatarColour.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                fontWeight: 700,
                color: avatarColour.text,
                flexShrink: 0,
              }}
            >
              {trade.originIso2}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--t1)" }}>{trade.commodityName}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)" }}>
                {trade.originName} {"\u2192"} {trade.destName}
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--s5)", margin: "0 -20px", marginBottom: 14, width: "calc(100% + 40px)" }} />

          <p style={{ fontSize: 13, color: "var(--t2)", lineHeight: 1.65, marginBottom: 14 }}>
            Please upload the documents listed below for this shipment.
            No account needed {"\u2014"} just upload your files and they will go directly to the buyer.
          </p>

          {daysLeft <= 7 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "var(--abg)",
                border: "1px solid var(--abd)",
                color: "var(--amber)",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 5,
              }}
              data-testid="deadline-chip"
            >
              {"\u23F1"} Required before {formatDate(request.uploadExpiresAt)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--t3)", fontFamily: "'DM Mono', monospace" }}>
              Deadline: {formatDate(request.uploadExpiresAt)}
            </span>
          )}
        </div>

        {/* Document Cards */}
        {docsRequired.map((docName, idx) => {
          const isReceived = docsReceived.includes(docName);
          const upload = uploads.find(u => u.docType === docName);
          const isVerified = upload?.verified;
          const hasFinding = upload && !upload.verified && upload.finding;

          let borderColor = "var(--s5)";
          let statusTag: { label: string; color: string };
          let iconBg: string;
          let iconBd: string;

          if (isVerified) {
            borderColor = "rgba(74,140,111,.22)";
            statusTag = { label: "\u2713 Received", color: "var(--green)" };
            iconBg = "var(--gbg)";
            iconBd = "var(--gbd)";
          } else if (hasFinding) {
            borderColor = "rgba(234,139,67,.2)";
            statusTag = { label: "\u26A0 Amend & reupload", color: "var(--amber)" };
            iconBg = "var(--abg)";
            iconBd = "var(--abd)";
          } else {
            statusTag = { label: "Awaiting", color: "var(--t3)" };
            iconBg = "var(--s4)";
            iconBd = "var(--s5)";
          }

          return (
            <div
              key={idx}
              style={{
                background: "var(--s1)",
                border: `1px solid ${borderColor}`,
                borderRadius: 12,
                marginBottom: 10,
                overflow: "hidden",
              }}
              data-testid={`upload-doc-card-${idx}`}
            >
              {/* Header */}
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: iconBg,
                    border: `1px solid ${iconBd}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {getDocEmoji(docName)}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{docName}</div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: statusTag.color, whiteSpace: "nowrap" }}>
                  {statusTag.label}
                </span>
              </div>

              {/* Finding instruction */}
              {hasFinding && (
                <div style={{ background: "var(--abg)", borderTop: "1px solid var(--abd)", padding: "10px 14px" }}>
                  <p style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.5 }}>{upload!.finding}</p>
                </div>
              )}

              {/* Verified file row */}
              {isVerified && upload && (
                <div style={{ padding: "8px 14px", background: "var(--s2)", borderTop: "1px solid var(--s5)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", flex: 1 }}>
                    {upload.originalFilename}
                    {upload.filesizeBytes ? ` \u00B7 ${(upload.filesizeBytes / 1024).toFixed(0)}KB` : ""}
                  </span>
                  <span style={{ color: "var(--green)", fontSize: 14 }}>{"\u2713"}</span>
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

        {/* Progress Summary */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--s5)",
            borderRadius: 10,
            padding: "14px 16px",
            marginTop: 24,
          }}
          data-testid="progress-summary"
        >
          {docsRequired.map((docName, idx) => {
            const isReceived = docsReceived.includes(docName);
            const upload = uploads.find(u => u.docType === docName);
            const hasFinding = upload && !upload.verified && upload.finding;

            let dotColor: string;
            let label: string;
            if (upload?.verified || isReceived) {
              dotColor = "var(--green)";
              label = `${docName} \u2014 received`;
            } else if (hasFinding) {
              dotColor = "var(--amber)";
              label = `${docName} \u2014 needs amendment`;
            } else {
              dotColor = "var(--t3)";
              label = `${docName} \u2014 not yet uploaded`;
            }

            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "var(--t2)" }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending}
          style={{
            width: "100%",
            marginTop: 20,
            background: "var(--blue)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            padding: 16,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minHeight: 52,
          }}
          data-testid="button-submit-docs"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit documents \u2192"}
        </button>

        <Footer expiryDate={request.uploadExpiresAt} />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        height: 52,
        background: "var(--s0)",
        borderBottom: "1px solid var(--s5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 50,
      }}
      data-testid="upload-topbar"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src="/taptrao-green-logo.png" alt="TapTrao" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
        <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "var(--t1)" }}>
          TapTrao
        </span>
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)" }}>
        {"\uD83D\uDD12"} Secure upload
      </span>
    </div>
  );
}

function Footer({ expiryDate }: { expiryDate: string }) {
  return (
    <div style={{ textAlign: "center", marginTop: 32, padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
        <img src="/taptrao-green-logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 4 }} />
        <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 14, color: "var(--t2)" }}>TapTrao</span>
      </div>
      <p style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.55 }}>
        Your files go directly and securely to the buyer. No TapTrao account required.
      </p>
      <p style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.55 }}>
        This link expires {formatDate(expiryDate)}.
      </p>
    </div>
  );
}

function ExpiredPage({ reason }: { reason: "expired" | "invalid" }) {
  return (
    <div style={{ background: "var(--s0)", minHeight: "100vh" }}>
      <TopBar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 20, color: "var(--t1)", marginBottom: 12 }} data-testid="text-expired-title">
          This upload link has expired or is invalid.
        </h2>
        <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>
          Please contact the buyer to request a new link.
        </p>
      </div>
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          <img src="/taptrao-green-logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 4 }} />
          <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 14, color: "var(--t2)" }}>TapTrao</span>
        </div>
      </div>
    </div>
  );
}

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
      <div style={{ padding: "10px 14px", background: "var(--s2)", borderTop: "1px solid var(--s5)", fontSize: 12, color: "var(--t2)" }}>
        Uploaded {"\u2014"} pending verification
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 14px", borderTop: "1px solid var(--s5)" }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${isDragOver ? "var(--blue-bd)" : "var(--s5)"}`,
          borderRadius: 8,
          padding: 16,
          textAlign: "center",
          cursor: "pointer",
          transition: "all .15s",
          background: isDragOver ? "var(--blue-dim)" : "transparent",
          minHeight: 44,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
        data-testid={`upload-zone-${docName.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {isUploading ? (
          <div style={{ fontSize: 13, color: "var(--t2)" }}>Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "var(--t2)", fontWeight: 500 }}>
              {"\uD83D\uDCCE"} Drop file here or tap to choose
            </div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 4 }}>PDF, JPG, PNG {"\u00B7"} max 20MB</div>
          </>
        )}
      </div>
      {error && (
        <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6 }}>{error}</div>
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
