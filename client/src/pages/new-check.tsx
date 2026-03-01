import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { usePageTitle } from "@/hooks/use-page-title";
import { Search, FileCheck } from "lucide-react";

export default function NewCheck() {
  usePageTitle("New Check", "Choose which check to run for your shipment");

  return (
    <AppShell>
      {/* Green hero */}
      <div className="green-hero" style={{ margin: "4px 24px 16px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "5px 14px",
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 14,
          letterSpacing: "0.03em",
        }}>
          Compliance Tools
        </div>
        <h1 style={{
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 700,
          fontSize: 32,
          color: "#fff",
          margin: "0 0 8px",
          lineHeight: 1.2,
        }}>
          New Check
        </h1>
        <p style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.55)",
          margin: 0,
          maxWidth: 500,
        }}>
          Choose a check type for your shipment. Each check generates a hash-chained audit record.
        </p>
      </div>

      {/* Two large cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 16,
        padding: "0 24px 32px",
      }}>
        {/* Compliance Check Card */}
        <Link href="/lookup">
          <div style={{
            background: "#fff",
            borderRadius: 14,
            padding: 28,
            cursor: "pointer",
            transition: "box-shadow 0.2s, transform 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "rgba(107,144,128,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Search size={22} style={{ color: "#6b9080" }} />
            </div>
            <h3 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#1a1a1a",
              margin: "0 0 8px",
            }}>
              Compliance Check
            </h3>
            <p style={{
              fontSize: 13,
              color: "#888",
              lineHeight: 1.6,
              margin: "0 0 16px",
            }}>
              What regulations apply to your shipment? Get duty rates, document requirements, risk assessments, and readiness scores for any commodity corridor.
            </p>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#6b9080",
            }}>
              Start Check →
            </div>
          </div>
        </Link>

        {/* LC Document Check Card */}
        <Link href="/lc-check">
          <div style={{
            background: "#fff",
            borderRadius: 14,
            padding: 28,
            cursor: "pointer",
            transition: "box-shadow 0.2s, transform 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "rgba(107,144,128,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <FileCheck size={22} style={{ color: "#6b9080" }} />
            </div>
            <h3 style={{
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#1a1a1a",
              margin: "0 0 8px",
            }}>
              LC Document Check
            </h3>
            <p style={{
              fontSize: 13,
              color: "#888",
              lineHeight: 1.6,
              margin: "0 0 16px",
            }}>
              Do your documents match your LC terms? Cross-check Letter of Credit terms against supplier documents using UCP 600 rules to catch discrepancies before bank presentation.
            </p>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#6b9080",
            }}>
              Start LC Check →
            </div>
          </div>
        </Link>
      </div>
    </AppShell>
  );
}
