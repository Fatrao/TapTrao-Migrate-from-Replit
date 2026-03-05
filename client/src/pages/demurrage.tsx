import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/AppShell";
import { PORTS, CONTAINER_OPTIONS, computeDemurrage, type ContainerType } from "@/lib/demurrage-utils";

const s = {
  page: { maxWidth: 960, margin: "0 auto", padding: "28px 20px" } as React.CSSProperties,
  panel: { background: "var(--card)", borderRadius: 14, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.03), 0 4px 16px rgba(0,0,0,.05)" } as React.CSSProperties,
  label: { fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--t3)", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: ".08em" } as React.CSSProperties,
  helper: { fontSize: 13, color: "var(--t3)", marginTop: 3 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: ".5rem", color: "var(--t1)", fontSize: 14, outline: "none" } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: ".5rem", color: "var(--t1)", fontSize: 14, outline: "none", appearance: "none" as const } as React.CSSProperties,
  field: { marginBottom: 16 } as React.CSSProperties,
};

export default function DemurragePage() {
  const { t } = useTranslation("demurrage");
  const [portIdx, setPortIdx] = useState(0);
  const [container, setContainer] = useState<ContainerType>("20ft");
  const [freeDays, setFreeDays] = useState(7);
  const [daysHeld, setDaysHeld] = useState(0);
  const [useDate, setUseDate] = useState(false);
  const [arrivalDate, setArrivalDate] = useState("");
  const [cargoValue, setCargoValue] = useState("");

  const effectiveDaysHeld = useMemo(() => {
    if (useDate && arrivalDate) {
      const arrival = new Date(arrivalDate);
      const now = new Date();
      const diff = Math.floor((now.getTime() - arrival.getTime()) / 86400000);
      return Math.max(diff, 0);
    }
    return daysHeld;
  }, [useDate, arrivalDate, daysHeld]);

  const port = PORTS[portIdx];
  const baseRate = port.rates[container];
  const chargeableDays = Math.max(effectiveDaysHeld - freeDays, 0);
  const { tiers, total } = computeDemurrage(baseRate, chargeableDays);
  const cargoVal = parseFloat(cargoValue) || 0;
  const pct = cargoVal > 0 ? (total / cargoVal) * 100 : 0;

  const totalColor = total > 5000 ? "var(--red)" : total >= 1000 ? "var(--amber)" : "var(--green)";

  return (
    <AppShell>
      <div style={s.page}>
        <h1
          style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, letterSpacing: "0", color: "var(--t1)", marginBottom: 4 }}
          data-testid="demurrage-title"
        >
          {t("title")}
        </h1>
        <p style={{ fontFamily: "var(--fb)", fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>
          {t("subtitle")}
        </p>

        <div className="demurrage-grid">
          {/* INPUT PANEL */}
          <div style={s.panel}>
            <div style={s.field}>
              <label style={s.label}>{t("port")}</label>
              <select
                data-testid="demurrage-port"
                style={s.select}
                value={portIdx}
                onChange={e => setPortIdx(Number(e.target.value))}
              >
                {PORTS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("containerType")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {CONTAINER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    data-testid={`demurrage-container-${opt.value}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                      background: container === opt.value ? "var(--blue-dim)" : "var(--card2)",
                      border: container === opt.value ? "1px solid var(--blue-bd)" : "none",
                      color: container === opt.value ? "var(--blue)" : "var(--t2)",
                      fontSize: 14, fontWeight: container === opt.value ? 700 : 500,
                      transition: "all .15s",
                    }}
                  >
                    <input
                      type="radio"
                      name="container"
                      checked={container === opt.value}
                      onChange={() => setContainer(opt.value)}
                      style={{ display: "none" }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("freeDays")}</label>
              <input
                data-testid="demurrage-free-days"
                type="number"
                min={0}
                max={30}
                style={s.input}
                value={freeDays}
                onChange={e => setFreeDays(Math.min(30, Math.max(0, Number(e.target.value))))}
              />
              <p style={s.helper}>{t("freeDaysHelper")}</p>
            </div>

            <div style={s.field}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>
                  {useDate ? t("arrivalDate") : t("daysHeld")}
                </label>
                <button
                  data-testid="demurrage-toggle-date"
                  onClick={() => setUseDate(!useDate)}
                  style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 13, cursor: "pointer", fontWeight: 600 }}
                >
                  {useDate ? t("enterManually") : t("calcFromDate")}
                </button>
              </div>
              {useDate ? (
                <input
                  data-testid="demurrage-arrival-date"
                  type="date"
                  style={s.input}
                  value={arrivalDate}
                  onChange={e => setArrivalDate(e.target.value)}
                />
              ) : (
                <input
                  data-testid="demurrage-days-held"
                  type="number"
                  min={0}
                  style={s.input}
                  value={daysHeld}
                  onChange={e => setDaysHeld(Math.max(0, Number(e.target.value)))}
                />
              )}
            </div>

            <div style={s.field}>
              <label style={s.label}>{t("cargoValue")}</label>
              <input
                data-testid="demurrage-cargo-value"
                type="number"
                min={0}
                style={s.input}
                value={cargoValue}
                onChange={e => setCargoValue(e.target.value)}
                placeholder={t("optional")}
              />
              <p style={s.helper}>{t("cargoValueHelper")}</p>
            </div>

            <button
              data-testid="demurrage-calculate"
              style={{
                width: "100%",
                background: "var(--sage)",
                color: "#fff",
                border: "none",
                borderRadius: ".5rem",
                padding: "12px 24px",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              {t("calculate")}
            </button>
          </div>

          {/* RESULTS PANEL */}
          <div>
            <div style={s.panel}>
              <div className="demurrage-stats-grid">
                <div style={{ textAlign: "center", padding: 12, background: "var(--card2)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--t1)" }} data-testid="demurrage-chargeable-days">
                    {chargeableDays}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--t3)" }}>{t("billableDays")}</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "var(--card2)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--t1)" }} data-testid="demurrage-daily-rate">
                    ${baseRate}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--t3)" }}>{t("dailyRate")}</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "var(--card2)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 700, color: "var(--t1)" }}>
                    {effectiveDaysHeld}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--t3)" }}>{t("daysAtPort")}</div>
                </div>
              </div>

              {/* Cost breakdown */}
              {tiers.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>{t("costBreakdown")}</div>
                  <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--s5)" }}>
                        <th style={{ textAlign: "left", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>{t("period")}</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>{t("days")}</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>{t("ratePerDay")}</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>{t("subtotal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((t, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--s5)" }}>
                          <td style={{ padding: "8px 0", color: "var(--t2)" }}>{t.label}</td>
                          <td style={{ textAlign: "right", padding: "8px 0", color: "var(--t1)", fontFamily: "'Inter', sans-serif" }}>{t.days}</td>
                          <td style={{ textAlign: "right", padding: "8px 0", color: "var(--t2)", fontFamily: "'Inter', sans-serif" }}>${t.rate}</td>
                          <td style={{ textAlign: "right", padding: "8px 0", color: "var(--t1)", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>${t.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--t3)", fontSize: 13 }}>
                  {t("noChargeableDays")}
                </div>
              )}

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", background: "var(--card2)", borderRadius: 8, marginBottom: 12,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>{t("totalDemurrage")}</span>
                <span
                  data-testid="demurrage-total"
                  style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, color: totalColor }}
                >
                  ${total.toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--t3)", textAlign: "right", marginTop: -8, marginBottom: 12, fontStyle: "italic" }}>{t("basedOnInputs")}</p>

              {cargoVal > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: pct > 5 ? "var(--red)" : "var(--t2)" }} data-testid="demurrage-pct">
                    {t("pctOfCargo", { pct: pct.toFixed(1) })}
                  </span>
                  {pct > 5 && (
                    <p style={{ fontSize: 13, color: "var(--red)", marginTop: 4 }}>
                      {t("pctWarning")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Decision nudge */}
            <div style={{ ...s.panel, marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 12 }}>
                {t("nextStep")}
              </div>
              <div className="demurrage-nudge-grid">
                <div style={{ background: "var(--card2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>{t("reExport")}</div>
                  <div style={{ fontSize: 13, color: "var(--t2)" }}>{t("reExportDesc")}</div>
                </div>
                <div style={{ background: "var(--card2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>{t("destruction")}</div>
                  <div style={{ fontSize: 13, color: "var(--t2)" }}>{t("destructionDesc")}</div>
                </div>
                <div style={{ background: "var(--card2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>{t("appealRetest")}</div>
                  <div style={{ fontSize: 13, color: "var(--t2)" }}>{t("appealRetestDesc")}</div>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--t3)", marginTop: 12, lineHeight: 1.5 }}>
                {t("ratesNote")}
              </p>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 13, color: "var(--t3)", marginTop: 16, lineHeight: 1.5 }}>
              {t("disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
