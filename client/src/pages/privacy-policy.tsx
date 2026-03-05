import { Link } from "wouter";
import { Trans, useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PrivacyPolicy() {
  const { t } = useTranslation("legal");
  usePageTitle("Privacy Policy", "TapTrao Privacy Policy — how we collect, use, and protect your data.");

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "var(--fb)", WebkitFontSmoothing: "antialiased" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <img src="/logo.png?v=2" alt="TapTrao" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--fh)", fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.95)" }}>TapTrao</span>
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, cursor: "pointer" }}>{t("nav.dashboard")}</span>
          </Link>
          <Link href="/">
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, cursor: "pointer" }}>{t("nav.home")}</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }} data-testid="page-privacy-policy">
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }} data-testid="text-privacy-title">
          {t("privacy.title")}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>{t("privacy.lastUpdated")}</p>

        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7 }}>

          <Section title={t("privacy.s1.title")}>
            <p dangerouslySetInnerHTML={{ __html: t("privacy.s1.p1") }} />
            <p style={{ marginTop: 12 }}>
              {t("privacy.s1.address")}<br />
              {t("privacy.s1.addressLine1")}<br />
              {t("privacy.s1.addressLine2")}<br />
              {t("privacy.s1.addressLine3")}<br />
              {t("privacy.s1.addressLine4")}<br />
              {t("privacy.s1.addressLine5")}
            </p>
            <p style={{ marginTop: 12 }}>{t("privacy.s1.director")}</p>
            <p style={{ marginTop: 12 }}>{t("privacy.s1.gdprNote")}</p>
            <p style={{ marginTop: 12 }}>
              {t("privacy.s1.contactEmail")} <a href="mailto:Legal@taptrao.com" style={linkStyle}>Legal@taptrao.com</a>
            </p>
          </Section>

          <Section title={t("privacy.s2.title")}>
            <p style={{ marginBottom: 8 }}>{t("privacy.s2.intro")}</p>
            <ul style={ulStyle}>
              <li>{t("privacy.s2.item1")}</li>
              <li>{t("privacy.s2.item2")}</li>
              <li>{t("privacy.s2.item3")}</li>
              <li>{t("privacy.s2.item4")}</li>
              <li>{t("privacy.s2.item5")}</li>
            </ul>
          </Section>

          <Section title={t("privacy.s3.title")}>
            <h3 style={h3Style}>{t("privacy.s3.sub1.title")}</h3>
            <ul style={ulStyle}>
              <li>{t("privacy.s3.sub1.item1")}</li>
              <li>{t("privacy.s3.sub1.item2")}</li>
              <li>{t("privacy.s3.sub1.item3")}</li>
            </ul>

            <h3 style={h3Style}>{t("privacy.s3.sub2.title")}</h3>
            <ul style={ulStyle}>
              <li>{t("privacy.s3.sub2.item1")}</li>
              <li>{t("privacy.s3.sub2.item2")}</li>
            </ul>

            <h3 style={h3Style}>{t("privacy.s3.sub3.title")}</h3>
            <ul style={ulStyle}>
              <li>{t("privacy.s3.sub3.item1")}</li>
              <li>{t("privacy.s3.sub3.item2")}</li>
              <li>{t("privacy.s3.sub3.item3")}</li>
              <li>{t("privacy.s3.sub3.item4")}</li>
            </ul>

            <h3 style={h3Style}>{t("privacy.s3.sub4.title")}</h3>
            <p>{t("privacy.s3.sub4.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s3.sub5.title")}</h3>
            <p>{t("privacy.s3.sub5.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s3.sub6.title")}</h3>
            <ul style={ulStyle}>
              <li>{t("privacy.s3.sub6.item1")}</li>
              <li>{t("privacy.s3.sub6.item2")}</li>
              <li>{t("privacy.s3.sub6.item3")}</li>
              <li>{t("privacy.s3.sub6.item4")}</li>
            </ul>

            <h3 style={h3Style}>{t("privacy.s3.sub7.title")}</h3>
            <p>
              <Trans i18nKey="privacy.s3.sub7.p1" ns="legal" components={[<a href="mailto:Legal@taptrao.com" style={linkStyle} key="0" />]} />
            </p>
          </Section>

          <Section title={t("privacy.s4.title")}>
            <ul style={ulStyle}>
              <li>{t("privacy.s4.item1")}</li>
              <li>{t("privacy.s4.item2")}</li>
              <li>{t("privacy.s4.item3")}</li>
              <li>{t("privacy.s4.item4")}</li>
              <li>{t("privacy.s4.item5")}</li>
              <li>{t("privacy.s4.item6")}</li>
              <li>{t("privacy.s4.item7")}</li>
              <li>{t("privacy.s4.item8")}</li>
              <li>{t("privacy.s4.item9")}</li>
            </ul>
            <p style={{ marginTop: 12 }}>{t("privacy.s4.noSell")}</p>
          </Section>

          <Section title={t("privacy.s5.title")}>
            <h3 style={h3Style}>{t("privacy.s5.sub1.title")}</h3>
            <p>{t("privacy.s5.sub1.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s5.sub2.title")}</h3>
            <p>{t("privacy.s5.sub2.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s5.sub3.title")}</h3>
            <p>{t("privacy.s5.sub3.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s5.sub4.title")}</h3>
            <p>
              <Trans i18nKey="privacy.s5.sub4.p1" ns="legal" components={[<a href="mailto:Legal@taptrao.com" style={linkStyle} key="0" />]} />
            </p>
          </Section>

          <Section title={t("privacy.s6.title")}>
            <h3 style={h3Style}>{t("privacy.s6.sub1.title")}</h3>
            <p>{t("privacy.s6.sub1.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s6.sub2.title")}</h3>
            <p>{t("privacy.s6.sub2.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s6.sub3.title")}</h3>
            <p>{t("privacy.s6.sub3.p1")}</p>
          </Section>

          <Section title={t("privacy.s7.title")}>
            <ul style={ulStyle}>
              <li dangerouslySetInnerHTML={{ __html: t("privacy.s7.item1") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.s7.item2") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.s7.item3") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.s7.item4") }} />
              <li dangerouslySetInnerHTML={{ __html: t("privacy.s7.item5") }} />
            </ul>
          </Section>

          <Section title={t("privacy.s8.title")}>
            <p>{t("privacy.s8.p1")}</p>
            <p style={{ marginTop: 12 }}>
              <Trans i18nKey="privacy.s8.p2" ns="legal" components={[<a href="mailto:Legal@taptrao.com" style={linkStyle} key="0" />]} />
            </p>
          </Section>

          <Section title={t("privacy.s9.title")}>
            <p style={{ marginBottom: 8 }}>{t("privacy.s9.intro")}</p>
            <ul style={ulStyle}>
              <li>{t("privacy.s9.item1")}</li>
              <li>{t("privacy.s9.item2")}</li>
              <li>{t("privacy.s9.item3")}</li>
              <li>{t("privacy.s9.item4")}</li>
              <li>{t("privacy.s9.item5")}</li>
            </ul>
            <p style={{ marginTop: 12 }}>{t("privacy.s9.outro")}</p>
          </Section>

          <Section title={t("privacy.s10.title")}>
            <p>{t("privacy.s10.p1")}</p>
          </Section>

          <Section title={t("privacy.s11.title")}>
            <p>{t("privacy.s11.p1")}</p>
            <p style={{ marginTop: 12 }}>
              <Trans i18nKey="privacy.s11.p2" ns="legal" components={[<a href="mailto:Legal@taptrao.com" style={linkStyle} key="0" />]} />
            </p>
            <p style={{ marginTop: 12 }}>{t("privacy.s11.p3")}</p>
          </Section>

          <Section title={t("privacy.s12.title")}>
            <h3 style={h3Style}>{t("privacy.s12.sub1.title")}</h3>
            <p>{t("privacy.s12.sub1.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s12.sub2.title")}</h3>
            <p>{t("privacy.s12.sub2.p1")}</p>

            <h3 style={h3Style}>{t("privacy.s12.sub3.title")}</h3>
            <p>{t("privacy.s12.sub3.p1")}</p>
          </Section>

          <Section title={t("privacy.s13.title")}>
            <p>{t("privacy.s13.p1")}</p>
          </Section>

          <Section title={t("privacy.s14.title")}>
            <p>{t("privacy.s14.p1")}</p>
          </Section>

          <Section title={t("privacy.s15.title")}>
            <p>{t("privacy.s15.p1")}</p>
          </Section>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>
              {t("privacy.footer.company")}
            </p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
              {t("privacy.footer.address")}
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
