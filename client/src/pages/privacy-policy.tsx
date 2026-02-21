import { AppLayout } from "@/components/nav-bar";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PrivacyPolicy() {
  usePageTitle("Privacy Policy", "TapTrao Privacy Policy — how we collect, use, and protect your data.");

  return (
    <AppLayout>
      <div className="max-w-[800px] mx-auto px-6 py-12" data-testid="page-privacy-policy">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: 19 February 2026</p>

        <div className="prose-legal space-y-8 text-foreground/90 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p>TapTrao is operated by Fatrao Limited, a company registered in England and Wales. TapTrao provides a trade compliance information platform for commodity importers trading in corridors out of Africa. Our registered contact email is <a href="mailto:hello@taptrao.com" className="text-primary hover:underline">hello@taptrao.com</a>.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">2. What Data We Collect</h2>
            <p className="mb-2">We collect the following personal data when you use TapTrao:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account information:</strong> name, email address, and password (encrypted) when you register</li>
              <li><strong>Usage data:</strong> compliance lookups you perform, features accessed, and session information</li>
              <li><strong>Payment data:</strong> processed securely by Stripe. We do not store card numbers or full payment details on our servers</li>
              <li><strong>Technical data:</strong> IP address, browser type, device type, and approximate location</li>
              <li><strong>Communications:</strong> any messages you send to hello@taptrao.com</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
            <p className="mb-2">We use your data to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and operate the TapTrao platform and your account</li>
              <li>Process payments via Stripe</li>
              <li>Send transactional emails (account confirmations, billing receipts)</li>
              <li>Monitor and improve platform performance and security</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p className="mt-3">We will not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">4. Analytics</h2>
            <p>We intend to use Google Analytics to understand how users interact with TapTrao. This tool uses cookies to collect anonymised usage data. Analytics cookies are only placed if you explicitly opt in via the cookie consent banner. You may withdraw consent at any time via the Cookie Settings link in the footer.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">5. Legal Basis for Processing (UK GDPR)</h2>
            <p className="mb-2">We process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contract performance:</strong> to provide the services you have signed up for</li>
              <li><strong>Legitimate interests:</strong> to improve our platform and prevent fraud</li>
              <li><strong>Legal obligation:</strong> where required by applicable law</li>
              <li><strong>Consent:</strong> for non-essential analytics cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you close your account, we will delete your personal data within 90 days, except where we are required to retain it for legal or tax purposes (typically up to 7 years for financial records under UK law).</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="mb-2">Under UK GDPR and applicable Canadian privacy law (PIPEDA), you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention obligations)</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability — receive your data in a structured, machine-readable format</li>
              <li>Withdraw consent for analytics cookies at any time</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:hello@taptrao.com" className="text-primary hover:underline">hello@taptrao.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ico.org.uk</a>.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">8. International Transfers</h2>
            <p>TapTrao is operated from the United Kingdom. We use Stripe for payment processing, which may process data in the United States under Standard Contractual Clauses or equivalent safeguards. Where your data is transferred outside the UK or EEA, we ensure appropriate safeguards are in place in accordance with UK GDPR requirements.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">9. Security</h2>
            <p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or disclosure. However, no internet transmission is completely secure and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">10. Cookies</h2>
            <p className="mb-3">We use essential cookies to operate your session and account login. These are strictly necessary and do not require your consent.</p>
            <p className="mb-3">We intend to implement Google Analytics, which uses non-essential analytics cookies. These are only placed after you explicitly opt in via our cookie banner. You may withdraw consent at any time via the Cookie Settings link in the footer or through your browser settings.</p>
            <p>We do not use cookies for advertising or marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. Continued use of TapTrao after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">12. Contact</h2>
            <p>For privacy-related queries or to exercise your rights, contact: <a href="mailto:hello@taptrao.com" className="text-primary hover:underline">hello@taptrao.com</a></p>
            <p className="mt-2 text-muted-foreground text-sm">Fatrao Limited — Registered in England and Wales</p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
