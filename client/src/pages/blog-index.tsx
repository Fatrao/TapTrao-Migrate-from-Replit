import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";
import BlogLayout from "@/components/BlogLayout";

const POSTS = [
  {
    slug: "/blog/sesame-seeds-nigeria",
    image: "/blog/sesame.jpg",
    tag: "Food Safety · EU MRLs · Rotterdam",
    title: "Why sesame seeds from Nigeria keep getting rejected at Rotterdam",
    excerpt: "The EU updates pesticide residue limits frequently and without direct notice to importers. Here is what changes, why African suppliers keep missing it, and how to protect your shipment before it leaves.",
    readTime: "7 min read",
  },
  {
    slug: "/blog/cocoa-eudr-importers",
    image: "/blog/cocoa.jpg",
    tag: "EUDR · Cocoa · Ghana",
    title: "What EUDR actually requires from cocoa importers — and why most small businesses aren't ready",
    excerpt: "Geolocation data for every farm plot. A documented risk assessment. A due diligence statement filed before each shipment. EUDR is in force and the burden falls entirely on the importer.",
    readTime: "8 min read",
  },
  {
    slug: "/blog/tropical-fruits-phytosanitary",
    image: "/blog/fruits.jpg",
    tag: "Phytosanitary · UK Border · Perishables",
    title: "The 14-day window that catches tropical fruit importers off guard",
    excerpt: "A phytosanitary certificate is valid for just 14 days from inspection. Transit time, loading delays and port backlogs can consume that window before you even know there is a problem.",
    readTime: "7 min read",
  },
  {
    slug: "/blog/bamboo-eudr-forest-product",
    image: "/blog/bamboo.jpg",
    tag: "EUDR · Forest Products · Bamboo",
    title: "Bamboo is a forest product under EUDR. Most importers don't know that yet.",
    excerpt: "Bamboo traders have largely ignored EUDR, assuming it only applies to cocoa and timber. Depending on your HS code, it applies to you too — and the penalties are the same.",
    readTime: "7 min read",
  },
];

export default function BlogIndex() {
  usePageTitle("Blog — TapTrao Trade Compliance");

  return (
    <BlogLayout>
      {/* Hero */}
      <div className="blog-hero">
        <div className="blog-hero-label">TapTrao Blog</div>
        <h1>What every small importer needs to know before their next shipment</h1>
        <p>
          Plain-language guides on EU and UK import compliance. What the rules actually say,
          what happens when you get it wrong, and how to protect yourself before goods leave the origin country.
        </p>
      </div>

      {/* Cards grid */}
      <div className="blog-posts-wrap">
        <div className="blog-cards-grid">
          {POSTS.map((post) => (
            <Link key={post.slug} href={post.slug} className="blog-card">
              <img src={post.image} alt={post.title} className="blog-card-image" />
              <div className="blog-card-body">
                <span className="blog-card-tag">{post.tag}</span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-card-footer">
                  <span className="blog-read-link">
                    Continue reading <span className="arrow">→</span>
                  </span>
                  <span className="blog-card-meta">{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA bar */}
      <div className="blog-cta-bar">
        <h2>De-risk your next shipment before spending</h2>
        <p>Run a free compliance check on your commodity, corridor and documents in under two minutes.</p>
        <Link href="/new-check" className="blog-btn-sage">Free Compliance Check</Link>
      </div>
    </BlogLayout>
  );
}
