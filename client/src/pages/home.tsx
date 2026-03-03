import { Link } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CookieConsentBanner } from "@/components/cookie-consent";

/* ═══════════════════════════════════════════
   Readdy-inspired TapTrao Homepage
   Single file, inline sub-components
   ═══════════════════════════════════════════ */

/* ─── Colour constants ─── */
const C = {
  primary: "#0e4e45",
  primaryDark: "#0a3a33",
  primaryLight: "#1a6b5f",
  accent: "#5dd9c1",
  accentLight: "#7ee3cf",
  dark: "#1a2332",
  darkLight: "#2a3442",
  gold: "#F5A623",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
};

/* ═══════════════════════════════════════════
   Interactive Demo — 4-step auto-advancing carousel
   ═══════════════════════════════════════════ */
function DemoSection() {
  const [activeTab, setActiveTab] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const total = 4;

  const startTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveTab((s) => (s === total ? 1 : s + 1));
    }, 6000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, [startTimer]);

  const pause = () => clearInterval(timerRef.current);
  const resume = () => startTimer();

  const goTo = (n: number) => {
    setActiveTab(n);
    clearInterval(timerRef.current);
    startTimer();
  };

  const tabs = [
    { id: 1, label: "Enter trade" },
    { id: 2, label: "Pre-ship report" },
    { id: 3, label: "LC check" },
    { id: 4, label: "Supplier brief" },
  ];

  return (
    <div className="max-w-5xl mx-auto" onMouseEnter={pause} onMouseLeave={resume}>
      {/* Browser chrome */}
      <div
        className="rounded-t-2xl overflow-hidden"
        style={{ background: C.dark }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="flex-1 ml-4">
            <div
              className="text-xs px-3 py-1 rounded-md inline-block"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "monospace",
              }}
            >
              {activeTab <= 2
                ? "taptrao.com/lookup"
                : activeTab === 3
                  ? "taptrao.com/lc-check"
                  : "taptrao.com/lookup"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => goTo(tab.id)}
              className="flex-1 py-3 px-4 text-xs font-medium transition-all duration-200 border-b-2"
              style={{
                color:
                  activeTab === tab.id
                    ? C.accent
                    : "rgba(255,255,255,0.4)",
                borderColor:
                  activeTab === tab.id ? C.accent : "transparent",
                background:
                  activeTab === tab.id
                    ? "rgba(93,217,193,0.05)"
                    : "transparent",
              }}
            >
              {tab.id === 3 || tab.id === 4 ? `${tab.label} \u{1F6E1}\uFE0F` : tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="p-6 min-h-[380px]" style={{ background: C.dark }}>
          {/* STEP 1 — Enter Trade */}
          {activeTab === 1 && (
            <div>
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: C.white, fontFamily: "Nunito, sans-serif" }}
              >
                Compliance Lookup
              </h3>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                Enter your commodity, origin, and destination
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Commodity", value: "\u{1F95C} Raw Cashew Nuts" },
                  { label: "Origin Country", value: "\u{1F1E8}\u{1F1EE} Cote d'Ivoire" },
                  { label: "Destination", value: "\u{1F1EC}\u{1F1E7} United Kingdom" },
                ].map((field) => (
                  <div key={field.label}>
                    <div
                      className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {field.label}
                    </div>
                    <div
                      className="text-sm py-2.5 px-3 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => goTo(2)}
                className="text-sm font-semibold py-2.5 px-6 rounded-lg transition-colors"
                style={{ background: C.accent, color: C.primaryDark }}
              >
                Run Check &rarr;
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[
                  { label: "Lookups Run", value: "12", sub: "this month", color: C.accent },
                  { label: "LC Checks", value: "4", sub: "discrepancies caught", color: C.white },
                  { label: "Corridors", value: "3", sub: "saved", color: C.white },
                  { label: "Alerts", value: "2", sub: "new this week", color: C.gold },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {s.label}
                    </div>
                    <div className="text-xl font-bold" style={{ color: s.color, fontFamily: "Nunito, sans-serif" }}>
                      {s.value}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — Pre-Shipment Report */}
          {activeTab === 2 && (
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: C.white, fontFamily: "Nunito, sans-serif" }}>
                Pre-Shipment Report
              </h3>
              <p className="text-xs font-semibold mb-5" style={{ color: "rgba(255,255,255,0.85)" }}>
                {"\u{1F95C}"} Raw Cashew Nuts &rsaquo; {"\u{1F1E8}\u{1F1EE}"} Cote d'Ivoire &rsaquo; {"\u{1F1EC}\u{1F1E7}"} United Kingdom
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Buyer docs */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Your Side - Buyer</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(93,217,193,0.12)", color: C.accent }}>5 docs</span>
                  </div>
                  {[
                    { name: "Customs Declaration (CDS)", auth: "HMRC", ok: true },
                    { name: "IPAFFS Pre-notification", auth: "APHA", ok: true },
                    { name: "Port Health Inspection", auth: "Port Health", ok: true },
                    { name: "Import Licence (if >20MT)", auth: "HMRC RPA", ok: false },
                    { name: "Duty & VAT Payment", auth: "HMRC", ok: true },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center gap-2 py-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.ok ? "#5dd9c1" : C.gold }} />
                      <span className="text-xs flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{d.name}</span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{d.auth}</span>
                    </div>
                  ))}
                </div>

                {/* Supplier docs */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Their Side - Supplier</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(93,217,193,0.12)", color: C.accent }}>6 docs</span>
                  </div>
                  {[
                    { name: "Certificate of Origin", auth: "CCA (Conseil Anacarde)", ok: true },
                    { name: "Phytosanitary Certificate", auth: "LANADA / DPVCQ", ok: true },
                    { name: "Commercial Invoice", auth: "Supplier", ok: true },
                    { name: "Bill of Lading", auth: "Shipping Line", ok: true },
                    { name: "Aflatoxin Test Report", auth: "Accredited Lab", ok: false },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center gap-2 py-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.ok ? "#5dd9c1" : C.gold }} />
                      <span className="text-xs flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{d.name}</span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{d.auth}</span>
                    </div>
                  ))}
                </div>

                {/* Readiness Score */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Readiness Score</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#5dd9c1" }}>Low Risk</span>
                  </div>
                  <div className="text-4xl font-bold text-center my-2" style={{ color: C.accent, fontFamily: "Nunito, sans-serif" }}>87</div>
                  <div className="text-[10px] text-center uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Compliance Readiness</div>
                  <div className="h-2 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: "87%", background: `linear-gradient(90deg, ${C.accent}, #5dd9c1)` }} />
                  </div>
                  {[
                    ["Commodity risk", "LOW", "#5dd9c1"],
                    ["Origin risk", "LOW", "#5dd9c1"],
                    ["Regulatory complexity", "MEDIUM", C.gold],
                    ["Known hazards", "AFLATOXIN", C.gold],
                  ].map(([k, v, c]) => (
                    <div key={k} className="flex justify-between py-1">
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                      <span className="text-[11px] font-semibold" style={{ color: c }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Duty Estimate */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Duty Estimate</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.10)", color: "#5dd9c1" }}>GSP rate</span>
                  </div>
                  {[
                    ["MFN Tariff Rate", "0%"],
                    ["GSP Preference", "0% (eligible)"],
                    ["UK VAT (Import)", "20%"],
                    ["Est. duty on $50k", "$0"],
                    ["Est. VAT on $50k", "$10,000"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{k}</span>
                      <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between mt-3 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>TT-2026-a3f9c1</span>
                    <span className="text-[10px] font-mono" style={{ color: C.accent }}>sha256:a3f9c1...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — LC Document Check */}
          {activeTab === 3 && (
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: C.white, fontFamily: "Nunito, sans-serif" }}>
                LC Document Check
              </h3>
              <p className="text-xs font-semibold mb-5" style={{ color: "rgba(255,255,255,0.85)" }}>
                {"\u{1F4C4}"} LC Ref: LC-2026-UK-4821 &middot; {"\u{1F1E8}\u{1F1EE}"} Cote d'Ivoire &rarr; {"\u{1F1EC}\u{1F1E7}"} United Kingdom
              </p>

              {/* Verdict banner */}
              <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(245,166,35,0.08)", border: `1px solid rgba(245,166,35,0.2)` }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{"\u26A0\uFE0F"}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold" style={{ color: C.gold, fontFamily: "Nunito, sans-serif" }}>Discrepancies Found</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>2 critical issues will cause bank rejection. 1 warning to review.</div>
                  </div>
                  <div className="flex gap-4">
                    {[
                      { n: "8", label: "matched", color: "#5dd9c1" },
                      { n: "1", label: "warning", color: C.gold },
                      { n: "2", label: "critical", color: "#ef4444" },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-lg font-bold" style={{ color: s.color, fontFamily: "Nunito, sans-serif" }}>{s.n}</div>
                        <div className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Critical */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: "#ef4444" }}>
                    {"\u{1F534}"} Critical - Bank Will Reject
                  </div>
                  {[
                    {
                      field: "Beneficiary Name",
                      doc: "Commercial Invoice",
                      lc: "Ivory Coast Cashew Company Ltd",
                      docVal: "Ivory Coast Cashew Co.",
                      rule: "UCP 600 Art. 14(d) - Name must match exactly",
                    },
                    {
                      field: "Invoice Amount",
                      doc: "Commercial Invoice",
                      lc: "$50,000.00 (max)",
                      docVal: "$52,400.00",
                      rule: "UCP 600 Art. 18(b) - Must not exceed LC amount",
                    },
                  ].map((item, i) => (
                    <div key={item.field}>
                      {i > 0 && <div className="h-px my-2" style={{ background: "rgba(255,255,255,0.06)" }} />}
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#ef4444" }} />
                        <div>
                          <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{item.field}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.doc}</div>
                          <div className="text-[11px] mt-1">
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>LC: </span>
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>"{item.lc}"</span>
                            <span style={{ color: "rgba(255,255,255,0.3)" }}> &middot; Doc: </span>
                            <span style={{ color: "rgba(255,255,255,0.65)" }}>"{item.docVal}"</span>
                          </div>
                          <div className="text-[9px] mt-1 tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>{item.rule}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Warning + matches */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-xs font-semibold mb-3" style={{ color: C.gold }}>
                    {"\u{1F7E1}"} Warning
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: C.gold }} />
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Port of Loading</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Bill of Lading</div>
                      <div className="text-[11px] mt-1">
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>LC: </span>
                        <span style={{ color: "rgba(255,255,255,0.65)" }}>"Port of Abidjan"</span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}> &middot; Doc: </span>
                        <span style={{ color: "rgba(255,255,255,0.65)" }}>"Abidjan Terminal"</span>
                      </div>
                      <div className="text-[9px] mt-1 tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>UCP 600 Art. 20(a)(ii) - Partial match</div>
                    </div>
                  </div>

                  <div className="h-px my-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="text-xs font-semibold mb-2" style={{ color: "#5dd9c1" }}>
                    {"\u{1F7E2}"} Matched (8)
                  </div>
                  {["Currency (USD)", "Goods Description", "Shipment Date", "Port of Discharge", "Quantity", "Incoterms (CIF)"].map((f) => (
                    <div key={f} className="flex items-center gap-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#5dd9c1" }} />
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Supplier Brief */}
          {activeTab === 4 && (
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: C.white, fontFamily: "Nunito, sans-serif" }}>
                Supplier Brief
              </h3>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Ready to send - email or WhatsApp
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {"\u{1F4E7}"} Email Format
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <div className="font-semibold mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                      Subject: Required documents - Raw Cashew Nuts CIV &rarr; UK
                    </div>
                    Dear Supplier,<br /><br />
                    Please provide the following documents:<br /><br />
                    <span style={{ color: "rgba(255,255,255,0.8)" }}>
                      1. Certificate of Origin<br />
                      &nbsp;&nbsp;&rarr; <span style={{ color: C.accent }}>CCA (Conseil du Coton et de l'Anacarde)</span><br /><br />
                      2. Phytosanitary Certificate<br />
                      &nbsp;&nbsp;&rarr; <span style={{ color: C.accent }}>LANADA / DPVCQ</span><br /><br />
                      3. Aflatoxin Test Report<br />
                      &nbsp;&nbsp;&rarr; Accredited laboratory
                    </span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {"\u{1F4AC}"} WhatsApp Format
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <span className="font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>TapTrao Document Request</span><br />
                    Raw Cashew Nuts &middot; CIV &rarr; UK<br /><br />
                    Please send:<br />
                    {"\u2705"} Certificate of Origin<br />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>&nbsp;&nbsp;&nbsp;_(CCA - Conseil Anacarde)_</span><br />
                    {"\u2705"} Phytosanitary Certificate<br />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>&nbsp;&nbsp;&nbsp;_(LANADA/DPVCQ)_</span><br />
                    {"\u2705"} Aflatoxin Test Report
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  className="text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Copy Email
                </button>
                <button
                  className="text-xs font-semibold py-2 px-4 rounded-lg transition-colors"
                  style={{ background: "rgba(37,211,102,0.12)", color: "#25d366", border: "1px solid rgba(37,211,102,0.2)" }}
                >
                  Copy WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => goTo(n)}
            className="w-2 h-2 rounded-full transition-all duration-200"
            style={{
              background: activeTab === n ? C.accent : "rgba(255,255,255,0.2)",
              transform: activeTab === n ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
        <button
          onClick={() => goTo(activeTab === total ? 1 : activeTab + 1)}
          className="ml-3 text-xs font-medium py-1.5 px-4 rounded-full transition-colors"
          style={{ background: "rgba(93,217,193,0.12)", color: C.accent }}
        >
          {activeTab === total ? "Start over" : "Next step \u2192"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Homepage Component
   ═══════════════════════════════════════════ */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const [footerEmail, setFooterEmail] = useState("");
  const [footerSubmitted, setFooterSubmitted] = useState(false);
  const [footerLoading, setFooterLoading] = useState(false);

  usePageTitle("TapTrao \u2014 Trade Compliance for Commodity Traders");

  return (
    <div className="hp-page min-h-screen" style={{ background: C.gray50, fontFamily: "Nunito, sans-serif" }}>
      {/* ═══ NAVIGATION ═══ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: C.gray100,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="TapTrao" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-bold" style={{ color: C.primary }}>TapTrao</span>
            </Link>

            {/* Center: Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              <a
                href="#"
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{ background: `${C.primary}15`, color: C.primary }}
              >
                Home
              </a>

              {/* Menu dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-gray-100"
                  style={{ color: C.gray600 }}
                >
                  Menu
                  <ChevronDown
                    size={14}
                    className="transition-transform duration-200"
                    style={{ transform: menuDropdownOpen ? "rotate(180deg)" : "none" }}
                  />
                </button>
                {menuDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-xl border py-2 z-50"
                    style={{ background: C.white, borderColor: C.gray200 }}
                    onMouseLeave={() => setMenuDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5">
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.gray500 }}>Main</div>
                      <Link href="/dashboard" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>Dashboard</Link>
                      <Link href="/trades" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>My Trades</Link>
                      <Link href="/lookup" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>Pre-Shipment Check</Link>
                    </div>
                    <div className="h-px mx-3 my-1" style={{ background: C.gray100 }} />
                    <div className="px-3 py-1.5">
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.gray500 }}>Compliance</div>
                      <Link href="/inbox" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>Supplier Inbox</Link>
                      <Link href="/alerts" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>Alerts</Link>
                      <Link href="/templates" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>Templates</Link>
                    </div>
                    <div className="h-px mx-3 my-1" style={{ background: C.gray100 }} />
                    <div className="px-3 py-1.5">
                      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.gray500 }}>Tools</div>
                      <Link href="/lc-check" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>LC Document Check</Link>
                      <Link href="/demurrage" onClick={() => setMenuDropdownOpen(false)} className="block py-1.5 text-sm hover:text-teal-700" style={{ color: C.gray700 }}>Demurrage Calculator</Link>
                    </div>
                  </div>
                )}
              </div>

              <a href="#demo" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-gray-100" style={{ color: C.gray600 }}>
                Demo
              </a>
              <Link href="/lookup" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-gray-100" style={{ color: C.gray600 }}>
                Commodities
              </Link>
              <a href="#trust" className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-gray-100" style={{ color: C.gray600 }}>
                About
              </a>
            </div>

            {/* Right: Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-teal-700" style={{ color: C.gray600 }}>
                Pricing
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                  style={{ background: C.primary, color: C.white }}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium transition-colors hover:text-teal-700" style={{ color: C.gray600 }}>
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold py-2 px-5 rounded-full transition-colors"
                    style={{ background: C.primary, color: C.white }}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{ color: C.gray700 }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-2" style={{ background: C.white, borderColor: C.gray100 }}>
            <a href="#" className="block py-2 text-sm font-medium rounded-lg px-3" style={{ background: `${C.primary}15`, color: C.primary }}>Home</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium px-3" style={{ color: C.gray600 }}>How It Works</a>
            <a href="#demo" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium px-3" style={{ color: C.gray600 }}>Demo</a>
            <Link href="/lookup" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium px-3" style={{ color: C.gray600 }}>Commodities</Link>
            <a href="#trust" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium px-3" style={{ color: C.gray600 }}>About</a>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium px-3" style={{ color: C.gray600 }}>Pricing</Link>
            <div className="h-px my-2" style={{ background: C.gray100 }} />
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-center rounded-full" style={{ background: C.primary, color: C.white }}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium px-3" style={{ color: C.gray600 }}>Log In</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-center rounded-full" style={{ background: C.primary, color: C.white }}>
                  Create Account
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-16 min-h-[92vh] flex items-stretch overflow-hidden" style={{ background: C.white }}>
        {/* Left dark panel */}
        <div className="relative w-full lg:w-[52%] flex flex-col justify-center px-10 lg:px-16 py-20 lg:py-28 z-10" style={{ background: C.primary }}>
          {/* Subtle dot texture */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          {/* Accent glow blobs */}
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-[80px] pointer-events-none" style={{ background: C.accent, opacity: 0.2 }} />
          <div className="absolute -bottom-16 right-0 w-56 h-56 rounded-full blur-[60px] pointer-events-none" style={{ background: C.accent, opacity: 0.1 }} />

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8 tracking-wide" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.accent }} />
              SME Commodity Traders · Africa → EU · UK · USA · Canada · Türkiye · Switzerland
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] mb-6 tracking-tight" style={{ color: C.white }}>
              Know the rules.<br />
              <span style={{ color: C.accent }}>Avoid the loss.</span>
            </h1>

            <p className="text-lg lg:text-xl leading-relaxed mb-10 max-w-lg font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
              Run a free regulatory check in seconds. Activate TapTrao Shield to catch{" "}
              <span style={{ color: C.gold }} className="font-semibold">document gaps</span>,{" "}
              <span style={{ color: C.gold }} className="font-semibold">LC discrepancies</span>, and{" "}
              <span style={{ color: C.gold }} className="font-semibold">sanctions risks</span>{" "}
              — coverage runs until docking or bank presentation.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/lookup" className="px-8 py-4 font-extrabold rounded-full transition-all hover:scale-105 cursor-pointer text-center whitespace-nowrap text-lg" style={{ background: C.accent, color: C.primary, boxShadow: `0 8px 24px ${C.accent}40` }}>
                Free Pre-Shipment Check →
              </Link>
              <a href="#pricing" className="px-8 py-4 font-bold rounded-full transition-all cursor-pointer text-center whitespace-nowrap text-lg" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: C.white }}>
                See TapTrao Shield
              </a>
            </div>
          </div>
        </div>

        {/* Right light panel */}
        <div className="hidden lg:flex w-[48%] items-center justify-center px-12 py-20 relative overflow-hidden" style={{ background: C.gray50 }}>
          {/* Background blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full" style={{ background: `${C.accent}14` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full" style={{ background: `${C.primary}0d` }} />
          <div className="absolute top-8 right-8 w-24 h-24 rounded-full" style={{ background: `${C.accent}1a` }} />
          <div className="absolute bottom-12 left-8 w-16 h-16 rounded-full" style={{ background: `${C.primary}14` }} />

          <div className="relative w-full max-w-md">
            {/* Main card */}
            <div className="rounded-3xl shadow-2xl overflow-hidden" style={{ background: C.white, border: `1px solid ${C.gray100}` }}>
              {/* Card header — dark teal */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: C.primary }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.6)" }}>Pre-Shipment Report</p>
                  <p className="font-extrabold text-sm mt-0.5" style={{ color: C.white }}>{"\u{1F95C}"} Raw Cashew · CI → UK</p>
                </div>
                <span className="px-3 py-1 text-xs font-extrabold rounded-full" style={{ background: C.accent, color: C.primary }}>Live</span>
              </div>

              {/* Score row */}
              <div className="px-6 py-5 flex items-center gap-5" style={{ borderBottom: `1px solid ${C.gray100}` }}>
                <div className="text-center">
                  <div className="text-5xl font-extrabold" style={{ color: C.primary }}>87</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: C.gray500 }}>Readiness</div>
                </div>
                <div className="flex-1">
                  <div className="w-full h-2.5 rounded-full mb-3" style={{ background: C.gray100 }}>
                    <div className="h-2.5 rounded-full" style={{ width: "87%", background: C.accent }} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {[
                      { label: "Commodity risk", val: "LOW", color: "#059669" },
                      { label: "Origin risk", val: "LOW", color: "#059669" },
                      { label: "Regulatory", val: "MEDIUM", color: "#f59e0b" },
                      { label: "Hazard", val: "AFLATOXIN", color: "#f97316" },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between">
                        <span style={{ color: C.gray500 }}>{r.label}</span>
                        <span className="font-bold" style={{ color: r.color }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Docs list */}
              <div className="px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.gray500 }}>Required Documents</p>
                <div className="space-y-2">
                  {[
                    "Certificate of Origin",
                    "Phytosanitary Certificate",
                    "Aflatoxin Test Report",
                    "Bill of Lading",
                    "Packing List",
                  ].map((doc) => (
                    <div key={doc} className="flex items-center gap-3 text-xs">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0" style={{ background: "#dcfce7", color: "#16a34a" }}>✓</span>
                      <span className="font-medium" style={{ color: C.gray700 }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card footer */}
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: C.gray50, borderTop: `1px solid ${C.gray100}` }}>
                <span className="text-xs" style={{ color: C.gray500 }}>TT-2026-a3f9c1</span>
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ background: `${C.primary}15`, color: C.primary }}>Activate Shield →</span>
              </div>
            </div>

            {/* Floating badge — 2 min */}
            <div className="absolute -top-4 -right-4 rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2" style={{ background: C.white, border: `1px solid ${C.gray100}` }}>
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-sm font-extrabold" style={{ color: C.gray900 }}>2 min</p>
                <p className="text-xs" style={{ color: C.gray500 }}>Full report</p>
              </div>
            </div>

            {/* Floating trust pill — Sanctions: Clear */}
            <div className="absolute -top-6 left-6 rounded-full shadow-md px-4 py-2 flex items-center gap-2" style={{ background: "#ecfdf5", border: "1px solid #d1fae5" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
              <p className="text-xs font-bold" style={{ color: "#047857" }}>Sanctions: Clear</p>
            </div>

            {/* Flags row */}
            <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${C.gray200}` }}>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: C.gray500 }}>Supported trade routes</p>
              <div className="flex flex-wrap gap-2 text-2xl items-center">
                <span className="font-extrabold text-base" style={{ color: C.primary }}>Africa</span>
                <span className="font-bold text-sm mx-1" style={{ color: C.primary }}>→</span>
                {["\u{1F1EA}\u{1F1FA}", "\u{1F1EC}\u{1F1E7}", "\u{1F1E9}\u{1F1EA}", "\u{1F1EB}\u{1F1F7}", "\u{1F1EE}\u{1F1F9}", "\u{1F1E8}\u{1F1ED}", "\u{1F1FA}\u{1F1F8}", "\u{1F1E8}\u{1F1E6}", "\u{1F1F9}\u{1F1F7}"].map((f, i) => (
                  <span key={i} className="hover:scale-110 transition-transform cursor-default">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COST STRIP ═══ */}
      <section className="relative pt-4 pb-0" style={{ background: C.white }}>
        <div className="mx-4 sm:mx-8 lg:mx-16 text-white rounded-[2rem] overflow-hidden shadow-2xl relative" style={{ background: `linear-gradient(to right, ${C.gray900}, ${C.gray800}, ${C.gray900})` }}>
          {/* Decorative blobs */}
          <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full blur-[60px] pointer-events-none" style={{ background: `${C.accent}1a` }} />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full blur-[60px] pointer-events-none" style={{ background: `${C.primary}33` }} />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
              {[
                { value: "$75\u2013$300/day", label: "Demurrage while documents are on hold" },
                { value: "$95\u2013$160", label: "Bank fee for one LC discrepancy" },
                { value: "$5,000", label: "US ISF late-filing penalty (per violation)" },
                { value: "$1,500\u2013$3,000+", label: "Typical cascade cost from one missing document" },
              ].map((item) => (
                <div key={item.value} className="text-center group">
                  <div className="inline-block px-4 py-2 rounded-2xl mb-3 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: C.accent }}>
                      {item.value}
                    </div>
                  </div>
                  <div className="text-base leading-snug" style={{ color: C.gray300 }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-lg" style={{ color: C.gray300 }}>
                One missing document. $1,500–$3,000 gone. TapTrao Shield:{" "}
                <strong style={{ color: C.accent }}>$110</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how" className="py-24" style={{ background: C.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-4"
              style={{ background: `${C.primary}15`, color: C.primary }}
            >
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ color: C.gray900 }}>
              Start free. Step up{" "}
              <span style={{ color: C.primary }}>when it matters.</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: C.gray500 }}>
              The free Pre-Shipment Check tells you what regulations apply. TapTrao Shield tells you exactly what to do about them, and tracks it until docking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: "1",
                icon: "\u{1F4CB}",
                title: "Enter Your Trade",
                body: "Origin, destination, commodity. 54 African origins. EU, UK, USA, Canada, Türkiye, Switzerland. Free. No card required.",
              },
              {
                num: "2",
                icon: "\u{1F50D}",
                title: "Get Your Regulatory Snapshot",
                body: "Instantly see which rules apply to your corridor: EUDR, customs, sanctions, destination-specific requirements. This is your free preview.",
              },
              {
                num: "3",
                icon: "\u{1F6E1}\uFE0F",
                title: "Activate TapTrao Shield",
                body: "Turn the snapshot into protection. LC document checks, sanctions screening, supplier requests, deadlines, document scanning, and late-document alerts, monitored until docking. $110 per shipment.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="relative rounded-[2rem] p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "linear-gradient(135deg, #f0fdfa, #ffffff, #ecfdf5)",
                  border: "1px solid #ccfbf1",
                }}
              >
                {/* Floating step number bubble */}
                <div
                  className="absolute -top-5 left-8 w-10 h-10 rounded-full flex items-center justify-center text-base font-extrabold shadow-lg"
                  style={{ background: C.primary, color: C.white, boxShadow: `0 4px 12px ${C.primary}4d` }}
                >
                  {step.num}
                </div>
                <div className="text-5xl mb-5 text-center mt-2">{step.icon}</div>
                <h3 className="text-xl font-extrabold mb-3 text-center" style={{ color: C.gray900 }}>{step.title}</h3>
                <p className="text-base font-medium leading-relaxed text-center" style={{ color: C.gray700 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEMO SECTION ═══ */}
      <section id="demo" className="py-20 px-4" style={{ background: C.gray50 }}>
        <div className="max-w-6xl mx-auto text-center">
          <div
            className="inline-block text-[10px] uppercase tracking-widest font-bold mb-4 px-4 py-1.5 rounded-full"
            style={{ background: `${C.primary}10`, color: C.primary }}
          >
            See It In Action
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: C.dark }}>
            From free check to{" "}
            <span style={{ color: C.accent }}>TapTrao Shield</span>
          </h2>
          <p className="text-base max-w-xl mx-auto mb-12" style={{ color: C.gray500 }}>
            Three inputs. Seconds. No broker needed.
          </p>

          <DemoSection />

          <div className="mt-10">
            <Link
              href="/lookup"
              className="inline-flex items-center text-sm font-bold py-3 px-8 rounded-full transition-all duration-200 hover:shadow-lg"
              style={{ background: C.accent, color: C.primaryDark }}
            >
              Try It Yourself - Free
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ TRUST SECTION ═══ */}
      <section id="trust" className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #f0fdfa, #ffffff, #ecfdf5)" }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[80px] pointer-events-none" style={{ background: `${C.accent}33`, transform: "translate(33%, -50%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ background: `${C.primary}1a`, transform: "translate(-33%, 50%)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-4"
              style={{ background: `${C.primary}15`, color: C.primary }}
            >
              Why TapTrao Shield
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ color: C.gray900 }}>
              Why traders activate{" "}
              <span style={{ color: C.primary }}>TapTrao Shield</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: C.gray500 }}>
              We know the Africa–Europe corridor because we've lived it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: "\u{1F3AF}",
                title: "Knows what's actually in scope",
                body: "Cocoa triggers EUDR. Argan oil doesn't. TapTrao scopes by HS code, not guesswork.",
              },
              {
                icon: "\u{1F4C4}",
                title: "Catches LC problems before the bank does",
                body: "Cross-checks documents against UCP 600. Flags issues that cost $95–$160 every time they're missed.",
              },
              {
                icon: "\u26A1",
                title: "Turns risk into action",
                body: "Not just flags. Ready-to-send supplier requests and a clear fix list. Full corridor-specific report in under 2 minutes.",
              },
              {
                icon: "\u{1F30D}",
                title: "Built for your corridors",
                body: "54 African origins. EU, UK, USA, Canada, Türkiye, Switzerland. 90+ commodity chapters. Designed for real commodity trade, not theory.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                style={{ background: C.white, border: "1px solid #ccfbf1" }}
              >
                <div
                  className="w-14 h-14 flex items-center justify-center rounded-2xl text-3xl mb-5 group-hover:scale-110 transition-transform"
                  style={{ background: `${C.primary}14` }}
                >
                  {card.icon}
                </div>
                <h4 className="text-xl font-extrabold mb-3" style={{ color: C.gray900 }}>{card.title}</h4>
                <p className="text-sm leading-relaxed" style={{ color: C.gray500 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING SECTION ═══ */}
      <section id="pricing" className="relative py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #f9fafb, #ffffff, #f0fdfa)" }}>
        {/* Decorative blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-64 rounded-full blur-[80px] pointer-events-none" style={{ background: `${C.accent}1a` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span
              className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-4"
              style={{ background: `${C.primary}15`, color: C.primary }}
            >
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4" style={{ color: C.gray900 }}>
              Choose your level of{" "}
              <span style={{ color: C.primary }}>protection</span>
            </h2>
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: "Pre-Shipment Regulatory Check",
                price: "Free",
                meta: "Unlimited checks",
                per: "No card required",
                features: ["Regulatory overview by corridor", "EUDR, customs, sanctions scope", "Unlimited free checks"],
                cta: "Run a Free Check",
                link: "/lookup",
                featured: false,
              },
              {
                name: "LC Document Check",
                price: "$49.99",
                meta: "Standalone",
                per: "one-time",
                features: ["LC document scanning & data extraction", "UCP 600 consistency checks", "Discrepancy summary & fix suggestions"],
                note: "Included free with every TapTrao Shield activation",
                cta: "Check LC — $49.99",
                link: "/pricing",
                featured: false,
              },
              {
                name: "\u{1F6E1}\uFE0F TapTrao Shield: Single",
                price: "$110",
                meta: "1 Shipment",
                per: "per shipment",
                features: [
                  "Everything in the free check, PLUS:",
                  "LC document scanning & data extraction",
                  "LC document consistency checks (UCP 600)",
                  "Sanctions & enhanced risk flags",
                  "EUDR scope & due-diligence triggers",
                  "Pre-built supplier document requests",
                  "Required documents checklist with deadlines",
                  "Late-document alerts until docking",
                ],
                cta: "Activate TapTrao Shield",
                link: "/pricing",
                featured: false,
              },
              {
                name: "\u{1F6E1}\uFE0F TapTrao Shield: 3-Pack",
                price: "$299",
                meta: "3 Shipments",
                per: "$100 per check",
                badge: "Most Popular",
                features: ["Everything in a single Shield check", "Best for 1–3 shipments per month"],
                cta: "Activate 3-Pack",
                link: "/pricing",
                featured: true,
              },
              {
                name: "\u{1F6E1}\uFE0F TapTrao Shield: 5-Pack",
                price: "$475",
                meta: "5 Shipments",
                per: "$95 per check",
                features: ["Everything in a single Shield check", "Best for regular corridors & repeat shipments"],
                cta: "Activate 5-Pack",
                link: "/pricing",
                featured: false,
              },
              {
                name: "\u{1F6E1}\uFE0F Volume",
                price: "Custom",
                meta: "10+ shipments/month",
                per: "Custom pricing",
                features: ["Everything in a single Shield check", "Package built around your corridors"],
                cta: "Contact Us",
                link: "mailto:hello@taptrao.com",
                featured: false,
                external: true,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-[2rem] p-8 transition-all duration-300 ${
                  plan.featured
                    ? "shadow-2xl scale-105 text-white"
                    : "hover:shadow-xl hover:-translate-y-1"
                }`}
                style={
                  plan.featured
                    ? { background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, border: `2px solid ${C.primary}`, boxShadow: `0 8px 32px ${C.primary}4d` }
                    : { background: C.white, border: "2px solid #2dd4bf" }
                }
              >
                {plan.badge && (
                  <div
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 text-xs font-extrabold rounded-full whitespace-nowrap shadow-md"
                    style={{ background: C.accent, color: C.primary }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="text-base font-extrabold mb-3" style={{ color: plan.featured ? C.white : C.gray900 }}>
                  {plan.name}
                </div>

                <div className="text-4xl font-extrabold mb-1" style={{ color: plan.featured ? C.accent : C.gray900 }}>
                  {plan.price}
                </div>

                <div className="text-sm font-semibold mb-0.5" style={{ color: plan.featured ? "rgba(255,255,255,0.8)" : C.gray500 }}>
                  {plan.meta}
                </div>

                <div className="text-xs mb-7" style={{ color: plan.featured ? "rgba(255,255,255,0.5)" : C.gray500 }}>
                  {plan.per}
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm font-bold" style={{ color: plan.featured ? "rgba(255,255,255,0.9)" : C.gray700 }}>
                      <span className="flex-shrink-0 font-bold" style={{ color: plan.featured ? C.accent : C.primary }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.note && (
                  <div className="text-xs italic mb-5 p-3 rounded-2xl" style={{ color: C.gray500, background: C.gray50 }}>
                    {plan.note}
                  </div>
                )}

                {plan.external ? (
                  <a
                    href={plan.link}
                    className="block w-full py-3 text-center font-bold rounded-full transition-all cursor-pointer whitespace-nowrap text-sm"
                    style={{ border: `2px solid ${C.primary}`, color: C.primary }}
                  >
                    {plan.cta}
                  </a>
                ) : (
                  <Link
                    href={plan.link}
                    className="block w-full py-3 text-center font-bold rounded-full transition-all cursor-pointer whitespace-nowrap text-sm"
                    style={
                      plan.featured
                        ? { background: C.accent, color: C.primary, boxShadow: `0 4px 16px ${C.accent}4d` }
                        : { border: `2px solid ${C.primary}`, color: C.primary }
                    }
                  >
                    {plan.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="text-center text-xs mb-16" style={{ color: C.gray500 }}>
            Not legal advice. No guarantee of bank or customs acceptance.
          </div>

          {/* ═══ BOTTOM CTA BANNER ═══ */}
          <div
            className="rounded-[2rem] p-12 text-center text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-[60px] pointer-events-none" style={{ background: "rgba(255,255,255,0.05)" }} />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-[60px] pointer-events-none" style={{ background: `${C.accent}1a` }} />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4" style={{ color: C.white }}>
                The free check shows the risk.
                <br />
                <span style={{ color: C.accent }}>TapTrao Shield helps you fix it in time.</span>
              </h2>
              <p className="text-lg font-medium mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
                One missing document can cost thousands. TapTrao Shield costs $110.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/lookup"
                  className="w-full sm:w-auto px-9 py-4 font-extrabold rounded-full transition-all transform hover:scale-105 cursor-pointer text-center whitespace-nowrap"
                  style={{ background: C.accent, color: C.primary, boxShadow: `0 8px 24px ${C.accent}4d` }}
                >
                  Free Pre-Shipment Check
                </Link>
                <a
                  href="#pricing"
                  className="w-full sm:w-auto px-9 py-4 font-extrabold rounded-full transition-all cursor-pointer text-center whitespace-nowrap"
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: C.white }}
                >
                  Activate TapTrao Shield: $110
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COMING SOON ═══ */}
      <section style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfdf5)", paddingTop: 48, paddingBottom: 0 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-lg font-bold mb-2" style={{ color: C.gray900 }}>Coming Soon</h3>
          <p className="text-center text-sm mb-8" style={{ color: C.gray500 }}>We're building more tools for commodity traders.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pb-8">
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #ccfbf1" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold" style={{ color: C.gray900 }}>Pro Monitoring</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "rgba(234,179,8,0.12)", color: "#b45309" }}>Coming Soon</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.gray500 }}>
                Regulatory change alerts and compliance calendar. For frequent shippers.
              </p>
            </div>
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid #ccfbf1" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold" style={{ color: C.gray900 }}>Public API</span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "rgba(234,179,8,0.12)", color: "#b45309" }}>Coming Soon</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.gray500 }}>
                Integrate compliance checks directly into your systems via REST API.
              </p>
            </div>
          </div>

          {/* Email capture */}
          <div className="max-w-md mx-auto pb-8">
            <p className="text-center text-sm mb-3" style={{ color: C.gray500 }}>
              Get notified when new features launch:
            </p>
            {footerSubmitted ? (
              <p className="text-sm text-center font-medium" style={{ color: C.primary }}>
                Thanks! We'll keep you posted.
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!footerEmail) return;
                  setFooterLoading(true);
                  try {
                    await fetch("/api/leads", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ email: footerEmail, source: "footer_signup" }),
                    });
                    setFooterSubmitted(true);
                    if (typeof (window as any).gtag === "function") {
                      const utm = JSON.parse(sessionStorage.getItem("taptrao_utm") || "{}");
                      (window as any).gtag("event", "lead_captured", { source: "footer_signup", ...utm });
                    }
                  } catch {} finally { setFooterLoading(false); }
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={footerEmail}
                  onChange={(e) => setFooterEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                  style={{ background: "rgba(255,255,255,0.8)", border: "1px solid #ccfbf1", color: C.gray900 }}
                  data-testid="input-footer-email"
                />
                <button
                  type="submit"
                  disabled={footerLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: C.primary, color: "#fff" }}
                  data-testid="button-footer-notify"
                >
                  {footerLoading ? "..." : "Notify Me"}
                </button>
                <p className="text-[11px] text-center mt-2 w-full" style={{ color: C.gray500 }}>
                  By submitting, you agree to our{" "}
                  <Link href="/privacy-policy" className="underline" style={{ color: C.gray600 }}>Privacy Policy</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfdf5)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          {/* Disclaimer card */}
          <div
            className="rounded-3xl px-8 py-6 text-center mb-10"
            style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid #ccfbf1" }}
          >
            <p className="text-sm max-w-3xl mx-auto leading-relaxed" style={{ color: C.gray500 }}>
              TapTrao provides automated trade and document screening for informational purposes only. Results do not constitute legal, regulatory, or banking advice and do not guarantee acceptance by authorities or financial institutions.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="TapTrao" className="h-9 w-9 rounded-full shadow-sm" />
              <div>
                <div className="text-sm font-extrabold" style={{ color: C.gray900 }}>TapTrao</div>
                <div className="text-xs" style={{ color: C.gray500 }}>&copy; 2026 FATRAO LIMITED · Trade compliance for commodity traders</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {[
                { label: "Privacy", href: "/privacy-policy", isRoute: true },
                { label: "Terms", href: "/terms-of-service", isRoute: true },
                { label: "Contact", href: "mailto:hello@taptrao.com", isRoute: false },
                { label: "Docs", href: "#", isRoute: false },
              ].map((item, i) =>
                item.isRoute ? (
                  <Link
                    key={i}
                    href={item.href}
                    className="px-4 py-1.5 text-sm font-semibold rounded-full transition-colors hover:bg-white"
                    style={{ color: C.gray600 }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={i}
                    href={item.href}
                    className="px-4 py-1.5 text-sm font-semibold rounded-full transition-colors hover:bg-white"
                    style={{ color: C.gray600 }}
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ COOKIE BANNER ═══ */}
      <CookieConsentBanner />
    </div>
  );
}
