import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { getAvatarColour } from "@/lib/avatarColours";
import { usePageTitle } from "@/hooks/use-page-title";
import { iso2ToFlag } from "@/components/CountryFlagBadge";

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
  lcVerdict: string | null;
  lcCheckId: string | null;
};

type TradesSummary = {
  total: number;
  needAttention: number;
  lcPending: number;
  archiveReady: number;
};

type FilterTab = "all" | "attention" | "progress" | "archived";

function getStep(trade: EnrichedTrade): { label: string; color: string } {
  if (!trade.lcVerdict) return { label: "Paperwork review", color: "var(--t3)" };
  if (trade.lcVerdict === "DISCREPANCIES_FOUND") return { label: "LC review", color: "var(--blue)" };
  if (trade.lcVerdict === "COMPLIANT" || trade.lcVerdict === "COMPLIANT_WITH_NOTES") return { label: "TwinLog Trail", color: "var(--amber)" };
  return { label: "Paperwork review", color: "var(--t3)" };
}

function getRiskTag(verdict: string | null) {
  if (verdict === "RED") return { symbol: "\u2297", label: "Blocking", color: "var(--red)", bg: "var(--rbg)", bd: "var(--rbd)" };
  if (verdict === "AMBER") return { symbol: "\u25CF", label: "At risk \u2014 review documents", color: "var(--amber)", bg: "var(--abg)", bd: "var(--abd)" };
  if (verdict === "GREEN") return { symbol: "\u2713", label: "Clear", color: "var(--green)", bg: "var(--gbg)", bd: "var(--gbd)" };
  return { symbol: "\u25CF", label: "Review", color: "var(--amber)", bg: "var(--abg)", bd: "var(--abd)" };
}

function formatDate(d: string | Date) {
  const date = new Date(d);
  const day = date.getDate();
  const month = date.toLocaleString("en-GB", { month: "short" });
  const hours = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} \u00B7 ${hours}:${mins}`;
}

export default function Trades() {
  usePageTitle("My Trades", "All your compliance checks and LC reviews in one place");
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");

  // Parse URL filter param on mount (e.g., /trades?filter=attention)
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const urlFilter = params.get("filter");
    if (urlFilter && ["all", "attention", "progress", "archived"].includes(urlFilter)) {
      setFilter(urlFilter as FilterTab);
    }
  }, []);

  const summaryQuery = useQuery<TradesSummary>({ queryKey: ["/api/trades/summary"] });
  const tradesQuery = useQuery<EnrichedTrade[]>({ queryKey: ["/api/trades"] });

  const summary = summaryQuery.data ?? { total: 0, needAttention: 0, lcPending: 0, archiveReady: 0 };
  const allTrades = tradesQuery.data ?? [];

  const filtered = useMemo(() => {
    let list = allTrades;
    if (filter === "attention") list = list.filter(t => t.readinessVerdict === "RED" || t.readinessVerdict === "AMBER");
    if (filter === "progress") list = list.filter(t => t.readinessVerdict !== "RED" && t.readinessVerdict !== "AMBER");
    if (filter === "archived") {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      list = list.filter(t => new Date(t.createdAt).getTime() < thirtyDaysAgo);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.commodityName.toLowerCase().includes(q) ||
        t.originIso2.toLowerCase().includes(q) ||
        t.destIso2.toLowerCase().includes(q) ||
        t.originName.toLowerCase().includes(q) ||
        t.destName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allTrades, filter, search]);

  const filters: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All shipments" },
    { key: "attention", label: "Needs action" },
    { key: "progress", label: "In progress" },
    { key: "archived", label: "Closed" },
  ];

  const cards = [
    { value: summary.total, color: "var(--blue)", label: "Active shipments", gradient: false },
    { value: summary.needAttention, color: "var(--red)", label: "Action required", gradient: true },
    { value: summary.lcPending, color: "var(--amber)", label: "LC checks pending", gradient: false },
    { value: summary.archiveReady, color: "var(--green)", label: "Ready to close", gradient: false },
  ];

  return (
    <AppShell>
      <div style={{ padding: "32px 40px 0" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1
              style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, letterSpacing: "0", color: "var(--t1)", margin: 0, lineHeight: 1.1 }}
              data-testid="text-trades-title"
            >
              My Trades
            </h1>
            <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 6 }} data-testid="text-trades-subtitle">
              {summary.total} active shipments &middot; {summary.needAttention} needs attention
            </p>
          </div>
          <Link href="/lookup">
            <button
              style={{
                background: "var(--blue)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
              data-testid="button-new-lookup"
            >
              + Start a new compliance check
            </button>
          </Link>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2, marginBottom: 28 }} data-testid="summary-cards">
          {cards.map((c, i) => (
            <div
              key={c.label}
              style={{
                background: c.gradient
                  ? `linear-gradient(135deg, rgba(218,60,61,.05), transparent 60%), var(--card)`
                  : "var(--card)",
                padding: "20px 22px",
                borderRadius:
                  i === 0 ? "14px 0 0 14px" :
                  i === cards.length - 1 ? "0 14px 14px 0" : "0",
              }}
              data-testid={`summary-card-${i}`}
            >
              <div style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 36, letterSpacing: 0, lineHeight: 1, color: c.color }}>
                {c.value}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)", letterSpacing: ".04em", marginTop: 4 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }} data-testid="filter-bar">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              data-testid={`filter-${f.key}`}
              style={{
                background: filter === f.key ? "var(--blue-dim)" : "transparent",
                border: `1px solid ${filter === f.key ? "var(--blue-bd)" : "var(--s5)"}`,
                color: filter === f.key ? "var(--blue)" : "var(--t2)",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
          <input
            type="text"
            placeholder="Search commodity, corridor\u2026"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-trades"
            style={{
              marginLeft: "auto",
              background: "var(--card2)",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              width: 220,
              color: "var(--t1)",
              outline: "none",
            }}
          />
        </div>

        {/* TABLE OR EMPTY STATE */}
        {tradesQuery.isLoading ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>Loading trades...</div>
        ) : filtered.length === 0 && allTrades.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 20, color: "var(--t2)" }}>No trades yet.</div>
            <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 8 }}>Run your first compliance lookup to get started.</div>
            <Link href="/lookup">
              <button
                style={{
                  background: "var(--blue)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 20,
                }}
                data-testid="button-empty-new-lookup"
              >
                + Start a new compliance check
              </button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--t2)", fontSize: 14 }}>No trades match your filter.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }} data-testid="trades-table">
            <thead>
              <tr>
                {["Commodity \u00B7 Corridor", "Step", "Risk", "Score", "Updated", ""].map(h => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                      color: "var(--t3)",
                      fontWeight: 400,
                      textAlign: h === "Score" || h === "Updated" ? "right" : "left",
                      padding: "0 12px 10px",
                      borderBottom: "1px solid var(--s5)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trade, idx) => {
                const step = getStep(trade);
                const risk = getRiskTag(trade.readinessVerdict);
                const avatar = getAvatarColour(trade.originIso2);
                return (
                  <tr
                    key={trade.id}
                    data-testid={`trade-row-${trade.id}`}
                    style={{
                      cursor: "pointer",
                      animation: `fadeUp .35s ease both`,
                      animationDelay: `${idx * 40}ms`,
                    }}
                    onClick={() => {
                      if (trade.lcVerdict === "COMPLIANT" || trade.lcVerdict === "COMPLIANT_WITH_NOTES") {
                        // LC passed — go to LC check page (TwinLog tab available)
                        navigate(`/lookup?lookupId=${trade.id}`);
                      } else {
                        // No LC or discrepancies — go to LC check
                        const prefill = {
                          lookup_id: trade.id,
                          commodity_name: trade.commodityName,
                          hs_code: trade.hsCode,
                          origin_iso2: trade.originIso2,
                          origin_name: trade.originName,
                          dest_iso2: trade.destIso2,
                          dest_name: trade.destName,
                          incoterms: "FOB",
                          required_docs: [],
                        };
                        sessionStorage.setItem("lc_prefill", JSON.stringify(prefill));
                        navigate("/lc-check");
                      }
                    }}
                    onMouseEnter={e => {
                      Array.from(e.currentTarget.querySelectorAll("td")).forEach(td => {
                        (td as HTMLElement).style.background = "var(--s2)";
                      });
                      const openEl = e.currentTarget.querySelector("[data-open]") as HTMLElement;
                      if (openEl) openEl.style.opacity = "1";
                    }}
                    onMouseLeave={e => {
                      Array.from(e.currentTarget.querySelectorAll("td")).forEach(td => {
                        (td as HTMLElement).style.background = "";
                      });
                      const openEl = e.currentTarget.querySelector("[data-open]") as HTMLElement;
                      if (openEl) openEl.style.opacity = "0";
                    }}
                  >
                    {/* Commodity · Corridor */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: avatar.bg,
                            border: `1px solid ${avatar.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            fontWeight: 800,
                            color: avatar.text,
                            flexShrink: 0,
                          }}
                        >
                          {trade.originIso2}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)" }}>{trade.commodityName}</div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)" }}>
                            {iso2ToFlag(trade.originIso2)} {trade.originIso2} → {iso2ToFlag(trade.destIso2)} {trade.destIso2}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Step */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: step.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: step.color }}>{step.label}</span>
                      </div>
                    </td>
                    {/* Risk */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle" }}>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 9,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: risk.bg,
                          border: `1px solid ${risk.bd}`,
                          color: risk.color,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {risk.symbol} {risk.label}
                      </span>
                    </td>
                    {/* Score */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle", textAlign: "right" }}>
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 14,
                          fontWeight: 700,
                          color: trade.readinessScore == null
                            ? "var(--t3)"
                            : trade.readinessScore < 50
                              ? "var(--red)"
                              : trade.readinessScore < 80
                                ? "var(--amber)"
                                : "var(--green)",
                        }}
                      >
                        {trade.readinessScore == null
                          ? "\u2014"
                          : trade.readinessScore < 50
                            ? `High risk (${trade.readinessScore})`
                            : trade.readinessScore < 80
                              ? `Medium risk (${trade.readinessScore})`
                              : `Low risk (${trade.readinessScore})`}
                      </span>
                    </td>
                    {/* Updated */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle", textAlign: "right" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "var(--t3)" }}>
                        {formatDate(trade.createdAt)}
                      </span>
                    </td>
                    {/* Action link */}
                    <td style={{ padding: "12px 12px", verticalAlign: "middle", textAlign: "right" }}>
                      <span
                        data-open
                        style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)", opacity: 0, transition: "opacity .15s", whiteSpace: "nowrap" }}
                      >
                        {!trade.lcVerdict ? "Continue review →" : trade.lcVerdict === "DISCREPANCIES_FOUND" ? "Review LC →" : "View checklist →"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

      </div>

      {/* WHITE ZONE — fades from gradient to white below the trade table */}
      <div style={{
        background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.5) 8%, rgba(255,255,255,0.85) 20%, #ffffff 35%)",
        padding: "80px 40px 200px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#444", margin: 0, fontWeight: 600 }}>
            {allTrades.length} shipment{allTrades.length !== 1 ? "s" : ""} total &middot; Data refreshed on each visit
          </p>
          <p style={{ fontSize: 13, color: "#777", marginTop: 10, lineHeight: 1.6 }}>
            TapTrao does not provide legal or banking advice. Reports are informational and designed to support internal decision-making.
          </p>
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            <Link href="/lookup">
              <span style={{ fontSize: 13, color: "#6b9080", fontWeight: 600, cursor: "pointer" }}>+ New compliance check</span>
            </Link>
            <Link href="/templates">
              <span style={{ fontSize: 13, color: "#6b9080", fontWeight: 600, cursor: "pointer" }}>Saved templates</span>
            </Link>
            <Link href="/alerts">
              <span style={{ fontSize: 13, color: "#6b9080", fontWeight: 600, cursor: "pointer" }}>Alerts</span>
            </Link>
          </div>
          <p style={{ fontSize: 11, color: "#aaa", marginTop: 48 }}>
            Fatrao Limited — Registered in England and Wales
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
