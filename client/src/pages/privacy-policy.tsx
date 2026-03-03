import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PrivacyPolicy() {
  usePageTitle("Privacy Policy", "TapTrao Privacy Policy — how we collect, use, and protect your data.");

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "var(--fb)", WebkitFontSmoothing: "antialiased" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <img src="/logo.png" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.95)" }}>TapTrao</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }}>Dashboard</span>
          </Link>
          <Link href="/">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }}>&larr; Home</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }} data-testid="page-privacy-policy">
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }} data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>Last updated: 3 March 2026</p>

        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7 }}>

          <Section title="1. Data Controller">
            <p>
              TapTrao is operated by <strong>Fatrao Limited</strong>, a company incorporated in England and Wales
              (Company Number: 16513622).
            </p>
            <p style={{ marginTop: 12 }}>
              Registered office:<br />
              71–75 Shelton Street<br />
              Covent Garden<br />
              London<br />
              United Kingdom<br />
              WC2H 9JQ
            </p>
            <p style={{ marginTop: 12 }}>Director: Fatime Traore</p>
            <p style={{ marginTop: 12 }}>
              For the purposes of the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018,
              Fatrao Limited is the data controller of the personal data described in this Privacy Policy.
            </p>
            <p style={{ marginTop: 12 }}>
              Contact email: <a href="mailto:Legal@taptrao.com" style={linkStyle}>Legal@taptrao.com</a>
            </p>
          </Section>

          <Section title="2. Scope of This Policy">
            <p style={{ marginBottom: 8 }}>
              This Privacy Policy explains how we collect, use, store, and protect personal data when you:
            </p>
            <ul style={ulStyle}>
              <li>Create or use a TapTrao account</li>
              <li>Submit information through our website forms</li>
              <li>Use our trade compliance platform</li>
              <li>Interact with our marketing communications</li>
              <li>Visit our website</li>
            </ul>
          </Section>

          <Section title="3. Personal Data We Collect">
            <h3 style={h3Style}>3.1 Account Information</h3>
            <ul style={ulStyle}>
              <li>Name</li>
              <li>Email address</li>
              <li>Encrypted password</li>
            </ul>

            <h3 style={h3Style}>3.2 Lead Capture Information</h3>
            <ul style={ulStyle}>
              <li>Email address</li>
              <li>Company name (optional)</li>
            </ul>

            <h3 style={h3Style}>3.3 Usage Data</h3>
            <ul style={ulStyle}>
              <li>Compliance lookups performed</li>
              <li>Features accessed</li>
              <li>Session timestamps</li>
              <li>Platform interaction data</li>
            </ul>

            <h3 style={h3Style}>3.4 Marketing Attribution Data</h3>
            <p>
              When you access TapTrao via external links (e.g., LinkedIn, email campaigns, industry forums),
              we collect UTM parameters such as source, medium, campaign, content, and term.
              These are associated with your browser session and stored server-side for marketing performance analysis.
            </p>

            <h3 style={h3Style}>3.5 Payment Data</h3>
            <p>
              Payments are processed securely by Stripe. We do not store full card numbers or complete payment credentials on our servers.
            </p>

            <h3 style={h3Style}>3.6 Technical Data</h3>
            <ul style={ulStyle}>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device type</li>
              <li>Approximate geographic location</li>
            </ul>

            <h3 style={h3Style}>3.7 Communications Data</h3>
            <p>
              Any correspondence sent to <a href="mailto:Legal@taptrao.com" style={linkStyle}>Legal@taptrao.com</a> or through our website.
            </p>
          </Section>

          <Section title="4. How We Use Personal Data">
            <ul style={ulStyle}>
              <li>Provide, operate, and maintain the TapTrao platform</li>
              <li>Authenticate users and manage accounts</li>
              <li>Process payments via Stripe</li>
              <li>Send transactional communications</li>
              <li>Deliver regulatory updates where requested</li>
              <li>Analyse platform usage and improve performance</li>
              <li>Measure marketing channel effectiveness</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
            <p style={{ marginTop: 12 }}>We do not sell, rent, or trade personal data for advertising purposes.</p>
          </Section>

          <Section title="5. Legal Basis for Processing (UK GDPR)">
            <h3 style={h3Style}>Contract Performance</h3>
            <p>Where processing is necessary to provide services you have requested.</p>

            <h3 style={h3Style}>Legitimate Interests</h3>
            <p>
              Including improving platform functionality, ensuring security, preventing fraud,
              and understanding marketing performance. We rely on legitimate interests only where
              such interests do not override your fundamental rights and freedoms.
            </p>

            <h3 style={h3Style}>Legal Obligation</h3>
            <p>Where required by applicable law.</p>

            <h3 style={h3Style}>Consent</h3>
            <p>
              Required for non-essential analytics cookies and certain marketing communications.
              Consent may be withdrawn at any time via the Cookie Settings link, unsubscribe link,
              or by contacting <a href="mailto:Legal@taptrao.com" style={linkStyle}>Legal@taptrao.com</a>.
            </p>
          </Section>

          <Section title="6. Analytics and Tracking">
            <h3 style={h3Style}>Google Analytics (GA4)</h3>
            <p>
              We use Google Analytics 4 to collect pseudonymised analytics data including page views,
              feature usage, and conversion events. Analytics cookies are placed only after explicit consent.
            </p>

            <h3 style={h3Style}>UTM Attribution</h3>
            <p>
              UTM parameters are collected to evaluate marketing performance and are not used for profiling
              or third-party advertising.
            </p>

            <h3 style={h3Style}>Custom Event Tracking</h3>
            <p>With analytics consent, we track anonymised product interaction events.</p>
          </Section>

          <Section title="7. Data Retention">
            <ul style={ulStyle}>
              <li><strong>Account data:</strong> retained while account is active</li>
              <li><strong>Post-closure deletion:</strong> within 90 days (unless legal retention applies)</li>
              <li><strong>Financial records:</strong> up to 7 years</li>
              <li><strong>Lead capture data:</strong> up to 24 months</li>
              <li><strong>Session attribution data:</strong> up to 12 months</li>
            </ul>
          </Section>

          <Section title="8. International Transfers">
            <p>
              Some service providers, including Stripe and Google, may process data outside the UK.
              Where transfers occur, we rely on appropriate safeguards including the UK International
              Data Transfer Addendum or Standard Contractual Clauses.
            </p>
            <p style={{ marginTop: 12 }}>
              You may request further information about transfer safeguards by contacting{" "}
              <a href="mailto:Legal@taptrao.com" style={linkStyle}>Legal@taptrao.com</a>.
            </p>
          </Section>

          <Section title="9. Data Sharing">
            <p style={{ marginBottom: 8 }}>We may share data with:</p>
            <ul style={ulStyle}>
              <li>Payment processors</li>
              <li>Analytics providers</li>
              <li>Hosting providers</li>
              <li>Professional advisers</li>
              <li>Regulators or law enforcement where required</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              All third-party processors are subject to contractual data protection obligations.
            </p>
          </Section>

          <Section title="10. Security">
            <p>
              We implement appropriate technical and organisational measures including encrypted password storage,
              HTTPS encryption, secure infrastructure, and access controls. While we take reasonable steps to protect
              personal data, no transmission method over the internet is completely secure.
            </p>
          </Section>

          <Section title="11. Your Rights">
            <p>
              Under UK GDPR and applicable Canadian privacy laws, you have the right to access, correct, delete,
              restrict, object to processing, request portability, and withdraw consent.
            </p>
            <p style={{ marginTop: 12 }}>
              You may contact <a href="mailto:Legal@taptrao.com" style={linkStyle}>Legal@taptrao.com</a> to exercise these rights.
              We respond within one month.
            </p>
            <p style={{ marginTop: 12 }}>
              You may also lodge a complaint with the UK Information Commissioner's Office (ICO).
            </p>
          </Section>

          <Section title="12. Cookies">
            <h3 style={h3Style}>Essential Cookies</h3>
            <p>Required for login and core platform functionality.</p>

            <h3 style={h3Style}>Analytics Cookies</h3>
            <p>Used only with explicit consent.</p>

            <h3 style={h3Style}>Session Storage</h3>
            <p>
              Browser session storage is used to temporarily hold UTM parameters and is cleared when your browser closes.
            </p>
          </Section>

          <Section title="13. Children's Data">
            <p>
              TapTrao is not directed at individuals under 18 and we do not knowingly collect data from minors.
            </p>
          </Section>

          <Section title="14. Automated Decision-Making">
            <p>
              TapTrao does not engage in automated decision-making producing legal or similarly significant effects under UK GDPR Article 22.
            </p>
          </Section>

          <Section title="15. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Where changes are material, we will notify registered users
              and obtain renewed consent where legally required.
            </p>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Fatrao Limited — Company Number: 16513622 — Registered in England and Wales
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              71–75 Shelton Street, Covent Garden, London WC2H 9JQ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = { color: "#5dd9c1", textDecoration: "underline" };
const ulStyle: React.CSSProperties = { paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 6 };
const h3Style: React.CSSProperties = { fontFamily: "var(--fh)", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.95)", marginTop: 20, marginBottom: 8 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "var(--fh)", fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}
