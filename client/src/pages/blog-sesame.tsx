import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import BlogLayout from "@/components/BlogLayout";

export default function BlogSesame() {
  usePageTitle("Why Sesame Seeds from Nigeria Keep Getting Rejected at Rotterdam — TapTrao");

  return (
    <BlogLayout>
      <div className="blog-breadcrumb">
        <Link href="/blog">Blog</Link>
        <span>›</span>
        Food Safety &amp; Pesticide Residues
      </div>

      <article className="blog-article">
        <div className="blog-post-header">
          <span className="blog-post-tag">Food Safety · EU Import Controls</span>
          <h1>Why sesame seeds from Nigeria keep getting rejected at Rotterdam, and what importers can do about it</h1>
          <p className="blog-post-lede">
            The EU's pesticide residue limits for sesame seeds are among the strictest in the world.
            They change without warning. And most small importers don't find out until their container
            is sitting at the port.
          </p>
          <div className="blog-post-meta">
            <span>📦 Commodity: Sesame Seeds</span>
            <span>🌍 Corridor: Nigeria / Ethiopia → EU</span>
            <span>⏱ 7 min read</span>
          </div>
        </div>

        <img src="/blog/sesame.jpg" alt="Sesame seeds in burlap sacks at a warehouse" className="blog-hero-image" />

        <h2>A shipment that looked perfect on paper</h2>
        <p>
          Imagine this. You've been importing sesame seeds from Nigeria for three years. You have a reliable
          supplier, a consistent buyer in Germany, and a smooth logistics chain through Rotterdam. Then one day,
          your container gets flagged for testing at the port.
        </p>
        <p>
          The result comes back: <strong>chlorpyrifos residues above the EU maximum residue limit (MRL)</strong>.
          Your entire shipment, 25 tonnes of white sesame seeds, is rejected. It cannot enter the EU. You have a
          matter of days to decide whether to re-export or destroy the goods. Either way, the container is sitting
          at the terminal, racking up demurrage charges by the hour.
        </p>

        <div className="blog-scenario-box">
          <span className="blog-scenario-label">The reality for small importers</span>
          <p>
            "My supplier had been testing against the same threshold for two years. Nobody told us the EU had
            quietly lowered the MRL. The test passed in Lagos. It failed in Rotterdam. That gap cost us everything."
          </p>
        </div>

        <p>
          This scenario plays out repeatedly across EU ports. Rotterdam, Hamburg, Antwerp — all of them see
          regular rejections of African sesame consignments, and the numbers are not small. This is not bad luck.
          It is a predictable, preventable compliance failure.
        </p>

        <h2>Why sesame seeds are especially high-risk</h2>
        <p>
          Sesame seeds imported into the EU are subject to testing under Regulation (EC) No 396/2005, which sets
          maximum residue limits for pesticides across all food and feed products. On paper, that sounds manageable.
          In practice, it creates three serious problems for small importers.
        </p>

        <div className="blog-info-card">
          <h3>Problem 1: The EU updates MRLs frequently, and quietly</h3>
          <p>
            The EU Commission regularly revises MRL thresholds through delegated regulations. A pesticide that was
            permissible at 0.05 mg/kg last year may now have a default limit of 0.01 mg/kg — the lowest detectable
            level — which in practice means a near-zero tolerance. These changes are published in the Official
            Journal of the EU, but there is no automatic alert to importers or their suppliers.
          </p>
        </div>

        <div className="blog-info-card">
          <h3>Problem 2: Your supplier is testing against the wrong standard</h3>
          <p>
            Nigerian and Ethiopian exporters typically test against their own national standards or the Codex
            Alimentarius international guidelines. These are not the same as EU MRLs. Chlorpyrifos, for example,
            is still widely used as an insecticide in West Africa. When the EU lowered its MRL for chlorpyrifos
            to 0.01 mg/kg in 2020, many African exporters continued applying it at levels that were previously
            acceptable, and continued testing against older thresholds.
          </p>
        </div>

        <div className="blog-info-card">
          <h3>Problem 3: EU border controls on sesame seeds are systematic, not random</h3>
          <p>
            The EU's RASFF (Rapid Alert System for Food and Feed) has flagged sesame seeds from Nigeria and
            Ethiopia repeatedly for pesticide residue violations. Once a commodity from a particular origin
            reaches a certain notification threshold, the EU Commission can mandate enhanced border inspection —
            meaning a higher percentage of shipments get tested, and the window for a problem to be caught narrows
            significantly.
          </p>
        </div>

        <h2>What a rejection actually costs you</h2>
        <p>
          Port rejections are not just an inconvenience. They are a financial event. Here is what typically
          happens when a container of sesame seeds fails an EU border pesticide test:
        </p>

        <div className="blog-cost-grid">
          <div className="blog-cost-card">
            <div className="blog-cost-number">21+</div>
            <div className="blog-cost-label">Days average hold while testing and decision process completes</div>
          </div>
          <div className="blog-cost-card">
            <div className="blog-cost-number">€150+</div>
            <div className="blog-cost-label">Per day demurrage charges at major EU ports per container</div>
          </div>
          <div className="blog-cost-card">
            <div className="blog-cost-number">100%</div>
            <div className="blog-cost-label">Of goods value at risk if destruction is ordered</div>
          </div>
        </div>

        <p>
          Beyond the immediate financial loss, a rejection has downstream consequences. Your buyer loses confidence.
          Your supplier relationship is strained. And if the rejection is logged in RASFF, it contributes to the
          enhanced inspection regime for your origin country, making future shipments more likely to be tested too.
        </p>

        <div className="blog-warning-box">
          <p>
            <strong>Important:</strong> If your shipment is ordered for destruction at an EU border point, you
            bear the cost of that destruction. You cannot simply "send it back" if re-export is not commercially
            viable. The clock starts ticking the moment the container arrives at the terminal.
          </p>
        </div>

        <h2>The mistakes importers make, and why they make them</h2>
        <p>
          Most compliance failures on sesame seeds are not the result of importers cutting corners. They happen
          because the information gap between EU regulatory requirements and African supply chains is genuinely
          large. These are the most common errors:
        </p>

        <ul className="blog-mistakes-list">
          <li>Relying on a Certificate of Analysis provided by the supplier without checking whether the pesticides tested match current EU MRLs</li>
          <li>Not specifying EU MRL compliance in the purchase contract, leaving the testing standard up to the supplier's discretion</li>
          <li>Using an outdated MRL reference; EU thresholds are updated multiple times per year and yesterday's compliant level may be today's violation</li>
          <li>Assuming that because the previous three shipments passed, the fourth will too — EU inspection rates are not constant and commodity risk ratings change</li>
          <li>Not knowing that enhanced border controls are in place for your origin country, which means a higher proportion of your shipments will be physically tested</li>
          <li>Failing to verify the specific pesticide panel the supplier is testing — some laboratories in West Africa do not test for chlorpyrifos at all if it is not specified</li>
        </ul>

        <h2>The regulatory framework you need to know</h2>

        <div className="blog-regulation-box">
          <h3>Key regulations for sesame seed importers</h3>
          <p>
            <strong>Regulation (EC) No 396/2005</strong> — The primary MRL regulation for the EU. Sets maximum
            residue limits for pesticides in food and feed. Updated continuously via Commission regulations.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>Regulation (EU) 2019/1793</strong> — Governs temporary increases in official controls at EU
            borders for certain products from certain countries. Sesame seeds from specific origins have appeared
            on this list, triggering mandatory testing rates of up to 50% of consignments.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>RASFF (Rapid Alert System for Food and Feed)</strong> — The EU's notification system for food
            safety hazards. Rejections are logged publicly. High notification rates from a specific origin can
            trigger Commission action including mandatory testing or import bans.
          </p>
        </div>

        <h2>How to protect your sesame seed shipments</h2>
        <p>
          The good news is that this is a solvable problem. Importers who run proper pre-shipment checks before
          their goods leave the origin country have a far better track record at EU borders. Here is what due
          diligence looks like in practice:
        </p>

        <ul className="blog-checklist">
          <li>Check the current EU MRL for every pesticide relevant to sesame cultivation — not just chlorpyrifos, but also ethion, profenofos, dimethoate, and others commonly used in West African agriculture</li>
          <li>Specify EU MRL compliance explicitly in your purchase contract and require your supplier to test against an EU-accredited laboratory's pesticide panel</li>
          <li>Verify whether your origin country is currently subject to enhanced border controls under Regulation (EU) 2019/1793 and factor this into your risk assessment</li>
          <li>Check RASFF notifications for your commodity and origin before finalising each shipment — recent alerts are a leading indicator of what border inspectors are focused on</li>
          <li>Ensure the Certificate of Analysis you receive from your supplier includes all pesticides on the EU watchlist for sesame seeds, not just the standard panel</li>
          <li>Run a pre-shipment compliance check that cross-references your supplier's test results against the current EU MRL database before the goods leave the farm gate</li>
        </ul>

        <p>
          The critical word there is <strong>before</strong>. By the time your container is at Rotterdam, the
          options available to you have narrowed significantly. Pre-shipment is where you have leverage. At the
          port, you have costs.
        </p>

        {/* CTA */}
        <div className="blog-article-cta">
          <h2>Check your sesame shipment before it leaves</h2>
          <p>
            TapTrao's pre-shipment compliance check covers EU MRL verification, RASFF alerts, border control
            status, and documentation requirements — specific to your origin country and commodity.
          </p>
          <Link href="/new-check" className="blog-btn-sage">Run a Free Compliance Check</Link>
        </div>

        {/* Related posts */}
        <div className="blog-related-posts">
          <h3>More from the TapTrao blog</h3>
          <div className="blog-related-grid">
            <Link href="/blog/cocoa-eudr-importers" className="blog-related-card">
              <span className="blog-rel-tag">EUDR · Cocoa</span>
              <p>What EUDR actually requires from cocoa importers, and why most aren't ready</p>
            </Link>
            <Link href="/blog/tropical-fruits-phytosanitary" className="blog-related-card">
              <span className="blog-rel-tag">Phytosanitary · UK</span>
              <p>The 14-day window that catches tropical fruit importers off guard</p>
            </Link>
            <Link href="/blog/bamboo-eudr-forest-product" className="blog-related-card">
              <span className="blog-rel-tag">EUDR · Forest Products</span>
              <p>Bamboo is a forest product under EUDR. Most importers don't know that yet</p>
            </Link>
          </div>
        </div>
      </article>
    </BlogLayout>
  );
}
