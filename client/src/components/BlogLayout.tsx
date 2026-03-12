import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import "@/styles/blog.css";

/**
 * Shared layout for blog pages (index + articles).
 * Uses the same cream theme as the landing page with
 * a sticky dark-sage nav bar.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="blog-page" style={{ fontFamily: "var(--fb)", background: "var(--bg)", color: "var(--t1)", minHeight: "100vh" }}>
      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 64,
        background: "var(--dark)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover" }} />
          <span style={{ fontFamily: "var(--fd)", color: "#fff", fontSize: "1.2rem", fontWeight: 600 }}>TapTrao</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ gap: 28, alignItems: "center" }}>
          <Link href="/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.875rem" }}>Blog</Link>
          <a href="/#how" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.875rem" }}>How It Works</a>
          <a href="/#pricing" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.875rem" }}>Pricing</a>
          <Link href="/new-check" style={{
            background: "var(--sage)", color: "#fff",
            padding: "8px 20px", borderRadius: 100, fontWeight: 600, fontSize: "0.875rem",
            textDecoration: "none",
          }}>
            Free Compliance Check
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{
          background: "var(--dark)", padding: "16px 24px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <Link href="/blog" onClick={() => setMenuOpen(false)} style={{ color: "#fff", textDecoration: "none", fontSize: 15 }}>Blog</Link>
          <a href="/#how" onClick={() => setMenuOpen(false)} style={{ color: "rgba(255,255,255,.7)", textDecoration: "none", fontSize: 15 }}>How It Works</a>
          <a href="/#pricing" onClick={() => setMenuOpen(false)} style={{ color: "rgba(255,255,255,.7)", textDecoration: "none", fontSize: 15 }}>Pricing</a>
          <Link href="/new-check" onClick={() => setMenuOpen(false)} style={{
            background: "var(--sage)", color: "#fff", padding: "10px 20px",
            borderRadius: 100, fontWeight: 600, textDecoration: "none", textAlign: "center",
          }}>
            Free Compliance Check
          </Link>
        </div>
      )}

      {/* Page content */}
      {children}
    </div>
  );
}
