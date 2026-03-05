import { Link } from "wouter";
import { Trans, useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";

export default function TermsOfService() {
  const { t } = useTranslation("legal");
  usePageTitle("Terms of Service", "TapTrao Terms of Service — the rules and conditions for using our platform.");

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

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }} data-testid="page-terms-of-service">
        <h1 style={{ fontFamily: "var(--fh)", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }} data-testid="text-terms-title">
          {t("terms.title")}
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginBottom: 40 }}>{t("terms.lastUpdated")}</p>

        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, lineHeight: 1.7 }}>

          <Section title={t("terms.s1.title")}>
            <p>{t("terms.s1.p1")}</p>
          </Section>

          <Section title={t("terms.s2.title")}>
            <p>{t("terms.s2.p1")}</p>
          </Section>

          <Section title={t("terms.s3.title")}>
            <p style={{ fontWeight: 600, marginBottom: 12 }}>{t("terms.s3.warning")}</p>
            <p style={{ marginBottom: 12 }}>{t("terms.s3.p1")}</p>
            <p style={{ marginBottom: 8 }}>{t("terms.s3.specificIntro")}</p>
            <ul style={ulStyle}>
              <li>{t("terms.s3.item1")}</li>
              <li>{t("terms.s3.item2")}</li>
              <li>{t("terms.s3.item3")}</li>
              <li>{t("terms.s3.item4")}</li>
            </ul>
            <p style={{ marginTop: 12 }}>{t("terms.s3.disclaimer")}</p>
          </Section>

          <Section title={t("terms.s4.title")}>
            <p>{t("terms.s4.p1")}</p>
          </Section>

          <Section title={t("terms.s5.title")}>
            <p>
              <Trans i18nKey="terms.s5.p1" ns="legal" components={[<a href="mailto:hello@taptrao.com" style={linkStyle} key="0" />]} />
            </p>
          </Section>

          <Section title={t("terms.s6.title")}>
            <p style={{ marginBottom: 8 }}>{t("terms.s6.intro")}</p>
            <ul style={ulStyle}>
              <li>{t("terms.s6.item1")}</li>
              <li>{t("terms.s6.item2")}</li>
              <li>{t("terms.s6.item3")}</li>
              <li>{t("terms.s6.item4")}</li>
              <li>{t("terms.s6.item5")}</li>
              <li>{t("terms.s6.item6")}</li>
            </ul>
          </Section>

          <Section title={t("terms.s7.title")}>
            <p>{t("terms.s7.p1")}</p>
          </Section>

          <Section title={t("terms.s8.title")}>
            <p>{t("terms.s8.p1")}</p>
          </Section>

          <Section title={t("terms.s9.title")}>
            <p style={{ marginBottom: 12 }}>{t("terms.s9.p1")}</p>
            <p>{t("terms.s9.p2")}</p>
          </Section>

          <Section title={t("terms.s10.title")}>
            <p>{t("terms.s10.p1")}</p>
          </Section>

          <Section title={t("terms.s11.title")}>
            <p>{t("terms.s11.p1")}</p>
          </Section>

          <Section title={t("terms.s12.title")}>
            <p style={{ marginBottom: 8 }}>{t("terms.s12.intro")}</p>
            <ul style={ulStyle}>
              <li>{t("terms.s12.item1")}</li>
              <li>{t("terms.s12.item2")}</li>
              <li>{t("terms.s12.item3")}</li>
            </ul>
            <p style={{ marginTop: 12 }}>{t("terms.s12.outro")}</p>
          </Section>

          <Section title={t("terms.s13.title")}>
            <p style={{ marginBottom: 8 }}>{t("terms.s13.intro")}</p>
            <ul style={ulStyle}>
              <li>{t("terms.s13.item1")}</li>
              <li>{t("terms.s13.item2")}</li>
              <li>{t("terms.s13.item3")}</li>
            </ul>
            <p style={{ marginTop: 12 }}>{t("terms.s13.outro")}</p>
          </Section>

          <Section title={t("terms.s14.title")}>
            <p>{t("terms.s14.p1")}</p>
          </Section>

          <Section title={t("terms.s15.title")}>
            <p>{t("terms.s15.p1")}</p>
          </Section>

          <Section title={t("terms.s16.title")}>
            <p>
              <Trans i18nKey="terms.s16.p1" ns="legal" components={[<a href="mailto:hello@taptrao.com" style={linkStyle} key="0" />]} />
            </p>
            <p style={{ marginTop: 8, fontSize: 15, color: "rgba(255,255,255,0.6)" }}>{t("terms.s16.footer")}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = { color: "#0e4e45", textDecoration: "underline" };
const ulStyle: React.CSSProperties = { paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 6 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: "var(--fh)", fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}
