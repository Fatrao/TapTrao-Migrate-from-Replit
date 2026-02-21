#!/usr/bin/env node

const BASE = process.env.TEST_BASE_URL || "http://localhost:5000";
let passed = 0;
let failed = 0;
const errors = [];

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    errors.push(label);
    console.log(`  ✗ ${label}`);
  }
}

async function run() {
  console.log("\n=== TapTrao Bot Test Suite ===\n");

  console.log("1. Reference Data");
  const { body: comms } = await api("/api/commodities");
  assert("commodities ≥ 154", Array.isArray(comms) && comms.length >= 154);

  const { body: origins } = await api("/api/origins");
  assert("origins ≥ 18", Array.isArray(origins) && origins.length >= 18);

  const { body: dests } = await api("/api/destinations");
  assert("destinations = 7", Array.isArray(dests) && dests.length === 7);

  const isos = dests.map(d => d.iso2).sort().join(",");
  assert("destination ISOs correct", isos === "AE,CH,CN,EU,GB,TR,US");

  console.log("\n2. Table Counts");
  const { body: counts } = await api("/api/table-counts");
  assert("destinations = 7", counts.destinations === 7);
  assert("origins ≥ 18", counts.originCountries >= 18);
  assert("commodities ≥ 154", counts.commodities >= 154);
  assert("frameworks ≥ 5", counts.regionalFrameworks >= 5);

  console.log("\n3. Commodity Stats");
  const { body: stats } = await api("/api/commodity-stats");
  assert("total > 100", stats.total > 100);
  assert("stop flags = 3", stats.stopFlagCommodities?.length === 3);

  console.log("\n4. Compliance Check (cashew CI→GB)");
  const cashew = comms.find(c => c.name.toLowerCase().includes("cashew"));
  const ci = origins.find(o => o.iso2 === "CI");
  const gb = dests.find(d => d.iso2 === "GB");
  if (cashew && ci && gb) {
    const { status, body: lookup } = await api("/api/compliance-check", {
      method: "POST",
      body: JSON.stringify({ commodityId: cashew.id, originId: ci.id, destinationId: gb.id }),
    });
    assert("status 200", status === 200);
    assert("has commodity/origin/destination", lookup.commodity && lookup.origin && lookup.destination);
    assert("has readinessScore", lookup.readinessScore && typeof lookup.readinessScore.score === "number");
    assert("has lookupId", !!lookup.lookupId);
    assert("has integrityHash", !!lookup.integrityHash);
  } else {
    assert("reference data found for lookup", false);
  }

  console.log("\n5. Compliance Check (cashew CI→CH - Switzerland)");
  const ch = dests.find(d => d.iso2 === "CH");
  if (cashew && ci && ch) {
    const { status, body: swissLookup } = await api("/api/compliance-check", {
      method: "POST",
      body: JSON.stringify({ commodityId: cashew.id, originId: ci.id, destinationId: ch.id }),
    });
    assert("Swiss lookup status 200", status === 200);
    assert("Swiss destination", swissLookup.destination?.countryName?.toLowerCase().includes("switzerland"));
  }

  console.log("\n6. Readiness Score Engine");
  const { body: rs1 } = await api("/api/test/readiness-score", {
    method: "POST",
    body: JSON.stringify({ triggers: {}, hazards: [], stopFlags: null, requirementsDetailed: [] }),
  });
  assert("clean scenario = 100", rs1.score === 100);
  assert("clean verdict = GREEN", rs1.verdict === "GREEN");

  const { body: rs2 } = await api("/api/test/readiness-score", {
    method: "POST",
    body: JSON.stringify({
      triggers: { eudr: true, cbam: true, csddd: true },
      hazards: [],
      stopFlags: null,
      requirementsDetailed: [],
    }),
  });
  assert("3-overlay penalty = 30", rs2.factors.regulatory_complexity.penalty === 30);
  assert("3-overlay score = 70", rs2.score === 70);

  const { body: rs3 } = await api("/api/test/readiness-score", {
    method: "POST",
    body: JSON.stringify({ triggers: {}, hazards: [], stopFlags: { UNSC: "Sanctioned" }, requirementsDetailed: [] }),
  });
  assert("stop flag → RED", rs3.verdict === "RED");

  console.log("\n7. Demurrage Calculator");
  const { body: dm1 } = await api("/api/test/demurrage", {
    method: "POST",
    body: JSON.stringify({ baseRate: 85, chargeableDays: 0 }),
  });
  assert("0 days → total 0", dm1.total === 0);

  const { body: dm2 } = await api("/api/test/demurrage", {
    method: "POST",
    body: JSON.stringify({ baseRate: 100, chargeableDays: 5 }),
  });
  assert("5 days → $500", dm2.total === 500);
  assert("5 days → 1 tier", dm2.tiers.length === 1);

  const { body: dm3 } = await api("/api/test/demurrage", {
    method: "POST",
    body: JSON.stringify({ baseRate: 100, chargeableDays: 10 }),
  });
  assert("10 days → $1150", dm3.total === 1150);
  assert("10 days → 2 tiers", dm3.tiers.length === 2);

  const { body: dm4 } = await api("/api/test/demurrage", {
    method: "POST",
    body: JSON.stringify({ baseRate: 80, chargeableDays: 20 }),
  });
  const expected = 7 * 80 + 7 * 120 + 6 * 160;
  assert(`20 days → $${expected}`, dm4.total === expected);

  console.log("\n8. LC Check");
  const { status: lcBadStatus } = await api("/api/lc-checks", {
    method: "POST",
    body: JSON.stringify({ lcFields: {}, documents: [] }),
  });
  assert("invalid LC → 400", lcBadStatus === 400);

  const { status: lcOk, body: lcBody } = await api("/api/lc-checks", {
    method: "POST",
    body: JSON.stringify({
      lcFields: {
        beneficiaryName: "Acme Exports Ltd",
        applicantName: "Global Imports Inc",
        goodsDescription: "Raw cashew nuts in bulk",
        hsCode: "0801.31",
        quantity: 25000,
        quantityUnit: "KG",
        unitPrice: 1.2,
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
        lcReference: "LC-BOT-TEST-001",
      },
      documents: [{
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
      }],
    }),
  });
  assert("valid LC → 200", lcOk === 200);
  assert("LC has verdict", ["COMPLIANT", "COMPLIANT_WITH_NOTES", "DISCREPANCIES_FOUND"].includes(lcBody?.summary?.verdict));

  console.log("\n9. Token Balance");
  const { status: tokenStatus, body: tokenBody } = await api("/api/tokens/balance");
  assert("token balance 200", tokenStatus === 200);
  assert("has balance field", typeof tokenBody?.balance === "number");

  console.log("\n10. Templates & Alerts");
  const { status: tmplStatus } = await api("/api/templates");
  assert("templates 200", tmplStatus === 200);

  const { status: alertStatus, body: alertBody } = await api("/api/alerts/unread-count");
  assert("unread-count 200", alertStatus === 200);
  assert("has count field", typeof alertBody?.count === "number");

  console.log("\n11. Dashboard & Supplier");
  const { status: dashStatus } = await api("/api/dashboard/stats");
  assert("dashboard stats 200", dashStatus === 200);

  const { status: inboxStatus } = await api("/api/supplier-inbox");
  assert("supplier inbox 200", inboxStatus === 200);

  console.log("\n" + "=".repeat(40));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (errors.length > 0) {
    console.log(`\nFailed tests:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log("=".repeat(40) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
