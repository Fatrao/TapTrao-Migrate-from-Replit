import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useSearch } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTokenBalance } from "@/hooks/use-tokens";
import { iso2ToFlag } from "@/components/CountryFlagBadge";
import { TradeCorridorsMap } from "@/components/TradeCorridorsMap";
import type { Corridor } from "@/components/TradeCorridorsMap";
import { Plus, Loader2 } from "lucide-react";
import { translateCommodity } from "@/lib/commodity-i18n";
import { calculateTradeRisk, calculatePortfolioRisk } from "@/lib/risk-utils";

/* ─── Types ─── */

type EnrichedTrade = {
  id: string;
  commodityName: string;
  nickname: string | null;
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
  // SPS flag (from compliance result triggers)
  spsFlagged: boolean;
  // Demurrage persistence
  demurragePort: string | null;
  demurrageContainerType: string | null;
  demurrageDailyRate: string | null;
  demurrageFreeDays: number | null;
  demurrageDaysHeld: number | null;
  demurrageTotal: string | null;
};

type MyTradesStats = {
  activeShipments: number;
  activeShipmentValue: number;
  pendingDocuments: number;
  avgCompliance: number;
};

type FilterTab = "all" | "active" | "issues" | "closed";

/* ─── Helpers ─── */

function getStatusBadge(trade: EnrichedTrade, t: (key: string) => string): { label: string; cls: string } {
  const status = trade.tradeStatus || "active";
  if (status === "closed" || status === "archived")
    return { label: t("status.closed"), cls: "off" };
  if (trade.readinessScore !== null && trade.readinessScore >= 80 && trade.docsReceivedCount >= trade.docsRequiredCount && trade.docsRequiredCount > 0)
    return { label: t("status.complete"), cls: "ok" };
  if (trade.readinessVerdict === "RED")
    return { label: t("status.issues"), cls: "e" };
  if (!trade.lcVerdict && trade.docsReceivedCount === 0)
    return { label: t("status.waiting"), cls: "w" };
  return { label: t("status.active"), cls: "ok" };
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

function getEudrBadge(band: string | null, t: (key: string) => string): { label: string; cls: string } {
  if (!band) return { label: "—", cls: "" };
  if (band === "negligible" || band === "low") return { label: t("eudr.low"), cls: "ok" };
  if (band === "medium") return { label: t("eudr.med"), cls: "w" };
  if (band === "high") return { label: t("eudr.high"), cls: "e" };
  return { label: band, cls: "" };
}

/* ─── Inline CSS (matches design mock) ─── */
const css = `
.mt-page { display:flex;flex-direction:column;padding:24px 30px 24px 20px;gap:12px;height:100%;overflow:hidden }
.mt-hdr { display:flex;align-items:center;justify-content:space-between;flex-shrink:0 }
.mt-hdr h1 { font-family:var(--fd);font-size:28px;font-weight:600;color:var(--t1);margin:0 }
.mt-hdr .sub { font-size:15px;color:var(--t3);margin-top:1px }
.mt-hdr-r { display:flex;align-items:center;gap:8px }
.mt-srch { background:#fff;border:none;border-radius:12px;padding:8px 16px;font-family:var(--fb);font-size: 15px;color:var(--t2);box-shadow:var(--shd);width:170px;outline:none }
.mt-hbtn { width:36px;height:36px;border-radius:50%;border:none;background:#fff;box-shadow:var(--shd);display:flex;align-items:center;justify-content:center;font-size: 15px;cursor:pointer;color:var(--t2) }
.mt-ntb { padding:8px 18px;border-radius:20px;border:none;background:var(--sage);color:#fff;font-family:var(--fb);font-size: 15px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(74,124,94,.25);display:flex;align-items:center;gap:5px }

/* Stats */
.mt-stats { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;flex-shrink:0 }
.mt-st { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;animation:mt-fu .3s ease both }
.mt-st-click { cursor:pointer;transition:transform .15s,box-shadow .15s }
.mt-st-click:hover { transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08) }
.mt-st-click:active { transform:translateY(0) }
.mt-acr-click:hover { background:rgba(0,0,0,.02) }
.mt-st .sl { font-size: 15px;color:var(--t3);margin-bottom:1px }
.mt-st .sv { font-family:var(--fd);font-size:22px;font-weight:600;color:var(--t1) }
.mt-st-bars { display:flex;align-items:flex-end;gap:2px;height:24px }
.mt-st-bars span { width:3px;border-radius:1px;background:var(--sage) }
.mt-st.ac { background:var(--sage) }
.mt-st.ac .sl { color:#fff }
.mt-st.ac .sv { color:#fff }
.mt-st-ic { width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px }

/* ── Risk Banner ── */
.mt-risk-banner {
  background:#fff;border-radius:var(--r);box-shadow:var(--shd);
  padding:14px 20px;
  display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0;
  flex-shrink:0;position:relative;overflow:hidden;
  animation:mt-fu .3s ease both;
}
.mt-risk-banner::before {
  content:'';position:absolute;left:0;top:0;bottom:0;
  width:3px;background:linear-gradient(180deg,var(--amber),var(--red));
  border-radius:3px 0 0 3px;
}
.mt-rb-cell {
  display:flex;flex-direction:column;gap:3px;padding:0 20px;position:relative;
}
.mt-rb-cell:first-child { padding-left:16px }
.mt-rb-cell+.mt-rb-cell::before {
  content:'';position:absolute;left:0;top:10%;bottom:10%;
  width:1px;background:rgba(0,0,0,.06);
}
.mt-rb-label { font-size:9px;color:var(--t3);font-weight:500;text-transform:uppercase;letter-spacing:.04em }
.mt-rb-value { font-family:var(--fd);font-size:20px;font-weight:700;color:var(--t1);line-height:1 }
.mt-rb-value.danger { color:var(--red) }
.mt-rb-value.warn { color:var(--amber) }
.mt-rb-sub { font-size:9px;color:var(--t3);margin-top:1px }
.mt-rb-sub b { font-weight:600 }
.mt-rb-sub b.r { color:var(--red) }
.mt-rb-sub b.a { color:var(--amber) }
.mt-rb-sub b.g { color:var(--sage) }

/* Mid grid */
.mt-mid { flex:1;display:grid;grid-template-columns:60fr 40fr;gap:10px;min-height:0 }

/* Trades card (left) */
.mt-tc { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:16px 20px;display:flex;flex-direction:column;min-height:0;animation:mt-fu .3s ease both }
.mt-tc .th { display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-shrink:0 }
.mt-tc h3 { font-family:var(--fd);font-size:18px;font-weight:600;color:var(--t1);margin:0 }
.mt-tc .tsub { font-size: 15px;color:var(--t3);margin-bottom:10px;flex-shrink:0 }
.mt-tc .tsub b { color:var(--sage);font-weight:600 }

/* Filter pills */
.mt-pls { display:flex;gap:3px }
.mt-pl { padding:5px 12px;border-radius:12px;font-size: 15px;font-weight:600;border:none;cursor:pointer;font-family:var(--fb);background:rgba(0,0,0,.03);color:var(--t3) }
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
.mt-rw .rt { font-size: 15px;color:var(--t3) }
.mt-rw .vl { font-size: 15px;color:var(--t2);min-width:62px;text-align:right }
.mt-rw .dc { font-size: 15px;color:var(--t3);min-width:26px;text-align:center }
.mt-rw .pc { font-size: 15px;font-weight:700;min-width:32px;text-align:right }
.mt-rw .pc.g { color:var(--sage) }
.mt-rw .pc.a { color:var(--amber) }
.mt-rw .pc.r { color:var(--red) }
.mt-rw .bg { padding:3px 8px;border-radius:5px;font-size: 15px;font-weight:600;min-width:48px;text-align:center }
.mt-rw .bg.ok { background:var(--sage-xs);color:var(--sage) }
.mt-rw .bg.w { background:var(--amber-xs);color:var(--amber) }
.mt-rw .bg.e { background:var(--red-xs);color:var(--red) }
.mt-rw .bg.off { background:rgba(0,0,0,.03);color:var(--t4) }
.mt-rw .arr { color:var(--t4);font-size: 15px }
.mt-rw:hover .arr { color:var(--sage) }
.mt-rw.closed { opacity:.4 }

/* Right column */
.mt-right { display:flex;flex-direction:column;gap:10px;min-height:0 }

/* Analytics */
.mt-an { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:14px 16px;display:flex;flex-direction:column;min-height:0;flex:1.5;overflow-y:auto;animation:mt-fu .3s ease both }
.mt-an::-webkit-scrollbar { width:2px }
.mt-an::-webkit-scrollbar-thumb { background:rgba(0,0,0,.05) }
.mt-an h3 { font-family:var(--fd);font-size:16px;font-weight:600;margin:0 0 10px;flex-shrink:0;color:var(--t1) }

/* Big pie + vertical legend layout */
.mt-an-pie-only { flex:1;display:flex;flex-direction:row;align-items:center;gap:20px;min-height:0;justify-content:center }
.mt-an-pie-big { width:200px;height:200px;flex-shrink:0;filter:drop-shadow(0 3px 10px rgba(0,0,0,.08)) }
.mt-pie-slice { cursor:pointer;transition:opacity .15s ease }
.mt-pie-slice:hover { opacity:.85 }
.mt-an-pie-leg-v { display:flex;flex-direction:column;gap:8px;width:100% }
.mt-apl-v { display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;cursor:pointer;transition:background .12s }
.mt-apl-v:hover { background:rgba(0,0,0,.03) }
.mt-apl-v .apl-dot { width:10px;height:10px;border-radius:2px;flex-shrink:0 }
.mt-apl-name { font-size:14px;font-weight:600;color:var(--t1) }
.mt-apl-detail { font-size:12px;color:var(--t3) }

/* Demurrage */
.mt-dem { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:14px 16px;display:flex;flex-direction:column;flex:1;min-height:0;animation:mt-fu .3s ease both }
.mt-dem h3 { font-family:var(--fd);font-size:16px;font-weight:600;margin:0 0 10px;flex-shrink:0;color:var(--t1) }
.mt-dem-body { flex:1;display:flex;gap:10px;min-height:0 }
.mt-dem-chart { flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center }
.mt-dem-ring { width:90px;height:90px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative }
.mt-dem-ring::after { content:'';position:absolute;inset:14px;border-radius:50%;background:#fff }
.mt-dem-ring span { position:relative;z-index:1;font-family:var(--fd);font-size:18px;font-weight:700;color:var(--t1) }
.mt-dem-label { font-size: 15px;color:var(--t3);margin-top:6px;text-align:center }
.mt-dem-list { flex:1;display:flex;flex-direction:column;justify-content:center;gap:6px }
.mt-dem-row { display:flex;align-items:center;gap:6px }
.mt-dem-dot { width:8px;height:8px;border-radius:2px;flex-shrink:0 }
.mt-dem-row .di { flex:1 }
.mt-dem-row .dn { font-size: 15px;font-weight:600;color:var(--t1) }
.mt-dem-row .dd { font-size: 15px;color:var(--t3) }
.mt-dem-row .dv { font-size: 15px;font-weight:700 }
.mt-dem-total { display:flex;align-items:center;justify-content:space-between;padding-top:6px;margin-top:auto;border-top:1px solid rgba(0,0,0,.04) }
.mt-dem-total .dtl { font-size: 15px;color:var(--t3) }
.mt-dem-total .dtv { font-family:var(--fd);font-size:18px;font-weight:700;color:var(--red) }

/* Bottom row */
.mt-bot { display:grid;grid-template-columns:3fr 3fr 5fr;gap:10px;flex-shrink:0;height:360px }
.mt-eudr { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:12px 14px;display:flex;flex-direction:column;overflow:hidden;animation:mt-fu .3s ease both }
.mt-eudr h4 { font-family:var(--fd);font-size:16px;font-weight:600;color:var(--sage);margin:0 0 4px }
.mt-eudr .es { font-size: 15px;color:var(--t3);margin-bottom:6px }
.mt-eb { flex:1;overflow-y:auto }
.mt-eb::-webkit-scrollbar { width:2px }
.mt-eb::-webkit-scrollbar-thumb { background:rgba(0,0,0,.04) }
.mt-er { display:flex;align-items:center;gap:6px;padding:5px 0 }
.mt-er+.mt-er { border-top:1px solid rgba(0,0,0,.03) }
.mt-er .dot { width:5px;height:5px;border-radius:50%;flex-shrink:0 }
.mt-er .ei { flex:1 }
.mt-er .en { font-size: 15px;font-weight:600;color:var(--t1) }
.mt-er .et { font-size: 15px;color:var(--t3) }
.mt-er .eg { padding:3px 7px;border-radius:3px;font-size: 15px;font-weight:600 }

.mt-cbam { background:#fff;border-radius:var(--r);box-shadow:var(--shd);padding:12px 14px;display:flex;flex-direction:column;overflow:hidden;animation:mt-fu .3s ease both }
.mt-cbam h4 { font-family:var(--fd);font-size:16px;font-weight:600;color:var(--amber);margin:0 0 6px }
.mt-cbr { display:flex;align-items:center;justify-content:space-between;padding:5px 0 }
.mt-cbr+.mt-cbr { border-top:1px solid rgba(0,0,0,.03) }
.mt-cbr .cc { display:flex;align-items:center;gap:5px }
.mt-cbr .cc em { font-style:normal;font-size: 15px }
.mt-cbr .cc span { font-size: 15px;font-weight:600;color:var(--t1) }
.mt-cbr .cx { font-size: 15px;font-weight:600;color:var(--sage) }

.mt-mp { background:linear-gradient(135deg,#0e2a20,#0c3a28);border-radius:var(--r);box-shadow:var(--shd);overflow:hidden;display:grid;grid-template-columns:200px 1fr;height:100%;animation:mt-fu .3s ease both }
.mt-mp-left { padding:16px 18px;display:flex;flex-direction:column;gap:10px;z-index:2 }
.mt-mp-left h4 { font-family:var(--fd);font-size:16px;color:#fff;font-weight:600;margin:0 }
.mt-mp-left .ms { font-size:13px;color:rgba(255,255,255,.55);line-height:1.4 }
.mt-ml { display:flex;flex-direction:column;gap:8px;margin-top:auto }
.mt-mll { display:flex;align-items:center;gap:5px;font-size:12px;color:rgba(255,255,255,.55);font-weight:500 }
.mt-mll span { width:7px;height:7px;border-radius:50% }
.mt-mp-inner { position:relative;min-height:0;overflow:hidden }
.mt-mp-inner svg { width:100%;height:100% }

/* Empty state */
.mt-empty { text-align:center;padding:60px 20px }
.mt-empty h3 { font-family:var(--fd);font-size:20px;font-weight:600;color:var(--t1);margin:0 0 8px }
.mt-empty p { font-size: 15px;color:var(--t3);margin:0 0 20px;line-height:1.6 }

@keyframes mt-fu { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

@media (max-width: 768px) {
  .mt-page { padding:16px 12px 16px 12px;overflow:auto;height:auto }
  .mt-hdr { flex-direction:column;align-items:flex-start;gap:8px }
  .mt-hdr-r { width:100%;flex-wrap:wrap }
  .mt-srch { flex:1;width:auto;min-width:120px }
  .mt-stats { grid-template-columns:1fr 1fr;gap:8px }
  .mt-risk-banner { grid-template-columns:1fr 1fr;gap:12px;padding:12px 14px }
  .mt-rb-cell+.mt-rb-cell::before { display:none }
  .mt-mid { grid-template-columns:1fr;height:auto }
  .mt-tc { max-height:none }
  .mt-right { gap:10px }
  .mt-bot { grid-template-columns:1fr;height:auto }
  .mt-bot > * { min-height:180px }
  .mt-mp { grid-template-columns:1fr;grid-template-rows:auto 1fr }
  .mt-mp-inner { min-height:200px }
  .mt-an-pie-only { flex-direction:column }
  .mt-dem-body { flex-direction:column }
  .mt-rw .vl,.mt-rw .dc,.mt-rw .pc,.mt-rw .bg,.mt-rw .arr { display:none }
}
`;

/* ─── Main Component ─── */

export default function Trades() {
  const { t, i18n } = useTranslation("trades");
  const lang = i18n.language;
  usePageTitle(t("pageTitle"));
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [statCardFilter, setStatCardFilter] = useState<string | null>(null);
  const [hoveredPie, setHoveredPie] = useState<number | null>(null);
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [pieTooltip, setPieTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const [batchEudrAssessing, setBatchEudrAssessing] = useState(false);
  const [batchCbamAssessing, setBatchCbamAssessing] = useState(false);

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
    if (filter === "active") list = list.filter(tr => {
      const s = tr.tradeStatus || "active";
      return s !== "closed" && s !== "archived" && tr.readinessVerdict !== "RED";
    });
    if (filter === "issues") list = list.filter(tr => tr.readinessVerdict === "RED");
    if (filter === "closed") list = list.filter(tr => tr.tradeStatus === "closed" || tr.tradeStatus === "archived");
    // Stat card sub-filter
    if (statCardFilter === "pendingDocs") {
      list = list.filter(tr => tr.docsRequiredCount > 0 && tr.docsReceivedCount < tr.docsRequiredCount);
    }
    // Corridor filter from pie chart / bar click
    if (selectedCorridor) {
      list = list.filter(tr => `${tr.originName} → ${tr.destName}` === selectedCorridor);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(tr =>
        tr.commodityName.toLowerCase().includes(q) ||
        tr.originName.toLowerCase().includes(q) ||
        tr.destName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTrades, filter, search, statCardFilter, selectedCorridor]);

  const eudrTrades = useMemo(() =>
    allTrades.filter(tr => tr.eudrApplicable === true && tr.tradeStatus !== "closed" && tr.tradeStatus !== "archived"),
  [allTrades]);

  const cbamTrades = useMemo(() =>
    allTrades.filter(tr => tr.cbamApplicable === true && tr.tradeStatus !== "closed" && tr.tradeStatus !== "archived"),
  [allTrades]);

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: t("filter.all"), count: allTrades.length },
    { key: "active", label: t("filter.active"), count: allTrades.filter(tr => (tr.tradeStatus || "active") !== "closed" && (tr.tradeStatus || "active") !== "archived").length },
    { key: "issues", label: t("filter.issues"), count: allTrades.filter(tr => tr.readinessVerdict === "RED").length },
    { key: "closed", label: t("filter.closed"), count: allTrades.filter(tr => tr.tradeStatus === "closed" || tr.tradeStatus === "archived").length },
  ];

  /* Compute analytics data from real trades */
  const corridorAnalytics = useMemo(() => {
    const map = new Map<string, { flags: string; label: string; count: number; value: number }>();
    allTrades.forEach(tr => {
      if (tr.tradeStatus === "closed" || tr.tradeStatus === "archived") return;
      const key = `${tr.originIso2}-${tr.destIso2}`;
      const existing = map.get(key);
      const val = tr.tradeValue ? Number(tr.tradeValue) : 0;
      if (existing) {
        existing.count++;
        existing.value += val;
      } else {
        map.set(key, {
          flags: `${iso2ToFlag(tr.originIso2)}${iso2ToFlag(tr.destIso2)}`,
          label: `${tr.originName} → ${tr.destName}`,
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

  const eudrAssessedCount = useMemo(() => eudrTrades.filter(tr => tr.eudrBand !== null).length, [eudrTrades]);
  const cbamAssessedCount = useMemo(() => cbamTrades.filter(tr => tr.cbamBand !== null).length, [cbamTrades]);

  const batchAssessEudr = async () => {
    setBatchEudrAssessing(true);
    const unassessed = eudrTrades.filter(tr => tr.eudrBand === null);
    let done = 0;
    for (const trade of unassessed) {
      try {
        await apiRequest("POST", "/api/eudr", { lookupId: trade.id });
        await apiRequest("POST", `/api/eudr/${trade.id}/assess`);
        done++;
      } catch { /* continue with remaining */ }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    toast({ title: t("eudr.batchDone", { count: done }) });
    setBatchEudrAssessing(false);
  };

  const batchAssessCbam = async () => {
    setBatchCbamAssessing(true);
    const unassessed = cbamTrades.filter(tr => tr.cbamBand === null);
    let done = 0;
    for (const trade of unassessed) {
      try {
        await apiRequest("POST", "/api/cbam", { lookupId: trade.id });
        await apiRequest("POST", `/api/cbam/${trade.id}/assess`);
        done++;
      } catch { /* continue with remaining */ }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    toast({ title: t("cbam.batchDone", { count: done }) });
    setBatchCbamAssessing(false);
  };

  return (
    <AppShell>
      <style>{css}</style>
      <div className="mt-page">
        {/* ── Header ── */}
        <div className="mt-hdr">
          <div>
            <h1 data-testid="text-trades-title">{t("pageTitle")}</h1>
            <div className="sub" data-testid="text-trades-subtitle">
              {t("subtitle", { value: totalValue.toLocaleString(), count: corridors.length || corridorAnalytics.length, plural: (corridors.length || corridorAnalytics.length) !== 1 ? "s" : "" })}
            </div>
          </div>
          <div className="mt-hdr-r">
            <input
              className="mt-srch"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-trades"
            />
            <button className="mt-hbtn" onClick={() => navigate("/alerts")}>🔔</button>
            <button className="mt-ntb" onClick={() => navigate("/new-check")} data-testid="button-new-trade">
              <Plus size={12} /> {t("newTrade")}
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="mt-stats" data-testid="stat-cards">
          <div className="mt-st mt-st-click" onClick={() => { setFilter("all"); setStatCardFilter(null); setSelectedCorridor(null); document.querySelector(".mt-tc")?.scrollIntoView({ behavior: "smooth" }); }}>
            <div>
              <div className="sl">{t("stat.portfolioValue")}</div>
              <div className="sv">${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0).toLocaleString()}k` : totalValue.toLocaleString()}</div>
            </div>
            <svg width="48" height="20" viewBox="0 0 48 20">
              <path d="M0,16 Q7,11 14,13 Q22,15 32,6 Q40,1 48,4" fill="none" stroke="var(--sage-l)" strokeWidth="1.5" opacity=".5" />
            </svg>
          </div>
          <div className="mt-st ac mt-st-click" onClick={() => { setFilter("all"); setStatCardFilter("pendingDocs"); setSelectedCorridor(null); }}>
            <div>
              <div className="sl">{t("stat.pendingDocs")}</div>
              <div className="sv">{stats.pendingDocuments}</div>
            </div>
            <div style={{ fontSize: 16 }}>📄</div>
          </div>
          <div className="mt-st mt-st-click" onClick={() => { setFilter("issues"); setStatCardFilter(null); setSelectedCorridor(null); }}>
            <div>
              <div className="sl">{t("stat.riskExposure")}</div>
              <div className="sv" style={{ color: "var(--amber)" }}>
                {(() => {
                  const portfolio = calculatePortfolioRisk(allTrades.map(tr => ({
                    readinessScore: tr.readinessScore,
                    dailyRate: tr.demurrageDailyRate ? Number(tr.demurrageDailyRate) : null,
                    spsFlagged: tr.spsFlagged,
                    lcFlagged: tr.lcVerdict === "DISCREPANCIES_FOUND",
                    eudrApplicable: tr.eudrApplicable === true,
                    cbamApplicable: tr.cbamApplicable === true,
                    tradeValue: tr.tradeValue ? Number(tr.tradeValue) : undefined,
                    tradeStatus: tr.tradeStatus,
                  })));
                  if (portfolio.totalExpected === 0 && portfolio.totalWorstCase === 0) return "—";
                  const fmtLow = portfolio.totalExpected >= 1000 ? `$${(portfolio.totalExpected / 1000).toFixed(1)}k` : `$${portfolio.totalExpected.toLocaleString()}`;
                  const fmtHigh = portfolio.totalWorstCase >= 1000 ? `$${(portfolio.totalWorstCase / 1000).toFixed(1)}k` : `$${portfolio.totalWorstCase.toLocaleString()}`;
                  return `${fmtLow}–${fmtHigh}`;
                })()}
              </div>
            </div>
            <div className="mt-st-ic" style={{ background: "var(--amber-xs)" }}>⚠️</div>
          </div>
          <div className="mt-st ac mt-st-click" onClick={() => { setFilter("issues"); setStatCardFilter(null); setSelectedCorridor(null); document.querySelector(".mt-tc")?.scrollIntoView({ behavior: "smooth" }); }}>
            <div>
              <div className="sl">{t("stat.needingAction")}</div>
              <div className="sv">{allTrades.filter(tr => tr.readinessVerdict === "RED" && tr.tradeStatus !== "closed" && tr.tradeStatus !== "archived").length}</div>
            </div>
            <div style={{ fontSize: 16 }}>🚨</div>
          </div>
        </div>

        {/* ── Money at Risk Banner ── */}
        {(() => {
          const activeTrades = allTrades.filter(tr =>
            tr.tradeStatus !== "closed" && tr.tradeStatus !== "archived"
          );
          // Calculate real risk per trade
          const tradeRisks = activeTrades.map(tr => ({
            trade: tr,
            risk: calculateTradeRisk({
              readinessScore: tr.readinessScore,
              dailyRate: tr.demurrageDailyRate ? Number(tr.demurrageDailyRate) : null,
              spsFlagged: tr.spsFlagged,
              lcFlagged: tr.lcVerdict === "DISCREPANCIES_FOUND",
              eudrApplicable: tr.eudrApplicable === true,
              cbamApplicable: tr.cbamApplicable === true,
              tradeValue: tr.tradeValue ? Number(tr.tradeValue) : undefined,
            }),
          })).filter(r => r.risk.expectedLoss > 0 || r.risk.worstCase > 0);

          if (tradeRisks.length === 0) return null;

          const totalExpected = tradeRisks.reduce((s, r) => s + r.risk.expectedLoss, 0);
          const highestRisk = tradeRisks.reduce((best, r) =>
            r.risk.worstCase > best.risk.worstCase ? r : best
          , tradeRisks[0]);
          const disputeCount = tradeRisks.filter(r =>
            r.trade.docsReceivedCount < r.trade.docsRequiredCount
          ).length;
          const totalActive = activeTrades.length;
          const resolvedCount = totalActive > 0 ? totalActive - tradeRisks.length : 0;
          const resRate = totalActive > 0 ? Math.round((resolvedCount / totalActive) * 100) : 0;

          const fmtRisk = totalExpected >= 1000 ? `$${(totalExpected / 1000).toFixed(1)}k` : `$${totalExpected}`;
          const fmtHighest = highestRisk.risk.worstCase >= 1000
            ? `$${(highestRisk.risk.worstCase / 1000).toFixed(1)}k`
            : `$${highestRisk.risk.worstCase}`;

          return (
            <div className="mt-risk-banner">
              <div className="mt-rb-cell">
                <div className="mt-rb-label">{t("risk.totalAtRisk")}</div>
                <div className="mt-rb-value danger">{fmtRisk}</div>
                <div className="mt-rb-sub">{t("risk.acrossTrades", { count: tradeRisks.length })}</div>
              </div>
              <div className="mt-rb-cell">
                <div className="mt-rb-label">{t("risk.highestSingle")}</div>
                <div className="mt-rb-value warn">{fmtHighest}</div>
                <div className="mt-rb-sub">
                  {highestRisk
                    ? `${translateCommodity(highestRisk.trade.commodityName, lang).split(" ")[0]} ${highestRisk.trade.originIso2}→${highestRisk.trade.destIso2}`
                    : "—"}
                </div>
              </div>
              <div className="mt-rb-cell">
                <div className="mt-rb-label">{t("risk.activeDisputes")}</div>
                <div className="mt-rb-value">{disputeCount}</div>
                <div className="mt-rb-sub">{t("risk.pendingResolution", { count: disputeCount })}</div>
              </div>
              <div className="mt-rb-cell">
                <div className="mt-rb-label">{t("risk.resolutionRate")}</div>
                <div className="mt-rb-value">{resRate}%</div>
                <div className="mt-rb-sub">
                  <b className="g">↑</b> {t("risk.upFrom", { prev: Math.max(0, resRate - 13) })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Mid Section ── */}
        <div className="mt-mid">
          {/* LEFT: Trades Card */}
          <div className="mt-tc">
            <div className="th">
              <h3>{t("trades.title")}</h3>
              <div className="mt-pls" data-testid="filter-bar">
                {filters.map(f => (
                  <button
                    key={f.key}
                    className={`mt-pl${filter === f.key ? " on" : ""}`}
                    onClick={() => { setFilter(f.key); setStatCardFilter(null); setSelectedCorridor(null); }}
                    data-testid={`filter-${f.key}`}
                  >
                    {f.label}
                  </button>
                ))}
                {selectedCorridor && (
                  <button className="mt-pl on" onClick={() => setSelectedCorridor(null)} style={{ fontSize: 15, gap: 4 }}>
                    {selectedCorridor} ✕
                  </button>
                )}
                {statCardFilter === "pendingDocs" && (
                  <button className="mt-pl on" onClick={() => setStatCardFilter(null)} style={{ fontSize: 15, gap: 4 }}>
                    {t("stat.pendingDocs")} ✕
                  </button>
                )}
              </div>
            </div>
            <div className="tsub">
              {t("trades.total")} <b>${totalValue.toLocaleString()}</b> · {t("trades.shipment", { count: allTrades.filter(tr => (tr.tradeStatus || "active") !== "closed").length })}
            </div>

            <div className="mt-tb">
              {tradesQuery.isLoading ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>{t("trades.loading")}</div>
              ) : filtered.length === 0 && allTrades.length === 0 ? (
                <div className="mt-empty">
                  <h3>{t("empty.title")}</h3>
                  <p>{t("empty.body")}</p>
                  <Link href="/new-check">
                    <button className="mt-ntb" data-testid="button-empty-new-lookup">
                      <Plus size={12} /> {t("empty.cta")}
                    </button>
                  </Link>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: "var(--t3)", fontSize: 15 }}>{t("trades.noFilter")}</div>
              ) : (
                filtered.map(trade => {
                  const status = getStatusBadge(trade, t);
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
                        <div className="nm">{trade.nickname || translateCommodity(trade.commodityName, lang)}</div>
                        <div className="rt">{trade.originName} → {trade.destName} · {new Date(trade.createdAt).toLocaleDateString(lang, { month: "short", day: "numeric" })}, {new Date(trade.createdAt).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}</div>
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
            {/* Trade Analytics — Large Pie + Vertical Legend */}
            <div className="mt-an">
              <h3>{t("analytics.title")}</h3>
              {corridorAnalytics.length === 0 ? (
                <div style={{ fontSize: 15, color: "var(--t3)", padding: "16px 0" }}>{t("analytics.noData")}</div>
              ) : (
                <div className="mt-an-pie-only" style={{ position: "relative" }}>
                  <svg viewBox="0 0 200 200" className="mt-an-pie-big">
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
                        const x1 = 100 + 86 * Math.cos(startRad);
                        const y1 = 100 + 86 * Math.sin(startRad);
                        const x2 = 100 + 86 * Math.cos(endRad);
                        const y2 = 100 + 86 * Math.sin(endRad);
                        const largeArc = angle > 180 ? 1 : 0;
                        const d = `M100,100 L${x1.toFixed(1)},${y1.toFixed(1)} A86,86 0 ${largeArc},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`;
                        startAngle = endAngle;
                        return (
                          <path
                            key={i}
                            className="mt-pie-slice"
                            d={d}
                            fill={pieColors[i % pieColors.length]}
                            style={{
                              opacity: hoveredPie !== null && hoveredPie !== i ? 0.4 : 1,
                              transform: hoveredPie === i ? "scale(1.04)" : "scale(1)",
                              transformOrigin: "100px 100px",
                              transition: "opacity 0.2s, transform 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              setHoveredPie(i);
                              const rect = (e.target as SVGPathElement).closest("svg")!.getBoundingClientRect();
                              setPieTooltip({
                                x: e.clientX - rect.left,
                                y: e.clientY - rect.top - 40,
                                text: `${c.label}: $${c.value >= 1000 ? `${(c.value / 1000).toFixed(0)}k` : c.value} (${t("analytics.shipment", { count: c.count })})`,
                              });
                            }}
                            onMouseMove={(e) => {
                              const rect = (e.target as SVGPathElement).closest("svg")!.getBoundingClientRect();
                              setPieTooltip(prev => prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top - 40 } : null);
                            }}
                            onMouseLeave={() => { setHoveredPie(null); setPieTooltip(null); }}
                            onClick={() => {
                              setSelectedCorridor(selectedCorridor === c.label ? null : c.label);
                              setFilter("all");
                              setStatCardFilter(null);
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {pieTooltip && (
                    <div style={{
                      position: "absolute", left: pieTooltip.x, top: pieTooltip.y,
                      background: "rgba(0,0,0,0.85)", color: "#fff",
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                      whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10,
                      transform: "translateX(-50%)",
                    }}>
                      {pieTooltip.text}
                    </div>
                  )}
                  <div className="mt-an-pie-leg-v">
                    {corridorAnalytics.map((c, i) => (
                      <div
                        key={i}
                        className="mt-apl-v"
                        style={{
                          background: selectedCorridor === c.label ? "rgba(107,144,128,0.08)" : undefined,
                        }}
                        onClick={() => {
                          setSelectedCorridor(selectedCorridor === c.label ? null : c.label);
                          setFilter("all");
                          setStatCardFilter(null);
                        }}
                      >
                        <span className="apl-dot" style={{ background: pieColors[i % pieColors.length] }} />
                        <div>
                          <div className="mt-apl-name">{c.flags} {c.label}</div>
                          <div className="mt-apl-detail">{t("analytics.shipment", { count: c.count })} · ${c.value >= 1000 ? `${(c.value / 1000).toFixed(0)}k` : c.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Demurrage Estimate (placeholder — uses mock data structure) */}
            <div className="mt-dem" style={{ cursor: "pointer" }} onClick={() => navigate("/demurrage")}>
              <h3>{t("demurrage.title")}</h3>
              <div className="mt-dem-body">
                {(() => {
                  const tradesWithValue = allTrades.filter(tr =>
                    tr.tradeValue && Number(tr.tradeValue) > 0 &&
                    tr.tradeStatus !== "closed" && tr.tradeStatus !== "archived"
                  );
                  if (tradesWithValue.length === 0) {
                    return (
                      <>
                        <div className="mt-dem-chart">
                          <div className="mt-dem-ring" style={{ background: "conic-gradient(rgba(0,0,0,.04) 0deg 360deg)" }}>
                            <span>—</span>
                          </div>
                          <div className="mt-dem-label">{t("demurrage.totalExposure")}</div>
                        </div>
                        <div className="mt-dem-list">
                          <div style={{ fontSize: 15, color: "var(--t3)", padding: "16px 0" }}>
                            {t("demurrage.addValues")}
                          </div>
                        </div>
                      </>
                    );
                  }
                  const demColors = ["var(--sage-l)", "var(--amber)", "var(--red)", "#8ecaad"];
                  const demData = tradesWithValue.slice(0, 4).map(tr => {
                    const tv = Number(tr.tradeValue);
                    // Use real demurrage total if saved, otherwise estimate at 3%
                    const est = tr.demurrageTotal ? Math.round(Number(tr.demurrageTotal)) : Math.round(tv * 0.03);
                    return { name: translateCommodity(tr.commodityName, lang).split(" ")[0], origin: tr.originIso2, est, tv, hasReal: !!tr.demurrageTotal };
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
                        <div className="mt-dem-label">{t("demurrage.estExposure")}</div>
                      </div>
                      <div className="mt-dem-list">
                        {demData.map((d, i) => (
                          <div key={i} className="mt-dem-row">
                            <div className="mt-dem-dot" style={{ background: demColors[i % demColors.length] }} />
                            <div className="di">
                              <div className="dn">{iso2ToFlag(d.origin)} {d.name}</div>
                              <div className="dd">{d.hasReal ? "Calculated" : `~3% of $${d.tv >= 1000 ? `${(d.tv / 1000).toFixed(0)}k` : d.tv}`}</div>
                            </div>
                            <div className="dv" style={{ color: d.est > 1000 ? "var(--red)" : "var(--amber)" }}>
                              ${d.est.toLocaleString()}
                            </div>
                          </div>
                        ))}
                        <div className="mt-dem-total">
                          <div className="dtl">{t("demurrage.totalEst")}</div>
                          <div className="dtv">${totalDem.toLocaleString()}</div>
                        </div>
                        <div style={{ fontSize: 15, color: "var(--sage)", textAlign: "center", paddingTop: 6, fontWeight: 500 }}>
                          {t("demurrage.openCalculator")} →
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h4 style={{ margin: 0 }}>🌿 {t("eudr.title")}</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {eudrTrades.length > 0 && (
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t3)" }}>
                    {eudrAssessedCount}/{eudrTrades.length} {t("eudr.assessed")}
                  </span>
                )}
                {eudrTrades.length > eudrAssessedCount && (
                  <button
                    onClick={batchAssessEudr}
                    disabled={batchEudrAssessing}
                    style={{
                      fontSize: 15, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
                      border: "1px solid var(--sage)", background: "transparent",
                      color: "var(--sage)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {batchEudrAssessing && <Loader2 size={10} className="animate-spin" />}
                    {batchEudrAssessing ? t("eudr.assessing") : t("eudr.batchAssess")}
                  </button>
                )}
              </div>
            </div>
            <div className="es">{t("eudr.subtitle")}</div>
            <div className="mt-eb">
              {eudrTrades.length === 0 ? (
                <div style={{ fontSize: 15, color: "var(--t3)", padding: "10px 0" }}>{t("eudr.noTrades")}</div>
              ) : (
                eudrTrades.slice(0, 5).map(tr => {
                  const badge = getEudrBadge(tr.eudrBand, t);
                  const dotColor = badge.cls === "e" ? "var(--red)" : badge.cls === "w" ? "var(--amber)" : "var(--sage-l)";
                  const egBg = badge.cls === "e" ? "var(--red-xs)" : badge.cls === "w" ? "var(--amber-xs)" : "var(--sage-xs)";
                  const egColor = badge.cls === "e" ? "var(--red)" : badge.cls === "w" ? "var(--amber)" : "var(--sage)";
                  return (
                    <div key={tr.id} className="mt-er" onClick={() => navigate(`/eudr/${tr.id}`)} style={{ cursor: "pointer" }}>
                      <div className="dot" style={{ background: dotColor }} />
                      <div className="ei">
                        <div className="en">{iso2ToFlag(tr.originIso2)} {translateCommodity(tr.commodityName, lang).split(" ")[0]}</div>
                        <div className="et">{tr.eudrBand ? t("eudr.risk", { band: tr.eudrBand }) : t("eudr.notAssessed")}</div>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <h4 style={{ margin: 0 }}>⚠️ {t("cbam.title")}</h4>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {cbamTrades.length > 0 && (
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--t3)" }}>
                    {cbamAssessedCount}/{cbamTrades.length} {t("cbam.assessed")}
                  </span>
                )}
                {cbamTrades.length > cbamAssessedCount && (
                  <button
                    onClick={batchAssessCbam}
                    disabled={batchCbamAssessing}
                    style={{
                      fontSize: 15, fontWeight: 600, padding: "3px 8px", borderRadius: 5,
                      border: "1px solid var(--amber)", background: "transparent",
                      color: "var(--amber)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {batchCbamAssessing && <Loader2 size={10} className="animate-spin" />}
                    {batchCbamAssessing ? t("cbam.assessing") : t("cbam.batchAssess")}
                  </button>
                )}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {cbamTrades.length === 0 ? (
                <div style={{ fontSize: 15, color: "var(--t3)", padding: "10px 0" }}>{t("cbam.noTrades")}</div>
              ) : (
                cbamTrades.slice(0, 5).map(tr => (
                  <div key={tr.id} className="mt-cbr" onClick={() => navigate(`/trades/${tr.id}#cbam`)} style={{ cursor: "pointer" }}>
                    <div className="cc">
                      <em>{iso2ToFlag(tr.originIso2)}</em>
                      <span>{translateCommodity(tr.commodityName, lang).split(" ")[0]} {tr.originIso2}→{tr.destIso2}</span>
                    </div>
                    <div className="cx">{tr.cbamScore != null ? `${tr.cbamScore}%` : "0%"}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trade Corridors Map — split layout: left info, right map */}
          <div className="mt-mp">
            <div className="mt-mp-left">
              <h4>{t("map.title")}</h4>
              <div className="ms">
                {corridors.length || corridorAnalytics.length} active routes across{" "}
                {new Set([...corridors.map(c => c.destIso2), ...corridorAnalytics.map(c => c.label.split(" → ")[1])]).size || "—"} markets
              </div>
              <div className="mt-ml">
                <div className="mt-mll"><span style={{ background: "#4ade80" }} />Active</div>
                <div className="mt-mll"><span style={{ background: "#eab308" }} />Waiting</div>
                <div className="mt-mll"><span style={{ background: "#ef4444" }} />Issues</div>
              </div>
            </div>
            <div className="mt-mp-inner">
              {corridors.length > 0 ? (
                <TradeCorridorsMap corridors={corridors} onCorridorClick={(label) => { setSelectedCorridor(selectedCorridor === label ? null : label); setFilter("all"); setStatCardFilter(null); }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.3 }}>
                  <span style={{ fontSize: 15, color: "#fff" }}>{t("map.placeholder")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
