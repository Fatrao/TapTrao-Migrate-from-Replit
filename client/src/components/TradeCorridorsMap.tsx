import { memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ISO2 → approximate [lng, lat] for trade route lines */
const countryCoords: Record<string, [number, number]> = {
  GH: [-1.0, 7.9],
  CI: [-5.5, 7.5],
  ET: [38.7, 9.0],
  KE: [37.9, -1.3],
  TZ: [34.9, -6.4],
  UG: [32.3, 1.4],
  NG: [8.7, 9.1],
  CM: [12.4, 5.9],
  RW: [29.9, -1.9],
  SN: [-14.4, 14.5],
  CD: [21.8, -4.0],
  MW: [34.3, -13.3],
  ZM: [28.3, -15.4],
  ZW: [29.2, -19.0],
  MG: [47.5, -18.8],
  MZ: [35.5, -18.7],
  BI: [29.9, -3.4],
  ZA: [22.9, -30.6],
  BF: [-1.6, 12.3],
  // Destinations
  EU: [10.5, 50.1],
  GB: [-0.1, 51.5],
  DE: [10.4, 51.2],
  FR: [2.2, 46.2],
  IT: [12.6, 41.9],
  ES: [-3.7, 40.4],
  NL: [5.3, 52.1],
  CH: [8.2, 46.8],
  AT: [14.6, 47.5],
  US: [-95.7, 37.1],
  CN: [104.2, 35.9],
  AE: [54.0, 23.4],
  TR: [32.9, 39.9],
  // LATAM
  BR: [-51.9, -14.2],
  MX: [-102.6, 23.6],
  AR: [-63.6, -38.4],
  CL: [-71.5, -35.7],
  CO: [-74.3, 4.6],
  PE: [-75.0, -9.2],
  // Asia
  IN: [78.9, 20.6],
  JP: [138.3, 36.2],
  KR: [127.8, 35.9],
  SG: [103.8, 1.4],
  MY: [101.7, 4.2],
  TH: [100.5, 15.9],
  VN: [108.3, 14.1],
  ID: [113.9, -0.8],
  PH: [121.8, 12.9],
};

type Corridor = {
  originIso2: string;
  originName: string;
  destIso2: string;
  destName: string;
  tradeCount: number;
  activeCount: number;
  issueCount: number;
  waitingCount: number;
};

function getCorridorColor(c: Corridor): string {
  if (c.issueCount > 0) return "#ef4444";
  if (c.waitingCount > 0) return "#eab308";
  return "#4ade80";
}

function getCorridorStatus(c: Corridor): string {
  if (c.issueCount > 0) return "Issues";
  if (c.waitingCount > 0) return "Waiting";
  return "Active";
}

export const TradeCorridorsMap = memo(function TradeCorridorsMap({
  corridors,
  singleRoute,
}: {
  corridors: Corridor[];
  singleRoute?: { originIso2: string; destIso2: string };
}) {
  const displayCorridors = singleRoute
    ? corridors.filter(
        (c) => c.originIso2 === singleRoute.originIso2 && c.destIso2 === singleRoute.destIso2
      )
    : corridors;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 120, center: [20, 20] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#2a4435"
                stroke="rgba(109,184,154,0.25)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#3a5c48" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {displayCorridors.map((c) => {
          const from = countryCoords[c.originIso2];
          const to = countryCoords[c.destIso2];
          if (!from || !to) return null;
          const color = getCorridorColor(c);
          return (
            <Line
              key={`${c.originIso2}-${c.destIso2}`}
              from={from}
              to={to}
              stroke={color}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="4 2"
            />
          );
        })}

        {/* Origin markers */}
        {displayCorridors.map((c) => {
          const coords = countryCoords[c.originIso2];
          if (!coords) return null;
          return (
            <Marker key={`origin-${c.originIso2}`} coordinates={coords}>
              <circle r={3} fill="#4ade80" stroke="#0e4e45" strokeWidth={1} />
            </Marker>
          );
        })}

        {/* Destination markers */}
        {displayCorridors.map((c) => {
          const coords = countryCoords[c.destIso2];
          if (!coords) return null;
          const color = getCorridorColor(c);
          return (
            <Marker key={`dest-${c.destIso2}-${c.originIso2}`} coordinates={coords}>
              <circle r={3} fill={color} stroke="#fff" strokeWidth={0.5} />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Legend */}
      {!singleRoute && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 16,
            display: "flex",
            gap: 16,
            fontSize: 11,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          {[
            { color: "#4ade80", label: "Active" },
            { color: "#eab308", label: "Waiting" },
            { color: "#ef4444", label: "Issues" },
          ].map((item) => (
            <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.color,
                  display: "inline-block",
                }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export { getCorridorColor, getCorridorStatus, countryCoords };
export type { Corridor };
