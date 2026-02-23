import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--card)", borderRadius: 14, maxWidth: 400, width: "100%", margin: "0 16px", padding: 24 }}>
        <div style={{ display: "flex", marginBottom: 16, gap: 8, alignItems: "center" }}>
          <AlertCircle size={28} style={{ color: "var(--red)", flexShrink: 0 }} />
          <h1 style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 22, color: "var(--t1)" }}>404 Page Not Found</h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--t2)" }}>
          The page you're looking for doesn't exist.
        </p>
      </div>
    </div>
  );
}
