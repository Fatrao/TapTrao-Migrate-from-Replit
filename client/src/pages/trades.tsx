import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import { TradeCorridorsMap } from "@/components/TradeCorridorsMap";
import type { Corridor } from "@/components/TradeCorridorsMap";
import { Search, ChevronRight, Plus, Leaf, Factory, FileText } from "lucide-react";

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

function getStatusBadge(trade: EnrichedTrade): { label: string; bg: string; color: string } {
  const status = trade.tradeStatus || "active";
  if (status === "closed" || status === "archived")
    return { label: "Closed", bg: "#f5f5f5", color: "#999" };
  if (trade.readinessScore !== null && trade.readinessScore >= 80 && trade.docsReceivedCount >= trade.docsRequiredCount && trade.docsRequiredCount > 0)
    return { label: "Complete", bg: "#f0fdf4", color: "#15803d" };
  if (trade.readinessVerdict === "RED")
    return { label: "Issues", bg: "#fef2f2", color: "#dc2626" };
  if (!trade.lcVerdict && trade.docsReceivedCount === 0)
    return { label: "New", bg: "#fefce8", color: "#d97706" };
  return { label: "Active", bg: "#eff6ff", color: "#2563eb" };
}

function getComplianceColor(score: number | null): string {
  if (score == null) return "#999";
  if (score >= 80) return "#15803d";
  if (score >= 50) return "#d97706";
  return "#dc2626";
}

function formatDate(d: string | Date) {
  const date = new Date(d);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  return `${day} ${month}`;
}

function getRegulatoryBadge(applicable: boolean | null, score: number | null, band: string | null): { label: string; bg: string; color: string } {
  if (applicable === false) return { label: "N/A", bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" };
  if (applicable == null) return { label: "—", bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" };
  if (score == null || !band) return { label: "Not assessed", bg: "rgba(37,99,235,0.1)", color: "#60a5fa" };
  if (band === "negligible") return { label: "Negligible", bg: "rgba(74,222,128,0.1)", color: "#4ade80" };
  if (band === "low") return { label: "Low", bg: "rgba(234,179,8,0.1)", color: "#eab308" };
  if (band === "medium") return { label: "Medium", bg: "rgba(249,115,22,0.15)", color: "#f97316" };
  if (band === "high") return { label: "High", bg: "rgba(239,68,68,0.12)", color: "#ef4444" };
  return { label: `${score}`, bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" };
}

/* ─── Styles ─── */

const S = {
  card: {
    background: "linear-gradient(160deg, #0e3d34, #0c332c, #0a2e28)",
    border: "1px solid rgba(74,222,128,0.08)",
    borderRadius: 14,
    padding: "18px 20px",
  } as React.CSSProperties,
};

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
        t.destName.toLowerCase().includes(q) ||
        t.originIso2.toLowerCase().includes(q) ||
        t.destIso2.toLowerCase().includes(q)
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

  const filters: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: allTrades.length },
    { key: "active", label: "Active", count: allTrades.filter(t => (t.tradeStatus || "active") !== "closed" && (t.tradeStatus || "active") !== "archived").length },
    { key: "issues", label: "Issues", count: allTrades.filter(t => t.readinessVerdict === "RED").length },
    { key: "closed", label: "Closed", count: allTrades.filter(t => t.tradeStatus === "closed" || t.tradeStatus === "archived").length },
  ];

  return (
    <AppShell>
      {/* ── Header ── */}
      <div style={{ padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "var(--fh)", fontWeight: 800, fontSize: 26, color: "#fff", margin: 0 }} data-testid="text-trades-title">
              My Trades
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 4 }} data-testid="text-trades-subtitle">
              {stats.activeShipments} active shipment{stats.activeShipments !== 1 ? "s" : ""}
              {corridors.length > 0 && <> across {corridors.length} corridor{corridors.length !== 1 ? "s" : ""}</>}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                placeholder="Search trades..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search-trades"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "7px 12px 7px 32px",
                  fontSize: 12,
                  width: 200,
                  color: "#fff",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={() => navigate("/lookup")}
              style={{
                background: "#6b9080",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              data-testid="button-new-trade"
            >
              <Plus size={14} /> New Trade
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }} data-testid="stat-cards">
          {[
            { label: "Active Shipments", value: stats.activeShipments, color: "#4ade80" },
            { label: "Pending Documents", value: stats.pendingDocuments, color: stats.pendingDocuments > 0 ? "#eab308" : "#4ade80" },
            { label: "Avg Compliance", value: `${stats.avgCompliance}%`, color: getComplianceColor(stats.avgCompliance) },
            { label: "Shields", value: balance, color: "#5dd9c1" },
          ].map((card) => (
            <div key={card.label} style={S.card} data-testid={`stat-${card.label.toLowerCase().replace(/ /g, "-")}`}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", fontWeight: 600, marginBottom: 8 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content: 2-column grid ── */}
      <div style={{ padding: "0 32px 32px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* LEFT: Trades Table */}
        <div>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 16 }} data-testid="filter-bar">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                data-testid={`filter-${f.key}`}
                style={{
                  background: filter === f.key ? "rgba(74,222,128,0.1)" : "transparent",
                  border: `1px solid ${filter === f.key ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: filter === f.key ? "#4ade80" : "rgba(255,255,255,0.5)",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {f.label}{f.count != null && f.count > 0 ? ` (${f.count})` : ""}
              </button>
            ))}
          </div>

          {/* Trade rows */}
          {tradesQuery.isLoading ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading trades...</div>
          ) : filtered.length === 0 && allTrades.length === 0 ? (
            <div style={{ ...S.card, padding: "60px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8 }}>No trades yet</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Run your first compliance check to create a trade.
              </p>
              <Link href="/lookup">
                <button style={{ background: "#6b9080", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }} data-testid="button-empty-new-lookup">
                  <Plus size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  Start a new compliance check
                </button>
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No trades match your filter.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((trade, idx) => {
                const status = getStatusBadge(trade);
                return (
                  <div
                    key={trade.id}
                    data-testid={`trade-row-${trade.id}`}
                    onClick={() => navigate(`/trades/${trade.id}`)}
                    style={{
                      ...S.card,
                      padding: "14px 18px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      transition: "border-color .15s",
                      animation: "fadeUp .3s ease both",
                      animationDelay: `${idx * 30}ms`,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,222,128,0.25)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,222,128,0.08)"; }}
                  >
                    {/* Flags + Commodity */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {trade.commodityName}
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                        {iso2ToFlag(trade.originIso2)} {trade.originName} → {iso2ToFlag(trade.destIso2)} {trade.destName}
                      </div>
                    </div>

                    {/* Trade value */}
                    <div style={{ textAlign: "right", minWidth: 80 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: trade.tradeValue ? "#fff" : "rgba(255,255,255,0.25)" }}>
                        {trade.tradeValue
                          ? `${trade.tradeValueCurrency || "USD"} ${Number(trade.tradeValue).toLocaleString()}`
                          : "—"}
                      </div>
                    </div>

                    {/* Docs progress */}
                    <div style={{ textAlign: "center", minWidth: 50 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: trade.docsReceivedCount >= trade.docsRequiredCount && trade.docsRequiredCount > 0 ? "#4ade80" : "rgba(255,255,255,0.6)" }}>
                        {trade.docsRequiredCount > 0 ? `${trade.docsReceivedCount}/${trade.docsRequiredCount}` : "—"}
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>docs</div>
                    </div>

                    {/* Compliance % */}
                    <div style={{ textAlign: "center", minWidth: 44 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: getComplianceColor(trade.readinessScore) }}>
                        {trade.readinessScore != null ? `${trade.readinessScore}%` : "—"}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 12,
                      background: status.bg, color: status.color, whiteSpace: "nowrap",
                    }}>
                      {status.label}
                    </span>

                    <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Intelligence Panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* EUDR Intelligence */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Leaf size={14} style={{ color: "#4ade80" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>EUDR Intelligence</span>
            </div>
            {eudrTrades.length === 0 ? (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>No EUDR-applicable trades</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {eudrTrades.slice(0, 5).map(t => {
                  const badge = getRegulatoryBadge(t.eudrApplicable, t.eudrScore, t.eudrBand);
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/trades/${t.id}#eudr`)}
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 8px", borderRadius: 8, transition: "background .15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {iso2ToFlag(t.originIso2)} {t.commodityName}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CBAM Intelligence */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Factory size={14} style={{ color: "#60a5fa" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>CBAM Intelligence</span>
            </div>
            {cbamTrades.length === 0 ? (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>No CBAM-applicable trades</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cbamTrades.slice(0, 5).map(t => {
                  const badge = getRegulatoryBadge(t.cbamApplicable, t.cbamScore, t.cbamBand);
                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/trades/${t.id}#cbam`)}
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 8px", borderRadius: 8, transition: "background .15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {iso2ToFlag(t.originIso2)} {t.commodityName}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shield Balance mini card */}
          <Link href="/pricing">
            <div style={{ ...S.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                Shield Balance
              </div>
              <div style={{ fontFamily: "var(--fh)", fontSize: 18, fontWeight: 800, color: "#5dd9c1", marginLeft: "auto" }}>
                {balance}
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Buy more →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Bottom Row: Shipments list + Corridors Map ── */}
      <div style={{ padding: "0 32px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* All Shipments compact list */}
        <div style={S.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <FileText size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>All Shipments</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{allTrades.length} total</span>
          </div>
          {allTrades.length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>No shipments yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 240, overflowY: "auto" }}>
              {allTrades.slice(0, 15).map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/trades/${t.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    padding: "6px 8px", borderRadius: 6, transition: "background .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {iso2ToFlag(t.originIso2)} {t.commodityName} → {iso2ToFlag(t.destIso2)} {t.destIso2}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: getComplianceColor(t.readinessScore),
                    minWidth: 30, textAlign: "right",
                  }}>
                    {t.readinessScore != null ? `${t.readinessScore}%` : "—"}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{formatDate(t.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trade Corridors Map */}
        <div style={{ ...S.card, padding: 0, overflow: "hidden", minHeight: 280 }}>
          {corridors.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 32 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                Trade corridors will appear here once you have trades
              </p>
            </div>
          ) : (
            <TradeCorridorsMap corridors={corridors} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "0 32px 40px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>
          TapTrao does not provide legal or banking advice. Reports are informational.
        </p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>
          Fatrao Limited — Registered in England and Wales
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
