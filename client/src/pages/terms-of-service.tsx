import { AppLayout } from "@/components/nav-bar";
import { usePageTitle } from "@/hooks/use-page-title";

export default function TermsOfService() {
  usePageTitle("Terms of Service", "TapTrao Terms of Service — the rules and conditions for using our platform.");

  return (
    <AppLayout>
      <div className="max-w-[800px] mx-auto px-6 py-12" data-testid="page-terms-of-service">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2" data-testid="text-terms-title">
          Terms of Service
        </h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: 19 February 2026</p>

        <div className="prose-legal space-y-8 text-foreground/90 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using TapTrao (taptrao.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the platform. TapTrao is operated by Fatrao Limited, registered in England and Wales.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">2. Description of Service</h2>
            <p>TapTrao provides an informational trade compliance platform that offers guidance on EUDR (EU Deforestation Regulation) due diligence workflows, duty estimates, document checklists, and letter of credit checking for commodity trade corridors out of Africa.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">3. IMPORTANT — Informational Use Only / Disclaimer</h2>
            <p className="font-semibold mb-3">PLEASE READ THIS SECTION CAREFULLY.</p>
            <p className="mb-3">TapTrao provides general informational guidance only. Nothing on TapTrao constitutes legal advice, regulatory advice, customs advice, or any other form of professional advice.</p>
            <p className="mb-2">Specifically:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>TapTrao's compliance outputs are based on publicly available regulatory information and are provided for reference purposes only. They do not constitute a legal determination of your compliance status.</li>
              <li>EUDR requirements, duty rates, and trade regulations change frequently. TapTrao does not guarantee that information is current, complete, or accurate at the time of use.</li>
              <li>You are solely responsible for ensuring your business complies with all applicable laws and regulations, including EUDR, customs regulations, and any other regulatory requirements in your jurisdiction.</li>
              <li>TapTrao is not a substitute for qualified legal, regulatory, or customs advice. You should consult appropriate professionals before making compliance decisions.</li>
            </ul>
            <p className="mt-3">Fatrao Limited expressly disclaims all liability for any penalties, fines, regulatory sanctions, business losses, or other consequences arising from your reliance on information provided by TapTrao.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">4. Eligibility</h2>
            <p>You must be at least 18 years of age and have the legal authority to enter into these Terms on behalf of yourself or any organisation you represent. By using TapTrao, you confirm you meet these requirements.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">5. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately at <a href="mailto:hello@taptrao.com" className="text-primary hover:underline">hello@taptrao.com</a> of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">6. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use TapTrao for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to reverse engineer, scrape, or extract data from the platform in bulk</li>
              <li>Resell or redistribute TapTrao's outputs without our written permission</li>
              <li>Introduce malware or attempt to disrupt the platform</li>
              <li>Misrepresent your identity or organisation</li>
              <li>Use TapTrao in violation of any applicable export control or sanctions laws</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">7. Payments and Subscriptions</h2>
            <p>Paid plans are processed via Stripe. By subscribing, you authorise us to charge your payment method on a recurring basis. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are not provided for partial periods unless required by applicable consumer law.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p>All content, software, data, and branding on TapTrao is owned by Fatrao Limited or its licensors. You are granted a limited, non-exclusive, non-transferable licence to use the platform for your internal business purposes. You retain ownership of any data you input into the platform.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">To the maximum extent permitted by applicable law, Fatrao Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, business interruption, or regulatory penalties, even if advised of the possibility of such damages.</p>
            <p>Our total aggregate liability to you for any claim arising under or in connection with these Terms shall not exceed the amount you paid to us in the 12 months preceding the claim, or &pound;100, whichever is greater.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Fatrao Limited, its officers, employees, and agents from any claims, losses, or expenses (including legal fees) arising from your use of TapTrao, your violation of these Terms, or your violation of any applicable law or regulation.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">11. Modifications to the Service</h2>
            <p>We reserve the right to modify, suspend, or discontinue any part of TapTrao at any time. We will provide reasonable notice of material changes where possible. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">12. Sanctions and Restricted Parties</h2>
            <p className="mb-2">By using TapTrao, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Neither you, nor any organisation you represent, nor any end user you act on behalf of, is named on any sanctions or restricted party list, including the UN Consolidated List, the UK Consolidated List of Financial Sanctions Targets (HM Treasury/OFSI), the EU Consolidated Sanctions List, or the US OFAC Specially Designated Nationals (SDN) list</li>
              <li>You are not located in, operating from, or acting on behalf of any person or entity in a jurisdiction subject to comprehensive sanctions (including but not limited to Iran, North Korea, Syria, Russia, Belarus, or Cuba)</li>
              <li>You will not use TapTrao in connection with any transaction involving a sanctioned party, country, or activity</li>
            </ul>
            <p className="mt-3">Fatrao Limited reserves the right to immediately suspend or terminate access if it reasonably believes you are in breach of this clause. You agree to indemnify Fatrao Limited for any fines, penalties, or losses arising from your violation of applicable sanctions laws.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">13. Export Controls</h2>
            <p className="mb-2">You acknowledge and agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of TapTrao and any data, outputs, or software accessed through it must comply with all applicable export control laws and regulations, including the UK Export Control Order 2008, EU Dual-Use Regulation (2021/821), and US Export Administration Regulations (EAR)</li>
              <li>You are solely responsible for determining whether any export licence or authorisation is required for your use of TapTrao's outputs in connection with your trade activities</li>
              <li>You will not use TapTrao to facilitate the export, re-export, or transfer of controlled goods, technology, or services to any prohibited destination or end user without the required authorisation</li>
            </ul>
            <p className="mt-3">TapTrao does not provide export classification advice. Nothing in TapTrao's outputs constitutes an export determination or licence. You must obtain independent qualified advice for export control matters.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">14. Governing Law</h2>
            <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. If you are based in Canada, you acknowledge that these Terms and any disputes remain subject to English law unless otherwise required by mandatory provisions of Canadian law. Nothing in these Terms limits any mandatory consumer rights you may have under your local law.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">15. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">16. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:hello@taptrao.com" className="text-primary hover:underline">hello@taptrao.com</a></p>
            <p className="mt-2 text-muted-foreground text-sm">Fatrao Limited — Registered in England and Wales</p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
