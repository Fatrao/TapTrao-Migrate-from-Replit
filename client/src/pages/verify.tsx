import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

type VerifyData = {
  commodityName: string;
  originName: string;
  destinationName: string;
  twinlogRef: string;
  twinlogHash: string;
  twinlogLockedAt: string;
  readinessScore: number | null;
  readinessVerdict: string | null;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " at " + new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function verdictLabel(v: string | null): string {
  if (!v) return "";
  if (v === "GREEN") return "LOW RISK";
  if (v === "AMBER") return "MODERATE RISK";
  return "HIGH RISK";
}

export default function VerifyPage() {
  const params = useParams<{ ref: string }>();
  const ref = params.ref;

  const query = useQuery<VerifyData>({
    queryKey: ["/api/verify", ref],
    queryFn: async () => {
      const res = await fetch(`/api/verify/${ref}`);
      if (!res.ok) throw new Error("not_found");
      return res.json();
    },
    retry: false,
  });

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: 52,
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="TapTrao" style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }} />
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 16, color: "var(--t1)" }}>
            TapTrao
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px" }}>
        {query.isLoading && (
          <div style={{ textAlign: "center", color: "var(--t3)", fontSize: 13 }}>Verifying...</div>
        )}

        {query.isError && (
          <div style={{ textAlign: "center" }}>
            <h2
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 20, color: "var(--t1)", marginBottom: 12 }}
              data-testid="text-not-found-title"
            >
              Reference not found.
            </h2>
            <p style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>
              The TwinLog reference you entered does not match any record in our system.
            </p>
          </div>
        )}

        {query.data && (
          <>
            <h2
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 22, color: "var(--t1)", marginBottom: 16 }}
              data-testid="text-verify-heading"
            >
              TwinLog Verification
            </h2>

            <div
              style={{
                background: "var(--gbg)",
                borderRadius: 14,
                padding: "14px 18px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              data-testid="verify-success-banner"
            >
              <span style={{ fontSize: 16, color: "var(--green)" }}>{"\u2713"}</span>
              <span style={{ fontSize: 13, color: "var(--green)", lineHeight: 1.5 }}>
                This record was locked on {formatDate(query.data.twinlogLockedAt)} and has not been modified.
              </span>
            </div>

            <div
              style={{
                background: "var(--card)",
                borderRadius: 14,
                padding: "18px 20px",
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                  Trade
                </div>
                <div style={{ fontSize: 14, color: "var(--t1)", fontWeight: 600 }}>
                  {query.data.commodityName}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                  {query.data.originName} {"\u2192"} {query.data.destinationName}
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 -20px 16px", width: "calc(100% + 40px)" }} />

              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Reference
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "var(--blue)", fontWeight: 700 }} data-testid="text-verify-ref">
                    {query.data.twinlogRef}
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Hash
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", wordBreak: "break-all" }} data-testid="text-verify-hash">
                    sha256:{query.data.twinlogHash}
                  </div>
                </div>

                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Locked
                  </div>
                  <div style={{ fontSize: 12, color: "var(--t2)" }}>
                    {formatDate(query.data.twinlogLockedAt)}
                  </div>
                </div>

                {query.data.readinessScore != null && (
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                      Score
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "var(--t1)" }}>
                        {query.data.readinessScore}
                      </span>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        color: query.data.readinessVerdict === "GREEN" ? "var(--green)" :
                          query.data.readinessVerdict === "AMBER" ? "var(--amber)" : "var(--red)",
                      }}>
                        {verdictLabel(query.data.readinessVerdict)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 40, padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 4 }} />
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 14, color: "var(--t2)" }}>TapTrao</span>
        </div>
        <p style={{ fontSize: 11, color: "var(--t3)", lineHeight: 1.55 }}>
          Trade compliance verification powered by TapTrao.
        </p>
      </div>
    </div>
  );
}
