import { useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function AdminAlertsPage() {
  const [source, setSource] = useState("MANUAL");
  const [hsCodes, setHsCodes] = useState("");
  const [destIso2, setDestIso2] = useState("");
  const [summary, setSummary] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          admin_password: adminPassword,
          source,
          hs_codes_affected: hsCodes,
          dest_iso2_affected: destIso2,
          summary,
          source_url: sourceUrl || undefined,
          effective_date: effectiveDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed");
      }
      setStatus("success");
      setSummary("");
      setHsCodes("");
      setDestIso2("");
      setSourceUrl("");
      setEffectiveDate("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to create alert");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    background: "var(--card)",
    border: "none",
    borderRadius: 6,
    color: "var(--t1)",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: "var(--t3)",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  return (
    <AppShell>
      <div style={{ flex: 1, padding: "40px 24px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--fh)",
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "0",
              color: "var(--t1)",
              marginBottom: 24,
            }}
            data-testid="text-admin-alerts-title"
          >
            Create Regulatory Alert
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle}>Source</label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                style={inputStyle}
                placeholder="MANUAL"
                data-testid="input-alert-source"
              />
            </div>

            <div>
              <label style={labelStyle}>HS Codes Affected (comma-separated)</label>
              <input
                value={hsCodes}
                onChange={(e) => setHsCodes(e.target.value)}
                style={inputStyle}
                placeholder="1801.00, 0901.11"
                data-testid="input-alert-hs-codes"
              />
            </div>

            <div>
              <label style={labelStyle}>Destination ISO2 (comma-separated)</label>
              <input
                value={destIso2}
                onChange={(e) => setDestIso2(e.target.value)}
                style={inputStyle}
                placeholder="EU, GB"
                data-testid="input-alert-dest"
              />
            </div>

            <div>
              <label style={labelStyle}>Summary *</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                required
                data-testid="input-alert-summary"
              />
            </div>

            <div>
              <label style={labelStyle}>Source URL</label>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                style={inputStyle}
                placeholder="https://..."
                data-testid="input-alert-source-url"
              />
            </div>

            <div>
              <label style={labelStyle}>Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                style={inputStyle}
                data-testid="input-alert-effective-date"
              />
            </div>

            <div>
              <label style={labelStyle}>Admin Password *</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                style={inputStyle}
                required
                data-testid="input-admin-password"
              />
            </div>

            <button
              type="submit"
              style={{
                background: "var(--blue)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 16px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
              data-testid="button-create-alert"
            >
              Create Alert
            </button>

            {status === "success" && (
              <div
                style={{
                  background: "var(--gbg)",
                  border: "1px solid var(--gbd)",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "var(--green)",
                  fontWeight: 600,
                }}
                data-testid="text-alert-success"
              >
                Alert created successfully.
              </div>
            )}

            {status === "error" && (
              <div
                style={{
                  background: "var(--rbg)",
                  border: "1px solid var(--rbd)",
                  borderRadius: 6,
                  padding: "10px 14px",
                  fontSize: 12,
                  color: "var(--red)",
                  fontWeight: 600,
                }}
                data-testid="text-alert-error"
              >
                {errorMsg}
              </div>
            )}
          </form>
        </div>
      </div>
    </AppShell>
  );
}
