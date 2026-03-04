import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { iso2ToFlag } from "@/components/CountryFlagBadge";

/* ─── Types (shared with trades.tsx) ─── */

type EnrichedTrade = {
  id: string;
  commodityName: string;
  hsCode: string;
  originIso2: string;
  originName: string;
  destIso2: string;
  destName: string;
  riskLevel: string;
  readinessScore: number | null;
  readinessVerdict: string | null;
  createdAt: string;
  tradeStatus: string | null;
  tradeValue: string | null;
  tradeValueCurrency: string | null;
  lcVerdict: string | null;
  lcCheckId: string | null;
  eudrApplicable: boolean | null;
  eudrScore: number | null;
  eudrBand: string | null;
  cbamApplicable: boolean | null;
  cbamScore: number | null;
  cbamBand: string | null;
  docsRequiredCount: number;
  docsReceivedCount: number;
};

type MyTradesStats = {
  activeShipments: number;
  activeShipmentValue: number;
  pendingDocuments: number;
  avgCompliance: number;
};

type FilterTab = "all" | "active" | "waiting" | "issues" | "closed";

/* ─── Helpers ─── */

function getStatusInfo(trade: EnrichedTrade): { label: string; cls: string } {
  const status = trade.tradeStatus || "active";
  if (status === "closed" || status === "archived")
    return { label: "Closed", cls: "closed" };
  if (
    trade.readinessScore !== null &&
    trade.readinessScore >= 80 &&
    trade.docsReceivedCount >= trade.docsRequiredCount &&
    trade.docsRequiredCount > 0
  )
    return { label: "Complete", cls: "complete" };
  if (trade.readinessVerdict === "RED")
    return { label: "Issues", cls: "issues" };
  if (!trade.lcVerdict && trade.docsReceivedCount === 0)
    return { label: "Waiting", cls: "waiting" };
  return { label: "Active", cls: "active" };
}

function complianceColor(score: number | null): string {
  if (score == null) return "var(--t3)";
  if (score >= 80) return "var(--sage)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function progressBarColor(score: number | null, statusCls: string): string {
  if (statusCls === "closed") return "var(--t4)";
  if (score == null) return "var(--t4)";
  if (score >= 80) return "var(--sage-l)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
}

function formatCurrency(v: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

/* ─── CSS ─── */
const css = `
/* Page layout */
.cm-page{display:flex;flex-direction:column;padding:24px 30px 24px 20px;gap:14px;height:100%;overflow-y:auto}
.cm-page::-webkit-scrollbar{width:4px}
.cm-page::-webkit-scrollbar-thumb{background:rgba(0,0,0,.08);border-radius:2px}

/* Header */
.cm-hdr{display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.cm-hdr h1{font-family:var(--fd);font-size:26px;font-weight:600;color:var(--t1);margin:0}
.cm-hdr .sub{font-size:12px;color:var(--t3);margin-top:2px}
.cm-hdr-r{display:flex;gap:8px}
.cm-btn{padding:9px 20px;border-radius:20px;border:none;font-family:var(--fb);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
.cm-btn.out{background:var(--card);color:var(--t1);box-shadow:var(--shd)}
.cm-btn.out:hover{background:#f5f3ef}
.cm-btn.pri{background:var(--sage);color:#fff;box-shadow:0 2px 8px rgba(74,124,94,.25)}
.cm-btn.pri:hover{background:var(--sage-hover)}

/* Hero banner */
.cm-hero{
  position:relative;
  border-radius:var(--r);
  overflow:hidden;
  min-height:260px;
  box-shadow:var(--shd);
  flex-shrink:0;
  background:linear-gradient(135deg,#1b2a22,#2d4a38);
}
.cm-hero-bg{
  position:absolute;inset:0;
  background:url('/african-landscape.jpg') center 40%/cover no-repeat;
  opacity:.35;
}
.cm-hero-grad{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.45))}
.cm-hero-text{position:absolute;bottom:20px;left:24px;z-index:2}
.cm-hero-text h2{font-family:var(--fd);font-size:20px;color:#fff;font-weight:500;margin:0}
.cm-hero-text p{font-size:12px;color:rgba(255,255,255,.55);margin-top:2px}

/* Portfolio card (frosted glass) */
.cm-port{
  position:absolute;bottom:16px;right:16px;z-index:3;
  background:rgba(255,255,255,.9);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border-radius:14px;padding:18px 22px;
  width:280px;
  box-shadow:0 4px 20px rgba(0,0,0,.12);
}
.cm-port .pl{font-size:10px;font-weight:600;letter-spacing:1px;color:var(--sage);margin-bottom:4px;text-transform:uppercase}
.cm-port .pv{font-family:var(--fd);font-size:30px;font-weight:700;line-height:1;color:var(--t1)}
.cm-port .ps{font-size:11px;color:var(--t3);margin:2px 0 12px}
.cm-port-row{display:flex;gap:14px;margin-bottom:10px}
.cm-port-st{flex:1}
.cm-port-st .stl{font-size:10px;font-weight:600;letter-spacing:.5px;color:var(--t3);margin-bottom:2px;text-transform:uppercase}
.cm-port-st .stv{font-size:14px;font-weight:700;color:var(--t1)}
.cm-port-st .sts{font-size:10px;color:var(--t3);margin-top:1px}
.cm-port-bar{height:5px;background:rgba(0,0,0,.06);border-radius:3px;overflow:hidden}
.cm-port-bar div{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--sage-l),var(--sage))}
.cm-port-leg{display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-top:3px}

/* Filter pills */
.cm-filters{display:flex;gap:6px;flex-shrink:0}
.cm-fp{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:600;border:none;cursor:pointer;font-family:var(--fb);background:var(--card);color:var(--t3);box-shadow:var(--shd);transition:all .15s}
.cm-fp:hover{background:#f5f3ef}
.cm-fp.on{background:var(--sage);color:#fff}
.cm-fp .cnt{font-weight:400;margin-left:2px;opacity:.7}

/* Trade cards grid */
.cm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-bottom:20px}
@media(max-width:900px){.cm-grid{grid-template-columns:1fr}}

/* Individual trade card */
.cm-tc{
  background:var(--card);
  border-radius:var(--r);
  box-shadow:var(--shd);
  padding:20px;
  display:flex;flex-direction:column;
  cursor:pointer;
  transition:transform .15s,box-shadow .15s;
  animation:cm-fu .3s ease both;
  text-decoration:none;color:inherit;
}
.cm-tc:hover{transform:translateY(-2px);box-shadow:var(--shd),0 8px 24px rgba(0,0,0,.06)}
.cm-tc.issue{box-shadow:var(--shd),inset 3px 0 0 var(--red)}
.cm-tc.issue:hover{box-shadow:var(--shd),inset 3px 0 0 var(--red),0 8px 24px rgba(0,0,0,.06)}
.cm-tc.closed-card{opacity:.5}

/* Card inner elements */
.cm-tc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.cm-tc-flags{font-size:22px;display:flex;gap:3px}
.cm-tc-badge{padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px}
.cm-tc-badge::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}
.cm-tc-badge.active{background:var(--sage-xs);color:var(--sage)}
.cm-tc-badge.issues{background:var(--red-xs);color:var(--red)}
.cm-tc-badge.waiting{background:var(--amber-xs);color:var(--amber)}
.cm-tc-badge.complete{background:var(--sage-xs);color:var(--sage)}
.cm-tc-badge.closed{background:rgba(0,0,0,.04);color:var(--t4)}
.cm-tc-alert{font-size:11px;color:var(--red);font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:4px}
.cm-tc-name{font-family:var(--fd);font-size:18px;font-weight:600;margin-bottom:2px;color:var(--t1)}
.cm-tc-route{font-size:12px;color:var(--t3);margin-bottom:14px}

/* Data grid inside card */
.cm-tc-data{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.cm-tc-d .dl{font-size:10px;font-weight:600;letter-spacing:.5px;color:var(--t3);text-transform:uppercase;margin-bottom:1px}
.cm-tc-d .dv{font-size:14px;font-weight:700;color:var(--t1)}

/* Progress bar */
.cm-tc-prog{height:4px;background:rgba(0,0,0,.04);border-radius:2px;overflow:hidden;margin-bottom:12px}
.cm-tc-prog div{height:100%;border-radius:2px}

/* Card footer */
.cm-tc-foot{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:var(--t3)}
.cm-tc-foot .open-link{color:var(--sage);font-weight:600;font-size:12px}

/* Empty state */
.cm-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  padding:60px 20px;text-align:center;
  background:var(--card);border-radius:var(--r);box-shadow:var(--shd);
  grid-column:1/-1;
}
.cm-empty h3{font-family:var(--fd);font-size:20px;margin-bottom:6px;color:var(--t1)}
.cm-empty p{font-size:13px;color:var(--t3);margin-bottom:16px}

/* Animation */
@keyframes cm-fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

/* ─── Component ─── */

export default function Commodities() {
  usePageTitle("Commodities");
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterTab>("all");

  /* ─── Data queries (same as trades.tsx) ─── */
  const { data: stats } = useQuery<MyTradesStats>({
    queryKey: ["/api/trades/dashboard-stats"],
  });

  const { data: trades = [] } = useQuery<EnrichedTrade[]>({
    queryKey: ["/api/trades"],
  });

  /* ─── Derived data ─── */
  const statusMap = useMemo(() => {
    const map = new Map<string, { label: string; cls: string }>();
    for (const t of trades) map.set(t.id, getStatusInfo(t));
    return map;
  }, [trades]);

  const counts = useMemo(() => {
    let active = 0,
      waiting = 0,
      issues = 0,
      closed = 0;
    for (const t of trades) {
      const s = statusMap.get(t.id);
      if (!s) continue;
      if (s.cls === "closed") closed++;
      else if (s.cls === "issues") issues++;
      else if (s.cls === "waiting") waiting++;
      else active++; // active + complete
    }
    return { all: trades.length, active, waiting, issues, closed };
  }, [trades, statusMap]);

  const filtered = useMemo(() => {
    if (filter === "all") return trades;
    return trades.filter((t) => {
      const s = statusMap.get(t.id);
      if (!s) return false;
      if (filter === "active") return s.cls === "active" || s.cls === "complete";
      if (filter === "waiting") return s.cls === "waiting";
      if (filter === "issues") return s.cls === "issues";
      if (filter === "closed") return s.cls === "closed";
      return true;
    });
  }, [trades, filter, statusMap]);

  /* Portfolio summary */
  const totalValue = useMemo(() => {
    return trades.reduce((sum, t) => sum + (t.tradeValue ? Number(t.tradeValue) : 0), 0);
  }, [trades]);

  const topCorridor = useMemo(() => {
    const corridorCounts = new Map<string, number>();
    for (const t of trades) {
      const key = `${t.originIso2}→${t.destIso2}`;
      corridorCounts.set(key, (corridorCounts.get(key) || 0) + 1);
    }
    let best = { key: "—", count: 0 };
    corridorCounts.forEach((count, key) => {
      if (count > best.count) best = { key, count };
    });
    if (best.key === "—") return { display: "—", count: 0 };
    const [orig, dest] = best.key.split("→");
    return {
      display: `${iso2ToFlag(orig)} → ${iso2ToFlag(dest)}`,
      count: best.count,
    };
  }, [trades]);

  const avgCompliance = stats?.avgCompliance ?? 0;

  const activeRoutes = useMemo(() => {
    const corridors = new Set<string>();
    for (const t of trades) {
      const s = statusMap.get(t.id);
      if (s && s.cls !== "closed") {
        corridors.add(`${t.originIso2}→${t.destIso2}`);
      }
    }
    return corridors.size;
  }, [trades, statusMap]);

  const progressWidth = useMemo(() => {
    if (trades.length === 0) return 0;
    return Math.round(((trades.length - counts.closed) / trades.length) * 100);
  }, [trades.length, counts.closed]);

  return (
    <AppShell>
      <style>{css}</style>
      <div className="cm-page">
        {/* Header */}
        <div className="cm-hdr">
          <div>
            <h1>Commodities</h1>
            <div className="sub">
              {trades.length} shipment{trades.length !== 1 ? "s" : ""} ·{" "}
              {formatCurrency(String(totalValue))} total value
            </div>
          </div>
          <div className="cm-hdr-r">
            <button className="cm-btn out">Export</button>
            <button
              className="cm-btn pri"
              onClick={() => navigate("/lookup")}
            >
              + New Trade
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="cm-hero">
          <div className="cm-hero-bg" />
          <div className="cm-hero-grad" />
          <div className="cm-hero-text">
            <h2>Trade Corridors</h2>
            <p>
              {activeRoutes} active route{activeRoutes !== 1 ? "s" : ""} across
              Africa
            </p>
          </div>
          <div className="cm-port">
            <div className="pl">PORTFOLIO OVERVIEW</div>
            <div className="pv">{formatCurrency(String(totalValue))}</div>
            <div className="ps">
              across {trades.length} shipment{trades.length !== 1 ? "s" : ""}
            </div>
            <div className="cm-port-row">
              <div className="cm-port-st">
                <div className="stl">TOP CORRIDOR</div>
                <div className="stv">{topCorridor.display}</div>
                <div className="sts">
                  {topCorridor.count} shipment{topCorridor.count !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="cm-port-st">
                <div className="stl">AVG COMPLIANCE</div>
                <div className="stv" style={{ color: "var(--sage)" }}>
                  {Math.round(avgCompliance)}%
                </div>
                <div className="sts">across active trades</div>
              </div>
            </div>
            <div className="cm-port-bar">
              <div style={{ width: `${progressWidth}%` }} />
            </div>
            <div className="cm-port-leg">
              <span>{counts.active} active</span>
              <span>{counts.waiting} waiting</span>
              <span>{counts.closed} closed</span>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="cm-filters">
          {(
            [
              ["all", counts.all],
              ["active", counts.active],
              ["waiting", counts.waiting],
              ["issues", counts.issues],
              ["closed", counts.closed],
            ] as [FilterTab, number][]
          ).map(([key, count]) => (
            <button
              key={key}
              className={`cm-fp${filter === key ? " on" : ""}`}
              onClick={() => setFilter(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
              <span className="cnt">{count}</span>
            </button>
          ))}
        </div>

        {/* Trade Cards Grid */}
        <div className="cm-grid">
          {filtered.length === 0 ? (
            <div className="cm-empty">
              <h3>No trades found</h3>
              <p>
                {filter === "all"
                  ? "Run your first compliance check to see it here."
                  : `No ${filter} trades at the moment.`}
              </p>
              <button
                className="cm-btn pri"
                onClick={() => navigate("/lookup")}
              >
                + New Trade
              </button>
            </div>
          ) : (
            filtered.map((trade, i) => {
              const status = statusMap.get(trade.id)!;
              const score = trade.readinessScore;
              const hasIssues = status.cls === "issues";
              const isClosed = status.cls === "closed";
              const issueCount =
                hasIssues
                  ? (trade.docsRequiredCount - trade.docsReceivedCount > 0 ? 1 : 0) +
                    (trade.readinessVerdict === "RED" ? 1 : 0)
                  : 0;

              return (
                <Link
                  key={trade.id}
                  href={`/trades/${trade.id}`}
                  className={`cm-tc${hasIssues ? " issue" : ""}${isClosed ? " closed-card" : ""}`}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  {/* Top: flags + badge */}
                  <div className="cm-tc-top">
                    <div className="cm-tc-flags">
                      {iso2ToFlag(trade.originIso2)}
                      {iso2ToFlag(trade.destIso2)}
                    </div>
                    <div className={`cm-tc-badge ${status.cls}`}>
                      {status.label}
                    </div>
                  </div>

                  {/* Alert row for issues */}
                  {hasIssues && issueCount > 0 && (
                    <div className="cm-tc-alert">
                      ⚠ {issueCount} issue{issueCount !== 1 ? "s" : ""} require
                      attention
                    </div>
                  )}

                  {/* Commodity name + route */}
                  <div className="cm-tc-name">{trade.commodityName}</div>
                  <div className="cm-tc-route">
                    {trade.originName} → {trade.destName}
                  </div>

                  {/* Data grid */}
                  <div className="cm-tc-data">
                    <div className="cm-tc-d">
                      <div className="dl">HS CODE</div>
                      <div className="dv">{trade.hsCode || "—"}</div>
                    </div>
                    <div className="cm-tc-d">
                      <div className="dl">VALUE</div>
                      <div className="dv">
                        {formatCurrency(trade.tradeValue)}
                      </div>
                    </div>
                    <div className="cm-tc-d">
                      <div className="dl">DOCUMENTS</div>
                      <div className="dv">
                        {trade.docsReceivedCount} of {trade.docsRequiredCount}
                      </div>
                    </div>
                    <div className="cm-tc-d">
                      <div className="dl">COMPLIANCE</div>
                      <div
                        className="dv"
                        style={{ color: complianceColor(score) }}
                      >
                        {score != null ? `${Math.round(score)}%` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="cm-tc-prog">
                    <div
                      style={{
                        width: `${score ?? 0}%`,
                        background: progressBarColor(score, status.cls),
                      }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="cm-tc-foot">
                    <span>
                      {isClosed ? "Closed" : "Updated"} {timeAgo(trade.createdAt)}
                    </span>
                    <span className="open-link">Open →</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
