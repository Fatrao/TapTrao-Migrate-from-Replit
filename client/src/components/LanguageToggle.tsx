import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div
      className="mi"
      onClick={() => i18n.changeLanguage(isEn ? "fr" : "en")}
      style={{ cursor: "pointer" }}
      data-testid="language-toggle"
    >
      <div className="mi-icon">{isEn ? "🇫🇷" : "🇬🇧"}</div>
      <span className="mi-label">{isEn ? "Français" : "English"}</span>
      <div className="mi-tip">{isEn ? "Français" : "English"}</div>
    </div>
  );
}
