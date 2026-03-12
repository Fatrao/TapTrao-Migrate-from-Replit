import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import BlogLayout from "@/components/BlogLayout";

export default function BlogCocoa() {
  usePageTitle("What EUDR Actually Requires from Cocoa Importers — TapTrao");

  return (
    <BlogLayout>
      <div className="blog-breadcrumb">
        <Link href="/blog">Blog</Link>
        <span>›</span>
        EUDR &amp; Deforestation Due Diligence
      </div>

      <article className="blog-article">
        <div className="blog-post-header">
          <span className="blog-post-tag">EUDR · Cocoa · Ghana / Côte d'Ivoire</span>
          <h1>What EUDR actually requires from cocoa importers, and why most small businesses aren't ready</h1>
          <p className="blog-post-lede">
            The EU Deforestation Regulation is not coming. It is here. And for cocoa importers, the documentation
            requirements go far beyond anything most small traders have dealt with before.
          </p>
          <div className="blog-post-meta">
            <span>📦 Commodity: Cocoa Beans</span>
            <span>🌍 Corridor: Ghana / Côte d'Ivoire → EU / UK</span>
            <span>⏱ 8 min read</span>
          </div>
        </div>

        <img src="/blog/cocoa.jpg" alt="Cocoa beans drying on raised tables in Ghana" className="blog-hero-image" />

        <h2>The regulation that changed everything</h2>
        <p>
          For decades, importing cocoa into Europe meant managing the standard compliance checklist: phytosanitary
          certificate, fumigation declaration, bill of lading, country of origin certificate. Experienced traders
          had the process down to a rhythm.
        </p>
        <p>
          The EU Deforestation Regulation, EUDR, formally Regulation (EU) 2023/1115, changed the game entirely.
          From December 2024, any cocoa product placed on the EU market must be accompanied by a due diligence
          statement that proves the cocoa was <strong>not grown on land deforested after 31 December 2020</strong>.
          The burden of proof sits with the operator placing the goods on the market. That means you, the importer.
        </p>

        <div className="blog-scenario-box">
          <span className="blog-scenario-label">A situation that is becoming common</span>
          <p>
            "I've been buying from the same cooperative in Ghana for four years. Good people, good beans, never
            had a problem. Then someone told me I now need GPS coordinates for every farm plot. I called my
            contact there. He had no idea what I was talking about."
          </p>
        </div>

        <p>
          This is the gap that EUDR has created. EU importers are legally responsible for producing documentation
          that their suppliers, often smallholder cooperatives with no digital infrastructure, have never been
          asked to provide before.
        </p>

        <h2>What EUDR actually requires, in plain language</h2>
        <p>
          The regulation requires operators to collect and hold three categories of evidence before placing
          cocoa on the EU market:
        </p>

        <div className="blog-three-things">
          <div className="blog-thing-card">
            <div className="blog-thing-number">01</div>
            <div className="blog-thing-title">Geolocation data</div>
            <div className="blog-thing-desc">
              GPS coordinates or polygon data for every plot of land where the cocoa was grown. For cooperatives
              with many smallholder members, this means plot-level data for potentially hundreds of farmers.
            </div>
          </div>
          <div className="blog-thing-card">
            <div className="blog-thing-number">02</div>
            <div className="blog-thing-title">Risk assessment</div>
            <div className="blog-thing-desc">
              A documented assessment that the land was not subject to deforestation after 31 December 2020,
              drawing on satellite monitoring data and country-level risk classification.
            </div>
          </div>
          <div className="blog-thing-card">
            <div className="blog-thing-number">03</div>
            <div className="blog-thing-title">Due diligence statement</div>
            <div className="blog-thing-desc">
              A formal statement submitted to the EU Information System (EUDR IS) before the goods are placed
              on the market. Each shipment requires its own statement with a unique reference number.
            </div>
          </div>
        </div>

        <p>
          This is not a one-time registration. It applies to <strong>every shipment</strong>. If you import
          cocoa beans three times a year, you need three due diligence statements, each backed by the supporting
          geolocation and risk assessment documentation for that specific consignment.
        </p>

        <h2>Country risk classification matters</h2>
        <p>
          The EU Commission classifies countries as low, standard, or high risk for deforestation. This
          classification directly affects how much scrutiny your shipments receive and what your due diligence
          obligations look like in practice.
        </p>

        <div className="blog-info-card">
          <h3>How risk classification affects your shipments</h3>
          <p>
            <strong>Low-risk countries:</strong> Simplified due diligence applies. You still need to file a
            statement, but the evidence requirements are lighter and inspection rates at the border are lower.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Standard-risk countries:</strong> Full due diligence required. Geolocation data, risk
            assessment, and a due diligence statement are all mandatory for every shipment.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>High-risk countries:</strong> Enhanced scrutiny. A higher proportion of shipments will be
            physically checked at the border. Documentation needs to be airtight.
          </p>
          <p style={{ marginTop: 12 }}>
            Ghana and Côte d'Ivoire, the two largest cocoa-producing countries, are both classified as
            standard risk. This means full due diligence requirements apply to every consignment.
          </p>
        </div>

        <h2>The mistakes that will cost you</h2>
        <p>
          EUDR is new, the enforcement infrastructure is still being built, and many importers are taking a
          wait-and-see approach. That is a significant miscalculation. Here is what goes wrong for importers
          who are not properly prepared:
        </p>

        <ul className="blog-mistakes-list">
          <li>Submitting a due diligence statement without the underlying geolocation data — the statement is legally invalid without it, even if it is accepted by the system initially</li>
          <li>Using approximate or inaccurate plot coordinates — the regulation requires coordinates precise enough to allow satellite cross-referencing against forest cover data</li>
          <li>Assuming your supplier's sustainability certification (Rainforest Alliance, Fairtrade, etc.) substitutes for EUDR due diligence — it does not. Certification schemes are not equivalent to EUDR compliance</li>
          <li>Filing one due diligence statement for a supplier and reusing the reference number across multiple shipments — each shipment requires its own statement</li>
          <li>Not keeping your documentation for at least five years — the regulation requires records to be available for inspection for five years from the date of placing goods on the market</li>
          <li>Assuming enforcement will not affect small operators — the regulation applies to all operators regardless of size, though micro-enterprises have some simplified obligations</li>
        </ul>

        <div className="blog-penalty-box">
          <h3>What non-compliance looks like in practice</h3>
          <p>
            Member States are required to impose penalties that are "effective, proportionate, and dissuasive."
            The regulation specifies that fines should be <strong>at least 4% of annual turnover</strong> in the
            EU, and can include confiscation of goods and revenues, temporary exclusion from public procurement,
            and prohibition from placing the product on the market. These are not warning letters. They are
            business-ending consequences for a small importer.
          </p>
        </div>

        <h2>The supplier data problem</h2>
        <p>
          The single biggest practical obstacle for small cocoa importers is getting the geolocation data from
          their suppliers. Large multinational traders have invested heavily in supply chain mapping systems.
          Small importers typically rely on direct relationships with cooperatives or intermediary traders who
          may have no digital systems at all.
        </p>
        <p>
          Getting plot-level GPS data from a cooperative of 300 smallholder farmers in rural Ghana is not a
          quick conversation. It requires the cooperative to have mapped their members' plots, ideally using a
          polygon format rather than a single point coordinate, and to be willing to share that data with you
          in a format that is useful for your due diligence filing.
        </p>
        <p>
          This takes time to set up, and it takes trust. Importers who have not started this conversation with
          their suppliers are already behind.
        </p>

        <h2>What proper EUDR compliance looks like</h2>

        <ul className="blog-checklist">
          <li>Obtain polygon-level geolocation data for all farm plots in your supply chain before placing any goods on the EU market</li>
          <li>Cross-reference those coordinates against satellite forest cover data — the EU provides tools for this, and several third-party platforms also support it</li>
          <li>Document your risk assessment in writing, including the methodology used and the data sources consulted</li>
          <li>Submit a due diligence statement to the EUDR Information System before each shipment is placed on the market, not after arrival</li>
          <li>Retain all supporting documentation for a minimum of five years and ensure it is accessible for inspection</li>
          <li>Check your supplier country's current EUDR risk classification before each shipping season — classifications can change</li>
          <li>Include EUDR data provision as a contractual obligation in your supplier agreements going forward</li>
        </ul>

        {/* CTA */}
        <div className="blog-article-cta">
          <h2>Is your cocoa shipment EUDR ready?</h2>
          <p>
            TapTrao's pre-shipment compliance check covers EUDR due diligence requirements, geolocation data
            validation, risk classification, and documentation completeness — specific to your supplier country
            and shipment details.
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
