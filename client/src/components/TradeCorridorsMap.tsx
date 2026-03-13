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
export const countryCoords: Record<string, [number, number]> = {
  // Africa (origins)
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
  ML: [-8.0, 17.6],
  AO: [17.9, -11.2],
  // Europe
  EU: [10.5, 50.1],
  GB: [-0.1, 51.5],
  DE: [10.4, 51.2],
  FR: [2.2, 46.2],
  IT: [12.6, 41.9],
  ES: [-3.7, 40.4],
  NL: [5.3, 52.1],
  CH: [8.2, 46.8],
  AT: [14.6, 47.5],
  PL: [19.1, 51.9],
  // Americas
  US: [-95.7, 37.1],
  CA: [-106.3, 56.1],
  BR: [-51.9, -14.2],
  MX: [-102.6, 23.6],
  AR: [-63.6, -38.4],
  CL: [-71.5, -35.7],
  CO: [-74.3, 4.6],
  PE: [-75.0, -9.2],
  // Middle East
  AE: [54.0, 23.4],
  TR: [32.9, 39.9],
  // Asia
  CN: [104.2, 35.9],
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

export type Corridor = {
  originIso2: string;
  originName: string;
  destIso2: string;
  destName: string;
  tradeCount: number;
  activeCount: number;
  issueCount: number;
  waitingCount: number;
};

export function getCorridorColor(c: Corridor): string {
  if (c.issueCount > 0) return "#ef4444";
  if (c.waitingCount > 0) return "#eab308";
  return "#4ade80";
}

export function getCorridorStatus(c: Corridor): string {
  if (c.issueCount > 0) return "Issues";
  if (c.waitingCount > 0) return "Waiting";
  return "Active";
}

/**
 * Render curved arcs between origin and destination by sampling a quadratic
 * Bezier curve into line segments that react-simple-maps can project.
 */
const CurvedArcs = memo(function CurvedArcs({ corridors }: { corridors: Corridor[] }) {
  return (
    <>
      {corridors.map((c, i) => {
        const from = countryCoords[c.originIso2];
        const to = countryCoords[c.destIso2];
        if (!from || !to) return null;
        const color = getCorridorColor(c);

        // Compute a control point perpendicular to the midpoint
        const midLng = (from[0] + to[0]) / 2;
        const midLat = (from[1] + to[1]) / 2;
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const curveFactor = 0.2 + (i % 3) * 0.06; // slight variation per route
        const ctrlLng = midLng - dy * curveFactor;
        const ctrlLat = midLat + dx * curveFactor;

        // Sample the Bezier curve into segments
        const steps = 16;
        const points: [number, number][] = [];
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const lng = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * ctrlLng + t * t * to[0];
          const lat = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * ctrlLat + t * t * to[1];
          points.push([lng, lat]);
        }

        // Render each segment as a Line component
        return points.slice(0, -1).map((pt, j) => (
          <Line
            key={`arc-${c.originIso2}-${c.destIso2}-${j}`}
            from={pt}
            to={points[j + 1]}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeOpacity={0.8}
            filter="url(#arc-glow)"
          />
        ));
      })}
    </>
  );
});

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
    <div style={{ position: "absolute", inset: 0 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 150, center: [8, 18] }}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          {/* Glow filter for origin markers (Africa hub) */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Soft glow for destination markers */}
          <filter id="dest-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Route arc glow */}
          <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* World geography — subtle translucent fills */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="rgba(100,160,120,0.15)"
                stroke="rgba(120,200,150,0.08)"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "rgba(100,160,120,0.22)" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Curved arc routes */}
        <CurvedArcs corridors={displayCorridors} />

        {/* Origin markers (Africa hub) — bright green with glow */}
        {Array.from(new Set(displayCorridors.map(c => c.originIso2))).map(iso => {
          const coords = countryCoords[iso];
          if (!coords) return null;
          return (
            <Marker key={`origin-${iso}`} coordinates={coords}>
              <circle r={4} fill="#4ade80" filter="url(#glow)" />
              <circle r={2} fill="#fff" />
            </Marker>
          );
        })}

        {/* Destination markers — soft glow, color by worst status */}
        {Array.from(new Set(displayCorridors.map(c => c.destIso2))).map(iso => {
          const coords = countryCoords[iso];
          if (!coords) return null;
          const destCorridors = displayCorridors.filter(c => c.destIso2 === iso);
          const hasIssue = destCorridors.some(c => c.issueCount > 0);
          const hasWaiting = destCorridors.some(c => c.waitingCount > 0);
          const color = hasIssue ? "#ef4444" : hasWaiting ? "#eab308" : "#4ade80";
          return (
            <Marker key={`dest-${iso}`} coordinates={coords}>
              <circle r={3.5} fill={color} filter="url(#dest-glow)" opacity={0.8} />
              <circle r={1.5} fill="#fff" />
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
});
