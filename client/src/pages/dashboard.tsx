import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import type { Lookup, LcCheck, TokenTransaction, ComplianceResult } from "@shared/schema";
import { usePageTitle } from "@/hooks/use-page-title";

export default function Dashboard() {
  const statsQuery = useQuery<{ totalLookups: number; totalLcChecks: number; topCorridor: string | null }>({
    queryKey: ["/api/dashboard/stats"],
  });
  const lookupsQuery = useQuery<Lookup[]>({ queryKey: ["/api/lookups/recent"] });
  const lcQuery = useQuery<LcCheck[]>({ queryKey: ["/api/lc-checks/recent"] });
  const tokenQuery = useTokenBalance();
  const txQuery = useQuery<TokenTransaction[]>({ queryKey: ["/api/tokens/transactions", "?limit=10"] });
  const stats = statsQuery.data;
  usePageTitle("Dashboard", "Overview of your trade compliance activity");
  const [, navigate] = useLocation();

  const lookupIds = lookupsQuery.data?.map(l => l.id) ?? [];
  const lcLinksQuery = useQuery<Record<string, string>>({
    queryKey: ["/api/lc-checks/linked-lookups", lookupIds],
    queryFn: async () => {
      if (!lookupIds.length) return {};
      const res = await apiRequest("POST", "/api/lc-checks/linked-lookups", { lookupIds });
      return res.json();
    },
    enabled: lookupIds.length > 0,
  });
  const lcLinkMap = lcLinksQuery.data ?? {};

  const recentTrades: Array<{ id: string; icon: string; iconBg: string; name: string; hs: string; corridor: string; date: string; value: string; status: "comp" | "pend" | "rev"; statusLabel: string; btnLabel: string; lookupData?: Lookup }> = [];

  if (lookupsQuery.data) {
    for (const l of lookupsQuery.data.slice(0, 5)) {
      const result = l.resultJson as ComplianceResult | null;
      recentTrades.push({
        id: l.id,
        icon: "📦",
        iconBg: "rgba(46,204,113,.1)",
        name: l.commodityName,
        hs: `HS ${l.hsCode}`,
        corridor: `${l.originName?.substring(0, 2).toUpperCase() ?? "?"} → ${l.destinationName?.substring(0, 2).toUpperCase() ?? "?"}`,
        date: new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value: "—",
        status: l.riskLevel === "LOW" ? "comp" : l.riskLevel === "MEDIUM" ? "pend" : "rev",
        statusLabel: l.riskLevel === "LOW" ? "Compliant" : l.riskLevel === "MEDIUM" ? "Pending" : "Review",
        btnLabel: l.riskLevel === "LOW" ? "View" : "Review",
        lookupData: l,
      });
    }
  }

  const balance = tokenQuery.data?.balance ?? 0;
  const totalLookups = stats?.totalLookups ?? 0;

  /* Count items needing attention */
  const pendingCount = lookups.filter(
    (l) => l.riskLevel === "MEDIUM" || l.riskLevel === "HIGH" || l.riskLevel === "STOP"
  ).length;

  return (
    <AppShell
      topCenter={
        <div style={{ display: "flex", gap: 26 }}>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Dashboard</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)", cursor: "pointer" }}>Commodities</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)", cursor: "pointer" }}>Suppliers</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)", cursor: "pointer" }}>Compliance</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)", cursor: "pointer" }}>Messages</span>
        </div>
      }
    >
      {/* ── INNER HEADER BOX (Layer 4) ── */}
      <div style={{
        margin: "0 14px 0",
        borderRadius: 16,
        padding: "20px 24px 44px",
        position: "relative",
        background: "linear-gradient(180deg,#0d2218 0%,#0f2a1e 30%,#143424 55%,#1a4030 75%,rgba(26,60,44,0.7) 88%,rgba(26,60,44,0) 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        overflow: "hidden",
      }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", borderRadius: 24, padding: "4px 14px", fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12, backdropFilter: "blur(6px)" }}>
            <div className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)", flexShrink: 0 }} />
            Commodity › Overview
          </div>
          <div style={{ fontFamily: "var(--fh)", fontSize: 30, fontWeight: 700, color: "#fff", letterSpacing: "0", lineHeight: 1.1, marginBottom: 7 }} data-testid="text-dashboard-title">
            Compliance:<br />Pending
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {totalLookups} lookups · {stats?.totalLcChecks ?? 0} LC checks · {balance} credits remaining
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 2 }}>
            <span style={{ padding: "6px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,.35)" }}>About</span>
            <span style={{ padding: "6px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 500, background: "rgba(255,255,255,.12)" }}>Overview</span>
            <span style={{ padding: "6px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,.35)" }}>Documents</span>
            <span style={{ padding: "6px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,.35)" }}>Activity</span>
          </div>
          <Link href="/lookup">
            <span style={{ background: "var(--green)", color: "#000", padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--fb)", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 18px rgba(46,204,113,0.4)", whiteSpace: "nowrap" }}>
              Request Documents ›
            </span>
          </Link>
        </div>
      </div>

      {/* ── STAT CARDS (overlap hero fade) ── */}
      <div style={{ padding: "0 14px 20px", marginTop: -28, position: "relative" }}>
        <div className="dash-stat-row">
          <div className="dash-sc c-green">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "rgba(46,204,113,.1)" }}>🏦</div>
              <span style={{ fontSize: 15, color: "#ddd", cursor: "pointer" }}>···</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Total Trade Value at Risk</div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 700, color: "var(--txt)", letterSpacing: "0", lineHeight: 1, marginBottom: 9, position: "relative", zIndex: 1 }}>
              <sup style={{ fontSize: 13, fontWeight: 500, verticalAlign: "super", marginRight: 1, opacity: .5 }}>$</sup>2,345,678
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, position: "relative", zIndex: 1 }}>
              <span style={{ color: "#4a8c6f", fontWeight: 600 }}>↑ 12.5%</span><span style={{ color: "var(--txt3)" }}>{totalLookups} past shipments</span>
            </div>
          </div>
          <div className="dash-sc c-teal">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "rgba(20,184,166,.1)" }}>🔖</div>
              <span style={{ fontSize: 15, color: "#ddd", cursor: "pointer" }}>···</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Total Lookups</div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: "0", lineHeight: 1, marginBottom: 9, position: "relative", zIndex: 1 }} data-testid="stat-compliance-lookups">
              {totalLookups} <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 400, fontFamily: "var(--fb)" }}>checks</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, position: "relative", zIndex: 1 }}>
              <span style={{ color: "#4a8c6f", fontWeight: 600 }}>↑ 8%</span><span style={{ color: "var(--txt3)" }}>vs prev. 28 days</span>
            </div>
          </div>
          <div className="dash-sc c-amber">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, position: "relative", zIndex: 1 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "rgba(245,158,11,.1)" }}>⚠️</div>
              <span style={{ fontSize: 15, color: "#ddd", cursor: "pointer" }}>···</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--txt3)", marginBottom: 4, position: "relative", zIndex: 1 }}>Rejection Risk</div>
            <div style={{ fontFamily: "var(--fh)", fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: "0", lineHeight: 1, marginBottom: 9, position: "relative", zIndex: 1, display: "flex", alignItems: "baseline", gap: 4 }}>
              7.8<span style={{ fontSize: 14, fontWeight: 400, fontFamily: "var(--fb)" }}>%</span>
              <span style={{ background: "rgba(245,158,11,.1)", color: "#ea8b43", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, marginLeft: 4 }}>Moderate</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, position: "relative", zIndex: 1 }}>
              <span style={{ color: "var(--red)", fontWeight: 600 }}>↓ 1.7%</span><span style={{ color: "var(--txt3)" }}>vs prev. 28 days</span>
            </div>
          </div>
          <div className="dash-sc cta" style={{ background: "#0a0a0a" }}>
            <div className="animate-breathe" style={{ position: "absolute", bottom: -20, right: -20, width: 130, height: 130, background: "radial-gradient(circle,rgba(46,204,113,.28) 0%,rgba(46,204,113,.06) 50%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            <div style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 800, color: "var(--green)", letterSpacing: "0", lineHeight: 1, position: "relative", zIndex: 1 }} data-testid="stat-token-balance">{balance}</div>
            <div style={{ fontSize: 11.5, color: "#555", margin: "3px 0 14px", position: "relative", zIndex: 1 }}>Recommended with <span style={{ color: "var(--green)", fontWeight: 600 }}>AI</span></div>
            <Link href="/lookup">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green)", color: "#000", padding: "8px 14px", borderRadius: 22, fontSize: 12, fontWeight: 700, fontFamily: "var(--fb)", cursor: "pointer", position: "relative", zIndex: 1, boxShadow: "0 4px 16px rgba(46,204,113,.4)" }}>Pre-Shipment Check →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── WHITE CONTENT ── */}
      <div style={{ padding: "4px 14px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 12, alignItems: "start" }}>
          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Recent Trades Table */}
            <div className="dash-wp">
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8 }}>
                  Recent Trades <span style={{ background: "#f5f5f5", color: "var(--txt3)", fontSize: 11, padding: "1px 7px", borderRadius: 12, fontFamily: "var(--fb)" }}>{recentTrades.length}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "#f5f5f5", borderRadius: 7, padding: "4px 11px", fontSize: 11.5, color: "var(--txt3)", cursor: "pointer" }}>⇅ Filter</span>
                  <Link href="/trades"><span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }} data-testid="link-view-all-lookups">View All ›</span></Link>
                </div>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              <div style={{ display: "grid", gridTemplateColumns: "2fr 0.9fr 0.8fr 0.9fr 1fr 68px", padding: "7px 20px", fontSize: 10.5, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: ".08em", background: "#fafafa" }}>
                <span>Commodity</span><span>Corridor</span><span>Date</span><span>Value</span><span>Status</span><span></span>
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {recentTrades.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--txt3)" }}>No trades yet. Run your first compliance check.</div>
                ) : recentTrades.map((t) => (
                  <div key={t.id} style={{ display: "grid", gridTemplateColumns: "2fr 0.9fr 0.8fr 0.9fr 1fr 68px", padding: "11px 20px", alignItems: "center", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, background: t.iconBg }}>{t.icon}</div>
                      <div><div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt)" }} data-testid={`lookup-name-${t.id}`}>{t.name}</div><div style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 1 }}>{t.hs}</div></div>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--txt2)", display: "flex", alignItems: "center", gap: 3 }}>{t.corridor}</div>
                    <div style={{ fontSize: 11.5, color: "var(--txt3)" }}>{t.date}</div>
                    <div style={{ fontFamily: "var(--fh)", fontSize: 12.5, fontWeight: 600, color: "var(--txt)" }}>{t.value}</div>
                    <div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        ...(t.status === "comp" ? { background: "rgba(22,163,74,.09)", color: "#4a8c6f" } : t.status === "pend" ? { background: "rgba(245,158,11,.1)", color: "#ea8b43" } : { background: "rgba(231,76,60,.09)", color: "var(--red)" }),
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: t.status === "comp" ? "#4a8c6f" : t.status === "pend" ? "var(--amber)" : "var(--red)" }} />
                        {t.statusLabel}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11.5, color: "var(--txt2)", cursor: "pointer", padding: "4px 10px", borderRadius: 7, background: "#f5f5f5", fontFamily: "var(--fb)" }}>{t.btnLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Actions */}
            <div className="dash-wp">
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)" }}>Required Actions</div>
                <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }}>View All ›</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "12px 20px" }}>
                {[
                  { ic: "📄", lbl: "Resolve Documents" },
                  { ic: "🛡️", lbl: "Assess Risks" },
                  { ic: "🚩", lbl: "Review Sanctions" },
                  { ic: "🔍", lbl: "Audit Shipment" },
                ].map(a => (
                  <div key={a.lbl} style={{ background: "#f7f7f7", borderRadius: 11, padding: "13px 8px", cursor: "pointer", textAlign: "center", transition: "all .18s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f0f0"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f7f7f7"; e.currentTarget.style.transform = "none"; }}
                  >
                    <span style={{ fontSize: 19, marginBottom: 6, display: "block" }}>{a.ic}</span>
                    <div style={{ fontSize: 11.5, color: "var(--txt2)", fontWeight: 500, lineHeight: 1.3 }}>{a.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="dash-wp">
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8 }}>Alerts <span style={{ background: "#f5f5f5", color: "var(--txt3)", fontSize: 11, padding: "1px 7px", borderRadius: 12, fontFamily: "var(--fb)" }}>5</span></div>
                <Link href="/alerts"><span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }}>See All ›</span></Link>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              {[
                { ic: "⚠️", type: "warn", title: "EUDR Compliance Deadline Approaching", desc: "Cocoa Beans (HS 1801) → EU. Large operators Dec 2026. Geolocation not submitted.", time: "2 hours ago" },
                { ic: "🚩", type: "warn", title: "60% Sanctions Flagged", desc: "Supplier screening returned partial match. Manual review required.", time: "4 hours ago" },
                { ic: "📡", type: "info", title: "New SPS notification — Turkey", desc: "HS 1207.40 sesame — new MRL update affecting ET → TR corridor.", time: "1 day ago" },
              ].map(a => (
                <div key={a.title} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 20px", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 1, background: a.type === "warn" ? "rgba(245,158,11,.1)" : "rgba(20,184,166,.1)" }}>{a.ic}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt)", marginBottom: 2 }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--txt3)", lineHeight: 1.45 }}>{a.desc}</div>
                    <div style={{ fontSize: 10.5, color: "#ccc", marginTop: 3 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Pending Compliance Docs */}
            <div className="dash-wp">
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)" }}>Pending Compliance Docs</div>
                <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }}>All ›</span>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              {[
                { ic: "📋", name: "Bill of Lading", meta: "Cocoa Beans · GH → EU", st: "⚠ 3", stClass: "w" },
                { ic: "🌍", name: "Country of Origin", meta: "COCOBOD / Ghana Customs", st: "60%", stClass: "p" },
                { ic: "🔬", name: "Inspection Certificate", meta: "Port Health · Felixstowe", st: "⚠ 2", stClass: "w" },
                { ic: "🌱", name: "EUDR Due Diligence", meta: "Geolocation pending", st: "⚠ 3", stClass: "w" },
                { ic: "📦", name: "Customs Declaration", meta: "CDS · UK Import", st: "✓ Ready", stClass: "ok" },
              ].map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 20px", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#fafafa"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, background: "#f5f5f5", flexShrink: 0 }}>{d.ic}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt)" }}>{d.name}</div>
                    <div style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 1 }}>{d.meta}</div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", marginLeft: "auto", paddingLeft: 10, color: d.stClass === "ok" ? "#4a8c6f" : d.stClass === "p" ? "#ea8b43" : "var(--red)" }}>{d.st}</div>
                </div>
              ))}
            </div>

            {/* Country Card */}
            <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,.07)", overflow: "hidden", position: "relative" }}>
              <div style={{ content: "", position: "absolute", top: 0, left: 0, right: 0, height: 70, background: "radial-gradient(ellipse at 20% 0%,rgba(46,204,113,.11) 0%,rgba(255,255,255,0) 75%)", pointerEvents: "none" }} />
              <div style={{ padding: "16px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                <div>
                  <div style={{ fontFamily: "var(--fh)", fontSize: 15, fontWeight: 700, color: "var(--txt)", display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div className="animate-pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                    Ghana
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--txt3)" }}>Origin · ECOWAS / WAEMU</div>
                </div>
                <div style={{ width: 58, height: 40, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "0 3px 10px rgba(0,0,0,.15)" }}>
                  <div style={{ flex: 1, background: "#CE1126" }} />
                  <div style={{ flex: 1, background: "#FCD116", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 12, height: 12, background: "#000", clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)" }} />
                  </div>
                  <div style={{ flex: 1, background: "#006B3F" }} />
                </div>
              </div>
              <div style={{ padding: "0 20px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  { lbl: "📊 ESG Score", val: "65 / 100", cls: "a" },
                  { lbl: "⏱ Customs Delay", val: "3.5 days avg", cls: "a" },
                  { lbl: "🏛 Phyto Authority", val: "PPRSD", cls: "g" },
                  { lbl: "📜 CoO Body", val: "Ghana Nat. Chamber of Commerce", cls: "sm" },
                  { lbl: "🍫 Cocoa Council", val: "COCOBOD", cls: "g" },
                ].map(s => (
                  <div key={s.lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--txt2)", display: "flex", alignItems: "center", gap: 7 }}>{s.lbl}</span>
                    <span style={{ fontWeight: s.cls === "sm" ? 400 : 600, color: s.cls === "g" ? "#4a8c6f" : s.cls === "a" ? "#ea8b43" : "var(--txt2)", fontSize: s.cls === "sm" ? 11.5 : undefined }}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Status */}
            <div className="dash-wp">
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)" }}>Compliance Status</div>
                <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }}>View All ›</span>
              </div>
              <div style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 9 }}>
                  <div><span style={{ fontFamily: "var(--fh)", fontSize: 24, fontWeight: 700, color: "var(--txt)", letterSpacing: "0" }}>78%</span><span style={{ fontSize: 11.5, color: "var(--txt3)", marginLeft: 5 }}>Verified · 8 of 10</span></div>
                  <span style={{ fontSize: 11.5, color: "var(--txt3)" }}>8/10</span>
                </div>
                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 20, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ height: "100%", borderRadius: 20, background: "linear-gradient(90deg,var(--green),var(--teal))", width: "78%" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                  {[
                    { ic: "📁", lbl: "Documents", cnt: "7 of 10", cls: "r" },
                    { ic: "🛡️", lbl: "Risks", cnt: "3 flagged", cls: "a" },
                    { ic: "🚩", lbl: "Sanctions", cnt: "Pending", cls: "a" },
                  ].map(c => (
                    <div key={c.lbl} style={{ background: "#f7f7f7", borderRadius: 10, padding: "10px 7px", textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 17, marginBottom: 3 }}>{c.ic}</div>
                      <div style={{ fontSize: 10.5, color: "var(--txt2)", fontWeight: 500, lineHeight: 1.3 }}>{c.lbl}</div>
                      <div style={{ fontSize: 10.5, marginTop: 2, fontWeight: 600, color: c.cls === "r" ? "var(--red)" : c.cls === "a" ? "#ea8b43" : "#4a8c6f" }}>{c.cnt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="dash-wp">
              <div style={{ padding: "14px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "var(--fh)", fontSize: 13.5, fontWeight: 700, color: "var(--txt)" }}>Recent Activity</div>
                <span style={{ fontSize: 12, color: "var(--txt3)", cursor: "pointer" }}>View ›</span>
              </div>
              <div style={{ height: 1, background: "#f5f5f5" }} />
              {[
                { av: "F", avBg: "rgba(46,204,113,.12)", avColor: "#4a8c6f", txt: <><strong>Fatra</strong> ran compliance lookup · Recent trade</>, time: "2 hours ago" },
                { av: "F", avBg: "rgba(245,158,11,.12)", avColor: "#ea8b43", txt: <><strong>Fatra</strong> submitted LC check</>, time: "4 hours ago" },
                { av: "AI", avBg: "rgba(20,184,166,.12)", avColor: "#0d9488", txt: <><strong>AI</strong> flagged EUDR gap</>, time: "1 day ago", fontSize: 9 },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 20px" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: a.fontSize || 10, fontWeight: 700, flexShrink: 0, marginTop: 1, background: a.avBg, color: a.avColor }}>{a.av}</div>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--txt)", lineHeight: 1.4 }}>
                    {a.txt}
                    <div style={{ fontSize: 10.5, color: "var(--txt3)", marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
