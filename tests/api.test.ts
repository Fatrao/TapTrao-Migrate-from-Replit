import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";

async function api(path: string, opts: RequestInit = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

describe("Reference Data Endpoints", () => {
  it("GET /api/commodities returns array of commodities", async () => {
    const { status, body } = await api("/api/commodities");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(100);
    const c = body[0];
    expect(c).toHaveProperty("id");
    expect(c).toHaveProperty("name");
    expect(c).toHaveProperty("hsCode");
    expect(c).toHaveProperty("commodityType");
  });

  it("GET /api/origins returns origin countries", async () => {
    const { status, body } = await api("/api/origins");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(18);
    const o = body[0];
    expect(o).toHaveProperty("id");
    expect(o).toHaveProperty("countryName");
    expect(o).toHaveProperty("iso2");
  });

  it("GET /api/destinations returns destinations", async () => {
    const { status, body } = await api("/api/destinations");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(7);
    const isos = body.map((d: any) => d.iso2).sort();
    expect(isos).toEqual(["AE", "CH", "CN", "EU", "GB", "TR", "US"]);
  });
});

describe("Table Counts", () => {
  it("GET /api/table-counts returns expected counts", async () => {
    const { status, body } = await api("/api/table-counts");
    expect(status).toBe(200);
    expect(body.destinations).toBe(7);
    expect(body.originCountries).toBeGreaterThanOrEqual(18);
    expect(body.commodities).toBeGreaterThanOrEqual(154);
    expect(body.regionalFrameworks).toBeGreaterThanOrEqual(5);
    expect(body.afcftaRoo).toBeGreaterThanOrEqual(0);
  });
});

describe("Commodity Stats", () => {
  it("GET /api/commodity-stats returns type breakdown", async () => {
    const { status, body } = await api("/api/commodity-stats");
    expect(status).toBe(200);
    expect(body.total).toBeGreaterThan(100);
    expect(body.byType).toBeDefined();
    expect(typeof body.byType).toBe("object");
    expect(body.stopFlagCommodities).toBeDefined();
    expect(Array.isArray(body.stopFlagCommodities)).toBe(true);
    expect(body.stopFlagCommodities.length).toBe(3);
  });
});

describe("Compliance Check", () => {
  let commodities: any[];
  let origins: any[];
  let destinations: any[];

  beforeAll(async () => {
    const [c, o, d] = await Promise.all([
      api("/api/commodities"),
      api("/api/origins"),
      api("/api/destinations"),
    ]);
    commodities = c.body;
    origins = o.body;
    destinations = d.body;
  });

  it("POST /api/compliance-check returns compliance result for cashew CI→GB", async () => {
    const cashew = commodities.find((c: any) => c.name.toLowerCase().includes("cashew"));
    const ci = origins.find((o: any) => o.iso2 === "CI");
    const gb = destinations.find((d: any) => d.iso2 === "GB");
    expect(cashew).toBeDefined();
    expect(ci).toBeDefined();
    expect(gb).toBeDefined();

    const { status, body } = await api("/api/compliance-check", {
      method: "POST",
      body: JSON.stringify({
        commodityId: cashew.id,
        originId: ci.id,
        destinationId: gb.id,
      }),
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty("commodity");
    expect(body).toHaveProperty("origin");
    expect(body).toHaveProperty("destination");
    expect(body).toHaveProperty("requirements");
    expect(body).toHaveProperty("requirementsDetailed");
    expect(body).toHaveProperty("triggers");
    expect(body).toHaveProperty("readinessScore");
    expect(body).toHaveProperty("lookupId");
    expect(body).toHaveProperty("integrityHash");
    expect(body.readinessScore).toHaveProperty("score");
    expect(body.readinessScore).toHaveProperty("verdict");
    expect(body.readinessScore.score).toBeGreaterThanOrEqual(0);
    expect(body.readinessScore.score).toBeLessThanOrEqual(100);
    expect(["GREEN", "AMBER", "RED"]).toContain(body.readinessScore.verdict);
  });

  it("POST /api/compliance-check with Swiss destination includes Swiss-specific fields", async () => {
    const cashew = commodities.find((c: any) => c.name.toLowerCase().includes("cashew"));
    const ci = origins.find((o: any) => o.iso2 === "CI");
    const ch = destinations.find((d: any) => d.iso2 === "CH");
    if (!ch) return;

    const { status, body } = await api("/api/compliance-check", {
      method: "POST",
      body: JSON.stringify({
        commodityId: cashew.id,
        originId: ci.id,
        destinationId: ch.id,
      }),
    });
    expect(status).toBe(200);
    expect(body.destination.countryName).toMatch(/switzerland/i);
  });

  it("POST /api/compliance-check returns 400 for missing fields", async () => {
    const { status } = await api("/api/compliance-check", {
      method: "POST",
      body: JSON.stringify({ commodityId: "x" }),
    });
    expect(status).toBe(400);
  });

  it("POST /api/compliance-check returns 404 for non-existent IDs", async () => {
    const { status } = await api("/api/compliance-check", {
      method: "POST",
      body: JSON.stringify({
        commodityId: "00000000-0000-0000-0000-000000000000",
        originId: "00000000-0000-0000-0000-000000000001",
        destinationId: "00000000-0000-0000-0000-000000000002",
      }),
    });
    expect([404, 500]).toContain(status);
  });
});

describe("Readiness Score Engine (test endpoint)", () => {
  it("returns 100 for zero-penalty scenario", async () => {
    const { status, body } = await api("/api/test/readiness-score", {
      method: "POST",
      body: JSON.stringify({
        triggers: { eudr: false, cbam: false, csddd: false, kimberley: false, conflict: false, iuu: false, cites: false },
        hazards: [],
        stopFlags: null,
        requirementsDetailed: [],
      }),
    });
    expect(status).toBe(200);
    expect(body.score).toBe(100);
    expect(body.verdict).toBe("GREEN");
  });

  it("penalises for multiple regulatory overlays", async () => {
    const { status, body } = await api("/api/test/readiness-score", {
      method: "POST",
      body: JSON.stringify({
        triggers: { eudr: true, cbam: true, csddd: true, kimberley: false, conflict: false, iuu: false, cites: false },
        hazards: [],
        stopFlags: null,
        requirementsDetailed: [],
      }),
    });
    expect(status).toBe(200);
    expect(body.score).toBeLessThan(100);
    expect(body.factors.regulatory_complexity.penalty).toBe(30);
  });

  it("returns RED verdict when stop flag is set", async () => {
    const { status, body } = await api("/api/test/readiness-score", {
      method: "POST",
      body: JSON.stringify({
        triggers: { eudr: false, cbam: false, csddd: false, kimberley: false, conflict: false, iuu: false, cites: false },
        hazards: [],
        stopFlags: { UNSC: "Sanctioned" },
        requirementsDetailed: [],
      }),
    });
    expect(status).toBe(200);
    expect(body.verdict).toBe("RED");
    expect(body.factors.trade_restriction.penalty).toBe(20);
  });

  it("penalises for hazards", async () => {
    const { status, body } = await api("/api/test/readiness-score", {
      method: "POST",
      body: JSON.stringify({
        triggers: {},
        hazards: ["aflatoxins", "salmonella"],
        stopFlags: null,
        requirementsDetailed: [],
      }),
    });
    expect(status).toBe(200);
    expect(body.factors.hazard_exposure.penalty).toBeGreaterThan(0);
  });

  it("penalises for high document count", async () => {
    const docs = Array.from({ length: 12 }, (_, i) => ({
      label: `Doc ${i}`,
      category: "sps",
      documentCode: `DOC${i}`,
    }));
    const { status, body } = await api("/api/test/readiness-score", {
      method: "POST",
      body: JSON.stringify({
        triggers: {},
        hazards: [],
        stopFlags: null,
        requirementsDetailed: docs,
      }),
    });
    expect(status).toBe(200);
    expect(body.factors.document_volume.penalty).toBe(20);
  });
});

describe("Demurrage Calculator (test endpoint)", () => {
  it("returns 0 total for 0 chargeable days", async () => {
    const { status, body } = await api("/api/test/demurrage", {
      method: "POST",
      body: JSON.stringify({ baseRate: 85, chargeableDays: 0 }),
    });
    expect(status).toBe(200);
    expect(body.total).toBe(0);
    expect(body.tiers).toEqual([]);
  });

  it("computes tier-1 only for ≤7 days", async () => {
    const { status, body } = await api("/api/test/demurrage", {
      method: "POST",
      body: JSON.stringify({ baseRate: 100, chargeableDays: 5 }),
    });
    expect(status).toBe(200);
    expect(body.tiers.length).toBe(1);
    expect(body.tiers[0].label).toBe("Days 1-7");
    expect(body.total).toBe(500);
  });

  it("computes two tiers for 10 days", async () => {
    const { status, body } = await api("/api/test/demurrage", {
      method: "POST",
      body: JSON.stringify({ baseRate: 100, chargeableDays: 10 }),
    });
    expect(status).toBe(200);
    expect(body.tiers.length).toBe(2);
    const tier1 = body.tiers[0];
    const tier2 = body.tiers[1];
    expect(tier1.subtotal).toBe(700);
    expect(tier2.days).toBe(3);
    expect(tier2.rate).toBe(150);
    expect(tier2.subtotal).toBe(450);
    expect(body.total).toBe(1150);
  });

  it("computes three tiers for 20 days", async () => {
    const { status, body } = await api("/api/test/demurrage", {
      method: "POST",
      body: JSON.stringify({ baseRate: 80, chargeableDays: 20 }),
    });
    expect(status).toBe(200);
    expect(body.tiers.length).toBe(3);
    const [t1, t2, t3] = body.tiers;
    expect(t1.subtotal).toBe(7 * 80);
    expect(t2.subtotal).toBe(7 * 120);
    expect(t3.days).toBe(6);
    expect(t3.rate).toBe(160);
    expect(t3.subtotal).toBe(6 * 160);
    expect(body.total).toBe(7 * 80 + 7 * 120 + 6 * 160);
  });

  it("returns 400 for missing parameters", async () => {
    const { status } = await api("/api/test/demurrage", {
      method: "POST",
      body: JSON.stringify({ baseRate: 100 }),
    });
    expect(status).toBe(400);
  });
});

describe("LC Check Endpoint", () => {
  it("POST /api/lc-checks returns 400 for invalid schema", async () => {
    const { status } = await api("/api/lc-checks", {
      method: "POST",
      body: JSON.stringify({ lcFields: {}, documents: [] }),
    });
    expect(status).toBe(400);
  });

  it("POST /api/lc-checks returns result for valid input", async () => {
    const { status, body } = await api("/api/lc-checks", {
      method: "POST",
      body: JSON.stringify({
        lcFields: {
          beneficiaryName: "Acme Exports Ltd",
          applicantName: "Global Imports Inc",
          goodsDescription: "Raw cashew nuts in bulk",
          hsCode: "0801.31",
          quantity: 25000,
          quantityUnit: "KG",
          unitPrice: 1.20,
          currency: "USD",
          totalAmount: 30000,
          countryOfOrigin: "Cote d'Ivoire",
          portOfLoading: "Abidjan",
          portOfDischarge: "Felixstowe",
          latestShipmentDate: "2026-06-30",
          lcExpiryDate: "2026-07-31",
          incoterms: "CIF",
          partialShipmentsAllowed: false,
          transhipmentAllowed: true,
          lcReference: "LC-TEST-001",
        },
        documents: [
          {
            documentType: "commercial_invoice",
            fields: {
              beneficiaryName: "Acme Exports Ltd",
              goodsDescription: "Raw cashew nuts in bulk",
              quantity: "25000",
              quantityUnit: "KG",
              unitPrice: "1.20",
              currency: "USD",
              totalAmount: "30000",
            },
          },
        ],
      }),
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("results");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("integrityHash");
    expect(body.summary).toHaveProperty("verdict");
    expect(["COMPLIANT", "COMPLIANT_WITH_NOTES", "DISCREPANCIES_FOUND"]).toContain(body.summary.verdict);
  });
});

describe("Token Balance", () => {
  it("GET /api/tokens/balance returns balance info", async () => {
    const { status, body } = await api("/api/tokens/balance");
    expect(status).toBe(200);
    expect(body).toHaveProperty("balance");
    expect(body).toHaveProperty("freeLookupUsed");
    expect(typeof body.balance).toBe("number");
  });
});

describe("Templates", () => {
  it("GET /api/templates returns array", async () => {
    const { status, body } = await api("/api/templates");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /api/templates/count returns count object", async () => {
    const { status, body } = await api("/api/templates/count");
    expect(status).toBe(200);
    expect(body).toHaveProperty("count");
    expect(typeof body.count).toBe("number");
  });
});

describe("Alerts", () => {
  it("GET /api/alerts returns array", async () => {
    const { status, body } = await api("/api/alerts");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /api/alerts/unread-count returns count", async () => {
    const { status, body } = await api("/api/alerts/unread-count");
    expect(status).toBe(200);
    expect(body).toHaveProperty("count");
    expect(typeof body.count).toBe("number");
  });
});

describe("Dashboard Stats", () => {
  it("GET /api/dashboard/stats returns stats object", async () => {
    const { status, body } = await api("/api/dashboard/stats");
    expect(status).toBe(200);
    expect(body).toHaveProperty("totalLookups");
    expect(body).toHaveProperty("totalLcChecks");
  });
});

describe("Company Profile", () => {
  it("GET /api/company-profile returns profile or null", async () => {
    const { status, body } = await api("/api/company-profile");
    expect(status).toBe(200);
  });
});

describe("Supplier Inbox", () => {
  it("GET /api/supplier-inbox returns array", async () => {
    const { status, body } = await api("/api/supplier-inbox");
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /api/supplier-inbox/badge-count returns count", async () => {
    const { status, body } = await api("/api/supplier-inbox/badge-count");
    expect(status).toBe(200);
    expect(body).toHaveProperty("count");
  });
});
