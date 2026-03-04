import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import { TradeCorridorsMap } from "@/components/TradeCorridorsMap";
import type { Corridor } from "@/components/TradeCorridorsMap";
import { Plus } from "lucide-react";

/* ─── Types ─── */

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

type FilterTab = "all" | "active" | "issues" | "closed";

/* ─── Helpers ─── */

function getStatusBadge(trade: EnrichedTrade): { label: string; cls: string } {
  const status = trade.tradeStatus || "active";
  if (status === "closed" || status === "archived")
    return { label: "Closed", cls: "off" };
  if (trade.readinessScore !== null && trade.readinessScore >= 80 && trade.docsReceivedCount >= trade.docsRequiredCount && trade.docsRequiredCount > 0)
    return { label: "Complete", cls: "ok" };
  if (trade.readinessVerdict === "RED")
    return { label: "Issues", cls: "e" };
  if (!trade.lcVerdict && trade.docsReceivedCount === 0)
    return { label: "Waiting", cls: "w" };
  return { label: "Active", cls: "ok" };
}

function getComplianceClass(score: number | null): string {
  if (score == null) return "";
  if (score >= 80) return "g";
  if (score >= 50) return "a";
  return "r";
}

function formatValue(v: string | null, currency: string | null): string {
  if (!v) return "—";
  const n = Number(v);
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function getEudrBadge(band: string | null): { label: string; cls: string } {
  if (!band) return { label: "—", cls: "" };
  if (band === "negligible" || band === "low") return { label: "Low", cls: "ok" };
  if (band === "medium") return { label: "Med", cls: "w" };
  if (band === "high") return { label: "High", cls: "e" };
  return { label: band, cls: "" };
}

/* ─── Inline CSS (matches design mock) ─── */
const css = `
.mt-page { display:flex;flex-direction:column;padding:24px 30px 24px 20px;gap:12px;height:100%;overflow:hidden }
.mt-hdr { display:flex;align-items:center;justify-content:space-between;flex-shrink:0 }
.mt-hdr h1 { font-family:var(--fd);font-size:28px;font-weight:600;color:var(--t1);margin:0 }
.mt-hdr .sub { font-size:15px;color:var(--t3);margin-top:1px }
.mt-hdr-r { display:flex;align-items:center;gap:8px }
.mt-srch { background:#fff;border:none;border-radius:12px;padding:8px 16px;font-family:var(--fb);font-size:14px;color:var(--t2);box-shadow:var(--shd);width:170px;outline:none }
.mt-hbtn { width:36px;height:36px;border-radius:50%;border:none;background:#fff;box-shadow:var(--shd);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;color:var(--t2) }
.mt-ntb { padding:8px 18px;border-radius:20px;border:none;background:var(--sage);color:#fff;font-family:var(--fb);font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(74,124,94,.25);display:flex;align-items:center;gap:5px }

/* Stats */
.mt-stats { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;flex-shrink:0 }
.mt-st { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;animation:mt-fu .3s ease both }
.mt-st .sl { font-size:14px;color:var(--t3);margin-bottom:1px }
.mt-st .sv { font-family:var(--fd);font-size:22px;font-weight:600;color:var(--t1) }
.mt-st-bars { display:flex;align-items:flex-end;gap:2px;height:24px }
.mt-st-bars span { width:3px;border-radius:1px;background:var(--sage) }
.mt-st.ac { background:var(--sage) }
.mt-st.ac .sl { color:rgba(255,255,255,.5) }
.mt-st.ac .sv { color:#fff }

/* Mid grid */
.mt-mid { flex:1;display:grid;grid-template-columns:60fr 40fr;gap:10px;min-height:0 }

/* Trades card (left) */
.mt-tc { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:16px 20px;display:flex;flex-direction:column;min-height:0;animation:mt-fu .3s ease both }
.mt-tc .th { display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-shrink:0 }
.mt-tc h3 { font-family:var(--fd);font-size:18px;font-weight:600;color:var(--t1);margin:0 }
.mt-tc .tsub { font-size:14px;color:var(--t3);margin-bottom:10px;flex-shrink:0 }
.mt-tc .tsub b { color:var(--sage);font-weight:600 }

/* Filter pills */
.mt-pls { display:flex;gap:3px }
.mt-pl { padding:5px 12px;border-radius:12px;font-size:14px;font-weight:600;border:none;cursor:pointer;font-family:var(--fb);background:rgba(0,0,0,.03);color:var(--t3) }
.mt-pl.on { background:var(--sage);color:#fff }

/* Trades list */
.mt-tb { flex:1;overflow-y:auto;min-height:0 }
.mt-tb::-webkit-scrollbar { width:2px }
.mt-tb::-webkit-scrollbar-thumb { background:rgba(0,0,0,.06);border-radius:2px }

/* Trade row */
.mt-rw { display:flex;align-items:center;gap:10px;padding:9px 4px;cursor:pointer;border-radius:8px;transition:background .1s;text-decoration:none }
.mt-rw:hover { background:rgba(0,0,0,.015) }
.mt-rw+.mt-rw { border-top:1px solid rgba(0,0,0,.03) }
.mt-rw .fl { font-size:17px;display:flex;gap:1px;min-width:42px }
.mt-rw .inf { flex:1;min-width:0 }
.mt-rw .nm { font-size:15px;font-weight:600;color:var(--t1) }
.mt-rw .rt { font-size:14px;color:var(--t3) }
.mt-rw .vl { font-size:14px;color:var(--t2);min-width:62px;text-align:right }
.mt-rw .dc { font-size:14px;color:var(--t3);min-width:26px;text-align:center }
.mt-rw .pc { font-size:14px;font-weight:700;min-width:32px;text-align:right }
.mt-rw .pc.g { color:var(--sage) }
.mt-rw .pc.a { color:var(--amber) }
.mt-rw .pc.r { color:var(--red) }
.mt-rw .bg { padding:3px 8px;border-radius:5px;font-size:13px;font-weight:600;min-width:48px;text-align:center }
.mt-rw .bg.ok { background:var(--sage-xs);color:var(--sage) }
.mt-rw .bg.w { background:var(--amber-xs);color:var(--amber) }
.mt-rw .bg.e { background:var(--red-xs);color:var(--red) }
.mt-rw .bg.off { background:rgba(0,0,0,.03);color:var(--t4) }
.mt-rw .arr { color:var(--t4);font-size:13px }
.mt-rw:hover .arr { color:var(--sage) }
.mt-rw.closed { opacity:.4 }

/* Right column */
.mt-right { display:flex;flex-direction:column;gap:10px;min-height:0 }

/* Analytics */
.mt-an { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:14px 16px;display:flex;flex-direction:column;min-height:0;flex:1.5;overflow-y:auto;animation:mt-fu .3s ease both }
.mt-an::-webkit-scrollbar { width:2px }
.mt-an::-webkit-scrollbar-thumb { background:rgba(0,0,0,.05) }
.mt-an h3 { font-family:var(--fd);font-size:16px;font-weight:600;margin:0 0 10px;flex-shrink:0;color:var(--t1) }
.mt-an-split { flex:1;display:flex;flex-direction:column;gap:8px;min-height:0 }
.mt-acr { display:flex;align-items:center;gap:8px;margin-bottom:3px }
.mt-acr .cfl { font-size:14px }
.mt-acr .ci { flex:1 }
.mt-acr .cn { font-size:15px;font-weight:600;color:var(--t1) }
.mt-acr .cs { font-size:13px;color:var(--t3) }
.mt-acr .cv { font-size:15px;font-weight:700;color:var(--t1) }
.mt-bar { height:5px;background:rgba(0,0,0,.03);border-radius:3px;overflow:hidden;margin-bottom:10px }
.mt-bar div { height:100%;border-radius:3px }

/* Pie area */
.mt-pie-area { flex:1;display:flex;align-items:center;gap:12px;min-height:0;padding-top:4px;border-top:1px solid rgba(0,0,0,.04) }
.mt-pie { width:100px;height:100px;flex-shrink:0 }
.mt-pie-leg { display:flex;flex-direction:column;gap:4px }
.mt-apl { display:flex;align-items:center;gap:5px;font-size:13px;color:var(--t2);font-weight:500 }
.mt-apl span { width:6px;height:6px;border-radius:2px;flex-shrink:0 }

/* Demurrage */
.mt-dem { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:14px 16px;display:flex;flex-direction:column;flex:1;min-height:0;animation:mt-fu .3s ease both }
.mt-dem h3 { font-family:var(--fd);font-size:16px;font-weight:600;margin:0 0 10px;flex-shrink:0;color:var(--t1) }
.mt-dem-body { flex:1;display:flex;gap:10px;min-height:0 }
.mt-dem-chart { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center }
.mt-dem-ring { width:90px;height:90px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative }
.mt-dem-ring::after { content:'';position:absolute;inset:14px;border-radius:50%;background:#fff }
.mt-dem-ring span { position:relative;z-index:1;font-family:var(--fd);font-size:18px;font-weight:700;color:var(--t1) }
.mt-dem-label { font-size:14px;color:var(--t3);margin-top:6px;text-align:center }
.mt-dem-list { flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px }
.mt-dem-row { display:flex;align-items:center;gap:6px }
.mt-dem-dot { width:8px;height:8px;border-radius:2px;flex-shrink:0 }
.mt-dem-row .di { flex:1 }
.mt-dem-row .dn { font-size:14px;font-weight:600;color:var(--t1) }
.mt-dem-row .dd { font-size:13px;color:var(--t3) }
.mt-dem-row .dv { font-size:14px;font-weight:700 }
.mt-dem-total { display:flex;align-items:center;justify-content:space-between;padding-top:6px;margin-top:auto;border-top:1px solid rgba(0,0,0,.04) }
.mt-dem-total .dtl { font-size:14px;color:var(--t3) }
.mt-dem-total .dtv { font-family:var(--fd);font-size:18px;font-weight:700;color:var(--red) }

/* Bottom row */
.mt-bot { display:grid;grid-template-columns:3fr 3fr 5fr;gap:10px;flex-shrink:0;height:260px }
.mt-eudr { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:12px 14px;display:flex;flex-direction:column;overflow:hidden;animation:mt-fu .3s ease both }
.mt-eudr h4 { font-family:var(--fd);font-size:16px;font-weight:600;color:var(--sage);margin:0 0 4px }
.mt-eudr .es { font-size:14px;color:var(--t3);margin-bottom:6px }
.mt-eb { flex:1;overflow-y:auto }
.mt-eb::-webkit-scrollbar { width:2px }
.mt-eb::-webkit-scrollbar-thumb { background:rgba(0,0,0,.04) }
.mt-er { display:flex;align-items:center;gap:6px;padding:5px 0 }
.mt-er+.mt-er { border-top:1px solid rgba(0,0,0,.03) }
.mt-er .dot { width:5px;height:5px;border-radius:50%;flex-shrink:0 }
.mt-er .ei { flex:1 }
.mt-er .en { font-size:11px;font-weight:600;color:var(--t1) }
.mt-er .et { font-size:12px;color:var(--t3) }
.mt-er .eg { padding:3px 7px;border-radius:3px;font-size:12px;font-weight:600 }

.mt-cbam { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:12px 14px;display:flex;flex-direction:column;overflow:hidden;animation:mt-fu .3s ease both }
.mt-cbam h4 { font-family:var(--fd);font-size:16px;font-weight:600;color:var(--amber);margin:0 0 6px }
.mt-cbr { display:flex;align-items:center;justify-content:space-between;padding:5px 0 }
.mt-cbr+.mt-cbr { border-top:1px solid rgba(0,0,0,.03) }
.mt-cbr .cc { display:flex;align-items:center;gap:5px }
.mt-cbr .cc em { font-style:normal;font-size:13px }
.mt-cbr .cc span { font-size:13px;font-weight:600;color:var(--t1) }
.mt-cbr .cx { font-size:13px;font-weight:600;color:var(--sage) }

.mt-mp { background:#1b2a22;border-radius:var(--r);box-shadow:var(--shd);position:relative;overflow:hidden;display:flex;flex-direction:column;animation:mt-fu .3s ease both }
.mt-mp h4 { font-family:var(--fd);font-size:16px;color:#fff;font-weight:600;padding:10px 14px 0;position:relative;z-index:2;flex-shrink:0;margin:0 }
.mt-mp .ms { font-size:13px;color:rgba(255,255,255,.4);padding:2px 14px;position:relative;z-index:2;flex-shrink:0 }
.mt-mp-inner { flex:1;position:relative;min-height:0 }
.mt-ml { display:flex;gap:8px;padding:4px 14px 6px;position:relative;z-index:2;flex-shrink:0 }
.mt-mll { display:flex;align-items:center;gap:4px;font-size:12px;color:rgba(255,255,255,.4);font-weight:500 }
.mt-mll span { width:6px;height:6px;border-radius:50% }

/* Empty state */
.mt-empty { text-align:center;padding:60px 20px }
.mt-empty h3 { font-family:var(--fd);font-size:20px;font-weight:600;color:var(--t1);margin:0 0 8px }
.mt-empty p { font-size:14px;color:var(--t3);margin:0 0 20px;line-height:1.6 }

@keyframes mt-fu { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

@media (max-width: 768px) {
  .mt-page { padding:16px 12px 16px 12px;overflow:auto;height:auto }
  .mt-hdr { flex-direction:column;align-items:flex-start;gap:8px }
  .mt-hdr-r { width:100%;flex-wrap:wrap }
  .mt-srch { flex:1;width:auto;min-width:120px }
  .mt-stats { grid-template-columns:1fr 1fr;gap:8px }
  .mt-mid { grid-template-columns:1fr;height:auto }
  .mt-tc { max-height:none }
  .mt-right { gap:10px }
  .mt-bot { grid-template-columns:1fr;height:auto }
  .mt-bot > * { min-height:180px }
  .mt-pie-area { flex-direction:column;align-items:center }
  .mt-dem-body { flex-direction:column }
  .mt-rw .vl,.mt-rw .dc,.mt-rw .pc,.mt-rw .bg,.mt-rw .arr { display:none }
}
`;

/* ─── Main Component ─── */

export default function Trades() {
  usePageTitle("My Trades");
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const urlFilter = params.get("filter");
    if (urlFilter && ["all", "active", "issues", "closed"].includes(urlFilter)) {
      setFilter(urlFilter as FilterTab);
    }
  }, []);

  const statsQuery = useQuery<MyTradesStats>({ queryKey: ["/api/trades/dashboard-stats"] });
  const tradesQuery = useQuery<EnrichedTrade[]>({ queryKey: ["/api/trades"] });
  const corridorsQuery = useQuery<Corridor[]>({ queryKey: ["/api/trades/corridors"] });
  const tokenQuery = useTokenBalance();

  const stats = statsQuery.data ?? { activeShipments: 0, activeShipmentValue: 0, pendingDocuments: 0, avgCompliance: 0 };
  const allTrades = tradesQuery.data ?? [];
  const corridors = corridorsQuery.data ?? [];
  const balance = tokenQuery.data?.balance ?? 0;

  const filtered = useMemo(() => {
    let list = allTrades;
    if (filter === "active") list = list.filter(t => {
      const s = t.tradeStatus || "active";
      return s !== "closed" && s !== "archived" && t.readinessVerdict !== "RED";
    });
    if (filter === "issues") list = list.filter(t => t.readinessVerdict === "RED");
    if (filter === "closed") list = list.filter(t => t.tradeStatus === "closed" || t.tradeStatus === "archived");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.commodityName.toLowerCase().includes(q) ||
        t.originName.toLowerCase().includes(q) ||
        t.destName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTrades, filter, search]);

  const eudrTrades = useMemo(() =>
    allTrades.filter(t => t.eudrApplicable === true && t.tradeStatus !== "closed" && t.tradeStatus !== "archived"),
  [allTrades]);

  const cbamTrades = useMemo(() =>
    allTrades.filter(t => t.cbamApplicable === true && t.tradeStatus !== "closed" && t.tradeStatus !== "archived"),
  [allTrades]);

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: allTrades.length },
    { key: "active", label: "Active", count: allTrades.filter(t => (t.tradeStatus || "active") !== "closed" && (t.tradeStatus || "active") !== "archived").length },
    { key: "issues", label: "Issues", count: allTrades.filter(t => t.readinessVerdict === "RED").length },
    { key: "closed", label: "Closed", count: allTrades.filter(t => t.tradeStatus === "closed" || t.tradeStatus === "archived").length },
  ];

  /* Compute analytics data from real trades */
  const corridorAnalytics = useMemo(() => {
    const map = new Map<string, { flags: string; label: string; count: number; value: number }>();
    allTrades.forEach(t => {
      if (t.tradeStatus === "closed" || t.tradeStatus === "archived") return;
      const key = `${t.originIso2}-${t.destIso2}`;
      const existing = map.get(key);
      const val = t.tradeValue ? Number(t.tradeValue) : 0;
      if (existing) {
        existing.count++;
        existing.value += val;
      } else {
        map.set(key, {
          flags: `${iso2ToFlag(t.originIso2)}${iso2ToFlag(t.destIso2)}`,
          label: `${t.originName} → ${t.destName}`,
          count: 1,
          value: val,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 4);
  }, [allTrades]);

  const totalValue = stats.activeShipmentValue || corridorAnalytics.reduce((s, c) => s + c.value, 0);
  const maxCorridorValue = Math.max(...corridorAnalytics.map(c => c.value), 1);
  const pieColors = ["var(--sage-l)", "var(--amber)", "#5aa07a", "#8ecaad"];

  return (
    <AppShell>
      <style>{css}</style>
      <div className="mt-page">
        {/* ── Header ── */}
        <div className="mt-hdr">
          <div>
            <h1 data-testid="text-trades-title">My Trades</h1>
            <div className="sub" data-testid="text-trades-subtitle">
              Active shipment value: ${totalValue.toLocaleString()} across {corridors.length || corridorAnalytics.length} corridor{(corridors.length || corridorAnalytics.length) !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="mt-hdr-r">
            <input
              className="mt-srch"
              placeholder="Search trades..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-trades"
            />
            <button className="mt-hbtn">🔔</button>
            <button className="mt-ntb" onClick={() => navigate("/lookup")} data-testid="button-new-trade">
              <Plus size={12} /> New Trade
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="mt-stats" data-testid="stat-cards">
          <div className="mt-st">
            <div>
              <div className="sl">Active Shipments</div>
              <div className="sv">{stats.activeShipments}</div>
            </div>
            <div className="mt-st-bars">
              {[35, 60, 50, 75, 100, 65, 85].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-st ac">
            <div>
              <div className="sl">Pending Docs</div>
              <div className="sv">{stats.pendingDocuments}</div>
            </div>
            <div style={{ fontSize: 16 }}>📄</div>
          </div>
          <div className="mt-st">
            <div>
              <div className="sl">Total Value</div>
              <div className="sv">${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}k` : totalValue.toLocaleString()}</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20">
              <path d="M0,16 Q7,11 14,13 Q22,15 32,6 Q40,1 48,4" fill="none" stroke="var(--sage-l)" strokeWidth="1.5" opacity=".5" />
            </svg>
          </div>
          <div className="mt-st ac">
            <div>
              <div className="sl">Shield Balance</div>
              <div className="sv">{balance} check{balance !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ fontSize: 16 }}>🛡</div>
          </div>
        </div>

        {/* ── Mid Section ── */}
        <div className="mt-mid">
          {/* LEFT: Trades Card */}
          <div className="mt-tc">
            <div className="th">
              <h3>Trades</h3>
              <div className="mt-pls" data-testid="filter-bar">
                {filters.map(f => (
                  <button
                    key={f.key}
                    className={`mt-pl${filter === f.key ? " on" : ""}`}
                    onClick={() => setFilter(f.key)}
                    data-testid={`filter-${f.key}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="tsub">
              Total: <b>${totalValue.toLocaleString()}</b> · {allTrades.filter(t => (t.tradeStatus || "active") !== "closed").length} shipments
            </div>

            <div className="mt-tb">
              {tradesQuery.isLoading ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>Loading trades...</div>
              ) : filtered.length === 0 && allTrades.length === 0 ? (
                <div className="mt-empty">
                  <h3>No trades yet</h3>
                  <p>Run your first compliance check to create a trade.</p>
                  <Link href="/lookup">
                    <button className="mt-ntb" data-testid="button-empty-new-lookup">
                      <Plus size={12} /> Start a new compliance check
                    </button>
                  </Link>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--t3)", fontSize: 13 }}>No trades match your filter.</div>
              ) : (
                filtered.map(trade => {
                  const status = getStatusBadge(trade);
                  const isClosed = trade.tradeStatus === "closed" || trade.tradeStatus === "archived";
                  return (
                    <div
                      key={trade.id}
                      className={`mt-rw${isClosed ? " closed" : ""}`}
                      onClick={() => navigate(`/trades/${trade.id}`)}
                      data-testid={`trade-row-${trade.id}`}
                    >
                      <div className="fl">{iso2ToFlag(trade.originIso2)}{iso2ToFlag(trade.destIso2)}</div>
                      <div className="inf">
                        <div className="nm">{trade.commodityName}</div>
                        <div className="rt">{trade.originName} → {trade.destName}</div>
                      </div>
                      <div className="vl">{formatValue(trade.tradeValue, trade.tradeValueCurrency)}</div>
                      <div className="dc">{trade.docsRequiredCount > 0 ? `${trade.docsReceivedCount}/${trade.docsRequiredCount}` : "—"}</div>
                      <div className={`pc ${getComplianceClass(trade.readinessScore)}`}>
                        {trade.readinessScore != null ? `${trade.readinessScore}%` : "—"}
                      </div>
                      <div className={`bg ${status.cls}`}>{status.label}</div>
                      <span className="arr">›</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Analytics + Demurrage */}
          <div className="mt-right">
            {/* Trade Analytics */}
            <div className="mt-an">
              <h3>Trade Analytics</h3>
              <div className="mt-an-split">
                <div>
                  {corridorAnalytics.length === 0 ? (
                    <div style={{ fontSize: 13, color: "var(--t3)", padding: "16px 0" }}>No corridor data yet</div>
                  ) : (
                    corridorAnalytics.map((c, i) => (
                      <div key={i}>
                        <div className="mt-acr">
                          <div className="cfl">{c.flags}</div>
                          <div className="ci">
                            <div className="cn">{c.label}</div>
                            <div className="cs">{c.count} shipment{c.count !== 1 ? "s" : ""}</div>
                          </div>
                          <div className="cv">${c.value >= 1000 ? `${(c.value / 1000).toFixed(0)}k` : c.value}</div>
                        </div>
                        <div className="mt-bar">
                          <div style={{ width: `${(c.value / maxCorridorValue) * 100}%`, background: pieColors[i % pieColors.length] }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {corridorAnalytics.length > 0 && (
                  <div className="mt-pie-area">
                    <svg viewBox="0 0 120 120" className="mt-pie">
                      {(() => {
                        const useCount = corridorAnalytics.every(c => c.value === 0);
                        const metric = (c: typeof corridorAnalytics[0]) => useCount ? c.count : c.value;
                        const total = corridorAnalytics.reduce((s, c) => s + metric(c), 0) || 1;
                        let startAngle = -90;
                        return corridorAnalytics.map((c, i) => {
                          const angle = (metric(c) / total) * 360;
                          const endAngle = startAngle + angle;
                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          const x1 = 60 + 50 * Math.cos(startRad);
                          const y1 = 60 + 50 * Math.sin(startRad);
                          const x2 = 60 + 50 * Math.cos(endRad);
                          const y2 = 60 + 50 * Math.sin(endRad);
                          const largeArc = angle > 180 ? 1 : 0;
                          const d = `M60,60 L${x1.toFixed(1)},${y1.toFixed(1)} A50,50 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
                          startAngle = endAngle;
                          return <path key={i} d={d} fill={pieColors[i % pieColors.length]} />;
                        });
                      })()}
                    </svg>
                    <div className="mt-pie-leg">
                      {corridorAnalytics.map((c, i) => {
                        const useCount = corridorAnalytics.every(cc => cc.value === 0);
                        const metric = (cc: typeof corridorAnalytics[0]) => useCount ? cc.count : cc.value;
                        const total = corridorAnalytics.reduce((s, cc) => s + metric(cc), 0) || 1;
                        const pct = Math.round((metric(c) / total) * 100);
                        return (
                          <div key={i} className="mt-apl">
                            <span style={{ background: pieColors[i % pieColors.length] }} />
                            {c.label.split(" → ")[0]} {pct}%
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Demurrage Estimate (placeholder — uses mock data structure) */}
            <div className="mt-dem">
              <h3>Demurrage Estimate</h3>
              <div className="mt-dem-body">
                {(() => {
                  const tradesWithValue = allTrades.filter(t =>
                    t.tradeValue && Number(t.tradeValue) > 0 &&
                    t.tradeStatus !== "closed" && t.tradeStatus !== "archived"
                  );
                  if (tradesWithValue.length === 0) {
                    return (
                      <>
                        <div className="mt-dem-chart">
                          <div className="mt-dem-ring" style={{ background: "conic-gradient(rgba(0,0,0,.04) 0deg 360deg)" }}>
                            <span>—</span>
                          </div>
                          <div className="mt-dem-label">Total exposure</div>
                        </div>
                        <div className="mt-dem-list">
                          <div style={{ fontSize: 14, color: "var(--t3)", padding: "16px 0" }}>
                            Add shipment values to see demurrage estimates
                          </div>
                        </div>
                      </>
                    );
                  }
                  const demColors = ["var(--sage-l)", "var(--amber)", "var(--red)", "#8ecaad"];
                  const demData = tradesWithValue.slice(0, 4).map(t => {
                    const tv = Number(t.tradeValue);
                    return { name: t.commodityName.split(" ")[0], origin: t.originIso2, est: Math.round(tv * 0.03), tv };
                  });
                  const totalDem = demData.reduce((s, d) => s + d.est, 0);
                  let ang = 0;
                  const grad = demData.map((d, i) => {
                    const deg = (d.est / (totalDem || 1)) * 360;
                    const start = ang;
                    ang += deg;
                    return `${demColors[i % demColors.length]} ${start.toFixed(1)}deg ${ang.toFixed(1)}deg`;
                  }).join(", ");
                  return (
                    <>
                      <div className="mt-dem-chart">
                        <div className="mt-dem-ring" style={{ background: `conic-gradient(${grad})` }}>
                          <span>${totalDem >= 1000 ? `${(totalDem / 1000).toFixed(1)}k` : totalDem}</span>
                        </div>
                        <div className="mt-dem-label">Est. exposure</div>
                      </div>
                      <div className="mt-dem-list">
                        {demData.map((d, i) => (
                          <div key={i} className="mt-dem-row">
                            <div className="mt-dem-dot" style={{ background: demColors[i % demColors.length] }} />
                            <div className="di">
                              <div className="dn">{iso2ToFlag(d.origin)} {d.name}</div>
                              <div className="dd">~3% of ${d.tv >= 1000 ? `${(d.tv / 1000).toFixed(0)}k` : d.tv}</div>
                            </div>
                            <div className="dv" style={{ color: d.est > 1000 ? "var(--red)" : "var(--amber)" }}>
                              ${d.est.toLocaleString()}
                            </div>
                          </div>
                        ))}
                        <div className="mt-dem-total">
                          <div className="dtl">Total est.</div>
                          <div className="dtv">${totalDem.toLocaleString()}</div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="mt-bot">
          {/* EUDR Intelligence */}
          <div className="mt-eudr">
            <h4>🌿 EUDR Intelligence</h4>
            <div className="es">Deforestation regulation</div>
            <div className="mt-eb">
              {eudrTrades.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--t3)", padding: "10px 0" }}>No EUDR-applicable trades</div>
              ) : (
                eudrTrades.slice(0, 5).map(t => {
                  const badge = getEudrBadge(t.eudrBand);
                  const dotColor = badge.cls === "e" ? "var(--red)" : badge.cls === "w" ? "var(--amber)" : "var(--sage-l)";
                  const egBg = badge.cls === "e" ? "var(--red-xs)" : badge.cls === "w" ? "var(--amber-xs)" : "var(--sage-xs)";
                  const egColor = badge.cls === "e" ? "var(--red)" : badge.cls === "w" ? "var(--amber)" : "var(--sage)";
                  return (
                    <div key={t.id} className="mt-er" onClick={() => navigate(`/trades/${t.id}#eudr`)} style={{ cursor: "pointer" }}>
                      <div className="dot" style={{ background: dotColor }} />
                      <div className="ei">
                        <div className="en">{iso2ToFlag(t.originIso2)} {t.commodityName.split(" ")[0]}</div>
                        <div className="et">{t.eudrBand ? `Risk: ${t.eudrBand}` : "Not assessed"}</div>
                      </div>
                      <div className="eg" style={{ background: egBg, color: egColor }}>{badge.label}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CBAM Tariff */}
          <div className="mt-cbam">
            <h4>⚠️ CBAM Tariff</h4>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {cbamTrades.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--t3)", padding: "10px 0" }}>No CBAM-applicable trades</div>
              ) : (
                cbamTrades.slice(0, 5).map(t => (
                  <div key={t.id} className="mt-cbr" onClick={() => navigate(`/trades/${t.id}#cbam`)} style={{ cursor: "pointer" }}>
                    <div className="cc">
                      <em>{iso2ToFlag(t.originIso2)}</em>
                      <span>{t.commodityName.split(" ")[0]} {t.originIso2}→{t.destIso2}</span>
                    </div>
                    <div className="cx">{t.cbamScore != null ? `${t.cbamScore}%` : "0%"}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trade Corridors Map */}
          <div className="mt-mp">
            <h4>Trade Corridors</h4>
            <div className="ms">{corridors.length || corridorAnalytics.length} active route{(corridors.length || corridorAnalytics.length) !== 1 ? "s" : ""}</div>
            <div className="mt-mp-inner">
              {corridors.length > 0 ? (
                <TradeCorridorsMap corridors={corridors} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.3 }}>
                  <span style={{ fontSize: 13, color: "#fff" }}>Map appears with trade data</span>
                </div>
              )}
            </div>
            <div className="mt-ml">
              <div className="mt-mll"><span style={{ background: "var(--sage-l)" }} />Primary</div>
              <div className="mt-mll"><span style={{ background: "var(--amber)" }} />Secondary</div>
              <div className="mt-mll"><span style={{ background: "var(--red)" }} />At Risk</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
