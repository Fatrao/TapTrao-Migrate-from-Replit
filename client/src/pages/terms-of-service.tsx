import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";

export default function TermsOfService() {
  usePageTitle("Terms of Service", "TapTrao Terms of Service — the rules and conditions for using our platform.");

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
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, cursor: "pointer" }}>← Home</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }} data-testid="page-terms-of-service">
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }} data-testid="text-terms-title">
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>Last updated: 19 February 2026</p>

        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7 }}>

          <Section title="1. Agreement to Terms">
            <p>By accessing or using TapTrao (taptrao.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the platform. TapTrao is operated by Fatrao Limited, registered in England and Wales.</p>
          </Section>

          <Section title="2. Description of Service">
            <p>TapTrao provides an automated pre-shipment screening platform that offers guidance on EUDR (EU Deforestation Regulation) due diligence workflows, duty estimates, document checklists, and letter of credit checking for commodity trade corridors out of Africa. TapTrao is a decision-support tool and does not provide legal, regulatory, or banking advice.</p>
          </Section>

          <Section title="3. IMPORTANT — Informational Use Only / Disclaimer">
            <p style={{ fontWeight: 600, marginBottom: 12 }}>PLEASE READ THIS SECTION CAREFULLY.</p>
            <p style={{ marginBottom: 12 }}>TapTrao provides general informational guidance only. Nothing on TapTrao constitutes legal advice, regulatory advice, customs advice, or any other form of professional advice.</p>
            <p style={{ marginBottom: 8 }}>Specifically:</p>
            <ul style={ulStyle}>
              <li>TapTrao's screening outputs are based on publicly available regulatory information and are provided for reference purposes only. They do not constitute a legal determination of your compliance status.</li>
              <li>EUDR requirements, duty rates, and trade regulations change frequently. TapTrao does not guarantee that information is current, complete, or accurate at the time of use.</li>
              <li>You are solely responsible for ensuring your business complies with all applicable laws and regulations, including EUDR, customs regulations, and any other regulatory requirements in your jurisdiction.</li>
              <li>TapTrao is not a substitute for qualified legal, regulatory, or customs advice. You should consult appropriate professionals before making compliance decisions.</li>
            </ul>
            <p style={{ marginTop: 12 }}>Fatrao Limited expressly disclaims all liability for any penalties, fines, regulatory sanctions, business losses, or other consequences arising from your reliance on information provided by TapTrao.</p>
          </Section>

          <Section title="4. Eligibility">
            <p>You must be at least 18 years of age and have the legal authority to enter into these Terms on behalf of yourself or any organisation you represent. By using TapTrao, you confirm you meet these requirements.</p>
          </Section>

          <Section title="5. User Accounts">
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately at <a href="mailto:hello@taptrao.com" style={linkStyle}>hello@taptrao.com</a> of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </Section>

          <Section title="6. Acceptable Use">
            <p style={{ marginBottom: 8 }}>You agree not to:</p>
            <ul style={ulStyle}>
              <li>Use TapTrao for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to reverse engineer, scrape, or extract data from the platform in bulk</li>
              <li>Resell or redistribute TapTrao's outputs without our written permission</li>
              <li>Introduce malware or attempt to disrupt the platform</li>
              <li>Misrepresent your identity or organisation</li>
              <li>Use TapTrao in violation of any applicable export control or sanctions laws</li>
            </ul>
          </Section>

          <Section title="7. Payments and Subscriptions">
            <p>Paid features are processed via Stripe. By purchasing trade credits, you authorise us to charge your payment method. Trade credits do not expire. Refunds are not provided for unused credits unless required by applicable consumer law.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>All content, software, data, and branding on TapTrao is owned by Fatrao Limited or its licensors. You are granted a limited, non-exclusive, non-transferable licence to use the platform for your internal business purposes. You retain ownership of any data you input into the platform.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p style={{ marginBottom: 12 }}>To the maximum extent permitted by applicable law, Fatrao Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, business interruption, or regulatory penalties, even if advised of the possibility of such damages.</p>
            <p>Our total aggregate liability to you for any claim arising under or in connection with these Terms shall not exceed the amount you paid to us in the 12 months preceding the claim, or £100, whichever is greater.</p>
          </Section>

          <Section title="10. Indemnification">
            <p>You agree to indemnify and hold harmless Fatrao Limited, its officers, employees, and agents from any claims, losses, or expenses (including legal fees) arising from your use of TapTrao, your violation of these Terms, or your violation of any applicable law or regulation.</p>
          </Section>

          <Section title="11. Modifications to the Service">
            <p>We reserve the right to modify, suspend, or discontinue any part of TapTrao at any time. We will provide reasonable notice of material changes where possible. Continued use after changes constitutes acceptance.</p>
          </Section>

          <Section title="12. Sanctions and Restricted Parties">
            <p style={{ marginBottom: 8 }}>By using TapTrao, you represent and warrant that:</p>
            <ul style={ulStyle}>
              <li>Neither you, nor any organisation you represent, nor any end user you act on behalf of, is named on any sanctions or restricted party list, including the UN Consolidated List, the UK Consolidated List of Financial Sanctions Targets (HM Treasury/OFSI), the EU Consolidated Sanctions List, or the US OFAC Specially Designated Nationals (SDN) list</li>
              <li>You are not located in, operating from, or acting on behalf of any person or entity in a jurisdiction subject to comprehensive sanctions (including but not limited to Iran, North Korea, Syria, Russia, Belarus, or Cuba)</li>
              <li>You will not use TapTrao in connection with any transaction involving a sanctioned party, country, or activity</li>
            </ul>
            <p style={{ marginTop: 12 }}>Fatrao Limited reserves the right to immediately suspend or terminate access if it reasonably believes you are in breach of this clause. You agree to indemnify Fatrao Limited for any fines, penalties, or losses arising from your violation of applicable sanctions laws.</p>
          </Section>

          <Section title="13. Export Controls">
            <p style={{ marginBottom: 8 }}>You acknowledge and agree that:</p>
            <ul style={ulStyle}>
              <li>Your use of TapTrao and any data, outputs, or software accessed through it must comply with all applicable export control laws and regulations, including the UK Export Control Order 2008, EU Dual-Use Regulation (2021/821), and US Export Administration Regulations (EAR)</li>
              <li>You are solely responsible for determining whether any export licence or authorisation is required for your use of TapTrao's outputs in connection with your trade activities</li>
              <li>You will not use TapTrao to facilitate the export, re-export, or transfer of controlled goods, technology, or services to any prohibited destination or end user without the required authorisation</li>
            </ul>
            <p style={{ marginTop: 12 }}>TapTrao does not provide export classification advice. Nothing in TapTrao's outputs constitutes an export determination or licence. You must obtain independent qualified advice for export control matters.</p>
          </Section>

          <Section title="14. Governing Law">
            <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. If you are based in Canada, you acknowledge that these Terms and any disputes remain subject to English law unless otherwise required by mandatory provisions of Canadian law. Nothing in these Terms limits any mandatory consumer rights you may have under your local law.</p>
          </Section>

          <Section title="15. Severability">
            <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>
          </Section>

          <Section title="16. Contact">
            <p>For questions about these Terms, contact us at: <a href="mailto:hello@taptrao.com" style={linkStyle}>hello@taptrao.com</a></p>
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
