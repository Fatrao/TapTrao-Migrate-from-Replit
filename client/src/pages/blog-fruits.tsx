import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import BlogLayout from "@/components/BlogLayout";

export default function BlogFruits() {
  usePageTitle("The 14-Day Phytosanitary Window for Tropical Fruit Importers — TapTrao");

  return (
    <BlogLayout>
      <div className="blog-breadcrumb">
        <Link href="/blog">Blog</Link>
        <span>›</span>
        Phytosanitary &amp; UK Border Controls
      </div>

      <article className="blog-article">
        <div className="blog-post-header">
          <span className="blog-post-tag">Phytosanitary · UK Border Controls · Perishables</span>
          <h1>The 14-day window that catches tropical fruit importers off guard</h1>
          <p className="blog-post-lede">
            A phytosanitary certificate for fresh fruit imports into the UK is valid for just 14 days from the
            date of inspection. Combine that with a sea transit from West Africa, an IPAFFS pre-notification
            deadline, and the reality of UK port inspection backlogs, and the window is tighter than most
            traders realise.
          </p>
          <div className="blog-post-meta">
            <span>📦 Commodity: Tropical Fruits</span>
            <span>🌍 Corridor: Ghana / Kenya → UK</span>
            <span>⏱ 7 min read</span>
          </div>
        </div>

        <img src="/blog/fruits.jpg" alt="West African tropical fruit market with mango, pineapple and plantain" className="blog-hero-image" />

        <h2>Fresh produce and unforgiving timelines</h2>
        <p>
          Importing fresh tropical fruit is one of the most time-sensitive trades there is. The goods have a
          biological clock from the moment they leave the farm. But there is another clock running simultaneously —
          the regulatory one — and the two do not always align in your favour.
        </p>
        <p>
          Every consignment of fresh fruit entering the UK from a third country must be accompanied by a
          phytosanitary certificate issued by the national plant protection organisation (NPPO) in the country
          of origin. That certificate is valid for a fixed period. For most fresh fruit coming from West or
          East Africa, that validity window is <strong>14 days from the date of the plant health inspection</strong>.
        </p>

        <div className="blog-scenario-box">
          <span className="blog-scenario-label">How it goes wrong</span>
          <p>
            "The inspection was done on day one. The fruit was loaded on day three. The vessel was delayed by
            weather for five days. By the time we arrived at Tilbury and went through IPAFFS, the certificate
            had nine days left. The inspection wasn't scheduled until day 15. We failed on a technicality."
          </p>
        </div>

        <p>
          This is not an edge case. It happens regularly to importers who understand their produce perfectly
          well but have not mapped every step of the compliance timeline against the certificate validity period.
        </p>

        <h2>Understanding what IPAFFS actually requires</h2>
        <p>
          Since the UK left the EU, phytosanitary controls for plant products entering Great Britain are managed
          through the Import of Products, Animals, Food and Feed System, IPAFFS. This is the system importers
          or their agents use to pre-notify the UK government that a consignment of plant products is arriving.
        </p>

        <div className="blog-info-card">
          <h3>The IPAFFS pre-notification requirement</h3>
          <p>
            For fresh fruit and vegetables from high-priority third countries, IPAFFS requires pre-notification{" "}
            <strong>at least one working day before the expected arrival</strong> at the point of entry. For some
            categories, the requirement is longer. The pre-notification must include details of the phytosanitary
            certificate, and the certificate must still be valid at the time of inspection — not just at the time
            of pre-notification.
          </p>
        </div>

        <p>
          The inspection itself is conducted by an Official Veterinarian or Plant Health Inspector at the border
          control post. If the certificate has expired by the time that inspection takes place, the consignment
          fails — regardless of how good the fruit looks or how long your relationship with the supplier is.
        </p>

        <h2>The timing problem in practice</h2>
        <p>
          Here is how the timeline typically plays out for a consignment of mangoes from Ghana to a UK importer:
        </p>

        <div className="blog-timeline">
          <div className="blog-timeline-item">
            <div className="blog-timeline-dot green">D1</div>
            <div className="blog-timeline-content">
              <strong>Phytosanitary inspection at origin (Day 1)</strong>
              <p>The NPPO inspector visits the packhouse. Certificate is issued. 14-day clock starts.</p>
            </div>
          </div>
          <div className="blog-timeline-item">
            <div className="blog-timeline-dot green">D3</div>
            <div className="blog-timeline-content">
              <strong>Goods loaded, vessel departs (Day 3)</strong>
              <p>2 days consumed before the ship even leaves. 12 days remaining.</p>
            </div>
          </div>
          <div className="blog-timeline-item">
            <div className="blog-timeline-dot amber">D10</div>
            <div className="blog-timeline-content">
              <strong>Vessel arrives at UK port (Day 10)</strong>
              <p>Normal transit. 4 days remaining on certificate. IPAFFS pre-notification submitted.</p>
            </div>
          </div>
          <div className="blog-timeline-item">
            <div className="blog-timeline-dot amber">D13</div>
            <div className="blog-timeline-content">
              <strong>Physical inspection scheduled (Day 13)</strong>
              <p>Port backlogs push inspection back 3 days. 1 day remaining on certificate.</p>
            </div>
          </div>
          <div className="blog-timeline-item">
            <div className="blog-timeline-dot red">D15</div>
            <div className="blog-timeline-content">
              <strong>Inspection takes place (Day 15)</strong>
              <p>Certificate expired on Day 14. Consignment fails. Goods cannot be released.</p>
            </div>
          </div>
        </div>

        <p>
          Notice that nothing went wrong in the conventional sense. The fruit is fine. The supplier did
          everything right. The certificate was legitimate. But the cumulative effect of normal, expected
          delays — loading time, transit time, port backlog — consumed the validity window before the
          inspection could be completed.
        </p>

        <h2>What a border hold costs a fresh produce importer</h2>

        <div className="blog-cost-grid">
          <div className="blog-cost-card">
            <div className="blog-cost-number">£350+</div>
            <div className="blog-cost-label">Per day cold store charges at major UK ports per pallet</div>
          </div>
          <div className="blog-cost-card">
            <div className="blog-cost-number">3–5</div>
            <div className="blog-cost-label">Days typical delay when a phytosanitary issue requires resolution</div>
          </div>
          <div className="blog-cost-card">
            <div className="blog-cost-number">100%</div>
            <div className="blog-cost-label">Of fresh goods lost if hold extends beyond the produce's shelf life</div>
          </div>
        </div>

        <p>
          For perishable goods, a border hold is not just an inconvenience — it is a direct threat to the entire
          value of the consignment. Unlike manufactured goods that can sit in a warehouse while a compliance
          dispute is resolved, fresh fruit cannot wait. Every day in a cold store is a day off the shelf life
          you promised your buyer.
        </p>

        <div className="blog-warning-box">
          <p>
            <strong>UK General Marketing Standards:</strong> Fresh fruit entering the UK for retail sale must
            also comply with UK General Marketing Standards, which set minimum quality grades. Fruit that has
            deteriorated during an extended border hold may fail these standards even after a phytosanitary
            issue is resolved, creating a second rejection on top of the first.
          </p>
        </div>

        <h2>The other compliance layer: commodity-specific requirements</h2>
        <p>
          Phytosanitary certificates are just one element of the compliance picture for tropical fruit imports.
          Depending on the commodity and origin, additional requirements can apply:
        </p>

        <div className="blog-info-card">
          <h3>What else can catch you out</h3>
          <p>
            <strong>Specific pest interceptions:</strong> Certain pests, including fruit flies, mealybugs, and
            false codling moth, trigger immediate action at UK borders. If your fruit shows signs of pest
            infestation, the consignment can be detained regardless of the phytosanitary certificate status.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>High-priority country controls:</strong> Some origin countries are subject to specific import
            conditions or enhanced checks based on their historical pest interception record. Ghana, for example,
            has had mangoes subject to specific controls relating to fruit fly risk.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Pesticide MRL compliance:</strong> Fresh fruit is also subject to UK MRL controls for
            pesticide residues. A consignment that passes phytosanitary checks can still be rejected if routine
            testing finds residues above the legal limit.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Labelling requirements:</strong> Outer packaging must be labelled with country of origin,
            variety, grade, and pack size. Missing or incorrect labelling can trigger a hold at the point of
            customs clearance.
          </p>
        </div>

        <h2>The mistakes importers make</h2>

        <ul className="blog-mistakes-list">
          <li>Not checking the phytosanitary certificate date before goods are loaded — by the time you discover the timing problem, the ship is already at sea</li>
          <li>Assuming that submitting IPAFFS pre-notification automatically books an inspection slot — it does not. Inspections are subject to capacity at the border control post</li>
          <li>Not factoring transit time variability into certificate validity planning — a vessel delay of even three days can move you from comfortable to critical</li>
          <li>Using a freight forwarder who handles the paperwork but does not flag compliance risks — many forwarders will process documents without cross-checking validity windows</li>
          <li>Not knowing that certain UK ports have longer inspection backlogs than others — choosing the right port of entry can make a material difference to timing</li>
          <li>Failing to specify inspection timing in the supplier contract — if the phytosanitary inspection happens too early in the export process, the certificate may not survive the journey</li>
        </ul>

        <h2>How to protect your fresh fruit consignments</h2>

        <ul className="blog-checklist">
          <li>Map the full timeline before each shipment — from inspection date to expected UK inspection date — and verify the certificate validity covers the entire journey with a safety margin</li>
          <li>Instruct your supplier to schedule the phytosanitary inspection as close to loading as possible, not as close to harvest as possible</li>
          <li>Submit your IPAFFS pre-notification as early as permitted and confirm the inspection slot before the vessel arrives</li>
          <li>Check whether your origin country or commodity is subject to any specific import conditions or enhanced checks under current UK plant health rules</li>
          <li>Verify pesticide MRL compliance alongside phytosanitary documentation — both can cause a rejection and both should be checked before loading</li>
          <li>Know the inspection capacity situation at your intended port of entry and build contingency into your timing plan</li>
        </ul>

        {/* CTA */}
        <div className="blog-article-cta">
          <h2>Check your fruit shipment before it leaves</h2>
          <p>
            TapTrao's pre-shipment compliance check covers phytosanitary certificate validity, IPAFFS requirements,
            UK General Marketing Standards, pesticide MRL compliance, and commodity-specific import conditions —
            all in one check before your goods leave the origin country.
          </p>
          <Link href="/new-check" className="blog-btn-sage">Run a Free Compliance Check</Link>
        </div>

        {/* Related posts */}
        <div className="blog-related-posts">
          <h3>More from the TapTrao blog</h3>
          <div className="blog-related-grid">
            <Link href="/blog/sesame-seeds-nigeria" className="blog-related-card">
              <span className="blog-rel-tag">Food Safety · EU MRLs</span>
              <p>Why sesame seeds from Nigeria keep getting rejected at Rotterdam</p>
            </Link>
            <Link href="/blog/cocoa-eudr-importers" className="blog-related-card">
              <span className="blog-rel-tag">EUDR · Cocoa</span>
              <p>What EUDR actually requires from cocoa importers, and why most aren't ready</p>
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
