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
          <Link href="/lookup">
            <span style={{ background: "#4a8c6f", color: "white", padding: "7px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Free check →</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }} data-testid="page-privacy-policy">
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }} data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>Last updated: 19 February 2026</p>

        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7 }}>

          <Section title="1. Who We Are">
            <p>TapTrao is operated by Fatrao Limited, a company registered in England and Wales. TapTrao provides a trade compliance information platform for commodity importers trading in corridors out of Africa. Our registered contact email is <a href="mailto:hello@taptrao.com" style={linkStyle}>hello@taptrao.com</a>.</p>
          </Section>

          <Section title="2. What Data We Collect">
            <p style={{ marginBottom: 8 }}>We collect the following personal data when you use TapTrao:</p>
            <ul style={ulStyle}>
              <li><strong>Account information:</strong> name, email address, and password (encrypted) when you register</li>
              <li><strong>Usage data:</strong> compliance lookups you perform, features accessed, and session information</li>
              <li><strong>Payment data:</strong> processed securely by Stripe. We do not store card numbers or full payment details on our servers</li>
              <li><strong>Technical data:</strong> IP address, browser type, device type, and approximate location</li>
              <li><strong>Communications:</strong> any messages you send to hello@taptrao.com</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <p style={{ marginBottom: 8 }}>We use your data to:</p>
            <ul style={ulStyle}>
              <li>Provide and operate the TapTrao platform and your account</li>
              <li>Process payments via Stripe</li>
              <li>Send transactional emails (account confirmations, billing receipts)</li>
              <li>Monitor and improve platform performance and security</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p style={{ marginTop: 12 }}>We will not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </Section>

          <Section title="4. Analytics">
            <p>We intend to use Google Analytics to understand how users interact with TapTrao. This tool uses cookies to collect anonymised usage data. Analytics cookies are only placed if you explicitly opt in via the cookie consent banner. You may withdraw consent at any time via the Cookie Settings link in the footer.</p>
          </Section>

          <Section title="5. Legal Basis for Processing (UK GDPR)">
            <p style={{ marginBottom: 8 }}>We process your personal data under the following legal bases:</p>
            <ul style={ulStyle}>
              <li><strong>Contract performance:</strong> to provide the services you have signed up for</li>
              <li><strong>Legitimate interests:</strong> to improve our platform and prevent fraud</li>
              <li><strong>Legal obligation:</strong> where required by applicable law</li>
              <li><strong>Consent:</strong> for non-essential analytics cookies</li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain your account data for as long as your account is active. If you close your account, we will delete your personal data within 90 days, except where we are required to retain it for legal or tax purposes (typically up to 7 years for financial records under UK law).</p>
          </Section>

          <Section title="7. Your Rights">
            <p style={{ marginBottom: 8 }}>Under UK GDPR and applicable Canadian privacy law (PIPEDA), you have the right to:</p>
            <ul style={ulStyle}>
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention obligations)</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability — receive your data in a structured, machine-readable format</li>
              <li>Withdraw consent for analytics cookies at any time</li>
            </ul>
            <p style={{ marginTop: 12 }}>To exercise any of these rights, contact us at <a href="mailto:hello@taptrao.com" style={linkStyle}>hello@taptrao.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={linkStyle}>ico.org.uk</a>.</p>
          </Section>

          <Section title="8. International Transfers">
            <p>TapTrao is operated from the United Kingdom. We use Stripe for payment processing, which may process data in the United States under Standard Contractual Clauses or equivalent safeguards. Where your data is transferred outside the UK or EEA, we ensure appropriate safeguards are in place in accordance with UK GDPR requirements.</p>
          </Section>

          <Section title="9. Security">
            <p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. However, no internet transmission is completely secure and we cannot guarantee absolute security.</p>
          </Section>

          <Section title="10. Cookies">
            <p style={{ marginBottom: 12 }}>We use essential cookies to operate your session and account login. These are strictly necessary and do not require your consent.</p>
            <p style={{ marginBottom: 12 }}>We intend to implement Google Analytics, which uses non-essential analytics cookies. These are only placed after you explicitly opt in via our cookie banner. You may withdraw consent at any time via the Cookie Settings link in the footer or through your browser settings.</p>
            <p>We do not use cookies for advertising or marketing purposes.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. Continued use of TapTrao after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="12. Contact">
            <p>For privacy-related queries or to exercise your rights, contact: <a href="mailto:hello@taptrao.com" style={linkStyle}>hello@taptrao.com</a></p>
            <p style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Fatrao Limited — Registered in England and Wales</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = { color: "#6b9080", textDecoration: "underline" };
const ulStyle: React.CSSProperties = { paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 6 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "var(--fh)", fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}
