import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { PORTS, CONTAINER_OPTIONS, computeDemurrage, type ContainerType } from "@/lib/demurrage-utils";

const s = {
  page: { maxWidth: 960, margin: "0 auto", padding: "28px 20px" } as React.CSSProperties,
  panel: { background: "var(--card)", borderRadius: 14, padding: 24 } as React.CSSProperties,
  label: { fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, color: "var(--t3)", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: ".08em" } as React.CSSProperties,
  helper: { fontSize: 11, color: "var(--t3)", marginTop: 3 } as React.CSSProperties,
  input: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "none", borderRadius: ".5rem", color: "var(--t1)", fontSize: 14, outline: "none" } as React.CSSProperties,
  select: { width: "100%", padding: "10px 12px", background: "var(--card2)", border: "none", borderRadius: ".5rem", color: "var(--t1)", fontSize: 14, outline: "none", appearance: "none" as const } as React.CSSProperties,
  field: { marginBottom: 16 } as React.CSSProperties,
};

export default function DemurragePage() {
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
          Demurrage Calculator
        </h1>
        <p style={{ fontFamily: "var(--fb)", fontSize: 13, color: "var(--t2)", marginBottom: 24 }}>
          Estimate demurrage if this shipment is delayed at port
        </p>

        <div className="demurrage-grid">
          {/* INPUT PANEL */}
          <div style={s.panel}>
            <div style={s.field}>
              <label style={s.label}>Port of discharge</label>
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
              <label style={s.label}>Container type</label>
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
                      fontSize: 12, fontWeight: container === opt.value ? 700 : 500,
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
              <label style={s.label}>Free days included in contract</label>
              <input
                data-testid="demurrage-free-days"
                type="number"
                min={0}
                max={30}
                style={s.input}
                value={freeDays}
                onChange={e => setFreeDays(Math.min(30, Math.max(0, Number(e.target.value))))}
              />
              <p style={s.helper}>Check your Bill of Lading. Most contracts allow 7–14 free days.</p>
            </div>

            <div style={s.field}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>
                  {useDate ? "Arrival date" : "How many days have goods been held?"}
                </label>
                <button
                  data-testid="demurrage-toggle-date"
                  onClick={() => setUseDate(!useDate)}
                  style={{ background: "none", border: "none", color: "var(--blue)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                >
                  {useDate ? "Enter days manually" : "Calculate from arrival date"}
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
              <label style={s.label}>Estimated cargo value (USD)</label>
              <input
                data-testid="demurrage-cargo-value"
                type="number"
                min={0}
                style={s.input}
                value={cargoValue}
                onChange={e => setCargoValue(e.target.value)}
                placeholder="Optional"
              />
              <p style={s.helper}>Optional — used to calculate demurrage as % of cargo value</p>
            </div>

            <button
              data-testid="demurrage-calculate"
              style={{
                width: "100%",
                background: "var(--blue, #3B82F6)",
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
              Calculate
            </button>
          </div>

          {/* RESULTS PANEL */}
          <div>
            <div style={s.panel}>
              <div className="demurrage-stats-grid">
                <div style={{ textAlign: "center", padding: 12, background: "var(--card2)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--t1)" }} data-testid="demurrage-chargeable-days">
                    {chargeableDays}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>Billable days</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "var(--card2)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--t1)" }} data-testid="demurrage-daily-rate">
                    ${baseRate}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>Daily rate</div>
                </div>
                <div style={{ textAlign: "center", padding: 12, background: "var(--card2)", borderRadius: 8 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: "var(--t1)" }}>
                    {effectiveDaysHeld}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--t3)" }}>Days at port</div>
                </div>
              </div>

              {/* Cost breakdown */}
              {tiers.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", marginBottom: 8 }}>Cost breakdown</div>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--s5)" }}>
                        <th style={{ textAlign: "left", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>Period</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>Days</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>Rate/day</th>
                        <th style={{ textAlign: "right", padding: "6px 0", color: "var(--t3)", fontWeight: 500 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiers.map((t, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--s5)" }}>
                          <td style={{ padding: "8px 0", color: "var(--t2)" }}>{t.label}</td>
                          <td style={{ textAlign: "right", padding: "8px 0", color: "var(--t1)", fontFamily: "'DM Mono', monospace" }}>{t.days}</td>
                          <td style={{ textAlign: "right", padding: "8px 0", color: "var(--t2)", fontFamily: "'DM Mono', monospace" }}>${t.rate}</td>
                          <td style={{ textAlign: "right", padding: "8px 0", color: "var(--t1)", fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>${t.subtotal.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--t3)", fontSize: 13 }}>
                  No chargeable days — within free period
                </div>
              )}

              {/* Total */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", background: "var(--card2)", borderRadius: 8, marginBottom: 12,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--t1)" }}>TOTAL DEMURRAGE</span>
                <span
                  data-testid="demurrage-total"
                  style={{ fontFamily: "var(--fh)", fontWeight: 900, fontSize: 28, color: totalColor }}
                >
                  ${total.toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "var(--t3)", textAlign: "right", marginTop: -8, marginBottom: 12, fontStyle: "italic" }}>Based on current inputs</p>

              {cargoVal > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: pct > 5 ? "var(--red)" : "var(--t2)" }} data-testid="demurrage-pct">
                    Demurrage as % of cargo value: {pct.toFixed(1)}%
                  </span>
                  {pct > 5 && (
                    <p style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
                      Consider whether re-export or destruction may be cheaper.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Decision nudge */}
            <div style={{ ...s.panel, marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)", marginBottom: 12 }}>
                Next step: compare demurrage against alternatives
              </div>
              <div className="demurrage-nudge-grid">
                <div style={{ background: "var(--card2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>Re-export</div>
                  <div style={{ fontSize: 11, color: "var(--t2)" }}>Often 30–50% of cargo value</div>
                </div>
                <div style={{ background: "var(--card2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>Destruction</div>
                  <div style={{ fontSize: 11, color: "var(--t2)" }}>Often $500–5,000, depending on port and volume</div>
                </div>
                <div style={{ background: "var(--card2)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--t1)", marginBottom: 4 }}>Appeal / re-test</div>
                  <div style={{ fontSize: 11, color: "var(--t2)" }}>Re-testing fee typically $200-500 + additional storage</div>
                </div>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "var(--t3)", marginTop: 12, lineHeight: 1.5 }}>
                Rates are indicative based on published port tariffs. Actual rates vary by
                carrier, season, and contract terms. Confirm final charges with your freight agent.
              </p>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 16, lineHeight: 1.5 }}>
              TapTrao demurrage estimates are based on published port tariff data and are
              provided for planning purposes only. They do not constitute financial advice.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
