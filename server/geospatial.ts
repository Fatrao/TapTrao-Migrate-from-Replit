/**
 * Geospatial Verification — GFW + OpenEPI deforestation data
 *
 * Queries satellite tree-cover-loss data for EUDR plot coordinates.
 * Primary: Global Forest Watch Data API (requires GFW_API_KEY).
 * Fallback: OpenEPI basin-level API (no auth).
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type GeospatialResult = {
  source: "gfw" | "openepi" | "none";
  totalLossHa: number;
  lossYearBreakdown: Array<{ year: number; lossHa: number }>;
  lossAfterCutoff: number;
  alertCount: number;
  queryGeometry: "point" | "polygon";
  bufferRadiusKm: number | null;
  queriedAt: string;
  error: string | null;
};

type Coord = { lat: number; lng: number };

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const GFW_BASE = "https://data-api.globalforestwatch.org";
const GFW_DATASET_VERSION = "v1.11";
const GFW_TIMEOUT_MS = 15000;
const OPENEPI_TIMEOUT_MS = 10000;
const EUDR_CUTOFF_YEAR = 2020;
const BUFFER_RADIUS_KM = 5;
const BUFFER_VERTICES = 16;

// ═══════════════════════════════════════════════════════════════
// GEOMETRY HELPERS
// ═══════════════════════════════════════════════════════════════

/** Approximate circle polygon from a point (for GFW which requires Polygon geometry) */
function pointToBufferPolygon(lat: number, lng: number, radiusKm: number = BUFFER_RADIUS_KM): number[][] {
  const R = 6371; // Earth radius km
  const points: number[][] = [];
  for (let i = 0; i <= BUFFER_VERTICES; i++) {
    const angle = (2 * Math.PI * i) / BUFFER_VERTICES;
    const dLat = (radiusKm / R) * Math.cos(angle) * (180 / Math.PI);
    const dLng = (radiusKm / R) * Math.sin(angle) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    points.push([lng + dLng, lat + dLat]); // GeoJSON is [lng, lat]
  }
  return points;
}

/** Parse plotCoordinates JSONB into coords array */
function parseCoords(plotCoordinates: any): Coord[] {
  if (!plotCoordinates) return [];
  const pc = typeof plotCoordinates === "string" ? JSON.parse(plotCoordinates) : plotCoordinates;
  if (pc.type === "point" && pc.lat != null && pc.lng != null) {
    return [{ lat: Number(pc.lat), lng: Number(pc.lng) }];
  }
  if (pc.type === "polygon" && Array.isArray(pc.points)) {
    return pc.points
      .filter((p: any) => p.lat != null && p.lng != null)
      .map((p: any) => ({ lat: Number(p.lat), lng: Number(p.lng) }));
  }
  return [];
}

/** Build GeoJSON polygon from coords */
function buildGeoJsonPolygon(coords: Coord[], isPoint: boolean): { geometry: any; bufferKm: number | null } {
  if (isPoint && coords.length === 1) {
    const ring = pointToBufferPolygon(coords[0].lat, coords[0].lng);
    return {
      geometry: { type: "Polygon", coordinates: [ring] },
      bufferKm: BUFFER_RADIUS_KM,
    };
  }
  // Polygon — close the ring if needed
  const ring = coords.map(c => [c.lng, c.lat]);
  if (ring.length >= 3) {
    const first = ring[0], last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  }
  return { geometry: { type: "Polygon", coordinates: [ring] }, bufferKm: null };
}

// ═══════════════════════════════════════════════════════════════
// GFW API
// ═══════════════════════════════════════════════════════════════

async function queryGfwTreeCoverLoss(geometry: any): Promise<Array<{ year: number; lossHa: number }> | null> {
  const apiKey = process.env.GFW_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GFW_TIMEOUT_MS);

  try {
    const url = `${GFW_BASE}/dataset/umd_tree_cover_loss/${GFW_DATASET_VERSION}/query/json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Origin": process.env.NODE_ENV === "production"
          ? "https://taptrao.com"
          : "http://localhost:3000",
      },
      body: JSON.stringify({
        sql: "SELECT umd_tree_cover_loss__year, SUM(area__ha) AS loss_ha FROM results GROUP BY umd_tree_cover_loss__year ORDER BY umd_tree_cover_loss__year",
        geometry,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`GFW tree cover loss API error: ${res.status} ${await res.text()}`);
      return null;
    }

    const body = await res.json() as any;
    if (body.status !== "success" || !Array.isArray(body.data)) return null;

    return body.data.map((row: any) => ({
      year: Number(row.umd_tree_cover_loss__year),
      lossHa: Number(row.loss_ha) || 0,
    }));
  } catch (err: any) {
    if (err.name === "AbortError") console.error("GFW tree cover loss API timed out");
    else console.error("GFW tree cover loss API error:", err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function queryGfwAlerts(geometry: any): Promise<number> {
  const apiKey = process.env.GFW_API_KEY;
  if (!apiKey) return 0;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GFW_TIMEOUT_MS);

  try {
    const url = `${GFW_BASE}/dataset/gfw_integrated_alerts/latest/query/json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Origin": process.env.NODE_ENV === "production"
          ? "https://taptrao.com"
          : "http://localhost:3000",
      },
      body: JSON.stringify({
        sql: "SELECT COUNT(*) AS alert_count FROM results WHERE gfw_integrated_alerts__confidence IN ('high', 'nominal')",
        geometry,
      }),
      signal: controller.signal,
    });

    if (!res.ok) return 0;
    const body = await res.json() as any;
    if (body.status !== "success" || !Array.isArray(body.data)) return 0;
    return Number(body.data[0]?.alert_count) || 0;
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════════
// OpenEPI FALLBACK
// ═══════════════════════════════════════════════════════════════

async function queryOpenEpiBasin(lat: number, lng: number): Promise<{ totalLossHa: number } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENEPI_TIMEOUT_MS);

  try {
    const url = `https://api.openepi.io/deforestation/basin?lon=${lng}&lat=${lat}&start_year=2001&end_year=2024`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;

    const body = await res.json() as any;
    const props = body?.features?.[0]?.properties;
    if (!props) return null;

    // daterange_tot_treeloss is in km² — convert to hectares (×100)
    const lossKm2 = Number(props.daterange_tot_treeloss) || 0;
    return { totalLossHa: lossKm2 * 100 };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════

export async function fetchGeospatialData(
  plotCoordinates: any,
  plotCountryIso2: string,
): Promise<GeospatialResult> {
  const coords = parseCoords(plotCoordinates);
  const isPoint = coords.length === 1;
  const queriedAt = new Date().toISOString();

  if (coords.length === 0) {
    return {
      source: "none", totalLossHa: 0, lossYearBreakdown: [],
      lossAfterCutoff: 0, alertCount: 0,
      queryGeometry: "point", bufferRadiusKm: null,
      queriedAt, error: "No valid coordinates provided",
    };
  }

  // Try GFW first
  const { geometry, bufferKm } = buildGeoJsonPolygon(coords, isPoint);

  const [gfwLoss, alertCount] = await Promise.all([
    queryGfwTreeCoverLoss(geometry),
    queryGfwAlerts(geometry),
  ]);

  if (gfwLoss) {
    const lossAfterCutoff = gfwLoss
      .filter(r => r.year > EUDR_CUTOFF_YEAR)
      .reduce((sum, r) => sum + r.lossHa, 0);
    const totalLossHa = gfwLoss.reduce((sum, r) => sum + r.lossHa, 0);

    return {
      source: "gfw",
      totalLossHa: Math.round(totalLossHa * 100) / 100,
      lossYearBreakdown: gfwLoss,
      lossAfterCutoff: Math.round(lossAfterCutoff * 100) / 100,
      alertCount,
      queryGeometry: isPoint ? "point" : "polygon",
      bufferRadiusKm: bufferKm,
      queriedAt,
      error: null,
    };
  }

  // Fallback: OpenEPI (point only, basin-level)
  const primaryCoord = coords[0];
  const openEpi = await queryOpenEpiBasin(primaryCoord.lat, primaryCoord.lng);

  if (openEpi) {
    return {
      source: "openepi",
      totalLossHa: Math.round(openEpi.totalLossHa * 100) / 100,
      lossYearBreakdown: [],
      lossAfterCutoff: 0, // OpenEPI doesn't give year breakdown
      alertCount: 0,
      queryGeometry: isPoint ? "point" : "polygon",
      bufferRadiusKm: null,
      queriedAt,
      error: "Basin-level aggregation only (OpenEPI fallback)",
    };
  }

  // Both failed
  return {
    source: "none", totalLossHa: 0, lossYearBreakdown: [],
    lossAfterCutoff: 0, alertCount: 0,
    queryGeometry: isPoint ? "point" : "polygon",
    bufferRadiusKm: null, queriedAt,
    error: "Geospatial APIs unavailable",
  };
}
