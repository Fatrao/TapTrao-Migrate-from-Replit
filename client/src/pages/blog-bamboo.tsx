import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import BlogLayout from "@/components/BlogLayout";

export default function BlogBamboo() {
  usePageTitle("Bamboo Is a Forest Product Under EUDR — TapTrao");

  return (
    <BlogLayout>
      <div className="blog-breadcrumb">
        <Link href="/blog">Blog</Link>
        <span>›</span>
        EUDR &amp; Forest Products
      </div>

      <article className="blog-article">
        <div className="blog-post-header">
          <span className="blog-post-tag">EUDR · Bamboo · Forest Products</span>
          <h1>Bamboo is a forest product under EUDR. Most importers don't know that yet.</h1>
          <p className="blog-post-lede">
            Bamboo traders have largely stayed out of the EUDR conversation, assuming the regulation is a
            problem for cocoa and timber importers. It is not. Bamboo falls squarely within scope, and the
            HS code you use determines everything.
          </p>
          <div className="blog-post-meta">
            <span>📦 Commodity: Raw Bamboo</span>
            <span>🌍 Corridor: Ethiopia / East Africa → EU</span>
            <span>⏱ 7 min read</span>
          </div>
        </div>

        <img src="/blog/bamboo.jpg" alt="Ethiopian highland bamboo forest" className="blog-hero-image" />

        <h2>The regulation most bamboo importers aren't watching</h2>
        <p>
          When the EU Deforestation Regulation (EUDR) was debated and passed, the coverage focused heavily on the
          headline commodities: cocoa, coffee, soy, cattle, palm oil, wood. Bamboo barely got a mention in the
          trade press. This has given many bamboo importers a false sense of security.
        </p>
        <p>
          The reality is more complicated. Bamboo's position under EUDR depends on how it is classified, and that
          classification is determined by the HS code you use when declaring the goods. Get the HS code wrong, or
          use a code that sits within the EUDR's scope without knowing it, and you have a due diligence obligation
          you are not meeting.
        </p>

        <div className="blog-scenario-box">
          <span className="blog-scenario-label">The conversation nobody had</span>
          <p>
            "I'd been importing raw bamboo culms from Ethiopia for two years. The freight forwarder handled the
            HS codes. I assumed it was just a plant product. Nobody mentioned EUDR. The first time I heard about
            it in connection with bamboo was when a customs agent in Rotterdam flagged my due diligence statement
            as missing."
          </p>
        </div>

        <h2>How bamboo fits into the EUDR framework</h2>
        <p>
          EUDR covers products listed in Annex I of Regulation (EU) 2023/1115. The relevant product category
          here is <strong>wood and derived wood products</strong>, and this is where bamboo's unusual botanical
          status creates confusion.
        </p>
        <p>
          Botanically, bamboo is a grass, not a tree. But for the purposes of EU customs classification and EUDR,
          what matters is how the product is coded, what it is used for, and whether it originates from forested
          land. Raw bamboo culms sourced from natural forest stands, as much Ethiopian highland bamboo is, are
          treated as forest products. The deforestation question applies directly.
        </p>

        <div className="blog-hs-codes">
          <h3>Bamboo HS codes and EUDR scope</h3>

          <div className="blog-hs-row">
            <span className="blog-hs-code">1401.10</span>
            <span className="blog-hs-desc">Bamboo, used for plaiting, basket-making, wickerwork. Raw culms, unprocessed.</span>
            <span className="blog-hs-flag eudr">EUDR scope, check required</span>
          </div>

          <div className="blog-hs-row">
            <span className="blog-hs-code">4401.29</span>
            <span className="blog-hs-desc">Wood in chips or particles — bamboo chips fall here when processed for fuel or board manufacture.</span>
            <span className="blog-hs-flag eudr">EUDR scope, check required</span>
          </div>

          <div className="blog-hs-row">
            <span className="blog-hs-code">4412.10</span>
            <span className="blog-hs-desc">Plywood of bamboo. Engineered bamboo panel products.</span>
            <span className="blog-hs-flag eudr">EUDR scope, check required</span>
          </div>

          <div className="blog-hs-row">
            <span className="blog-hs-code">0604.90</span>
            <span className="blog-hs-desc">Foliage, branches, ornamental bamboo for floral industry use.</span>
            <span className="blog-hs-flag maybe">Borderline, verify against use</span>
          </div>
        </div>

        <p>
          The critical point is that misclassifying your bamboo into an HS code outside EUDR scope does not exempt
          you from the obligation — it just means your documentation is wrong, which creates a separate compliance
          problem on top of the original one.
        </p>

        <h2>The HS code misclassification problem</h2>
        <p>
          HS code misclassification is one of the most common and costly errors in commodity imports. For bamboo,
          the temptation is to use a code that feels intuitive — bamboo is a plant, so perhaps a horticultural or
          agricultural code seems appropriate. But each HS code carries specific regulatory implications, and
          using the wrong one creates compounding problems:
        </p>

        <div className="blog-info-card">
          <h3>What goes wrong when you use the wrong HS code</h3>
          <p>
            <strong>Wrong duty rate:</strong> Different HS codes attract different import duty rates under the
            EU Common Customs Tariff. Using an incorrect code means you may be underpaying or overpaying duty,
            both of which create problems on audit.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Wrong regulatory regime:</strong> A bamboo product classified under an agricultural HS code
            may not trigger EUDR checks at the border, but that does not mean the obligation doesn't apply. If
            the goods are subsequently audited or the classification is challenged, you face both a
            misclassification penalty and an EUDR compliance failure.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Wrong phytosanitary requirements:</strong> Some bamboo products require phytosanitary
            certification; others do not. The HS code influences which inspection regime applies at the border
            control post.
          </p>
        </div>

        <h2>The phytosanitary layer that adds to the complexity</h2>
        <p>
          Raw bamboo culms are a regulated plant product in both the EU and UK. Depending on the origin country
          and the specific bamboo species, a phytosanitary certificate issued by the origin country's NPPO may be
          required. Ethiopia, as a source of natural highland bamboo, has specific requirements around pest
          documentation, particularly relating to bamboo borers and other wood-boring insects that can be present
          in raw culms.
        </p>
        <p>
          This means a bamboo importer potentially has to manage two separate compliance regimes simultaneously:
          EUDR due diligence (including geolocation data for the harvest area) and phytosanitary certification.
          Missing either one causes a problem at the border.
        </p>

        <div className="blog-warning-box">
          <p>
            <strong>Note on demurrage:</strong> Raw bamboo, unlike perishable goods, can sit in a container for
            weeks without deteriorating. This can give importers a false sense of security when a consignment is
            held at a port. But the demurrage clock is running regardless — at €150 or more per container per day
            at major EU ports, a 20-day hold while a compliance dispute is resolved represents €3,000 or more in
            charges before the goods are even released.
          </p>
        </div>

        <h2>The mistakes bamboo importers make</h2>

        <ul className="blog-mistakes-list">
          <li>Assuming EUDR does not apply to bamboo because it is a grass, not a tree — scope is determined by product classification and land use, not botanical taxonomy</li>
          <li>Delegating HS code selection entirely to the freight forwarder without understanding the regulatory implications of each code option</li>
          <li>Not obtaining geolocation data for the bamboo harvest area — natural forest bamboo in Ethiopia and other African countries requires the same polygon-level data as timber or cocoa</li>
          <li>Treating a supplier's sustainability certificate as a substitute for EUDR due diligence documentation — it is not</li>
          <li>Not checking whether a phytosanitary certificate is required for your specific bamboo product and origin country combination</li>
          <li>Filing an EUDR due diligence statement without a reference number from the EU Information System — a statement that hasn't been formally lodged is not compliant</li>
        </ul>

        <div className="blog-penalty-box">
          <h3>The cost of getting this wrong</h3>
          <p>
            EUDR penalties under Member State implementing legislation are required to be proportionate to the
            economic value of the goods concerned and the environmental harm. For importers placing goods on the
            EU market without a valid due diligence statement, authorities can order the goods to be withdrawn
            from the market, issue fines of up to 4% of EU annual turnover, and refer repeat violations for
            criminal investigation. For a small bamboo trader, even a single serious violation can be a
            business-ending event.
          </p>
        </div>

        <h2>What proper compliance looks like for bamboo importers</h2>

        <ul className="blog-checklist">
          <li>Confirm the correct HS code for your specific bamboo product with a customs specialist before declaring, not after</li>
          <li>Determine whether your HS code falls within EUDR Annex I scope and, if so, initiate the due diligence process for every shipment</li>
          <li>Obtain polygon-level GPS data for the bamboo harvest area — natural forest stands require the same rigour as any other EUDR-covered forest product</li>
          <li>Carry out and document a deforestation risk assessment, cross-referencing the harvest location against satellite forest cover data for the period after 31 December 2020</li>
          <li>Submit a due diligence statement to the EU Information System and obtain a reference number before placing goods on the EU market</li>
          <li>Check whether a phytosanitary certificate is required for your bamboo product and obtain it from the origin country NPPO before loading</li>
          <li>Keep all documentation for five years and ensure it is accessible for inspection by the competent authority in the Member State where you are placing the goods on the market</li>
        </ul>

        {/* CTA */}
        <div className="blog-article-cta">
          <h2>Not sure if your bamboo shipment needs EUDR compliance?</h2>
          <p>
            TapTrao's pre-shipment check covers HS code verification, EUDR scope determination, due diligence
            requirements, phytosanitary certification, and documentation completeness — specific to your
            commodity, origin, and destination.
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
            <Link href="/blog/sesame-seeds-nigeria" className="blog-related-card">
              <span className="blog-rel-tag">Food Safety · EU MRLs</span>
              <p>Why sesame seeds from Nigeria keep getting rejected at Rotterdam</p>
            </Link>
            <Link href="/blog/tropical-fruits-phytosanitary" className="blog-related-card">
              <span className="blog-rel-tag">Phytosanitary · UK</span>
              <p>The 14-day window that catches tropical fruit importers off guard</p>
            </Link>
          </div>
        </div>
      </article>
    </BlogLayout>
  );
}
